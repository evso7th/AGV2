/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ЧТО: Внедрена система Dynasty Rotation для обеспечения разнообразия старта сюиты.
 * #ОБНОВЛЕНО (ПЛАН №439): Реализация "New Piece == New Dynasty" и семантическая связь ликов.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo,
    InstrumentPart,
    TensionProfile,
    BluesSoloPhrase,
    BluesRiffDegree
} from '@/types/music';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues-guitar-solo';
import { AMBIENT_LEGACY } from './assets/ambient-legacy';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

const SEMITONE_TO_DEGREE: Record<number, BluesRiffDegree> = {
    0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5',
    8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: 'R+8', 14: '9', 17: '11'
};

export const GEO_ATLAS: Record<string, { fog: number, pulse: number, depth: number, reg: number }> = {
    Tundra: { fog: 0.2, pulse: 0.1, depth: 0.3, reg: -12 },
    Void: { fog: 0.95, pulse: 0.01, depth: 0.2, reg: -24 },
    Nebula: { fog: 0.6, pulse: 0.3, depth: 1.0, reg: 12 },
    Astral_Plain: { fog: 0.2, pulse: 0.2, depth: 0.9, reg: 24 }
};

export const LIGHT_ATLAS: Record<string, { fog: number, pulse: number, depth: number, bright: number }> = {
    Horizon: { fog: 0.1, pulse: 0.1, depth: 0.4, bright: 0.2 },
    Zenith: { fog: 0.0, pulse: 0.2, depth: 0.6, bright: 0.6 },
    Purity: { fog: 0.0, pulse: 0.05, depth: 0.4, bright: 0.8 }
};

export function getScaleForMood(mood: Mood, genre?: Genre, chordType?: 'major' | 'minor' | 'dominant' | 'diminished'): number[] {
  const E1 = 28; 
  let baseScale: number[];

  if (genre === 'blues') {
      baseScale = [0, 3, 5, 6, 7, 10]; // Blues scale base
  } else {
      switch (mood) {
        case 'joyful': baseScale = [0, 2, 4, 5, 7, 9, 11]; break;
        case 'epic':        
        case 'enthusiastic': baseScale = [0, 2, 4, 6, 7, 9, 11]; break;
        case 'melancholic': baseScale = [0, 2, 3, 5, 7, 9, 10]; break;
        case 'dark': baseScale = [0, 2, 3, 5, 7, 8, 10]; break;
        default: baseScale = [0, 2, 3, 5, 7, 8, 10]; break;
      }
  }

  const fullScale: number[] = [];
  for (let octave = 0; octave < 3; octave++) {
      for (const note of baseScale) {
          fullScale.push(E1 + (octave * 12) + note);
      }
  }
  return fullScale;
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
            transformed.forEach(n => { n.t = clamp(n.t + (calculateMusiNum(epoch, 2, seed, 2) - 0.5), 0, 11); });
            break;
    }
    return transformed;
}

export function crossoverDNA(seedA: number, ancestor: any): number {
    if (!ancestor || !ancestor.seed) return seedA;
    const seedB = Number(ancestor.seed);
    const mask = 0x55555555;
    const combined = (seedA & mask) | (seedB & ~mask);
    return Math.abs(combined) % 2147483647;
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

export function generateTensionMap(seed: number, totalBars: number, mood: Mood): number[] {
    const map: number[] = [];
    const getProfile = (m: Mood): TensionProfile['type'] => {
        if (['melancholic', 'gloomy', 'dark'].includes(m)) return 'arc';
        if (['joyful', 'enthusiastic', 'epic'].includes(m)) return 'crescendo';
        return 'plateau';
    };
    const type = getProfile(mood);
    for (let i = 0; i < totalBars; i++) {
        const progress = i / totalBars;
        let baseTension = 0.5;
        switch (type) {
            case 'arc': baseTension = Math.sin(progress * Math.PI); break;
            case 'crescendo': baseTension = Math.pow(progress, 1.2); break;
            case 'plateau': baseTension = 0.6; break;
        }
        map.push(Math.max(0.05, Math.min(0.95, baseTension)));
    }
    return map;
}

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, epoch: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const root = chord.rootNote;
    const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
    notes.forEach((note, i) => {
        events.push({
            type: 'accompaniment',
            note: note + 12, 
            time: 0.5, // Slightly offset for "The Pull"
            duration: 3.5, // Long sustain
            weight: 0.15,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { barCount: epoch, filterCutoff: 1500 },
            chordName: isMinor ? 'Am7' : 'E7' 
        });
    });
    return events;
}

export function generateSuiteDNA(totalBars: number, mood: Mood, initialSeed: number, originalRandom: any, genre: Genre, blueprintParts: any[], ancestor?: any, sessionHistory?: string[]): SuiteDNA {
    let seedLickId: string | undefined;
    let seedLickNotes: BluesSoloPhrase | undefined;
    let dynasty: string | undefined;
    let partLickMap: Map<string, string> = new Map();

    const finalSeed = ancestor ? crossoverDNA(initialSeed, ancestor) : initialSeed;
    const sowingRandom = { state: finalSeed, next: function() { this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32); return this.state / Math.pow(2, 32); } };

    if (genre === 'blues') {
        const isMellow = ['dark', 'anxious', 'melancholic', 'gloomy'].includes(mood);
        const dynasties = isMellow ? ['minor', 'slow-burn', 'doom-blues'] : ['major', 'texas', 'classic'];
        dynasty = dynasties[calculateMusiNum(finalSeed, 3, 0, dynasties.length)];
        
        console.log(`%c[DNA] NEW DYNASTY BORN: "${dynasty.toUpperCase()}"`, 'color: #DA70D6; font-weight: bold;');

        const tabooSet = new Set(sessionHistory || []);
        const candidates = Object.keys(BLUES_SOLO_LICKS).filter(id => 
            BLUES_SOLO_LICKS[id].tags.includes(dynasty!) && !tabooSet.has(id)
        );
        const lickPool = candidates.length > 0 ? candidates : Object.keys(BLUES_SOLO_LICKS);
        
        seedLickId = lickPool[calculateMusiNum(finalSeed, 7, 0, lickPool.length)];
        seedLickNotes = transformLick(BLUES_SOLO_LICKS[seedLickId].phrase, finalSeed, 0, 'jitter');

        // Pre-map licks from the same dynasty to parts
        blueprintParts.forEach((part, i) => {
            const partLick = lickPool[calculateMusiNum(finalSeed + i * 100, 5, 0, lickPool.length)];
            partLickMap.set(part.id, partLick);
        });
    }

    const harmonyTrack: GhostChord[] = [];
    const key = 24 + Math.floor(sowingRandom.next() * 12);
    
    let accumulatedBars = 0;
    blueprintParts.forEach((part: any) => {
        const partDuration = Math.round((part.duration.percent / 100) * totalBars);
        for (let i = 0; i < partDuration; i++) {
            harmonyTrack.push({ rootNote: key, chordType: 'minor', bar: accumulatedBars + i, durationBars: 1 });
        }
        accumulatedBars += partDuration;
    });

    const tensionMap = generateTensionMap(finalSeed, totalBars, mood);
    return { harmonyTrack, baseTempo: 72, rhythmicFeel: 'shuffle', bassStyle: 'walking', drumStyle: 'shuffle_A', soloPlanMap: new Map(), tensionMap, seedLickId, seedLickNotes, dynasty, partLickMap };
}
