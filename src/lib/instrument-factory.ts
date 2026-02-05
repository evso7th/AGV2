/**
 * #ЗАЧЕМ: Центральная фабрика инструментов V3.0 — "Steel Foundation".
 * #ЧТО: Реализует архитектуру тотальной изоляции и глобального контроля ресурсов:
 *       1. Global Voice Registry: единый учет всех активных нот в системе.
 *       2. Passive Cleanup: очистка только через нативные события Audio API, без таймеров.
 *       3. True Voice Stealing: принудительная ротация при достижении лимита в 100 голосов.
 *       4. Static LFO Management: устранение утечек через постоянные управляющие узлы.
 * #ИСПРАВЛЕНО: Добавлены проверки на конечность значений (isFinite) для предотвращения ошибок AudioParam.
 */

// ───── GLOBAL REGISTRY & LIMITS ─────

let globalActiveVoices: any[] = [];
const GLOBAL_VOICE_LIMIT = 100;

/**
 * #ЗАЧЕМ: Глобальная очистка голоса.
 * #ЧТО: Разрывает связи всех узлов и удаляет голос из реестра.
 */
const deepCleanup = (voiceRecord: any) => {
    if (!voiceRecord || voiceRecord.cleaned) return;
    voiceRecord.cleaned = true;
    
    if (voiceRecord.nodes) {
        voiceRecord.nodes.forEach((n: any) => {
            try {
                if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
                    n.stop();
                    n.onended = null;
                }
                n.disconnect();
            } catch (e) {}
        });
    }
    
    globalActiveVoices = globalActiveVoices.filter(v => v !== voiceRecord);
};

/**
 * #ЗАЧЕМ: Принудительная ротация голосов.
 * #ЧТО: Если лимит превышен, убивает самый старый голос.
 */
const enforceVoiceLimit = () => {
    while (globalActiveVoices.length > GLOBAL_VOICE_LIMIT) {
        const oldest = globalActiveVoices.shift();
        if (oldest) deepCleanup(oldest);
    }
};

// ───── HELPERS ─────

const midiToHz = (m: number) => {
    if (!isFinite(m)) return 440;
    return 440 * Math.pow(2, (m - 69) / 12);
};
const dB = (x: number) => isFinite(x) ? Math.pow(10, x / 20) : 1;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const loadIR = async (ctx: AudioContext, url: string | null): Promise<AudioBuffer | null> => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        return await ctx.decodeAudioData(buf);
    } catch {
        console.warn(`[Factory] Could not load IR: ${url}`);
        return null;
    }
};

// ───── DISTORTION CURVES ─────

const makeSoftClip = (amount = 0.5, n = 8192) => {
    const c = new Float32Array(n);
    const k = clamp(amount, 0, 1) * 10 + 1;
    const norm = Math.tanh(k);
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(k * x) / norm;
    }
    return c;
};

const makeMuff = (gain = 0.65, n = 8192) => {
    const c = new Float32Array(n);
    const k = 1 + clamp(gain, 0, 1) * 4;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(x * k) * 0.9;
    }
    return c;
};

const makeVintageDistortion = (k = 50, n = 8192) => {
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        const num = (3 + k) * Math.atan(Math.sinh(x * 0.25) * 5);
        const den = Math.PI + k * Math.abs(x);
        curve[i] = num / den;
    }
    return curve;
};

// ───── SIMPLE FX FACTORIES ─────

interface SimpleFX {
    input: GainNode;
    output: AudioNode;
    setMix: (m: number) => void;
    lfo?: OscillatorNode;
}

const makeChorus = (ctx: AudioContext, mixInput: any = 0.3): SimpleFX => {
    const mix = typeof mixInput === 'number' ? mixInput : (mixInput?.mix ?? 0.3);
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    
    const delay = ctx.createDelay(0.05);
    delay.delayTime.value = 0.015;
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.004;
    lfo.connect(lfoGain).connect(delay.delayTime);
    lfo.start();
    
    input.connect(dry).connect(output);
    input.connect(delay).connect(wet).connect(output);
    
    return {
        input, output, lfo,
        setMix: (m) => {
            const v = clamp(m, 0, 1);
            if (isFinite(v)) {
                wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
                dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            }
        }
    };
};

const makeDelay = (ctx: AudioContext, mixInput: any = 0.2): SimpleFX => {
    const mix = typeof mixInput === 'number' ? mixInput : (mixInput?.mix ?? 0.2);
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    
    const delayNode = ctx.createDelay(2.0);
    delayNode.delayTime.value = 0.35;
    
    const feedback = ctx.createGain();
    feedback.gain.value = 0.25;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;
    
    input.connect(dry).connect(output);
    input.connect(delayNode).connect(filter).connect(feedback).connect(delayNode);
    filter.connect(wet).connect(output);
    
    return {
        input, output,
        setMix: (m) => {
            const v = clamp(m, 0, 1);
            if (isFinite(v)) {
                wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
                dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            }
        }
    };
};

const makePhaser = (ctx: AudioContext, mixInput: any = 0.2): SimpleFX => {
    const mix = typeof mixInput === 'number' ? mixInput : (mixInput?.mix ?? 0.2);
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const filters: BiquadFilterNode[] = [];
    let head: AudioNode = input;
    for (let i = 0; i < 4; i++) {
        const ap = ctx.createBiquadFilter(); ap.type = 'allpass'; ap.frequency.value = 1000;
        head.connect(ap); head = ap; filters.push(ap);
    }
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.16;
    const lfoG = ctx.createGain(); lfoG.gain.value = 600;
    lfo.connect(lfoG); filters.forEach(f => lfoG.connect(f.frequency)); lfo.start();
    input.connect(dry).connect(output);
    filters[3].connect(wet).connect(output);
    return { input, output, lfo, setMix: (m) => {
        const v = clamp(m, 0, 1);
        if (isFinite(v)) {
            wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
        }
    }};
};

// ───── ADSR ─────

interface VoiceState { node: GainNode; startTime: number; }

const triggerAttack = (ctx: AudioContext, gain: GainNode, when: number, a: number, d: number, s: number, velocity = 1): VoiceState => {
    const attack = isFinite(a) ? Math.max(a, 0.003) : 0.01;
    const decay = isFinite(d) ? Math.max(d, 0.01) : 0.1;
    const sustain = isFinite(s) ? clamp(s, 0, 1) * (isFinite(velocity) ? velocity : 1) : 0.7;
    const now = isFinite(when) ? Math.max(when, ctx.currentTime) : ctx.currentTime;
    
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(isFinite(velocity) ? velocity : 1, now + attack);
    gain.gain.setTargetAtTime(sustain, now + attack, Math.max(decay / 3, 0.001));
    return { node: gain, startTime: now };
};

const triggerRelease = (ctx: AudioContext, voiceState: VoiceState, when: number, r: number): number => {
    const release = isFinite(r) ? Math.max(r, 0.02) : 0.1;
    const now = isFinite(when) ? Math.max(when, ctx.currentTime) : ctx.currentTime;
    voiceState.node.gain.cancelScheduledValues(now);
    voiceState.node.gain.setTargetAtTime(0.0001, now, Math.max(release / 3, 0.001));
    return now + release;
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUMENT API
// ═══════════════════════════════════════════════════════════════════════════

export interface InstrumentAPI {
    connect: (dest?: AudioNode) => void;
    disconnect: () => void;
    noteOn: (midi: number, when?: number, velocity?: number, duration?: number) => void;
    noteOff: (midi: number, when?: number) => void;
    allNotesOff: () => void;
    setPreset: (p: any) => void;
    setParam: (k: string, v: any) => void;
    setVolume: (v: number) => void;
    setVolumeDb: (db: number) => void;
    getVolume: () => number;
    setExpression: (v: number) => void;
    preset: any;
    type: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

const buildSynthEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const staticNodes: AudioNode[] = [];
    const activeVoices = new Map<number, any>();

    const comp = ctx.createDynamicsCompressor();
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass';
    const filt2 = ctx.createBiquadFilter(); filt2.type = 'lowpass';
    
    const chorus = makeChorus(ctx, currentPreset.chorus?.on ? (currentPreset.chorus.mix ?? 0.3) : 0);
    const delay = makeDelay(ctx, currentPreset.delay?.on ? (currentPreset.delay.mix ?? 0.2) : 0);
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.18;

    comp.connect(filt);
    const rebuild = (p: any) => {
        try { filt.disconnect(); filt2.disconnect(); } catch(e){}
        if (p.lpf?.mode === '24dB') { filt.connect(filt2); filt2.connect(chorus.input); }
        else { filt.connect(chorus.input); }
    };
    rebuild(currentPreset);
    chorus.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);
    staticNodes.push(comp, filt, filt2, chorus.input, chorus.output, delay.input, delay.output, revSend);
    if (chorus.lfo) staticNodes.push(chorus.lfo);

    return {
        noteOn: (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
            if (!isFinite(midi) || !isFinite(when)) return;
            enforceVoiceLimit();
            const f = midiToHz(midi);
            if (!isFinite(f)) return;

            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(comp);
            const nodes: AudioNode[] = [voiceGain];
            const oscConfigs = currentPreset.osc || [{ type: 'sawtooth', gain: 0.5 }];
            oscConfigs.forEach((o: any) => {
                const osc = ctx.createOscillator(); osc.type = o.type;
                osc.frequency.setValueAtTime(f * Math.pow(2, o.octave || 0), when);
                const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.5) * (isFinite(velocity) ? velocity : 1);
                osc.connect(g).connect(voiceGain); osc.start(when);
                nodes.push(osc, g);
            });
            const adsr = currentPreset.adsr || { a: 0.1, d: 0.2, s: 0.7, r: 1.5 };
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
            const record = { nodes, voiceState, cleaned: false };
            globalActiveVoices.push(record);
            if (duration && isFinite(duration)) {
                const finalTime = triggerRelease(ctx, voiceState, when + duration, adsr.r);
                nodes.forEach(n => { if(n instanceof OscillatorNode) { n.stop(finalTime + 0.1); n.onended = () => deepCleanup(record); } });
            } else { activeVoices.set(midi, record); }
        },
        noteOff: (midi: number, when = ctx.currentTime) => {
            if (!isFinite(midi) || !isFinite(when)) return;
            const v = activeVoices.get(midi); if (!v) return; activeVoices.delete(midi);
            const finalTime = triggerRelease(ctx, v.voiceState, when, currentPreset.adsr?.r || 1.5);
            v.nodes.forEach((n: any) => { if (n instanceof OscillatorNode) { n.stop(finalTime + 0.1); n.onended = () => deepCleanup(v); } });
        },
        allNotesOff: () => { activeVoices.forEach((_, m) => { const v = activeVoices.get(m); if(v) deepCleanup(v); }); activeVoices.clear(); },
        disconnect: () => { staticNodes.forEach(n => { try { if(n instanceof OscillatorNode) n.stop(); n.disconnect(); } catch(e){} }); },
        setPreset: (p: any) => { 
            currentPreset = p; 
            rebuild(p); 
            filt.frequency.value = p.lpf?.cutoff ?? 2000; 
            chorus.setMix(p.chorus?.on ? (p.chorus.mix ?? 0.3) : 0); 
            revSend.gain.value = p.reverbMix ?? 0.18; 
        }
    };
};

const buildOrganEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const activeVoices = new Map<number, any>();
    const organSum = ctx.createGain();
    const leslie = makeChorus(ctx, 0.5);
    const vibLfo = ctx.createOscillator(); vibLfo.frequency.value = 6.2;
    const vibG = ctx.createGain(); vibG.gain.value = 3.5; vibLfo.connect(vibG); vibLfo.start();
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.1;

    organSum.connect(leslie.input);
    leslie.output.connect(expressionGain).connect(instrumentGain).connect(master);
    leslie.output.connect(revSend).connect(reverb);

    const getWave = (drawbars: number[]) => {
        const real = new Float32Array(17), imag = new Float32Array(17);
        const indices = [1, 3, 2, 4, 6, 8, 10, 12, 16];
        drawbars.forEach((v, i) => { if (v > 0) real[indices[i]] = v / 8; });
        return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
    };
    let wave = getWave(currentPreset.drawbars || [8,0,8,5,0,3,0,0,0]);

    return {
        noteOn: (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
            if (!isFinite(midi) || !isFinite(when)) return;
            enforceVoiceLimit();
            const f = midiToHz(midi);
            if (!isFinite(f)) return;

            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
            const osc = ctx.createOscillator(); osc.setPeriodicWave(wave); osc.frequency.setValueAtTime(f, when);
            vibG.connect(osc.detune); osc.connect(voiceGain); osc.start(when);
            const adsr = currentPreset.adsr || { a: 0.02, d: 0.1, s: 0.9, r: 0.2 };
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity * 0.6);
            const record = { nodes: [voiceGain, osc], voiceState, cleaned: false };
            globalActiveVoices.push(record);
            const finalTime = triggerRelease(ctx, voiceState, when + (duration || 1.0), adsr.r);
            osc.stop(finalTime + 0.1); osc.onended = () => deepCleanup(record);
        },
        allNotesOff: () => { activeVoices.clear(); },
        disconnect: () => { [organSum, leslie.input, leslie.output, vibLfo, vibG, revSend].forEach(n => { try { if(n instanceof OscillatorNode) n.stop(); n.disconnect(); } catch(e){} }); },
        setPreset: (p: any) => { currentPreset = p; wave = getWave(p.drawbars || [8,0,8,5,0,3,0,0,0]); revSend.gain.value = p.reverbMix ?? 0.1; }
    };
};

const buildBassEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const bassSum = ctx.createGain();
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 35;
    bassSum.connect(hpf).connect(expressionGain).connect(instrumentGain).connect(master);

    return {
        noteOn: (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
            if (!isFinite(midi) || !isFinite(when)) return;
            enforceVoiceLimit();
            const f0 = midiToHz(midi);
            if (!isFinite(f0)) return;

            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(bassSum);
            const nodes: AudioNode[] = [voiceGain];
            const oscs = currentPreset.osc || [{ type: 'sawtooth', gain: 0.7 }];
            oscs.forEach((o: any) => {
                const x = ctx.createOscillator(); x.type = o.type;
                x.frequency.setValueAtTime(f0 * Math.pow(2, o.octave || 0), when);
                const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.7) * (isFinite(velocity) ? velocity : 1);
                x.connect(g).connect(voiceGain); x.start(when);
                nodes.push(x, g);
            });
            const adsr = currentPreset.adsr || { a: 0.01, d: 0.15, s: 0.7, r: 0.25 };
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
            const record = { nodes, voiceState, cleaned: false };
            globalActiveVoices.push(record);
            const finalTime = triggerRelease(ctx, voiceState, when + (duration || 1.0), adsr.r);
            nodes.forEach(n => { if (n instanceof OscillatorNode) { n.stop(finalTime + 0.1); n.onended = () => deepCleanup(record); } });
        },
        allNotesOff: () => {},
        disconnect: () => { try { bassSum.disconnect(); hpf.disconnect(); } catch(e){} },
        setPreset: (p: any) => { currentPreset = p; }
    };
};

const buildGuitarEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const guitarIn = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18;
    const shaper = ctx.createWaveShaper(); shaper.oversample = '4x';
    shaper.curve = makeVintageDistortion(50);
    
    const phaser = makePhaser(ctx, currentPreset.phaser?.on ? (currentPreset.phaser.mix ?? 0.2) : 0);
    const delay = makeDelay(ctx, currentPreset.delayA?.on ? (currentPreset.delayA.mix ?? 0.2) : 0);
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.2;

    guitarIn.connect(comp).connect(shaper).connect(phaser.input);
    phaser.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);

    const createPulse = (f: number, w: number) => {
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * w);
        const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
        const o = ctx.createOscillator(); o.setPeriodicWave(wave); o.frequency.value = f; return o;
    };

    return {
        noteOn: (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
            if (!isFinite(midi) || !isFinite(when)) return;
            enforceVoiceLimit();
            const f = midiToHz(midi);
            if (!isFinite(f)) return;

            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(guitarIn);
            const oscP = currentPreset.osc || { width: 0.45 };
            const osc = createPulse(f, oscP.width || 0.45);
            const g = ctx.createGain(); g.gain.value = (isFinite(velocity) ? velocity : 1);
            osc.connect(g).connect(voiceGain); osc.start(when);
            const adsr = currentPreset.adsr || { a: 0.005, d: 0.3, s: 0.6, r: 1.5 };
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity * 0.15);
            const record = { nodes: [voiceGain, osc, g], voiceState, cleaned: false };
            globalActiveVoices.push(record);
            const finalTime = triggerRelease(ctx, voiceState, when + (duration || 1.0), adsr.r);
            osc.stop(finalTime + 0.1); osc.onended = () => deepCleanup(record);
        },
        allNotesOff: () => {},
        disconnect: () => { [guitarIn, comp, shaper, phaser.input, phaser.output, delay.input, delay.output, revSend].forEach(n => { try { if(n instanceof OscillatorNode) n.stop(); n.disconnect(); } catch(e){} }); },
        setPreset: (p: any) => { 
            currentPreset = p; 
            shaper.curve = p.drive?.type === 'muff' ? makeMuff(p.drive.amount ?? 0.65) : makeVintageDistortion((p.drive?.amount || 0.5) * 100); 
            phaser.setMix(p.phaser?.on ? (p.phaser.mix ?? 0.2) : 0); 
        }
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FACTORY
// ═══════════════════════════════════════════════════════════════════════════

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    plateIRUrl = null as string | null,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    
    const master = ctx.createGain(); master.gain.value = 0.8;
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = preset.volume ?? 0.7;
    const expressionGain = ctx.createGain(); expressionGain.gain.value = 1.0;
    const reverb = ctx.createConvolver();
    if (plateIRUrl) loadIR(ctx, plateIRUrl).then(buf => { if (buf) reverb.buffer = buf; });
    reverb.connect(master);

    let engine: any;
    if (type === 'bass') engine = buildBassEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    else if (type === 'organ') engine = buildOrganEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    else if (type === 'guitar') engine = buildGuitarEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    else engine = buildSynthEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);

    master.connect(output);

    return {
        connect: (dest) => master.connect(dest || output),
        disconnect: () => { if (engine.allNotesOff) engine.allNotesOff(); if (engine.disconnect) engine.disconnect(); master.disconnect(); },
        noteOn: engine.noteOn,
        noteOff: (m, w) => { if (engine.noteOff) engine.noteOff(m, w); },
        allNotesOff: () => engine.allNotesOff(),
        setPreset: (p) => engine.setPreset(p),
        setParam: (k, v) => engine.setParam?.(k, v),
        setVolume: (v) => { if(isFinite(v)) instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02); },
        setVolumeDb: (db) => { if(isFinite(db)) instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02); },
        getVolume: () => instrumentGain.gain.value,
        setExpression: (v) => { if(isFinite(v)) expressionGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01); },
        preset, type
    };
}
