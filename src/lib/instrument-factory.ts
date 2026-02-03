
// Fab v2.9 - Experimental "Ghost Leslie" (Sub-sensory modulation)
// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

const makeTubeSaturation = (drive = 0.3, n = 8192) => {
    const curve = new Float32Array(n);
    const k = drive * 5 + 1;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        curve[i] = x >= 0 ? Math.tanh(k * x) : Math.tanh(k * x * 0.8) * 0.9;
    }
    return curve;
};

// ───── SIMPLE FX FACTORIES ─────

interface SimpleFX {
    input: GainNode;
    output: GainNode;
    setMix: (m: number) => void;
}

const makeChorus = (ctx: AudioContext, rate = 0.3, depth = 0.004, mix = 0.3): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    
    const delay = ctx.createDelay(0.05);
    delay.delayTime.value = 0.015;
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = depth;
    lfo.connect(lfoGain).connect(delay.delayTime);
    lfo.start();
    
    input.connect(dry).connect(output);
    input.connect(delay).connect(wet).connect(output);
    
    return {
        input, output,
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

const makeDelay = (ctx: AudioContext, time = 0.3, fb = 0.25, hc = 3000, mix = 0.2): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    
    const delayNode = ctx.createDelay(2);
    delayNode.delayTime.value = time;
    
    const feedback = ctx.createGain();
    feedback.gain.value = fb;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hc;
    
    input.connect(dry).connect(output);
    input.connect(delayNode).connect(filter).connect(feedback).connect(delayNode);
    filter.connect(wet).connect(output);
    
    return {
        input, output,
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

// ───── ADSR HELPER ─────

interface VoiceGain {
    node: GainNode;
    startTime: number;
}

const triggerAttack = (
    ctx: AudioContext,
    gain: GainNode,
    when: number,
    a: number, d: number, s: number,
    velocity = 1
): VoiceGain => {
    const attack = Math.max(a, 0.003);
    const decay = Math.max(d, 0.01);
    const sustain = clamp(s, 0, 1) * velocity;
    
    gain.gain.cancelScheduledValues(when);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(velocity, when + attack);
    gain.gain.setTargetAtTime(sustain, when + attack, decay / 3);
    
    return { node: gain, startTime: when };
};

const triggerRelease = (
    ctx: AudioContext,
    voiceGain: VoiceGain,
    when: number,
    a: number, r: number
): number => {
    const release = Math.max(r, 0.02);
    const elapsed = when - voiceGain.startTime;
    
    voiceGain.node.gain.cancelScheduledValues(when);
    
    if (elapsed < a) {
        const current = voiceGain.node.gain.value;
        voiceGain.node.gain.setValueAtTime(current, when);
        voiceGain.node.gain.setTargetAtTime(0.0001, when, 0.02);
        return when + 0.05;
    } else {
        voiceGain.node.gain.setValueAtTime(voiceGain.node.gain.value, when);
        voiceGain.node.gain.setTargetAtTime(0.0001, when, release / 3);
        return when + release;
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUMENT API INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

export interface InstrumentAPI {
    connect: (dest?: AudioNode) => void;
    disconnect: () => void;
    noteOn: (midi: number, when?: number, velocity?: number) => void;
    noteOff: (midi: number, when?: number) => void;
    allNotesOff: () => void;
    setPreset: (p: any) => void;
    setParam: (k: string, v: any) => void;
    setVolume: (level: number) => void;
    getVolume: () => number;
    setVolumeDb: (db: number) => void;
    setExpression: (level: number) => void;
    preset: any;
    type: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYNTH ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const buildSynthEngine = (
    ctx: AudioContext,
    preset: any,
    master: GainNode,
    reverb: ConvolverNode,
    instrumentGain: GainNode,
    expressionGain: GainNode
): Partial<InstrumentAPI> => {
    
    let currentPreset = { ...preset };
    
    const comp = ctx.createDynamicsCompressor();
    const compMakeup = ctx.createGain();
    const filt1 = ctx.createBiquadFilter();
    const filt2 = ctx.createBiquadFilter();
    const chorus = makeChorus(ctx, 
        currentPreset.chorus?.rate ?? 0.3,
        currentPreset.chorus?.depth ?? 0.004,
        currentPreset.chorus?.on ? (currentPreset.chorus?.mix ?? 0.3) : 0
    );
    const delay = makeDelay(ctx,
        currentPreset.delay?.time ?? 0.35,
        currentPreset.delay?.fb ?? 0.25,
        3000,
        currentPreset.delay?.on ? (currentPreset.delay?.mix ?? 0.2) : 0
    );
    const revSend = ctx.createGain();
    
    const updateNodes = (p: any) => {
        comp.threshold.value = p.comp?.threshold ?? -18;
        comp.ratio.value = p.comp?.ratio ?? 4;
        compMakeup.gain.value = dB(p.comp?.makeup ?? 6);
        filt1.type = 'lowpass'; filt1.frequency.value = p.lpf?.cutoff ?? 2000; filt1.Q.value = p.lpf?.q ?? 1;
        filt2.type = 'lowpass'; filt2.frequency.value = p.lpf?.cutoff ?? 2000; filt2.Q.value = p.lpf?.q ?? 1;
        chorus.setMix(p.chorus?.on ? (p.chorus?.mix ?? 0.3) : 0);
        delay.setMix(p.delay?.on ? (p.delay?.mix ?? 0.2) : 0);
        revSend.gain.value = p.reverbMix ?? 0.18;
        instrumentGain.gain.value = p.volume ?? 0.7;
    };
    
    updateNodes(currentPreset);
    
    comp.connect(compMakeup).connect(filt1);
    if (currentPreset.lpf?.mode === '24dB') {
        filt1.connect(filt2).connect(chorus.input);
    } else {
        filt1.connect(chorus.input);
    }
    chorus.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);
    
    const activeVoices = new Map<number, { nodes: AudioNode[], voiceState: VoiceGain }>();
    
    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(comp);
        const voiceNodes: AudioNode[] = [voiceGain];
        const sourceNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
        
        const oscConfig = currentPreset.osc || [{ type: 'sawtooth', gain: 0.5, octave: 0 }];
        for (const o of oscConfig) {
            const x = ctx.createOscillator(); x.type = o.type; x.detune.value = o.detune || 0;
            const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.5) * velocity;
            x.frequency.value = f * Math.pow(2, o.octave || 0);
            x.connect(g).connect(voiceGain); x.start(when);
            voiceNodes.push(x, g); sourceNodes.push(x);
        }
        
        if (sourceNodes[0]) sourceNodes[0].onended = () => { voiceNodes.forEach(n => { try { n.disconnect(); } catch(e){} }); };
        const adsr = currentPreset.adsr || { a: 0.01, d: 0.2, s: 0.7, r: 0.3 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { nodes: voiceNodes, voiceState });
    };
    
    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { r: 0.3 };
        const stopTime = triggerRelease(ctx, voice.voiceState, when, adsr.a, adsr.r);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) try { n.stop(stopTime + 0.1); } catch(e){} });
    };
    
    return { noteOn, noteOff, allNotesOff: () => activeVoices.forEach((_, m) => noteOff(m)), setPreset: (p) => { currentPreset = p; updateNodes(p); }, setParam: (k, v) => {} };
};

// ═══════════════════════════════════════════════════════════════════════════
// ORGAN ENGINE — Hammond B3 Style (Integrated Serial Leslie)
// ═══════════════════════════════════════════════════════════════════════════

const DRAWBAR_RATIOS = [0.5, 1.498, 1, 2, 2.997, 4, 5.04, 5.994, 8];

const createTonewheelWave = (ctx: AudioContext, config: any): PeriodicWave => {
    const real = new Float32Array(16); const imag = new Float32Array(16);
    real[1] = 1; real[2] = config.complexity * 0.02; real[3] = config.complexity * 0.015;
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
};

const createKeyClick = (ctx: AudioContext, duration: number, intensity: number): AudioBuffer => {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.exp(-t * 30) * (1 - t);
        data[i] = ((Math.random() * 2 - 1) * 0.6 + Math.sin(i * 0.15) * 0.4) * envelope * intensity;
    }
    return buffer;
};

const createVibratoScanner = (ctx: AudioContext, config: any) => {
    const input = ctx.createGain(); const output = ctx.createGain();
    const wet = ctx.createGain(); wet.gain.value = 1.0; 
    const delay = ctx.createDelay(0.02); delay.delayTime.value = 0.005;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = config.rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.0025;
    input.connect(delay); delay.connect(wet); wet.connect(output);
    lfo.connect(lfoGain); lfoGain.connect(delay.delayTime); lfo.start();
    return { input, output, setRate: (r:any) => lfo.frequency.setTargetAtTime(r, ctx.currentTime, 0.1) };
};

const createLeslie = (ctx: AudioContext, config: any) => {
    const input = ctx.createGain(); const output = ctx.createGain();
    const lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 800;
    const highpass = ctx.createBiquadFilter(); highpass.type = 'highpass'; highpass.frequency.value = 800;
    
    const hornDelay = ctx.createDelay(0.01); const hornAmp = ctx.createGain();
    const hornLfo = ctx.createOscillator(); 
    
    // #ЭКСПЕРИМЕНТ (ПЛАН 29): Минимизация модуляции до грани восприятия
    const hornFmDepth = ctx.createGain(); hornFmDepth.gain.value = 0.00002; 
    const hornAmMod = ctx.createGain(); hornAmMod.gain.value = 0.02; 
    
    const drumDelay = ctx.createDelay(0.01); const drumAmp = ctx.createGain();
    const drumLfo = ctx.createOscillator();
    const drumFmDepth = ctx.createGain(); drumFmDepth.gain.value = 0.00003;
    const drumAmMod = ctx.createGain(); drumAmMod.gain.value = 0.01;

    hornLfo.connect(hornFmDepth); hornFmDepth.connect(hornDelay.delayTime);
    hornLfo.connect(hornAmMod); hornAmMod.connect(hornAmp.gain);
    drumLfo.connect(drumFmDepth); drumFmDepth.connect(drumDelay.delayTime);
    drumLfo.connect(drumAmMod); drumAmMod.connect(drumAmp.gain);
    
    const speed = config.mode === 'fast' ? config.fast : config.slow;
    hornLfo.frequency.value = speed; drumLfo.frequency.value = speed * 0.85;
    hornLfo.start(); drumLfo.start();
    
    input.connect(lowpass); input.connect(highpass);
    highpass.connect(hornDelay).connect(hornAmp).connect(output);
    lowpass.connect(drumDelay).connect(drumAmp).connect(output);
    
    return { 
        input, output, 
        setMode: (m:any) => {
            const now = ctx.currentTime;
            const target = m === 'fast' ? config.fast : (m === 'slow' ? config.slow : 0.01);
            hornLfo.frequency.setTargetAtTime(target, now, config.accel);
            drumLfo.frequency.setTargetAtTime(target * 0.85, now, config.accel * 1.2);
        }
    };
};

async function buildOrganEngine(ctx: AudioContext, preset: any, options: any): Promise<InstrumentAPI> {
    console.log('%c[OrganEngine] Building Hammond-style organ...', 'color: #8B4513; font-weight: bold;');
    const output = options.output || ctx.destination;
    let currentPreset = { ...preset };
    let tonewheelWave = createTonewheelWave(ctx, currentPreset.tonewheel || { complexity: 0.3 });
    let clickBuffer = createKeyClick(ctx, 0.008, currentPreset.keyClick ?? 0.004);
    const organSum = ctx.createGain();
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = currentPreset.lpf ?? 5000;
    const vibrato = createVibratoScanner(ctx, { rate: currentPreset.vibrato?.rate ?? 6.5 });
    const leslie = createLeslie(ctx, { 
        mode: currentPreset.leslie?.mode ?? 'slow', slow: currentPreset.leslie?.slow ?? 0.8, fast: currentPreset.leslie?.fast ?? 6.5, accel: currentPreset.leslie?.accel ?? 0.8
    });
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = currentPreset.volume ?? 0.7;
    const master = ctx.createGain(); master.gain.value = 0.8;
    organSum.connect(lpf).connect(vibrato.input);
    vibrato.output.connect(leslie.input);
    leslie.output.connect(instrumentGain).connect(master).connect(output);
    const activeVoices = new Map<number, { nodes: AudioNode[], voiceState: VoiceGain }>();
    const noteOn = (midi: number, when: number = ctx.currentTime, velocity: number = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f0 = midiToHz(midi);
        const adsr = currentPreset.adsr || { a: 0.01, d: 0.1, s: 0.9, r: 0.1 };
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
        const voiceNodes: AudioNode[] = [voiceGain];
        const drawbars = currentPreset.drawbars || [8,8,8,0,0,0,0,0,0];
        drawbars.forEach((v: number, i: number) => {
            if (v > 0) {
                const osc = ctx.createOscillator(); osc.setPeriodicWave(tonewheelWave);
                osc.frequency.value = f0 * DRAWBAR_RATIOS[i];
                const g = ctx.createGain(); g.gain.value = (v/8) * 0.3;
                osc.connect(g).connect(voiceGain); osc.start(when);
                voiceNodes.push(osc, g);
            }
        });
        if (currentPreset.osc) {
            currentPreset.osc.forEach((o: any) => {
                const sub = ctx.createOscillator(); sub.type = o.type; sub.frequency.value = f0 * Math.pow(2, o.octave || 0);
                const subG = ctx.createGain(); subG.gain.value = (o.gain ?? 0.5) * velocity;
                sub.connect(subG).connect(voiceGain); sub.start(when);
                voiceNodes.push(sub, subG);
            });
        }
        if (clickBuffer && activeVoices.size === 0) {
            const click = ctx.createBufferSource(); click.buffer = clickBuffer;
            const clickG = ctx.createGain(); clickG.gain.value = velocity * 0.5;
            click.connect(clickG).connect(voiceGain); click.start(when);
            voiceNodes.push(click, clickG);
        }
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { nodes: voiceNodes, voiceState });
    };
    const noteOff = (midi: number, when: number = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { r: 0.1 };
        const stopTime = triggerRelease(ctx, voice.voiceState, when, adsr.a, adsr.r);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) try { n.stop(stopTime + 0.1); } catch(e){} });
    };
    const allNotesOff = () => activeVoices.forEach((_, midi) => noteOff(midi));
    console.log('%c[OrganEngine] Build COMPLETED: organ', 'color: #32CD32; font-weight: bold;');
    return {
        connect: (dest) => master.connect(dest || output), disconnect: () => master.disconnect(),
        noteOn, noteOff, allNotesOff, setPreset: (p) => { allNotesOff(); currentPreset = p; },
        setParam: (k, v) => { if(k==='leslie') leslie.setMode(v); },
        setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
        setExpression: (v) => master.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
        preset: currentPreset, type: 'organ'
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// BASS ENGINE — Analog Modeling
// ═══════════════════════════════════════════════════════════════════════════

async function buildBassEngine(ctx: AudioContext, preset: any, options: any): Promise<InstrumentAPI> {
    console.log('%c[BassEngine] Building Bass V2...', 'color: #4169E1; font-weight: bold;');
    const output = options.output || ctx.destination;
    let currentPreset = { ...preset };
    const bassSum = ctx.createGain();
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = currentPreset.hpf ?? 35;
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = currentPreset.filter?.cutoff ?? 1200;
    const shaper = ctx.createWaveShaper(); shaper.oversample = '2x';
    shaper.curve = makeTubeSaturation(currentPreset.drive?.amount ?? 0.2);
    const driveMix = ctx.createGain(); driveMix.gain.value = currentPreset.drive?.on ? 0.5 : 0;
    const dryMix = ctx.createGain(); dryMix.gain.value = 1;
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = currentPreset.volume ?? 0.75;
    const master = ctx.createGain(); master.gain.value = 0.8;
    bassSum.connect(hpf).connect(lpf).connect(shaper).connect(driveMix);
    lpf.connect(dryMix);
    const finalChain = ctx.createGain(); driveMix.connect(finalChain); dryMix.connect(finalChain);
    finalChain.connect(instrumentGain).connect(master).connect(output);
    const activeVoices = new Map<number, { nodes: AudioNode[], voiceState: VoiceGain }>();
    const noteOn = (midi: number, when: number = ctx.currentTime, velocity: number = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f0 = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(bassSum);
        const voiceNodes: AudioNode[] = [voiceGain];
        const oscs = currentPreset.osc || [{ type: 'sawtooth', gain: 0.7 }];
        oscs.forEach((o: any) => {
            const x = ctx.createOscillator(); x.type = o.type; x.frequency.value = f0 * Math.pow(2, o.octave || 0);
            const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.7) * velocity;
            x.connect(g).connect(voiceGain); x.start(when);
            voiceNodes.push(x, g);
        });
        if (currentPreset.sub?.on) {
            const sub = ctx.createOscillator(); sub.type = currentPreset.sub.type || 'sine';
            sub.frequency.value = f0 * Math.pow(2, currentPreset.sub.octave ?? -1);
            const subG = ctx.createGain(); subG.gain.value = (currentPreset.sub.gain ?? 0.5) * velocity;
            sub.connect(subG).connect(voiceGain); sub.start(when);
            voiceNodes.push(sub, subG);
        }
        const adsr = currentPreset.adsr || { a: 0.01, d: 0.15, s: 0.7, r: 0.25 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { nodes: voiceNodes, voiceState });
    };
    const noteOff = (midi: number, when: number = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { r: 0.25 };
        const stopTime = triggerRelease(ctx, voice.voiceState, when, adsr.a, adsr.r);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
    };
    const allNotesOff = () => activeVoices.forEach((_, m) => noteOff(m));
    console.log('%c[BassEngine] Build COMPLETED: bass', 'color: #32CD32; font-weight: bold;');
    return {
        connect: (dest) => master.connect(dest || output), disconnect: () => master.disconnect(),
        noteOn, noteOff, allNotesOff, setPreset: (p) => { allNotesOff(); currentPreset = p; },
        setParam: (k, v) => { if(k==='filterCutoff') lpf.frequency.value = v; },
        setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
        setExpression: (v) => master.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
        preset: currentPreset, type: 'bass'
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// GUITAR ENGINE (Gilmour-style Chain)
// ═══════════════════════════════════════════════════════════════════════════

const buildGuitarEngine = (
    ctx: AudioContext,
    preset: any,
    master: GainNode,
    reverb: ConvolverNode,
    instrumentGain: GainNode,
    expressionGain: GainNode
): Partial<InstrumentAPI> => {
    
    let currentPreset = { ...preset };
    
    const guitarInput = ctx.createGain();
    const pickupLPF = ctx.createBiquadFilter(); pickupLPF.type = 'lowpass';
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 80;
    const comp = ctx.createDynamicsCompressor();
    const shaper = ctx.createWaveShaper(); shaper.oversample = '4x';
    const compMakeup = ctx.createGain();
    const postHPF = ctx.createBiquadFilter(); postHPF.type = 'highpass'; postHPF.frequency.value = 80;
    const mid1 = ctx.createBiquadFilter(); mid1.type = 'peaking';
    const mid2 = ctx.createBiquadFilter(); mid2.type = 'peaking';
    const postLPF = ctx.createBiquadFilter(); postLPF.type = 'lowpass';
    const ph = makePhaser(ctx, { rate: 0.16, depth: 600, mix: 0.22 });
    const dA = makeFilteredDelay(ctx, { time: 0.38, fb: 0.28, hc: 3600, wet: 0.22 });
    const revSend = ctx.createGain();

    const updateNodes = (p: any) => {
        pickupLPF.frequency.value = p.pickup?.cutoff ?? 3600;
        pickupLPF.Q.value = p.pickup?.q ?? 1.0;
        shaper.curve = p.drive?.type === 'muff' ? makeMuff(p.drive?.amount ?? 0.6) : makeSoftClip(p.drive?.amount ?? 0.2);
        comp.threshold.value = p.comp?.threshold ?? -18;
        comp.ratio.value = p.comp?.ratio ?? 3;
        compMakeup.gain.value = dB(p.comp?.makeup ?? 3);
        if (p.post?.mids) {
            mid1.frequency.value = p.post.mids[0].f; mid1.gain.value = p.post.mids[0].g; mid1.Q.value = p.post.mids[0].q;
            mid2.frequency.value = p.post.mids[1].f; mid2.gain.value = p.post.mids[1].g; mid2.Q.value = p.post.mids[1].q;
        }
        postLPF.frequency.value = p.post?.lpf ?? 5000;
        revSend.gain.value = p.reverbMix ?? 0.2;
        instrumentGain.gain.value = p.volume ?? 0.7;
    };

    updateNodes(currentPreset);

    guitarInput.connect(pickupLPF).connect(hpf).connect(comp).connect(shaper).connect(postHPF).connect(mid1).connect(mid2).connect(postLPF).connect(ph.input);
    ph.output.connect(dA.input);
    dA.output.connect(expressionGain).connect(instrumentGain).connect(master);
    dA.output.connect(revSend).connect(reverb);

    const createPulseOsc = (freq: number, width = 0.5) => {
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) real[n] = (2/(n*Math.PI)) * Math.sin(n*Math.PI*width);
        const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
        const o = ctx.createOscillator(); o.setPeriodicWave(wave); o.frequency.value = freq; return o;
    };

    const activeVoices = new Map<number, { nodes: AudioNode[], voiceState: VoiceGain }>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(guitarInput);
        const voiceNodes: AudioNode[] = [voiceGain];
        const oscP = currentPreset.osc || { width: 0.45, detune: 5, mainGain: 0.85, detGain: 0.18, subGain: 0.25 };
        
        const xMain = createPulseOsc(f, oscP.width);
        const xDet = createPulseOsc(f, oscP.width + 0.06); xDet.detune.value = oscP.detune;
        const xSub = ctx.createOscillator(); xSub.type = 'sine'; xSub.frequency.value = f / 2;
        
        const gM = ctx.createGain(); gMain.gain.value = oscP.mainGain * velocity;
        const gD = ctx.createGain(); gDet.gain.value = oscP.detGain * velocity;
        const gS = ctx.createGain(); gSub.gain.value = oscP.subGain * velocity;

        xMain.connect(gM).connect(voiceGain); xDet.connect(gD).connect(voiceGain); xSub.connect(gS).connect(voiceGain);
        xMain.start(when); xDet.start(when); xSub.start(when);
        voiceNodes.push(xMain, xDet, xSub, gM, gD, gS);

        const adsr = currentPreset.adsr || { a: 0.006, d: 0.35, s: 0.6, r: 1.6 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { nodes: voiceNodes, voiceState });
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { r: 1.6 };
        const stopTime = triggerRelease(ctx, voice.voiceState, when, adsr.a, adsr.r);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
    };

    return { noteOn, noteOff, allNotesOff: () => activeVoices.forEach((_, m) => noteOff(m)), setPreset: (p) => { currentPreset = p; updateNodes(p); }, setParam: (k, v) => {} };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FACTORY
// ═══════════════════════════════════════════════════════════════════════════

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    cabinetIRUrl = null as string | null,
    plateIRUrl = null as string | null,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    
    console.log(`%c[InstrumentFactory] Building: ${type}`, 'color: #FFA500; font-weight: bold;');

    const master = ctx.createGain(); master.gain.value = 0.8;
    const instrumentGain = ctx.createGain();
    const baseVolume = preset.volume ?? DEFAULT_VOLUMES[preset.name || type] ?? 0.7;
    instrumentGain.gain.value = baseVolume;
    const expressionGain = ctx.createGain(); expressionGain.gain.value = 1.0;
    const reverb = ctx.createConvolver();
    
    if (plateIRUrl) {
        loadIR(ctx, plateIRUrl).then(buf => { if (buf) reverb.buffer = buf; });
    }
    reverb.connect(master);

    if (type === 'bass') {
        const engine = await buildBassEngine(ctx, preset, { output, plateIRUrl });
        return engine;
    } else if (type === 'organ') {
        const engine = await buildOrganEngine(ctx, preset, { output, plateIRUrl });
        return engine;
    } else if (type === 'guitar') {
        const engine = await buildGuitarEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
        return {
            connect: (dest) => master.connect(dest || output),
            disconnect: () => master.disconnect(),
            noteOn: engine.noteOn!, noteOff: engine.noteOff!, allNotesOff: engine.allNotesOff!,
            setPreset: engine.setPreset!, setParam: engine.setParam!,
            setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
            getVolume: () => instrumentGain.gain.value,
            setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
            setExpression: (v) => master.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
            preset, type: 'guitar'
        };
    } else {
        const engine = buildSynthEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
        console.log(`%c[InstrumentFactory] Build COMPLETED: synth`, 'color: #32CD32; font-weight: bold;');
        return {
            connect: (dest) => master.connect(dest || output),
            disconnect: () => master.disconnect(),
            noteOn: engine.noteOn!, noteOff: engine.noteOff!, allNotesOff: engine.allNotesOff!,
            setPreset: engine.setPreset!, setParam: engine.setParam!,
            setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
            getVolume: () => instrumentGain.gain.value,
            setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
            setExpression: (v) => master.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
            preset, type: 'synth'
        };
    }
}

const DEFAULT_VOLUMES: Record<string, number> = {
    synth: 0.7, bass: 0.75, organ: 0.65,
    organ_soft_jazz: 0.15
};
