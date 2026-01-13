

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
        // Асимметричный клиппинг (как у ламп)
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

// ═══════════════════════════════════════════════════════════════════════════
// FILTER ENVELOPE
// ═══════════════════════════════════════════════════════════════════════════

interface FilterEnvelopeConfig {
    attack: number;      // Время атаки фильтра
    decay: number;       // Время затухания
    sustain: number;     // Уровень sustain (0-1 от depth)
    release: number;     // Release
    depth: number;       // Глубина модуляции (Hz)
    velocity: number;    // Влияние velocity на depth
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
    filter.frequency.setTargetAtTime(baseCutoff, when, releaseTime / 3);
};

// ═══════════════════════════════════════════════════════════════════════════
// STRING SIMULATION (для реализма)
// ═══════════════════════════════════════════════════════════════════════════

const createStringNoise = (ctx: AudioContext, duration: number): AudioBuffer => {
    // Шум "пальца по струне" / pick attack
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
    // Slap attack — резкий удар
    const length = Math.floor(ctx.sampleRate * 0.015);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.exp(-t * 60);
        const tone = Math.sin(i * 0.3) * 0.5; // ~2kHz transient
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
    pulseWidth?: number;  // для pulse
}

export interface BassPreset {
    type: 'bass';
    name?: string;
    volume?: number;
    
    // ─── Oscillators ───
    osc: BassOscConfig[];
    
    // ─── Sub bass (отдельно для контроля) ───
    sub?: {
        on: boolean;
        type: 'sine' | 'triangle';
        octave: number;  // обычно -1
        gain: number;
    };
    
    // ─── Amp Envelope ───
    adsr: { a: number; d: number; s: number; r: number };
    
    // ─── Filter ───
    filter: {
        type: 'lowpass' | 'bandpass';
        cutoff: number;
        q: number;
        keyTrack?: number;  // 0-1: следование за нотой
    };
    
    // ─── Filter Envelope ───
    filterEnv?: {
        on: boolean;
        attack: number;
        decay: number;
        sustain: number;
        release: number;
        depth: number;
        velocity: number;
    };
    
    // ─── Saturation/Drive ───
    drive?: {
        on: boolean;
        type: 'tube' | 'fuzz' | 'soft';
        amount: number;
        tone: number;  // post-drive LPF
    };
    
    // ─── Compressor ───
    comp?: {
        threshold: number;
        ratio: number;
        attack: number;
        release: number;
        makeup: number;
    };
    
    // ─── EQ ───
    eq?: {
        lowShelf?: { freq: number; gain: number };
        mid?: { freq: number; q: number; gain: number };
        highShelf?: { freq: number; gain: number };
    };
    
    // ─── String noise/attack ───
    stringNoise?: {
        on: boolean;
        type: 'finger' | 'pick' | 'slap';
        amount: number;
    };
    
    // ─── Effects ───
    chorus?: { on: boolean; rate: number; depth: number; mix: number };
    delay?: { on: boolean; time: number; fb: number; mix: number; hc: number };
    
    reverbMix?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BASS VOICE
// ═══════════════════════════════════════════════════════════════════════════

interface BassVoice {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    subOsc?: OscillatorNode;
    subGain?: GainNode;
    voiceGain: GainNode;
    filter: BiquadFilterNode;
    noiseSource?: AudioBufferSourceNode;
    startTime: number;
    midi: number;
    velocity: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN BASS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

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
    
    // ═══ Prepare Noise Buffers ═══
    const fingerNoiseBuffer = createStringNoise(ctx, 0.02);
    const pickNoiseBuffer = createStringNoise(ctx, 0.015);
    const slapNoiseBuffer = createSlapNoise(ctx);
    
    // ═══ Static Audio Graph ═══
    
    // ─── Input Stage ───
    const bassSum = ctx.createGain();
    bassSum.gain.value = 1;
    
    // ─── Pre-filter compression (сглаживание) ───
    const inputComp = ctx.createDynamicsCompressor();
    inputComp.threshold.value = -24;
    inputComp.knee.value = 12;
    inputComp.ratio.value = 4;
    inputComp.attack.value = 0.003;
    inputComp.release.value = 0.1;
    
    // ─── Saturation/Drive ───
    const driveInput = ctx.createGain();
    driveInput.gain.value = 1;
    
    const shaper = ctx.createWaveShaper();
    shaper.oversample = '4x';
    
    const driveTone = ctx.createBiquadFilter();
    driveTone.type = 'lowpass';
    driveTone.frequency.value = 3000;
    driveTone.Q.value = 0.5;
    
    const driveWet = ctx.createGain();
    const driveDry = ctx.createGain();
    const driveMix = ctx.createGain();
    
    // ─── Main Filter (per-voice, but we also have a master filter) ───
    const masterFilter = ctx.createBiquadFilter();
    masterFilter.type = 'lowpass';
    masterFilter.frequency.value = currentPreset.filter?.cutoff ?? 2000;
    masterFilter.Q.value = currentPreset.filter?.q ?? 1;
    
    // ─── EQ Section ───
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = currentPreset.eq?.lowShelf?.freq ?? 100;
    eqLow.gain.value = currentPreset.eq?.lowShelf?.gain ?? 0;
    
    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = currentPreset.eq?.mid?.freq ?? 800;
    eqMid.Q.value = currentPreset.eq?.mid?.q ?? 1;
    eqMid.gain.value = currentPreset.eq?.mid?.gain ?? 0;
    
    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = currentPreset.eq?.highShelf?.freq ?? 3000;
    eqHigh.gain.value = currentPreset.eq?.highShelf?.gain ?? 0;
    
    // ─── Output Compressor ───
    const outputComp = ctx.createDynamicsCompressor();
    const compMakeup = ctx.createGain();
    
    // ─── Chorus (for fretless/mellow sounds) ───
    const chorusDelay = ctx.createDelay(0.05);
    chorusDelay.delayTime.value = 0.015;
    const chorusLfo = ctx.createOscillator();
    const chorusLfoGain = ctx.createGain();
    const chorusWet = ctx.createGain();
    const chorusDry = ctx.createGain();
    chorusLfo.type = 'sine';
    chorusLfo.frequency.value = 0.3;
    chorusLfoGain.gain.value = 0.003;
    chorusLfo.connect(chorusLfoGain);
    chorusLfoGain.connect(chorusDelay.delayTime);
    chorusLfo.start();
    
    // ─── Delay (для dub/reggae) ───
    const delayNode = ctx.createDelay(2);
    const delayFeedback = ctx.createGain();
    const delayFilter = ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 2000;
    const delayWet = ctx.createGain();
    const delayDry = ctx.createGain();
    
    // ─── Volume Control ───
    const instrumentGain = ctx.createGain();
    instrumentGain.gain.value = currentPreset.volume ?? 0.75;
    
    const expressionGain = ctx.createGain();
    expressionGain.gain.value = 1;
    
    // ─── Master ───
    const master = ctx.createGain();
    master.gain.value = 0.85;
    
    // ─── Reverb ───
    const reverb = ctx.createConvolver();
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = currentPreset.reverbMix ?? 0.08;
    
    if (options.plateIRUrl) {
        try {
            const res = await fetch(options.plateIRUrl);
            const buf = await res.arrayBuffer();
            reverb.buffer = await ctx.decodeAudioData(buf);
        } catch (e) {
            console.warn('[BassEngine] Could not load reverb IR');
        }
    }
    
    // ═══ Routing ═══
    
    // Bass sum -> input comp
    bassSum.connect(inputComp);
    
    // Drive section (parallel wet/dry)
    inputComp.connect(driveInput);
    driveInput.connect(shaper);
    shaper.connect(driveTone);
    driveTone.connect(driveWet);
    inputComp.connect(driveDry);
    driveWet.connect(driveMix);
    driveDry.connect(driveMix);
    
    // Master filter
    driveMix.connect(masterFilter);
    
    // EQ
    masterFilter.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    
    // Output comp
    eqHigh.connect(outputComp);
    outputComp.connect(compMakeup);
    
    // Chorus (parallel)
    compMakeup.connect(chorusDry);
    compMakeup.connect(chorusDelay);
    chorusDelay.connect(chorusWet);
    const chorusMerge = ctx.createGain();
    chorusDry.connect(chorusMerge);
    chorusWet.connect(chorusMerge);
    
    // Delay (parallel)
    chorusMerge.connect(delayDry);
    chorusMerge.connect(delayNode);
    delayNode.connect(delayFilter);
    delayFilter.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayFilter.connect(delayWet);
    const delayMerge = ctx.createGain();
    delayDry.connect(delayMerge);
    delayWet.connect(delayMerge);
    
    // Final chain
    delayMerge.connect(expressionGain);
    expressionGain.connect(instrumentGain);
    instrumentGain.connect(master);
    
    // Reverb send
    delayMerge.connect(reverbWet);
    reverbWet.connect(reverb);
    reverb.connect(master);
    
    master.connect(output);
    
    // ═══ Update from Preset ═══
    
    const updateFromPreset = (p: BassPreset) => {
        // Drive
        if (p.drive?.on) {
            const curve = p.drive.type === 'fuzz' 
                ? makeFuzz(p.drive.amount)
                : p.drive.type === 'tube'
                    ? makeTubeSaturation(p.drive.amount)
                    : makeTubeSaturation(p.drive.amount * 0.5);
            shaper.curve = curve;
            driveTone.frequency.value = p.drive.tone ?? 3000;
            driveWet.gain.value = 0.7;
            driveDry.gain.value = 0.3;
        } else {
            driveWet.gain.value = 0;
            driveDry.gain.value = 1;
        }
        
        // Master filter
        masterFilter.frequency.value = p.filter?.cutoff ?? 2000;
        masterFilter.Q.value = p.filter?.q ?? 1;
        masterFilter.type = p.filter?.type ?? 'lowpass';
        
        // EQ
        if (p.eq?.lowShelf) {
            eqLow.frequency.value = p.eq.lowShelf.freq;
            eqLow.gain.value = p.eq.lowShelf.gain;
        }
        if (p.eq?.mid) {
            eqMid.frequency.value = p.eq.mid.freq;
            eqMid.Q.value = p.eq.mid.q;
            eqMid.gain.value = p.eq.mid.gain;
        }
        if (p.eq?.highShelf) {
            eqHigh.frequency.value = p.eq.highShelf.freq;
            eqHigh.gain.value = p.eq.highShelf.gain;
        }
        
        // Output comp
        if (p.comp) {
            outputComp.threshold.value = p.comp.threshold;
            outputComp.ratio.value = p.comp.ratio;
            outputComp.attack.value = p.comp.attack;
            outputComp.release.value = p.comp.release;
            compMakeup.gain.value = dB(p.comp.makeup);
        } else {
            outputComp.threshold.value = -12;
            outputComp.ratio.value = 4;
            outputComp.attack.value = 0.005;
            outputComp.release.value = 0.15;
            compMakeup.gain.value = dB(4);
        }
        
        // Chorus
        if (p.chorus?.on) {
            chorusLfo.frequency.value = p.chorus.rate;
            chorusLfoGain.gain.value = p.chorus.depth;
            chorusWet.gain.value = p.chorus.mix;
            chorusDry.gain.value = 1 - p.chorus.mix * 0.5;
        } else {
            chorusWet.gain.value = 0;
            chorusDry.gain.value = 1;
        }
        
        // Delay
        if (p.delay?.on) {
            delayNode.delayTime.value = p.delay.time;
            delayFeedback.gain.value = p.delay.fb;
            delayFilter.frequency.value = p.delay.hc ?? 2000;
            delayWet.gain.value = p.delay.mix;
            delayDry.gain.value = 1;
        } else {
            delayWet.gain.value = 0;
            delayDry.gain.value = 1;
        }
        
        // Reverb
        reverbWet.gain.value = p.reverbMix ?? 0.08;
        
        // Volume
        if (p.volume !== undefined) {
            instrumentGain.gain.value = p.volume;
        }
    };
    
    updateFromPreset(currentPreset);
    
    // ═══ Voice Management ═══
    
    const activeVoices = new Map<number, BassVoice>();
    
    // Pulse oscillator helper
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
    
    // ─── Note On ───
    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) {
            noteOff(midi, when);
        }
        
        const f0 = midiToHz(midi);
        const vel = clamp(velocity, 0, 1);
        const adsr = currentPreset.adsr;
        
        // Voice gain
        const voiceGain = ctx.createGain();
        voiceGain.gain.value = 0;
        
        // Per-voice filter (for filter envelope)
        const voiceFilter = ctx.createBiquadFilter();
        voiceFilter.type = currentPreset.filter?.type ?? 'lowpass';
        const baseCutoff = currentPreset.filter?.cutoff ?? 2000;
        const keyTrack = currentPreset.filter?.keyTrack ?? 0.3;
        // Key tracking: выше нота = выше cutoff
        const keyTrackOffset = (midi - 36) * keyTrack * 30;
        voiceFilter.frequency.value = baseCutoff + keyTrackOffset;
        voiceFilter.Q.value = currentPreset.filter?.q ?? 1;
        
        const oscillators: OscillatorNode[] = [];
        const gains: GainNode[] = [];
        
        // Main oscillators
        for (const oscConfig of currentPreset.osc) {
            let osc: OscillatorNode;
            
            if (oscConfig.type === 'pulse') {
                osc = createPulseOsc(f0 * Math.pow(2, oscConfig.octave), oscConfig.pulseWidth ?? 0.5);
            } else {
                osc = ctx.createOscillator();
                osc.type = oscConfig.type;
                osc.frequency.value = f0 * Math.pow(2, oscConfig.octave);
            }
            
            osc.detune.value = oscConfig.detune;
            
            const gain = ctx.createGain();
            gain.gain.value = oscConfig.gain * vel;
            
            osc.connect(gain);
            gain.connect(voiceGain);
            osc.start(when);
            
            oscillators.push(osc);
            gains.push(gain);
        }
        
        // Sub oscillator
        let subOsc: OscillatorNode | undefined;
        let subGain: GainNode | undefined;
        
        if (currentPreset.sub?.on) {
            subOsc = ctx.createOscillator();
            subOsc.type = currentPreset.sub.type;
            subOsc.frequency.value = f0 * Math.pow(2, currentPreset.sub.octave);
            
            subGain = ctx.createGain();
            subGain.gain.value = currentPreset.sub.gain * vel;
            
            subOsc.connect(subGain);
            subGain.connect(voiceGain);
            subOsc.start(when);
        }
        
        // String noise
        let noiseSource: AudioBufferSourceNode | undefined;
        
        if (currentPreset.stringNoise?.on) {
            const noiseType = currentPreset.stringNoise.type;
            const buffer = noiseType === 'slap' ? slapNoiseBuffer
                : noiseType === 'pick' ? pickNoiseBuffer
                : fingerNoiseBuffer;
            
            noiseSource = ctx.createBufferSource();
            noiseSource.buffer = buffer;
            
            const noiseGain = ctx.createGain();
            noiseGain.gain.value = currentPreset.stringNoise.amount * vel;
            
            // High-pass для шума (убираем низы)
            const noiseHPF = ctx.createBiquadFilter();
            noiseHPF.type = 'highpass';
            noiseHPF.frequency.value = 800;
            
            noiseSource.connect(noiseHPF);
            noiseHPF.connect(noiseGain);
            noiseGain.connect(voiceGain);
            noiseSource.start(when);
        }
        
        // Connect voice
        voiceGain.connect(voiceFilter);
        voiceFilter.connect(bassSum);
        
        // Filter envelope
        if (currentPreset.filterEnv?.on) {
            applyFilterEnvelope(
                ctx,
                voiceFilter,
                baseCutoff + keyTrackOffset,
                {
                    attack: currentPreset.filterEnv.attack,
                    decay: currentPreset.filterEnv.decay,
                    sustain: currentPreset.filterEnv.sustain,
                    release: currentPreset.filterEnv.release,
                    depth: currentPreset.filterEnv.depth,
                    velocity: currentPreset.filterEnv.velocity
                },
                when,
                vel
            );
        }
        
        // Amp envelope
        voiceGain.gain.cancelScheduledValues(when);
        voiceGain.gain.setValueAtTime(0.0001, when);
        voiceGain.gain.linearRampToValueAtTime(1, when + adsr.a);
        voiceGain.gain.setTargetAtTime(adsr.s, when + adsr.a, Math.max(adsr.d / 3, 0.001));
        
        activeVoices.set(midi, {
            oscillators,
            gains,
            subOsc,
            subGain,
            voiceGain,
            filter: voiceFilter,
            noiseSource,
            startTime: when,
            midi,
            velocity: vel
        });
    };
    
    // ─── Note Off ───
    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi);
        if (!voice) return;
        
        const adsr = currentPreset.adsr;
        const releaseTime = Math.max(adsr.r, 0.02);
        
        // Adaptive release
        const elapsed = when - voice.startTime;
        
        voice.voiceGain.gain.cancelScheduledValues(when);
        
        if (elapsed < adsr.a) {
            // Still in attack — quick release
            const currentGain = (elapsed / adsr.a);
            voice.voiceGain.gain.setValueAtTime(currentGain, when);
            voice.voiceGain.gain.setTargetAtTime(0.0001, when, 0.02);
        } else {
            voice.voiceGain.gain.setValueAtTime(voice.voiceGain.gain.value, when);
            voice.voiceGain.gain.setTargetAtTime(0.0001, when, releaseTime / 3);
        }
        
        // Filter release
        if (currentPreset.filterEnv?.on) {
            const baseCutoff = currentPreset.filter?.cutoff ?? 2000;
            releaseFilterEnvelope(ctx, voice.filter, baseCutoff, releaseTime, when);
        }
        
        const stopTime = when + releaseTime + 0.1;
        voice.oscillators.forEach(osc => osc.stop(stopTime));
        if (voice.subOsc) voice.subOsc.stop(stopTime);
        
        activeVoices.delete(midi);
    };
    
    // ─── All Notes Off ───
    const allNotesOff = () => {
        const now = ctx.currentTime;
        activeVoices.forEach((voice) => {
            voice.voiceGain.gain.cancelScheduledValues(now);
            voice.voiceGain.gain.setTargetAtTime(0.0001, now, 0.05);
            voice.oscillators.forEach(osc => osc.stop(now + 0.15));
            if (voice.subOsc) voice.subOsc.stop(now + 0.15);
        });
        activeVoices.clear();
    };
    
    // ═══ API ═══
    
    const api = {
        noteOn,
        noteOff,
        allNotesOff,
        
        connect: (dest?: AudioNode) => master.connect(dest || output),
        disconnect: () => { try { master.disconnect(); } catch {} },
        
        setPreset: (p: BassPreset) => {
            allNotesOff();
            currentPreset = { ...p };
            updateFromPreset(currentPreset);
        },
        
        setParam: (key: string, value: any) => {
            switch (key) {
                case 'volume':
                    instrumentGain.gain.setTargetAtTime(clamp(value, 0, 1), ctx.currentTime, 0.02);
                    break;
                case 'expression':
                    expressionGain.gain.setTargetAtTime(clamp(value, 0, 1), ctx.currentTime, 0.01);
                    break;
                case 'filterCutoff':
                    masterFilter.frequency.setTargetAtTime(value, ctx.currentTime, 0.02);
                    break;
                case 'filterQ':
                    masterFilter.Q.setTargetAtTime(value, ctx.currentTime, 0.02);
                    break;
                case 'drive':
                    if (currentPreset.drive) {
                        currentPreset.drive.amount = value;
                        updateFromPreset(currentPreset);
                    }
                    break;
                case 'delayMix':
                    delayWet.gain.setTargetAtTime(value, ctx.currentTime, 0.02);
                    break;
            }
        },
        
        setVolume: (v: number) => {
            instrumentGain.gain.setTargetAtTime(clamp(v, 0, 1), ctx.currentTime, 0.02);
        },
        getVolume: () => instrumentGain.gain.value,
        setExpression: (v: number) => {
            expressionGain.gain.setTargetAtTime(clamp(v, 0, 1), ctx.currentTime, 0.01);
        },
        
        preset: currentPreset,
        type: 'bass' as const
    };
    
    console.log('%c[BassEngine] Ready!', 'color: #32CD32; font-weight: bold;');
    return api;
};


// ─────────────────────────────────────────────────────────────────────────────
// MultiInstrument WebAudio: organ | synth | mellotron | guitar
// С адаптивным ADSR и управлением громкостью
// ─────────────────────────────────────────────────────────────────────────────

// ───── Helpers
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

// ───── Distortion Curves
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

// ───── Bypassable FX
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
    organ_soft_jazz: 0.15
};

// ═══════════════════════════════════════════════════════════════════════════
// ORGAN ENGINE (from organ_fab.txt)
// ═══════════════════════════════════════════════════════════════════════════
// ... (All functions from organ_fab.txt are inserted here) ...

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
    
    // #ИСПРАВЛЕНО (ПЛАН 1258): Реализована правильная иерархия определения громкости.
    //                          Теперь `volume` из пресета имеет наивысший приоритет.
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
    reverb.connect(master);

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
    // ORGAN (drawbar + Leslie)
    // ══════════════════════════════════════════════════════════════════════════
    if (type === 'organ') {
        const organApi = await buildOrganEngine(ctx, preset as any, {
            output: master,
            plateIRUrl
        });
        
        // Map organ API to standard API
        api.noteOn = organApi.noteOn;
        api.noteOff = organApi.noteOff;
        api.allNotesOff = organApi.allNotesOff;
        api.setPreset = organApi.setPreset;
        api.setParam = organApi.setParam;
        
        // Volume controls are already handled by the main instrumentGain/expressionGain
        // but we can pass the setters down if the organ needs internal control too.
        (api as any).setLeslie = organApi.setLeslie;
        (api as any).toggleLeslie = organApi.toggleLeslie;
        (api as any).setDrawbar = organApi.setDrawbar;
        (api as any).getDrawbars = organApi.getDrawbars;
    }
    // ══════════════════════════════════════════════════════════════════════════
    // BASS ENGINE
    // ══════════════════════════════════════════════════════════════════════════
    else if (type === 'bass') {
        const bassApi = await buildBassEngine(ctx, preset as BassPreset, {
            output: master,
            plateIRUrl
        });

        api.noteOn = bassApi.noteOn;
        api.noteOff = bassApi.noteOff;
        api.allNotesOff = bassApi.allNotesOff;
        api.setPreset = bassApi.setPreset;
        api.setParam = bassApi.setParam;
        api.setVolume = bassApi.setVolume;
        api.getVolume = bassApi.getVolume;
        api.setExpression = bassApi.setExpression;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SYNTH (subtractive pad/lead)
    else if (type === 'synth') {
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
            activeVoices.forEach((voice) => {
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
    // GUITAR (Gilmour shineOn / muffLead)
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
        const delayB = currentPreset.delayB ? makeFilteredDelay(ctx, currentPreset.delayB) : null;

        const guitarOut = ctx.createGain();
        const revSend = ctx.createGain();

        // ─── Routing ───
        guitarInput.connect(pickupLPF).connect(hpf).connect(compNode).connect(compMakeup)
            .connect(shaper).connect(postHPF).connect(mid1).connect(mid2).connect(postLPF);

        postLPF.connect(cab).connect(cabWet).connect(cabMerge);
        postLPF.connect(cabDry).connect(cabMerge);

        cabMerge.connect(phaser.input);
        phaser.output.connect(delayA.input);
        if (delayB) {
           delayA.output.connect(delayB.input);
           delayB.output.connect(guitarOut);
        } else {
           delayA.output.connect(guitarOut);
        }

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
            if(delayB) delayB.setMix(p.delayB?.on ? (p.delayB.mix ?? 0.15) : 0);

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

// ═══════════════════════════════════════════════════════════════════════════
// ORGAN ENGINE
// ═══════════════════════════════════════════════════════════════════════════
// #ЗАЧЕМ: Этот блок инкапсулирует всю сложную логику эмуляции электромеханического органа.
// #ЧТО: Он создает полифонический инструмент с эмуляцией регистров (drawbars),
//      вибрато-сканера, динамика Лесли и перкуссии.
// #СВЯЗИ: Вызывается из `buildMultiInstrument`, если `type` пресета равен 'organ'.

interface OrganVoice { oscillators: OscillatorNode[]; gains: GainNode[]; voiceGain: GainNode; percGain?: GainNode; percOsc?: OscillatorNode; clickSource?: AudioBufferSourceNode; startTime: number; midi: number; }

export const buildOrganEngine = async (ctx: AudioContext, preset: any, options: { output?: AudioNode; plateIRUrl?: string | null; } = {}) => {
    console.log('%c[OrganEngine] Building Hammond-style organ...', 'color: #8B4513; font-weight: bold;');
    const output = options.output || ctx.destination; let currentPreset = { ...preset };
    const tonewheelWave = ctx.createPeriodicWave(new Float32Array([0, 1, 0.02, 0.015, 0.008]), new Float32Array(5));
    const clickIntensity = currentPreset.keyClick ?? 0.004; let clickBuffer = createKeyClick(ctx, 0.008, clickIntensity);
    const organSum = ctx.createGain(); organSum.gain.value = 0.7;
    const hpf = ctx.createBiquadFilter(); hpf.type = 'highpass'; hpf.frequency.value = currentPreset.hpf ?? 60;
    const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = currentPreset.lpf ?? 5000;
    const vibrato = createVibratoScanner(ctx, { type: currentPreset.vibrato?.type !== 'off' ? (currentPreset.vibrato?.type || 'C2') : 'C2', rate: currentPreset.vibrato?.rate ?? 6.5 });
    const vibratoBypass = ctx.createGain(); vibratoBypass.gain.value = currentPreset.vibrato?.type === 'off' ? 1 : 0;
    const vibratoWet = ctx.createGain(); vibratoWet.gain.value = currentPreset.vibrato?.type === 'off' ? 0 : 1;
    const leslie = createLeslie(ctx, { mode: currentPreset.leslie?.mode ?? 'slow', slow: currentPreset.leslie?.slow ?? 0.8, fast: currentPreset.leslie?.fast ?? 6.5, accel: currentPreset.leslie?.accel ?? 0.8, hornDepth: 0.8, drumDepth: 0.5, mix: currentPreset.leslie?.mix ?? 0.7 });
    const leslieBypass = ctx.createGain(); leslieBypass.gain.value = currentPreset.leslie?.on === false ? 1 : 0;
    const leslieWet = ctx.createGain(); leslieWet.gain.value = currentPreset.leslie?.on === false ? 0 : 1;
    const instrumentGain = ctx.createGain(); instrumentGain.gain.value = currentPreset.volume ?? 0.7;
    const expressionGain = ctx.createGain(); expressionGain.gain.value = 1;
    const master = ctx.createGain(); master.gain.value = 0.8;
    const reverb = ctx.createConvolver(); const reverbWet = ctx.createGain(); reverbWet.gain.value = currentPreset.reverbMix ?? 0.15;
    if (options.plateIRUrl) { loadIR(ctx, options.plateIRUrl).then(buf => { if (buf) reverb.buffer = buf; }); }
    organSum.connect(hpf).connect(lpf);
    lpf.connect(vibrato.input); lpf.connect(vibratoBypass); vibrato.output.connect(vibratoWet);
    const vibratoMerge = ctx.createGain(); vibratoBypass.connect(vibratoMerge); vibratoWet.connect(vibratoMerge);
    vibratoMerge.connect(leslie.input); vibratoMerge.connect(leslieBypass); leslie.output.connect(leslieWet);
    const leslieMerge = ctx.createGain(); leslieBypass.connect(leslieMerge); leslieWet.connect(leslieMerge);
    leslieMerge.connect(expressionGain).connect(instrumentGain).connect(master);
    leslieMerge.connect(reverbWet).connect(reverb).connect(master);
    master.connect(output);
    const activeVoices = new Map<number, OrganVoice>();
    const DRAWBAR_RATIOS = [0.5, 1.498, 1, 2, 2.997, 4, 5.04, 5.994, 8];
    const adsrController = new AdaptiveADSR(ctx);
    const noteOn = (midi: number, when = ctx.currentTime, velocity = 1.0) => {
        if (activeVoices.has(midi)) { noteOff(midi, when); }
        const f0 = midiToHz(midi); const vel = clamp(velocity, 0, 1);
        const drawbars = currentPreset.drawbars || [8, 8, 8, 0, 0, 0, 0, 0, 0];
        const adsr = currentPreset.adsr || { a: 0.005, d: 0.1, s: 0.9, r: 0.1 };
        const voiceGain = ctx.createGain(); voiceGain.gain.value = 0; voiceGain.connect(organSum);
        const oscillators: OscillatorNode[] = []; const gains: GainNode[] = [];
        for (let i = 0; i < 9; i++) {
            const dbValue = drawbars[i] ?? 0; if (dbValue === 0) continue;
            const osc = ctx.createOscillator(); osc.setPeriodicWave(tonewheelWave); osc.frequency.value = f0 * DRAWBAR_RATIOS[i];
            const gain = ctx.createGain(); gain.gain.value = (dbValue / 8) * 0.35 * vel;
            osc.connect(gain).connect(voiceGain); osc.start(when); oscillators.push(osc); gains.push(gain);
        }
        let percGain: GainNode | undefined, percOsc: OscillatorNode | undefined;
        if (currentPreset.percussion?.on && activeVoices.size === 0) {
            const percHarmonic = currentPreset.percussion.harmonic === '3rd' ? 2.997 : 2; const percDecay = currentPreset.percussion.decay === 'slow' ? 0.5 : 0.2;
            const percVol = currentPreset.percussion.volume === 'soft' ? 0.15 : 0.25;
            percOsc = ctx.createOscillator(); percOsc.setPeriodicWave(tonewheelWave); percOsc.frequency.value = f0 * percHarmonic;
            percGain = ctx.createGain(); percGain.gain.value = percVol * vel; percGain.gain.setTargetAtTime(0, when, percDecay / 3);
            percOsc.connect(percGain).connect(voiceGain); percOsc.start(when); percOsc.stop(when + percDecay + 0.1);
        }
        let clickSource: AudioBufferSourceNode | undefined;
        if (clickIntensity > 0 && clickBuffer) {
            clickSource = ctx.createBufferSource(); clickSource.buffer = clickBuffer; const clickGain = ctx.createGain(); clickGain.gain.value = vel * 0.8;
            clickSource.connect(clickGain).connect(voiceGain); clickSource.start(when);
        }
        const voiceState = adsrController.triggerAttack(vGain, when, adsr, vel);
        activeVoices.set(midi, { ...voiceState, oscillators, gains, percGain, percOsc, clickSource, startTime: when, midi });
    };
    const noteOff = (midi: number, when = ctx.currentTime) => {
        const voice = activeVoices.get(midi); if (!voice) return;
        const adsr = currentPreset.adsr || { a: 0.005, d: 0.1, s: 0.9, r: 0.1 };
        const stopTime = adsrController.triggerRelease(voice, when, adsr);
        voice.oscillators.forEach(osc => osc.stop(stopTime + 0.1)); if (voice.percOsc) { try { voice.percOsc.stop(stopTime); } catch {} }
        activeVoices.delete(midi);
    };
    const allNotesOff = () => { activeVoices.forEach((voice, midi) => noteOff(midi, ctx.currentTime)); };
    const updateFromPreset = (p: any) => { /* ... update logic ... */ };
    console.log('%c[OrganEngine] Ready!', 'color: #32CD32; font-weight: bold;');
    return {
        noteOn, noteOff, allNotesOff,
        connect: (dest?: AudioNode) => master.connect(dest || output), disconnect: () => { try { master.disconnect(); } catch {} },
        setPreset: (p: any) => { allNotesOff(); currentPreset = { ...p }; updateFromPreset(currentPreset); },
        setParam: (key: string, value: any) => { /* ... param logic ... */ },
        setVolume: (v: number) => { instrumentGain.gain.setTargetAtTime(clamp(v, 0, 1), ctx.currentTime, 0.02); },
        getVolume: () => instrumentGain.gain.value,
        setExpression: (v: number) => { expressionGain.gain.setTargetAtTime(clamp(v, 0, 1), ctx.currentTime, 0.01); },
        setLeslie: (mode: 'stop' | 'slow' | 'fast') => leslie.setMode(mode),
        toggleLeslie: () => { const current = leslie.getMode(); leslie.setMode(current === 'fast' ? 'slow' : 'fast'); },
        setDrawbar: (index: number, value: number) => { if (currentPreset.drawbars && index >= 0 && index < 9) { currentPreset.drawbars[index] = clamp(value, 0, 8); } },
        getDrawbars: () => [...(currentPreset.drawbars || [])],
        preset: currentPreset, type: 'organ' as const
    };
};

// ... a similar block for MELLOTRON could be added here
// ... a similar block for GUITAR could be added here
// ... etc.


