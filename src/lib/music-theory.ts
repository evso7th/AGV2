/**
 * @fileOverview Universal Music Theory Utilities V2.6 — "Melodic Wanderer".
 * #ЗАЧЕМ: Реализация ПЛАНА №751 — Добавлена функция детерминированной прогулки по гамме.
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

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

export const DEGREE_KEYS = Object.keys(DEGREE_TO_SEMITONE);
export const TECHNIQUE_KEYS = ['pick', 'sl', 'h/p', 'bn', 'vb', 'gr', 'ds', 'harm', 'pluck', 'hit', 'swell'];

export const SEMITONE_TO_DEGREE: Record<number, string> = {
    0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5',
    8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: 'R+8', 14: '9', 17: '11'
};

/**
 * #ЗАЧЕМ: Вычисляет "гуляющую" ступень для предотвращения зудения на одной ноте.
 * #ЧТО: Возвращает смещение в полутонах (0, 7, 9, 12) на основе фрактального индекса.
 */
export function getWalkingDegree(epoch: number, seed: number): number {
    const steps = [0, 7, 9, 12, 7, 0, 14, 0]; // R, 5, 6, Oct, 5, R, 9, R
    const idx = calculateMusiNum(epoch, 3, seed, steps.length);
    return steps[idx];
}

/**
 * #ЗАЧЕМ: Безопасный перевод полутонов в ступень (Mutation Helper).
 */
export function safeSemitoneToDegree(s: number): string {
    const norm = ((s % 12) + 12) % 12;
    const base = SEMITONE_TO_DEGREE[norm] || 'R';
    if (s >= 12 && base === 'R') return 'R+8';
    return base;
}

// --- MUTATION FUNCTIONS ---

/**
 * #ЗАЧЕМ: Зеркальное отражение мелодии (Инверсия).
 */
export function invertPhrase(phrase: any[]): any[] {
    if (phrase.length === 0) return [];
    const firstSemitone = DEGREE_TO_SEMITONE[phrase[0].deg] || 0;
    return phrase.map(n => {
        const current = DEGREE_TO_SEMITONE[n.deg] || 0;
        const diff = current - firstSemitone;
        const inverted = firstSemitone - diff;
        return { ...n, deg: safeSemitoneToDegree(inverted) };
    });
}

/**
 * #ЗАЧЕМ: Проигрывание фразы задом наперед (Реверс).
 */
export function retrogradePhrase(phrase: any[]): any[] {
    if (phrase.length === 0) return [];
    const maxT = Math.max(...phrase.map(n => n.t));
    return phrase.map(n => ({
        ...n,
        t: maxT - n.t
    })).sort((a, b) => a.t - b.t);
}

/**
 * #ЗАЧЕМ: Микро-ритмическое "очеловечивание" (Джиттер).
 */
export function applyRhythmicJitter(phrase: any[], amount: number = 1): any[] {
    return phrase.map(n => ({
        ...n,
        t: Math.max(0, n.t + (Math.random() > 0.5 ? amount : -amount))
    }));
}

// --- EXISTING UTILS ---

const GENRE_HARMONY_MATRICES: Record<string, number[][]> = {
    ambient: [
        [0.6, 0.2, 0.1, 0.1], 
        [0.4, 0.4, 0.1, 0.1], 
        [0.5, 0.1, 0.3, 0.1], 
        [0.4, 0.2, 0.2, 0.2]  
    ],
    trance: [
        [0.7, 0.1, 0.2],      
        [0.3, 0.5, 0.2],      
        [0.4, 0.1, 0.5]       
    ],
    blues: [
        [0.5, 0.4, 0.1],      
        [0.6, 0.3, 0.1],      
        [0.7, 0.1, 0.2]       
    ]
};

const GENRE_STATES: Record<string, number[]> = {
    ambient: [0, 5, 7, 9], 
    trance: [0, 8, 10],    
    blues: [0, 5, 7]       
};

export function decompressCompactPhrase(compact: number[]): any[] {
    const result = [];
    if (!compact) return [];
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

export function repairLegacyPhrase(compact: number[]): number[] {
    if (!compact || compact.length === 0) return [];
    const isLegacy = compact.length >= 3 && compact[2] > 20;
    if (!isLegacy) return compact;
    const repaired: number[] = [];
    const BASE_C4 = 60;
    for (let i = 0; i < compact.length; i += 4) {
        const t = compact[i];
        const d = compact[i+1];
        const midi = compact[i+2];
        const semitone = (midi - BASE_C4) % 12;
        const degName = SEMITONE_TO_DEGREE[semitone < 0 ? semitone + 12 : semitone] || 'R';
        const degIdx = DEGREE_KEYS.indexOf(degName);
        const techIdx = TECHNIQUE_KEYS.indexOf('pick');
        repaired.push(t, d, degIdx, techIdx);
    }
    return repaired;
}

export function normalizePhraseGroup(phrases: any[][]): void {
    let minT = Infinity;
    phrases.forEach(p => {
        p.forEach(n => {
            if (n.t < minT) minT = n.t;
        });
    });
    
    if (minT !== Infinity && minT > 0) {
        phrases.forEach(p => {
            p.forEach(n => { n.t -= minT; });
        });
    }
}

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
            weight: 0.8,
            timeJitter: 0
        }));
        result.push(...variant);
    }
    return result.filter(n => n.t < targetTicks);
}

export const GEO_ATLAS: Record<string, { fog: number, depth: number, reg: number }> = {
    HARBOR: { fog: 0.6, depth: 0.3, reg: -12 },
    MOUNTAIN: { fog: 0.2, depth: 0.5, reg: 12 },
    VOID: { fog: 0.9, depth: 0.8, reg: 0 }
};

export const LIGHT_ATLAS: Record<string, { fog: number, depth: number, bright: number }> = {
    PRISM: { fog: 0.1, depth: 0.4, bright: 0.8 },
    GLOW: { fog: 0.4, depth: 0.6, bright: 0.5 },
    DAZZLE: { fog: 0.05, depth: 0.9, bright: 1.0 }
};

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

export function generateTensionMap(seed: number, totalBars: number, mood: Mood, parts?: any[]): number[] {
    const map: number[] = [];
    const getJitter = (bar: number) => (calculateMusiNum(bar, 7, seed, 10) / 100) - 0.05;
    let accumulatedBars = 0;
    parts?.forEach(part => {
        const partDuration = Math.round((part.duration.percent / 100) * totalBars);
        for (let i = 0; i < partDuration; i++) {
            const progress = i / (partDuration || 1);
            let tension: number;
            if (part.id === 'INTRO' || part.id === 'PROLOGUE') tension = 0.25 + (progress * 0.1); 
            else if (part.id.startsWith('MAIN') || part.id.startsWith('THE_')) tension = 0.35 + 0.5 * Math.sin(progress * Math.PI);
            else if (part.id === 'OUTRO') tension = 0.3 * (1 - progress * 0.6); 
            else if (part.id.includes('BRIDGE')) tension = 0.45;
            else tension = 0.4; 
            map.push(Math.max(0.1, Math.min(0.95, tension + getJitter(accumulatedBars + i))));
        }
        accumulatedBars += partDuration;
    });
    while(map.length < totalBars) {
        const progress = map.length / totalBars;
        map.push(0.4 + 0.3 * Math.sin(progress * Math.PI) + getJitter(map.length));
    }
    return map;
}

export function pickWeightedDeterministic<T>(options: { name?: T, value?: T, weight: number }[], seed: number, epoch: number, offset: number): T {
    if (!options || options.length === 0) return null as any;
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    const fractalVal = calculateMusiNum(epoch, 11, seed + offset, 100);
    const target = (fractalVal / 100) * totalWeight;
    let acc = 0;
    for (const opt of options) { acc += opt.weight; if (target <= acc) return (opt.name || opt.value) as T; }
    return (options[options.length - 1].name || options[options.length - 1].value) as T;
}

export function generateMarkovHarmony(totalBars: number, rootNote: number, seed: number, genre: string): GhostChord[] {
    const track: GhostChord[] = [];
    const root = rootNote;
    const matrix = GENRE_HARMONY_MATRICES[genre] || GENRE_HARMONY_MATRICES.ambient;
    const states = GENRE_STATES[genre] || GENRE_STATES.ambient;
    let currentBar = 0;
    let currentStateIdx = 0;
    while (currentBar < totalBars) {
        const durPool = [2, 4, 8];
        const dur = durPool[calculateMusiNum(currentBar, 3, seed, 3)];
        track.push({
            rootNote: root + (states[currentStateIdx] || 0),
            chordType: 'minor',
            bar: currentBar,
            durationBars: Math.min(dur, totalBars - currentBar)
        });
        const rand = (calculateMusiNum(currentBar, 13, seed, 100)) / 100;
        let acc = 0;
        const currentMatrixRow = matrix[currentStateIdx] || matrix[0];
        for (let i = 0; i < currentMatrixRow.length; i++) {
            acc += currentMatrixRow[i];
            if (rand <= acc) { currentStateIdx = i; break; }
        }
        currentBar += dur;
    }
    return track;
}

/**
 * #ЗАЧЕМ: Генерация ДНК сюиты V3.0 — "Genetic Synchronization".
 * #ЧТО: ПЛАН №732 — Реализовано наследование темпа из Облачного Наследия.
 */
export function generateSuiteDNA(
    totalBars: number, 
    mood: Mood, 
    initialSeed: number, 
    originalRandom: any, 
    genre: Genre, 
    blueprintParts: any[], 
    ancestor?: any, 
    sessionHistory?: string[],
    bpmConfig?: { base: number, range: [number, number], modifier: number },
    masterpieces?: any[],
    cloudAxioms?: any[], 
    activeAnchorId?: string | null,
    activeAnchorRoot?: number | null
): SuiteDNA {
    let finalSeed = initialSeed;
    if (masterpieces && masterpieces.length > 0) {
        const parent1 = masterpieces[calculateMusiNum(initialSeed, 7, 0, masterpieces.length)];
        const parent2 = masterpieces[calculateMusiNum(initialSeed, 11, 5, masterpieces.length)];
        finalSeed = (parent1.seed & 0xAAAA) | (parent2.seed & 0x5555);
    } else if (ancestor && typeof ancestor.seed === 'number') {
        finalSeed = (initialSeed & 0x55555555) | (ancestor.seed & 0xAAAAAAAA);
    }

    let seedLickId: string | undefined;
    let partLickMap: Map<string, string> = new Map();

    if (genre === 'blues') {
        const dynasty = getDynastyForMood(mood, finalSeed);
        let pool: string[] = [];
        
        if (activeAnchorId && cloudAxioms) {
            const normalizedAnchor = activeAnchorId.toLowerCase().replace(/[^a-z0-9]/g, '');
            pool = cloudAxioms
                .filter(ax => ax.role === 'melody' && (ax.compositionId || '').toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedAnchor)
                .map(ax => ax.id);
        }

        if (pool.length === 0) {
            pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
                BLUES_SOLO_LICKS[id].tags.includes(dynasty) && !(sessionHistory || []).includes(id)
            );
        }
        const finalPool = pool.length > 0 ? pool : Object.keys(BLUES_SOLO_LICKS);
        seedLickId = finalPool[calculateMusiNum(finalSeed, 13, 0, finalPool.length)];
        blueprintParts.forEach((part: any, i: number) => {
            const partLick = finalPool[(calculateMusiNum(finalSeed, 17, i * 7, finalPool.length))];
            partLickMap.set(part.id, partLick);
        });
    }

    const key = 40 + calculateMusiNum(finalSeed, 19, 0, 12); 
    const harmonyTrack = generateMarkovHarmony(totalBars, key, finalSeed, genre);

    // #ЗАЧЕМ: Наследование темпа из Облачного Наследия.
    // #ЧТО: Если есть активный якорь, берем BPM прямо из него. 
    //       Иначе выбираем случайный "лидерский" BPM из пула подходящих аксиом.
    let inheritedBpm: number | null = null;
    if (cloudAxioms && cloudAxioms.length > 0) {
        const normalizeStr = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (activeAnchorId) {
            const target = normalizeStr(activeAnchorId);
            const anchorAxiom = cloudAxioms.find(ax => normalizeStr(ax.compositionId) === target && ax.nativeBpm);
            if (anchorAxiom) inheritedBpm = anchorAxiom.nativeBpm;
        } else {
            // Пытаемся найти характерный темп для жанра/настроения в облаке
            const leaders = cloudAxioms.filter(ax => (ax.role === 'melody' || ax.role === 'bass') && ax.nativeBpm);
            if (leaders.length > 0) {
                const picked = leaders[calculateMusiNum(finalSeed, 29, 0, leaders.length)];
                inheritedBpm = picked.nativeBpm;
            }
        }
    }

    let baseTempo = 72;
    if (inheritedBpm) {
        baseTempo = inheritedBpm;
    } else if (bpmConfig) {
        const [min, max] = bpmConfig.range;
        const rangeWidth = max - min;
        const deterministicOffset = (calculateMusiNum(finalSeed, 23, 0, 100) / 100) * rangeWidth;
        baseTempo = Math.round((min + deterministicOffset) * bpmConfig.modifier);
    }

    const tensionMap = generateTensionMap(finalSeed, totalBars, mood, blueprintParts);
    
    return { 
        harmonyTrack, baseTempo, rhythmicFeel: 'shuffle', bassStyle: 'walking', 
        drumStyle: 'shuffle_A', soloPlanMap: new Map(), tensionMap, 
        seedLickId, partLickMap, sessionHistory,
        dynasty: genre === 'blues' ? getDynastyForMood(mood, finalSeed) : undefined,
        cloudAxioms, activeAnchorId,
        activeAnchorRoot: activeAnchorRoot || null 
    };
}

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, epoch: number): FractalEvent[] {
    const isMinor = chord.chordType === 'minor';
    const root = chord.rootNote;
    const notes = [root, root + (isMinor ? 3 : 4), root + 7];
    return notes.map((note, i) => ({
        type: 'accompaniment', note: note + 12, time: i * 0.1, duration: 4.0, 
        weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato',
        chordName: chord.chordType === 'minor' ? 'Am' : 'E', params: { barCount: epoch }
    }));
}
