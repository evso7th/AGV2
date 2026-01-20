
//Fab v 2.0
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
    // #ИСПРАВЛЕНО (ПЛАН 1287): Заменена нестабильная логика `setTargetAtTime`.
    // #ЗАЧЕМ: Предотвращает ошибку "BiquadFilterNode: state is bad" при очень коротких `releaseTime`.
    // #ЧТО: Если release очень короткий, мы мгновенно устанавливаем значение. Если нет,
    //      используем более стабильный `linearRampToValueAtTime` для плавного затухания.
    if (releaseTime < 0.05) { // 50ms threshold
        filter.frequency.setValueAtTime(baseCutoff, when);
    } else {
        filter.frequency.setValueAtTime(filter.frequency.value, when); // Start from current value
        filter.frequency.linearRampToValueAtTime(baseCutoff, when + releaseTime);
    }
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
    master.gain.value = 0.425; // Halved from 0.85
    
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
                currentPreset.filterEnv,
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
            const keyTrack = currentPreset.filter?.keyTrack ?? 0.3;
            const keyTrackOffset = (voice.midi - 36) * keyTrack * 30;
            releaseFilterEnvelope(ctx, voice.filter, baseCutoff + keyTrackOffset, releaseTime, when);
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

const makeSoftClip = (amount = 0.5, n = 65536) => {
    const c=new Float32Array(n); const k=clamp(amount, 0, 1) * 10 + 1;
    for (let i=0;i<n;i++){ const x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); }
    return c;
};


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
    
    private readonly MIN_ATTACK = 0.003;
    private readonly MIN_RELEASE = 0.02;

    constructor(ctx: AudioContext) {
        this.ctx = ctx;
    }

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

        return { gain: gainNode, startTime, phase: 'attack', targetPeak: peak, nodes: [] };
    }

    triggerRelease(voiceState: VoiceState, when: number, adsr: Partial<ADSRParams> = {}): number {
        const params = { ...this.defaultParams, ...adsr };
        const r = Math.max(params.r, this.MIN_RELEASE);
        const now = this.ctx.currentTime;
        const releaseStartTime = Math.max(when, now);

        voiceState.gain.gain.cancelScheduledValues(releaseStartTime);

        if (releaseStartTime < voiceState.startTime + params.a) {
            // Ещё в атаке — быстрый микро-release
            const currentGain = voiceState.gain.gain.value;
            voiceState.gain.gain.setValueAtTime(currentGain, releaseStartTime);
            voiceState.gain.gain.linearRampToValueAtTime(0.0001, releaseStartTime + r * 0.2); // Faster release
            return releaseStartTime + r * 0.2;
        } else {
            // Нормальный release
            voiceState.gain.gain.setTargetAtTime(0.0001, releaseStartTime, r / 3);
            return releaseStartTime + r;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// VOLUME MANAGER
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_VOLUMES: Record<string, number> = {
    synth: 0.7,
    guitar: 0.75,
    organ: 0.65,
    mellotron: 0.7,
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

    const adsrController = new AdaptiveADSR(ctx);
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
        loadIR(ctx, plateIRUrl).then(buf => {
            if (buf) reverb.buffer = buf;
        });
    }
    reverb.connect(master);

    const api: InstrumentAPI = {
        connect: (dest?: AudioNode) => master.connect(dest || output),
        disconnect: () => { try { master.disconnect(); } catch {} },
        noteOn: () => {}, noteOff: () => {}, allNotesOff: () => {}, setPreset: () => {}, setParam: () => {},
        setVolume: (level: number) => instrumentGain.gain.setTargetAtTime(clamp(level, 0, 1), ctx.currentTime, 0.02),
        getVolume: () => instrumentGain.gain.value,
        setVolumeDb: (db: number) => instrumentGain.gain.setTargetAtTime(dB(clamp(db, -60, 12)), ctx.currentTime, 0.02),
        setExpression: (level: number) => expressionGain.gain.setTargetAtTime(clamp(level, 0, 1), ctx.currentTime, 0.01),
        preset: preset,
        type: type
    };

    if (type === 'synth') {
        // #ЗАЧЕМ: Этот блок полностью переписан для реализации истинной полифонии и корректной ADSR-огибающей.
        // #ЧТО: Теперь для каждой ноты создается свой "голосовой канал" с собственным гейном и осцилляторами.
        //      Это решает проблему "кражи голосов". Также исправлена логика затухания (Decay),
        //      чтобы устранить "мяукающий" артефакт звука.
        // #СВЯЗИ: Эта архитектура соответствует профессиональным практикам Web Audio и обеспечивает
        //         чистое, предсказуемое звучание аккордов и арпеджио.
        const { lpf = {}, lfo = {} } = preset;
        const pre = ctx.createGain();
        const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = lpf.cutoff || 1800; filt.Q.value = lpf.q || 0.7;
        
        pre.connect(filt);
        filt.connect(expressionGain);
        expressionGain.connect(instrumentGain).connect(master);
        
        if (lfo?.amount > 0 && lfo.target === 'filter') {
          const lfoNode = ctx.createOscillator(); lfoNode.type = lfo.shape || 'sine'; lfoNode.frequency.value = lfo.rate || 0;
          const lfoGain = ctx.createGain(); lfoGain.gain.value = lfo.amount || 0;
          lfoNode.connect(lfoGain).connect(filt.frequency);
          lfoNode.start();
        }
        
        const activeVoices = new Map<number, { nodes: AudioNode[], voiceGain: GainNode }>();
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0); for (let i = 0; i < noiseData.length; i++) noiseData[i] = (Math.random()*2-1) * 0.4;

        api.noteOn = (midi, when = ctx.currentTime, velocity = 1.0) => {
            if (activeVoices.has(midi)) api.noteOff(midi, when);
            
            const f = midiToHz(midi);
            const { osc = [], noise = { on: false, gain: 0 }, adsr = {a:0.01, d:0.3, s:0.5, r:1.0} } = api.preset;

            const voiceGain = ctx.createGain();
            voiceGain.gain.value = 0;
            voiceGain.connect(pre);

            const voiceNodes: AudioNode[] = [voiceGain];
            
            osc.forEach((o: any) => {
                const x = ctx.createOscillator(); x.type = o.type; x.detune.value = o.detune || 0;
                const g = ctx.createGain(); g.gain.value = o.gain;
                x.frequency.value = f * Math.pow(2, o.octave || 0);
                x.connect(g).connect(voiceGain);
                x.start(when);
                voiceNodes.push(x, g);
            });

            if (noise.on) {
                const n = ctx.createBufferSource();
                n.buffer = noiseBuffer;
                n.loop = true;
                const ng = ctx.createGain(); ng.gain.value = noise.gain;
                n.connect(ng).connect(voiceGain);
                n.start(when);
                voiceNodes.push(n, ng);
            }

            const peakGain = velocity;
            const sustainValue = peakGain * adsr.s;
            const attackEndTime = when + adsr.a;
            
            voiceGain.gain.cancelScheduledValues(when);
            voiceGain.gain.setValueAtTime(0.0001, when);
            voiceGain.gain.linearRampToValueAtTime(peakGain, attackEndTime);
            voiceGain.gain.setTargetAtTime(sustainValue, attackEndTime, Math.max(adsr.d / 5, 0.001));

            activeVoices.set(midi, { nodes: voiceNodes, voiceGain });
        };

        api.noteOff = (midi, when = ctx.currentTime) => {
            const voice = activeVoices.get(midi);
            if (!voice) return;

            const { adsr = {a:0.01, d:0.3, s:0.5, r:1.0} } = api.preset;
            const { voiceGain, nodes } = voice;
            
            voiceGain.gain.cancelScheduledValues(when);
            voiceGain.gain.setTargetAtTime(0.0001, when, adsr.r / 5);
            
            const stopTime = when + adsr.r * 2;
            nodes.forEach(node => {
                if (node instanceof OscillatorNode || node instanceof AudioBufferSourceNode) {
                    try { (node as any).stop(stopTime); } catch (e) {}
                }
            });
            
            activeVoices.delete(midi);
        };

        api.allNotesOff = () => {
            const now = ctx.currentTime;
            activeVoices.forEach((_, midi) => api.noteOff(midi, now));
        };

        api.setPreset = (p) => {
            api.allNotesOff();
            api.preset = p;
            const { lpf } = p;
            if(lpf) {
                filt.frequency.setTargetAtTime(lpf.cutoff || 1800, ctx.currentTime, 0.02);
                filt.Q.setTargetAtTime(lpf.q || 0.7, ctx.currentTime, 0.02);
            }
        };

    } else if (type === 'bass') {
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
    
    master.connect(output);
    console.log(`%c[InstrumentFactory] Build COMPLETED: ${type}`, 'color: #32CD32; font-weight: bold;');
    return api;
}

// Dummy functions to avoid breaking the code if they are not fully defined yet.
const createKeyClick = (ctx: AudioContext, duration: number, intensity: number): AudioBuffer => { return ctx.createBuffer(1,1,ctx.sampleRate); }
const createVibratoScanner = (ctx: AudioContext, config: any) => { return { input: ctx.createGain(), output: ctx.createGain(), setType: ()=>{}, setRate: ()=>{} }; }
const createLeslie = (ctx: AudioContext, config: any) => { return { input: ctx.createGain(), output: ctx.createGain(), setMode: ()=>{}, setMix: ()=>{}, getMode: ()=> 'slow'}; }
