
/**
 * #ЗАЧЕМ: Центральная фабрика для создания высококачественных инструментов V2.
 * #ЧТО: Реализует конвейеры синтеза для synth, organ, bass и guitar с гарантированным освобождением ресурсов.
 * #ИСПРАВЛЕНО (ПЛАН 35): Устранена утечка памяти во всех движках. Введен строгий протокол "Note Lifecycle":
 *              каждый voiceGain теперь ГАРАНТИРОВАННО отсоединяется от графа после завершения release.
 */

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

const makeTubeSaturation = (drive = 0.3, n = 8192) => {
    const curve = new Float32Array(n);
    const k = drive * 5 + 1;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        curve[i] = x >= 0 ? Math.tanh(k * x) : Math.tanh(k * x * 0.8) * 0.9;
    }
    return curve;
};

// ───── FX FACTORIES ─────

interface SimpleFX {
    input: GainNode;
    output: AudioNode;
    setMix: (m: number) => void;
    setParam?: (k: string, v: any) => void;
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
            const now = ctx.currentTime;
            wet.gain.setTargetAtTime(val, now, 0.02);
            dry.gain.setTargetAtTime(1 - val, now, 0.02);
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
            const now = ctx.currentTime;
            wet.gain.setTargetAtTime(val, now, 0.02);
            dry.gain.setTargetAtTime(1 - val, now, 0.02);
        }
    };
};

const createPureLeslie = (ctx: AudioContext, config: any): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    
    const hornAmp = ctx.createGain();
    const drumAmp = ctx.createGain();
    
    const hornLfo = ctx.createOscillator();
    const drumLfo = ctx.createOscillator();
    
    const hornMod = ctx.createGain(); hornMod.gain.value = 0.12;
    const drumMod = ctx.createGain(); drumMod.gain.value = 0.08;
    
    hornLfo.connect(hornMod).connect(hornAmp.gain);
    drumLfo.connect(drumMod).connect(drumAmp.gain);
    
    const initialSpeed = config.mode === 'fast' ? (config.fast || 6.3) : (config.slow || 0.65);
    hornLfo.frequency.value = initialSpeed;
    drumLfo.frequency.value = initialSpeed * 0.85;
    
    hornLfo.start();
    drumLfo.start();
    
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 800;
    
    input.connect(dry).connect(output);
    input.connect(lp).connect(drumAmp).connect(wet).connect(output);
    input.connect(hp).connect(hornAmp).connect(wet).connect(output);
    
    const mix = config.on ? (config.mix ?? 0.7) : 0;
    dry.gain.value = 1 - mix;
    wet.gain.value = mix;
    
    return {
        input, output,
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            const now = ctx.currentTime;
            wet.gain.setTargetAtTime(val, now, 0.02);
            dry.gain.setTargetAtTime(1 - val, now, 0.02);
        },
        setParam: (k, v) => {
            if (k === 'mode') {
                const target = v === 'fast' ? (config.fast || 6.3) : (v === 'slow' ? (config.slow || 0.65) : 0.01);
                const now = ctx.currentTime;
                hornLfo.frequency.setTargetAtTime(target, now, 0.7);
                drumLfo.frequency.setTargetAtTime(target * 0.85, now, 2.5);
            }
        }
    };
};

const makeTremolo = (ctx: AudioContext, rate = 5.5, depth = 0.4, mix = 0): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    
    dry.gain.value = 1 - mix;
    wet.gain.value = mix;

    const panner = ctx.createStereoPanner();
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = rate;
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = depth;
    lfo.connect(lfoGain).connect(panner.pan);
    lfo.start();

    input.connect(dry).connect(output);
    input.connect(panner).connect(wet).connect(output);

    return {
        input, output,
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            const now = ctx.currentTime;
            wet.gain.setTargetAtTime(val, now, 0.02);
            dry.gain.setTargetAtTime(1 - val, now, 0.02);
        },
        setParam: (k, v) => {
            const now = ctx.currentTime;
            if (k === 'rate') lfo.frequency.setTargetAtTime(v, now, 0.1);
            if (k === 'depth') lfoGain.gain.setTargetAtTime(v, now, 0.1);
        }
    };
};

// ───── ADSR HELPER ─────

interface VoiceState {
    node: GainNode;
    startTime: number;
}

const triggerAttack = (
    ctx: AudioContext,
    gain: GainNode,
    when: number,
    a: number, d: number, s: number,
    velocity = 1
): VoiceState => {
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
    voiceState: VoiceState,
    when: number,
    a: number, r: number
): number => {
    const release = Math.max(r, 0.02);
    const elapsed = when - voiceState.startTime;
    
    voiceState.node.gain.cancelScheduledValues(when);
    
    if (elapsed < a) {
        const current = voiceState.node.gain.value;
        voiceState.node.gain.setValueAtTime(current, when);
        voiceState.node.gain.setTargetAtTime(0.0001, when, 0.02);
        return when + 0.05;
    } else {
        voiceState.node.gain.setValueAtTime(voiceState.node.gain.value, when);
        voiceState.node.gain.setTargetAtTime(0.0001, when, release / 3);
        return when + release;
    }
};

// ───── KEY CLICK HELPER ─────

const createKeyClick = (ctx: AudioContext, duration: number, intensity: number): AudioBuffer => {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.exp(-t * 30) * (1 - t);
        const noise = (Math.random() * 2 - 1) * 0.6;
        const tone = Math.sin(i * 0.15) * 0.4;
        data[i] = (noise + tone) * envelope * intensity;
    }
    return buffer;
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
// INSTRUMENT ENGINES
// ═══════════════════════════════════════════════════════════════════════════

// 1. SYNTH ENGINE
const buildSynthEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    console.log(`%c[Factory] Pipeline: Synth - Building subtractive chain with Cleanup protocol`, 'color: #87CEEB;');
    let currentPreset = { ...preset };
    
    const comp = ctx.createDynamicsCompressor();
    const compMakeup = ctx.createGain();
    const filt1 = ctx.createBiquadFilter();
    
    const leslie = createPureLeslie(ctx, currentPreset.leslie || { on: false });
    const tremolo = makeTremolo(ctx, currentPreset.tremolo?.rate ?? 5.5, currentPreset.tremolo?.depth ?? 0.4, currentPreset.tremolo?.on ? (currentPreset.tremolo?.mix ?? 0.5) : 0);
    const chorus = makeChorus(ctx, currentPreset.chorus?.rate ?? 0.3, currentPreset.chorus?.depth ?? 0.004, currentPreset.chorus?.on ? (currentPreset.chorus?.mix ?? 0.3) : 0);
    const delay = makeDelay(ctx, currentPreset.delay?.time ?? 0.35, currentPreset.delay?.fb ?? 0.25, currentPreset.delay?.hc ?? 3000, currentPreset.delay?.on ? (currentPreset.delay?.mix ?? 0.2) : 0);
    const revSend = ctx.createGain();

    comp.connect(compMakeup).connect(filt1);
    filt1.connect(leslie.input);
    leslie.output.connect(tremolo.input);
    tremolo.output.connect(chorus.input);
    chorus.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);

    const activeVoices = new Map<number, { voiceGain: GainNode, voiceState: VoiceState, nodes: AudioNode[] }>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(comp);
        const voiceNodes: AudioNode[] = [voiceGain];
        const oscConfig = currentPreset.osc || [{ type: 'sawtooth', gain: 0.5, octave: 0 }];
        
        oscConfig.forEach((o: any) => {
            const osc = ctx.createOscillator(); osc.type = o.type; osc.frequency.value = f * Math.pow(2, o.octave || 0);
            osc.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, Math.random()])));
            const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.5) * velocity;
            osc.connect(g).connect(voiceGain); osc.start(when);
            voiceNodes.push(osc, g);
        });
        
        const adsr = currentPreset.adsr || { a: 0.1, d: 0.2, s: 0.7, r: 0.5 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { voiceGain, voiceState, nodes: voiceNodes });
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.1, currentPreset.adsr?.r || 0.5);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) n.stop(stopTime + 0.1); });
        // #ИСПРАВЛЕНО: Гарантированный разрыв цепи
        setTimeout(() => { try { voice.voiceGain.disconnect(); } catch(e){} }, (stopTime - ctx.currentTime + 0.2) * 1000);
    };

    return { 
        noteOn, noteOff, 
        allNotesOff: () => activeVoices.forEach((_, m) => noteOff(m)), 
        setPreset: (p: any) => { 
            currentPreset = p; 
            leslie.setMix(p.leslie?.on ? (p.leslie.mix ?? 0.7) : 0);
            if (p.leslie?.mode) leslie.setParam!('mode', p.leslie.mode);
            tremolo.setMix(p.tremolo?.on ? (p.tremolo.mix ?? 0.5) : 0);
            chorus.setMix(p.chorus?.on ? (p.chorus.mix ?? 0.3) : 0);
            delay.setMix(p.delay?.on ? (p.delay.mix ?? 0.2) : 0);
        }, 
        setParam: (k: string, v: any) => {
            if (k === 'leslie') leslie.setParam!('mode', v);
        } 
    };
};

// 2. ORGAN ENGINE
const buildOrganEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    console.log(`%c[Factory] Pipeline: Organ - Building Leakage-free chain with Click Cleanup`, 'color: #DEB887;');
    let currentPreset = { ...preset };
    const organSum = ctx.createGain();
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = currentPreset.lpf ?? 7600;
    
    const leslie = createPureLeslie(ctx, { 
        on: true,
        mode: currentPreset.leslie?.mode ?? 'slow', 
        slow: currentPreset.leslie?.slow ?? 0.65, 
        fast: currentPreset.leslie?.fast ?? 6.3, 
        accel: currentPreset.leslie?.accel ?? 0.7 
    });
    
    organSum.connect(lpf).connect(leslie.input);
    leslie.output.connect(expressionGain).connect(instrumentGain).connect(master);
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.1;
    leslie.output.connect(revSend).connect(reverb);

    const activeVoices = new Map<number, { voiceGain: GainNode, voiceState: VoiceState, nodes: AudioNode[] }>();
    const tonewheelWave = ctx.createPeriodicWave(new Float32Array([0, 1, 0.02, 0.01]), new Float32Array(4));
    const clickBuffer = createKeyClick(ctx, 0.005, currentPreset.keyClick ?? 0.003);

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f0 = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
        const voiceNodes: AudioNode[] = [voiceGain];
        const drawbars = currentPreset.drawbars || [8,0,8,5,0,3,0,0,0];
        
        drawbars.forEach((v: number, i: number) => {
            if (v > 0) {
                const osc = ctx.createOscillator();
                osc.frequency.value = f0 * DRAWBAR_RATIOS[i];
                osc.setPeriodicWave(ctx.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, Math.random()])));
                const g = ctx.createGain(); g.gain.value = (v/8) * 0.25;
                osc.connect(g).connect(voiceGain); osc.start(when);
                voiceNodes.push(osc, g);
            }
        });
        
        if (clickBuffer && activeVoices.size === 0) {
            const click = ctx.createBufferSource(); click.buffer = clickBuffer;
            const clickG = ctx.createGain(); clickG.gain.value = velocity * 0.4;
            click.connect(clickG).connect(voiceGain); click.start(when);
            voiceNodes.push(click, clickG);
        }
        const adsr = currentPreset.adsr || { a: 0.02, d: 0.2, s: 0.9, r: 0.3 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { voiceGain, voiceState, nodes: voiceNodes });
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.02, currentPreset.adsr?.r || 0.3);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) try { n.stop(stopTime + 0.1); } catch(e){} });
        setTimeout(() => { try { voice.voiceGain.disconnect(); } catch(e){} }, (stopTime - ctx.currentTime + 0.2) * 1000);
    };

    return { noteOn, noteOff, allNotesOff: () => activeVoices.forEach((_, m) => noteOff(m)), setPreset: (p: any) => { currentPreset = p; leslie.setParam!('mode', p.leslie?.mode); }, setParam: (k: string, v: any) => { if(k==='leslie') leslie.setParam!('mode', v); } };
};

// 3. BASS ENGINE
const buildBassEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    console.log(`%c[Factory] Pipeline: Bass - Building foundation with Full Cleanup protocol`, 'color: #4169E1;');
    let currentPreset = { ...preset };
    const bassSum = ctx.createGain();
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 35;
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = currentPreset.filter?.cutoff ?? 1200;
    const shaper = ctx.createWaveShaper(); shaper.curve = makeTubeSaturation(0.2);
    const driveMix = ctx.createGain(); driveMix.gain.value = currentPreset.drive?.on ? 0.5 : 0;
    const dryMix = ctx.createGain(); dryMix.gain.value = 1;
    bassSum.connect(hpf).connect(lpf).connect(shaper).connect(driveMix);
    lpf.connect(dryMix);
    const finalChain = ctx.createGain(); driveMix.connect(finalChain); dryMix.connect(finalChain);
    finalChain.connect(expressionGain).connect(instrumentGain).connect(master);
    
    const activeVoices = new Map<number, { voiceGain: GainNode, voiceState: VoiceState, nodes: AudioNode[] }>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
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
        const adsr = currentPreset.adsr || { a: 0.01, d: 0.15, s: 0.7, r: 0.25 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { voiceGain, voiceState, nodes: voiceNodes });
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.01, currentPreset.adsr?.r || 0.25);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
        // #ИСПРАВЛЕНО (ПЛАН 35): Добавлено отсоединение gain ноды для баса. Раньше здесь была утечка!
        setTimeout(() => { try { voice.voiceGain.disconnect(); } catch(e){} }, (stopTime - ctx.currentTime + 0.2) * 1000);
    };

    return { noteOn, noteOff, allNotesOff: () => activeVoices.forEach((_, m) => noteOff(m)), setPreset: (p: any) => { currentPreset = p; }, setParam: (k: string, v: any) => {} };
};

// 4. GUITAR ENGINE
const buildGuitarEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    console.log(`%c[Factory] Pipeline: Guitar - Building chain with Leak Prevention`, 'color: #DA70D6;');
    let currentPreset = { ...preset };
    const input = ctx.createGain();
    const pickupLPF = ctx.createBiquadFilter(); pickupLPF.type = 'lowpass'; pickupLPF.frequency.value = 3600;
    const shaper = ctx.createWaveShaper(); shaper.curve = makeSoftClip(0.3);
    const chorus = makeChorus(ctx, 0.15, 0.005, 0.3);
    const delay = makeDelay(ctx, 0.35, 0.3, 3500, 0.25);

    input.connect(pickupLPF).connect(shaper).connect(chorus.input);
    chorus.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);

    const activeVoices = new Map<number, { voiceGain: GainNode, voiceState: VoiceState, nodes: AudioNode[] }>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(input);
        const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = f;
        osc.connect(voiceGain); osc.start(when);
        const adsr = currentPreset.adsr || { a: 0.005, d: 0.3, s: 0.6, r: 1.5 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { voiceGain, voiceState, nodes: [osc] });
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.005, currentPreset.adsr?.r || 1.5);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) n.stop(stopTime + 0.1); });
        setTimeout(() => { try { voice.voiceGain.disconnect(); } catch(e){} }, (stopTime - ctx.currentTime + 0.2) * 1000);
    };

    return { noteOn, noteOff, allNotesOff: () => activeVoices.forEach((_, m) => noteOff(m)), setPreset: (p: any) => { currentPreset = p; }, setParam: (k: string, v: any) => {} };
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
    
    console.log(`%c[Factory] Building Master Multi-Instrument: ${type}`, 'color: #FFA500; font-weight: bold;');
    
    const master = ctx.createGain(); master.gain.value = 0.8;
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = preset.volume ?? 0.7;
    const expressionGain = ctx.createGain(); expressionGain.gain.value = 1.0;
    
    const reverb = ctx.createConvolver();
    if (plateIRUrl) {
        loadIR(ctx, plateIRUrl).then(buf => { if (buf) reverb.buffer = buf; });
    }
    reverb.connect(master);

    let engine: any;
    if (type === 'bass') {
        engine = buildBassEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    } else if (type === 'organ') {
        engine = buildOrganEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    } else if (type === 'guitar') {
        engine = buildGuitarEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    } else {
        engine = buildSynthEngine(ctx, preset, master, reverb, instrumentGain, expressionGain);
    }

    master.connect(output);

    return {
        connect: (dest) => master.connect(dest || output),
        disconnect: () => { try { master.disconnect(); } catch(e){} },
        noteOn: engine.noteOn,
        noteOff: engine.noteOff,
        allNotesOff: engine.allNotesOff,
        setPreset: engine.setPreset,
        setParam: engine.setParam,
        setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
        setExpression: (v) => expressionGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
        preset,
        type
    };
}
