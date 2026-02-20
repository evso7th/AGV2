/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами и энергетическими картами.
 * #ОБНОВЛЕНО (ПЛАН №532): Внедрена функция analyzeAxiomVector для авто-калибровки Гиперкуба.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo,
    TensionProfile,
    AxiomVector
} from '@/types/music';
import { getChordNameForBar, getDynastyForMood } from './blues-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

export const MODE_SEMITONES: Record<string, number[]> = {
    ionian: [0, 2, 4, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    aeolian: [0, 2, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
};

/** #ЗАЧЕМ: Универсальный маппинг ступеней для всех Мозгов системы. */
export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

/** #ЗАЧЕМ: Порядковые ключи для сжатия. */
export const DEGREE_KEYS = Object.keys(DEGREE_TO_SEMITONE);

/** #ЗАЧЕМ: Порядковые техники для сжатия. */
export const TECHNIQUE_KEYS = ['pick', 'sl', 'h/p', 'bn', 'vb', 'gr', 'ds', 'harm', 'pluck', 'hit', 'swell'];

/** #ЗАЧЕМ: Обратный маппинг для Алхимика MIDI. */
export const SEMITONE_TO_DEGREE: Record<number, string> = {
    0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5',
    8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: 'R+8', 14: '9', 17: '11'
};

/**
 * #ЗАЧЕМ: Распаковка сжатого числового массива в осмысленные нотные объекты.
 * #ЧТО: [t, d, degIdx, techIdx] -> { t, d, deg, tech }
 */
export function decompressCompactPhrase(compact: number[]): any[] {
    const result = [];
    for (let i = 0; i < compact.length; i += 4) {
        result.push({
            t: compact[i],
            d: compact[i+1],
            deg: DEGREE_KEYS[compact[i+2]] || 'R',
            tech: TECHNIQUE_KEYS[compact[i+3]] || 'pick'
        });
    }
    return result;
}

/**
 * #ЗАЧЕМ: Эвристический анализ фразы для калибровки Гиперкуба.
 * #ЧТО: Вычисляет координаты Vector (t, b, e, h) на основе интервалов и ритма.
 */
export function analyzeAxiomVector(phrase: any[], rootNote: number): AxiomVector {
    if (phrase.length === 0) return { t: 0.5, b: 0.5, e: 0.5, h: 0.5 };

    // 1. TENSION (Диссонанс и Хроматизм)
    // Вес за ♭5, ♭2, ♭7 и хроматические шаги
    let tensionScore = 0;
    phrase.forEach((n, i) => {
        const semitone = DEGREE_TO_SEMITONE[n.deg] || 0;
        if ([1, 6, 10].includes(semitone % 12)) tensionScore += 0.2;
        const prev = phrase[i-1];
        if (prev) {
            const diff = Math.abs(semitone - (DEGREE_TO_SEMITONE[prev.deg] || 0));
            if (diff === 1) tensionScore += 0.15; // Хроматизм
        }
    });

    // 2. BRIGHTNESS (Регистр и Мажорность)
    let brightnessScore = 0;
    const avgPitch = phrase.reduce((sum, n) => sum + (DEGREE_TO_SEMITONE[n.deg] || 0), 0) / phrase.length;
    // Маппинг регистра (0-24 полутона) -> 0.0-1.0
    brightnessScore = (avgPitch + 12) / 36;
    // Мажорная терция добавляет яркости
    if (phrase.some(n => n.deg === '3')) brightnessScore += 0.15;

    // 3. ENTROPY (Ритмическая непредсказуемость)
    let entropyScore = 0;
    const ticks = phrase.map(n => n.t % 12);
    const uniqueTicks = new Set(ticks).size;
    entropyScore = uniqueTicks / 12; // Чем больше разных долей, тем выше энтропия
    // Синкопы (не на 0, 3, 6, 9) добавляют веса
    const syncopations = ticks.filter(t => ![0, 3, 6, 9].includes(t)).length;
    entropyScore += (syncopations / phrase.length) * 0.5;

    // 4. STABILITY (Тяготение к тонике)
    let stabilityScore = 0;
    const tonicNotes = phrase.filter(n => n.deg === 'R' || n.deg === '5').length;
    stabilityScore = tonicNotes / phrase.length;
    // Если заканчивается на тонику - это стабильно
    if (phrase[phrase.length - 1].deg === 'R') stabilityScore += 0.2;

    const clamp = (v: number) => Math.max(0.05, Math.min(0.95, v));

    return {
        t: clamp(tensionScore / 2 + 0.3),
        b: clamp(brightnessScore),
        e: clamp(entropyScore),
        h: clamp(stabilityScore)
    };
}

/**
 * #ЗАЧЕМ: Нормализация длины фразы до "нарративного минимума".
 */
export function stretchToNarrativeLength(phrase: any[], targetTicks: number, random: any): any[] {
    if (phrase.length === 0) return [];
    
    const currentLength = Math.max(...phrase.map(n => n.t + n.d), 0) || 12;
    if (currentLength >= targetTicks) return phrase;

    const iterations = Math.ceil(targetTicks / currentLength);
    const result = [];

    for (let i = 0; i < iterations; i++) {
        const offset = i * currentLength;
        const variant = phrase.map(n => ({
            ...n,
            t: n.t + offset,
            weight: (n.weight || 0.8) * (0.9 + random.next() * 0.2),
            timeJitter: (random.next() * 0.1 - 0.05)
        }));
        result.push(...variant);
    }

    return result.filter(n => n.t < targetTicks);
}

/**
 * #ЗАЧЕМ: Автоматическое определение ключа по массиву нот.
 */
export function detectKeyFromNotes(notes: number[]): { root: number, mode: 'major' | 'minor' } {
    if (notes.length === 0) return { root: 60, mode: 'minor' };

    const counts = new Array(12).fill(0);
    notes.forEach(n => counts[n % 12]++);

    const majorProfile = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
    const minorProfile = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

    let bestScore = -Infinity;
    let bestRoot = 0;
    let bestMode: 'major' | 'minor' = 'minor';

    for (let root = 0; root < 12; root++) {
        let majorScore = 0;
        let minorScore = 0;
        for (let i = 0; i < 12; i++) {
            const val = counts[(root + i) % 12];
            majorScore += val * majorProfile[i];
            minorScore += val * minorProfile[i];
        }

        if (majorScore > bestScore) {
            bestScore = majorScore;
            bestRoot = root;
            bestMode = 'major';
        }
        if (minorScore > bestScore) {
            bestScore = minorScore;
            bestRoot = root;
            bestMode = 'minor';
        }
    }

    return { root: 60 + bestRoot, mode: bestMode };
}

/** #ЗАЧЕМ: Атлас географических локаций для AmbientBrain. */
export const GEO_ATLAS: Record<string, { fog: number, depth: number, reg: number }> = {
    HARBOR: { fog: 0.6, depth: 0.3, reg: -12 },
    MOUNTAIN: { fog: 0.2, depth: 0.5, reg: 12 },
    VOID: { fog: 0.9, depth: 0.8, reg: 0 }
};

/** #ЗАЧЕМ: Атлас световых состояний (Йога Звука) для AmbientBrain. */
export const LIGHT_ATLAS: Record<string, { fog: number, depth: number, bright: number }> = {
    PRISM: { fog: 0.1, depth: 0.4, bright: 0.8 },
    GLOW: { fog: 0.4, depth: 0.6, bright: 0.5 },
    DAZZLE: { fog: 0.05, depth: 0.9, bright: 1.0 }
};

/** #ЗАЧЕМ: Универсальный определитель лада для Матриц Резонанса. */
export function getScaleForMood(mood: Mood, key: number = 60): number[] {
    const root = key % 12;
    let mode = 'aeolian';
    if (mood === 'joyful' || mood === 'epic') mode = 'ionian';
    if (mood === 'enthusiastic' || mood === 'dreamy') mode = 'lydian';
    if (mood === 'melancholic') mode = 'dorian';
    if (mood === 'anxious') mode = 'phrygian';
    if (mood === 'dark' || mood === 'gloomy') mode = 'aeolian';
    
    const intervals = MODE_SEMITONES[mode] || MODE_SEMITONES.aeolian;
    return intervals.map(i => (root + i) % 12);
}

export function calculateMusiNum(step: number, base: number = 2, start: number = 0, modulo: number = 8): number {
    if (!isFinite(step) || modulo <= 0) return 0;
    let num = Math.abs(Math.floor(step + start));
    let sum = 0;
    while (num > 0) {
        sum += num % base;
        num = Math.floor(num / base);
    }
    return sum % modulo;
}

/**
 * #ЗАЧЕМ: Генерация энергетического скелета сюиты.
 */
export function generateTensionMap(seed: number, totalBars: number, mood: Mood, parts?: any[]): number[] {
    const map: number[] = [];
    const isMelancholic = mood === 'melancholic';
    
    const getJitter = (bar: number) => (calculateMusiNum(bar, 3, seed, 10) / 100) - 0.05;

    if (isMelancholic && parts && parts.length > 0) {
        let accumulatedBars = 0;
        parts.forEach(part => {
            const partDuration = Math.round((part.duration.percent / 100) * totalBars);
            for (let i = 0; i < partDuration; i++) {
                const progress = i / (partDuration || 1);
                let tension: number;

                if (part.id === 'INTRO') {
                    tension = 0.3; 
                } else if (part.id.startsWith('MAIN')) {
                    tension = 0.3 + 0.5 * Math.sin(progress * Math.PI);
                } else if (part.id === 'OUTRO') {
                    tension = 0.3 * (1 - progress * 0.5); 
                } else {
                    tension = 0.35; 
                }
                
                map.push(Math.max(0.3, Math.min(0.8, tension + getJitter(accumulatedBars + i))));
            }
            accumulatedBars += partDuration;
        });
    } else {
        for (let i = 0; i < totalBars; i++) {
            const progress = i / totalBars;
            const baseTension = 0.4 + 0.3 * Math.sin(progress * Math.PI); 
            map.push(Math.max(0.1, Math.min(0.95, baseTension + getJitter(i))));
        }
    }
    
    while(map.length < totalBars) map.push(0.3);
    return map;
}

export function pickWeightedDeterministic<T>(options: { name?: T, value?: T, weight: number }[], seed: number, epoch: number, offset: number): T {
    if (!options || options.length === 0) return null as any;
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    const fractalVal = calculateMusiNum(epoch, 7, seed + offset, 100);
    const target = (fractalVal / 100) * totalWeight;
    let acc = 0;
    for (const opt of options) { acc += opt.weight; if (target <= acc) return (opt.name || opt.value) as T; }
    return (options[options.length - 1].name || options[options.length - 1].value) as T;
}

export function generateSuiteDNA(
    totalBars: number, 
    mood: Mood, 
    initialSeed: number, 
    originalRandom: any, 
    genre: Genre, 
    blueprintParts: any[], 
    ancestor?: any, 
    sessionHistory?: string[],
    bpmConfig?: { base: number, range: [number, number], modifier: number }
): SuiteDNA {
    let seedLickId: string | undefined;
    let partLickMap: Map<string, string> = new Map();

    if (genre === 'blues') {
        const dynasty = getDynastyForMood(mood, initialSeed);
        const pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
            BLUES_SOLO_LICKS[id].tags.includes(dynasty) && !(sessionHistory || []).includes(id)
        );
        const finalPool = pool.length > 0 ? pool : Object.keys(BLUES_SOLO_LICKS);
        
        seedLickId = finalPool[Math.abs(Math.floor(initialSeed)) % finalPool.length];

        blueprintParts.forEach((part: any, i: number) => {
            const partLick = finalPool[(Math.abs(Math.floor(initialSeed)) + (i + 1) * 7) % finalPool.length];
            partLickMap.set(part.id, partLick);
        });
    }

    const harmonyTrack: GhostChord[] = [];
    const key = 40 + Math.floor(originalRandom.next() * 12); 
    
    let accumulatedBars = 0;
    blueprintParts.forEach((part: any) => {
        const partDuration = Math.round((part.duration.percent / 100) * totalBars);
        for (let i = 0; i < partDuration; i++) {
            harmonyTrack.push({ rootNote: key, chordType: 'minor', bar: accumulatedBars + i, durationBars: 1 });
        }
        accumulatedBars += partDuration;
    });

    let baseTempo = 72;
    if (bpmConfig) {
        const [min, max] = bpmConfig.range;
        const rangeWidth = max - min;
        const deterministicOffset = (calculateMusiNum(initialSeed, 13, 0, 100) / 100) * rangeWidth;
        baseTempo = Math.round((min + deterministicOffset) * bpmConfig.modifier);
    }

    const tensionMap = generateTensionMap(initialSeed, totalBars, mood, blueprintParts);
    return { 
        harmonyTrack, 
        baseTempo, 
        rhythmicFeel: 'shuffle', 
        bassStyle: 'walking', 
        drumStyle: 'shuffle_A', 
        soloPlanMap: new Map(), 
        tensionMap, 
        seedLickId, 
        partLickMap,
        sessionHistory,
        dynasty: genre === 'blues' ? getDynastyForMood(mood, initialSeed) : undefined
    };
}

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, epoch: number): FractalEvent[] {
    const isMinor = chord.chordType === 'minor';
    const root = chord.rootNote;
    const notes = [root, root + (isMinor ? 3 : 4), root + 7];
    return notes.map((note, i) => ({
        type: 'accompaniment',
        note: note + 12,
        time: i * 0.1,
        duration: 4.0,
        weight: 0.5,
        technique: 'swell',
        dynamics: 'p',
        phrasing: 'legato',
        chordName: chord.chordType === 'minor' ? 'Am' : 'E',
        params: { barCount: epoch }
    }));
}
