
//Fab v 2.5 - Total Organ Integration & Sub-Bass Support
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

// ───── SIMPLE FX FACTORIES ─────

interface SimpleFX {
    input: GainNode;
    output: GainNode;
    setMix: (m: number) => void;
}

const makeChorus = (ctx: AudioContext, rate = 0.3, depth = 0.004, mix = 0.3): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1;
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
            wet.gain.value = clamp(m, 0, 1);
            dry.gain.value = 1 - wet.gain.value;
        }
    };
};

const makeDelay = (ctx: AudioContext, time = 0.3, fb = 0.25, hc = 3000, mix = 0.2): SimpleFX => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    const dry = ctx.createGain(); dry.gain.value = 1;
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
            wet.gain.value = clamp(m, 0, 1);
            dry.gain.value = 1 - wet.gain.value;
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
        voiceGain.node.gain.linearRampToValueAtTime(0.0001, when + 0.05);
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
    
    const activeVoices = new Map<number, { oscs: AudioNode[], voiceGain: GainNode, voiceState: VoiceGain }>();
    
    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f = midiToHz(midi);
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(comp);
        const oscs: AudioNode[] = [];
        const oscConfig = currentPreset.osc || [{ type: 'sawtooth', gain: 0.5, octave: 0 }];
        
        for (const o of oscConfig) {
            const osc = ctx.createOscillator(); osc.type = o.type;
            osc.frequency.value = f * Math.pow(2, o.octave || 0);
            osc.detune.value = o.detune || 0;
            const g = ctx.createGain(); g.gain.value = (o.gain ?? 0.5) * velocity;
            osc.connect(g).connect(voiceGain); osc.start(when);
            oscs.push(osc, g);
        }
        
        const adsr = currentPreset.adsr || { a: 0.01, d: 0.2, s: 0.7, r: 0.3 };
        const voiceState = triggerAttack(ctx, voiceGain, when, adsr.a, adsr.d, adsr.s, velocity);
        activeVoices.set(midi, { oscs, voiceGain, voiceState });
    };
    
    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return;
        activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { r: 0.3 };
        const stopTime = triggerRelease(ctx, voice.voiceState, when, adsr.a, adsr.r);
        voice.oscs.forEach(n => { if (n instanceof OscillatorNode) n.stop(stopTime + 0.1); });
        setTimeout(() => { try { voice.voiceGain.disconnect(); } catch {} }, (stopTime - ctx.currentTime + 0.2) * 1000);
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
    // #ЗАЧЕМ: Scanner Vibrato в джазовом органе должен быть на 100% "мокрым" (Wet).
    const settings = { depth: 0.0025, mix: 1.0 }; 
    const input = ctx.createGain(); const output = ctx.createGain();
    const wet = ctx.createGain();
    const delay = ctx.createDelay(0.02); delay.delayTime.value = 0.005;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = config.rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = settings.depth;
    
    input.connect(delay); delay.connect(wet); wet.connect(output);
    wet.gain.value = settings.mix;
    lfo.connect(lfoGain); lfoGain.connect(delay.delayTime); lfo.start();
    return { input, output, setType: (t:any) => {}, setRate: (r:any) => lfo.frequency.setTargetAtTime(r, ctx.currentTime, 0.1) };
};

const createLeslie = (ctx: AudioContext, config: any) => {
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    // #ЗАЧЕМ: УДАЛЕН путь "dry". Теперь 100% звука идет через роторы. 
    //         Это решает проблему "Лесли отдельно, пэд отдельно".
    
    const lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 800;
    const highpass = ctx.createBiquadFilter(); highpass.type = 'highpass'; highpass.frequency.value = 800;
    
    const hornDelay = ctx.createDelay(0.01);
    const hornAmp = ctx.createGain();
    const hornLfo = ctx.createOscillator(); 
    
    // #ЗАЧЕМ: Снижен Doppler depth (FM) для удаления артефакта "Виу-Виу".
    const hornDepth = ctx.createGain(); hornDepth.gain.value = 0.0001; 
    
    // #ЗАЧЕМ: Снижена амплитудная модуляция (AM) для более естественного "дыхания".
    const hornAmDepth = ctx.createGain(); hornAmDepth.gain.value = 0.08; 
    
    const drumDelay = ctx.createDelay(0.01);
    const drumAmp = ctx.createGain();
    const drumLfo = ctx.createOscillator();
    const drumDepth = ctx.createGain(); drumDepth.gain.value = 0.00015;
    const drumAmDepth = ctx.createGain(); drumAmDepth.gain.value = 0.05;

    hornLfo.connect(hornDepth); hornDepth.connect(hornDelay.delayTime);
    hornLfo.connect(hornAmDepth); hornAmDepth.connect(hornAmp.gain);
    
    drumLfo.connect(drumDepth); drumDepth.connect(drumDelay.delayTime);
    drumLfo.connect(drumAmDepth); drumAmDepth.connect(drumAmp.gain);

    const speed = config.mode === 'fast' ? config.fast : config.slow;
    hornLfo.frequency.value = speed;
    drumLfo.frequency.value = speed * 0.85; // НЧ ротор всегда медленнее
    
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
        }, 
        setMix: (m:any) => { /* В этой версии mix игнорируется, так как мы 100% Wet */ }, 
        getMode: () => config.mode 
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
        mode: currentPreset.leslie?.mode ?? 'slow', 
        slow: currentPreset.leslie?.slow ?? 0.8, 
        fast: currentPreset.leslie?.fast ?? 6.5, 
        accel: currentPreset.leslie?.accel ?? 0.8
    });
    
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = currentPreset.volume ?? 0.7;
    const master = ctx.createGain(); master.gain.value = 0.8;
    
    organSum.connect(lpf).connect(vibrato.input);
    vibrato.output.connect(leslie.input);
    leslie.output.connect(instrumentGain).connect(master).connect(output);
    
    const activeVoices = new Map<number, { nodes: AudioNode[] }>();

    const noteOn = (midi: number, when: number = ctx.currentTime, velocity: number = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f0 = midiToHz(midi);
        const adsr = currentPreset.adsr || { a: 0.01, d: 0.1, s: 0.9, r: 0.1 };
        
        // #ЗАЧЕМ: Реализация "Легато-Перкуссии" (срабатывает только на первую ноту аккорда).
        const isFirstNote = activeVoices.size === 0;
        
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0;
        voiceGain.connect(organSum);
        const voiceNodes: AudioNode[] = [voiceGain];
        const sourceNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
        
        // Drawbars
        const drawbars = currentPreset.drawbars || [8,8,8,0,0,0,0,0,0];
        drawbars.forEach((v: number, i: number) => {
            if (v > 0) {
                const osc = ctx.createOscillator(); osc.setPeriodicWave(tonewheelWave);
                osc.frequency.value = f0 * DRAWBAR_RATIOS[i];
                const g = ctx.createGain(); g.gain.value = (v/8) * 0.3;
                osc.connect(g).connect(voiceGain); osc.start(when);
                voiceNodes.push(osc, g); sourceNodes.push(osc);
            }
        });

        // #ЗАЧЕМ: Поддержка гибридного суб-баса для "веса" инструмента.
        if (currentPreset.osc && currentPreset.osc.length > 0) {
            currentPreset.osc.forEach((o: any) => {
                const sub = ctx.createOscillator(); sub.type = o.type;
                sub.frequency.value = f0 * Math.pow(2, o.octave || 0);
                sub.detune.value = o.detune || 0;
                const subG = ctx.createGain(); subG.gain.value = (o.gain ?? 0.5) * velocity;
                sub.connect(subG).connect(voiceGain); sub.start(when);
                voiceNodes.push(sub, subG); sourceNodes.push(sub);
            });
        }

        // Click (с учетом легато)
        if (clickBuffer && isFirstNote) {
            const click = ctx.createBufferSource(); click.buffer = clickBuffer;
            const clickG = ctx.createGain(); clickG.gain.value = velocity * 0.5;
            click.connect(clickG).connect(voiceGain); click.start(when);
            voiceNodes.push(click, clickG); sourceNodes.push(click);
        }

        const primarySource = sourceNodes[0];
        if (primarySource) {
            primarySource.onended = () => { voiceNodes.forEach(node => { try { node.disconnect(); } catch(e) {} }); };
        }

        voiceGain.gain.cancelScheduledValues(when);
        voiceGain.gain.setValueAtTime(0, when);
        voiceGain.gain.linearRampToValueAtTime(velocity, when + adsr.a);
        activeVoices.set(midi, { nodes: voiceNodes });
    };

    const noteOff = (midi: number, when: number = ctx.currentTime) => {
        const voice = activeVoices.get(midi);
        if (!voice) return;
        activeVoices.delete(midi);
        const adsr = currentPreset.adsr || { r: 0.1 };
        const stopTime = when + adsr.r;
        const voiceGain = voice.nodes[0] as GainNode;
        voiceGain.gain.cancelScheduledValues(when);
        voiceGain.gain.setTargetAtTime(0.0001, when, adsr.r / 3);
        
        voice.nodes.forEach(node => {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                try { node.stop(stopTime); } catch (e) {}
            }
        });
    };
    
    const allNotesOff = () => activeVoices.forEach((_, midi) => noteOff(midi));

    console.log('%c[OrganEngine] Ready!', 'color: #32CD32; font-weight: bold;');

    return {
        connect: (dest) => master.connect(dest || output),
        disconnect: () => master.disconnect(),
        noteOn, noteOff, allNotesOff,
        setPreset: (p) => { allNotesOff(); currentPreset = p; updateFromPreset(p); },
        setParam: (k, v) => { if(k==='leslie') leslie.setMode(v); },
        setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
        setExpression: (v) => master.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
        preset: currentPreset, type: 'organ'
    };
}

const DEFAULT_VOLUMES: Record<string, number> = {
    synth: 0.7, guitar: 0.75, organ: 0.65, mellotron: 0.7,
    synth_ambient_pad_lush: 0.6, synth_cave_pad: 0.55, theremin: 0.65,
    mellotron_flute_intimate: 0.7, mellotron_choir: 0.6, ep_rhodes_warm: 0.72,
    ep_rhodes_70s: 0.72, synth_lead_shineOn: 0.75, synth_lead_distorted: 0.65,
    guitar_shineOn: 0.7, guitar_muffLead: 0.65, guitar_clean_chorus: 0.72,
    organ_soft_jazz: 0.15
};

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

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    cabinetIRUrl = null as string | null,
    plateIRUrl = null as string | null,
    mellotronMap = null as any,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    
    console.log(`%c[InstrumentFactory] Building: ${type}`, 'color: #FFA500; font-weight: bold;');

    const master = ctx.createGain(); master.gain.value = 0.8;
    const instrumentGain = ctx.createGain();
    const presetName = preset.name || type;
    const baseVolume = preset.volume ?? DEFAULT_VOLUMES[presetName] ?? DEFAULT_VOLUMES[type] ?? 0.7;
    instrumentGain.gain.value = baseVolume;
    const expressionGain = ctx.createGain();
    expressionGain.gain.value = 1.0;
    const reverb = ctx.createConvolver();
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = 0.18;

    if (plateIRUrl) {
        fetch(plateIRUrl).then(res => res.arrayBuffer()).then(buf => ctx.decodeAudioData(buf)).then(buf => {
            if (buf) reverb.buffer = buf;
        }).catch(e => console.warn('[InstrumentFactory] Reverb load fail'));
    }
    reverb.connect(master);

    const api: InstrumentAPI = {
        connect: (dest?: AudioNode) => master.connect(dest || output),
        disconnect: () => { try { master.disconnect(); } catch {} },
        noteOn: () => {}, noteOff: () => {}, allNotesOff: () => {}, setPreset: () => {}, setParam: () => {},
        setVolume: (level: number) => instrumentGain.gain.setTargetAtTime(level, ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db: number) => instrumentGain.gain.setTargetAtTime(dB(clamp(db, -60, 12)), ctx.currentTime, 0.02),
        setExpression: (level: number) => expressionGain.gain.setTargetAtTime(level, ctx.currentTime, 0.01),
        preset: preset,
        type: type
    };

    if (type === 'synth') {
        const pre = ctx.createGain(); pre.gain.value = 0.9;
        const filt = ctx.createBiquadFilter(); filt.type = 'lowpass';
        pre.connect(filt).connect(expressionGain).connect(instrumentGain).connect(master);
        const activeVoices = new Map<number, { nodes: AudioNode[] }>();

        api.noteOn = (midi, when = ctx.currentTime, velocity = 1.0) => {
            const f = midiToHz(midi);
            const { osc = [], adsr = {a:0.01, d:0.3, s:0.5, r:1.0} } = api.preset;
            const voiceGain = ctx.createGain(); voiceGain.gain.value = 0;
            voiceGain.connect(pre);
            const voiceNodes: AudioNode[] = [voiceGain];
            const sourceNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
            osc.forEach((o: any) => {
                const x = ctx.createOscillator(); x.type = o.type; x.detune.value = o.detune || 0;
                const g = ctx.createGain(); g.gain.value = o.gain;
                x.frequency.value = f * Math.pow(2, o.octave || 0);
                x.connect(g).connect(voiceGain); x.start(when);
                voiceNodes.push(x, g); sourceNodes.push(x);
            });
            if (sourceNodes[0]) sourceNodes[0].onended = () => { voiceNodes.forEach(n => { try { n.disconnect(); } catch(e){} }); };
            voiceGain.gain.cancelScheduledValues(when);
            voiceGain.gain.setValueAtTime(0.0001, when);
            voiceGain.gain.linearRampToValueAtTime(velocity, when + adsr.a);
            voiceGain.gain.setTargetAtTime(velocity * adsr.s, when + adsr.a, Math.max(adsr.d / 5, 0.001));
            activeVoices.set(midi, { nodes: voiceNodes });
        };
        api.noteOff = (midi, when = ctx.currentTime) => {
            const voice = activeVoices.get(midi); if (!voice) return; activeVoices.delete(midi);
            const { adsr = {r:1.0} } = api.preset; const rt = Math.max(adsr.r, 0.05);
            (voice.nodes[0] as GainNode).gain.setTargetAtTime(0.0001, when, rt / 5);
            voice.nodes.forEach(n => { 
                if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
                    try { n.stop(when + rt); } catch(e) {}
                }
            });
        };
        api.allNotesOff = () => { activeVoices.forEach((_, m) => api.noteOff(m)); };
        api.setPreset = (p) => { api.allNotesOff(); api.preset = p; };
        
        console.log(`%c[InstrumentFactory] Build COMPLETED: ${type}`, 'color: #32CD32; font-weight: bold;');
    } else if (type === 'bass') {
        const engine = await buildBassEngine(ctx, preset as BassPreset, { output, plateIRUrl });
        console.log(`%c[InstrumentFactory] Build COMPLETED: ${type}`, 'color: #32CD32; font-weight: bold;');
        return engine;
    } else if (type === 'organ') {
         const engine = await buildOrganEngine(ctx, preset, { output, plateIRUrl });
         console.log(`%c[InstrumentFactory] Build COMPLETED: ${type}`, 'color: #32CD32; font-weight: bold;');
         return engine;
    }
    
    return api;
}
