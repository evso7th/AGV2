/**
 * @fileOverview Центральная фабрика инструментов V10.0 — "Pure Graph Protocol".
 * #ЗАЧЕМ: Устранение утечки узлов в системе Voice Stealing и консолидация фильтров.
 */

import { dbToGain } from './guitar-loudness';

// ───── GLOBAL REGISTRY & LIMITS ─────

export let globalActiveVoices = new Set<any>();
let globalVoiceLimit = 128;

const STEAL_PRIORITY: Record<string, number> = {
    'sparkle': 0,
    'sfx': 0,
    'melody': 1,
    'drums': 1,
    'accompaniment': 2,
    'harmony': 2,
    'bass': 3,
    'pianoAccompaniment': 4 
};

export const setGlobalVoiceLimit = (limit: number) => {
    if (isFinite(limit) && limit > 0) {
        globalVoiceLimit = limit;
        enforceVoiceLimit(); 
    }
};

export const globalAllNotesOff = () => {
    const allVoices = [...globalActiveVoices];
    allVoices.forEach(v => deepCleanup(v));
};

/**
 * #ЗАЧЕМ: Гарантированное уничтожение всех связей в графе.
 */
export const deepCleanup = (voiceRecord: any) => {
    if (!voiceRecord || voiceRecord.disposed) return;
    voiceRecord.disposed = true;
    
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

export const collectExpiredVoices = (audioCtxTime: number) => {
    const voicesToCull: any[] = [];
    for (const voice of globalActiveVoices) {
        if (voice.expirationTime < audioCtxTime) {
            voicesToCull.push(voice);
        }
    }
    for (const voice of voicesToCull) {
        deepCleanup(voice);
    }
};

/**
 * #ЗАЧЕМ: Быстрая очистка при перегрузе.
 */
const enforceVoiceLimit = () => {
    const currentLength = globalActiveVoices.size;
    if (currentLength <= globalVoiceLimit) return;

    const toKillCount = currentLength - globalVoiceLimit;
    const allVoices = Array.from(globalActiveVoices).filter(v => !v.disposed);
    
    // Сортировка только при реальном перегрузе
    allVoices.sort((a, b) => {
        const prioA = STEAL_PRIORITY[a.type] ?? 1;
        const prioB = STEAL_PRIORITY[b.type] ?? 1;
        if (prioA !== prioB) return prioA - prioB;
        return a.voiceState.startTime - b.voiceState.startTime;
    });

    const targets = allVoices.slice(0, toKillCount);
    targets.forEach(oldest => {
        const voiceNode = oldest.voiceState?.node;
        if (voiceNode) {
            const now = voiceNode.context.currentTime;
            try {
                voiceNode.gain.cancelScheduledValues(now);
                voiceNode.gain.setTargetAtTime(0, now, 0.015);
                // Принудительная смерть через 100мс
                oldest.expirationTime = now + 0.1;
            } catch (e) {
                deepCleanup(oldest);
            }
        } else {
            deepCleanup(oldest);
        }
    });
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

const waveCache = new WeakMap<AudioContext, Map<string, PeriodicWave>>();

const getCachedWave = (ctx: AudioContext, key: string, build: () => PeriodicWave): PeriodicWave => {
    let perCtx = waveCache.get(ctx);
    if (!perCtx) {
        perCtx = new Map();
        waveCache.set(ctx, perCtx);
    }
    let wave = perCtx.get(key);
    if (!wave) {
        wave = build();
        perCtx.set(key, wave);
    }
    return wave;
};

const getGuitarWave = (ctx: AudioContext, width: number): PeriodicWave =>
    getCachedWave(ctx, `g:${Math.round(width * 1e4) / 1e4}:v2`, () => {
        const real = new Float32Array(65), imag = new Float32Array(65);
        for (let n = 1; n < 65; n++) {
            let amplitude = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * width);
            if (n % 2 !== 0) amplitude *= 1.5;
            real[n] = amplitude;
        }
        return ctx.createPeriodicWave(real, imag);
    });

const getOrganWave = (ctx: AudioContext, drawbars: number[]): PeriodicWave =>
    getCachedWave(ctx, `o:${drawbars.join(',')}`, () => {
        const real = new Float32Array(17), imag = new Float32Array(17);
        const indices = [1, 3, 2, 4, 6, 8, 10, 12, 16];
        drawbars.forEach((v: number, i: number) => { if (v > 0) real[indices[i]] = v / 8; });
        return ctx.createPeriodicWave(real, imag);
    });

const curveCache = new Map<string, Float32Array>();
const getDriveCurve = (type: string, amount: number): Float32Array => {
    const q = Math.round(amount * 100) / 100;
    const key = `${type}:${q}`;
    if (curveCache.has(key)) return curveCache.get(key)!;
    const n = 4096, c = new Float32Array(n);
    if (type === 'muff') {
        const k = 1 + q * 6;
        for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * k); }
    } else {
        const k = q * 4;
        for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = x / (1 + k * Math.abs(x)); }
    }
    curveCache.set(key, c);
    return c;
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
    tempo: number = 72
) => {
    const f0 = midiToHz(midi);
    const adsr = getADSR(preset, eventParams);
    const now = Math.max(when, ctx.currentTime);

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0;
    const nodes: AudioNode[] = [voiceGain];
    let mainOsc: OscillatorNode | null = null;

    if (type === 'guitar') {
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(getGuitarWave(ctx, preset.osc?.width || 0.45));
        osc.frequency.setValueAtTime(f0, now);
        osc.connect(voiceGain);
        osc.start(now);
        nodes.push(osc);
        mainOsc = osc;
    } else if (type === 'organ') {
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(getOrganWave(ctx, preset.drawbars || [8,0,8,0,0,0,0,0,0]));
        osc.frequency.setValueAtTime(f0, now);
        osc.connect(voiceGain);
        osc.start(now);
        nodes.push(osc);
        mainOsc = osc;
    } else {
        const oscConfigs = preset.osc || [{ type: 'sawtooth', gain: 0.5 }];
        oscConfigs.forEach((o: any, idx: number) => {
            const osc = ctx.createOscillator();
            osc.type = o.type;
            osc.frequency.setValueAtTime(f0 * Math.pow(2, o.octave || 0), now);
            if (isFinite(o.detune) && o.detune !== 0) osc.detune.setValueAtTime(o.detune, now);
            const g = ctx.createGain();
            g.gain.value = o.gain ?? 0.5;
            osc.connect(g).connect(voiceGain);
            osc.start(now);
            nodes.push(osc, g);
            if (idx === 0) mainOsc = osc;
        });
    }

    let chainHead: AudioNode = voiceGain;

    if (preset.drive?.amount > 0.01) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = getDriveCurve(preset.drive.type, preset.drive.amount);
        shaper.oversample = '2x';
        chainHead.connect(shaper);
        chainHead = shaper;
        nodes.push(shaper);
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const baseCutoff = preset.post?.lpf || preset.lpf?.cutoff || 2000;
    let finalCutoff = baseCutoff;
    if (midi > 60) finalCutoff = baseCutoff * Math.pow(0.92, midi - 60);
    filter.frequency.value = finalCutoff * (tempo / 72);
    filter.Q.value = type === 'guitar' ? 0.7 : (preset.lpf?.q || 0.7);

    chainHead.connect(filter);
    chainHead = filter;
    nodes.push(filter);

    if (sharedDelayNode && preset.delay?.mix > 0.01) {
        chainHead.connect(sharedDelayNode);
    }

    chainHead.connect(output);

    const peak = velocity * 0.45;
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(peak, now + adsr.a);
    voiceGain.gain.setTargetAtTime(peak * adsr.s, now + adsr.a, Math.max(adsr.d / 3, 0.001));

    const noteOffTime = now + duration;
    const releaseTimeConstant = Math.max(adsr.r / 3, 0.08); 
    voiceGain.gain.setTargetAtTime(0.0001, noteOffTime, releaseTimeConstant);

    const expirationTime = now + duration + (releaseTimeConstant * 5) + 0.5;
    const record = { nodes, voiceState: { node: voiceGain, startTime: now }, disposed: false, type, expirationTime };
    globalActiveVoices.add(record);
    enforceVoiceLimit();

    return record; 
};

export interface InstrumentAPI {
    connect: (dest?: AudioNode) => void;
    disconnect: () => void;
    noteOn: (midi: number, when?: number, velocity?: number, duration?: number, params?: any) => void;
    allNotesOff: () => void;
    setPreset: (p: any) => void;
    setVolume: (level: number) => void;
    preset: any;
}

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    output = ctx.destination
}: { type?: string, preset?: any, output?: AudioNode } = {}): Promise<InstrumentAPI> {
    
    let currentPreset = { ...preset };
    const instrumentGain = ctx.createGain();
    instrumentGain.gain.value = isFinite(currentPreset.volume) ? currentPreset.volume : 0.7;
    
    const bus = ctx.createGain();
    const panner = ctx.createStereoPanner();
    
    // #ЗАЧЕМ: Студийная коррекция на уровне ШИНЫ, а не голоса.
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass'; hpf.frequency.value = type === 'bass' ? 30 : 180;

    const boxyCut = ctx.createBiquadFilter();
    boxyCut.type = 'peaking'; boxyCut.frequency.value = 500; boxyCut.gain.value = type === 'guitar' ? -3.5 : 0;

    const presence = ctx.createBiquadFilter();
    presence.type = 'peaking'; presence.frequency.value = 2500; presence.gain.value = type === 'guitar' ? 2.5 : 0;

    instrumentGain.connect(hpf);
    hpf.connect(boxyCut);
    boxyCut.connect(presence);
    presence.connect(panner);
    panner.connect(output);

    const sharedDelay = ctx.createDelay(2.0);
    const feedback = ctx.createGain();
    const delayMix = ctx.createGain();
    sharedDelay.connect(feedback); feedback.connect(sharedDelay);
    sharedDelay.connect(delayMix); delayMix.connect(panner);
    
    const updateFX = () => {
        const now = ctx.currentTime;
        sharedDelay.delayTime.setTargetAtTime(currentPreset.delay?.time || 0.4, now, 0.1);
        feedback.gain.setTargetAtTime(currentPreset.delay?.fb || 0.3, now, 0.1);
        delayMix.gain.setTargetAtTime(currentPreset.delay?.mix || 0, now, 0.1);
    };
    updateFX();

    return {
        preset: currentPreset,
        noteOn: (midi, when = ctx.currentTime, velocity = 1.0, duration = 1.0, params = null) => {
            if (!isFinite(midi) || midi < 0 || midi > 127) return;
            createIndependentVoice(ctx, type, currentPreset, instrumentGain, midi, when, velocity, duration, sharedDelay, params, params?.tempo || 72);
        },
        allNotesOff: () => {
            [...globalActiveVoices].filter(v => v.type === type).forEach(v => deepCleanup(v));
        },
        setPreset: (p) => {
            currentPreset = { ...p };
            instrumentGain.gain.setTargetAtTime(p.volume || 0.7, ctx.currentTime, 0.05);
            updateFX();
        },
        setVolume: (v) => {
            instrumentGain.gain.setTargetAtTime(clamp(v, 0, 1), ctx.currentTime, 0.02);
        },
        disconnect: () => {
            [...globalActiveVoices].filter(v => v.type === type).forEach(v => deepCleanup(v));
            [instrumentGain, hpf, boxyCut, presence, panner, sharedDelay, feedback, delayMix].forEach(n => n.disconnect());
        },
        connect: (dest) => panner.connect(dest || output)
    };
}
