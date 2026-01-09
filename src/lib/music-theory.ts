

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, AccompanimentInstrument, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, IntroRules, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';

// --- МУЗЫКАЛЬНЫЕ АССЕТЫ (БАЗА ЗНАНИЙ) ---
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_GUITAR_RIFFS, BLUES_GUITAR_VOICINGS } from './assets/blues-guitar-riffs';
import { BLUES_MELODY_RIFFS } from './assets/blues-melody-riffs';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';


export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
  type: 'bass' | 'drums' | 'accompaniment' | 'harmony' | 'melody';
  endTime: number; // Абсолютное время окончания последнего события в ветке
};

interface EngineConfig {
  mood: Mood;
  genre: Genre;
  tempo: number;
  density: number;
  lambda: number;
  organic: number;
  drumSettings: any;
  seed: number;
  composerControlsInstruments?: boolean;
}

type PlayPlanItem = {
    phraseIndex: number;
    repetitions: number;
    instrument: AccompanimentInstrument;
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function seededRandom(seed: number) {
  let state = seed;
  const self = {
    next: () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    },
    nextInt: (max: number) => Math.floor(self.next() * max)
  };
  return self;
}

function safeTime(value: number, fallback: number = 0): number {
  return isFinite(value) ? value : fallback;
}

const isBass = (event: FractalEvent): boolean => event.type === 'bass';
const isAccompaniment = (event: FractalEvent): boolean => event.type === 'accompaniment';
const isHarmony = (event: FractalEvent): boolean => event.type === 'harmony';
const isMelody = (event: FractalEvent): boolean => event.type === 'melody';
const isKick = (event: FractalEvent): boolean => event.type === 'drum_kick';
const isSnare = (event: FractalEvent): boolean => event.type === 'drum_snare';
const isRhythmic = (event: FractalEvent): boolean => (event.type as string).startsWith('drum_') || (event.type as string).startsWith('perc-');


// === АКСОМЫ И ТРАНСФОРМАЦИИ ===
export function mutateBassPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    if (phrase.length === 0) {
        if (genre === 'blues') {
            return generateBluesBassRiff(chord, 'riff', random, mood);
        }
        return createAmbientBassAxiom(chord, mood, genre, random, 120, 'drone');
    }

    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    const mutationType = random.nextInt(4);
    let mutationDescription = "Unknown";

    switch (mutationType) {
        case 0: 
            mutationDescription = "Rhythmic Variation";
            if (newPhrase.length > 0) {
                const noteToChange = newPhrase[random.nextInt(newPhrase.length)];
                noteToChange.duration *= (random.next() > 0.5 ? 1.5 : 0.66);
            }
            if (newPhrase.length > 1) {
                const anotherNote = newPhrase[random.nextInt(newPhrase.length)];
                anotherNote.duration *= (random.next() > 0.5 ? 1.25 : 0.75);
            }
            break;

        case 1:
            mutationDescription = "Pitch Inversion";
             if (newPhrase.length > 1) {
                const firstNote = newPhrase[0].note;
                newPhrase.forEach(event => {
                    const interval = event.note - firstNote;
                    event.note = firstNote - interval;
                });
             }
            break;

        case 2:
            mutationDescription = "Partial Regeneration";
            if (newPhrase.length > 2) {
                const half = Math.ceil(newPhrase.length / 2);
                const newHalf = genre === 'blues'
                    ? generateBluesBassRiff(chord, 'riff', random, mood).slice(0, half)
                    : createAmbientBassAxiom(chord, mood, genre, random, 120, 'drone').slice(0, half);
                newPhrase.splice(0, half, ...newHalf);
            }
            break;

        case 3:
            mutationDescription = "Passing Note Addition";
            if (newPhrase.length > 1) {
                const insertIndex = random.nextInt(newPhrase.length - 1) + 1;
                const prevNote = newPhrase[insertIndex-1];
                const scale = getScaleForMood(mood, genre);
                const passingNoteMidi = scale[Math.floor(random.next() * scale.length)];
                
                const newNote: FractalEvent = {
                    ...prevNote,
                    note: passingNoteMidi,
                    duration: 0.5, 
                    time: prevNote.time + prevNote.duration / 2,
                    weight: prevNote.weight * 0.8
                };
                newPhrase.splice(insertIndex, 0, newNote);
            }
            break;
    }

    let totalDuration = newPhrase.reduce((sum, e) => sum + e.duration, 0);
    if (totalDuration > 0) {
        const scaleFactor = (genre === 'blues' ? 4.0 : 8.0) / totalDuration; // Blues phrases are 1 bar, ambient are 2
        let runningTime = 0;
        newPhrase.forEach(e => {
            e.duration *= scaleFactor;
            e.time = runningTime;
            runningTime += e.duration;
        });
    }
    
    console.log(`%c[BassMutation] Type: ${mutationDescription} -> ${newPhrase.map(e=>e.note).join(',')}`, 'color: #87CEEB');

    return newPhrase;
}

export function mutateAccompanimentPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    if (newPhrase.length === 0) return [];
    
    const mutationType = random.nextInt(4);
    switch (mutationType) {
        case 0: // Изменение ритма (арпеджио -> аккорд и наоборот)
            if (newPhrase.length > 1) {
                const totalDuration = newPhrase.reduce((sum, e) => sum + e.duration, 0);
                newPhrase.splice(1); // Оставляем только первую ноту
                newPhrase[0].duration = totalDuration;
                newPhrase[0].time = 0;
            }
            break;
        case 1: // Смена октавы
            const octaveShift = (random.next() > 0.5) ? 12 : -12;
            newPhrase.forEach(e => e.note += octaveShift);
            break;
        case 2: // Ретроград (обратное движение)
            const noteOrder = newPhrase.map(e => e.note).reverse();
            newPhrase.forEach((e, i) => e.note = noteOrder[i]);
            break;
        case 3: // Добавление гармонического тона
            if (newPhrase.length < 5) {
                const scale = getScaleForMood(mood, genre);
                const newNoteMidi = scale[random.nextInt(scale.length)] + 12 * 4;
                const lastNote = newPhrase[newPhrase.length - 1];
                newPhrase.push({ ...lastNote, note: newNoteMidi, time: lastNote.time + 0.1 });
            }
            break;
    }

    return newPhrase;
}



export const PERCUSSION_SETS: Record<'NEUTRAL' | 'ELECTRONIC' | 'DARK', InstrumentType[]> = {
    NEUTRAL: ['perc-001', 'perc-002', 'perc-005', 'perc-006', 'perc-013', 'perc-014', 'perc-015', 'drum_ride', 'cymbal_bell1'],
    ELECTRONIC: ['perc-003', 'perc-004', 'perc-007', 'perc-008', 'perc-009', 'perc-010', 'perc-011', 'perc-012', 'hh_bark_short'],
    DARK: ['perc-013', 'drum_snare_off', 'drum_tom_low', 'perc-007', 'perc-015']
};

export const ALL_RIDES: InstrumentType[] = ['drum_a_ride1', 'drum_a_ride2', 'drum_a_ride3', 'drum_a_ride4'];
const AMBIENT_SNARES: InstrumentType[] = ['drum_snare_ghost_note', 'drum_snarepress', 'drum_snare_off'];
const AMBIENT_PERC: InstrumentType[] = [...PERCUSSION_SETS.ELECTRONIC, ...ALL_RIDES];
const AMBIENT_INTRO_PERC: InstrumentType[] = ['drum_tom_low', 'perc-013', 'perc-015', 'drum_hihat_closed', 'drum_hihat_open'];


type DrumPatternEvent = {
    type: InstrumentType | InstrumentType[];
    time: number; // in beats
    duration: number; // in beats
    weight: number;
    probabilities?: number[];
    probability?: number; // Chance for the event to occur at all
};

type DrumKitPattern = {
    kick: DrumPatternEvent[];
    snare: DrumPatternEvent[];
    hihat: DrumPatternEvent[];
    tags: string[]; // Rhythmic/stylistic tags
};

export type PercussionRule = {
    types: InstrumentType[];
    allowedTimes: number[];
    probability: number;
    weight: number;
    type?: 'electronic' | 'acoustic';
};

type BassPatternEvent = {
    note: number; // Scale degree (0=root, 1=second, etc.)
    time: number; // Beat
    duration: number; // In beats
    technique?: Technique;
};

type BassPattern = BassPatternEvent[];
type BassPatternGenerator = (scale: number[], random: { next: () => number, nextInt: (max: number) => number }) => { note: number, time: number, duration: number, technique?: Technique }[];

export type BassPatternDefinition = {
    pattern: BassPattern | BassPatternGenerator;
    tags: string[];
};

export function getScaleForMood(mood: Mood, genre?: Genre): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (genre === 'blues') {
      if (mood === 'dark' || mood === 'gloomy' || mood === 'melancholic' || mood === 'anxious') {
           baseScale = [0, 3, 5, 6, 7, 10];
      } else {
          baseScale = [0, 2, 3, 4, 7, 9];
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
  fullScale.push(E1 + 36);

  return fullScale;
}

export const DEGREE_TO_SEMITONE: Record<BluesRiffDegree, number> = { 'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7, 'b6': 8, '6': 9, 'b7': 10, '9': 14, '11': 17, 'R+8': 12 };

export function createAmbientBassAxiom(currentChord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }, tempo: number, technique: Technique): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const scale = getScaleForMood(mood, genre);
    const rootNote = currentChord.rootNote;

    // #ИСПРАВЛЕНО (ПЛАН 916): Количество нот и их выбор теперь случайны
    const numNotes = 1 + random.nextInt(4); // 1 to 4 notes
    let currentTime = 0;
    const totalDurationNormalizer = 8.0; 

    for (let i = 0; i < numNotes; i++) {
        // #ИСПРАВЛЕНО (ПЛАН 916): Длительность нот теперь случайна
        const duration = (random.next() * 2) + 0.5; // 0.5 to 2.5 beats
        
        let note = rootNote;
        if (i > 0 && random.next() > 0.3) { // 70% шанс сменить ноту
            const isMinor = currentChord.chordType === 'minor' || currentChord.chordType === 'diminished';
            // #ИСПРАВЛЕНО (ПЛАН 916): Больше разнообразия в выборе нот из аккорда
            const possibleNotes = [ rootNote, rootNote + 7, rootNote + (isMinor ? 3 : 4), rootNote + 12, rootNote - 5 ].filter(n => scale.some(scaleNote => scaleNote % 12 === n % 12));
            note = possibleNotes[random.nextInt(possibleNotes.length)] || rootNote;
        }

        phrase.push({
            type: 'bass', note: note, duration: duration, time: currentTime, weight: 0.6 + random.next() * 0.3,
            technique: 'swell', dynamics: 'mf', phrasing: 'legato',
            params: { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: duration * 0.5, release: duration * 1.5 }
        });
        
        currentTime += duration;
    }

    if (currentTime > 0) {
        const scaleFactor = totalDurationNormalizer / currentTime;
        let runningTime = 0;
        phrase.forEach(e => { e.duration *= scaleFactor; e.time = runningTime; runningTime += e.duration; });
    }

    phrase.forEach(event => { event.note += 12; });
    
    return phrase;
};


export function createAccompanimentAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number }, tempo: number = 120, registerHint?: 'low' | 'mid' | 'high'): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const rootMidi = chord.rootNote;
    
    let chordNotes: number[] = [];
    if (chord.chordType === 'dominant') {
        chordNotes = [rootMidi, rootMidi + 4, rootMidi + 7, rootMidi + 10];
    } else {
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        chordNotes = [rootMidi, rootMidi + (isMinor ? 3 : 4), rootMidi + 7];
    }
    
    let baseOctave = 3;
    if (registerHint === 'low') baseOctave = 2;
    if (registerHint === 'high') baseOctave = 4;

    // #ИСПРАВЛЕНО (ПЛАН 916): Добавлен случайный выбор техники исполнения
    // #ИСПРАВЛЕНО (ПЛАН 972): Улучшена логика для более музыкального результата
    if (random.next() < 0.6) { // 60% шанс сыграть пульсирующий аккорд
        const duration = 0.5; // восьмые ноты
        const times = [0, 1.5, 2.5, 3.5]; // Пульсирующий ритм
        times.forEach(time => {
            if (random.next() < 0.7) { // Добавляем немного случайности
                const note = chordNotes[random.nextInt(chordNotes.length)];
                axiom.push({
                    type: 'accompaniment', note: note + 12 * baseOctave, duration, time,
                    weight: 0.5 - (0 * 0.05), technique: 'long-chords', dynamics: 'p', phrasing: 'staccato', 
                    params: { attack: 0.05, release: duration * 0.8 }
                });
            }
        });
    } else { // 40% шанс сыграть медленное арпеджио
        const numNotes = chordNotes.length;
        const duration = 4.0 / numNotes;
        for (let i = 0; i < numNotes; i++) {
             axiom.push({
                type: 'accompaniment', note: chordNotes[i % chordNotes.length] + 12 * baseOctave, duration: duration, time: i * duration,
                weight: 0.5 + random.next() * 0.1, technique: 'arpeggio-slow', dynamics: 'p', phrasing: 'legato', params: { attack: 0.1, release: duration * 0.9 }
            });
        }
    }

    return axiom;
}

// ... rest of the file ...
export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number }): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const scale = getScaleForMood(mood, genre);
    const rootMidi = chord.rootNote;
    
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const third = rootMidi + (isMinor ? 3 : 4);
    const fifth = rootMidi + 7;

    const chordNotes = [rootMidi, third, fifth].filter(n => scale.some(scaleNote => scaleNote % 12 === n % 12));
    if (chordNotes.length < 2) return [];
    
    const numNotes = 2 + random.nextInt(2);
    let currentTime = 0;

    for (let i = 0; i < numNotes; i++) {
        const noteMidi = chordNotes[random.nextInt(chordNotes.length)] + 12 * 3;
        const duration = 4.0 / numNotes;
        
        axiom.push({
            type: 'harmony', note: noteMidi, duration: duration, time: currentTime,
            weight: 0.5 + random.next() * 0.15, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 2.0, release: 3.0 }
        });

        currentTime += duration;
    }

    return axiom;
}

export function createDrumAxiom(kit: DrumKit, genre: Genre, mood: Mood, tempo: number, random: { next: () => number, nextInt: (max: number) => number }, rules?: InstrumentBehaviorRules): { events: FractalEvent[], tags: string[] } {
    const grammar = DRUM_KITS[genre] || DRUM_KITS['ambient'];
    if (!grammar || !BLUES_DRUM_RIFFS[mood] || BLUES_DRUM_RIFFS[mood]!.length === 0) return { events: [], tags: [] };
    
    const loop = BLUES_DRUM_RIFFS[mood]![random.nextInt(BLUES_DRUM_RIFFS[mood]!.length)];
    const axiomEvents: FractalEvent[] = [];
    if (!loop) return { events: [], tags: [] };

    const allBaseEvents = [...(loop.K || []).map(t => ({type: 'drum_kick', time:t})), ...(loop.SD || []).map(t => ({type: 'drum_snare', time:t})), ...(loop.HH || []).map(t => ({type: 'drum_hihat_closed', time:t}))];
    
    for (const baseEvent of allBaseEvents) {
        // @ts-ignore
        if (baseEvent.probability && random.next() > baseEvent.probability) continue;
        
        let samplePool: InstrumentType[] = [];
        // @ts-ignore
        const originalType = Array.isArray(baseEvent.type) ? baseEvent.type[0] : baseEvent.type;

        if (originalType.startsWith('drum_kick')) samplePool = kit.kick;
        else if (originalType.startsWith('drum_snare')) samplePool = kit.snare;
        else if (originalType.startsWith('drum_hihat')) samplePool = kit.hihat;
        else if (originalType.startsWith('drum_a_ride') || originalType.startsWith('drum_ride')) samplePool = kit.ride;
        else if (originalType.startsWith('drum_crash')) samplePool = kit.crash;
        else if (originalType.startsWith('perc') || originalType.startsWith('drum_tom')) samplePool = kit.perc;

        if (samplePool.length > 0) {
            const chosenType = samplePool[random.nextInt(samplePool.length)];
            // @ts-ignore
            axiomEvents.push({ ...baseEvent, type: chosenType, note: 36, phrasing: 'staccato', dynamics: 'mf', params: {}, duration: 0.25, weight: 0.8 } as FractalEvent);
        } else {
             if (originalType !== 'drum_ride') { 
                console.warn(`[createDrumAxiom] No samples in kit for type category: ${originalType}`);
            }
        }
    }
    
    return { events: axiomEvents, tags: [] };
}

export function createSfxScenario(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { drumFill: FractalEvent[], bassFill: FractalEvent[], accompanimentFill: FractalEvent[] } {
    const drumFill: FractalEvent[] = []; const bassFill: FractalEvent[] = []; const accompanimentFill: FractalEvent[] = [];
    const scale = getScaleForMood(mood, genre);
    const rootNote = scale[random.nextInt(Math.floor(scale.length / 2))]; 
    const isMinor = mood === 'melancholic' || mood === 'dark';
    const third = rootNote + (isMinor ? 3 : 4);
    const fifth = rootNote + 7;
    const chord = [rootNote, third, fifth].filter(n => scale.some(sn => sn % 12 === n % 12));
    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };
    const fillDensity = random.nextInt(4) + 3;
    let fillTime = 3.0; 
    for(let i = 0; i < fillDensity; i++) {
        const duration = (1.0 / fillDensity) * (0.8 + random.next() * 0.4); 
        const currentTime = fillTime;
        const drumInstruments: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_snare'];
        const drumInstrument = drumInstruments[random.nextInt(drumInstruments.length)];
        drumFill.push({ type: drumInstrument, note: 40 + i, duration, time: currentTime, weight: 0.7 + random.next() * 0.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: {} });
        if (random.next() > 0.3) {
             bassFill.push({ type: 'bass', note: chord[random.nextInt(chord.length)], duration: duration * 0.9, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'mf', phrasing: 'staccato', params: fillParams });
        }
        fillTime += duration;
    }
    const climaxTime = Math.min(3.75, fillTime);
    drumFill.push({ type: 'drum_crash', note: 49, duration: 1, time: climaxTime, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'legato', params: {} });
    if (random.next() > 0.2) {
      bassFill.push({ type: 'bass', note: rootNote, duration: 0.5, time: climaxTime, weight: 1.0, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
    }
    return { drumFill, bassFill, accompanimentFill };
}

function extractTopNotes(events: FractalEvent[], maxNotes: number = 4): FractalEvent[] {
    if (events.length === 0) return [];
    const timeTolerance = 0.1; 
    const groupedByTime: Map<number, FractalEvent[]> = new Map();
    for (const event of events) {
        let foundGroup = false;
        for (const time of groupedByTime.keys()) {
            if (Math.abs(time - event.time) < timeTolerance) {
                groupedByTime.get(time)!.push(event);
                foundGroup = true;
                break;
            }
        }
        if (!foundGroup) { groupedByTime.set(event.time, [event]); }
    }
    const topNotes: FractalEvent[] = [];
    for (const group of groupedByTime.values()) {
        const topNote = group.reduce((max, current) => (current.note > max.note ? current : max));
        topNotes.push(topNote);
    }
    return topNotes.sort((a, b) => a.time - b.time).slice(0, maxNotes);
}

export function createMelodyMotif(chord: GhostChord, mood: Mood, random: { next: () => number; nextInt: (max: number) => number; }, previousMotif?: FractalEvent[], registerHint?: 'low' | 'mid' | 'high', genre?: Genre): FractalEvent[] {
    const motif: FractalEvent[] = [];
    if (previousMotif && previousMotif.length > 0 && random.next() < 0.7) {
        return mutateBluesMelody(previousMotif, chord, [], random);
    }
    const scale = getScaleForMood(mood, genre);
    let baseOctave = 4;
    if (registerHint === 'high') baseOctave = 5;
    if (registerHint === 'low') baseOctave = 3;
    const rootNote = chord.rootNote + 12 * baseOctave;
    const rhythmicPatterns = [[4, 4, 4, 4], [3, 1, 3, 1, 4, 4], [2, 2, 2, 2, 2, 2, 2, 2], [8, 8], [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], [4, 2, 2, 4, 4]];
    const durations = rhythmicPatterns[random.nextInt(rhythmicPatterns.length)];
    const contours = [ [0, 2, 1, 3, 4, 1, 0], [0, 1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1, 0], [0, 5, -2, 7, 3, 6, 1] ];
    const contour = contours[random.nextInt(contours.length)];
    let currentTime = 0;
    const baseNoteIndex = scale.findIndex(n => n % 12 === rootNote % 12);
    if (baseNoteIndex === -1) return [];
    for (let i = 0; i < durations.length; i++) {
        const contourIndex = i % contour.length;
        const noteIndex = (baseNoteIndex + (contour[contourIndex] || 0) + scale.length) % scale.length;
        const note = scale[noteIndex];
        motif.push({
            type: 'melody', note: note, duration: durations[i], time: currentTime,
            weight: 0.65 + random.next() * 0.1, technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
        });
        currentTime += durations[i];
    }
    return motif;
}

export function generateIntroSequence(options: { 
    currentBar: number; 
    activeInstruments: Set<InstrumentPart>;
    instrumentHints: InstrumentHints;
    harmonyTrack: GhostChord[]; 
    settings: any; 
    random: { next: () => number, nextInt: (max: number) => number }; 
}): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    const { currentBar, activeInstruments, instrumentHints, harmonyTrack, settings, random } = options;
    const events: FractalEvent[] = [];

    const currentChord = harmonyTrack.find(c => currentBar >= c.bar && currentBar < c.bar + c.durationBars);
    if (!currentChord) {
        return { events, instrumentHints };
    }
    
    // --- Генерация аккомпанемента с учетом "хинта" ---
    if (activeInstruments.has('accompaniment') && instrumentHints.accompaniment !== 'none') {
        const baseOctave = 3;
        const isMinor = currentChord.chordType === 'minor' || currentChord.chordType === 'diminished';
        const chordNotes = [currentChord.rootNote, currentChord.rootNote + (isMinor ? 3 : 4), currentChord.rootNote + 7];
        const duration = 0.5;
        const times = [0, 1.5, 2.5, 3.5];
        times.forEach(time => {
            if (random.next() < 0.7) { 
                const note = chordNotes[random.nextInt(chordNotes.length)];
                events.push({
                    type: 'accompaniment',
                    note: note + 12 * baseOctave,
                    duration,
                    time,
                    weight: 0.4 + random.next() * 0.2,
                    technique: 'arpeggio-fast',
                    dynamics: 'p',
                    phrasing: 'staccato',
                    params: {}
                });
            }
        });
    }

    if(activeInstruments.has('bass')) {
        events.push(...createAmbientBassAxiom(currentChord, settings.mood, settings.genre, random, settings.tempo, 'drone'));
    }

    if(activeInstruments.has('drums')) {
        const kit = DRUM_KITS[settings.genre]?.intro ?? DRUM_KITS.ambient!.intro!;
        events.push(...createDrumAxiom(kit, settings.genre, settings.mood, settings.tempo, random, { density: {min: 0.1, max: 0.3} }).events);
    }
    
    // ... другие инструменты по аналогии
    
    return { events, instrumentHints };
}


export function chooseHarmonyInstrument(rules: InstrumentationRules<'piano' | 'guitarChords' | 'acousticGuitarSolo' | 'flute' | 'violin'>, random: { next: () => number }): NonNullable<InstrumentHints['harmony']> {
    const options = rules.options;
    if (!options || options.length === 0) return 'guitarChords';
    const totalWeight = options.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) return options[0].name;
    let rand = random.next() * totalWeight;
    for (const item of options) {
        rand -= item.weight;
        if (rand <= 0) return item.name;
    }
    return options[options.length - 1].name;
}

export function generateGhostHarmonyTrack(totalBars: number, mood: Mood, key: number, random: { next: () => number; nextInt: (max: number) => number; }, genre: Genre): GhostChord[] {
    console.log(`[Harmony] Generating Ghost Harmony for ${totalBars} bars in key ${key}, genre ${genre}.`);
    const harmonyTrack: GhostChord[] = [];
    if (genre === 'blues') {
        const I = key; const IV = key + 5; const V = key + 7;
        let currentBar = 0;
        while (currentBar < totalBars) {
            const structure = [
                { root: I,  duration: 4, step: 'I' }, { root: IV, duration: 2, step: 'IV' },
                { root: I,  duration: 2, step: 'I' }, { root: V,  duration: 1, step: 'V' },
                { root: IV, duration: 1, step: 'IV' }, { root: I,  duration: 1, step: 'I' },
                { root: V,  duration: 1, step: 'V' },
            ];
            for (const segment of structure) {
                if (currentBar >= totalBars) break;
                const duration = Math.min(segment.duration, totalBars - currentBar);
                if (duration <= 0) continue;
                harmonyTrack.push({ rootNote: segment.root, chordType: 'dominant', bar: currentBar, durationBars: duration });
                currentBar += duration;
            }
        }
    } else {
        const scale = getScaleForMood(mood, genre);
        const I = scale[0]; const IV = scale[3]; const V = scale[4]; const VI = scale[5];
        const progression = [I, VI, IV, V]; 
        const chordTypes: GhostChord['chordType'][] = ['minor', 'major', 'major', 'minor'];
        let currentBar = 0;
        while (currentBar < totalBars) {
            const progressionIndex = Math.floor(currentBar / 4) % progression.length;
            const rootNote = progression[progressionIndex];
            const duration = 4;
            if (rootNote === undefined) { currentBar += duration; continue; }
            harmonyTrack.push({ rootNote: rootNote, chordType: chordTypes[progressionIndex], bar: currentBar, durationBars: duration });
            currentBar += duration;
        }
    }
    return harmonyTrack;
}

export function createBassFill(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { events: FractalEvent[], penalty: number } {
    return { events: [], penalty: 0 };
}

export function createDrumFill(random: { next: () => number, nextInt: (max: number) => number }, params: any = {}): FractalEvent[] {
    return [];
}

export function generateBluesBassRiff(chord: GhostChord, technique: Technique, random: { next: () => number, nextInt: (max: number) => number }, mood: Mood): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const root = chord.rootNote;
    const barDurationInBeats = 4.0;
    const ticksPerBeat = 3;
    
    // Fallback to a neutral riff if the mood-specific one is not found
    const riffCollection = BLUES_BASS_RIFFS[mood] ?? BLUES_BASS_RIFFS['contemplative'];
    if (!riffCollection || riffCollection.length === 0) return [];
    
    const riffTemplate = riffCollection[random.nextInt(riffCollection.length)];

    const barInChorus = 0; // Simplified for axiom generation
    const rootOfChorus = root;
    const step = (root - rootOfChorus + 12) % 12;
    
    let patternSource: 'I' | 'IV' | 'V' | 'turn' = 'I';
    if (barInChorus === 11) {
        patternSource = 'turn';
    } else if (step === 5 || step === 4) {
        patternSource = 'IV';
    } else if (step === 7) {
        patternSource = 'V';
    }

    const pattern = riffTemplate[patternSource];

    for (const riffNote of pattern) {
        phrase.push({
            type: 'bass',
            note: root + (DEGREE_TO_SEMITONE[riffNote.deg as BluesRiffDegree] || 0),
            time: riffNote.t / ticksPerBeat,
            duration: (riffNote.d || 2) / ticksPerBeat,
            weight: 0.85 + random.next() * 0.1,
            technique: 'pluck',
            dynamics: 'mf',
            phrasing: 'legato',
            params: { cutoff: 800, resonance: 0.7, distortion: 0.15, portamento: 0.0 }
        });
    }
    return phrase;
}

export function mutateBluesAccompaniment(phrase: FractalEvent[], chord: GhostChord, drumEvents: FractalEvent[], random: { next: () => number }): FractalEvent[] {
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    if (newPhrase.length === 0) return [];
    
    // Mutation 1: Sync with Kick
    if (random.next() < 0.4 && drumEvents.some(isKick)) {
        const kickTime = drumEvents.find(isKick)!.time;
        newPhrase.forEach(e => e.time = kickTime);
        console.log(`%c[AccompMutation] Synced with kick`, 'color: #90EE90');
    }

    // Mutation 2: Change Voicing
    if (random.next() < 0.3) {
        const isMinor = chord.chordType.includes('minor');
        const root = newPhrase[0].note;
        newPhrase.forEach(e => {
            const interval = e.note - root;
            if (interval === (isMinor ? 3 : 4)) e.note += 12; // Invert third up
        });
         console.log(`%c[AccompMutation] Voicing changed`, 'color: #90EE90');
    }
    
    return newPhrase;
}

export function mutateBluesMelody(phrase: FractalEvent[], chord: GhostChord, drumEvents: FractalEvent[], random: { next: () => number }): FractalEvent[] {
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    if (newPhrase.length === 0) return [];
    
    // Mutation 1: Add a grace note
    if (random.next() < 0.25) {
        const noteToDecorate = newPhrase[0];
        const graceNote: FractalEvent = { ...noteToDecorate, duration: 0.1, time: noteToDecorate.time - 0.1, note: noteToDecorate.note - 1, technique: 'gr' };
        newPhrase.unshift(graceNote);
        console.log(`%c[MelodyMutation] Added grace note`, 'color: #DA70D6');
    }

    // Mutation 2: Add a bend
    if (random.next() < 0.2) {
        const noteToBend = newPhrase[newPhrase.length - 1];
        noteToBend.technique = 'bn';
        console.log(`%c[MelodyMutation] Added bend`, 'color: #DA70D6');
    }

    return newPhrase;
}

/**
 * #ЗАЧЕМ: Эта функция создает короткую, осмысленную мелодическую фразу для органа в блюзовом стиле.
 * #ЧТО: Она использует минорную пентатонику с добавлением блюзовой ноты (b5) и генерирует
 *       короткий "ответ" на фразу солиста, имитируя диалог в джеме.
 * #СВЯЗИ: Вызывается из `generateBluesAccompanimentV2` для создания "ответных" фраз.
 */
export function createBluesOrganLick(
    chord: GhostChord,
    random: { next: () => number; nextInt: (max: number) => number; },
    isProvocative: boolean = false
): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const rootNote = chord.rootNote;
    const barDurationInBeats = 4;
    
    // --- Гармония: Строим "грязный" блюзовый аккорд (септаккорд) ---
    const isMinor = chord.chordType === 'minor';
    const third = rootNote + (isMinor ? 3 : 4);
    const fifth = rootNote + 7;
    const seventh = rootNote + 10; // b7
    const bluesNote = rootNote + 6; // b5

    const baseVoicing = [rootNote, third, fifth, seventh];
    const voicingWithBlueNote = [rootNote, third, bluesNote, seventh];

    const finalVoicing = random.next() < 0.3 ? voicingWithBlueNote : baseVoicing;

    // --- Ритм: "Comping" паттерны ---
    const patterns = [
        // "Charleston"
        [{ t: 0.0, d: 0.4 }, { t: 2.5, d: 1.5 }], 
        // Syncopated push
        [{ t: 1.5, d: 0.5 }, { t: 3.5, d: 0.5 }],
        // Classic "and-a-two"
        [{ t: 0.5, d: 0.5 }, { t: 1.0, d: 1.0 }],
        // Provocative fast run
        isProvocative ? [{ t: 0, d: 0.25 }, { t: 0.5, d: 0.25 }, { t: 1.0, d: 0.25 }, { t: 1.5, d: 0.25 }, { t: 2.0, d: 0.25 }, { t: 2.5, d: 0.25 }] : []
    ].filter(p => p.length > 0);
    
    const selectedPattern = patterns[random.nextInt(patterns.length)];

    // --- Сборка событий ---
    for (const hit of selectedPattern) {
        for(const note of finalVoicing) {
            phrase.push({
                type: 'accompaniment',
                note: note + 12 * 3, // В средний регистр
                time: hit.t,
                duration: hit.d * 0.9, // Чуть короче для "стаккато"
                weight: 0.6 + random.next() * 0.15,
                technique: 'swell',
                dynamics: 'mf',
                phrasing: 'staccato',
                params: {
                    attack: 0.01,
                    release: hit.d * 1.2 // небольшой "хвост"
                }
            });
        }
    }

    return phrase;
}

    
