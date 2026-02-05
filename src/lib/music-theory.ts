
/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ЧТО: Функции для получения гамм, инверсий, ретроградов и гуманизации.
 * #СВЯЗИ: Используется во всех "Жанровых Мозгах" и FractalMusicEngine.
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

export function getScaleForMood(mood: Mood, genre?: Genre, chordType?: 'major' | 'minor' | 'dominant' | 'diminished'): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (genre === 'blues') {
      baseScale = (chordType === 'major' || chordType === 'dominant') 
          ? [0, 2, 3, 4, 7, 9, 10] 
          : [0, 3, 5, 6, 7, 10];
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
  for (let octave = 0; octave < 3; octave++) {
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

// ───── TECHNIQUES OF MELODIC DEVELOPMENT ─────

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

export function retrogradeMelody(phrase: any[]): any[] {
    if (phrase.length < 2) return phrase;
    const reversed = [...phrase].reverse();
    const startTime = phrase[0].t;
    const endTime = phrase[phrase.length - 1].t + phrase[phrase.length - 1].d;
    
    return reversed.map((note, i) => {
        const originalOffset = phrase[i].t - startTime;
        return { ...note, t: endTime - originalOffset - note.d };
    });
}

export function applyNewRhythm(phrase: any[], random: any): any[] {
    const rhythms = [[3, 3, 3, 3], [2, 4, 2, 4], [6, 6], [4, 2, 4, 2]];
    const selected = rhythms[Math.floor(random.next() * rhythms.length)];
    let currentTick = phrase[0].t;
    
    return phrase.map((note, i) => {
        const d = selected[i % selected.length];
        const t = currentTick;
        currentTick = (currentTick + d) % 12;
        return { ...note, t, d };
    });
}

export function transposeMelody(phrase: any[], interval: number): any[] {
    return phrase.map(n => {
        const s = (DEGREE_TO_SEMITONE[n.deg] || 0 + interval + 12) % 12;
        let deg = n.deg;
        for (const [d, v] of Object.entries(DEGREE_TO_SEMITONE)) { if (v === s) { deg = d as any; break; } }
        return { ...n, deg };
    });
}

export function addOrnaments(phrase: any[], random: any): any[] {
    const result = [];
    for (const note of phrase) {
        if (note.d >= 3 && random.next() < 0.4) {
            result.push({ t: Math.max(0, note.t - 1), d: 1, deg: (random.next() > 0.5 ? 'b3' : '2') as any, tech: 'gr' });
            result.push({ ...note, tech: 'sl' });
        } else result.push(note);
    }
    return result;
}

export function subdivideRhythm(phrase: any[], random: any): any[] {
    const result = [];
    for (const note of phrase) {
        if (note.d >= 3 && random.next() < 0.75) {
            const first = Math.floor(note.d / 2);
            const second = note.d - first;
            result.push({ ...note, d: first });
            result.push({ ...note, t: (note.t + first) % 12, d: second, tech: random.next() < 0.5 ? 'h/p' : 'sl' });
        } else result.push(note);
    }
    return result;
}

export function varyRhythm(phrase: any[], random: any): any[] {
    const p = [...phrase];
    if (p.length < 2) return p;
    if (random.next() < 0.5) {
        const i = Math.floor(random.next() * (p.length - 1));
        if (p[i].d < 4 && p[i+1].d < 4) { p[i].d += p[i+1].d; p.splice(i+1, 1); }
    }
    return p;
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
            const bluesSequence = ['i', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i', 'bVI', 'V', 'i', 'V'];
            let seqIdx = 0;
            let currentBarInPart = 0;
            
            while (currentBarInPart < partDuration) {
                const degree = bluesSequence[seqIdx % bluesSequence.length];
                const r = random.next();
                let duration = r < 0.6 ? 4 : (r < 0.9 ? 8 : 12);
                
                if (mood === 'melancholic' && degree === 'iv') {
                    duration = random.next() < 0.8 ? 8 : 12;
                }
                
                const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                
                const degreeMap: Record<string, {rootOffset: number, type: GhostChord['chordType']}> = {
                    'i': { rootOffset: 0, type: 'minor' }, 'iv': { rootOffset: 5, type: 'minor' },
                    'v': { rootOffset: 7, type: 'dominant' }, 'V': { rootOffset: 7, type: 'dominant' }, 
                    'bVI': { rootOffset: 8, type: 'major' },
                };
                
                const chordInfo = degreeMap[degree];
                harmonyTrack.push({
                    rootNote: key + chordInfo.rootOffset, chordType: chordInfo.type,
                    bar: partStartBar + currentBarInPart, durationBars: finalDuration,
                });
                
                currentBarInPart += finalDuration;
                seqIdx++;
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
        joyful: [110, 135], enthusiastic: [120, 150], contemplative: [72, 88],
        dreamy: [68, 82], calm: [64, 78], melancholic: [64, 72],
        gloomy: [66, 76], dark: [62, 70], epic: [115, 140], anxious: [82, 98],
    };

    const [minTempo, maxTempo] = (possibleTempos as any)[mood] || [60, 80];
    const baseTempo = minTempo + Math.floor(random.next() * (maxTempo - minTempo + 1));

    let bluesMelodyId: string | undefined;
    if (genre === 'blues') {
        const moodMelodies = BLUES_MELODY_RIFFS.filter(m => m.moods.includes(mood));
        if (moodMelodies.length > 0) {
            bluesMelodyId = moodMelodies[Math.floor(random.next() * moodMelodies.length)].id;
        }
    }

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

    return { harmonyTrack, baseTempo, rhythmicFeel: 'shuffle', bassStyle: 'walking', drumStyle: 'shuffle_A', soloPlanMap, bluesMelodyId };
}
