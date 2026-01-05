

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, AccompanimentInstrument, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, IntroRules, InstrumentPart } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_MELODY_RIFFS, type BluesRiffDegree, type BluesRiffEvent, type BluesMelodyPhrase } from './assets/blues-melody-riffs';
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
    // --- ИСПРАВЛЕНИЕ: Гарантируем, что для блюза вызывается блюзовый генератор ---
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
            const noteToChange = newPhrase[random.nextInt(newPhrase.length)];
            noteToChange.duration *= (random.next() > 0.5 ? 1.5 : 0.66);
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
                // --- ИСПРАВЛЕНИЕ: Вызываем правильный генератор в зависимости от жанра ---
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
        const scaleFactor = (genre === 'blues' ? 8.0 : 4.0) / totalDuration;
        let runningTime = 0;
        newPhrase.forEach(e => {
            e.duration *= scaleFactor;
            e.time = runningTime;
            runningTime += e.duration;
        });
    }

    const resultNotes = newPhrase.map(e => e.note).join(' -> ');
    console.log(`%c[BassMutation] Type: ${mutationDescription} -> Result: ${resultNotes}`, 'color: #87CEEB');

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

  // Blues scales are often pentatonic or have specific "blue notes"
  if (genre === 'blues') {
      if (mood === 'dark' || mood === 'gloomy' || mood === 'melancholic' || mood === 'anxious') {
           // Minor Blues Scale: R, b3, 4, #4/b5, 5, b7
           baseScale = [0, 3, 5, 6, 7, 10];
      } else {
          // Major Blues Scale: R, 2, b3, 3, 5, 6
          baseScale = [0, 2, 3, 4, 7, 9];
      }
  } else {
      switch (mood) {
        case 'joyful':      // C Ionian (Major) - transposed to E
          baseScale = [0, 2, 4, 5, 7, 9, 11];
          break;
        case 'epic':        // E Lydian
        case 'enthusiastic':
          baseScale = [0, 2, 4, 6, 7, 9, 11];
          break;
        case 'dreamy':      // E Pentatonic Major
          baseScale = [0, 2, 4, 7, 9];
          break;
        case 'contemplative': // E Mixolydian
        case 'calm':
            baseScale = [0, 2, 4, 5, 7, 9, 10];
            break;
        case 'melancholic': // E Dorian
          baseScale = [0, 2, 3, 5, 7, 9, 10];
          break;
        case 'dark':        // E Aeolian (Natural Minor)
        case 'gloomy':
          baseScale = [0, 2, 3, 5, 7, 8, 10];
          break;
        case 'anxious':     // E Locrian
          baseScale = [0, 1, 3, 5, 6, 8, 10];
          break;
        default:            // Fallback to E Aeolian
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

export function generateBluesBassRiff(chord: GhostChord, technique: Technique, random: { next: () => number, nextInt: (max: number) => number }, mood: Mood): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const root = chord.rootNote;
    const barDurationInBeats = 4.0;
    const ticksPerBeat = 3;
    
    const moodRiffs = BLUES_BASS_RIFFS[mood];
    if (!moodRiffs || moodRiffs.length === 0) {
        console.warn(`[BluesBass] No bass riffs found for mood: ${mood}.`);
        return [];
    }
    
    const riffTemplate = moodRiffs[random.nextInt(moodRiffs.length)];

    // Определяем ступень аккорда
    const rootI = 0; // Simplified
    const step = (root - rootI + 12) % 12;
    const isTurnaround = false; // Simplified
    
    let pattern = riffTemplate.I; // Simplified to always use 'I' for now

    for (const riffNote of pattern) {
        phrase.push({
            type: 'bass',
            note: root + DEGREE_TO_SEMITONE[riffNote.deg],
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

export function createAmbientBassAxiom(currentChord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }, tempo: number, technique: Technique): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const scale = getScaleForMood(mood, genre);
    const rootNote = currentChord.rootNote;

    const numNotes = 4 + random.nextInt(5); // 4 to 8 notes over two bars
    let currentTime = 0;
    const totalDurationNormalizer = 8.0; // Two bars

    for (let i = 0; i < numNotes; i++) {
        const duration = totalDurationNormalizer / numNotes;
        
        let note = rootNote;
        if (i > 0 && random.next() > 0.4) {
            const isMinor = currentChord.chordType === 'minor' || currentChord.chordType === 'diminished';
            const possibleNotes = [
                rootNote,
                rootNote + 7, // 5th
                rootNote + (isMinor ? 3 : 4) // 3rd
            ].filter(n => scale.some(scaleNote => scaleNote % 12 === n % 12));
            note = possibleNotes[random.nextInt(possibleNotes.length)] || rootNote;
        }

        phrase.push({
            type: 'bass',
            note: note,
            duration: duration,
            time: currentTime,
            weight: 0.7 + random.next() * 0.3,
            technique: 'swell',
            dynamics: 'mf',
            phrasing: 'legato',
            params: { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: duration * 0.5, release: duration * 1.5 }
        });
        
        currentTime += duration;
    }

    // Глобальное повышение октавы
    phrase.forEach(event => {
        event.note += 12; // Транспонируем на одну октаву вверх
    });
    
    const phraseNotes = phrase.map(e => e.note).join(' -> ');
    console.log(`%c[BassAxiom] New ambient phrase generated: ${phraseNotes}`, 'color: #98FB98');
    
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

    const duration = 4.0; // Play the chord for the whole bar

    chordNotes.forEach((note, index) => {
        axiom.push({
            type: 'accompaniment',
            note: note + 12 * baseOctave,
            duration: duration,
            time: 0, // All notes start at the same time
            weight: 0.6 - (index * 0.05),
            technique: 'long-chords',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 0.5, release: duration }
        });
    });

    return axiom;
}

export function createHarmonyAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number }): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const scale = getScaleForMood(mood, genre);
    const rootMidi = chord.rootNote;
    
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const third = rootMidi + (isMinor ? 3 : 4);
    const fifth = rootMidi + 7;

    const chordNotes = [rootMidi, third, fifth].filter(n => scale.some(scaleNote => scaleNote % 12 === n % 12));
    if (chordNotes.length < 2) return [];
    
    const numNotes = 2 + random.nextInt(2); // 2 or 3 notes for harmony
    let currentTime = 0;

    for (let i = 0; i < numNotes; i++) {
        const noteMidi = chordNotes[random.nextInt(chordNotes.length)] + 12 * 3; // Play in 3rd octave
        const duration = 4.0 / numNotes;
        
        axiom.push({
            type: 'harmony', // Correct type
            note: noteMidi,
            duration: duration,
            time: currentTime,
            weight: 0.5 + random.next() * 0.15, // Lower weight for harmony
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.0, release: 3.0 }
        });

        currentTime += duration;
    }

    return axiom;
}


// Rhythmic Grammar Library for Drums
export const STYLE_DRUM_PATTERNS: Record<Genre, any> = {
    ambient: {
        loops: [
            { 
                kick: [{ type: 'drum_kick', time: 0, duration: 4, weight: 0.5, probability: 0.1 }],
                snare: [],
                hihat: [
                    { type: ALL_RIDES, probabilities: [0.3, 0.3, 0.2, 0.2], time: 0, duration: 1, weight: 0.35, probability: 0.9 },
                    { type: AMBIENT_PERC, time: 1.5, duration: 0.5, weight: 0.4, probability: 0.5 },
                    { type: 'drum_tom_low', time: 2.25, duration: 0.25, weight: 0.2, probability: 0.3 },
                    { type: 'drum_closed_hi_hat_ghost', time: 2.75, duration: 0.25, weight: 0.2, probability: 0.6 },
                    { type: 'drum_a_ride2', time: 3.5, duration: 0.25, weight: 0.3, probability: 0.7 }
                ],
                tags: ['ambient-pulse-varied']
            },
            {
                kick: [],
                snare: [],
                hihat: [
                    { type: 'drum_a_ride1', time: 0.75, duration: 0.25, weight: 0.3, probability: 0.8 },
                    { type: 'drum_closed_hi_hat_ghost', time: 1.5, duration: 0.25, weight: 0.15, probability: 0.6 },
                    { type: 'drum_tom_low', time: 2.25, duration: 0.25, weight: 0.2, probability: 0.5 },
                    { type: 'drum_a_ride2', time: 3.5, duration: 0.25, weight: 0.35, probability: 0.8 }
                ],
                tags: ['ambient-sparse-syncopated']
            }
        ],
         percussion: {
            types: AMBIENT_PERC,
            allowedTimes: [0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75],
            probability: 0.9, 
            weight: 0.3,
            type: 'electronic'
        }
    },
    rock: {
        loops: [
            { 
                kick: [{ type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 }, { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 }],
                snare: [{ type: 'drum_snare', time: 1, duration: 0.25, weight: 1.0 }, { type: ['drum_snare', 'drum_snare_ghost_note'], probabilities: [0.8, 0.2], time: 3, duration: 0.25, weight: 1.0 }],
                hihat: [
                    { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.6 },
                    { type: 'drum_hihat_closed', time: 1.5, duration: 0.5, weight: 0.6 },
                    { type: 'drum_hihat_closed', time: 2.5, duration: 0.5, weight: 0.6 },
                    { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.6 },
                ],
                tags: ['rock-standard']
            }
        ],
    },
    house: {
        loops: [
            { 
                kick: [
                    { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 1, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 3, duration: 0.25, weight: 1.0 },
                ],
                snare: [
                    { type: ['drum_snare', 'perc-004'], probabilities: [0.9, 0.1], time: 1, duration: 0.25, weight: 0.9 },
                    { type: ['drum_snare', 'perc-004'], probabilities: [0.9, 0.1], time: 3, duration: 0.25, weight: 0.9 },
                ],
                hihat: [
                    { type: 'drum_hihat_open', time: 0.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_open', time: 1.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_open', time: 2.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_open', time: 3.5, duration: 0.5, weight: 0.8 },
                ],
                tags: ['four-on-the-floor']
            }
        ],
    },
    trance: {
        loops: [
             {
                kick: [
                    { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 1, duration: 0.25, weight: 0.8, probability: 0.75 },
                    { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 3, duration: 0.25, weight: 0.8, probability: 0.75 },
                ],
                snare: [
                    { type: ['drum_snare', 'perc-009'], probabilities: [0.8, 0.2], time: 2, duration: 0.25, weight: 0.9, probability: 0.5 }, // Snare on 3rd beat
                ],
                hihat: [
                    { type: 'drum_hihat_open', time: 0.5, duration: 0.25, weight: 0.7 },
                    { type: 'drum_hihat_open', time: 1.5, duration: 0.25, weight: 0.7 },
                    { type: 'drum_hihat_open', time: 2.5, duration: 0.25, weight: 0.7 },
                    { type: 'drum_hihat_open', time: 3.5, duration: 0.25, weight: 0.7 },
                ],
                tags: ['trance-drive']
             }
        ],
    },
    rnb: {
        loops: [
            { 
                kick: [
                    { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 1.75, duration: 0.25, weight: 0.8, probability: 0.8 },
                ],
                snare: [
                    { type: ['drum_snare', 'drum_snare_ghost_note'], probabilities: [0.8, 0.2], time: 1, duration: 0.25, weight: 0.9 },
                    { type: 'drum_snare', time: 3, duration: 0.25, weight: 1.0 },
                ],
                hihat: [
                    { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.6},
                    { type: ['drum_hihat_closed', 'hh_bark_short'], probabilities: [0.85, 0.15], time: 2.5, duration: 0.5, weight: 0.6},
                    { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.6, probability: 0.7 },
                ],
                tags: ['rnb-groove', 'hip-hop']
            }
        ],
    },
    ballad: {
       loops: [
           {
                kick: [{ type: 'drum_kick', time: 0, duration: 1, weight: 0.8, probability: 0.9 }],
                snare: [{ type: 'drum_snare', time: 2, duration: 1, weight: 0.7, probability: 0.9 }],
                hihat: [
                     { type: 'drum_ride', time: 0, duration: 0.5, weight: 0.5, probability: 0.8 },
                     { type: 'drum_ride', time: 1, duration: 0.5, weight: 0.5, probability: 0.8 },
                     { type: 'drum_ride', time: 2, duration: 0.5, weight: 0.5, probability: 0.8 },
                     { type: 'drum_ride', time: 3, duration: 0.5, weight: 0.5, probability: 0.8 },
                ],
                tags: ['ballad-simple']
           }
       ],
    },
    blues: {
        loops: [
            {
                kick: [{ type: 'drum_kick', time: 0, duration: 0.25, weight: 0.9, probability: 1.0 }, { type: 'drum_kick', time: 2, duration: 0.25, weight: 0.8, probability: 0.8 }],
                snare: [{ type: 'drum_snare', time: 1, duration: 0.25, weight: 1.0 }, { type: 'drum_snare_ghost_note', time: 2.66, duration: 0.25, weight: 0.4, probability: 0.6 }, { type: 'drum_snare', time: 3, duration: 0.25, weight: 0.9 }],
                hihat: [
                    { type: 'drum_hihat_closed', time: 0, duration: 0.25, weight: 0.7 }, { type: 'drum_hihat_closed', time: 0.66, duration: 0.25, weight: 0.5 }, { type: 'drum_hihat_closed', time: 1, duration: 0.25, weight: 0.7 }, { type: 'drum_hihat_closed', time: 1.66, duration: 0.25, weight: 0.5 },
                    { type: 'drum_hihat_closed', time: 2, duration: 0.25, weight: 0.7 }, { type: 'drum_hihat_closed', time: 2.66, duration: 0.25, weight: 0.5 }, { type: 'drum_hihat_closed', time: 3, duration: 0.25, weight: 0.7 }, { type: 'drum_hihat_closed', time: 3.66, duration: 0.25, weight: 0.5 },
                ],
                tags: ['slow-shuffle']
            },
            {
                kick: [{ type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 }, { type: 'drum_kick', time: 1, duration: 0.25, weight: 0.8, probability: 0.5 }, { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 }, { type: 'drum_kick', time: 3, duration: 0.25, weight: 0.8, probability: 0.5 }],
                snare: [{ type: 'drum_snare', time: 1, duration: 0.25, weight: 1.0 }, { type: 'drum_snare', time: 3, duration: 0.25, weight: 1.0 }],
                hihat: [{ type: 'drum_ride', time: 0, duration: 1, weight: 0.7 }, { type: 'drum_ride', time: 1, duration: 1, weight: 0.7 }, { type: 'drum_ride', time: 2, duration: 1, weight: 0.7 }, { type: 'drum_ride', time: 3, duration: 1, weight: 0.7 }],
                tags: ['mid-tempo-groove']
            }
        ],
    },
    celtic: {
        loops: [ { kick: [], snare: [], hihat: [], tags: ['bodhran-pulse'] } ],
    },
    progressive: {
        loops: [
            {
                kick: [{ type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 }],
                snare: [{ type: ['drum_snare', 'drum_snare_off'], probabilities: [0.9, 0.1], time: 1, duration: 0.25, weight: 1.0 }, { type: 'drum_snare', time: 3, duration: 0.25, weight: 1.0 }],
                hihat: [],
                tags: ['prog-rock-sparse']
            }
        ],
    },
};

export const TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD: Record<Mood, Record<Exclude<AccompanimentInstrument, 'violin' | 'flute' | 'mellotron_choir_dark' >, number>> = {
  epic:          { organ: 0.4, mellotron: 0.4, synth: 0.2, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  joyful:        { organ: 0.3, synth: 0.2, mellotron: 0.2, piano: 0.3, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  enthusiastic:  { synth: 0.5, organ: 0.4, electricGuitar: 0.1, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, mellotron: 0.0, 'theremin': 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  melancholic:   { organ: 0.4, synth: 0.1, piano: 0.2, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.3, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dark:          { organ: 0.8, theremin: 0.2, synth: 0.0, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  anxious:       { synth: 0.5, theremin: 0.3, organ: 0.2, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dreamy:        { synth: 0.3, organ: 0.2, piano: 0.3, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.2, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  contemplative: { organ: 0.4, synth: 0.2, piano: 0.4, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  calm:          { synth: 0.3, organ: 0.2, piano: 0.5, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
};

export const AMBIENT_ACCOMPANIMENT_WEIGHTS: Record<Mood, Record<Exclude<AccompanimentInstrument, 'violin' | 'flute' | 'mellotron_choir_dark'>, number>> = {
  epic:          { organ: 0.4, mellotron: 0.4, synth: 0.2, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  joyful:        { organ: 0.3, synth: 0.2, mellotron: 0.2, piano: 0.3, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  enthusiastic:  { synth: 0.5, organ: 0.4, theremin: 0.1, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, mellotron: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  melancholic:   { mellotron: 0.4, organ: 0.3, synth: 0.1, piano: 0.2, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dark:          { organ: 0.5, theremin: 0.2, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, synth: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'mellotron': 0.3, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  anxious:       { synth: 0.5, theremin: 0.3, organ: 0.2, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, mellotron: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dreamy:        { synth: 0.3, mellotron: 0.2, organ: 0.2, piano: 0.3, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  contemplative: { organ: 0.4, synth: 0.2, piano: 0.4, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'mellotron': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  calm:          { synth: 0.3, organ: 0.2, piano: 0.5, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'mellotron': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
};

export function getAccompanimentTechnique(genre: Genre, mood: Mood, density: number, tempo: number, barCount: number, random: { next: () => number }): AccompanimentTechnique {
    if (barCount < 4) {
        if (random.next() < 0.7) return 'long-chords';
        return 'choral';
    }

    const rand = random.next();
    const isHighEnergyGenre = ['trance', 'house', 'progressive', 'rock'].includes(genre);
    const isLowEnergyGenre = ['ambient', 'ballad', 'celtic'].includes(genre);
    
    const activityPressure = (density * 0.7) + (tempo / 160 * 0.3);

    if (activityPressure > 0.65 && isHighEnergyGenre) {
        if (rand < 0.7) return 'arpeggio-fast';
        if (rand < 0.9) return 'chord-pulsation';
        return 'alberti-bass';
    }
    
    if (activityPressure > 0.4) {
        if (genre === 'ambient') {
            if (rand < 0.6) return 'alberti-bass';
            return 'paired-notes';
        }
        
        if (rand < 0.5) return 'alberti-bass';
        if (rand < 0.8) return 'chord-pulsation';
        return 'paired-notes';
    }

    if (isLowEnergyGenre || activityPressure <= 0.4) {
        if (rand < 0.6) return 'long-chords';
        if (rand < 0.9) return 'choral';
        return 'paired-notes';
    }
    
    return 'choral';
}


export function createBassFill(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { events: FractalEvent[], penalty: number } {
    const fill: FractalEvent[] = [];
    const scale = getScaleForMood(mood, genre);
    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };
    const numHits = random.nextInt(4) + 7; // 7 to 10 notes
    let currentTime = 0;
    
    const selectNote = (): number => {
      const rand = random.next();
      if (rand < 0.75) { // 75% chance low register
          const third = Math.floor(scale.length / 3);
          return scale[random.nextInt(third)];
      } else { // 25% chance mid register
          const third = Math.floor(scale.length / 3);
          return scale[third + random.nextInt(third)];
      }
    };

    let currentNote = selectNote();
    let lastNote = -1;
    let secondLastNote = -1;

    for (let i = 0; i < numHits; i++) {
        const duration = (genre === 'rock' || genre === 'trance' || genre === 'progressive') ? 0.25 : 0.5;
        
        let noteIndex = scale.indexOf(currentNote);
        let step;
        let attempts = 0;

        do {
            step = random.next() > 0.7 ? (random.next() > 0.5 ? 2 : -2) : (random.next() > 0.5 ? 1 : -1);
            let newNoteIndex = (noteIndex + step + scale.length) % scale.length;
            if (Math.abs(scale[newNoteIndex] - currentNote) > 12) {
                 newNoteIndex = (noteIndex - step + scale.length) % scale.length;
            }
            currentNote = scale[newNoteIndex];
            noteIndex = newNoteIndex;
            attempts++;
        } while(currentNote === lastNote && currentNote === secondLastNote && attempts < 10);
        

        fill.push({
            type: 'bass', note: currentNote, duration: duration, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams
        });
        currentTime += duration;
        secondLastNote = lastNote;
        lastNote = currentNote;
    }
    
    if (currentTime > 4.0) {
        const scaleFactor = 4.0 / currentTime;
        fill.forEach(e => {
            e.time *= scaleFactor;
            e.duration *= scaleFactor;
        });
    }
    
    const highNoteThreshold = 52; // E3
    const hasHighNotes = fill.some(n => n.note > highNoteThreshold);
    const penalty = hasHighNotes ? 0.8 : 0; // 80% penalty if high notes are present

    if (hasHighNotes) {
        console.warn(`[BassFillPenalty] High-register fill detected. Applying penalty.`);
    }

    return { events: fill, penalty };
}

export function createDrumFill(random: { next: () => number, nextInt: (max: number) => number }, params: any = {}): FractalEvent[] {
    const { instrument = 'tom', density = 0.5, dynamics = 'mf' } = params;
    const fill: FractalEvent[] = [];
    
    const fillInstruments: InstrumentType[] = instrument === 'brush'
        ? ['drum_brush1', 'drum_brush2', 'drum_brush3', 'drum_brush4']
        : ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_snare'];


    const numHits = Math.floor(2 + (density * 6)); // 2 to 8 hits
    let currentTime = 3.0; // Start the fill on the 4th beat
    const weightMap = { 'pp': 0.4, 'p': 0.5, 'mp': 0.6, 'mf': 0.75, 'f': 0.9, 'ff': 1.0 };
    const baseWeight = weightMap[dynamics as keyof typeof weightMap] || 0.75;

    for (let i = 0; i < numHits; i++) {
        const tom = fillInstruments[random.nextInt(fillInstruments.length)];
        const duration = (1.0 / numHits) * (0.8 + random.next() * 0.4);
        const time = currentTime + i * duration;
        
        fill.push({
            type: tom, note: 40 + i, duration, time,
            weight: baseWeight + (random.next() * 0.1) - 0.05,
            technique: 'hit', dynamics: dynamics, phrasing: 'staccato', params: {}
        });
    }

    return fill;
}

export function chooseHarmonyInstrument(rules: InstrumentationRules<'piano' | 'guitarChords' | 'acousticGuitarSolo' | 'flute' | 'violin'>, random: { next: () => number }): NonNullable<InstrumentHints['harmony']> {
    // #ЗАЧЕМ: Эта функция инкапсулирует логику выбора инструмента для гармонии.
    // #ЧТО: Она принимает правила из блюпринта и, используя взвешенный случайный выбор,
    //      возвращает название инструмента ('guitarChords', 'violin' и т.д.).
    // #СВЯЗИ: Вызывается из FractalMusicEngine, чтобы определить, какой инструмент
    //          будет играть гармоническую партию в данном такте.

    const options = rules.options;
    if (!options || options.length === 0) {
        console.warn('[chooseHarmonyInstrument] No options provided, defaulting to guitarChords.');
        return 'guitarChords'; // Fallback
    }
    
    const totalWeight = options.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) {
         console.warn('[chooseHarmonyInstrument] Total weight is zero, returning first option.');
        return options[0].name;
    }

    let rand = random.next() * totalWeight;

    for (const item of options) {
        rand -= item.weight;
        if (rand <= 0) {
            return item.name;
        }
    }

    // Fallback just in case, though it should not be reached with correct weights
    return options[options.length - 1].name;
}


export function generateGhostHarmonyTrack(totalBars: number, mood: Mood, key: number, random: { next: () => number; nextInt: (max: number) => number; }, genre: Genre): GhostChord[] {
    console.log(`[Harmony] Generating Ghost Harmony for ${totalBars} bars in key ${key}, genre ${genre}.`);
    
    const harmonyTrack: GhostChord[] = [];
    
    if (genre === 'blues') {
        const I = key;
        const IV = key + 5;
        const V = key + 7;
        
        let currentBar = 0;
        while (currentBar < totalBars) {
            const structure = [
                { root: I,  duration: 4, step: 'I' },
                { root: IV, duration: 2, step: 'IV' },
                { root: I,  duration: 2, step: 'I' },
                { root: V,  duration: 1, step: 'V' },
                { root: IV, duration: 1, step: 'IV' },
                { root: I,  duration: 1, step: 'I' },
                { root: V,  duration: 1, step: 'V' }, // Turnaround
            ];

            for (const segment of structure) {
                if (currentBar >= totalBars) break;
                
                const chordType: GhostChord['chordType'] = 'dominant';

                const duration = Math.min(segment.duration, totalBars - currentBar);
                if (duration <= 0) continue;

                harmonyTrack.push({
                    rootNote: segment.root,
                    chordType: chordType,
                    bar: currentBar,
                    durationBars: duration,
                });
                currentBar += duration;
            }
        }
        console.log(`[Harmony] 12-Bar Blues Ghost Harmony generated. ${harmonyTrack.length} chords.`);

    } else { // Ambient/Trance/etc. logic
        const scale = getScaleForMood(mood, genre);
        const I = scale[0];
        const IV = scale[3];
        const V = scale[4];
        const VI = scale[5];

        const progression = [I, VI, IV, V]; 
        const chordTypes: GhostChord['chordType'][] = ['minor', 'major', 'major', 'minor']; // Example for minor mood

        let currentBar = 0;
        while (currentBar < totalBars) {
            const progressionIndex = Math.floor(currentBar / 4) % progression.length;
            const rootNote = progression[progressionIndex];
            const duration = 4;

            if (rootNote === undefined) {
                console.error(`[Harmony] Error: Could not determine root note for chord at bar ${currentBar}. Skipping.`);
                currentBar += duration;
                continue;
            }

            harmonyTrack.push({
                rootNote: rootNote,
                chordType: chordTypes[progressionIndex], // Simplified
                bar: currentBar,
                durationBars: duration,
            });

            currentBar += duration;
        }
        console.log(`[Harmony] Modal Ambient Ghost Harmony generated. ${harmonyTrack.length} chords.`);
    }

    return harmonyTrack;
}
    
export function createDrumAxiom(genre: Genre, mood: Mood, tempo: number, random: { next: () => number, nextInt: (max: number) => number }, rules?: InstrumentBehaviorRules): { events: FractalEvent[], tags: string[] } {
    const kitName = rules?.kitName || `${genre}_${mood}`.toLowerCase();
    const genreKits = DRUM_KITS[genre];
    const kit = (genreKits && (genreKits as any)[mood]) ? (genreKits as any)[mood] : (genreKits?.intro || DRUM_KITS.ambient!.intro!);

    console.log(`%c[DrumAxiom] Using Drum Kit: ${kitName} for mood: ${mood}`, 'color: #90EE90; font-weight: bold;');

    const grammar = STYLE_DRUM_PATTERNS[genre] || STYLE_DRUM_PATTERNS['ambient'];
    if (!grammar || !grammar.loops || grammar.loops.length === 0) return { events: [], tags: [] };
    
    const loop = grammar.loops[random.nextInt(grammar.loops.length)];
    const axiomEvents: FractalEvent[] = [];
    if (!loop) return { events: [], tags: [] };

    const allBaseEvents = [...(loop.kick || []), ...(loop.snare || []), ...(loop.hihat || [])];
    for (const baseEvent of allBaseEvents) {
        if (baseEvent.probability && random.next() > baseEvent.probability) continue;
        
        let types: InstrumentType[] | InstrumentType = Array.isArray(baseEvent.type) ? baseEvent.type : [baseEvent.type];
        let chosenType: InstrumentType;

        if (Array.isArray(types)) {
            const allowedTypes = types.filter(t => kit.kick.includes(t) || kit.snare.includes(t) || kit.hihat.includes(t));
            if (allowedTypes.length === 0) continue;
            chosenType = allowedTypes[random.nextInt(allowedTypes.length)];
        } else {
            chosenType = types;
        }
        
        axiomEvents.push({ ...baseEvent, type: chosenType, note: 36, phrasing: 'staccato', dynamics: 'mf', params: {} } as FractalEvent);
    }
    
    return { events: axiomEvents, tags: loop.tags };
}

export function createSfxScenario(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { drumFill: FractalEvent[], bassFill: FractalEvent[], accompanimentFill: FractalEvent[] } {
    const drumFill: FractalEvent[] = [];
    const bassFill: FractalEvent[] = [];
    const accompanimentFill: FractalEvent[] = [];
    
    const scale = getScaleForMood(mood, genre);
    const rootNote = scale[random.nextInt(Math.floor(scale.length / 2))]; // Select a root from the lower half of the scale
    const isMinor = mood === 'melancholic' || mood === 'dark';
    const third = rootNote + (isMinor ? 3 : 4);
    const fifth = rootNote + 7;
    const chord = [rootNote, third, fifth].filter(n => scale.some(sn => sn % 12 === n % 12));

    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };

    const fillDensity = random.nextInt(4) + 3; // 3 to 6 notes for the core rhythm
    let fillTime = 3.0; // Start the fill on the 4th beat

    for(let i = 0; i < fillDensity; i++) {
        const duration = (1.0 / fillDensity) * (0.8 + random.next() * 0.4); // slightly variable duration
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
        if (!foundGroup) {
            groupedByTime.set(event.time, [event]);
        }
    }

    const topNotes: FractalEvent[] = [];
    for (const group of groupedByTime.values()) {
        const topNote = group.reduce((max, current) => (current.note > max.note ? current : max));
        topNotes.push(topNote);
    }
    
    return topNotes
        .sort((a, b) => a.time - b.time)
        .slice(0, maxNotes);
}



export function createMelodyMotif(chord: GhostChord, mood: Mood, random: { next: () => number; nextInt: (max: number) => number; }, previousMotif?: FractalEvent[], registerHint?: 'low' | 'mid' | 'high', genre?: Genre): FractalEvent[] {
    const motif: FractalEvent[] = [];
    
    if (previousMotif && previousMotif.length > 0 && random.next() < 0.7) { // 70% шанс мутации
        const newPhrase = [...previousMotif];
        const mutationType = random.nextInt(4);
        let mutationDescription = "Unknown";

        switch(mutationType) {
            case 0:
                mutationDescription = "Retrograde";
                const times = newPhrase.map(e => e.time).sort((a, b) => b - a);
                const totalDur = newPhrase.reduce((sum, e) => sum + e.duration, 0);
                newPhrase.reverse().forEach((e, i) => { e.time = (totalDur - times[i]) - e.duration; });
                break;
            case 1:
                mutationDescription = "Register Shift";
                const octaveShift = (random.next() > 0.5) ? 12 : -12;
                newPhrase.forEach(e => e.note += octaveShift);
                break;
            case 2:
                const factor = random.next() > 0.5 ? 2.0 : 0.5;
                mutationDescription = `Rhythmic ${factor > 1 ? 'Expansion' : 'Compression'}`;
                newPhrase.forEach(e => { e.duration *= factor; e.time *= factor; });
                break;
            case 3:
                 mutationDescription = "Pitch Inversion";
                 const firstNote = newPhrase[0].note;
                 newPhrase.forEach(e => {
                     const interval = e.note - firstNote;
                     e.note = firstNote - interval;
                 });
                 break;
        }
        console.log(`%c[MelodyMutation] Applied Mutation: ${mutationDescription}`, 'color: #9ACD32');
        return newPhrase;
    }

    const scale = getScaleForMood(mood, genre);
    let baseOctave = 4;
    if (registerHint === 'high') baseOctave = 5;
    if (registerHint === 'low') baseOctave = 3;
    const rootNote = chord.rootNote + 12 * baseOctave;

    const rhythmicPatterns = [
        [4, 4, 4, 4],
        [3, 1, 3, 1, 4, 4],
        [2, 2, 2, 2, 2, 2, 2, 2],
        [8, 8],
        [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
        [4, 2, 2, 4, 4]
    ];
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
            type: 'melody', note: note,
            duration: durations[i],
            time: currentTime,
            weight: 0.65 + random.next() * 0.1,
            technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
        });
        currentTime += durations[i];
    }
    
    console.log(`%c[MelodyAxiom] New 4-bar motif generated. Rhythm: [${durations.join(', ')}]`, 'color: #DA70D6');
    return motif;
}

export function createIntroDrumAxiom(genre: Genre, mood: Mood, tempo: number, random: { next: () => number; nextInt: (max: number) => number; }): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const loopDuration = 4.0; 

    // Используем безопасный набор перкуссии для интро
    const percKit = AMBIENT_INTRO_PERC;

    const numHits = 2 + random.nextInt(4); // от 2 до 5 ударов на такт
    
    for (let i = 0; i < numHits; i++) {
        const instrument = percKit[random.nextInt(percKit.length)];
        const time = random.next() * loopDuration;
        const duration = 0.1 + random.next() * 0.4;
        const weight = 0.2 + random.next() * 0.3; // Тихие удары

        axiom.push({
            type: instrument,
            note: 60, 
            duration: duration,
            time: time,
            weight: weight,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: {},
        });
    }
    
    console.log(`[IntroDrumAxiom] Generated ${axiom.length} safe percussion hits for intro.`);
    return axiom;
}


// Новая, надежная версия функции для генерации вступления.
export function generateIntroSequence(options: {
  currentBar: number;
  totalIntroBars: number;
  introRules: IntroRules;
  harmonyTrack: GhostChord[];
  settings: any; // Simplified for now
  random: { next: () => number; nextInt: (max: number) => number };
  instrumentOrder: InstrumentPart[];
}): { events: FractalEvent[]; instrumentHints: InstrumentHints } {

    const { currentBar, totalIntroBars, introRules, harmonyTrack, settings, random, instrumentOrder } = options;
    const events: FractalEvent[] = [];
    const instrumentHints: InstrumentHints = {};

    const currentChord = harmonyTrack.find(chord => currentBar >= chord.bar && currentBar < chord.bar + chord.durationBars);
    if (!currentChord) {
        console.warn(`[IntroSequence @ Bar ${currentBar}] No chord found.`);
        return { events, instrumentHints };
    }

    const progress = currentBar / totalIntroBars;
    console.log(`[IntroSequence @ Bar ${currentBar}] Progress: ${progress.toFixed(2)}. Chord: ${currentChord.rootNote} ${currentChord.chordType}.`);

    // --- Логика Постепенного Вступления ---
    const barsPerInstrument = Math.max(1, Math.floor(totalIntroBars / Math.max(1, instrumentOrder.length)));
    const instrumentsToPlayCount = Math.min(instrumentOrder.length, Math.floor(currentBar / barsPerInstrument) + 1);
    
    const activeInstruments = instrumentOrder.slice(0, instrumentsToPlayCount);

    console.log(`%c[IntroSequence @ Bar ${currentBar}] Active instruments for this bar: [${activeInstruments.join(', ')}]`, 'color: orange');

    // --- Генерация Партий для Активных Инструментов ---
    if (activeInstruments.includes('bass')) {
      events.push(...createAmbientBassAxiom(currentChord, settings.mood, settings.genre, random, settings.tempo, 'drone'));
    }

    if (activeInstruments.includes('accompaniment')) {
      instrumentHints.accompaniment = 'ambientPad'; // Default for intro for now
      events.push(...createAccompanimentAxiom(currentChord, settings.mood, settings.genre, random, settings.tempo, 'low'));
    }

    if (activeInstruments.includes('drums')) {
      console.log(`[IntroSequence @ Bar ${currentBar}] Calling SAFE intro drum generator.`);
      events.push(...createIntroDrumAxiom(settings.genre, settings.mood, settings.tempo, random));
    }
    
    if (activeInstruments.includes('melody')) {
        instrumentHints.melody = 'synth'; // Default for intro for now
        events.push(...createMelodyMotif(currentChord, settings.mood, random, undefined, 'mid', settings.genre));
    }
    
    if (activeInstruments.includes('harmony')) {
        instrumentHints.harmony = 'violin'; // Default
        events.push(...createHarmonyAxiom(currentChord, settings.mood, settings.genre, random));
    }


    return { events, instrumentHints };
}

