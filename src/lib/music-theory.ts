/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ЧТО: Внедрена система Choral DNA для длинных мелодических аксиом.
 * #ОБНОВЛЕНО (ПЛАН №444): Исправлена логика династий — расширен пул кандидатов для каждой части.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo,
    TensionProfile,
    BluesSoloPhrase,
    BluesRiffDegree
} from '@/types/music';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

const SEMITONE_TO_DEGREE: Record<number, BluesRiffDegree> = {
    0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5',
    8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: 'R+8', 14: '9', 17: '11'
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

export function transformLick(lick: BluesSoloPhrase, seed: number, epoch: number, type?: 'jitter' | 'inversion' | 'transposition'): BluesSoloPhrase {
    const transformed = JSON.parse(JSON.stringify(lick)) as BluesSoloPhrase;
    const transformType = type || ['jitter', 'inversion', 'transposition'][calculateMusiNum(epoch, 3, seed, 3)];

    switch (transformType) {
        case 'inversion':
            const pivot = DEGREE_TO_SEMITONE[transformed[0].deg] || 0;
            transformed.forEach(n => {
                const current = DEGREE_TO_SEMITONE[n.deg] || 0;
                const inverted = pivot - (current - pivot);
                n.deg = SEMITONE_TO_DEGREE[((inverted % 12) + 12) % 12] || 'R';
            });
            break;
        case 'transposition':
            const shift = [3, 5, 7][calculateMusiNum(seed, 3, epoch, 3)];
            transformed.forEach(n => {
                const current = DEGREE_TO_SEMITONE[n.deg] || 0;
                n.deg = SEMITONE_TO_DEGREE[(current + shift) % 12] || 'R';
            });
            break;
        case 'jitter':
        default:
            transformed.forEach(n => { 
                const shiftVal = (calculateMusiNum(epoch, 2, seed, 2) - 0.5);
                n.t = Math.max(0, n.t + shiftVal);
            });
            break;
    }
    return transformed;
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

export function generateTensionMap(seed: number, totalBars: number, mood: Mood): number[] {
    const map: number[] = [];
    for (let i = 0; i < totalBars; i++) {
        const progress = i / totalBars;
        const baseTension = 0.4 + 0.2 * Math.sin(progress * Math.PI);
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
            phrasing: 'legato'
        });
    });

    return events;
}

export function generateSuiteDNA(totalBars: number, mood: Mood, initialSeed: number, originalRandom: any, genre: Genre, blueprintParts: any[], ancestor?: any, sessionHistory?: string[]): SuiteDNA {
    let seedLickId: string | undefined;
    let partLickMap: Map<string, string> = new Map();

    if (genre === 'blues') {
        const dynasties = ['minor', 'slow-burn', 'doom-blues', 'major', 'texas', 'classic'];
        const dynastyIdx = calculateMusiNum(initialSeed, 3, 0, dynasties.length);
        const dynasty = dynasties[dynastyIdx];
        
        const pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
            BLUES_SOLO_LICKS[id].tags.includes(dynasty) && !(sessionHistory || []).includes(id)
        );
        const finalPool = pool.length > 0 ? pool : Object.keys(BLUES_SOLO_LICKS);
        
        seedLickId = finalPool[calculateMusiNum(initialSeed, 7, 0, finalPool.length)];

        blueprintParts.forEach((part: any, i: number) => {
            const partLick = finalPool[calculateMusiNum(initialSeed + (i + 1) * 100, 5, 0, finalPool.length)];
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
    return { harmonyTrack, baseTempo: 72, rhythmicFeel: 'shuffle', bassStyle: 'walking', drumStyle: 'shuffle_A', soloPlanMap: new Map(), tensionMap, seedLickId, partLickMap };
}
