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

// --- MARKOV HARMONIC STATES (SPEC 3.1) ---
// 0=stable, 1=tension_build, 2=chromatic_approach, 3=resolution
const BLUES_STATE_MATRIX = [
  [0.65, 0.25, 0.05, 0.05],
  [0.10, 0.55, 0.25, 0.10],
  [0.05, 0.10, 0.20, 0.65],
  [0.70, 0.15, 0.05, 0.10]
];

const STATE_TO_CHORD: Record<number, string[]> = {
    0: ['i7', 'iv7'],
    1: ['i7#5', 'iv7#5'],
    2: ['VI7b5', 'ii7b5'],
    3: ['V7', 'i7']
};

/**
 * #ЗАЧЕМ: Универсальный Марковский переход.
 */
export function markovNext<T extends string | number>(matrix: number[][], current: number, random: any): number {
    const transitions = matrix[current];
    if (!transitions) return current;

    let r = random.next();
    let cumulative = 0;
    for (let i = 0; i < transitions.length; i++) {
        cumulative += transitions[i];
        if (r < cumulative) return i;
    }
    return transitions.length - 1;
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
      baseScale = [0, 2, 3, 5, 6, 7, 10]; 
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
            // IMPLEMENTING MARKOV HARMONIC STATES FROM SPEC 3.1
            let currentState = 0; // stable
            let currentBarInPart = 0;
            
            while (currentBarInPart < partDuration) {
                const dur = [4, 8, 12][Math.floor(random.next() * 3)];
                const finalDuration = Math.min(dur, partDuration - currentBarInPart);
                
                const possibleChords = STATE_TO_CHORD[currentState];
                const selectedChord = possibleChords[Math.floor(random.next() * possibleChords.length)];
                
                const rootOffsetMap: Record<string, number> = { 'i7': 0, 'iv7': 5, 'V7': 7, 'VI7b5': 8, 'ii7b5': 2, 'i7#5': 0, 'iv7#5': 5 };
                const offset = rootOffsetMap[selectedChord] || 0;
                
                harmonyTrack.push({
                    rootNote: key + offset,
                    chordType: (selectedChord.startsWith('i') || selectedChord.startsWith('ii')) ? 'minor' : (selectedChord.startsWith('V') ? 'dominant' : 'major'),
                    bar: partStartBar + currentBarInPart,
                    durationBars: finalDuration
                });
                
                currentBarInPart += finalDuration;
                currentState = markovNext(BLUES_STATE_MATRIX, currentState, random);
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
        dreamy: [72, 86], calm: [68, 82], melancholic: [68, 76], // Adjusted to Spec
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
