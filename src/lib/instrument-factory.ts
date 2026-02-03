
// Fab v3.1 - "The Pure Tone" (Anti-vibration patch)
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
// ORGAN ENGINE — Hammond B3 Style (Pure Amplitude Leslie)
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

// #ЗАЧЕМ: Чистое амплитудное Лесли без задержек. Устраняет эффект "дилея с фидбэком".
const createPureLeslie = (ctx: AudioContext, config: any) => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    const hornAmp = ctx.createGain();
    const drumAmp = ctx.createGain();
    
    const lfo = ctx.createOscillator();
    const now = ctx.currentTime;
    
    // Амплитудная модуляция (дыхание)
    const hornMod = ctx.createGain(); hornMod.gain.value = 0.15;
    const drumMod = ctx.createGain(); drumMod.gain.value = 0.1;
    
    lfo.connect(hornMod).connect(hornAmp.gain);
    lfo.connect(drumMod).connect(drumAmp.gain);
    
    const speed = config.mode === 'fast' ? config.fast : config.slow;
    lfo.frequency.value = speed;
    lfo.start();
    
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
    
    input.connect(lp).connect(drumAmp).connect(output);
    input.connect(hp).connect(hornAmp).connect(output);
    
    return {
        input, output,
        setMode: (m: any) => {
            const target = m === 'fast' ? config.fast : (m === 'slow' ? config.slow : 0.01);
            lfo.frequency.setTargetAtTime(target, ctx.currentTime, config.accel);
        }
    };
};

async function buildOrganEngine(ctx: AudioContext, preset: any, options: any): Promise<InstrumentAPI> {
    const output = options.output || ctx.destination;
    let currentPreset = { ...preset };
    
    let tonewheelWave = createTonewheelWave(ctx, currentPreset.tonewheel || { complexity: 0 });
    let clickBuffer = createKeyClick(ctx, 0.005, currentPreset.keyClick ?? 0.003);
    
    const organSum = ctx.createGain();
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = currentPreset.lpf ?? 7600;
    
    // Чистое Лесли (без задержек!)
    const leslie = createPureLeslie(ctx, { 
        mode: currentPreset.leslie?.mode ?? 'slow', 
        slow: currentPreset.leslie?.slow ?? 0.65, 
        fast: currentPreset.leslie?.fast ?? 6.3, 
        accel: currentPreset.leslie?.accel ?? 0.7 
    });
    
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = currentPreset.volume ?? 0.7;
    const master = ctx.createGain(); master.gain.value = 0.8;
    
    organSum.connect(lpf).connect(leslie.input);
    leslie.output.connect(instrumentGain).connect(master).connect(output);
    
    const activeVoices = new Map<number, { nodes: AudioNode[], voiceState: VoiceGain }>();
    
    const noteOn = (midi: number, when: number = ctx.currentTime, velocity: number = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f0 = midiToHz(midi);
        const adsr = currentPreset.adsr || { a: 0.02, d: 0.2, s: 0.9, r: 0.3 };
        
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
        const voiceNodes: AudioNode[] = [voiceGain];
        const drawbars = currentPreset.drawbars || [8,0,8,5,0,3,0,0,0];
        
        drawbars.forEach((v: number, i: number) => {
            if (v > 0) {
                const osc = ctx.createOscillator(); osc.setPeriodicWave(tonewheelWave);
                osc.frequency.value = f0 * DRAWBAR_RATIOS[i];
                const g = ctx.createGain(); g.gain.value = (v/8) * 0.25;
                osc.connect(g).connect(voiceGain); osc.start(when);
                voiceNodes.push(osc, g);
            }
        });
        
        // Саб-бас слой
        if (currentPreset.osc) {
            currentPreset.osc.forEach((o: any) => {
                const sub = ctx.createOscillator(); sub.type = o.type; sub.frequency.value = f0 * Math.pow(2, o.octave || 0);
                const subG = ctx.createGain(); subG.gain.value = (o.gain ?? 0.3) * velocity;
                sub.connect(subG).connect(voiceGain); sub.start(when);
                voiceNodes.push(sub, subG);
            });
        }
        
        if (clickBuffer && activeVoices.size === 0) {
            const click = ctx.createBufferSource(); click.buffer = clickBuffer;
            const clickG = ctx.createGain(); clickG.gain.value = velocity * 0.4;
            click.connect(clickG).connect(voiceGain); click.start(when);
            voiceNodes.push(click, clickG);
        }
        
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { nodes: voiceNodes, voiceState });
    };
    
    const noteOff = (midi: number, when: number = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { r: 0.3 };
        const stopTime = triggerRelease(ctx, voice.voiceState, when, adsr.a, adsr.r);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) try { n.stop(stopTime + 0.1); } catch(e){} });
    };
    
    return {
        connect: (dest) => master.connect(dest || output), disconnect: () => master.disconnect(),
        noteOn, noteOff, allNotesOff: () => activeVoices.forEach((_, m) => noteOff(m)), 
        setPreset: (p) => { currentPreset = p; },
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
        const adsr = currentPreset.adsr || { a: 0.01, d: 0.15, s: 0.7, r: 0.25 };
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
// MAIN FACTORY
// ═══════════════════════════════════════════════════════════════════════════

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    plateIRUrl = null as string | null,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    const master = ctx.createGain(); master.gain.value = 0.8;
    const instrumentGain = ctx.createGain();
    instrumentGain.gain.value = preset.volume ?? 0.7;
    const expressionGain = ctx.createGain(); expressionGain.gain.value = 1.0;
    const reverb = ctx.createConvolver();
    if (plateIRUrl) {
        loadIR(ctx, plateIRUrl).then(buf => { if (buf) reverb.buffer = buf; });
    }
    reverb.connect(master);

    if (type === 'bass') {
        return await buildBassEngine(ctx, preset, { output, plateIRUrl });
    } else if (type === 'organ') {
        return await buildOrganEngine(ctx, preset, { output, plateIRUrl });
    } else {
        const engine = buildSynthEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
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
