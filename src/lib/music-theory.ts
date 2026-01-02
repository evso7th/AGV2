

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, AccompanimentInstrument, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_MELODY_RIFFS, type BluesRiffDegree, type BluesRiffEvent, type BluesMelodyPhrase, type BluesMelody } from './assets/blues-melody-riffs';


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
    if (phrase.length === 0) return createAmbientBassAxiom(chord, mood, genre, random, 120, 'drone');

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
                const newHalf = createAmbientBassAxiom(chord, mood, genre, random, 120, 'drone').slice(0, half);
                newPhrase.splice(0, half, ...newHalf);
            }
            break;

        case 3:
            mutationDescription = "Passing Note Addition";
            if (newPhrase.length > 1) {
                const insertIndex = random.nextInt(newPhrase.length - 1) + 1;
                const prevNote = newPhrase[insertIndex-1];
                const scale = getScaleForMood(mood);
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
        const scaleFactor = 4.0 / totalDuration;
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
                const scale = getScaleForMood(mood);
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

export function getScaleForMood(mood: Mood): number[] {
  const E1 = 28;
  let baseScale: number[];

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


  const fullScale: number[] = [];
  for (let octave = 0; octave < 3; octave++) {
      for (const note of baseScale) {
          fullScale.push(E1 + (octave * 12) + note);
      }
  }
  fullScale.push(E1 + 36);

  return fullScale;
}

export function generateBluesBassRiff(chord: GhostChord, technique: Technique, random: { next: () => number, nextInt: (max: number) => number }, mood: Mood): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const root = chord.rootNote;
    const barDurationInBeats = 4.0;
    const ticksPerBeat = 3; // 12/8 time feel

    const riffLibrary = (mood === 'contemplative' || mood === 'calm' || mood === 'dreamy') ? NEUTRAL_BLUES_BASS_RIFFS : BLUES_BASS_RIFFS;
    const libraryName = (mood === 'contemplative' || mood === 'calm' || mood === 'dreamy') ? 'NEUTRAL' : 'DARK';

    console.log(`%c[BluesBass] Generating riff for ${chord.rootNote} from ${libraryName} library.`, 'color: #4682B4');

    const riffIndex = random.nextInt(riffLibrary.length);
    const selectedRiff = riffLibrary[riffIndex];
    console.log(`[BluesBass] Selected Riff #${riffIndex + 1} from ${libraryName} library.`);

    let barOffset = 0;
    for (const barPattern of selectedRiff) {
        for (const riffNote of barPattern) {
            phrase.push({
                type: 'bass',
                note: root + riffNote.note,
                time: barOffset + (riffNote.tick / ticksPerBeat),
                duration: riffNote.dur / ticksPerBeat,
                weight: 0.85 + random.next() * 0.1,
                technique: 'pluck',
                dynamics: 'mf',
                phrasing: 'legato',
                params: { cutoff: 800, resonance: 0.7, distortion: 0.15, portamento: 0.0 }
            });
        }
        barOffset += barDurationInBeats;
    }

    return phrase;
}

export function createAmbientBassAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }, tempo: number, technique: Technique): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const rootNote = chord.rootNote;

    const numNotes = 4 + random.nextInt(5); // 4 to 8 notes over two bars
    let currentTime = 0;
    const totalDurationNormalizer = 8.0; // Two bars

    for (let i = 0; i < numNotes; i++) {
        const duration = totalDurationNormalizer / numNotes;
        
        let note = rootNote;
        if (i > 0 && random.next() > 0.4) {
            const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
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
    const scale = getScaleForMood(mood);
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
        loops: [], // This will now be handled dynamically
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

export const SFX_GRAMMAR = {
  textures: {
    industrial: ['sawtooth', 'square'],
    ambient: ['sine', 'triangle'],
    vocal: ['fatsine'],
  },
  freqRanges: {
    low: { min: 30, max: 150 },
    mid: { min: 150, max: 800 },
    high: { min: 800, max: 4000 },
    'wide-sweep-up': { minStart: 100, maxStart: 400, minEnd: 1500, maxEnd: 3000 },
    'wide-sweep-down': { minStart: 1500, maxStart: 3000, minEnd: 100, maxEnd: 400 },
  },
  envelopes: {
    percussive: { attack: {min: 0.01, max: 0.05}, decay: {min: 0.1, max: 0.3}, sustain: 0.1, release: {min: 0.1, max: 0.4} },
    pad: { attack: {min: 0.5, max: 1.5}, decay: {min: 1.0, max: 2.0}, sustain: 0.8, release: {min: 1.0, max: 2.5} },
    swell: { attack: {min: 0.2, max: 0.8}, decay: {min: 0.5, max: 1.0}, sustain: 0.6, release: {min: 0.5, max: 1.5} },
  },
  panning: {
    static: 'static',
    sweep: 'sweep',
    random: 'random'
  }
};

export const TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD: Record<Mood, Record<Exclude<AccompanimentInstrument, 'violin' | 'flute' | 'mellotron_choir_dark' >, number>> = {
  epic:          { organ: 0.4, mellotron: 0.4, synth: 0.2, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  joyful:        { organ: 0.3, synth: 0.2, mellotron: 0.2, piano: 0.3, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  enthusiastic:  { synth: 0.5, organ: 0.4, electricGuitar: 0.1, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, mellotron: 0.0, 'theremin': 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  melancholic:   { organ: 0.4, synth: 0.1, piano: 0.2, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.3, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dark:          { organ: 0.8, theremin: 0.2, synth: 0.0, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  anxious:       { synth: 0.5, theremin: 0.3, organ: 0.2, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dreamy:        { synth: 0.3, organ: 0.2, piano: 0.3, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.2, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  contemplative: { organ: 0.4, synth: 0.2, piano: 0.4, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  calm:          { synth: 0.3, organ: 0.2, piano: 0.5, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
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
    const scale = getScaleForMood(mood);
    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };
    const numNotes = random.nextInt(4) + 7; // 7 to 10 notes
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

    for (let i = 0; i < numNotes; i++) {
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
    const numHits = Math.floor(2 + (density * 6)); // 2 to 8 hits
    let toms: InstrumentType[];
    
    switch(instrument) {
        case 'snare':
            toms = ['drum_snare', 'drum_snare_ghost_note'];
            break;
        case 'tom':
        default:
            toms = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high'];
            break;
        case 'crash':
            toms = ['drum_crash', 'drum_ride'];
            break;
    }

    let currentTime = 3.0; // Start the fill on the 4th beat
    const weightMap = { 'pp': 0.4, 'p': 0.5, 'mp': 0.6, 'mf': 0.75, 'f': 0.9, 'ff': 1.0 };
    const baseWeight = weightMap[dynamics as keyof typeof weightMap] || 0.75;

    for (let i = 0; i < numHits; i++) {
        const tom = toms[random.nextInt(toms.length)];
        const duration = (1.0 / numHits) * (0.8 + random.next() * 0.4); // slightly variable duration
        const time = currentTime + i * duration;
        
        fill.push({
            type: tom,
            note: 40 + i, // Arbitrary midi note for uniqueness
            duration,
            time,
            weight: baseWeight + (random.next() * 0.1) - 0.05,
            technique: 'hit',
            dynamics: dynamics,
            phrasing: 'staccato',
            params: {}
        });
    }

    return fill;
}

export function chooseHarmonyInstrument(mood: Mood, random: { next: () => number }): NonNullable<InstrumentHints['harmony']> {
    const weights: { instrument: NonNullable<InstrumentHints['harmony']>, weight: number }[] = [
        { instrument: 'guitarChords', weight: 0.6 },
        { instrument: 'piano', weight: 0.1 },
        { instrument: 'acousticGuitarSolo', weight: 0.1 },
        { instrument: 'flute', weight: 0.1 },
        { instrument: 'violin', weight: 0.1 },
    ];
    
    const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
    let rand = random.next() * totalWeight;

    for (const item of weights) {
        rand -= item.weight;
        if (rand <= 0) {
            return item.instrument;
        }
    }

    return 'guitarChords'; // Fallback
}

export function generateGhostHarmonyTrack(totalBars: number, mood: Mood, key: number, random: { next: () => number; nextInt: (max: number) => number; }): GhostChord[] {
    console.log(`[Harmony] Generating 12-Bar Blues Harmony for ${totalBars} bars in key ${key}.`);
    
    const harmonyTrack: GhostChord[] = [];
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
    return harmonyTrack;
}
    
export function createDrumAxiom(genre: Genre, mood: Mood, tempo: number, random: { next: () => number, nextInt: (max: number) => number }, rules?: any): { events: FractalEvent[], tags: string[] } {
    const hitParams = {}; // Params now come from events
    const grammar = STYLE_DRUM_PATTERNS[genre] || STYLE_DRUM_PATTERNS['ambient'];
    
    if (!grammar || !grammar.loops || grammar.loops.length === 0) {
        return { events: [], tags: [] };
    }

    const loop = grammar.loops[random.nextInt(grammar.loops.length)];
    
    const axiomEvents: FractalEvent[] = [];

    if (!loop) return { events: [], tags: [] };

    const allBaseEvents = [...(loop.kick || []), ...(loop.snare || []), ...(loop.hihat || [])];
    for (const baseEvent of allBaseEvents) {
        if (baseEvent.probability && random.next() > baseEvent.probability) {
            continue;
        }

        const eventTypeStr = Array.isArray(baseEvent.type) ? baseEvent.type[0] : baseEvent.type;

        if (eventTypeStr.includes('snare') && rules?.useSnare === false) continue;
        if (eventTypeStr.startsWith('perc-') && rules?.usePerc === false) continue;
        if (eventTypeStr.includes('tom') && rules?.usePerc === false) continue;
        if ((eventTypeStr.includes('ride') || eventTypeStr.includes('cymbal')) && rules?.ride?.enabled === false) continue;
        if (eventTypeStr.includes('hat') && rules?.useGhostHat === false) continue;


        let instrumentType: InstrumentType;
        if (Array.isArray(baseEvent.type)) {
            const types = baseEvent.type as InstrumentType[];
            const probabilities = baseEvent.probabilities || [];
            let rand = random.next();
            let cumulativeProb = 0;
            
            let chosenType: InstrumentType | null = null;
            for (let i = 0; i < types.length; i++) {
                cumulativeProb += probabilities[i] || (1 / types.length);
                if (rand <= cumulativeProb) {
                    chosenType = types[i];
                    break;
                }
            }
            instrumentType = chosenType || types[types.length - 1];
        } else {
            instrumentType = baseEvent.type;
        }
        
        console.log(`%c[DrumAxiom] Generating drum event: type='${instrumentType}', controlled by rules: ${JSON.stringify(rules || {})}`, 'color: #FFA500');

        axiomEvents.push({
            ...baseEvent,
            type: instrumentType,
            note: 36, // Placeholder MIDI
            phrasing: 'staccato',
            dynamics: 'mf', // Placeholder
            params: hitParams,
        } as FractalEvent);
    }
    
    return { events: axiomEvents, tags: loop.tags };
}

export function createSfxScenario(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { drumFill: FractalEvent[], bassFill: FractalEvent[], accompanimentFill: FractalEvent[] } {
    const drumFill: FractalEvent[] = [];
    const bassFill: FractalEvent[] = [];
    const accompanimentFill: FractalEvent[] = [];
    
    const scale = getScaleForMood(mood);
    const rootNote = scale[random.nextInt(Math.floor(scale.length / 2))]; // Select a root from the lower half of the scale
    const isMinor = mood === 'melancholic' || mood === 'dark';
    const third = rootNote + (isMinor ? 3 : 4);
    const fifth = rootNote + 7;
    const chord = [rootNote, third, fifth].filter(n => scale.some(sn => sn % 12 === n % 12));

    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };

    const fillDensity = random.nextInt(4) + 3; // 3 to 6 notes for the core rhythm
    let fillTime = 3.0; // Start the fill in the last beat

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

const DEGREE_TO_SEMITONE: Record<BluesRiffDegree, number> = { 'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7, 'b6': 8, '6': 9, 'b7': 10, '9': 14, '11': 17, 'R+8': 12 };

export function generateBluesMelodyChorus(chorusChords: GhostChord[], mood: Mood, random: { next: () => number, nextInt: (max: number) => number }, registerHint?: 'low' | 'mid' | 'high'): { events: FractalEvent[], log: string } {
    const chorusEvents: FractalEvent[] = [];
    
    const suitableMelodies = BLUES_MELODY_RIFFS.filter(m => m.moods.includes(mood));
    const selectedMelody = suitableMelodies[random.nextInt(suitableMelodies.length)] || BLUES_MELODY_RIFFS[0];
    
    const barDurationInBeats = 4;
    const ticksPerBeat = 3;
    
    let octaveShift = 0;
    if (registerHint === 'mid') octaveShift = 12;
    if (registerHint === 'high') octaveShift = 24;

    for (let barIndex = 0; barIndex < 12; barIndex++) {
        const barChord = chorusChords[barIndex];
        if (!barChord) continue;

        const chordRoot = barChord.rootNote;
        let phrase: BluesMelodyPhrase;

        const I_CHORD_STEP = 0;
        const IV_CHORD_STEP = 5;
        const V_CHORD_STEP = 7;

        const chordStep = (chordRoot - chorusChords[0].rootNote + 12) % 12;

        if (barIndex === 11) {
            phrase = selectedMelody.phraseTurnaround;
        } else if (chordStep === IV_CHORD_STEP) {
            phrase = selectedMelody.phraseIV;
        } else if (chordStep === V_CHORD_STEP) {
            phrase = selectedMelody.phraseV;
        } else {
            phrase = selectedMelody.phraseI;
        }

        for (const event of phrase) {
            const noteMidi = chordRoot + DEGREE_TO_SEMITONE[event.deg] + octaveShift;
            chorusEvents.push({
                type: 'melody',
                note: noteMidi,
                time: (barIndex * barDurationInBeats) + (event.t / ticksPerBeat),
                duration: event.d / ticksPerBeat,
                weight: 0.85,
                technique: 'pick',
                dynamics: 'f',
                phrasing: 'legato',
                params: {}
            });
        }
    }

    const shouldMutate = random.next() < 0.4;
    let mutationLog = "None";
    if (shouldMutate && chorusEvents.length > 0) {
        const mutationType = random.nextInt(3);
        switch (mutationType) {
            case 0:
                mutationLog = "Rhythmic Shift";
                chorusEvents.forEach(e => { e.time += (random.next() - 0.5) * 0.25; });
                break;
            case 1:
                mutationLog = "Register Shift";
                const eventOctaveShift = (random.next() > 0.5) ? 12 : -12;
                chorusEvents.forEach(e => { e.note += eventOctaveShift; });
                break;
            case 2:
                mutationLog = "Note Removal";
                const indexToRemove = random.nextInt(chorusEvents.length);
                chorusEvents.splice(indexToRemove, 1);
                break;
        }
    }

    const log = `Using riff: "${selectedMelody.id}". Mutation: "${mutationLog}". Register: ${registerHint || 'default (low)'}`;
    console.log(`%c[BluesMelodyChorus] ${log}`, 'color: #00BCD4');
    
    return { events: chorusEvents, log };
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

    const scale = getScaleForMood(mood);
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
