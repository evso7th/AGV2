/**
 * @fileOverview Universal Music Theory Utilities
 * #ЗАЧЕМ: Базовый набор инструментов для работы с нотами, ладами и ритмом.
 * #ЧТО: Функции для получения гамм, инверсий, ретроградов и гуманизации.
 *       Внедрена система цепей Маркова для генерации гармонического скелета.
 *       ДОБАВЛЕНО: Математика MusiNum для фрактальной детерминированности.
 * #ОБНОВЛЕНО (ПЛАН №238): Реализован алгоритм "Lick -> Transform -> Crossover -> Sowing".
 *       Теперь наследование (Breeding) влияет на "посев" всей структуры пьесы.
 * #ОБНОВЛЕНО (ПЛАН №241): Добавлена глубокая генетическая телеметрия (логирование эволюции).
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
import { BLUES_SOLO_PLANS, BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

const SEMITONE_TO_DEGREE: Record<number, BluesRiffDegree> = {
    0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5',
    8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: 'R+8', 14: '9', 17: '11'
};

// --- GLOBAL LICK ROTATION ---
let LICK_HISTORY: string[] = [];
const MAX_HISTORY_SIZE = 10;

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
 * #ЗАЧЕМ: Движок Генетической Рекомбинации Ликов.
 * #ЧТО: Теперь сообщает о типе примененной мутации в консоль.
 */
export function transformLick(lick: BluesSoloPhrase, seed: number, epoch: number): BluesSoloPhrase {
    const transformed = JSON.parse(JSON.stringify(lick)) as BluesSoloPhrase;
    const transformType = calculateMusiNum(epoch, 3, seed, 4);

    switch (transformType) {
        case 1: // Inversion
            console.log(`%c[SOR] Transform: INVERSION applied to lick at epoch ${epoch}`, 'color: #32CD32');
            const firstMidi = DEGREE_TO_SEMITONE[transformed[0].deg] || 0;
            transformed.forEach(n => {
                const currentMidi = DEGREE_TO_SEMITONE[n.deg] || 0;
                const invertedMidi = firstMidi - (currentMidi - firstMidi);
                const normalizedMidi = ((invertedMidi % 12) + 12) % 12;
                n.deg = SEMITONE_TO_DEGREE[normalizedMidi] || 'R';
            });
            break;
        case 2: // Retrograde
            console.log(`%c[SOR] Transform: RETROGRADE applied to lick at epoch ${epoch}`, 'color: #32CD32');
            return [...transformed].reverse().map((n, i) => ({ ...n, t: (12 - (transformed[transformed.length-1-i].t + transformed[transformed.length-1-i].d)) % 12 }));
        case 3: // Transposition
            console.log(`%c[SOR] Transform: TRANSPOSITION applied to lick at epoch ${epoch}`, 'color: #32CD32');
            const shift = [0, 3, 5, 7, 10][calculateMusiNum(seed, 5, epoch, 5)];
            transformed.forEach(n => {
                const currentMidi = DEGREE_TO_SEMITONE[n.deg] || 0;
                n.deg = SEMITONE_TO_DEGREE[(currentMidi + shift) % 12] || 'R';
            });
            break;
        default:
            console.log(`%c[SOR] Transform: RHYTHMIC JITTER applied to lick at epoch ${epoch}`, 'color: #32CD32');
            transformed.forEach(n => { n.t = (n.t + calculateMusiNum(epoch, 2, seed, 2)) % 12; });
            break;
    }
    return transformed;
}

export function crossoverDNA(currentSeed: number, ancestor: any): number {
    if (!ancestor || !ancestor.seed) return currentSeed;
    const blendFactor = 0.5;
    return Math.floor(currentSeed * blendFactor + ancestor.seed * (1 - blendFactor));
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
        map.push(Math.max(0.05, Math.min(0.95, baseTension * 0.8 + noise)));
    }
    return map;
}

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, epoch: number): FractalEvent[] {
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
      for (const note of baseScale) { fullScale.push(E1 + (octave * 12) + note); }
  }
  return fullScale;
}

/**
 * #ЗАЧЕМ: Генератор ДНК сюиты V238 — "Evolutionary Sowing".
 * #ЧТО: Реализует цепочку Lick -> Transform -> Crossover -> Final Seed -> Sowing.
 *       Добавлена глубокая телеметрия генетического процесса.
 */
export function generateSuiteDNA(totalBars: number, mood: Mood, initialSeed: number, originalRandom: any, genre: Genre, blueprintParts: any[], ancestor?: any): SuiteDNA {
    // 1. ВЫБОР СЕМАНТИЧЕСКОГО СЕМЕНИ (на основе initialSeed)
    let seedLickId: string | undefined;
    if (genre === 'blues') {
        const moodTags = (mood === 'dark' || mood === 'anxious' || mood === 'melancholic' || mood === 'gloomy') ? ['minor'] : ['major'];
        const candidates = Object.keys(BLUES_SOLO_LICKS).filter(id => 
            BLUES_SOLO_LICKS[id].tags.some(tag => moodTags.includes(tag)) && !LICK_HISTORY.includes(id)
        );
        const pool = candidates.length > 0 ? candidates : Object.keys(BLUES_SOLO_LICKS);
        seedLickId = pool[calculateMusiNum(initialSeed, 7, 42, pool.length)];
        
        LICK_HISTORY.push(seedLickId);
        if (LICK_HISTORY.length > MAX_HISTORY_SIZE) LICK_HISTORY.shift();
        
        if (seedLickId) {
            console.log(`%c[GENEPOOL] Seed Lick Picked: ${seedLickId} (${BLUES_SOLO_LICKS[seedLickId].tags.join(', ')})`, 'color: #FFD700; font-weight: bold;');
        }
    }

    // 2. ГЕНЕТИЧЕСКОЕ СКРЕЩИВАНИЕ (Breeding)
    const finalSeed = ancestor ? crossoverDNA(initialSeed, ancestor) : initialSeed;
    if (ancestor) {
        console.log(`%c[GENEPOOL] Breeding: Parent A (Initial: ${initialSeed}) + Parent B (Ancestor: ${ancestor.seed}) -> Final Seed: ${finalSeed}`, 'color: #ff00ff; font-weight: bold;');
    } else {
        console.log(`%c[GENEPOOL] Genesis: No ancestor found. Initial Seed preserved: ${finalSeed}`, 'color: #00BFFF;');
    }
    
    // 3. ПОСЕВ (Sowing): Все дальнейшие параметры зависят от finalSeed
    console.log(`%c[GENEPOOL] Sowing: Applying Final Seed ${finalSeed} to all structural parameters.`, 'color: #4ade80; font-weight: bold;');
    
    const sowingRandom = {
        state: finalSeed,
        next: function() {
            this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32);
            return this.state / Math.pow(2, 32);
        }
    };

    const harmonyTrack: GhostChord[] = [];
    const baseKeyNote = 24 + Math.floor(sowingRandom.next() * 12);
    const key = baseKeyNote;
    
    const grids = {
        classic: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
        'quick-change': [0, 5, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
        'minor-blues': [0, 0, 0, 0, 5, 5, 0, 0, 8, 7, 0, 7]
    };
    const gridTypes: (keyof typeof grids)[] = ['classic', 'quick-change', 'minor-blues'];
    const bluesGridType = gridTypes[calculateMusiNum(finalSeed, 3, finalSeed, 3)];

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
                    const offset = progression[i];
                    harmonyTrack.push({
                        rootNote: key + offset,
                        chordType: (offset === 7 || offset === 8) ? 'major' : 'minor',
                        bar: partStartBar + currentBarInPart,
                        durationBars: 1
                    });
                    currentBarInPart++;
                }
            }
        } else {
             let currentBarInPart = 0;
             while(currentBarInPart < partDuration) {
                const duration = [4, 8, 2][Math.floor(sowingRandom.next() * 3)];
                const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                const chordRoot = key + [0, 5, 7, -5, 4, 2, -7][Math.floor(sowingRandom.next() * 7)];
                harmonyTrack.push({ rootNote: chordRoot, chordType: sowingRandom.next() > 0.5 ? 'major' : 'minor', bar: partStartBar + currentBarInPart, durationBars: finalDuration });
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
    const baseTempo = minTempo + Math.floor(sowingRandom.next() * (maxTempo - minTempo + 1));

    const soloPlanMap = new Map<string, string>();
    const allPlanIds = Object.keys(BLUES_SOLO_PLANS).filter(id => !id.includes('OUTRO'));
    const shuffledPlanIds = [...allPlanIds].sort(() => sowingRandom.next() - 0.5);
    let planIndex = 0;
    blueprintParts.forEach((part: any) => {
        if (part.instrumentRules?.melody?.source === 'blues_solo') {
            soloPlanMap.set(part.id, shuffledPlanIds[planIndex % shuffledPlanIds.length]);
            planIndex++;
        }
    });

    const tensionMap = generateTensionMap(finalSeed, totalBars, mood);
    const anchorPool = ['R', 'b3', '4', '5', 'b7'];
    const thematicAnchors = [
        anchorPool[calculateMusiNum(finalSeed, 3, 0, anchorPool.length)],
        anchorPool[anchorPool.length - 1 - calculateMusiNum(finalSeed, 5, 1, anchorPool.length)]
    ];

    return { 
        harmonyTrack, baseTempo, rhythmicFeel: 'shuffle', bassStyle: 'walking', drumStyle: 'shuffle_A', 
        soloPlanMap, tensionMap, bluesGridType, thematicAnchors, seedLickId
    };
}
