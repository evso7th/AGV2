
//Fab v 2.2 - Leslie Physics Improved & Memory Leaks Fixed
// ─────────────────────────────────────────────────────────────────────────────
// BASS ENGINE — Electric, Synth & Acoustic Bass Emulation
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS & CURVES
// ═══════════════════════════════════════════════════════════════════════════

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const dB = (x: number) => Math.pow(10, x / 20);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

// Tube-style saturation (тёплый овердрайв)
const makeTubeSaturation = (drive = 0.3, n = 65536) => {
    const curve = new Float32Array(n);
    const k = drive * 5 + 1;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        const pos = Math.tanh(k * x);
        const neg = Math.tanh(k * x * 0.8) * 0.9;
        curve[i] = x >= 0 ? pos : neg;
    }
    return curve;
};

// Fuzz для агрессивного звучания
const makeFuzz = (intensity = 0.7, n = 65536) => {
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        const k = intensity * 20 + 1;
        curve[i] = Math.sign(x) * (1 - Math.exp(-Math.abs(x) * k));
    }
    return curve;
};

const makeSoftClip = (amount = 0.5, n = 65536) => {
    const c=new Float32Array(n); const k=clamp(amount, 0, 1) * 10 + 1;
    for (let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); }
    return c;
};

// ═══════════════════════════════════════════════════════════════════════════
// FILTER ENVELOPE
// ═══════════════════════════════════════════════════════════════════════════

interface FilterEnvelopeConfig {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
    depth: number;
    velocity: number;
}

const applyFilterEnvelope = (
    ctx: AudioContext,
    filter: BiquadFilterNode,
    baseCutoff: number,
    config: FilterEnvelopeConfig,
    when: number,
    velocity: number
) => {
    const depth = config.depth * (1 - config.velocity + config.velocity * velocity);
    const peak = baseCutoff + depth;
    const sustainLevel = baseCutoff + depth * config.sustain;
    
    filter.frequency.cancelScheduledValues(when);
    filter.frequency.setValueAtTime(baseCutoff, when);
    filter.frequency.linearRampToValueAtTime(peak, when + config.attack);
    filter.frequency.setTargetAtTime(sustainLevel, when + config.attack, config.decay / 3);
};

const releaseFilterEnvelope = (
    ctx: AudioContext,
    filter: BiquadFilterNode,
    baseCutoff: number,
    releaseTime: number,
    when: number
) => {
    filter.frequency.cancelScheduledValues(when);
    if (releaseTime < 0.05) { 
        filter.frequency.setValueAtTime(baseCutoff, when);
    } else {
        filter.frequency.setValueAtTime(filter.frequency.value, when); 
        filter.frequency.linearRampToValueAtTime(baseCutoff, when + releaseTime);
    }
};

// ═══════════════════════════════════════════════════════════════════════════
// STRING SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

const createStringNoise = (ctx: AudioContext, duration: number): AudioBuffer => {
    const length = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.exp(-t * 40) * (1 - t * 0.5);
        data[i] = (Math.random() * 2 - 1) * envelope;
    }
    return buffer;
};

const createSlapNoise = (ctx: AudioContext): AudioBuffer => {
    const length = Math.floor(ctx.sampleRate * 0.015);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.exp(-t * 60);
        const tone = Math.sin(i * 0.15) * 0.4; 
        data[i] = ((Math.random() * 2 - 1) * 0.7 + tone * 0.3) * envelope;
    }
    return buffer;
};

// ═══════════════════════════════════════════════════════════════════════════
// BASS PRESET INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

interface BassOscConfig {
    type: 'sine' | 'triangle' | 'sawtooth' | 'square' | 'pulse';
    octave: number;
    detune: number;
    gain: number;
    pulseWidth?: number;
}

export interface BassPreset {
    type: 'bass';
    name?: string;
    volume?: number;
    osc: BassOscConfig[];
    sub?: {
        on: boolean;
        type: 'sine' | 'triangle';
        octave: number;
        gain: number;
    };
    adsr: { a: number; d: number; s: number; r: number };
    filter: {
        type: 'lowpass' | 'bandpass';
        cutoff: number;
        q: number;
        keyTrack?: number;
    };
    filterEnv?: {
        on: boolean;
        attack: number;
        decay: number;
        sustain: number;
        release: number;
        depth: number;
        velocity: number;
    };
    drive?: {
        on: boolean;
        type: 'tube' | 'fuzz' | 'soft';
        amount: number;
        tone: number;
    };
    comp?: {
        threshold: number;
        ratio: number;
        attack: number;
        release: number;
        makeup: number;
    };
    eq?: {
        lowShelf?: { freq: number; gain: number };
        mid?: { freq: number; q: number; gain: number };
        highShelf?: { freq: number; gain: number };
    };
    stringNoise?: {
        on: boolean;
        type: 'finger' | 'pick' | 'slap';
        amount: number;
    };
    chorus?: { on: boolean; rate: number; depth: number; mix: number };
    delay?: { on: boolean; time: number; fb: number; mix: number; hc: number };
    reverbMix?: number;
}

interface BassVoice {
    oscillators: OscillatorNode[];
    subOsc?: OscillatorNode;
    voiceGain: GainNode;
    filter: BiquadFilterNode;
    noiseSource?: AudioBufferSourceNode;
    startTime: number;
    midi: number;
    velocity: number;
    allNodes: AudioNode[]; 
}

export const buildBassEngine = async (
    ctx: AudioContext,
    preset: BassPreset,
    options: {
        output?: AudioNode;
        plateIRUrl?: string | null;
    } = {}
) => {
    console.log('%c[BassEngine] Building bass...', 'color: #4169E1; font-weight: bold;');
    
    const output = options.output || ctx.destination;
    let currentPreset = { ...preset };
    
    const fingerNoiseBuffer = createStringNoise(ctx, 0.02);
    const pickNoiseBuffer = createStringNoise(ctx, 0.015);
    const slapNoiseBuffer = createSlapNoise(ctx);
    
    const bassSum = ctx.createGain();
    bassSum.gain.value = 1;
    
    const inputComp = ctx.createDynamicsCompressor();
    inputComp.threshold.value = -24;
    inputComp.knee.value = 12;
    inputComp.ratio.value = 4;
    inputComp.attack.value = 0.003;
    inputComp.release.value = 0.1;
    
    const driveInput = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    shaper.oversample = '4x';
    const driveTone = ctx.createBiquadFilter();
    driveTone.type = 'lowpass';
    const driveWet = ctx.createGain();
    const driveDry = ctx.createGain();
    const driveMix = ctx.createGain();
    
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    
    const eqLow = ctx.createBiquadFilter(); eqLow.type = 'lowshelf';
    const eqMid = ctx.createBiquadFilter(); eqMid.type = 'peaking';
    const eqHigh = ctx.createBiquadFilter(); eqHigh.type = 'highshelf';
    
    const outputComp = ctx.createDynamicsCompressor();
    const compMakeup = ctx.createGain();
    
    const chorusDelay = ctx.createDelay(0.05);
    const chorusLfo = ctx.createOscillator();
    const chorusLfoGain = ctx.createGain();
    const chorusWet = ctx.createGain();
    const chorusDry = ctx.createGain();
    chorusLfo.connect(chorusLfoGain);
    chorusLfoGain.connect(chorusDelay.delayTime);
    chorusLfo.start();
    
    const delayNode = ctx.createDelay(2);
    const delayFeedback = ctx.createGain();
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    const delayWet = ctx.createGain();
    const delayDry = ctx.createGain();
    
    const instrumentGain = ctx.createGain();
    const expressionGain = ctx.createGain();
    const master = ctx.createGain(); master.gain.value = 0.425;
    
    const reverb = ctx.createConvolver();
    const reverbWet = ctx.createGain();
    
    // Routing
    bassSum.connect(inputComp);
    inputComp.connect(driveInput);
    driveInput.connect(shaper);
    shaper.connect(driveTone);
    driveTone.connect(driveWet);
    inputComp.connect(driveDry);
    driveWet.connect(driveMix);
    driveDry.connect(driveMix);
    driveMix.connect(masterFilter);
    masterFilter.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(outputComp);
    outputComp.connect(compMakeup);
    compMakeup.connect(chorusDry);
    compMakeup.connect(chorusDelay);
    chorusDelay.connect(chorusWet);
    const chorusMerge = ctx.createGain();
    chorusDry.connect(chorusMerge);
    chorusWet.connect(chorusMerge);
    chorusMerge.connect(delayDry);
    chorusMerge.connect(delayNode);
    delayNode.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayFilter.connect(delayWet);
    const delayMerge = ctx.createGain();
    delayDry.connect(delayMerge);
    delayWet.connect(delayMerge);
    delayMerge.connect(expressionGain);
    expressionGain.connect(instrumentGain);
    instrumentGain.connect(master);
    delayMerge.connect(reverbWet);
    reverbWet.connect(reverb);
    reverb.connect(master);
    master.connect(output);
    
    const updateFromPreset = (p: BassPreset) => {
        if (p.drive?.on) {
            shaper.curve = p.drive.type === 'fuzz' ? makeFuzz(p.drive.amount) : makeTubeSaturation(p.drive.amount);
            driveTone.frequency.value = p.drive.tone ?? 3000;
            driveWet.gain.value = 0.7; driveDry.gain.value = 0.3;
        } else {
            driveWet.gain.value = 0; driveDry.gain.value = 1;
        }
        masterFilter.frequency.value = p.filter?.cutoff ?? 2000;
        masterFilter.Q.value = p.filter?.q ?? 1;
        reverbWet.gain.value = p.reverbMix ?? 0.08;
        instrumentGain.gain.value = p.volume ?? 0.75;
    };
    
    updateFromPreset(currentPreset);
    
    const activeVoices = new Map<number, BassVoice>();
    
    const createPulseOsc = (freq: number, width = 0.5) => {
        const w = clamp(width, 0.1, 0.9);
        const real = new Float32Array(32);
        const imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) { real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * w); }
        const wave = ctx.createPeriodicWave(real, imag, { disableNormalization: true });
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(wave);
        osc.frequency.value = freq;
        return osc;
    };
    
    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) noteOff(midi, when);
        const f0 = midiToHz(midi);
        const vel = clamp(velocity, 0, 1);
        const adsr = currentPreset.adsr;
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0;
        const voiceFilter = ctx.createBiquadFilter();
        voiceFilter.type = currentPreset.filter?.type ?? 'lowpass';
        const keyTrack = currentPreset.filter?.keyTrack ?? 0.3;
        const keyTrackOffset = (midi - 36) * keyTrack * 30;
        voiceFilter.frequency.value = (currentPreset.filter?.cutoff ?? 2000) + keyTrackOffset;
        
        const oscillators: OscillatorNode[] = [];
        const voiceNodes: AudioNode[] = [voiceGain, voiceFilter];

        for (const oscConfig of currentPreset.osc) {
            const osc = oscConfig.type === 'pulse' ? createPulseOsc(f0 * Math.pow(2, oscConfig.octave), oscConfig.pulseWidth) : ctx.createOscillator();
            if (oscConfig.type !== 'pulse') { osc.type = oscConfig.type; osc.frequency.value = f0 * Math.pow(2, oscConfig.octave); }
            osc.detune.value = oscConfig.detune;
            const gain = ctx.createGain(); gain.gain.value = oscConfig.gain * vel;
            osc.connect(gain).connect(voiceGain);
            osc.start(when);
            oscillators.push(osc);
            voiceNodes.push(osc, gain);
        }
        
        let subOsc: OscillatorNode | undefined;
        if (currentPreset.sub?.on) {
            subOsc = ctx.createOscillator(); subOsc.type = currentPreset.sub.type;
            subOsc.frequency.value = f0 * Math.pow(2, currentPreset.sub.octave);
            const subGain = ctx.createGain(); subGain.gain.value = currentPreset.sub.gain * vel;
            subOsc.connect(subGain).connect(voiceGain);
            subOsc.start(when);
            voiceNodes.push(subOsc, subGain);
        }
        
        let noiseSource: AudioBufferSourceNode | undefined;
        if (currentPreset.stringNoise?.on) {
            noiseSource = ctx.createBufferSource();
            noiseSource.buffer = currentPreset.stringNoise.type === 'slap' ? slapNoiseBuffer : (currentPreset.stringNoise.type === 'pick' ? pickNoiseBuffer : fingerNoiseBuffer);
            const noiseGain = ctx.createGain(); noiseGain.gain.value = currentPreset.stringNoise.amount * vel;
            noiseSource.connect(noiseGain).connect(voiceGain);
            noiseSource.start(when);
            voiceNodes.push(noiseSource, noiseGain);
        }
        
        voiceGain.connect(voiceFilter).connect(bassSum);
        if (currentPreset.filterEnv?.on) applyFilterEnvelope(ctx, voiceFilter, (currentPreset.filter?.cutoff ?? 2000) + keyTrackOffset, currentPreset.filterEnv, when, vel);
        
        voiceGain.gain.cancelScheduledValues(when);
        voiceGain.gain.setValueAtTime(0.0001, when);
        voiceGain.gain.linearRampToValueAtTime(1, when + adsr.a);
        voiceGain.gain.setTargetAtTime(adsr.s, when + adsr.a, Math.max(adsr.d / 3, 0.001));

        const primaryOsc = oscillators[0];
        if (primaryOsc) {
            primaryOsc.onended = () => { voiceNodes.forEach(node => { try { node.disconnect(); } catch (e) {} }); };
        }
        
        activeVoices.set(midi, { oscillators, subOsc, voiceGain, filter: voiceFilter, noiseSource, startTime: when, midi, velocity: vel, allNodes: voiceNodes });
    };
    
    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi);
        if (!voice) return;
        activeVoices.delete(midi);
        const adsr = currentPreset.adsr;
        const releaseTime = Math.max(adsr.r, 0.02);
        const stopTime = when + releaseTime;
        voice.voiceGain.gain.cancelScheduledValues(when);
        voice.voiceGain.gain.setTargetAtTime(0.0001, when, releaseTime / 3);
        if (currentPreset.filterEnv?.on) releaseFilterEnvelope(ctx, voice.filter, currentPreset.filter?.cutoff ?? 2000, releaseTime, when);
        
        voice.allNodes.forEach(node => {
            if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                try { node.stop(stopTime); } catch (e) {}
            }
        });
    };
    
    const allNotesOff = () => { const now = ctx.currentTime; activeVoices.forEach((v, m) => noteOff(m, now)); activeVoices.clear(); };
    
    const api = {
        noteOn, noteOff, allNotesOff,
        connect: (dest?: AudioNode) => master.connect(dest || output),
        disconnect: () => { try { master.disconnect(); } catch {} },
        setPreset: (p: BassPreset) => { allNotesOff(); currentPreset = { ...p }; updateFromPreset(currentPreset); },
        setParam: (key: string, value: any) => {
            if (key === 'volume') instrumentGain.gain.setTargetAtTime(clamp(value, 0, 1), ctx.currentTime, 0.02);
        },
        setVolume: (v: number) => instrumentGain.gain.setTargetAtTime(clamp(v, 0, 1), ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(clamp(db, -60, 12)), ctx.currentTime, 0.02),
        setExpression: (v: number) => expressionGain.gain.setTargetAtTime(clamp(v, 0, 1), ctx.currentTime, 0.01),
        preset: currentPreset, type: 'bass' as const
    };
    
    console.log('%c[BassEngine] Ready!', 'color: #32CD32; font-weight: bold;');
    return api;
};

// ═══════════════════════════════════════════════════════════════════════════
// ORGAN ENGINE — Hammond B3 Style
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
    const settings = { depth: 0.0025, mix: 0.5 };
    const input = ctx.createGain(); const output = ctx.createGain();
    const dry = ctx.createGain(); const wet = ctx.createGain();
    const delay = ctx.createDelay(0.02); delay.delayTime.value = 0.005;
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = config.rate;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = settings.depth;
    input.connect(dry); input.connect(delay); delay.connect(wet);
    dry.connect(output); wet.connect(output);
    lfo.connect(lfoGain); lfoGain.connect(delay.delayTime); lfo.start();
    return { input, output, setType: (t:any) => {}, setRate: (r:any) => lfo.frequency.setTargetAtTime(r, ctx.currentTime, 0.1) };
};

const createLeslie = (ctx: AudioContext, config: any) => {
    // #ЗАЧЕМ: Физически корректная модель Лесли для устранения эффекта "сирены" и "отдельности".
    // #ЧТО: Разделение на рупор (horn) и барабан (drum), снижение глубины девиации частоты (0.0002),
    //      добавление амплитудной модуляции (AM) для "склейки" текстуры.
    const input = ctx.createGain(); const output = ctx.createGain();
    const dry = ctx.createGain(); const wet = ctx.createGain();
    const lowpass = ctx.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 800;
    const highpass = ctx.createBiquadFilter(); highpass.type = 'highpass'; highpass.frequency.value = 800;
    
    // Horn (Highs)
    const hornDelay = ctx.createDelay(0.01);
    const hornAmp = ctx.createGain();
    const hornLfo = ctx.createOscillator(); 
    const hornDepth = ctx.createGain(); hornDepth.gain.value = 0.0002; // Drastically reduced Viu-Viu
    const hornAmDepth = ctx.createGain(); hornAmDepth.gain.value = 0.12; // Glue effect
    
    // Drum (Lows)
    const drumDelay = ctx.createDelay(0.01);
    const drumAmp = ctx.createGain();
    const drumLfo = ctx.createOscillator();
    const drumDepth = ctx.createGain(); drumDepth.gain.value = 0.0003;
    const drumAmDepth = ctx.createGain(); drumAmDepth.gain.value = 0.08;

    hornLfo.connect(hornDepth); hornDepth.connect(hornDelay.delayTime);
    hornLfo.connect(hornAmDepth); hornAmDepth.connect(hornAmp.gain);
    
    drumLfo.connect(drumDepth); drumDepth.connect(drumDelay.delayTime);
    drumLfo.connect(drumAmDepth); drumAmDepth.connect(drumAmp.gain);

    const speed = config.mode === 'fast' ? config.fast : config.slow;
    hornLfo.frequency.value = speed;
    drumLfo.frequency.value = speed * 0.95; // Slight offset for organic feel
    
    hornLfo.start(); drumLfo.start();

    input.connect(dry); dry.connect(output); 
    input.connect(lowpass); input.connect(highpass);
    
    highpass.connect(hornDelay).connect(hornAmp).connect(wet);
    lowpass.connect(drumDelay).connect(drumAmp).connect(wet);
    
    wet.connect(output);
    
    return { 
        input, output, 
        setMode: (m:any) => {
            const now = ctx.currentTime;
            const target = m === 'fast' ? config.fast : (m === 'slow' ? config.slow : 0.01);
            hornLfo.frequency.setTargetAtTime(target, now, config.accel);
            drumLfo.frequency.setTargetAtTime(target * 0.95, now, config.accel * 1.2);
        }, 
        setMix: (m:any) => { wet.gain.value = m; dry.gain.value = 1-m; }, 
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
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0;
        voiceGain.connect(organSum);
        const voiceNodes: AudioNode[] = [voiceGain];
        const sourceNodes: (OscillatorNode | AudioBufferSourceNode)[] = [];
        
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

        if (clickBuffer) {
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
        setPreset: (p) => { allNotesOff(); currentPreset = p; },
        setParam: (k, v) => { if(k==='leslie') leslie.setMode(v); },
        setVolume: (v) => instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db) => instrumentGain.gain.setTargetAtTime(dB(db), ctx.currentTime, 0.02),
        setExpression: (v) => master.gain.setTargetAtTime(v, ctx.currentTime, 0.01),
        preset: currentPreset, type: 'organ'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiInstrument WebAudio: organ | synth | mellotron | guitar
// ─────────────────────────────────────────────────────────────────────────────

interface VoiceState {
    gain: GainNode;
    startTime: number;
    phase: 'attack' | 'decay' | 'sustain' | 'release';
    targetPeak: number;
    nodes: AudioNode[];  
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
