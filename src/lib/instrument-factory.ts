
/**
 * @fileOverview Центральная фабрика инструментов V7.0 — "Архитектура ЛЕГИОН".
 * #ЗАЧЕМ: Полное устранение интермодуляционных искажений ("грязи") при наслоении нот.
 * #ЧТО: ПЛАН №18 — Каждая нота теперь является независимым голосом со своей цепочкой FX.
 *       Голос создается при noteOn и полностью уничтожается после завершения release.
 */

// ───── GLOBAL REGISTRY & LIMITS ─────

let globalActiveVoices: any[] = [];
let globalVoiceLimit = 150; 

export const setGlobalVoiceLimit = (limit: number) => {
    if (isFinite(limit) && limit > 0) {
        globalVoiceLimit = limit;
        console.log(`%c[LegionFactory] Voice Limit set to: ${limit}`, 'color: #facc15; font-weight: bold;');
        enforceVoiceLimit(); 
    }
};

export const globalAllNotesOff = () => {
    [...globalActiveVoices].forEach(v => deepCleanup(v));
    globalActiveVoices = [];
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
    
    const idx = globalActiveVoices.indexOf(voiceRecord);
    if (idx !== -1) globalActiveVoices.splice(idx, 1);
};

const enforceVoiceLimit = () => {
    while (globalActiveVoices.length > globalVoiceLimit) {
        let targetIndex = globalActiveVoices.findIndex(v => v.type !== 'bass');
        if (targetIndex === -1) break;

        const oldest = globalActiveVoices.splice(targetIndex, 1)[0];
        if (oldest) {
            const voiceNode = oldest.voiceState?.node;
            if (voiceNode && !oldest.cleaned) {
                const now = voiceNode.context.currentTime;
                const stealFadeOut = 0.05;
                try {
                    voiceNode.gain.cancelScheduledValues(now);
                    voiceNode.gain.setTargetAtTime(0, now, stealFadeOut / 4);
                    if (oldest.nodes) {
                        oldest.nodes.forEach((n: any) => {
                            if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
                                try { n.stop(now + stealFadeOut + 0.01); } catch(e){}
                            }
                        });
                    }
                    setTimeout(() => deepCleanup(oldest), (stealFadeOut * 1000) + 50);
                } catch (e) { deepCleanup(oldest); }
            } else { deepCleanup(oldest); }
        }
    }
};

// ───── HELPERS ─────

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const getADSR = (p: any) => {
    const a = p.adsr || p;
    let rawA = isFinite(a.a) ? a.a : (isFinite(a.attack) ? a.attack : 0.01);
    let rawD = isFinite(a.d) ? a.d : (isFinite(a.decay) ? a.decay : 0.1);
    let rawS = isFinite(a.s) ? a.s : (isFinite(a.sustain) ? a.sustain : 0.7);
    let rawR = isFinite(a.r) ? a.r : (isFinite(a.release) ? a.release : 0.3);
    return { a: rawA, d: rawD, s: rawS, r: rawR };
};

// ───── CURVES ─────

const makeMuff = (gain = 0.65) => {
    const n = 4096;
    const c = new Float32Array(n);
    const k = 1 + clamp(gain, 0, 1) * 6;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = Math.tanh(x * k);
    }
    return c;
};

const makeSoftDrive = (amount = 0.2) => {
    const n = 4096;
    const c = new Float32Array(n);
    const k = amount * 4;
    for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1;
        c[i] = x / (1 + k * Math.abs(x));
    }
    return c;
};

// ───── VOICE INSTANTIATION ─────

/**
 * Основная логика независимого голоса.
 * Создает изолированную цепочку FX для каждой ноты.
 */
const createIndependentVoice = (ctx: AudioContext, type: string, preset: any, output: AudioNode, midi: number, when: number, velocity: number, duration: number) => {
    const f0 = midiToHz(midi);
    const adsr = getADSR(preset);
    const now = Math.max(when, ctx.currentTime);
    
    // 1. Узел огибающей и громкости ноты
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0;
    
    const nodes: AudioNode[] = [voiceGain];
    
    // 2. Генераторы (Осцилляторы)
    if (type === 'guitar') {
        const width = preset.osc?.width || 0.45;
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * width);
        const wave = ctx.createPeriodicWave(real, imag);
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(wave);
        osc.frequency.setValueAtTime(f0, now);
        osc.connect(voiceGain);
        osc.start(now);
        nodes.push(osc);
    } else if (type === 'organ') {
        const real = new Float32Array(17), imag = new Float32Array(17);
        const indices = [1, 3, 2, 4, 6, 8, 10, 12, 16];
        const drawbars = preset.drawbars || [8,0,8,0,0,0,0,0,0];
        drawbars.forEach((v: number, i: number) => { if (v > 0) real[indices[i]] = v / 8; });
        const wave = ctx.createPeriodicWave(real, imag);
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(wave);
        osc.frequency.setValueAtTime(f0, now);
        osc.connect(voiceGain);
        osc.start(now);
        nodes.push(osc);
    } else {
        const oscConfigs = preset.osc || [{ type: 'sawtooth', gain: 0.5 }];
        oscConfigs.forEach((o: any) => {
            const osc = ctx.createOscillator();
            osc.type = o.type;
            osc.frequency.setValueAtTime(f0 * Math.pow(2, o.octave || 0), now);
            const g = ctx.createGain();
            g.gain.value = o.gain ?? 0.5;
            osc.connect(g).connect(voiceGain);
            osc.start(now);
            nodes.push(osc, g);
        });
    }

    // 3. Цепочка эффектов ГОЛОСА (Изолированная!)
    let chainHead: AudioNode = voiceGain;

    // Distortion (только если amount > 0)
    if (preset.drive?.amount > 0.01) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = preset.drive.type === 'muff' ? makeMuff(preset.drive.amount) : makeSoftDrive(preset.drive.amount);
        shaper.oversample = '4x';
        chainHead.connect(shaper);
        chainHead = shaper;
        nodes.push(shaper);
    }

    // Filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = preset.post?.lpf || preset.lpf?.cutoff || preset.lpf || 2000;
    filter.Q.value = preset.lpf?.q || 0.7;
    chainHead.connect(filter);
    chainHead = filter;
    nodes.push(filter);

    // Подключение к общему выходу инструмента
    chainHead.connect(output);

    // 4. Запуск ADSR
    const peak = velocity * 0.8;
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(peak, now + adsr.a);
    voiceGain.gain.setTargetAtTime(peak * adsr.s, now + adsr.a, Math.max(adsr.d / 3, 0.001));

    const noteOffTime = now + duration;
    voiceGain.gain.setTargetAtTime(0.0001, noteOffTime, Math.max(adsr.r / 3, 0.001));

    // 5. Регистрация для очистки
    const record = { nodes, voiceState: { node: voiceGain, startTime: now }, cleaned: false, type };
    globalActiveVoices.push(record);
    
    // Авто-удаление после завершения звука
    const totalLife = duration + adsr.r * 5;
    setTimeout(() => deepCleanup(record), totalLife * 1000 + 100);

    nodes.forEach(n => {
        if (n instanceof OscillatorNode) n.stop(now + totalLife + 0.5);
    });
};

export interface InstrumentAPI {
    connect: (dest?: AudioNode) => void;
    disconnect: () => void;
    noteOn: (midi: number, when?: number, velocity?: number, duration?: number) => void;
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
}

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    
    let currentPreset = { ...preset };
    
    // Общие узлы для всех голосов инструмента
    const instrumentGain = ctx.createGain(); 
    instrumentGain.gain.value = isFinite(currentPreset.volume) ? currentPreset.volume : 0.7;
    
    const expressionGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -12.0;
    limiter.ratio.value = 20;

    instrumentGain.connect(expressionGain).connect(panner).connect(limiter).connect(output);

    return {
        connect: (dest) => limiter.connect(dest || output),
        disconnect: () => {
            globalActiveVoices.filter(v => v.type === type).forEach(v => deepCleanup(v));
            [instrumentGain, expressionGain, panner, limiter].forEach(n => { try { n.disconnect(); } catch(e){} });
        },
        noteOn: (midi, when = ctx.currentTime, velocity = 1.0, duration = 1.0) => {
            enforceVoiceLimit();
            createIndependentVoice(ctx, type, currentPreset, instrumentGain, midi, when, velocity, duration);
        },
        noteOff: () => {}, // Release обрабатывается автоматически в Legion
        allNotesOff: () => {
            globalActiveVoices.filter(v => v.type === type).forEach(v => deepCleanup(v));
        },
        setPreset: (p) => { currentPreset = { ...p }; instrumentGain.gain.setTargetAtTime(p.volume || 0.7, ctx.currentTime, 0.05); },
        setParam: () => {},
        setVolume: (v) => { if(isFinite(v)) instrumentGain.gain.setTargetAtTime(v, ctx.currentTime, 0.02); },
        setVolumeDb: (db) => { if(isFinite(db)) instrumentGain.gain.setTargetAtTime(Math.pow(10, db/20), ctx.currentTime, 0.02); },
        getVolume: () => instrumentGain.gain.value,
        setExpression: (v) => { if(isFinite(v)) expressionGain.gain.setTargetAtTime(v, ctx.currentTime, 0.01); },
        setPan: (v) => { if(isFinite(v)) panner.pan.setTargetAtTime(clamp(v, -1, 1), ctx.currentTime, 0.05); },
        preset: currentPreset,
        type
    };
}
