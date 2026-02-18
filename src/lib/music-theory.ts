/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ОБНОВЛЕНО (ПЛАН №450): Теперь SuiteDNA хранит partLickMap для тематической связи MAIN-секций.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo,
    TensionProfile
} from '@/types/music';
import { BLUES_PROGRESSION_OFFSETS, getDynastyForMood } from './blues-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

export const MODE_SEMITONES: Record<string, number[]> = {
    ionian: [0, 2, 4, 5, 7, 9, 11],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    aeolian: [0, 2, 3, 5, 7, 8, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
};

export function getScaleForMood(mood: Mood, root: number = 60): number[] {
    const modeMap: Record<Mood, string> = {
        joyful: 'ionian',
        contemplative: 'ionian',
        enthusiastic: 'lydian',
        dreamy: 'lydian',
        epic: 'mixolydian',
        calm: 'mixolydian',
        melancholic: 'dorian',
        dark: 'phrygian',
        gloomy: 'aeolian',
        anxious: 'locrian'
    };
    
    const mode = modeMap[mood] || 'dorian';
    const intervals = MODE_SEMITONES[mode];
    return intervals.map(semitone => root + semitone);
}

export const GEO_ATLAS: Record<string, { fog: number, depth: number, reg: number }> = {
    'HARBOR': { fog: 0.6, depth: 0.4, reg: -12 },
    'MOUNTAIN': { fog: 0.2, depth: 0.6, reg: 12 },
    'DESERT': { fog: 0.1, depth: 0.3, reg: 0 },
    'FOREST': { fog: 0.4, depth: 0.7, reg: -5 },
    'CAVE': { fog: 0.8, depth: 0.9, reg: -24 }
};

export const LIGHT_ATLAS: Record<string, { fog: number, depth: number, bright: number }> = {
    'DAWN': { fog: 0.3, depth: 0.4, bright: 0.6 },
    'NOON': { fog: 0.1, depth: 0.6, bright: 1.0 },
    'DUSK': { fog: 0.5, depth: 0.7, bright: 0.4 },
    'STARS': { fog: 0.2, depth: 0.9, bright: 0.8 },
    'VOID': { fog: 0.9, depth: 0.2, bright: 0.1 }
};

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

export function generateTensionMap(seed: number, totalBars: number, mood: Mood): number[] {
    const map: number[] = [];
    for (let i = 0; i < totalBars; i++) {
        const progress = i / totalBars;
        const baseTension = 0.4 + 0.3 * Math.sin(progress * Math.PI); 
        map.push(Math.max(0.05, Math.min(0.95, baseTension)));
    }
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

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, epoch: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const root = chord.rootNote;
    const notes = [root, root + (isMinor ? 3 : 4), root + 7];

    notes.forEach((note, i) => {
        events.push({
            type: 'accompaniment',
            note: note + 12,
            time: i * 0.1,
            duration: 4.0,
            weight: 0.5,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            chordName: isMinor ? 'Am' : 'C'
        });
    });

    return events;
}

export function generateSuiteDNA(totalBars: number, mood: Mood, initialSeed: number, originalRandom: any, genre: Genre, blueprintParts: any[], ancestor?: any, sessionHistory?: string[]): SuiteDNA {
    let seedLickId: string | undefined;
    let partLickMap: Map<string, string> = new Map();

    if (genre === 'blues') {
        const dynasty = getDynastyForMood(mood, initialSeed);
        const pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
            BLUES_SOLO_LICKS[id].tags.includes(dynasty) && !(sessionHistory || []).includes(id)
        );
        const finalPool = pool.length > 0 ? pool : Object.keys(BLUES_SOLO_LICKS);
        
        seedLickId = finalPool[Math.abs(Math.floor(initialSeed)) % finalPool.length];

        // #ЗАЧЕМ: Тематическая связь MAIN-секций.
        // #ЧТО: Каждой части назначается свой лик из одной Династии.
        blueprintParts.forEach((part: any, i: number) => {
            const partLick = finalPool[(Math.abs(Math.floor(initialSeed)) + (i + 1) * 7) % finalPool.length];
            partLickMap.set(part.id, partLick);
        });
    }

    const harmonyTrack: GhostChord[] = [];
    const key = 24 + Math.floor(originalRandom.next() * 12);
    
    let accumulatedBars = 0;
    blueprintParts.forEach((part: any) => {
        const partDuration = Math.round((part.duration.percent / 100) * totalBars);
        for (let i = 0; i < partDuration; i++) {
            harmonyTrack.push({ rootNote: key, chordType: 'minor', bar: accumulatedBars + i, durationBars: 1 });
        }
        accumulatedBars += partDuration;
    });

    const tensionMap = generateTensionMap(initialSeed, totalBars, mood);
    return { 
        harmonyTrack, 
        baseTempo: 72, 
        rhythmicFeel: 'shuffle', 
        bassStyle: 'walking', 
        drumStyle: 'shuffle_A', 
        soloPlanMap: new Map(), 
        tensionMap, 
        seedLickId, 
        partLickMap,
        dynasty: genre === 'blues' ? getDynastyForMood(mood, initialSeed) : undefined
    };
}
