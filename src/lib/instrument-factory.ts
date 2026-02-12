/**
 * #ЗАЧЕМ: Центральная фабрика инструментов V3.5 — "True Polyphony Update".
 * #ЧТО: Исправлен ритмический треск в Guitar и Organ за счет перехода на честную полифонию:
 *       1. Инстанцирование осцилляторов и огибающих теперь происходит внутри noteOn.
 *       2. Устранен конфликт общих узлов при наложении нот.
 *       3. Полная поддержка пассивной очистки через GVR (Global Voice Registry).
 *       4. Сохранение высокой производительности через Wavetable Caching.
 */

// ───── GLOBAL REGISTRY & LIMITS ─────

let globalActiveVoices: any[] = [];
const GLOBAL_VOICE_LIMIT = 100;

/**
 * #ЗАЧЕМ: Глобальная очистка голоса.
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
    
    voiceRecord.nodes = null;
    voiceRecord.voiceState = null;
    
    globalActiveVoices = globalActiveVoices.filter(v => v !== voiceRecord);
};

const enforceVoiceLimit = () => {
    while (globalActiveVoices.length > GLOBAL_VOICE_LIMIT) {
        const oldest = globalActiveVoices.shift();
        if (oldest) deepCleanup(oldest);
    }
};

// ───── HELPERS ─────

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const dB = (x: number) => Math.pow(10, x / 20);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const loadIR = async (ctx: AudioContext, url: string | null): Promise<AudioBuffer | null> => {
    if (!url) return null;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        return await ctx.decodeAudioData(buf);
    } catch { return null; }
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
    const kVal = isFinite(k) ? k : 50;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        const num = (3 + kVal) * Math.atan(Math.sinh(x * 0.25) * 5);
        const den = Math.PI + kVal * Math.abs(x);
        curve[i] = num / den;
    }
    return curve;
};

// ───── FX FACTORIES ─────

interface SimpleFX {
    input: GainNode;
    output: AudioNode;
    stop: () => void;
    setMix: (m: number) => void;
}

const makeChorus = (ctx: AudioContext, opt: any = {}): SimpleFX => {
    const options = typeof opt === 'number' ? { mix: opt } : opt;
    const { rate = 0.3, depth = 0.004, mix = 0.3 } = options;
    
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - (isFinite(mix) ? mix : 0.3);
    const wet = ctx.createGain(); wet.gain.value = isFinite(mix) ? mix : 0.3;
    
    const delay = ctx.createDelay(0.05); delay.delayTime.value = 0.015;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = isFinite(rate) ? rate : 0.3;
    const lfoG = ctx.createGain(); lfoG.gain.value = isFinite(depth) ? depth : 0.004;
    lfo.connect(lfoG).connect(delay.delayTime); lfo.start();
    
    input.connect(dry).connect(output);
    input.connect(delay).connect(wet).connect(output);
    
    return { input, output, 
        stop: () => { try { lfo.stop(); lfo.disconnect(); } catch(e){} },
        setMix: (m) => {
            const v = clamp(m, 0, 1);
            if(isFinite(v)) {
                wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
                dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            }
        }
    };
};

const makeDelay = (ctx: AudioContext, opt: any = {}): SimpleFX => {
    const options = typeof opt === 'number' ? { mix: opt } : opt;
    const { time = 0.35, fb = 0.25, hc = 3000, mix = 0.2 } = options;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - (isFinite(mix) ? mix : 0.2);
    const wet = ctx.createGain(); wet.gain.value = isFinite(mix) ? mix : 0.2;
    
    const d = ctx.createDelay(2.0); d.delayTime.value = isFinite(time) ? time : 0.35;
    const loop = ctx.createGain(); loop.gain.value = isFinite(fb) ? fb : 0.25;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = isFinite(hc) ? hc : 3000;
    
    input.connect(dry).connect(output);
    input.connect(d).connect(lp).connect(loop).connect(d);
    lp.connect(wet).connect(output);
    
    return { input, output, 
        stop: () => {}, 
        setMix: (m) => {
            const v = clamp(m, 0, 1);
            if(isFinite(v)) {
                wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
                dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            }
        }
    };
};

const makePhaser = (ctx: AudioContext, opt: any = {}): SimpleFX => {
    const options = typeof opt === 'number' ? { mix: opt } : opt;
    const { stages = 4, base = 800, depth = 600, rate = 0.16, fb = 0.12, mix = 0.2 } = options;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - (isFinite(mix) ? mix : 0.2);
    const wet = ctx.createGain(); wet.gain.value = isFinite(mix) ? mix : 0.2;
    
    const filters: BiquadFilterNode[] = [];
    let head: AudioNode = input;
    for (let i = 0; i < (isFinite(stages) ? stages : 4); i++) {
        const ap = ctx.createBiquadFilter(); 
        ap.type = 'allpass'; 
        ap.frequency.value = (isFinite(base) ? base : 800) * ((i % 2) ? 1.2 : 0.8); 
        ap.Q.value = 0.6; 
        head.connect(ap); head = ap; filters.push(ap);
    }
    const fbG = ctx.createGain(); fbG.gain.value = isFinite(fb) ? fb : 0.12; 
    filters[filters.length - 1].connect(fbG); fbG.connect(filters[0]);
    
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = isFinite(rate) ? rate : 0.16;
    const lfoG = ctx.createGain(); lfoG.gain.value = isFinite(depth) ? depth : 600;
    lfo.connect(lfoG); filters.forEach(f => lfoG.connect(f.frequency)); lfo.start();
    
    input.connect(dry); 
    filters[filters.length - 1].connect(wet); 
    dry.connect(output); wet.connect(output);
    
    return { input, output, 
        stop: () => { try { lfo.stop(); lfo.disconnect(); } catch(e){} },
        setMix: (m) => {
            const v = clamp(m, 0, 1);
            if(isFinite(v)) {
                wet.gain.setTargetAtTime(v, ctx.currentTime, 0.02);
                dry.gain.setTargetAtTime(1 - v, ctx.currentTime, 0.02);
            }
        }
    };
};

// ───── ADSR (Robust Implementation) ─────

interface VoiceState { node: GainNode; startTime: number; }

const triggerAttack = (ctx: AudioContext, gain: GainNode, when: number, a: number, d: number, s: number, velocity = 1): VoiceState => {
    const attack = isFinite(a) ? Math.max(a, 0.003) : 0.01;
    const decay = isFinite(d) ? Math.max(d, 0.01) : 0.1;
    const sustain = isFinite(s) ? clamp(s, 0, 1) * velocity : 0.7 * velocity;
    const now = Math.max(isFinite(when) ? when : ctx.currentTime, ctx.currentTime);
    
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(velocity, now + attack);
    gain.gain.setTargetAtTime(sustain, now + attack, Math.max(decay / 3, 0.001));
    return { node: gain, startTime: now };
};

const triggerRelease = (ctx: AudioContext, voiceState: VoiceState, when: number, r: number): number => {
    const release = isFinite(r) ? Math.max(r, 0.02) : 0.3;
    const now = Math.max(isFinite(when) ? when : ctx.currentTime, ctx.currentTime);
    
    voiceState.node.gain.cancelScheduledValues(now);
    voiceState.node.gain.setTargetAtTime(0.0001, now, Math.max(release / 3, 0.001));
    return now + release;
};

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
    const chorus = makeChorus(ctx, currentPreset.chorus || {});
    const delay = makeDelay(ctx, currentPreset.delay || {});
    const revSend = ctx.createGain(); revSend.gain.value = isFinite(currentPreset.reverbMix) ? currentPreset.reverbMix : 0.18;

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
    staticNodes.push(comp, filt, filt2, chorus.input, delay.input, revSend);

    return {
        noteOn: (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
            if (!isFinite(midi)) return;
            enforceVoiceLimit();
            const f = midiToHz(midi);
            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(comp);
            const nodes: AudioNode[] = [voiceGain];
            const oscConfigs = currentPreset.osc || [{ type: 'sawtooth', gain: 0.5 }];
            oscConfigs.forEach((o: any) => {
                const osc = ctx.createOscillator(); osc.type = o.type;
                osc.frequency.setValueAtTime(f * Math.pow(2, o.octave || 0), when);
                const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.5) * velocity;
                osc.connect(g).connect(voiceGain); osc.start(when);
                nodes.push(osc, g);
            });
            const adsr = currentPreset.adsr || {};
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
            const record = { nodes, voiceState, cleaned: false };
            globalActiveVoices.push(record);
            if (duration && isFinite(duration)) {
                const finalTime = triggerRelease(ctx, voiceState, when + duration, adsr.r);
                nodes.forEach(n => { if(n instanceof OscillatorNode) { n.stop(finalTime + 0.1); n.onended = () => deepCleanup(record); } });
            } else { activeVoices.set(midi, record); }
        },
        noteOff: (midi: number, when = ctx.currentTime) => {
            const v = activeVoices.get(midi); if (!v) return; activeVoices.delete(midi);
            const adsr = currentPreset.adsr || {};
            const finalTime = triggerRelease(ctx, v.voiceState, when, adsr.r);
            v.nodes.forEach((n: any) => { if (n instanceof OscillatorNode) { n.stop(finalTime + 0.1); n.onended = () => deepCleanup(v); } });
        },
        allNotesOff: () => { activeVoices.forEach((_, m) => { const v = activeVoices.get(m); if(v) deepCleanup(v); }); activeVoices.clear(); },
        disconnect: () => { 
            chorus.stop();
            staticNodes.forEach(n => { try { n.disconnect(); } catch(e){} }); 
        },
        setPreset: (p: any) => { currentPreset = p; rebuild(p); filt.frequency.value = p.lpf?.cutoff ?? 2000; chorus.setMix(p.chorus?.on ? 0.3 : 0); revSend.gain.value = isFinite(p.reverbMix) ? p.reverbMix : 0.18; }
    };
};

const buildOrganEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const organSum = ctx.createGain();
    const leslie = makeChorus(ctx, currentPreset.leslie || {});
    const vibLfo = ctx.createOscillator(); vibLfo.frequency.value = 6.2;
    const vibG = ctx.createGain(); vibG.gain.value = 3.5; vibLfo.connect(vibG); vibLfo.start();
    const revSend = ctx.createGain(); revSend.gain.value = isFinite(currentPreset.reverbMix) ? currentPreset.reverbMix : 0.1;

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
            if (!isFinite(midi)) return;
            enforceVoiceLimit();
            const f = midiToHz(midi);
            
            // #ЗАЧЕМ: Устранение треска за счет полифонического инстанцирования.
            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
            const osc = ctx.createOscillator(); osc.setPeriodicWave(wave); osc.frequency.setValueAtTime(f, when);
            vibG.connect(osc.detune); osc.connect(voiceGain); osc.start(when);
            
            const adsr = currentPreset.adsr || {};
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity * 0.6);
            const record = { nodes: [voiceGain, osc], voiceState, cleaned: false };
            globalActiveVoices.push(record);
            
            const durValue = isFinite(duration as number) ? (duration as number) : 1.0;
            const finalTime = triggerRelease(ctx, voiceState, when + durValue, adsr.r);
            osc.stop(finalTime + 0.1); 
            osc.onended = () => deepCleanup(record);
        },
        allNotesOff: () => {},
        disconnect: () => { 
            leslie.stop();
            try { vibLfo.stop(); vibLfo.disconnect(); } catch(e){}
            [organSum, leslie.input, revSend].forEach(n => { try { n.disconnect(); } catch(e){} }); 
        },
        setPreset: (p: any) => { currentPreset = p; wave = getWave(p.drawbars || [8,0,8,5,0,3,0,0,0]); revSend.gain.value = isFinite(p.reverbMix) ? p.reverbMix : 0.1; }
    };
};

const buildBassEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const bassSum = ctx.createGain();
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 35;
    bassSum.connect(hpf).connect(expressionGain).connect(instrumentGain).connect(master);

    return {
        noteOn: (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
            if (!isFinite(midi)) return;
            enforceVoiceLimit();
            const f0 = midiToHz(midi);
            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(bassSum);
            const nodes: AudioNode[] = [voiceGain];
            const oscs = currentPreset.osc || [{ type: 'sawtooth', gain: 0.7 }];
            oscs.forEach((o: any) => {
                const x = ctx.createOscillator(); x.type = o.type;
                x.frequency.setValueAtTime(f0 * Math.pow(2, o.octave || 0), when);
                const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.7) * velocity;
                x.connect(g).connect(voiceGain); x.start(when);
                nodes.push(x, g);
            });
            const adsr = currentPreset.adsr || {};
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
            const record = { nodes, voiceState, cleaned: false };
            globalActiveVoices.push(record);
            const finalTime = triggerRelease(ctx, voiceState, when + (isFinite(duration as number) ? (duration as number) : 1.0), adsr.r);
            nodes.forEach(n => { if (n instanceof OscillatorNode) { n.stop(finalTime + 0.1); n.onended = () => deepCleanup(record); } });
        },
        allNotesOff: () => {},
        disconnect: () => { 
            try { bassSum.disconnect(); hpf.disconnect(); } catch(e){} 
        },
        setPreset: (p: any) => { currentPreset = p; }
    };
};

const buildGuitarEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const guitarIn = ctx.createGain();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18;
    const shaper = ctx.createWaveShaper(); shaper.oversample = '4x';
    shaper.curve = makeVintageDistortion(50);
    const phaser = makePhaser(ctx, currentPreset.phaser || {});
    const delay = makeDelay(ctx, currentPreset.delayA || {});
    const revSend = ctx.createGain(); revSend.gain.value = isFinite(currentPreset.reverbMix) ? currentPreset.reverbMix : 0.2;

    guitarIn.connect(comp).connect(shaper).connect(phaser.input);
    phaser.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);

    const activeVoices = new Map<number, any>();

    let cachedWave: PeriodicWave | null = null;
    let lastWidth = -1;

    const getPulseWave = (w: number) => {
        const width = clamp(w, 0.1, 0.9);
        if (cachedWave && width === lastWidth) return cachedWave;
        
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) {
            real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * width);
        }
        cachedWave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
        lastWidth = width;
        return cachedWave;
    };

    return {
        noteOn: (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
            if (!isFinite(midi)) return;
            enforceVoiceLimit();
            const f = midiToHz(midi);
            
            // #ЗАЧЕМ: Устранение треска за счет полной полифонической изоляции.
            // #ЧТО: vGain и осциллятор теперь создаются для каждой ноты отдельно.
            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(guitarIn);
            const oscP = currentPreset.osc || { width: 0.45 };
            
            const osc = ctx.createOscillator();
            osc.setPeriodicWave(getPulseWave(oscP.width || 0.45));
            osc.frequency.setValueAtTime(f, when);
            
            const g = ctx.createGain(); g.gain.value = velocity;
            osc.connect(g).connect(voiceGain); osc.start(when);
            
            const adsr = currentPreset.adsr || {};
            const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity * 0.15);
            
            const record = { nodes: [voiceGain, osc, g], voiceState, cleaned: false };
            globalActiveVoices.push(record);

            if (duration && isFinite(duration)) {
                const stopTime = triggerRelease(ctx, voiceState, when + duration, adsr.r);
                osc.stop(stopTime + 0.1);
                osc.onended = () => deepCleanup(record);
            } else {
                activeVoices.set(midi, record);
            }
        },
        noteOff: (midi: number, when = ctx.currentTime) => {
            const v = activeVoices.get(midi); if (!v) return; activeVoices.delete(midi);
            const adsr = currentPreset.adsr || {};
            const finalTime = triggerRelease(ctx, v.voiceState, when, adsr.r);
            v.nodes.forEach((n: any) => {
                if (n instanceof OscillatorNode) {
                    n.stop(finalTime + 0.1);
                    n.onended = () => deepCleanup(v);
                }
            });
        },
        allNotesOff: () => {
            activeVoices.forEach((v) => deepCleanup(v));
            activeVoices.clear();
        },
        disconnect: () => { 
            phaser.stop();
            activeVoices.forEach((v) => deepCleanup(v));
            activeVoices.clear();
            [guitarIn, comp, shaper, phaser.input, delay.input, revSend].forEach(n => { try { n.disconnect(); } catch(e){} }); 
        },
        setPreset: (p: any) => { 
            currentPreset = p; 
            shaper.curve = p.drive?.type === 'muff' ? makeMuff(p.drive.amount) : makeVintageDistortion((p.drive?.amount || 0.5) * 100); 
            phaser.setMix(p.phaser?.on ? 0.2 : 0); 
            cachedWave = null;
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
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = isFinite(preset.volume) ? preset.volume : 0.7;
    const expressionGain = ctx.createGain(); expressionGain.gain.value = 1.0;
    const reverb = ctx.createConvolver();
    if (plateIRUrl) loadIR(ctx, plateIRUrl).then(buf => { if (buf) reverb.buffer = buf; });
    reverb.connect(master);

    let engine: any;
    if (type === 'bass') engine = buildBassEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    else if (type === 'organ') engine = buildOrganEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    else if (type === 'guitar') engine = buildGuitarEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    else engine = buildSynthEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.0;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;

    master.connect(limiter);
    limiter.connect(output || ctx.destination);

    return {
        connect: (dest) => limiter.connect(dest || output),
        disconnect: () => { 
            if (engine.allNotesOff) engine.allNotesOff(); 
            if (engine.disconnect) engine.disconnect(); 
            master.disconnect();
            limiter.disconnect();
        },
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

export interface InstrumentAPI {
    connect: (dest?: AudioNode) => void;
    disconnect: () => void;
    noteOn: (midi: number, when?: number, velocity?: number, duration?: number) => void;
    noteOff: (midi: number, when?: number) => void;
    allNotesOff: () => void;
    setPreset: (p: any) => void;
    setParam: (k: string, v: any) => void;
    setVolume: (level: number) => void;
    setVolumeDb: (db: number) => void;
    getVolume: () => number;
    setExpression: (level: number) => void;
    preset: any;
    type: string;
}
