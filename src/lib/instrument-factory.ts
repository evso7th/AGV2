// ─────────────────────────────────────────────────────────────────────────────
// MultiInstrument WebAudio: organ | synth | mellotron | guitar
// С адаптивным ADSR и управлением громкостью
// ─────────────────────────────────────────────────────────────────────────────

// ───── Helpers ─────
const loadIR = async (ctx: AudioContext, url: string | null): Promise<AudioBuffer | null> => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        return await ctx.decodeAudioData(buf);
    } catch (error) {
        console.warn(`[InstrumentFactory] Could not load IR from ${url}:`, error);
        return null;
    }
};

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const dB = (x: number) => Math.pow(10, x / 20);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// ───── Distortion Curves ─────
const makeSoftClip = (amount = 0.5, n = 65536) => {
    const c = new Float32Array(n);
    const k = clamp(amount, 0, 1) * 10 + 1;
    const norm = Math.tanh(k);
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(k * x) / norm;
    }
    return c;
};

const makeMuff = (gain = 0.65, n = 65536) => {
    const c = new Float32Array(n);
    const k = 1 + clamp(gain, 0, 1) * 4;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(x * k) * 0.9;
    }
    return c;
};

// ───── Bypassable FX ─────
interface BypassableFX {
    input: GainNode;
    output: GainNode;
    setMix: (mix: number) => void;
}

const makeChorus = (ctx: AudioContext, opts: { rate?: number; depth?: number; mix?: number } = {}): BypassableFX => {
    const { rate = 0.25, depth = 0.006, mix = 0.25 } = opts;
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();

    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    const delay = ctx.createDelay(0.05);
    delay.delayTime.value = 0.02;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    lfoGain.gain.value = depth;

    input.connect(dry).connect(output);
    input.connect(delay).connect(wet).connect(output);
    lfo.connect(lfoGain).connect(delay.delayTime);
    lfo.start();

    return {
        input, output,
        setMix: (m: number) => {
            const v = clamp(m, 0, 1);
            dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
        }
    };
};

const makeFilteredDelay = (ctx: AudioContext, opts: { time?: number; fb?: number; hc?: number; mix?: number } = {}): BypassableFX => {
    const { time = 0.38, fb = 0.26, hc = 3600, mix = 0.2 } = opts;
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();

    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    const delayL = ctx.createDelay(5.0);
    const delayR = ctx.createDelay(5.0);
    delayL.delayTime.value = time;
    delayR.delayTime.value = time * 1.07;

    const feedback = ctx.createGain();
    feedback.gain.value = fb;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hc;
    filter.Q.value = 0.7;

    const merger = ctx.createChannelMerger(2);

    input.connect(dry).connect(output);
    input.connect(delayL).connect(filter).connect(delayR).connect(feedback).connect(delayL);
    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);
    merger.connect(wet).connect(output);

    return {
        input, output,
        setMix: (m: number) => {
            const v = clamp(m, 0, 1);
            dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
        }
    };
};

const makePhaser = (ctx: AudioContext, opts: any = {}): BypassableFX & { setRate: (r: number) => void; setDepth: (d: number) => void } => {
    const { stages = 4, base = 800, depth = 600, rate = 0.16, fb = 0.12, mix = 0.2 } = opts;
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();

    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    let head: AudioNode = input;
    const aps: BiquadFilterNode[] = [];

    for (let i = 0; i < stages; i++) {
        const ap = ctx.createBiquadFilter();
        ap.type = 'allpass';
        ap.frequency.value = base * ((i % 2) ? 1.2 : 0.8);
        ap.Q.value = 0.6;
        head.connect(ap);
        head = ap;
        aps.push(ap);
    }

    if (aps.length > 0) {
        const fbG = ctx.createGain();
        fbG.gain.value = fb;
        aps[aps.length - 1].connect(fbG);
        fbG.connect(aps[0]);
    }

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    const lfoG = ctx.createGain();
    lfoG.gain.value = depth;
    lfo.connect(lfoG);
    aps.forEach(ap => lfoG.connect(ap.frequency));
    lfo.start();

    input.connect(dry).connect(output);
    if (aps.length > 0) {
        aps[aps.length - 1].connect(wet);
    } else {
        input.connect(wet);
    }
    wet.connect(output);

    return {
        input, output,
        setMix: (m: number) => {
            const v = clamp(m, 0, 1);
            dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
        },
        setRate: (r: number) => { lfo.frequency.value = r; },
        setDepth: (d: number) => { lfoG.gain.value = d; }
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// АДАПТИВНЫЙ ADSR КОНТРОЛЛЕР
// ═══════════════════════════════════════════════════════════════════════════

interface ADSRParams {
    a: number;  // Attack time
    d: number;  // Decay time
    s: number;  // Sustain level (0-1)
    r: number;  // Release time
}

interface VoiceState {
    gain: GainNode;
    startTime: number;
    phase: 'attack' | 'decay' | 'sustain' | 'release';
    targetPeak: number;
    nodes: AudioNode[];  // для cleanup
}

/**
 * Адаптивный ADSR — гарантирует плавную огибающую даже для коротких нот
 */
class AdaptiveADSR {
    private ctx: AudioContext;
    private defaultParams: ADSRParams = { a: 0.01, d: 0.1, s: 0.8, r: 0.3 };
    
    // Минимальные значения для предотвращения "щелчков"
    private readonly MIN_ATTACK = 0.003;
    private readonly MIN_RELEASE = 0.02;
    private readonly MIN_NOTE_DURATION = 0.05; // 50ms минимум

    constructor(ctx: AudioContext) {
        this.ctx = ctx;
    }

    /**
     * Запускает Attack-Decay-Sustain фазу
     */
    triggerAttack(
        gainNode: GainNode, 
        when: number, 
        adsr: Partial<ADSRParams> = {},
        velocity: number = 1.0
    ): VoiceState {
        const params = { ...this.defaultParams, ...adsr };
        const a = Math.max(params.a, this.MIN_ATTACK);
        const d = Math.max(params.d, 0.01);
        const s = clamp(params.s * velocity, 0, 1);
        const peak = velocity;

        const now = this.ctx.currentTime;
        const startTime = Math.max(when, now);

        gainNode.gain.cancelScheduledValues(startTime);
        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(peak, startTime + a);
        gainNode.gain.setTargetAtTime(s, startTime + a, d / 3);

        return {
            gain: gainNode,
            startTime,
            phase: 'attack',
            targetPeak: peak,
            nodes: []
        };
    }

    /**
     * Умный Release — адаптируется к текущей фазе огибающей
     */
    triggerRelease(
        voice: VoiceState,
        when: number,
        adsr: Partial<ADSRParams> = {}
    ): number {
        const params = { ...this.defaultParams, ...adsr };
        const r = Math.max(params.r, this.MIN_RELEASE);
        
        const now = this.ctx.currentTime;
        const releaseTime = Math.max(when, now);
        const elapsed = releaseTime - voice.startTime;
        
        const gainNode = voice.gain;
        
        // Вычисляем, в какой фазе мы находимся
        const attackEnd = params.a;
        const decayEnd = params.a + params.d;
        
        gainNode.gain.cancelScheduledValues(releaseTime);
        
        if (elapsed < attackEnd) {
            // ─── Мы всё ещё в Attack ───
            // Проблема: gain ещё низкий, резкий release = щелчок
            // Решение: сначала быстро поднять до разумного уровня, потом release
            
            const currentApproxGain = (elapsed / attackEnd) * voice.targetPeak;
            const quickAttackTime = Math.min(0.03, (attackEnd - elapsed) * 0.5);
            const peakGain = Math.max(currentApproxGain + 0.1, params.s * 0.5);
            
            gainNode.gain.setValueAtTime(currentApproxGain, releaseTime);
            gainNode.gain.linearRampToValueAtTime(peakGain, releaseTime + quickAttackTime);
            gainNode.gain.setTargetAtTime(0.0001, releaseTime + quickAttackTime, r / 3);
            
            return releaseTime + quickAttackTime + r;
            
        } else if (elapsed < decayEnd) {
            // ─── Мы в Decay ───
            // Gain падает от peak к sustain
            const decayProgress = (elapsed - attackEnd) / params.d;
            const currentApproxGain = voice.targetPeak - (voice.targetPeak - params.s) * decayProgress;
            
            gainNode.gain.setValueAtTime(currentApproxGain, releaseTime);
            gainNode.gain.setTargetAtTime(0.0001, releaseTime, r / 3);
            
            return releaseTime + r;
            
        } else {
            // ─── Мы в Sustain ───
            // Нормальный release
            gainNode.gain.setValueAtTime(params.s, releaseTime);
            gainNode.gain.setTargetAtTime(0.0001, releaseTime, r / 4);
            
            return releaseTime + r;
        }
    }
    
    /**
     * Форсированный release для allNotesOff
     */
    forceRelease(voice: VoiceState, releaseTime: number = 0.1): number {
        const now = this.ctx.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        voice.gain.gain.setTargetAtTime(0.0001, now, releaseTime / 4);
        return now + releaseTime;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VOLUME MANAGER
// ═══════════════════════════════════════════════════════════════════════════

interface VolumeConfig {
    base: number;       // Базовая громкость инструмента (0-1)
    genre?: number;     // Модификатор по жанру
    mood?: number;      // Модификатор по настроению
    expression?: number; // Динамическая экспрессия
}

const DEFAULT_VOLUMES: Record<string, number> = {
    synth: 0.7,
    guitar: 0.75,
    organ: 0.65,
    mellotron: 0.7,
    // По пресетам
    synth_ambient_pad_lush: 0.6,
    synth_cave_pad: 0.55,
    theremin: 0.65,
    mellotron_flute_intimate: 0.7,
    mellotron_choir: 0.6,
    ep_rhodes_warm: 0.72,
    ep_rhodes_70s: 0.72,
    synth_lead_shineOn: 0.75,
    synth_lead_distorted: 0.65,
    guitar_shineOn: 0.7,
    guitar_muffLead: 0.65,
    guitar_clean_chorus: 0.72,
    organ_soft_jazz: 0.6
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FACTORY
// ═══════════════════════════════════════════════════════════════════════════

export interface InstrumentAPI {
    connect: (dest?: AudioNode) => void;
    disconnect: () => void;
    noteOn: (midi: number, when?: number, velocity?: number) => void;
    noteOff: (midi: number, when?: number) => void;
    allNotesOff: () => void;
    setPreset: (p: any) => void;
    setParam: (k: string, v: any) => void;
    // ─── Новые методы для громкости ───
    setVolume: (level: number) => void;
    getVolume: () => number;
    setVolumeDb: (db: number) => void;
    setExpression: (level: number) => void;
    // ─── State ───
    preset: any;
    type: string;
}

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    cabinetIRUrl = null as string | null,
    plateIRUrl = null as string | null,
    mellotronMap = null as any,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    
    console.log(`%c[InstrumentFactory] Building: ${type}`, 'color: #FFA500; font-weight: bold;');

    // ───── ADSR Controller ─────
    const adsrController = new AdaptiveADSR(ctx);

    // ───── Master Section с управлением громкостью ─────
    const master = ctx.createGain();
    master.gain.value = 0.8;

    // Instrument Volume (управляется через API)
    const instrumentGain = ctx.createGain();
    const presetName = preset.name || type;
    const baseVolume = preset.volume ?? DEFAULT_VOLUMES[presetName] ?? DEFAULT_VOLUMES[type] ?? 0.7;
    instrumentGain.gain.value = baseVolume;

    // Expression (для динамики в реальном времени)
    const expressionGain = ctx.createGain();
    expressionGain.gain.value = 1.0;

    // Reverb
    const reverb = ctx.createConvolver();
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.18;

    if (plateIRUrl) {
        loadIR(ctx, plateIRUrl).then(buf => {
            if (buf) reverb.buffer = buf;
        });
    }
    reverb.connect(reverbWet);
    reverbWet.connect(master);

    // ───── API ─────
    const api: InstrumentAPI = {
        connect: (dest?: AudioNode) => master.connect(dest || output),
        disconnect: () => { try { master.disconnect(); } catch {} },
        noteOn: () => {},
        noteOff: () => {},
        allNotesOff: () => {},
        setPreset: () => {},
        setParam: () => {},
        
        // ─── Volume Control ───
        setVolume: (level: number) => {
            const v = clamp(level, 0, 1);
            instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
        },
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db: number) => {
            const linear = dB(clamp(db, -60, 12));
            instrumentGain.gain.setTargetAtTime(linear, ctx.currentTime, 0.02);
        },
        setExpression: (level: number) => {
            const v = clamp(level, 0, 1);
            expressionGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01);
        },
        
        preset: preset,
        type: type
    };

    // ══════════════════════════════════════════════════════════════════════════
    // SYNTH
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'synth') {
        let currentPreset = { ...preset };

        // ─── Static Graph ───
        const compNode = ctx.createDynamicsCompressor();
        const compMakeup = ctx.createGain();

        const filt1 = ctx.createBiquadFilter(); filt1.type = 'lowpass';
        const filt2 = ctx.createBiquadFilter(); filt2.type = 'lowpass';
        const filt2Bypass = ctx.createGain();
        const filt2Wet = ctx.createGain();
        const filt2Merge = ctx.createGain();

        const chorus = makeChorus(ctx, currentPreset.chorus || {});
        const delay = makeFilteredDelay(ctx, currentPreset.delay || {});

        const finalChain = ctx.createGain();
        const revSend = ctx.createGain();

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.start();

        // ─── Routing ───
        compNode.connect(compMakeup).connect(filt1);
        filt1.connect(filt2).connect(filt2Wet).connect(filt2Merge);
        filt1.connect(filt2Bypass).connect(filt2Merge);
        filt2Merge.connect(chorus.input);
        chorus.output.connect(delay.input);
        delay.output.connect(finalChain);
        
        // Volume chain: finalChain -> expressionGain -> instrumentGain -> master
        finalChain.connect(expressionGain);
        expressionGain.connect(instrumentGain);
        instrumentGain.connect(master);
        
        finalChain.connect(revSend);
        revSend.connect(reverb);

        lfo.connect(lfoGain);

        // ─── State ───
        const activeVoices = new Map<number, VoiceState & { 
            oscs: { x: OscillatorNode; g: GainNode }[]; 
            noise: { n: AudioBufferSourceNode; ng: GainNode } | null 
        }>();
        let noiseBuffer: AudioBuffer | null = null;

        const getOscConfig = (p: any) => {
            if (p.osc && p.osc.length > 0) return p.osc;
            return [{ type: 'sawtooth', gain: 0.5, octave: 0, detune: 0 }];
        };

        const updateNodesFromPreset = (p: any) => {
            // Compressor
            compNode.threshold.value = p.comp?.threshold ?? -18;
            compNode.knee.value = p.comp?.knee ?? 10;
            compNode.ratio.value = p.comp?.ratio ?? 4;
            compNode.attack.value = p.comp?.attack ?? 0.003;
            compNode.release.value = p.comp?.release ?? 0.15;
            compMakeup.gain.value = dB(p.comp?.makeup ?? 6);

            // Filter
            const cutoff = p.lpf?.cutoff ?? 3000;
            const q = p.lpf?.q ?? 1;
            const is24dB = (p.lpf?.mode === '24dB');

            filt1.frequency.value = cutoff;
            filt1.Q.value = q;
            filt2.frequency.value = cutoff;
            filt2.Q.value = q;

            filt2Wet.gain.value = is24dB ? 1 : 0;
            filt2Bypass.gain.value = is24dB ? 0 : 1;

            // LFO
            lfo.type = (p.lfo?.shape as OscillatorType) || 'sine';
            lfo.frequency.value = p.lfo?.rate ?? 0;
            lfoGain.gain.value = p.lfo?.amount ?? 0;

            try { lfoGain.disconnect(); } catch {}
            if (lfoGain.gain.value > 0 && p.lfo?.target === 'filter') {
                lfoGain.connect(filt1.frequency);
                if (is24dB) lfoGain.connect(filt2.frequency);
            }

            // FX bypass
            chorus.setMix(p.chorus?.on ? (p.chorus.mix ?? 0.25) : 0);
            delay.setMix(p.delay?.on ? (p.delay.mix ?? 0.2) : 0);

            // Reverb
            revSend.gain.value = p.reverbMix ?? 0.18;

            // Volume
            if (p.volume !== undefined) {
                instrumentGain.gain.value = p.volume;
            }

            // Noise
            if (p.noise?.on) {
                noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
                const d = noiseBuffer.getChannelData(0);
                for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
            } else {
                noiseBuffer = null;
            }
        };

        updateNodesFromPreset(currentPreset);

        // ─── API ───
        api.noteOn = (midi, when = ctx.currentTime, velocity = 1.0) => {
            const f = midiToHz(midi);
            const vel = clamp(velocity, 0, 1);

            const vGain = ctx.createGain();
            vGain.gain.value = 0.0;
            vGain.connect(compNode);

            const oscConfig = getOscConfig(currentPreset);
            const oscs = oscConfig.map((o: any) => {
                const x = ctx.createOscillator();
                x.type = (o.type as OscillatorType) || 'sawtooth';
                const detuneFactor = Math.pow(2, (o.detune || 0) / 1200);
                const octaveFactor = Math.pow(2, o.octave || 0);
                x.frequency.setValueAtTime(f * detuneFactor * octaveFactor, when);

                const g = ctx.createGain();
                g.gain.value = (o.gain ?? 0.5) * vel;
                x.connect(g).connect(vGain);
                x.start(when);
                return { x, g };
            });

            let noiseNode: { n: AudioBufferSourceNode; ng: GainNode } | null = null;
            if (currentPreset.noise?.on && noiseBuffer) {
                const n = ctx.createBufferSource();
                n.buffer = noiseBuffer;
                n.loop = true;
                const ng = ctx.createGain();
                ng.gain.value = (currentPreset.noise.gain ?? 0.1) * vel;
                n.connect(ng).connect(vGain);
                n.start(when);
                noiseNode = { n, ng };
            }

            // Адаптивный ADSR
            const adsr = currentPreset.adsr || { a: 0.01, d: 0.1, s: 0.8, r: 0.3 };
            const voiceState = adsrController.triggerAttack(vGain, when, adsr, vel);

            activeVoices.set(midi, { ...voiceState, oscs, noise: noiseNode });
        };

        api.noteOff = (midi, when = ctx.currentTime) => {
            const voice = activeVoices.get(midi);
            if (!voice) return;

            const adsr = currentPreset.adsr || { a: 0.01, d: 0.1, s: 0.8, r: 0.3 };
            const stopTime = adsrController.triggerRelease(voice, when, adsr);

            voice.oscs.forEach(({ x }) => x.stop(stopTime + 0.1));
            if (voice.noise) voice.noise.n.stop(stopTime + 0.1);

            activeVoices.delete(midi);
        };

        api.allNotesOff = () => {
            activeVoices.forEach((voice, midi) => {
                const stopTime = adsrController.forceRelease(voice, 0.15);
                voice.oscs.forEach(({ x }) => x.stop(stopTime + 0.1));
                if (voice.noise) voice.noise.n.stop(stopTime + 0.1);
            });
            activeVoices.clear();
        };

        api.setPreset = (p) => {
            api.allNotesOff();
            currentPreset = { ...p };
            api.preset = currentPreset;
            updateNodesFromPreset(currentPreset);
        };

        api.setParam = (k, v) => {
            if (k === 'volume') api.setVolume(v);
            if (k === 'expression') api.setExpression(v);
            if (k === 'reverbMix') revSend.gain.value = v;
            if (k === 'filterCutoff') {
                filt1.frequency.setTargetAtTime(v, ctx.currentTime, 0.02);
                filt2.frequency.setTargetAtTime(v, ctx.currentTime, 0.02);
            }
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GUITAR
    // ══════════════════════════════════════════════════════════════════════════
    else if (type === 'guitar') {
        let currentPreset = { ...preset };

        // ─── Static Graph ───
        const guitarInput = ctx.createGain();
        const pickupLPF = ctx.createBiquadFilter(); pickupLPF.type = 'lowpass';
        const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 90;
        const compNode = ctx.createDynamicsCompressor();
        const compMakeup = ctx.createGain();
        const shaper = ctx.createWaveShaper(); shaper.oversample = '4x';
        const postHPF = ctx.createBiquadFilter(); postHPF.type = 'highpass'; postHPF.frequency.value = 80;
        const mid1 = ctx.createBiquadFilter(); mid1.type = 'peaking';
        const mid2 = ctx.createBiquadFilter(); mid2.type = 'peaking';
        const postLPF = ctx.createBiquadFilter(); postLPF.type = 'lowpass';

        const cab = ctx.createConvolver();
        const cabWet = ctx.createGain(); cabWet.gain.value = 0;
        const cabDry = ctx.createGain(); cabDry.gain.value = 1;
        const cabMerge = ctx.createGain();

        const phaser = makePhaser(ctx, currentPreset.phaser || {});
        const delayA = makeFilteredDelay(ctx, currentPreset.delayA || {});
        const delayB = makeFilteredDelay(ctx, currentPreset.delayB || {});

        const guitarOut = ctx.createGain();
        const revSend = ctx.createGain();

        // ─── Routing ───
        guitarInput.connect(pickupLPF).connect(hpf).connect(compNode).connect(compMakeup)
            .connect(shaper).connect(postHPF).connect(mid1).connect(mid2).connect(postLPF);

        postLPF.connect(cab).connect(cabWet).connect(cabMerge);
        postLPF.connect(cabDry).connect(cabMerge);

        cabMerge.connect(phaser.input);
        phaser.output.connect(delayA.input);
        delayA.output.connect(delayB.input);
        delayB.output.connect(guitarOut);

        // Volume chain
        guitarOut.connect(expressionGain);
        expressionGain.connect(instrumentGain);
        instrumentGain.connect(master);
        
        guitarOut.connect(revSend);
        revSend.connect(reverb);

        // Cabinet IR
        if (cabinetIRUrl) {
            loadIR(ctx, cabinetIRUrl).then(buf => {
                if (buf) {
                    cab.buffer = buf;
                    cabWet.gain.value = 1;
                    cabDry.gain.value = 0;
                }
            });
        }

        // ─── State ───
        const activeVoices = new Map<number, VoiceState & { 
            oscMain: OscillatorNode; oscDet: OscillatorNode; oscSub: OscillatorNode 
        }>();

        const createPulseOsc = (freq: number, width = 0.5) => {
            const w = clamp(width, 0.1, 0.9);
            const real = new Float32Array(32);
            const imag = new Float32Array(32);
            for (let n = 1; n < 32; n++) {
                real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * w);
            }
            const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
            const osc = ctx.createOscillator();
            osc.setPeriodicWave(wave);
            osc.frequency.value = freq;
            return osc;
        };

        const updateGuitarNodes = (p: any) => {
            pickupLPF.frequency.value = p.pickup?.cutoff ?? 3600;
            pickupLPF.Q.value = p.pickup?.q ?? 1;

            compNode.threshold.value = p.comp?.threshold ?? -18;
            compNode.ratio.value = p.comp?.ratio ?? 3;
            compNode.attack.value = p.comp?.attack ?? 0.01;
            compNode.release.value = p.comp?.release ?? 0.12;
            compMakeup.gain.value = dB(p.comp?.makeup ?? 3);

            const driveType = p.drive?.type ?? 'soft';
            const driveAmount = p.drive?.amount ?? 0.3;
            shaper.curve = driveType === 'muff' ? makeMuff(driveAmount) : makeSoftClip(driveAmount);

            mid1.frequency.value = p.post?.mids?.[0]?.f ?? 850;
            mid1.Q.value = p.post?.mids?.[0]?.q ?? 0.9;
            mid1.gain.value = p.post?.mids?.[0]?.g ?? 2;
            mid2.frequency.value = p.post?.mids?.[1]?.f ?? 2500;
            mid2.Q.value = p.post?.mids?.[1]?.q ?? 1.4;
            mid2.gain.value = p.post?.mids?.[1]?.g ?? -1.5;
            postLPF.frequency.value = p.post?.lpf ?? 5200;

            phaser.setMix(p.phaser?.on !== false ? (p.phaser?.mix ?? 0.2) : 0);
            if (p.phaser) {
                phaser.setRate(p.phaser.rate ?? 0.16);
                phaser.setDepth(p.phaser.depth ?? 600);
            }

            delayA.setMix(p.delayA?.on !== false ? (p.delayA?.mix ?? 0.2) : 0);
            delayB.setMix(p.delayB?.on ? (p.delayB?.mix ?? 0.15) : 0);

            revSend.gain.value = p.reverbMix ?? 0.18;

            if (p.volume !== undefined) {
                instrumentGain.gain.value = p.volume;
            }
        };

        updateGuitarNodes(currentPreset);

        // ─── API ───
        api.noteOn = (midi, when = ctx.currentTime, velocity = 1.0) => {
            const f = midiToHz(midi);
            const vel = clamp(velocity, 0, 1);
            const oscP = currentPreset.osc ?? {};

            const vGain = ctx.createGain();
            vGain.gain.value = 0.0;

            const sum = ctx.createGain();
            sum.gain.value = 0.8 * vel;

            const oscMain = createPulseOsc(f, oscP.width ?? 0.46);
            const oscDet = createPulseOsc(f, (oscP.width ?? 0.46) + 0.06);
            oscDet.detune.value = oscP.detune ?? 5;
            const oscSub = ctx.createOscillator();
            oscSub.type = 'sine';
            oscSub.frequency.value = f / 2;

            const gMain = ctx.createGain(); gMain.gain.value = oscP.mainGain ?? 0.85;
            const gDet = ctx.createGain(); gDet.gain.value = oscP.detGain ?? 0.18;
            const gSub = ctx.createGain(); gSub.gain.value = oscP.subGain ?? 0.25;

            oscMain.connect(gMain).connect(sum);
            oscDet.connect(gDet).connect(sum);
            oscSub.connect(gSub).connect(sum);
            sum.connect(vGain);
            vGain.connect(guitarInput);

            oscMain.start(when);
            oscDet.start(when);
            oscSub.start(when);

            const adsr = currentPreset.adsr ?? { a: 0.006, d: 0.35, s: 0.6, r: 1.6 };
            const voiceState = adsrController.triggerAttack(vGain, when, adsr, vel);

            activeVoices.set(midi, { ...voiceState, oscMain, oscDet, oscSub });
        };

        api.noteOff = (midi, when = ctx.currentTime) => {
            const voice = activeVoices.get(midi);
            if (!voice) return;

            const adsr = currentPreset.adsr ?? { a: 0.006, d: 0.35, s: 0.6, r: 1.6 };
            const stopTime = adsrController.triggerRelease(voice, when, adsr);

            voice.oscMain.stop(stopTime + 0.1);
            voice.oscDet.stop(stopTime + 0.1);
            voice.oscSub.stop(stopTime + 0.1);

            activeVoices.delete(midi);
        };

        api.allNotesOff = () => {
            activeVoices.forEach((voice) => {
                const stopTime = adsrController.forceRelease(voice, 0.15);
                voice.oscMain.stop(stopTime + 0.1);
                voice.oscDet.stop(stopTime + 0.1);
                voice.oscSub.stop(stopTime + 0.1);
            });
            activeVoices.clear();
        };

        api.setPreset = (p) => {
            api.allNotesOff();
            currentPreset = { ...p };
            api.preset = currentPreset;
            updateGuitarNodes(currentPreset);
        };

        api.setParam = (k, v) => {
            if (k === 'volume') api.setVolume(v);
            if (k === 'expression') api.setExpression(v);
            if (k === 'drive') {
                const type = currentPreset.drive?.type ?? 'soft';
                shaper.curve = type === 'muff' ? makeMuff(v) : makeSoftClip(v);
            }
        };
    }

    // ───── Final Connection ─────
    master.connect(output);

    console.log(`%c[InstrumentFactory] Build COMPLETED: ${type}`, 'color: #32CD32; font-weight: bold;');
    return api;
}