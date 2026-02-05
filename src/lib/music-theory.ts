
/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ЧТО: Функции для получения гамм, инверсий, ретроградов и гуманизации.
 *       Внедрена система цепей Маркова для генерации гармонического скелета.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    BluesCognitiveState 
} from '@/types/music';
import { BLUES_MELODY_RIFFS } from './assets/blues-melody-riffs';
import { BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

const BLUES_HARMONIC_TRANSITIONS: Record<string, Record<string, number>> = {
    'I':  { 'I': 0.45, 'IV': 0.4, 'V': 0.1, 'vi': 0.05 },
    'IV': { 'I': 0.3, 'IV': 0.5, 'V': 0.1, 'bVI': 0.1 },
    'V':  { 'IV': 0.7, 'I': 0.2, 'V': 0.1 },
    'vi': { 'IV': 0.5, 'V': 0.3, 'I': 0.2 },
    'bVI': { 'V': 0.9, 'I': 0.1 }
};

/**
 * #ЗАЧЕМ: Универсальный Марковский переход.
 */
export function markovNext<T extends string>(matrix: Record<T, Record<T, number>>, current: T, random: any): T {
    const transitions = matrix[current];
    if (!transitions) return current;

    const entries = Object.entries(transitions) as [T, number][];
    const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
    let r = random.next() * totalWeight;

    for (const [state, weight] of entries) {
        r -= weight;
        if (r <= 0) return state;
    }
    return entries[entries.length - 1][0];
}

/**
 * #ЗАЧЕМ: Базовая гармоническая аксиома для Ambient/Trance.
 */
export function createHarmonyAxiom(
    chord: GhostChord,
    mood: Mood,
    genre: Genre,
    random: any,
    epoch: number
): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const root = chord.rootNote;
    
    // В Ambient/Trance используем теплые пэды
    const notes = [root, root + (isMinor ? 3 : 4), root + 7];
    
    notes.forEach((note, i) => {
        events.push({
            type: 'accompaniment',
            note: note + 24,
            time: i * 0.05,
            duration: 4.0,
            weight: 0.5 - (i * 0.1),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { barCount: epoch }
        });
    });

    return events;
}

export function getScaleForMood(mood: Mood, genre?: Genre, chordType?: 'major' | 'minor' | 'dominant' | 'diminished'): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (genre === 'blues') {
      // Истинная блюзовая гамма с blue notes (Dorian Add 5)
      baseScale = (chordType === 'major' || chordType === 'dominant') 
          ? [0, 2, 3, 4, 7, 9, 10] 
          : [0, 2, 3, 5, 6, 7, 10]; // Dorian add 5 for minor
  } else {
      switch (mood) {
        case 'joyful': baseScale = [0, 2, 4, 5, 7, 9, 11]; break;
        case 'epic': case 'enthusiastic': baseScale = [0, 2, 4, 6, 7, 9, 11]; break;
        case 'dreamy': baseScale = [0, 2, 4, 7, 9]; break;
        case 'contemplative': case 'calm': baseScale = [0, 2, 4, 5, 7, 9, 10]; break;
        case 'melancholic': baseScale = [0, 2, 3, 5, 7, 9, 10]; break;
        case 'dark': case 'gloomy': baseScale = [0, 2, 3, 5, 7, 8, 10]; break;
        case 'anxious': baseScale = [0, 1, 3, 5, 6, 8, 10]; break;
        default: baseScale = [0, 2, 3, 5, 7, 8, 10]; break;
      }
  }

  const fullScale: number[] = [];
  for (let octave = 0; octave < 5; octave++) {
      for (const note of baseScale) {
          fullScale.push(E1 + (octave * 12) + note);
      }
  }
  return fullScale;
}

export function humanizeEvents(events: FractalEvent[], amount: number, random: any) {
    events.forEach(e => {
        const shift = (random.next() - 0.5) * 2 * amount;
        e.time = Math.max(0, e.time + shift);
    });
}

export function invertMelody(phrase: any[]): any[] {
    if (phrase.length < 2) return phrase;
    const pivot = DEGREE_TO_SEMITONE[phrase[0].deg] || 0;
    return phrase.map(note => {
        const current = DEGREE_TO_SEMITONE[note.deg] || 0;
        const diff = current - pivot;
        const invertedSemitone = (pivot - diff + 12) % 12;
        
        let bestDeg = note.deg;
        let minDiff = 100;
        for (const [deg, semi] of Object.entries(DEGREE_TO_SEMITONE)) {
            const d = Math.abs(semi - invertedSemitone);
            if (d < minDiff) { minDiff = d; bestDeg = deg as any; }
        }
        return { ...note, deg: bestDeg };
    });
}

export function transposeMelody(phrase: any[], interval: number): any[] {
    return phrase.map(n => {
        const s = ((DEGREE_TO_SEMITONE[n.deg] || 0) + interval + 12) % 12;
        let deg = n.deg;
        for (const [d, v] of Object.entries(DEGREE_TO_SEMITONE)) { if (v === s) { deg = d as any; break; } }
        return { ...n, deg };
    });
}

export function addOrnaments(phrase: any[], random: any): any[] {
    const result = [];
    for (const note of phrase) {
        // Enclosure logic: approach from semitone above/below
        if (note.d >= 3 && random.next() < 0.4) {
            const isRoot = note.deg === 'R';
            const offset = isRoot ? 1 : (random.next() > 0.5 ? 1 : -1);
            
            result.push({ t: Math.max(0, note.t - 1), d: 1, deg: note.deg, tech: 'gr' });
            result.push({ ...note, tech: 'sl' });
        } else if (note.d >= 2 && random.next() < 0.5) {
            // Hammer-on/Pull-off ornament
            result.push({ ...note, d: Math.floor(note.d / 2) });
            result.push({ ...note, t: note.t + Math.floor(note.d / 2), d: Math.ceil(note.d / 2), tech: 'h/p' });
        } else {
            result.push(note);
        }
    }
    return result;
}

export function generateSuiteDNA(totalBars: number, mood: Mood, seed: number, random: any, genre: Genre, blueprintParts: any[]): SuiteDNA {
    const harmonyTrack: GhostChord[] = [];
    const baseKeyNote = 24 + Math.floor(random.next() * 12);
    const key = baseKeyNote;
    
    let accumulatedBars = 0;
    const totalPercent = blueprintParts.reduce((sum: number, part: any) => sum + part.duration.percent, 0);

    blueprintParts.forEach((part: any, index: number) => {
        const isLastPart = index === blueprintParts.length - 1;
        let partDuration = isLastPart ? (totalBars - accumulatedBars) : Math.round((part.duration.percent / totalPercent) * totalBars);
        const partStartBar = accumulatedBars;
        if (partDuration <= 0) return;

        if (genre === 'blues') {
            let currentDegree = 'I';
            let currentBarInPart = 0;
            
            while (currentBarInPart < partDuration) {
                const r = random.next();
                // Alvin Lee Melancholy Bias: Subdominant (IV) takes its time
                let duration = (mood === 'melancholic' && currentDegree === 'IV' && r < 0.8) ? 8 : (r < 0.5 ? 4 : 12);
                const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                
                const degreeMap: Record<string, {rootOffset: number, type: GhostChord['chordType']}> = {
                    'I': { rootOffset: 0, type: 'major' },
                    'IV': { rootOffset: 5, type: 'major' },
                    'V': { rootOffset: 7, type: 'dominant' },
                    'vi': { rootOffset: 9, type: 'minor' },
                    'bVI': { rootOffset: 8, type: 'major' }
                };
                
                const chordInfo = degreeMap[currentDegree] || degreeMap['I'];
                harmonyTrack.push({
                    rootNote: key + chordInfo.rootOffset, 
                    chordType: chordInfo.type,
                    bar: partStartBar + currentBarInPart, 
                    durationBars: finalDuration,
                });
                
                currentBarInPart += finalDuration;
                currentDegree = markovNext(BLUES_HARMONIC_TRANSITIONS, currentDegree, random);
            }
        } else {
             let currentBarInPart = 0;
             while(currentBarInPart < partDuration) {
                const duration = [4, 8, 2][Math.floor(random.next() * 3)];
                const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                const chordRoot = key + [0, 5, 7, -5, 4, 2, -7][Math.floor(random.next() * 7)];
                harmonyTrack.push({ rootNote: chordRoot, chordType: random.next() > 0.5 ? 'major' : 'minor', bar: partStartBar + currentBarInPart, durationBars: finalDuration });
                currentBarInPart += finalDuration;
             }
        }
        accumulatedBars += partDuration;
    });

    const possibleTempos = {
        joyful: [115, 140], enthusiastic: [125, 155], contemplative: [78, 92],
        dreamy: [72, 86], calm: [68, 82], melancholic: [64, 76],
        gloomy: [68, 78], dark: [64, 72], epic: [120, 145], anxious: [88, 105],
    };

    const [minTempo, maxTempo] = (possibleTempos as any)[mood] || [60, 80];
    const baseTempo = minTempo + Math.floor(random.next() * (maxTempo - minTempo + 1));

    const soloPlanMap = new Map<string, string>();
    const allPlanIds = Object.keys(BLUES_SOLO_PLANS);
    const shuffledPlanIds = [...allPlanIds].sort(() => random.next() - 0.5);
    let planIndex = 0;
    blueprintParts.forEach((part: any) => {
        if (part.instrumentRules?.melody?.source === 'blues_solo') {
            soloPlanMap.set(part.id, shuffledPlanIds[planIndex % shuffledPlanIds.length]);
            planIndex++;
        }
    });

    return { harmonyTrack, baseTempo, rhythmicFeel: 'shuffle', bassStyle: 'walking', drumStyle: 'shuffle_A', soloPlanMap };
}
