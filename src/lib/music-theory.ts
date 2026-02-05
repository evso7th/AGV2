/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ЧТО: Функции для получения гамм, инверсий, ретроградов и гуманизации.
 *       Внедрена система цепей Маркова для генерации гармонического скелета.
 *       ДОБАВЛЕНО: Математика MusiNum для фрактальной детерминированности.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    BluesCognitiveState 
} from '@/types/music';
import { BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

/**
 * #ЗАЧЕМ: Математическое ядро MusiNum.
 * #ЧТО: Вычисляет сумму цифр числа в заданной системе счисления с последующим вычетом по модулю.
 *       Порождает самоподобные (фрактальные) последовательности.
 */
export function calculateMusiNum(step: number, base: number = 2, start: number = 0, modulo: number = 8): number {
    let num = Math.abs(step + start);
    let sum = 0;
    while (num > 0) {
        sum += num % base;
        num = Math.floor(num / base);
    }
    return sum % modulo;
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
    
    // #ЗАЧЕМ: Мягкое "рассыпание" аккорда для создания объема.
    const notes = [root, root + (isMinor ? 3 : 4), root + 7];
    
    notes.forEach((note, i) => {
        events.push({
            type: 'accompaniment',
            note: note + 12, 
            time: i * 0.08, 
            duration: 4.0,
            weight: 0.4 - (i * 0.05),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { barCount: epoch },
            chordName: (chord as any).name || ''
        });
    });

    return events;
}

export function getScaleForMood(mood: Mood, genre?: Genre): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (genre === 'blues') {
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
            let currentBarInPart = 0;
            while (currentBarInPart < partDuration) {
                const progression = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7]; 
                const chordTypes: ('minor' | 'dominant')[] = ['minor', 'minor', 'minor', 'minor', 'minor', 'minor', 'minor', 'minor', 'dominant', 'minor', 'minor', 'dominant'];
                
                for (let i = 0; i < 12 && currentBarInPart < partDuration; i++) {
                    const barIdx = partStartBar + currentBarInPart;
                    harmonyTrack.push({
                        rootNote: key + progression[i],
                        chordType: chordTypes[i],
                        bar: barIdx,
                        durationBars: 1
                    });
                    currentBarInPart++;
                }
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
        dreamy: [72, 86], calm: [68, 82], melancholic: [64, 72],
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