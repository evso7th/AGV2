/**
 * #ЗАЧЕМ: Центральная фабрика для создания высококачественных инструментов V2.
 * #ЧТО: Реализует конвейеры синтеза для synth, organ, bass и guitar.
 * #ОБНОВЛЕНО (ПЛАН 84.1): Внедрена винтажная кривая дисторшна (Arctan-Sinh) и Notch-фильтр 1000Гц 
 *          для очистки тембра гитары на основе рекомендаций из webaudio_guitar.txt.
 * #СВЯЗИ: Используется менеджерами V2 для создания экземпляров инструментов.
 */

// ───── MONITORING ─────

let globalActiveVoices = 0;
if (typeof window !== 'undefined') {
    setInterval(() => {
        if (globalActiveVoices > 0) {
            console.log(`%c[AudioMonitor] Active Voices: ${globalActiveVoices}`, 'color: #00FF00; font-weight: bold;');
        }
    }, 2000);
}

// ───── CONSTANTS ─────

const DRAWBAR_RATIOS = [0.5, 1.5, 1, 2, 3, 4, 5, 6, 8];

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

/**
 * #ЗАЧЕМ: Реализация сложной сигмоиды для теплого, винтажного перегруза.
 * #ЧТО: Использует Arctan-Sinh формулу из webaudio_guitar.txt.
 */
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
    setParam?: (k: string, v: any) => void;
}

const makeChorus = (ctx: AudioContext, options: {rate?: number, depth?: number, mix?: number} = {}): SimpleFX => {
    const rate = options.rate ?? 0.3;
    const depth = options.depth ?? 0.004;
    const mix = options.mix ?? 0.3;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const delay = ctx.createDelay(0.05); delay.delayTime.value = 0.015;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = depth;
    lfo.connect(lfoGain).connect(delay.delayTime); lfo.start();
    input.connect(dry).connect(output); input.connect(delay).connect(wet).connect(output);
    return {
        input, output,
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

const makePhaser = (ctx: AudioContext, options: {stages?: number, base?: number, depth?: number, rate?: number, fb?: number, mix?: number} = {}): SimpleFX => {
    const stages = options.stages ?? 4;
    const base = options.base ?? 800;
    const depth = options.depth ?? 600;
    const rate = options.rate ?? 0.16;
    const fb = options.fb ?? 0.12;
    const mix = options.mix ?? 0.2;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const filters: BiquadFilterNode[] = [];
    let head: AudioNode = input;
    for (let i = 0; i < stages; i++) {
        const ap = ctx.createBiquadFilter(); ap.type = 'allpass';
        ap.frequency.value = base * ((i % 2) ? 1.2 : 0.8); ap.Q.value = 0.6;
        head.connect(ap); head = ap; filters.push(ap);
    }
    const fbG = ctx.createGain(); fbG.gain.value = fb; filters[filters.length - 1].connect(fbG); fbG.connect(filters[0]);
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = depth;
    lfo.connect(lfoGain); filters.forEach(f => lfoGain.connect(f.frequency)); lfo.start();
    input.connect(dry).connect(output); filters[filters.length - 1].connect(wet).connect(output);
    return {
        input, output,
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

const makeDelay = (ctx: AudioContext, options: {time?: number, fb?: number, hc?: number, wet?: number} = {}): SimpleFX => {
    const time = options.time ?? 0.35;
    const fb = options.fb ?? 0.25;
    const hc = options.hc ?? 3000;
    const mix = options.wet ?? 0.2;

    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const delayNode = ctx.createDelay(2); delayNode.delayTime.value = time;
    const feedback = ctx.createGain(); feedback.gain.value = fb;
    const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = hc;
    input.connect(dry).connect(output); input.connect(delayNode).connect(filter).connect(feedback).connect(delayNode);
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

const createPureLeslie = (ctx: AudioContext, config: any): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const wet = ctx.createGain(); 
    const hornAmp = ctx.createGain();
    const drumAmp = ctx.createGain();
    const hornLfo = ctx.createOscillator();
    const drumLfo = ctx.createOscillator();
    const hornMod = ctx.createGain(); hornMod.gain.value = 0.08;
    const drumMod = ctx.createGain(); drumMod.gain.value = 0.05;
    hornLfo.connect(hornMod).connect(hornAmp.gain);
    drumLfo.connect(drumMod).connect(drumAmp.gain);
    const initialSpeed = config.mode === 'fast' ? (config.fast || 6.3) : (config.slow || 0.65);
    hornLfo.frequency.value = initialSpeed;
    drumLfo.frequency.value = initialSpeed * 0.85;
    hornLfo.start(); drumLfo.start();
    const lp = ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value = 800;
    const hp = ctx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = 800;
    input.connect(lp).connect(drumAmp).connect(wet).connect(output);
    input.connect(hp).connect(hornAmp).connect(wet).connect(output);
    return {
        input, output,
        setMix: (m) => { wet.gain.setTargetAtTime(clamp(m, 0, 1), ctx.currentTime, 0.02); },
        setParam: (k, v) => {
            if (k === 'mode') {
                const target = v === 'fast' ? (config.fast || 6.3) : (v === 'slow' ? (config.slow || 0.65) : 0.01);
                hornLfo.frequency.setTargetAtTime(target, ctx.currentTime, 0.7);
                drumLfo.frequency.setTargetAtTime(target * 0.85, ctx.currentTime, 2.5);
            }
        }
    };
};

const makeTremolo = (ctx: AudioContext, rate = 5.5, depth = 0.4, mix = 0): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1 - mix;
    const wet = ctx.createGain(); wet.gain.value = mix;
    const panner = ctx.createStereoPanner();
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = depth;
    lfo.connect(lfoGain).connect(panner.pan); lfo.start();
    input.connect(dry).connect(output); input.connect(panner).connect(wet).connect(output);
    return {
        input, output,
        setMix: (m) => {
            const val = clamp(m, 0, 1);
            wet.gain.setTargetAtTime(val, ctx.currentTime, 0.02);
            dry.gain.setTargetAtTime(1 - val, ctx.currentTime, 0.02);
        }
    };
};

// ───── NOTE LIFECYCLE HELPERS ─────

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

const createKeyClick = (ctx: AudioContext, duration: number, intensity: number): AudioBuffer => {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.exp(-t * 30) * (1 - t);
        data[i] = (Math.random() * 2 - 1) * envelope * intensity;
    }
    return buffer;
};

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUMENT API INTERFACE
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
    const comp = ctx.createDynamicsCompressor();
    const filt1 = ctx.createBiquadFilter();
    const leslie = createPureLeslie(ctx, currentPreset.leslie || { on: false });
    const tremolo = makeTremolo(ctx, currentPreset.tremolo?.rate ?? 5.5, currentPreset.tremolo?.depth ?? 0.4, currentPreset.tremolo?.on ? (currentPreset.tremolo?.mix ?? 0.5) : 0);
    const chorus = makeChorus(ctx, { rate: currentPreset.chorus?.rate ?? 0.3, depth: currentPreset.chorus?.depth ?? 0.004, mix: currentPreset.chorus?.on ? (currentPreset.chorus.mix ?? 0.3) : 0 });
    const delay = makeDelay(ctx, { time: currentPreset.delay?.time ?? 0.35, fb: currentPreset.delay?.fb ?? 0.25, hc: 3000, wet: currentPreset.delay?.on ? (currentPreset.delay.mix ?? 0.2) : 0 });
    const revSend = ctx.createGain();

    comp.connect(filt1).connect(leslie.input);
    leslie.output.connect(tremolo.input);
    tremolo.output.connect(chorus.input);
    chorus.output.connect(delay.input);
    delay.output.connect(expressionGain).connect(instrumentGain).connect(master);
    delay.output.connect(revSend).connect(reverb);

    const activeVoices = new Map<number, any>();
    const allActiveVoices = new Set<any>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        globalActiveVoices++;
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(comp);
        const voiceNodes: AudioNode[] = [voiceGain];
        const oscConfig = currentPreset.osc || [{ type: 'sawtooth', gain: 0.5, octave: 0 }];
        
        oscConfig.forEach((o: any) => {
            const osc = ctx.createOscillator(); osc.type = o.type; osc.frequency.value = f * Math.pow(2, o.octave || 0);
            const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.5) * velocity;
            osc.connect(g).connect(voiceGain); osc.start(when);
            voiceNodes.push(osc, g);
        });

        const adsr = currentPreset.adsr || { a: 0.1, d: 0.2, s: 0.7, r: 0.5 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        const voiceRecord = { midi, voiceGain, voiceState, nodes: voiceNodes, cleaned: false };
        allActiveVoices.add(voiceRecord);

        if (duration) {
            const stopTime = triggerRelease(ctx, voiceState, when + duration, adsr.a, adsr.r);
            voiceNodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
            setTimeout(() => {
                deepCleanup(voiceRecord, allActiveVoices);
            }, ((stopTime - ctx.currentTime) * 1000) + 500);
        } else {
            if (activeVoices.has(midi)) noteOff(midi, when);
            activeVoices.set(midi, voiceRecord);
        }
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsrR = currentPreset.adsr?.r || 0.5;
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.1, adsrR);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
        setTimeout(() => { deepCleanup(voice, allActiveVoices); }, ((stopTime - ctx.currentTime) * 1000) + 500);
    };

    return { 
        noteOn, noteOff, 
        allNotesOff: () => {
            allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices));
            activeVoices.clear(); allActiveVoices.clear(); globalActiveVoices = 0;
        },
        setPreset: (p: any) => { 
            currentPreset = p; 
            leslie.setMix(p.leslie?.on ? (p.leslie.mix ?? 0.7) : 0); 
            tremolo.setMix(p.tremolo?.on ? (p.tremolo.mix ?? 0.5) : 0); 
            chorus.setMix(p.chorus?.on ? (p.chorus.mix ?? 0.3) : 0); 
            delay.setMix(p.delay?.on ? (p.delay.mix ?? 0.2) : 0); 
        }, 
        setParam: (k: string, v: any) => { if(k==='leslie') leslie.setParam!('mode', v); } 
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// ORGAN ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const buildOrganEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const organSum = ctx.createGain();
    const leslie = createPureLeslie(ctx, { on: true, mode: currentPreset.leslie?.mode ?? 'slow' });
    organSum.connect(leslie.input);
    leslie.output.connect(expressionGain).connect(instrumentGain).connect(master);
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix ?? 0.1;
    leslie.output.connect(revSend).connect(reverb);

    const tonewheelWave = ctx.createPeriodicWave(new Float32Array([0, 1, 0.02, 0.01]), new Float32Array(4));
    const activeVoices = new Map<number, any>();
    const allActiveVoices = new Set<any>();
    const clickBuffer = createKeyClick(ctx, 0.005, currentPreset.keyClick ?? 0.003);

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        globalActiveVoices++;
        const f0 = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
        const voiceNodes: AudioNode[] = [voiceGain];
        const drawbars = currentPreset.drawbars || [8,0,8,5,0,3,0,0,0];
        
        drawbars.forEach((v: number, i: number) => {
            if (v > 0) {
                const osc = ctx.createOscillator();
                osc.setPeriodicWave(tonewheelWave);
                let freq = f0 * DRAWBAR_RATIOS[i];
                while (freq > 6000) freq /= 2;
                osc.frequency.value = freq;
                const g = ctx.createGain(); g.gain.value = (v/8) * 0.25;
                osc.connect(g).connect(voiceGain); osc.start(when);
                voiceNodes.push(osc, g);
            }
        });

        if (clickBuffer && allActiveVoices.size === 0) { 
            const click = ctx.createBufferSource(); click.buffer = clickBuffer;
            const clickG = ctx.createGain(); clickG.gain.value = velocity * 0.4;
            click.connect(clickG).connect(voiceGain); click.start(when);
            voiceNodes.push(click, clickG);
        }

        const adsr = currentPreset.adsr || { a: 0.02, d: 0.2, s: 0.9, r: 1.2 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        const voiceRecord = { midi, voiceGain, voiceState, nodes: voiceNodes, cleaned: false };
        allActiveVoices.add(voiceRecord);

        if (duration) {
            const stopTime = triggerRelease(ctx, voiceState, when + duration, adsr.a, adsr.r);
            voiceNodes.forEach(n => { if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) try { n.stop(stopTime + 0.1); } catch(e){} });
            setTimeout(() => {
                deepCleanup(voiceRecord, allActiveVoices);
            }, ((stopTime - ctx.currentTime) * 1000) + 500);
        } else {
            if (activeVoices.has(midi)) noteOff(midi, when);
            activeVoices.set(midi, voiceRecord);
        }
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsrR = currentPreset.adsr?.r || 1.2;
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.02, adsrR);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) try { n.stop(stopTime + 0.1); } catch(e){} });
        setTimeout(() => { deepCleanup(voice, allActiveVoices); }, ((stopTime - ctx.currentTime) * 1000) + 500);
    };

    return { 
        noteOn, noteOff, 
        allNotesOff: () => {
            allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices));
            activeVoices.clear(); allActiveVoices.clear(); globalActiveVoices = 0;
        },
        setPreset: (p: any) => { currentPreset = p; leslie.setParam!('mode', p.leslie?.mode); }, 
        setParam: (k: string, v: any) => { if(k==='leslie') leslie.setParam!('mode', v); } 
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
    const activeVoices = new Map<number, any>();
    const allActiveVoices = new Set<any>();

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        globalActiveVoices++;
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
        const voiceRecord = { midi, voiceGain, voiceState, nodes: voiceNodes, cleaned: false };
        allActiveVoices.add(voiceRecord);

        if (duration) {
            const stopTime = triggerRelease(ctx, voiceState, when + duration, adsr.a, adsr.r);
            voiceNodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
            setTimeout(() => {
                deepCleanup(voiceRecord, allActiveVoices);
            }, ((stopTime - ctx.currentTime) * 1000) + 500);
        } else {
            if (activeVoices.has(midi)) noteOff(midi, when);
            activeVoices.set(midi, voiceRecord);
        }
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsrR = currentPreset.adsr?.r || 0.25;
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.01, adsrR);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
        setTimeout(() => { deepCleanup(voice, allActiveVoices); }, ((stopTime - ctx.currentTime) * 1000) + 500);
    };

    return { 
        noteOn, noteOff, 
        allNotesOff: () => {
            allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices));
            activeVoices.clear(); allActiveVoices.clear(); globalActiveVoices = 0;
        },
        setPreset: (p: any) => { currentPreset = p; }, 
        setParam: (k: string, v: any) => {} 
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// GUITAR ENGINE
// ═══════════════════════════════════════════════════════════════════════════

const buildGuitarEngine = (ctx: AudioContext, preset: any, master: GainNode, reverb: ConvolverNode, instrumentGain: GainNode, expressionGain: GainNode) => {
    let currentPreset = { ...preset };
    const pickBuffer = createKeyClick(ctx, 0.03, 0.6);
    const guitarInput = ctx.createGain();
    
    const pickupComb = ctx.createDelay(0.01);
    pickupComb.delayTime.value = 0.0025;
    const combFeedback = ctx.createGain();
    combFeedback.gain.value = currentPreset.pickup?.combFeedback ?? 0.3;
    pickupComb.connect(combFeedback).connect(pickupComb);

    const pickupLPF = ctx.createBiquadFilter(); pickupLPF.type = 'lowpass'; pickupLPF.frequency.value = currentPreset.pickup?.cutoff || 3600;
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = 90;
    
    // #ЗАЧЕМ: Устранение "носовых" частот для более аутентичного гитарного тона.
    const cutNasal = ctx.createBiquadFilter(); 
    cutNasal.type = 'notch'; 
    cutNasal.frequency.value = 1000; 
    cutNasal.Q.value = 4;

    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = currentPreset.comp?.threshold || -18;
    const shaper = ctx.createWaveShaper(); shaper.oversample = '4x';
    const compMakeup = ctx.createGain(); compMakeup.gain.value = dB(currentPreset.comp?.makeup || 3);
    
    const mid1 = ctx.createBiquadFilter(); mid1.type = 'peaking'; mid1.frequency.value = currentPreset.post?.mids?.[0]?.f || 850; mid1.gain.value = currentPreset.post?.mids?.[0]?.g || 2;
    const mid2 = ctx.createBiquadFilter(); mid2.type = 'peaking'; mid2.frequency.value = currentPreset.post?.mids?.[1]?.f || 2500; mid2.gain.value = currentPreset.post?.mids?.[1]?.g || -1.5;
    const postLPF = ctx.createBiquadFilter(); postLPF.type = 'lowpass'; postLPF.frequency.value = currentPreset.post?.lpf || 5000;
    const cabinetLS = ctx.createBiquadFilter(); cabinetLS.type = 'lowshelf'; cabinetLS.frequency.value = 120; cabinetLS.gain.value = 3;

    const ph = makePhaser(ctx, { rate: currentPreset.phaser?.rate || 0.16, depth: currentPreset.phaser?.depth || 600, mix: currentPreset.phaser?.on ? (currentPreset.phaser.mix || 0.2) : 0 });
    const dA = makeDelay(ctx, { time: currentPreset.delayA?.time || 0.38, fb: currentPreset.delayA?.fb || 0.28, hc: 3600, wet: currentPreset.delayA?.on ? (currentPreset.delayA.mix || 0.2) : 0 });
    const dB_node = makeDelay(ctx, { time: currentPreset.delayB?.time || 0.52, fb: currentPreset.delayB?.fb || 0.22, hc: 3600, wet: currentPreset.delayB?.on ? (currentPreset.delayB.mix || 0.1) : 0 });
    const revSend = ctx.createGain(); revSend.gain.value = currentPreset.reverbMix || 0.18;

    guitarInput.connect(pickupComb).connect(pickupLPF).connect(hpf);
    // Интеграция Notch-фильтра после Distortion
    hpf.connect(comp).connect(shaper).connect(cutNasal).connect(compMakeup).connect(mid1).connect(mid2).connect(postLPF).connect(cabinetLS).connect(ph.input);
    ph.output.connect(dA.input); ph.output.connect(dB_node.input);
    const fxChainOut = ctx.createGain();
    ph.output.connect(fxChainOut); dA.output.connect(fxChainOut); dB_node.output.connect(fxChainOut);
    fxChainOut.connect(expressionGain).connect(instrumentGain).connect(master);
    fxChainOut.connect(revSend).connect(reverb);

    const activeVoices = new Map<number, any>();
    const allActiveVoices = new Set<any>();

    const createPulseOsc = (freq: number, width = 0.5) => {
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * width);
        const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
        const o = ctx.createOscillator(); o.setPeriodicWave(wave); o.frequency.value = freq; return o;
    };

    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0, duration?: number) => {
        globalActiveVoices++;
        const f = midiToHz(midi);
        const oscP = currentPreset.osc || { width: 0.45, mainGain: 0.8, detGain: 0.2, subGain: 0.25 };
        
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(guitarInput);
        const voiceNodes: AudioNode[] = [voiceGain];

        if (pickBuffer) {
            const pick = ctx.createBufferSource(); pick.buffer = pickBuffer;
            const pickG = ctx.createGain(); pickG.gain.value = velocity * 0.175 * 0.5;
            pick.connect(pickG).connect(voiceGain); pick.start(when); pick.stop(when + 0.05);
            voiceNodes.push(pick, pickG);
        }

        const oscMain = createPulseOsc(f, oscP.width || 0.45);
        const oscDet = createPulseOsc(f, (oscP.width || 0.45) + 0.06); oscDet.detune.value = oscP.detune || 5;
        const oscSub = ctx.createOscillator(); oscSub.type = 'sine'; oscSub.frequency.value = f / 2;
        const gMain = ctx.createGain(); gMain.gain.value = (oscP.mainGain || 0.8) * velocity;
        const gDet = ctx.createGain(); gDet.gain.value = (oscP.detGain || 0.2) * velocity;
        const gSub = ctx.createGain(); gSub.gain.value = (oscP.subGain || 0.25) * velocity;
        oscMain.connect(gMain).connect(voiceGain); oscDet.connect(gDet).connect(voiceGain); oscSub.connect(gSub).connect(voiceGain);
        oscMain.start(when); oscDet.start(when); oscSub.start(when);
        voiceNodes.push(oscMain, oscDet, oscSub, gMain, gDet, gSub);

        const adsr = currentPreset.adsr || { a: 0.005, d: 0.3, s: 0.6, r: 1.5 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity * 0.175);
        const voiceRecord = { midi, voiceGain, voiceState, nodes: voiceNodes, cleaned: false };
        allActiveVoices.add(voiceRecord);

        if (duration) {
            const stopTime = triggerRelease(ctx, voiceState, when + duration, adsr.a, adsr.r);
            voiceNodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
            setTimeout(() => { deepCleanup(voiceRecord, allActiveVoices); }, ((stopTime - ctx.currentTime) * 1000) + 500);
        } else {
            if (activeVoices.has(midi)) noteOff(midi, when);
            activeVoices.set(midi, voiceRecord);
        }
    };

    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
        const adsrR = currentPreset.adsr?.r || 1.5;
        const stopTime = triggerRelease(ctx, voice.voiceState, when, currentPreset.adsr?.a || 0.005, adsrR);
        voice.nodes.forEach(n => { if (n instanceof OscillatorNode) try { n.stop(stopTime + 0.1); } catch(e){} });
        setTimeout(() => { deepCleanup(voice, allActiveVoices); }, ((stopTime - ctx.currentTime) * 1000) + 500);
    };

    const updateGuitarNodes = (p: any) => {
        pickupLPF.frequency.setTargetAtTime(p.pickup?.cutoff || 3600, ctx.currentTime, 0.05);
        combFeedback.gain.setTargetAtTime(p.pickup?.combFeedback ?? 0.3, ctx.currentTime, 0.05);
        
        comp.threshold.setTargetAtTime(p.comp?.threshold || -18, ctx.currentTime, 0.05);
        comp.ratio.setTargetAtTime(p.comp?.ratio || 3, ctx.currentTime, 0.05);
        compMakeup.gain.setTargetAtTime(dB(p.comp?.makeup || 3), ctx.currentTime, 0.05);

        // Интеллектуальный выбор кривой дисторшна
        if (p.drive?.type === 'muff') {
            shaper.curve = makeMuff(p.drive.amount || 0.65);
        } else if (p.drive?.type === 'vintage') {
            shaper.curve = makeVintageDistortion((p.drive.amount || 0.5) * 100);
        } else {
            shaper.curve = makeSoftClip(p.drive?.amount || 0.2);
        }

        mid1.frequency.value = p.post?.mids?.[0]?.f || 850;
        mid1.gain.value = p.post?.mids?.[0]?.g || 2;
        mid2.frequency.value = p.post?.mids?.[1]?.f || 2500;
        mid2.gain.value = p.post?.mids?.[1]?.g || -1.5;
        postLPF.frequency.value = p.post?.lpf || 5000;

        ph.setMix(p.phaser?.on ? (p.phaser.mix || 0.2) : 0);
        dA.setMix(p.delayA?.on ? (p.delayA.mix || 0.2) : 0);
        dB_node.setMix(p.delayB?.on ? (p.delayB.mix || 0.1) : 0);
        revSend.gain.value = p.reverbMix || 0.18;
    };

    return { 
        noteOn, noteOff, 
        allNotesOff: () => {
            allActiveVoices.forEach(v => deepCleanup(v, allActiveVoices));
            activeVoices.clear(); allActiveVoices.clear(); globalActiveVoices = 0;
        },
        setPreset: (p: any) => { 
            currentPreset = p; 
            updateGuitarNodes(p);
        }, 
        setParam: (k: string, v: any) => {
            if (k === 'drive') {
                shaper.curve = (currentPreset.drive?.type === 'vintage') 
                    ? makeVintageDistortion(v * 100) 
                    : (currentPreset.drive?.type === 'muff' ? makeMuff(v) : makeSoftClip(v));
            }
        } 
    };
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FACTORY EXPORT
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
        setExpression: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
        preset,
        type
    };
}
