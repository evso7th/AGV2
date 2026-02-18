/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами и энергетическими картами.
 * #ОБНОВЛЕНО (ПЛАН №454): Реализована "Физика 4-х Волн" для меланхоличного блюза.
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
 * #ЗАЧЕМ: Создание энергетической кривой сюиты.
 * #ЧТО: Для меланхолии реализована физика 0.3 - 0.8 с волнами внутри актов.
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
                    // Волна: 0.3 -> 0.8 -> 0.3 внутри каждого мэйны
                    tension = 0.3 + 0.5 * Math.sin(progress * Math.PI);
                } else if (part.id === 'OUTRO') {
                    tension = 0.3 * (1 - progress * 0.5); 
                } else {
                    tension = 0.35; // Bridges
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

        blueprintParts.forEach((part: any, i: number) => {
            const partLick = finalPool[(Math.abs(Math.floor(initialSeed)) + (i + 1) * 7) % finalPool.length];
            partLickMap.set(part.id, partLick);
        });
    }

    const harmonyTrack: GhostChord[] = [];
    const key = 40 + Math.floor(originalRandom.next() * 12); // Higher base key for better guitar range
    
    let accumulatedBars = 0;
    blueprintParts.forEach((part: any) => {
        const partDuration = Math.round((part.duration.percent / 100) * totalBars);
        for (let i = 0; i < partDuration; i++) {
            harmonyTrack.push({ rootNote: key, chordType: 'minor', bar: accumulatedBars + i, durationBars: 1 });
        }
        accumulatedBars += partDuration;
    });

    const tensionMap = generateTensionMap(initialSeed, totalBars, mood, blueprintParts);
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
        phrasing: 'legato'
    }));
}
