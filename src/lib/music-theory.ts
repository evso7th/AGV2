/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ЧТО: Функции для получения гамм, инверсий, ретроградов и гуманизации.
 *       Внедрена система цепей Маркова для генерации гармонического скелета.
 *       ДОБАВЛЕНО: Математика MusiNum для фрактальной детерминированности.
 * #ОБНОВЛЕНО (ПЛАН №201): Добавлена функция crossoverDNA для генетического скрещивания.
 */

import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo,
    InstrumentPart,
    TensionProfile
} from '@/types/music';
import { BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

/**
 * #ЗАЧЕМ: Математическое ядро MusiNum.
 */
export function calculateMusiNum(step: number, base: number = 2, start: number = 0, modulo: number = 8): number {
    if (!isFinite(step) || !isFinite(start) || !isFinite(base) || !isFinite(modulo) || modulo <= 0 || base <= 1) return 0;
    
    let num = Math.abs(Math.floor(step + start));
    let sum = 0;
    while (num > 0) {
        sum += num % base;
        num = Math.floor(num / base);
    }
    return sum % modulo;
}

/**
 * #ЗАЧЕМ: Генетическое скрещивание (Breeding).
 * #ЧТО: Смешивает текущее "семя" с параметрами успешного "предка".
 */
export function crossoverDNA(currentSeed: number, ancestor: any): number {
    if (!ancestor || !ancestor.seed) return currentSeed;
    
    // Фрактальное смешивание: берем старшие разряды текущего семени
    // и младшие разряды предка (или наоборот)
    const blendFactor = 0.5;
    return Math.floor(currentSeed * blendFactor + ancestor.seed * (1 - blendFactor));
}

/**
 * #ЗАЧЕМ: Детерминированный выбор из взвешенного списка.
 */
export function pickWeightedDeterministic<T>(
    options: { name?: T, value?: T, weight: number }[], 
    seed: number, 
    epoch: number, 
    offset: number
): T {
    if (!options || options.length === 0) return null as any;
    
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    const fractalVal = calculateMusiNum(epoch, 7, seed + offset, 100);
    const target = (fractalVal / 100) * totalWeight;
    
    let acc = 0;
    for (const opt of options) {
        acc += opt.weight;
        if (target <= acc) return (opt.name || opt.value) as T;
    }
    
    return (options[options.length - 1].name || options[options.length - 1].value) as T;
}

/**
 * #ЗАЧЕМ: Генератор детерминированной карты напряжения с учетом настроения.
 * #ЧТО: Использует MusiNum и профили (Arc, Wave, Plateau).
 */
export function generateTensionMap(seed: number, totalBars: number, mood: Mood): number[] {
    const map: number[] = [];
    
    const getProfile = (m: Mood): TensionProfile['type'] => {
        if (['melancholic', 'gloomy'].includes(m)) return 'arc';
        if (['joyful', 'enthusiastic', 'epic'].includes(m)) return 'crescendo';
        if (['calm', 'contemplative'].includes(m)) return 'plateau';
        return 'wave';
    };

    const type = getProfile(mood);

    for (let i = 0; i < totalBars; i++) {
        const progress = i / totalBars;
        let baseTension = 0.5;

        switch (type) {
            case 'arc': baseTension = Math.sin(progress * Math.PI); break;
            case 'crescendo': baseTension = Math.pow(progress, 1.2); break;
            case 'plateau': baseTension = progress < 0.2 ? progress / 0.2 : (progress < 0.8 ? 0.8 : 0.8 - (progress - 0.8)); break;
            case 'wave': baseTension = 0.5 + 0.3 * Math.sin(progress * Math.PI * 4); break;
        }

        const noise = (calculateMusiNum(i, 7, seed, 100) / 100) * 0.2;
        const combined = baseTension * 0.8 + noise;
        
        map.push(Math.max(0.05, Math.min(0.95, combined)));
    }
    return map;
}

/**
 * #ЗАЧЕМ: Базовая гармоническая аксиома.
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
            note: note + 12, 
            time: 0,
            duration: 4.0,
            weight: 0.15,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { barCount: epoch },
            chordName: isMinor ? 'Am' : 'E' 
        });
    });

    return events;
}

export function getScaleForMood(mood: Mood, genre?: Genre): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (genre === 'blues') {
      baseScale = [0, 3, 5, 6, 7, 10]; 
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

/**
 * #ЗАЧЕМ: Генератор ДНК сюиты.
 */
export function generateSuiteDNA(totalBars: number, mood: Mood, seed: number, random: any, genre: Genre, blueprintParts: any[]): SuiteDNA {
    const harmonyTrack: GhostChord[] = [];
    const baseKeyNote = 24 + Math.floor(random.next() * 12);
    const key = baseKeyNote;
    
    const gridTypes: ('classic' | 'quick-change' | 'minor-blues')[] = ['classic', 'quick-change', 'minor-blues'];
    const bluesGridType = gridTypes[calculateMusiNum(seed, 3, seed, 3)];

    const grids = {
        classic: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
        'quick-change': [0, 5, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
        'minor-blues': [0, 0, 0, 0, 5, 5, 0, 0, 8, 7, 0, 7]
    };

    let accumulatedBars = 0;
    const totalPercent = blueprintParts.reduce((sum: number, part: any) => sum + part.duration.percent, 0);

    blueprintParts.forEach((part: any, index: number) => {
        const isLastPart = index === blueprintParts.length - 1;
        let partDuration = isLastPart ? (totalBars - accumulatedBars) : Math.round((part.duration.percent / totalPercent) * totalBars);
        const partStartBar = accumulatedBars;
        if (partDuration <= 0) return;

        if (genre === 'blues') {
            const progression = grids[bluesGridType];
            let currentBarInPart = 0;
            while (currentBarInPart < partDuration) {
                for (let i = 0; i < 12 && currentBarInPart < partDuration; i++) {
                    const barIdx = partStartBar + currentBarInPart;
                    const offset = progression[i];
                    harmonyTrack.push({
                        rootNote: key + offset,
                        chordType: (offset === 7 || offset === 8) ? 'major' : 'minor',
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
    const allPlanIds = Object.keys(BLUES_SOLO_PLANS).filter(id => !id.includes('OUTRO'));
    const shuffledPlanIds = [...allPlanIds].sort(() => random.next() - 0.5);
    let planIndex = 0;
    blueprintParts.forEach((part: any) => {
        if (part.instrumentRules?.melody?.source === 'blues_solo') {
            soloPlanMap.set(part.id, shuffledPlanIds[planIndex % shuffledPlanIds.length]);
            planIndex++;
        }
    });

    const tensionMap = generateTensionMap(seed, totalBars, mood);
    
    const anchorPool = ['R', 'b3', '4', '5', 'b7'];
    const thematicAnchors = [
        anchorPool[calculateMusiNum(seed, 3, 0, anchorPool.length)],
        anchorPool[anchorPool.length - 1 - calculateMusiNum(seed, 5, 1, anchorPool.length)]
    ];

    return { 
        harmonyTrack, 
        baseTempo, 
        rhythmicFeel: 'shuffle', 
        bassStyle: 'walking', 
        drumStyle: 'shuffle_A', 
        soloPlanMap, 
        tensionMap,
        bluesGridType,
        thematicAnchors
    };
}
