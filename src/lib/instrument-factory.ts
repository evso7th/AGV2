
/**
 * @fileOverview Центральная фабрика инструментов V8.1 — "Deterministic Gain Protocol".
 * #ЗАЧЕМ: ПЛАН №1177 — Устранение эффекта "плавающей" громкости через строгую атомарность.
 * #ЧТО: Внедрение cancelScheduledValues во все узлы управления уровнем.
 */

import { dbToGain } from './guitar-loudness';

// ───── GLOBAL REGISTRY & LIMITS ─────

let globalActiveVoices: any[] = [];
let globalVoiceLimit = 512; 

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
    if (globalActiveVoices.length <= globalVoiceLimit) return;

    const voicesToConsider = [...globalActiveVoices].sort((a, b) => {
        const prioA = STEAL_PRIORITY[a.type] ?? 1;
        const prioB = STEAL_PRIORITY[b.type] ?? 1;
        if (prioA !== prioB) return prioA - prioB;
        return a.startTime - b.startTime;
    });

    const toKillCount = globalActiveVoices.length - globalVoiceLimit;
    const targets = voicesToConsider.slice(0, toKillCount);

    targets.forEach(oldest => {
        const voiceNode = oldest.voiceState?.node;
        if (voiceNode && !oldest.cleaned) {
            const now = voiceNode.context.currentTime;
            const stealFadeOut = 0.5; 
            try {
                voiceNode.gain.cancelScheduledValues(now);
                voiceNode.gain.setTargetAtTime(0, now, stealFadeOut / 4);
                if (oldest.nodes) {
                    oldest.nodes.forEach((n: any) => {
                        if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) {
                            try { n.stop(now + stealFadeOut + 0.1); } catch(e){}
                        }
                    });
                }
                setTimeout(() => deepCleanup(oldest), (stealFadeOut * 1000) + 200);
            } catch (e) { deepCleanup(oldest); }
        } else { deepCleanup(oldest); }
    });
};

// ───── HELPERS ─────

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const getADSR = (p: any, params?: any) => {
    const a = p.adsr || p;
    // #ЗАЧЕМ: ПЛАН №1177. Приоритет параметров из FractalEvent для правильной отработки Swell.
    let rawA = isFinite(params?.attack) ? params.attack : (isFinite(a.a) ? a.a : (isFinite(a.attack) ? a.attack : 0.01));
    let rawD = isFinite(params?.decay) ? params.decay : (isFinite(a.d) ? a.d : (isFinite(a.decay) ? a.decay : 0.1));
    let rawS = isFinite(params?.sustain) ? params.sustain : (isFinite(a.s) ? a.s : (isFinite(a.sustain) ? a.sustain : 0.7));
    let rawR = isFinite(params?.release) ? params.release : (isFinite(a.r) ? a.r : (isFinite(a.release) ? a.release : 0.3));
    return { a: rawA, d: rawD, s: rawS, r: rawR };
};

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

// ───── SHAPE/WAVE CACHES (#ЗАЧЕМ: устранение GC-шторма в горячем пути noteOn) ─────
// Кривые WaveShaper и PeriodicWave зависят только от пресета, не от ноты,
// поэтому вычисляются один раз и переиспользуются между голосами.

const curveCache = new Map<string, Float32Array<ArrayBuffer>>();

const getDriveCurve = (driveType: string, amount: number): Float32Array<ArrayBuffer> => {
    const q = Math.round(amount * 1e4) / 1e4; // квантование ключа
    const key = `${driveType === 'muff' ? 'm' : 's'}:${q}`;
    let curve = curveCache.get(key);
    if (!curve) {
        curve = driveType === 'muff' ? makeMuff(q) : makeSoftDrive(q);
        curveCache.set(key, curve);
    }
    return curve;
};

// PeriodicWave привязан к конкретному AudioContext, поэтому кэш — per-context.
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
    getCachedWave(ctx, `g:${Math.round(width * 1e4) / 1e4}`, () => {
        const real = new Float32Array(32), imag = new Float32Array(32);
        for (let n = 1; n < 32; n++) real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * width);
        return ctx.createPeriodicWave(real, imag);
    });

const ORGAN_INDICES = [1, 3, 2, 4, 6, 8, 10, 12, 16];

const getOrganWave = (ctx: AudioContext, drawbars: number[]): PeriodicWave =>
    getCachedWave(ctx, `o:${drawbars.join(',')}`, () => {
        const real = new Float32Array(17), imag = new Float32Array(17);
        drawbars.forEach((v: number, i: number) => { if (v > 0) real[ORGAN_INDICES[i]] = v / 8; });
        return ctx.createPeriodicWave(real, imag);
    });

// Зацикленный буфер белого шума — один на контекст (источники переиспользуют его).
const noiseBufferCache = new WeakMap<AudioContext, AudioBuffer>();

const getNoiseBuffer = (ctx: AudioContext): AudioBuffer => {
    let buf = noiseBufferCache.get(ctx);
    if (!buf) {
        const len = Math.floor(ctx.sampleRate * 2); // 2 c, бесшовно зацикливается
        buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        noiseBufferCache.set(ctx, buf);
    }
    return buf;
};

// ───── ATTACK-TRANSIENT BANK ─────
// #ЗАЧЕМ: синтезированной гитаре не хватает «щипка». Прививаем первые ~22 мс реальной
// атаки из сэмплов black-acoustic — ухо считывает артикуляцию по транзиенту, а тело
// ноты остаётся синтетическим (электро-лид). Разреженный набор + питч-сдвиг по playbackRate.

const TRANSIENT_DIR = '/assets/acoustic_guitar_samples/black/ord/';
const TRANSIENT_MS = 22;          // длительность среза
const TRANSIENT_FADE_MS = 6;      // фейд в конце среза, чтобы не было щелчка на стыке

// Файлы выбраны из BLACK_GUITAR_MANIFEST (только гарантированно существующие слои),
// ~каждые 3–4 полутона — ошибка питча транзиента на 20 мс неразличима на слух.
const TRANSIENT_SOURCES: { m: number; file: string }[] = [
    { m: 52, file: 'twang_e3_f_rr2.ogg' },
    { m: 55, file: 'twang_g3_mf_rr1.ogg' },
    { m: 59, file: 'twang_b3_mf_rr1.ogg' },
    { m: 62, file: 'twang_d4_f_rr1.ogg' },
    { m: 65, file: 'twang_f4_mf_rr1.ogg' },
    { m: 69, file: 'twang_a4_mf_rr2.ogg' },
    { m: 72, file: 'twang_c5_f_rr3.ogg' },
    { m: 76, file: 'twang_e5_f_rr1.ogg' },
    { m: 79, file: 'twang_g5_mf_rr2.ogg' },
    { m: 83, file: 'twang_b5_mf_rr1.ogg' },
    { m: 88, file: 'twang_e6_mf_rr1.ogg' },
];

interface TransientBank {
    samples: { m: number; buffer: AudioBuffer }[];
    midis: number[];
    state: 'idle' | 'loading' | 'ready';
}

const transientBanks = new WeakMap<AudioContext, TransientBank>();

const sliceTransient = (ctx: AudioContext, src: AudioBuffer): AudioBuffer => {
    const len = Math.min(src.length, Math.floor((TRANSIENT_MS / 1000) * src.sampleRate));
    const fadeLen = Math.floor((TRANSIENT_FADE_MS / 1000) * src.sampleRate);
    const out = ctx.createBuffer(src.numberOfChannels, len, src.sampleRate);
    for (let ch = 0; ch < src.numberOfChannels; ch++) {
        const inData = src.getChannelData(ch);
        const outData = out.getChannelData(ch);
        for (let i = 0; i < len; i++) {
            let g = 1;
            if (i > len - fadeLen) g = (len - i) / fadeLen; // линейный фейд-аут хвоста
            outData[i] = inData[i] * g;
        }
    }
    return out;
};

const ensureTransientsLoaded = (ctx: AudioContext): void => {
    let bank = transientBanks.get(ctx);
    if (!bank) {
        bank = { samples: [], midis: [], state: 'idle' };
        transientBanks.set(ctx, bank);
    }
    if (bank.state !== 'idle') return; // уже грузится или готов
    bank.state = 'loading';

    Promise.all(TRANSIENT_SOURCES.map(async ({ m, file }) => {
        try {
            const res = await fetch(TRANSIENT_DIR + file);
            if (!res.ok) return null;
            const arr = await res.arrayBuffer();
            const decoded = await ctx.decodeAudioData(arr);
            return { m, buffer: sliceTransient(ctx, decoded) };
        } catch {
            return null;
        }
    })).then(results => {
        const ok = results.filter((r): r is { m: number; buffer: AudioBuffer } => r !== null);
        ok.sort((a, b) => a.m - b.m);
        bank!.samples = ok;
        bank!.midis = ok.map(s => s.m);
        bank!.state = 'ready';
    });
};

const getTransient = (ctx: AudioContext, midi: number): { buffer: AudioBuffer; sampleMidi: number } | null => {
    const bank = transientBanks.get(ctx);
    if (!bank || bank.state !== 'ready' || bank.samples.length === 0) return null;
    let best = bank.samples[0];
    for (const s of bank.samples) {
        if (Math.abs(s.m - midi) < Math.abs(best.m - midi)) best = s;
    }
    return { buffer: best.buffer, sampleMidi: best.m };
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

    // #ЗАЧЕМ (#2): per-note humanize — две одинаковые ноты не идентичны (разброс контактов/
    // тонколёс реального органа). Микро-разброс детюна/уровня/яркости. Нейтрально без флага.
    const hz = preset.humanize;
    const humDetune = hz ? (Math.random() * 2 - 1) * (isFinite(hz.detuneCents) ? hz.detuneCents : 2.5) : 0;
    const humLevel = hz ? 1 + (Math.random() * 2 - 1) * (isFinite(hz.levelPct) ? hz.levelPct : 0.05) : 1;
    const humBright = hz ? 1 + (Math.random() * 2 - 1) * (isFinite(hz.brightnessPct) ? hz.brightnessPct : 0.06) : 1;

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = 0;
    
    const nodes: AudioNode[] = [voiceGain];
    let guitarOsc: OscillatorNode | null = null;

    if (type === 'guitar') {
        const width = preset.osc?.width || 0.45;
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(getGuitarWave(ctx, width));
        osc.frequency.setValueAtTime(f0, now);
        osc.connect(voiceGain);
        osc.start(now);
        nodes.push(osc);
        guitarOsc = osc;
    } else if (type === 'organ') {
        const drawbars = preset.drawbars || [8,0,8,0,0,0,0,0,0];
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(getOrganWave(ctx, drawbars));
        osc.frequency.setValueAtTime(f0, now);
        if (humDetune !== 0) osc.detune.setValueAtTime(humDetune, now);
        osc.connect(voiceGain);
        osc.start(now);
        nodes.push(osc);
    } else {
        const oscConfigs = preset.osc || [{ type: 'sawtooth', gain: 0.5 }];
        oscConfigs.forEach((o: any) => {
            const osc = ctx.createOscillator();
            osc.type = o.type;
            osc.frequency.setValueAtTime(f0 * Math.pow(2, o.octave || 0), now);
            // #ЗАЧЕМ: расстройка осцилляторов даёт естественный хорус от биений (заложена в пресетах).
            if (isFinite(o.detune) && o.detune !== 0) osc.detune.setValueAtTime(o.detune, now);
            const g = ctx.createGain();
            g.gain.value = o.gain ?? 0.5;
            osc.connect(g).connect(voiceGain);
            osc.start(now);
            nodes.push(osc, g);
        });
    }

    // #ЗАЧЕМ: воздушный шумовой слой пресета (например synth.noise) — раньше игнорировался.
    if (preset.noise?.on && isFinite(preset.noise.gain) && preset.noise.gain > 0) {
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = getNoiseBuffer(ctx);
        noiseSrc.loop = true;
        const noiseGain = ctx.createGain();
        noiseGain.gain.value = preset.noise.gain;
        noiseSrc.connect(noiseGain).connect(voiceGain);
        noiseSrc.start(now);
        nodes.push(noiseSrc, noiseGain);
    }

    let chainHead: AudioNode = voiceGain;

    // ───── Гибридная гитара: реальный транзиент + вибрато (только для флагнутых пресетов) ─────
    if (type === 'guitar' && (preset.attackTransient > 0 || preset.vibrato)) {
        // colorInput суммирует синт (после ADSR) и сэмпл-транзиент ДО драйва/фильтра,
        // чтобы оба прошли одинаковую «усилительную» окраску.
        const colorInput = ctx.createGain();
        voiceGain.connect(colorInput);
        nodes.push(colorInput);
        chainHead = colorInput;

        // Транзиент: первые ~22 мс реальной атаки, питч-сдвинутые к ноте. Своя огибающая
        // запечена в сэмпле, поэтому в обход ADSR — даёт «щипок», а тело остаётся синтетическим.
        if (preset.attackTransient > 0) {
            const t = getTransient(ctx, midi);
            if (t) {
                const tSrc = ctx.createBufferSource();
                tSrc.buffer = t.buffer;
                const rate = Math.pow(2, (midi - t.sampleMidi) / 12);
                tSrc.playbackRate.value = isFinite(rate) ? rate : 1.0;
                const tGain = ctx.createGain();
                tGain.gain.value = velocity * preset.attackTransient;
                tSrc.connect(tGain).connect(colorInput);
                tSrc.start(now);
                nodes.push(tSrc, tGain);
            }
        }

        // Вибрато «поющего» лида: появляется с задержкой, чтобы короткие ноты были чистыми.
        if (preset.vibrato && guitarOsc) {
            const { rate = 5.2, depthCents = 7, delay = 0.35 } = preset.vibrato;
            const lfo = ctx.createOscillator();
            lfo.frequency.value = rate;
            const lfoGain = ctx.createGain();
            lfoGain.gain.setValueAtTime(0, now);
            lfoGain.gain.setTargetAtTime(depthCents, now + delay, 0.25);
            lfo.connect(lfoGain).connect(guitarOsc.detune);
            lfo.start(now);
            nodes.push(lfo, lfoGain);
        }
    }

    if (preset.drive?.amount > 0.01) {
        const shaper = ctx.createWaveShaper();
        shaper.curve = getDriveCurve(preset.drive.type, preset.drive.amount);
        // #ЗАЧЕМ: оверсэмплинг подавляет алиасинг от нелинейности (грязь на высоких нотах).
        // muff агрессивнее (tanh) → 4x, soft мягче → 2x.
        shaper.oversample = preset.drive.type === 'muff' ? '4x' : '2x';
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

    const tempoScale = tempo / 72;
    finalCutoff = finalCutoff * tempoScale * humBright; // humBright=1 без humanize

    filter.Q.value = finalQ;
    // #ЗАЧЕМ: у щипка атака ярче тела — фильтр стартует выше и оседает к finalCutoff.
    // Глубину задаёт pluckBrightness, плюс связь со velocity (сильнее ударил → ярче).
    if (preset.pluckBrightness > 0) {
        const nyquist = ctx.sampleRate * 0.45;
        const peakCut = Math.min(finalCutoff * (1 + preset.pluckBrightness * (0.5 + velocity)), nyquist);
        filter.frequency.setValueAtTime(peakCut, now);
        filter.frequency.setTargetAtTime(finalCutoff, now, 0.10);
    } else {
        filter.frequency.value = finalCutoff;
    }
    chainHead.connect(filter);
    chainHead = filter;
    nodes.push(filter);

    if (sharedDelayNode && preset.delay?.mix > 0.01) {
        chainHead.connect(sharedDelayNode);
    }

    chainHead.connect(output);

    const peak = velocity * 0.8 * humLevel; // humLevel=1 без humanize
    voiceGain.gain.setValueAtTime(0.0001, now);
    voiceGain.gain.exponentialRampToValueAtTime(peak, now + adsr.a);
    voiceGain.gain.setTargetAtTime(peak * adsr.s, now + adsr.a, Math.max(adsr.d / 3, 0.001));

    const noteOffTime = now + duration;
    const releaseTimeConstant = Math.max(adsr.r / 3, 0.08); 
    voiceGain.gain.setTargetAtTime(0.0001, noteOffTime, releaseTimeConstant);

    const record = { nodes, voiceState: { node: voiceGain, startTime: now }, cleaned: false, type };
    globalActiveVoices.push(record);
    enforceVoiceLimit();

    const totalLife = duration + (releaseTimeConstant * 5) + 1.0;
    setTimeout(() => deepCleanup(record), totalLife * 1000 + 200);

    nodes.forEach(n => {
        if (n instanceof OscillatorNode || n instanceof AudioBufferSourceNode) n.stop(now + totalLife + 0.5);
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
}

export async function buildMultiInstrument(ctx: AudioContext, {
    type = 'synth',
    preset = {} as any,
    output = ctx.destination
} = {}): Promise<InstrumentAPI> {
    
    let currentPreset = { ...preset };

    // #ЗАЧЕМ: гитарам с граф-транзиентом заранее (в фоне) грузим срезы атаки,
    // чтобы к первой ноте банк был готов. Идемпотентно и кэшируется per-context.
    if (type === 'guitar' && currentPreset.attackTransient > 0) ensureTransientsLoaded(ctx);

    const instrumentGain = ctx.createGain();
    instrumentGain.gain.value = isFinite(currentPreset.volume) ? currentPreset.volume : 0.7;
    
    const expressionGain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const limiter = ctx.createDynamicsCompressor();
    // #ЗАЧЕМ: лимитер сделан ПРОЗРАЧНЫМ (ratio 1:1) — никакой динамической компрессии/«pumping».
    // Требование: громкость = ровно как выставлено в микшере (не больше/не меньше), баланс сводится вручную.
    limiter.threshold.value = 0.0;
    limiter.ratio.value = 1.0;

    const sharedDelayNode = ctx.createDelay(2.0);
    const feedbackGain = ctx.createGain();
    const delayMixGain = ctx.createGain();

    sharedDelayNode.connect(feedbackGain);
    feedbackGain.connect(sharedDelayNode);
    sharedDelayNode.connect(delayMixGain);
    
    sharedDelayNode.delayTime.value = currentPreset.delay?.time || 0.4;
    feedbackGain.gain.value = currentPreset.delay?.fb || 0.3;
    delayMixGain.gain.value = currentPreset.delay?.mix || 0;

    // ───── Leslie / хорус органа (shared, один «вращающийся динамик» на инструмент) ─────
    // #ЗАЧЕМ: drawbar-орган без вращения звучит стерильно. Имитируем Leslie тремя слоями:
    //   • вибрато Доплера — модулированная задержка качает питч;
    //   • противофазное тремоло L/R — эффект вращения в стерео;
    // Создаётся один раз (не на ноту), поэтому на GC/CPU в горячем пути не влияет.
    const leslieNodes: AudioNode[] = [];
    let leslieLfo: OscillatorNode | null = null;

    if (type === 'organ' && currentPreset.leslie) {
        const cfg = currentPreset.leslie === true ? {} : currentPreset.leslie;
        const rate = isFinite(cfg.rate) ? cfg.rate : 5.6;          // Гц (горн)
        const pitchDepth = isFinite(cfg.pitchDepth) ? cfg.pitchDepth : 0.0012; // c, размах задержки
        const ampDepth = isFinite(cfg.ampDepth) ? cfg.ampDepth : 0.22;         // глубина тремоло
        const driftPct = isFinite(cfg.driftPct) ? cfg.driftPct : 0.18;         // ±дрейф скорости ротора
        const driftRate = isFinite(cfg.driftRate) ? cfg.driftRate : 0.2;       // Гц «дыхания» мотора

        leslieLfo = ctx.createOscillator();
        leslieLfo.frequency.value = rate;

        // #ЗАЧЕМ (#1): реальный мотор Leslie крутится неровно — скорость «гуляет».
        // Очень медленный под-LFO качает частоту основного LFO на ±driftPct → вращение «дышит».
        if (driftPct > 0) {
            const driftLfo = ctx.createOscillator();
            driftLfo.frequency.value = driftRate;
            const driftGain = ctx.createGain();
            driftGain.gain.value = rate * driftPct; // размах в Гц вокруг базовой скорости
            driftLfo.connect(driftGain).connect(leslieLfo.frequency);
            driftLfo.start();
            leslieNodes.push(driftLfo, driftGain);
        }

        // Вибрато Доплера: задержка ~3.5 мс, качаемая LFO.
        const vib = ctx.createDelay(0.05);
        vib.delayTime.value = 0.0035;
        const vibDepth = ctx.createGain();
        vibDepth.gain.value = pitchDepth;
        leslieLfo.connect(vibDepth).connect(vib.delayTime);

        // Стерео-вращение: два канала с противофазным тремоло.
        const tremL = ctx.createGain(); tremL.gain.value = 1 - ampDepth;
        const tremR = ctx.createGain(); tremR.gain.value = 1 - ampDepth;
        const depthL = ctx.createGain(); depthL.gain.value = ampDepth;
        const depthR = ctx.createGain(); depthR.gain.value = -ampDepth; // противофаза
        leslieLfo.connect(depthL).connect(tremL.gain);
        leslieLfo.connect(depthR).connect(tremR.gain);

        const merger = ctx.createChannelMerger(2);
        vib.connect(tremL); tremL.connect(merger, 0, 0);
        vib.connect(tremR); tremR.connect(merger, 0, 1);

        instrumentGain.connect(vib);
        merger.connect(expressionGain);
        leslieLfo.start();
        leslieNodes.push(vib, vibDepth, tremL, tremR, depthL, depthR, merger, leslieLfo);
    } else {
        instrumentGain.connect(expressionGain);
    }

    // #ЗАЧЕМ: пер-пресетный калибровочный трим громкости — ПОСТ-лимитерный (чистый dB,
    // не меняет тембр и работу лимитера). Дефолт 0 дБ → узел не вставляется,
    // поэтому бас/аккомпанемент/гармония/пиано (без флага) не затронуты.
    const calTrimDb = isFinite(currentPreset.calibrationTrimDb) ? currentPreset.calibrationTrimDb : 0;
    let outputTail: AudioNode = limiter;
    let calTrim: GainNode | null = null;
    expressionGain.connect(panner).connect(limiter);
    if (calTrimDb !== 0) {
        calTrim = ctx.createGain();
        calTrim.gain.value = dbToGain(calTrimDb);
        limiter.connect(calTrim);
        outputTail = calTrim;
    }
    outputTail.connect(output);
    delayMixGain.connect(panner);

    return {
        connect: (dest) => outputTail.connect(dest || output),
        disconnect: () => {
            [...globalActiveVoices].filter(v => v.type === type).forEach(v => deepCleanup(v));
            leslieNodes.forEach(n => { if (n instanceof OscillatorNode) { try { n.stop(); } catch(e){} } });
            [instrumentGain, expressionGain, panner, limiter, sharedDelayNode, feedbackGain, delayMixGain, ...(calTrim ? [calTrim] : []), ...leslieNodes].forEach(n => { try { n.disconnect(); } catch(e){} });
        },
        noteOn: (midi, when = ctx.currentTime, velocity = 1.0, duration = 1.0, params = null) => {
            if (!isFinite(midi) || midi < 0 || midi > 127) return;
            if (!isFinite(velocity) || velocity < 0 || velocity > 1) return;
            if (!isFinite(duration) || duration <= 0) return;
            enforceVoiceLimit();
            const tempo = Math.max(20, Math.min(300, params?.tempo || 72));
            createIndependentVoice(ctx, type, currentPreset, instrumentGain, midi, when, velocity, duration, sharedDelayNode, params, tempo);
        },
        noteOff: () => {}, 
        allNotesOff: () => {
            [...globalActiveVoices].filter(v => v.type === type).forEach(v => deepCleanup(v));
        },
        setPreset: (p) => {
            const now = ctx.currentTime;
            currentPreset = { ...p };
            if (type === 'guitar' && currentPreset.attackTransient > 0) ensureTransientsLoaded(ctx);
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
            if (!isFinite(v)) return;
            const bounded = Math.max(0, Math.min(1, v));
            const now = ctx.currentTime;
            instrumentGain.gain.cancelScheduledValues(now);
            instrumentGain.gain.setTargetAtTime(bounded, now, 0.02);
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
