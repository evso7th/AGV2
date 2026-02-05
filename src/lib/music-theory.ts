/**
 * @fileOverview Music Theory Utilities and Axiom Generation
 * #ЗАЧЕМ: Центральный хаб музыкальной логики.
 * #ЧТО: Содержит функции для генерации ДНК сюиты, аккордов, мелодий и ритмов.
 * #СВЯЗИ: Является основным потавщиком данных для `FractalMusicEngine`.
 */

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree, SuiteDNA, RhythmicFeel, BassStyle, DrumStyle, HarmonicCenter } from '@/types/music';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

export function getScaleForMood(mood: Mood, genre?: Genre, chordType?: 'major' | 'minor' | 'dominant' | 'diminished'): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (genre === 'blues') {
      if (chordType === 'major' || chordType === 'dominant') {
          baseScale = [0, 2, 3, 4, 7, 9];
      } else {
          baseScale = [0, 3, 5, 6, 7, 10];
      }
  } else {
      switch (mood) {
        case 'joyful':      
          baseScale = [0, 2, 4, 5, 7, 9, 11];
          break;
        case 'epic':        
        case 'enthusiastic':
          baseScale = [0, 2, 4, 6, 7, 9, 11];
          break;
        case 'dreamy':      
          baseScale = [0, 2, 4, 7, 9];
          break;
        case 'contemplative': 
        case 'calm':
            baseScale = [0, 2, 4, 5, 7, 9, 10];
            break;
        case 'melancholic': 
          baseScale = [0, 2, 3, 5, 7, 9, 10];
          break;
        case 'dark':        
        case 'gloomy':
          baseScale = [0, 2, 3, 5, 7, 8, 10];
          break;
        case 'anxious':     
          baseScale = [0, 1, 3, 5, 6, 8, 10];
          break;
        default:            
          baseScale = [0, 2, 3, 5, 7, 8, 10];
          break;
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

const midiToChordName = (rootNote: number, chordType: 'major' | 'minor' | 'diminished' | 'dominant'): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootName = noteNames[rootNote % 12];
    switch (chordType) {
        case 'minor': return `${rootName}m`;
        case 'diminished': return `${rootName}dim`;
        case 'dominant': return `${rootName}7`;
        case 'major':
        default:
            return rootName;
    }
};

/**
 * #ЗАЧЕМ: Вносит микро-сдвиги в тайминг событий для имитации человеческой игры.
 * #ЧТО: Сдвигает e.time на случайную величину (15-40мс в пересчете на доли).
 */
export function humanizeEvents(events: FractalEvent[], amount: number, random: any) {
    events.forEach(e => {
        // amount обычно 0.01 - 0.04 (соответствует 10-40мс при 120BPM)
        const shift = (random.next() - 0.5) * 2 * amount;
        e.time = Math.max(0, e.time + shift);
    });
}

export function generateSuiteDNA(totalBars: number, mood: Mood, seed: number, random: any, genre: Genre, blueprintParts: BlueprintPart[]): SuiteDNA {
    const harmonyTrack: GhostChord[] = [];
    const baseKeyNote = 24 + random.nextInt(12);
    const key = baseKeyNote;
    
    let accumulatedBars = 0;
    const totalPercent = blueprintParts.reduce((sum, part) => sum + part.duration.percent, 0);

    blueprintParts.forEach((part, index) => {
        const isLastPart = index === blueprintParts.length - 1;
        let partDuration = isLastPart ? (totalBars - accumulatedBars) : Math.round((part.duration.percent / totalPercent) * totalBars);
        const partStartBar = accumulatedBars;
        if (partDuration <= 0) return;

        if (genre === 'blues') {
            // #ЗАЧЕМ: Реализация "Expanded 12-bar" — фиксированная последовательность с вариативной длительностью.
            const bluesSequence = ['i', 'iv', 'i', 'i', 'iv', 'iv', 'i', 'i', 'bVI', 'V', 'i', 'V'];
            const degreeMap: Record<string, {rootOffset: number, type: GhostChord['chordType']}> = {
                'i': { rootOffset: 0, type: 'minor' }, 'iv': { rootOffset: 5, type: 'minor' },
                'v': { rootOffset: 7, type: 'dominant' }, 'V': { rootOffset: 7, type: 'dominant' }, 
                'bVI': { rootOffset: 8, type: 'major' },
            };
            
            let seqIdx = 0;
            let currentBarInPart = 0;
            while (currentBarInPart < partDuration) {
                const degree = bluesSequence[seqIdx % bluesSequence.length];
                // Длительность аккорда: 4, 8 или 12 тактов (атмосферный блюз)
                const durationOptions = [4, 8, 12];
                const duration = durationOptions[random.nextInt(durationOptions.length)];
                const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                
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
                const duration = [4, 8, 2][random.nextInt(3)];
                const finalDuration = Math.min(duration, partDuration - currentBarInPart);
                const chordRoot = key + [0, 5, 7, -5, 4, 2, -7][random.nextInt(7)];
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
    const baseTempo = minTempo + random.nextInt(maxTempo - minTempo + 1);

    const soloPlanMap = new Map<string, string>();
    const allPlanIds = Object.keys(BLUES_SOLO_PLANS);
    const shuffledPlanIds = random.shuffle(allPlanIds);
    let planIndex = 0;
    blueprintParts.forEach(part => {
        if (part.instrumentRules?.melody?.source === 'blues_solo') {
            soloPlanMap.set(part.id, shuffledPlanIds[planIndex % shuffledPlanIds.length]);
            planIndex++;
        }
    });

    return { harmonyTrack, baseTempo, rhythmicFeel: 'shuffle', bassStyle: 'walking', drumStyle: 'shuffle_A', soloPlanMap };
}

export function createDrumAxiom(kit: DrumKit, genre: Genre, mood: Mood, tempo: number, random: any, rules?: InstrumentBehaviorRules): { events: FractalEvent[], log: string } {
    const events: FractalEvent[] = [];
    const riffs = (BLUES_DRUM_RIFFS as any)[mood] ?? BLUES_DRUM_RIFFS['contemplative'] ?? [];
    if (riffs.length === 0) return {events, log: "No riffs"};
    const riff = riffs[random.nextInt(riffs.length)];

    const add = (pattern: number[] | undefined, pool: InstrumentType[] | undefined) => {
        if (pattern && pool && pool.length > 0) {
            const sample = pool[random.nextInt(pool.length)];
            pattern.forEach(t => events.push({ type: sample, time: t / 3, duration: 0.2, weight: 0.8, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: {} }));
        }
    };
    add(riff.K, kit.kick); add(riff.SD, kit.snare); add(riff.HH, kit.hihat); add(riff.OH, kit.hihat); add(riff.R, kit.ride); add(riff.T, kit.perc);
    
    // Гуманизация барабанов
    humanizeEvents(events, 0.01, random);
    
    return { events, log: "Drums OK" };
}

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, epoch: number): FractalEvent[] {
    return [{ type: 'harmony', note: chord.rootNote, duration: 4.0, time: 0, weight: 0.7, technique: 'choral', dynamics: 'mf', phrasing: 'legato', params: { barCount: epoch }, chordName: midiToChordName(chord.rootNote, chord.chordType) }];
}

export function createAmbientBassAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: any, tempo: number, technique: Technique): FractalEvent[] {
  const root = chord.rootNote - 12;
  const common = { attack: 1.0, release: 2.0, cutoff: 220, resonance: 0.75, distortion: 0.05, portamento: 0.08 };
  const events = [{ type: 'bass', note: root, duration: 3.5, time: 0, weight: 0.75, technique: 'drone', dynamics: 'p', phrasing: 'legato', params: { ...common, attack: 1.5, release: 3.0 } }] as FractalEvent[];
  humanizeEvents(events, 0.02, random);
  return events;
}

export function createBluesBassAxiom(chord: GhostChord, technique: Technique, random: any, mood: Mood, epoch: number, dna: SuiteDNA, riffIdx: number): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const riffs = (BLUES_BASS_RIFFS as any)[mood] ?? BLUES_BASS_RIFFS['contemplative'];
    const riff = riffs[riffIdx % riffs.length];
    
    // Определяем позицию в 12-тактовом цикле на основе harmonyTrack
    const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
    const barIn12Cycle = currentChordIdx % 12;
    
    let src: 'I' | 'IV' | 'V' | 'turn' = (barIn12Cycle === 11) ? 'turn' : (barIn12Cycle === 1 || barIn12Cycle === 4 || barIn12Cycle === 5 || barIn12Cycle === 9) ? 'IV' : (barIn12Cycle === 8) ? 'V' : 'I';
    
    for (const n of riff[src]) {
        phrase.push({ type: 'bass', note: chord.rootNote + (DEGREE_TO_SEMITONE[n.deg] || 0) - 12, time: n.t / 3, duration: ((n.d || 2) / 3) * 0.95, weight: 0.85 + random.next() * 0.1, technique: 'pluck', dynamics: 'mf', phrasing: 'legato', params: { cutoff: 800, resonance: 0.7, distortion: 0.15, portamento: 0.0 } });
    }
    
    humanizeEvents(phrase, 0.015, random);
    return phrase;
}

/**
 * #ЗАЧЕМ: Центральный генератор мелодии для блюза с поддержкой классических техник развития.
 */
export function generateBluesMelodyChorus(currentChord: GhostChord, random: any, partId: string, epoch: number, rules: any, dna: SuiteDNA, history: string[], cached: any): { events: FractalEvent[], log: string } {
    // Находим индекс текущего аккорда в последовательности DNA
    const currentChordIdx = dna.harmonyTrack.findIndex(c => epoch >= c.bar && epoch < c.bar + c.durationBars);
    const barInChorus = currentChordIdx % 12;
    
    const isMinor = currentChord.chordType === 'minor' || currentChord.chordType === 'diminished';
    const targetTag = isMinor ? 'minor' : 'major';
    const lastId = history[history.length - 1];
    
    let lickId: string;
    let strategy: 'statement' | 'sequence' | 'variation' = 'statement';

    if (barInChorus === 11) { lickId = 'L09'; }
    else if (barInChorus > 0 && barInChorus % 2 === 0 && lastId && random.next() < 0.4) {
        strategy = random.next() < 0.5 ? 'sequence' : 'variation';
        lickId = lastId;
    } else {
        let lickPool = Object.entries(BLUES_SOLO_LICKS).filter(([id, data]) => data.tags.includes(targetTag));
        const isActivePart = ['MAIN', 'SOLO'].includes(partId);
        const isDarkMood = ['dark', 'melancholic', 'anxious'].includes(dna.harmonyTrack[0].chordType); // Approximation
        
        if (isActivePart && random.next() < 0.6) {
            const virtuosoPool = lickPool.filter(([id, data]) => data.tags.includes('virtuoso') || data.tags.includes('active'));
            if (virtuosoPool.length > 0) lickPool = virtuosoPool;
        }
        
        lickId = lickPool[random.nextInt(lickPool.length)][0];
    }

    history.push(lickId);
    let lickPhrase = JSON.parse(JSON.stringify(BLUES_SOLO_LICKS[lickId].phrase)) as BluesSoloPhrase;

    if (strategy === 'sequence') lickPhrase = transposeMelody(lickPhrase, [2, 3, -2][random.nextInt(3)]);
    if (strategy === 'variation' || random.next() < 0.3) lickPhrase = varyRhythm(lickPhrase, random);

    const currentTempo = rules.bpm?.base || dna.baseTempo;
    if ((['MAIN', 'SOLO'].includes(partId) || currentTempo > 90) && !['melancholic', 'dark'].includes(partId.toLowerCase())) {
        lickPhrase = subdivideRhythm(lickPhrase, random);
    }

    const events: FractalEvent[] = lickPhrase.map(note => ({
        type: 'melody', note: currentChord.rootNote + (DEGREE_TO_SEMITONE[note.deg] || 0),
        time: note.t / 3, duration: (note.d || 2) / 3, weight: 0.8 + random.next() * 0.1,
        technique: (note.tech || 'pluck') as Technique, dynamics: 'mf', phrasing: 'legato', params: { barCount: epoch }
    }));

    // Применяем гуманизацию
    humanizeEvents(events, 0.02, random);

    return { events, log: `Bar ${epoch}: ${lickId}` };
}

export function subdivideRhythm(phrase: BluesSoloPhrase, random: any): BluesSoloPhrase {
    const result: BluesSoloPhrase = [];
    for (const note of phrase) {
        if (note.d >= 3 && random.next() < 0.75) {
            const first = Math.floor(note.d / 2);
            const second = note.d - first;
            result.push({ ...note, d: first });
            result.push({ ...note, t: note.t + first, d: second, tech: random.next() < 0.5 ? 'h' : 'sl' });
        } else { result.push(note); }
    }
    return result;
}

export function transposeMelody(phrase: BluesSoloPhrase, interval: number): BluesSoloPhrase {
    return phrase.map(n => {
        const s = (DEGREE_TO_SEMITONE[n.deg] || 0 + interval + 12) % 12;
        let deg = n.deg;
        for (const [d, v] of Object.entries(DEGREE_TO_SEMITONE)) { if (v === s) { deg = d as BluesRiffDegree; break; } }
        return { ...n, deg };
    });
}

export function varyRhythm(phrase: BluesSoloPhrase, random: any): BluesSoloPhrase {
    const p = [...phrase];
    if (p.length < 2) return p;
    if (random.next() < 0.5) {
        const i = Math.floor(random.next() * (p.length - 1));
        if (p[i].d < 4 && p[i+1].d < 4) { p[i].d += p[i+1].d; p.splice(i+1, 1); }
    }
    return p;
}

export function createAmbientMelodyMotif(chord: GhostChord, mood: Mood, random: any): FractalEvent[] { return []; }
export function mutateBassPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: any): FractalEvent[] { return []; }
export function createBassFill(chord: GhostChord, mood: Mood, genre: Genre, random: any): { events: FractalEvent[]; duration: number } { return { events: [], duration: 0 }; }
export function createDrumFill(random: any, params: any): FractalEvent[] { return []; }
export function chooseHarmonyInstrument(part: BlueprintPart, useMelodyV2: boolean, random: any): any { return 'piano'; }
export function mutateBluesAccompaniment(phrase: FractalEvent[], chord: GhostChord, random: any): FractalEvent[] { return []; }
export function mutateBluesMelody(phrase: BluesSoloPhrase, chord: GhostChord, random: any): BluesSoloPhrase { return []; }
export function createBluesOrganLick(chord: GhostChord, random: any): FractalEvent[] { return []; }
export function generateIntroSequence(currentBar: number, introRules: any, harmonyTrack: GhostChord[], settings: any, random: any): any { return { events: [], instrumentHints: {} }; }
export function invertMelody(phrase: BluesSoloPhrase): BluesSoloPhrase { return phrase; }
export function addOrnaments(phrase: BluesSoloPhrase, random: any): BluesSoloPhrase { return phrase; }
