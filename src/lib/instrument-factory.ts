/**
 * #ЗАЧЕМ: Центральная фабрика инструментов V2.0.
 * #ЧТО: Реализует принцип тотальной изоляции голосов (Voice Isolation) и 
 *       автоматическую очистку ресурсов через нативные события onended.
 * #ОБНОВЛЕНО (ПЛАН 88): Ликвидация крахов в фоне. Переход на onended вместо setTimeout.
 *          Восстановлено качество органов (Vibrato + No-Norm PeriodicWave).
 */

// ───── MONITORING ─────

let globalActiveVoices = 0;
const VOICE_LIMIT = 128; // Предотвращение краха CPU

if (typeof window !== 'undefined') {
    setInterval(() => {
        if (globalActiveVoices > 0) {
            console.log(`%c[AudioMonitor] Active Voices: ${globalActiveVoices}/${VOICE_LIMIT}`, 'color: #00FF00; font-weight: bold;');
        }
    }, 3000);
}

// ───── HELPERS ─────

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const dB = (x: number) => Math.pow(10, x / 20);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const loadIR = async (ctx: AudioContext, url: string | null): Promise<AudioBuffer | null> => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        return await ctx.decodeAudioData(buf);
    } catch {
        return null;
    }
};

/**
 * #ЗАЧЕМ: Гарантированное уничтожение узлов и разрыв связей.
 * #ЧТО: Вызывается автоматически по завершении ноты.
 */
const deepCleanup = (voiceRecord: any, allActiveVoices: Set<any>) => {
    if (!voiceRecord || voiceRecord.cleaned) return;
    voiceRecord.cleaned = true;
    
    if (voiceRecord.nodes) {
        voiceRecord.nodes.forEach((n: any) => {
            try {
                if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
                    n.stop();
                }
                n.disconnect();
            } catch (e) {}
        });
    }
    
    if (allActiveVoices.has(voiceRecord)) {
        allActiveVoices.delete(voiceRecord);
        globalActiveVoices = Math.max(0, globalActiveVoices - 1);
    }
};

// ───── DISTORTION CURVES ─────

const makeSoftClip = (amount = 0.5, n = 8192) => {
    const c = new Float32Array(n);
    const k = clamp(amount, 0, 1) * 10 + 1;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(k * x) / Math.tanh(k);
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

// ───── FX FACTORIES ─────

interface SimpleFX {
    input: GainNode;
    output: AudioNode;
    setMix: (m: number) => void;
    lfos: OscillatorNode[];
}

const makeChorus = (ctx: AudioContext, rate = 0.3, depth = 0.004, mix = 0.3): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const delay = ctx.createDelay(0.05); delay.delayTime.value = 0.015;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = depth;
    lfo.connect(lfoGain).connect(delay.delayTime); lfo.start();
    input.connect(dry).connect(output);
    input.connect(delay).connect(wet).connect(output);
    return {
        input, output, lfos: [lfo],
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

const makeDelay = (ctx: AudioContext, time = 0.35, fb = 0.25, hc = 3000, mix = 0.2): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const delayNode = ctx.createDelay(2); delayNode.delayTime.value = time;
    const feedback = ctx.createGain(); feedback.gain.value = fb;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = hc;
    input.connect(dry).connect(output);
    input.connect(delayNode).connect(filter).connect(feedback).connect(delayNode);
    filter.connect(wet).connect(output);
    return {
        input, output, lfos: [],
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

const makePhaser = (ctx: AudioContext, rate = 0.16, depth = 600, mix = 0.2): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const filters: BiquadFilterNode[] = [];
    let head: AudioNode = input;
    for (let i = 0; i < 4; i++) {
        const ap = ctx.createBiquadFilter(); ap.type = 'allpass'; ap.frequency.value = 800;
        head.connect(ap); head = ap; filters.push(ap);
    }
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = depth;
    lfo.connect(lfoGain); filters.forEach(f => lfoGain.connect(f.frequency)); lfo.start();
    input.connect(dry).connect(output);
    filters[3].connect(wet).connect(output);
    return {
        input, output, lfos: [lfo],
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

// ───── LIFE CYCLE ─────

interface VoiceState {
    node: GainNode;
    startTime: number;
}

const triggerAttack = (ctx: AudioContext, gain: GainNode, when: number, a: number, d: number, s: number, velocity = 1): VoiceState => {
    const attack = Math.max(a, 0.003);
    const decay = Math.max(d, 0.01);
    const sustain = clamp(s, 0, 1) * velocity;
    gain.gain.cancelScheduledValues(when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(velocity, when + attack);
    gain.gain.setTargetAtTime(sustain, when + attack, decay / 3);
    return { node: gain, startTime: when };
};

const triggerRelease = (ctx: AudioContext, voiceState: VoiceState, when: number, a: number, r: number): number => {
    const release = Math.max(r, 0.02);
    voiceState.node.gain.cancelScheduledValues(when);
    voiceState.node.gain.setTargetAtTime(0.0001, when, release / 3);
    return when + release;
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
// SYNTH ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const buildSynthEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const internalLFOs: OscillatorNode[] = [];
    const comp = ctx.createDynamicsCompressor();
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass';
    const chorus = makeChorus(ctx, { mix: currentPreset.chorus?.on ? 0.3 : 0 } as any);
    const delay = makeDelay(ctx, { wet: currentPreset.delay?.on ? 0.2 : 0 } as any);
    internalLFOs.push(...chorus.lfos, ...delay.lfos);

    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.18;

    comp.connect(filt).connect(chorus.input);
    chorus.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);

    const activeVoices = new Map<number, any>();
    const allActiveVoices = new Set<any>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        if (globalActiveVoices >= VOICE_LIMIT) return;
        globalActiveVoices++;
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(comp);
        const nodes: AudioNode[] = [voiceGain];
        const oscConfigs = currentPreset.osc || [{ type: 'sawtooth', gain: 0.5 }];

        oscConfigs.forEach((o: any) => {
            const osc = ctx.createOscillator(); osc.type = o.type; osc.frequency.value = f * Math.pow(2, o.octave || 0);
            const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.5) * velocity;
            osc.connect(g).connect(voiceGain); osc.start(when);
            nodes.push(osc, g);
        });

        const adsr = currentPreset.adsr || { a: 0.1, d: 0.2, s: 0.7, r: 1.5 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        const record = { voiceGain, voiceState, nodes, cleaned: false };
        allActiveVoices.add(record);

        const stopTime = when + (duration || 2.0);
        const finalTime = triggerRelease(ctx, voiceState, stopTime, adsr.a, adsr.r);
        
        const primaryOsc = nodes.find(n => n instanceof OscillatorNode) as OscillatorNode;
        primaryOsc.stop(finalTime + 0.1);
        primaryOsc.onended = () => deepCleanup(record, allActiveVoices);

        if (!duration) activeVoices.set(midi, record);
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const v = activeVoices.get(midi); if (!v) return; activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { a: 0.1, r: 1.5 };
        const finalTime = triggerRelease(ctx, v.voiceState, when, adsr.a, adsr.r);
        (v.nodes.find((n: any) => n instanceof OscillatorNode) as OscillatorNode).stop(finalTime + 0.1);
    };

    return {
        noteOn, noteOff,
        allNotesOff: () => { allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices)); activeVoices.clear(); },
        disconnect: () => { 
            internalLFOs.forEach(lfo => { try { lfo.stop(); lfo.disconnect(); } catch(e){} });
            comp.disconnect(); revSend.disconnect();
        },
        setPreset: (p: any) => {
            currentPreset = p;
            filt.frequency.value = p.lpf?.cutoff ?? 2000;
            chorus.setMix(p.chorus?.on ? 0.3 : 0);
            delay.setMix(p.delay?.on ? 0.2 : 0);
            revSend.gain.value = p.reverbMix ?? 0.18;
        }
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// ORGAN ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const buildOrganEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const internalLFOs: OscillatorNode[] = [];
    const organSum = ctx.createGain();
    
    // Leslie
    const leslie = makeChorus(ctx, { rate: 0.6, depth: 0.005, mix: 0.5 } as any); 
    internalLFOs.push(...leslie.lfos);

    // Vibrato
    const vibLfo = ctx.createOscillator(); vibLfo.type = 'sine'; vibLfo.frequency.value = currentPreset.vibratoRate ?? 6.2;
    const vibGain = ctx.createGain(); vibGain.gain.value = 3.5; // cents
    vibLfo.connect(vibGain); vibLfo.start();
    internalLFOs.push(vibLfo);

    organSum.connect(leslie.input);
    leslie.output.connect(expressionGain).connect(instrumentGain).connect(master);
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.1;
    leslie.output.connect(revSend).connect(reverb);

    let tonewheelWave: PeriodicWave;
    const updateWave = (drawbars: number[]) => {
        const real = new Float32Array(17), imag = new Float32Array(17);
        const indices = [1, 3, 2, 4, 6, 8, 10, 12, 16];
        drawbars.forEach((v, i) => { if (v > 0) real[indices[i]] = v / 8; });
        // #ЗАЧЕМ: disableNormalization: true сохраняет аддитивную мощь Хаммонда.
        tonewheelWave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
    };
    updateWave(currentPreset.drawbars || [8,0,8,5,0,3,0,0,0]);

    const allActiveVoices = new Set<any>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        if (globalActiveVoices >= VOICE_LIMIT) return;
        globalActiveVoices++;
        const f0 = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
        const nodes: AudioNode[] = [voiceGain];

        const osc = ctx.createOscillator();
        osc.setPeriodicWave(tonewheelWave);
        osc.frequency.setValueAtTime(f0 * 0.5, when);
        vibGain.connect(osc.detune);
        osc.connect(voiceGain);
        osc.start(when);
        nodes.push(osc);

        const adsr = currentPreset.adsr || { a: 0.02, d: 0.1, s: 0.9, r: 0.2 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity * 0.4);
        const record = { voiceGain, voiceState, nodes, cleaned: false };
        allActiveVoices.add(record);

        const finalTime = triggerRelease(ctx, voiceState, when + (duration || 1.0), adsr.a, adsr.r);
        osc.stop(finalTime + 0.1);
        osc.onended = () => deepCleanup(record, allActiveVoices);
    };

    return {
        noteOn, noteOff: () => {},
        allNotesOff: () => { allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices)); },
        disconnect: () => {
            internalLFOs.forEach(lfo => { try { lfo.stop(); lfo.disconnect(); } catch(e){} });
            organSum.disconnect(); revSend.disconnect();
        },
        setPreset: (p: any) => { currentPreset = p; updateWave(p.drawbars || [8,0,8,5,0,3,0,0,0]); revSend.gain.value = p.reverbMix ?? 0.1; }
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// BASS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const buildBassEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const bassSum = ctx.createGain();
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 35;
    bassSum.connect(hpf).connect(expressionGain).connect(instrumentGain).connect(master);
    const allActiveVoices = new Set<any>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        if (globalActiveVoices >= VOICE_LIMIT) return;
        globalActiveVoices++;
        const f0 = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(bassSum);
        const nodes: AudioNode[] = [voiceGain];
        const oscs = currentPreset.osc || [{ type: 'sawtooth', gain: 0.7 }];

        oscs.forEach((o: any) => {
            const x = ctx.createOscillator(); x.type = o.type; x.frequency.value = f0 * Math.pow(2, o.octave || 0);
            const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.7) * velocity;
            x.connect(g).connect(voiceGain); x.start(when);
            nodes.push(x, g);
        });

        const adsr = currentPreset.adsr || { a: 0.01, d: 0.15, s: 0.7, r: 0.25 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        const record = { voiceGain, voiceState, nodes, cleaned: false };
        allActiveVoices.add(record);

        const finalTime = triggerRelease(ctx, voiceState, when + (duration || 1.0), adsr.a, adsr.r);
        const primary = nodes.find(n => n instanceof OscillatorNode) as OscillatorNode;
        primary.stop(finalTime + 0.1);
        primary.onended = () => deepCleanup(record, allActiveVoices);
    };

    return {
        noteOn, noteOff: () => {},
        allNotesOff: () => { allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices)); },
        disconnect: () => { bassSum.disconnect(); },
        setPreset: (p: any) => { currentPreset = p; }
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// GUITAR ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const buildGuitarEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const internalLFOs: OscillatorNode[] = [];
    const guitarInput = ctx.createGain();
    
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18;
    const shaper = ctx.createWaveShaper(); shaper.oversample = '4x';
    shaper.curve = makeVintageDistortion(50);

    const phaser = makePhaser(ctx); internalLFOs.push(...phaser.lfos);
    const delay = makeDelay(ctx); 
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.2;

    guitarInput.connect(comp).connect(shaper).connect(phaser.input);
    phaser.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);

    const allActiveVoices = new Set<any>();

    const createPulse = (f: number, w: number) => {
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * w);
        const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
        const o = ctx.createOscillator(); o.setPeriodicWave(wave); o.frequency.value = f; return o;
    };

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        if (globalActiveVoices >= VOICE_LIMIT) return;
        globalActiveVoices++;
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(guitarInput);
        const nodes: AudioNode[] = [voiceGain];
        const oscP = currentPreset.osc || { width: 0.45 };

        const osc = createPulse(f, oscP.width || 0.45);
        const g = ctx.createGain(); g.gain.value = velocity;
        osc.connect(g).connect(voiceGain); osc.start(when);
        nodes.push(osc, g);

        const adsr = currentPreset.adsr || { a: 0.005, d: 0.3, s: 0.6, r: 1.5 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity * 0.15);
        const record = { voiceGain, voiceState, nodes, cleaned: false };
        allActiveVoices.add(record);

        const finalTime = triggerRelease(ctx, voiceState, when + (duration || 1.0), adsr.a, adsr.r);
        osc.stop(finalTime + 0.1);
        osc.onended = () => deepCleanup(record, allActiveVoices);
    };

    return {
        noteOn, noteOff: () => {},
        allNotesOff: () => { allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices)); },
        disconnect: () => {
            internalLFOs.forEach(lfo => { try { lfo.stop(); lfo.disconnect(); } catch(e){} });
            guitarInput.disconnect(); revSend.disconnect();
        },
        setPreset: (p: any) => {
            currentPreset = p;
            shaper.curve = p.drive?.type === 'muff' ? makeMuff(p.drive.amount) : makeVintageDistortion((p.drive?.amount || 0.5) * 100);
            phaser.setMix(p.phaser?.on ? 0.2 : 0);
            delay.setMix(p.delayA?.on ? 0.2 : 0);
        }
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// FACTORY
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
        disconnect: () => { 
            engine.allNotesOff();
            if (engine.disconnect) engine.disconnect();
            master.disconnect();
        },
        noteOn: engine.noteOn,
        noteOff: engine.noteOff,
        allNotesOff: engine.allNotesOff,
        setPreset: engine.setPreset,
        setParam: (k, v) => engine.setParam?.(k, v),
        setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
        setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setExpression: (v) => expressionGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
        preset, type
    };
}
