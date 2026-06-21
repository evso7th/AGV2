/**
 * @fileOverview Центральная фабрика инструментов V8.8 — "Anti-Stutter Update".
 * #ЗАЧЕМ: ПЛАН №1269 — Ужесточение политики очистки и ускорение затухания при краже голосов.
 */

// ───── GLOBAL CACHES ─────
const waveCache = new Map<string, PeriodicWave>();
const curveCache = new Map<string, Float32Array>();

// ───── GLOBAL REGISTRY & LIMITS ─────
let globalActiveVoices = new Set<any>();
let globalVoiceLimit = 1024; 

export const setGlobalVoiceLimit = (limit: number) => {
    if (isFinite(limit) && limit > 0) {
        globalVoiceLimit = limit;
        enforceVoiceLimit(); 
    }
};

/**
 * #ЗАЧЕМ: ПЛАН №1248. Плавная очистка голосов.
 */
export const globalAllNotesOff = () => {
    const voices = Array.from(globalActiveVoices);
    voices.forEach(v => {
        if (v.voiceState && v.voiceState.node) {
            const ctx = v.voiceState.node.context;
            const currentTime = ctx.currentTime;
            try {
                v.voiceState.node.gain.cancelScheduledValues(currentTime);
                v.voiceState.node.gain.setTargetAtTime(0.0001, currentTime, 0.4); 
                setTimeout(() => deepCleanup(v), 4000);
            } catch (e) { deepCleanup(v); }
        } else {
            deepCleanup(v);
        }
    });
};

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
    globalActiveVoices.delete(voiceRecord);
};

const enforceVoiceLimit = () => {
    if (globalActiveVoices.size <= globalVoiceLimit) return;

    // ПЛАН №1269: Удаляем 15% старых голосов при переполнении для запаса хода.
    const toKillCount = Math.max(1, Math.floor(globalActiveVoices.size - globalVoiceLimit + (globalVoiceLimit * 0.15)));
    const iterator = globalActiveVoices.values();
    
    for (let i = 0; i < toKillCount; i++) {
        const oldest = iterator.next().value;
        if (!oldest) break;
        
        const voiceNode = oldest.voiceState?.node;
        if (voiceNode && !oldest.cleaned) {
            const now = voiceNode.context.currentTime;
            const stealFadeOut = 0.3; // ПЛАН №1269: Ускоренное затухание щипка (было 0.4)
            try {
                voiceNode.gain.cancelScheduledValues(now);
                voiceNode.gain.setTargetAtTime(0.0001, now, 0.08); // Более резкий, но безопасный фейд
                if (oldest.nodes) {
                    oldest.nodes.forEach((n: any) => {
                        if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
                            try { n.stop(now + stealFadeOut + 0.1); } catch(e){}
                        }
                    });
                }
                setTimeout(() => deepCleanup(oldest), 500);
            } catch (e) { deepCleanup(oldest); }
        } else { deepCleanup(oldest); }
    }
};

// ───── CACHED RESOURCE GENERATORS ─────

const getCachedWave = (ctx: AudioContext, type: 'guitar' | 'organ', params: any): PeriodicWave => {
    const cacheKey = type === 'guitar' 
        ? `wave_guitar_${(params.width || 0.45).toFixed(3)}`
        : `wave_organ_${(params.drawbars || []).join(',')}`;
    
    let wave = waveCache.get(cacheKey);
    if (!wave) {
        if (type === 'guitar') {
            const width = params.width || 0.45;
            const real = new Float32Array(32), imag = new Float32Array(32);
            for (let n = 1; n < 32; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * width);
            wave = ctx.createPeriodicWave(real, imag);
        } else {
            const real = new Float32Array(17), imag = new Float32Array(17);
            const indices = [1, 3, 2, 4, 6, 8, 10, 12, 16];
            const drawbars = params.drawbars || [8,0,8,0,0,0,0,0,0];
            drawbars.forEach((v: number, i: number) => { if (v > 0) real[indices[i]] = v / 8; });
            wave = ctx.createPeriodicWave(real, imag);
        }
        waveCache.set(cacheKey, wave);
    }
    return wave;
};

const getCachedCurve = (type: 'muff' | 'soft', amount: number): Float32Array => {
    const cacheKey = `curve_${type}_${amount.toFixed(3)}`;
    let curve = curveCache.get(cacheKey);
    if (!curve) {
        const n = 4096;
        const c = new Float32Array(n);
        if (type === 'muff') {
            const k = 1 + clamp(amount, 0, 1) * 6;
            for (let i = 0; i < n; i++) {
                const x = (i / (n - 1)) * 2 - 1;
                c[i] = Math.tanh(x * k);
            }
        } else {
            const k = amount * 4;
            for (let i = 0; i < n; i++) {
                const x = (i / (n - 1)) * 2 - 1;
                c[i] = x / (1 + k * Math.abs(x));
            }
        }
        curve = c;
        curveCache.set(cacheKey, curve);
    }
    return curve;
};

// ───── HELPERS ─────

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const getADSR = (p: any, params?: any) => {
    const a = p.adsr || p;
    let rawA = isFinite(params?.attack) ? params.attack : (isFinite(a.a) ? a.a : (isFinite(a.attack) ? a.attack : 0.01));
    let rawD = isFinite(params?.decay) ? params.decay : (isFinite(a.d) ? a.d : (isFinite(a.decay) ? a.decay : 0.1));
    let rawS = isFinite(params?.sustain) ? params.sustain : (isFinite(a.s) ? a.s : (isFinite(a.sustain) ? a.sustain : 0.7));
    let rawR = isFinite(params?.release) ? params.release : (isFinite(a.r) ? a.r : (isFinite(a.release) ? a.release : 0.3));
    return { a: rawA, d: rawD, s: rawS, r: rawR };
};

// ───── VOICE INSTANTIATION ─────

const createIndependentVoice = (
    ctx: AudioContext, 
    type: string, 
    preset: any, 
    output: AudioNode, 
    midi: number, 
    when: number, 
    velocity: number, 
    duration: number,
    sharedDelayNode: AudioNode | null = null,
    eventParams: any = null,
    instanceId: string 
) => {
    const now = ctx.currentTime;
    const playTime = isFinite(when) ? Math.max(when, now) : now;
    if (playTime < 0) return;

    const f0 = midiToHz(midi);
    const adsr = getADSR(preset, eventParams);
    
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0;
    
    const nodes: AudioNode[] = [voiceGain];
    const tonalOscillators: OscillatorNode[] = [];
    
    if (type === 'guitar') {
        const wave = getCachedWave(ctx, 'guitar', { width: preset.osc?.width });
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(wave);
        osc.frequency.setValueAtTime(f0, playTime);
        osc.connect(voiceGain);
        osc.start(playTime);
        nodes.push(osc);
        tonalOscillators.push(osc);
    } else if (type === 'organ') {
        const wave = getCachedWave(ctx, 'organ', { drawbars: preset.drawbars });
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(wave);
        osc.frequency.setValueAtTime(f0, playTime);
        osc.connect(voiceGain);
        osc.start(playTime);
        nodes.push(osc);
        tonalOscillators.push(osc);
    } else {
        const oscConfigs = preset.osc || [{ type: 'sawtooth', gain: 0.5 }];
        oscConfigs.forEach((o: any) => {
            const osc = ctx.createOscillator();
            osc.type = o.type;
            osc.frequency.setValueAtTime(f0 * Math.pow(2, o.octave || 0), playTime);
            const g = ctx.createGain();
            g.gain.value = o.gain ?? 0.5;
            osc.connect(g).connect(voiceGain);
            osc.start(playTime);
            nodes.push(osc, g);
            tonalOscillators.push(osc);
        });
    }

    let chainHead: AudioNode = voiceGain;

    if (preset.drive?.amount > 0.01) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = getCachedCurve(preset.drive.type === 'muff' ? 'muff' : 'soft', preset.drive.amount);
        shaper.oversample = 'none'; 
        chainHead.connect(shaper);
        chainHead = shaper;
        nodes.push(shaper);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCutoff = preset.post?.lpf || preset.lpf?.cutoff || preset.lpf || 2000;
    const baseQ = preset.lpf?.q || 0.7;

    let finalCutoff = baseCutoff;
    let finalQ = baseQ;

    if (midi > 60) {
        const semitonesAbove = midi - 60;
        finalCutoff = baseCutoff * Math.pow(0.92, semitonesAbove); 
        finalQ = baseQ * Math.pow(0.95, semitonesAbove);
        if (midi > 84) finalCutoff = Math.min(finalCutoff, 1800);
    }

    filter.frequency.value = finalCutoff;
    filter.Q.value = finalQ;
    chainHead.connect(filter);
    chainHead = filter;
    nodes.push(filter);

    if (preset.lfo && preset.lfo.amount > 0) {
        const lfo = ctx.createOscillator();
        lfo.type = preset.lfo.shape || 'sine';
        lfo.frequency.setValueAtTime(preset.lfo.rate || 5, playTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(preset.lfo.amount);
        lfo.connect(lfoGain);
        if (preset.lfo.target === 'pitch') {
            tonalOscillators.forEach(osc => lfoGain.connect(osc.detune));
        } else if (preset.lfo.target === 'filter') {
            lfoGain.connect(filter.frequency);
        }
        lfo.start(playTime);
        nodes.push(lfo, lfoGain);
    }

    if (sharedDelayNode && preset.delay?.mix > 0.01) {
        chainHead.connect(sharedDelayNode);
    }

    chainHead.connect(output);

    const peak = Math.max(0.0001, velocity * 0.7);
    voiceGain.gain.setValueAtTime(0.0001, playTime);
    try {
        voiceGain.gain.exponentialRampToValueAtTime(peak, playTime + adsr.a);
        voiceGain.gain.setTargetAtTime(peak * adsr.s, playTime + adsr.a, Math.max(adsr.d / 3, 0.001));
    } catch (e) {
        voiceGain.gain.linearRampToValueAtTime(peak, playTime + adsr.a);
    }

    const noteOffTime = playTime + duration;
    // ПЛАН №1269: Ускоренная деактивация нод для предотвращения переполнения.
    const releaseTimeConstant = Math.max(adsr.r / 3.0, 0.15); 
    voiceGain.gain.setTargetAtTime(0.0001, noteOffTime, releaseTimeConstant);

    const record = { nodes, voiceState: { node: voiceGain, startTime: playTime }, cleaned: false, type, instanceId };
    globalActiveVoices.add(record);
    
    // ПЛАН №1269: Сборщик мусора приходит на 2 сек раньше (было +2.0).
    const totalLife = duration + (releaseTimeConstant * 10);
    setTimeout(() => deepCleanup(record), totalLife * 1000);

    nodes.forEach(n => {
        if (n instanceof OscillatorNode) n.stop(playTime + totalLife + 0.5);
    });
};

export interface InstrumentAPI {
    connect: (dest?: AudioNode) => void;
    disconnect: () => void;
    noteOn: (midi: number, when?: number, velocity?: number, duration?: number, params?: any) => void;
    noteOff: (midi: number, when?: number, velocity?: number, duration?: number) => void;
    allNotesOff: () => void;
    setPreset: (p: any) => void;
    setParam: (k: string, v: any) => void;
    setVolume: (level: number) => void;
    setVolumeDb: (db: number) => void;
    getVolume: () => number;
    setExpression: (level: number) => void;
    setPan: (level: number) => void;
    preset: any;
    type: string;
    id: string;
}

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    
    const instanceId = Math.random().toString(36).substring(2, 15);
    let currentPreset = { ...preset };
    
    const instrumentGain = ctx.createGain(); 
    instrumentGain.gain.value = isFinite(currentPreset.volume) ? currentPreset.volume : 0.7;
    
    const expressionGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12.0;
    limiter.ratio.value = 20;

    const sharedDelayNode = ctx.createDelay(2.0);
    const feedbackGain = ctx.createGain();
    const delayMixGain = ctx.createGain();

    sharedDelayNode.connect(feedbackGain);
    feedbackGain.connect(sharedDelayNode);
    sharedDelayNode.connect(delayMixGain);
    
    sharedDelayNode.delayTime.value = currentPreset.delay?.time || 0.4;
    feedbackGain.gain.value = currentPreset.delay?.fb || 0.3;
    delayMixGain.gain.value = currentPreset.delay?.mix || 0;

    instrumentGain.connect(expressionGain).connect(panner).connect(limiter).connect(output);
    delayMixGain.connect(panner); 

    return {
        id: instanceId,
        connect: (dest) => limiter.connect(dest || output),
        disconnect: () => {
            const voices = Array.from(globalActiveVoices).filter(v => v.instanceId === instanceId);
            voices.forEach(v => deepCleanup(v));
            [instrumentGain, expressionGain, panner, limiter, sharedDelayNode, feedbackGain, delayMixGain].forEach(n => { try { n.disconnect(); } catch(e){} });
        },
        noteOn: (midi, when = ctx.currentTime, velocity = 1.0, duration = 1.0, params = null) => {
            enforceVoiceLimit();
            createIndependentVoice(ctx, type, currentPreset, instrumentGain, midi, when, velocity, duration, sharedDelayNode, params, instanceId);
        },
        noteOff: () => {}, 
        allNotesOff: () => {
            const voices = Array.from(globalActiveVoices).filter(v => v.instanceId === instanceId);
            voices.forEach(v => {
                if (v.voiceState && v.voiceState.node) {
                    const ct = v.voiceState.node.context.currentTime;
                    try {
                        v.voiceState.node.gain.cancelScheduledValues(ct);
                        v.voiceState.node.gain.setTargetAtTime(0.0001, ct, 0.2); 
                        setTimeout(() => deepCleanup(v), 2000);
                    } catch (e) { deepCleanup(v); }
                } else {
                    deepCleanup(v);
                }
            });
        },
        setPreset: (p) => { 
            const now = ctx.currentTime;
            currentPreset = { ...p }; 
            instrumentGain.gain.cancelScheduledValues(now);
            instrumentGain.gain.setTargetAtTime(p.volume || 0.7, now, 0.05);
            if (p.delay) {
                sharedDelayNode.delayTime.setTargetAtTime(p.delay.time || 0.4, now, 0.1);
                feedbackGain.gain.setTargetAtTime(p.delay.fb || 0.3, now, 0.1);
                delayMixGain.gain.setTargetAtTime(p.delay.mix || 0, now, 0.1);
            }
        },
        setParam: () => {},
        setVolume: (v) => { 
            if(isFinite(v)) {
                const now = ctx.currentTime;
                instrumentGain.gain.cancelScheduledValues(now);
                instrumentGain.gain.setTargetAtTime(v, now, 0.02); 
            }
        },
        setVolumeDb: (db) => { 
            if(isFinite(db)) {
                const now = ctx.currentTime;
                instrumentGain.gain.cancelScheduledValues(now);
                instrumentGain.gain.setTargetAtTime(Math.pow(10, db/20), now, 0.02); 
            }
        },
        getVolume: () => instrumentGain.gain.value,
        setExpression: (v) => { 
            if(isFinite(v)) {
                const now = ctx.currentTime;
                expressionGain.gain.cancelScheduledValues(now);
                expressionGain.gain.setTargetAtTime(v, now, 0.01); 
            }
        },
        setPan: (v) => { 
            if(isFinite(v)) {
                const now = ctx.currentTime;
                panner.pan.cancelScheduledValues(now);
                panner.pan.setTargetAtTime(clamp(v, -1, 1), now, 0.05); 
            }
        },
        preset: currentPreset,
        type
    };
}