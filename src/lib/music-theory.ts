

// src/lib/music-theory.ts
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, AccompanimentInstrument, InstrumentHints, AccompanimentTechnique, GhostChord } from '@/types/fractal';

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

type GenreRhythmGrammar = {
    loops: DrumKitPattern[];
    percussion?: PercussionRule;
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
        baseScale = [0, 2, 4, 5, 7, 9, 10];
        break;
    case 'melancholic': // E Dorian
    case 'calm':
      baseScale = [0, 2, 3, 5, 7, 9, 10];
      break;
    case 'dark':        // E Aeolian (Natural Minor)
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

export function generateAmbientBassPhrase(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }, tempo: number = 120): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const rootNote = chord.rootNote;

    const numNotes = 2 + random.nextInt(3); // 2 to 4 notes per bar
    let currentTime = 0;

    for (let i = 0; i < numNotes; i++) {
        const duration = 4.0 / numNotes;
        
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
    
    return phrase;
};


export function mutateBassPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    if (phrase.length === 0) return generateAmbientBassPhrase(chord, mood, genre, random);

    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    const mutationType = random.nextInt(4);
    
    switch (mutationType) {
        case 0: // Rhythmic mutation
            const noteToChange = newPhrase[random.nextInt(newPhrase.length)];
            noteToChange.duration *= (random.next() > 0.5 ? 1.5 : 0.5);
            break;

        case 1: // Pitch mutation (within chord)
            const noteToTranspose = newPhrase[random.nextInt(newPhrase.length)];
            const scale = getScaleForMood(mood);
             const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
            const possibleNotes = [
                chord.rootNote,
                chord.rootNote + 7, // 5th
                chord.rootNote + (isMinor ? 3 : 4) // 3rd
            ].filter(n => scale.some(scaleNote => scaleNote % 12 === n % 12));

            if (possibleNotes.length > 0) {
                 noteToTranspose.note = possibleNotes[random.nextInt(possibleNotes.length)];
            }
            break;
            
        case 2: // Inversion of a small fragment
            if (newPhrase.length > 2) {
                const start = random.nextInt(newPhrase.length - 2);
                const fragment = newPhrase.slice(start, start + 2);
                const reversedNotes = fragment.map(e => e.note).reverse();
                fragment.forEach((event, i) => event.note = reversedNotes[i]);
            }
            break;

        case 3: // Add or remove a note
            if (random.next() > 0.5 && newPhrase.length > 2) { 
                newPhrase.splice(random.nextInt(newPhrase.length), 1);
            }
            break;
    }

    // Re-normalize timings after mutation
    let currentTime = 0;
    newPhrase.forEach(e => {
        e.time = currentTime;
        currentTime += e.duration;
    });

    if (currentTime > 0) {
        const scaleFactor = 4.0 / currentTime;
        let runningTime = 0;
        newPhrase.forEach(e => {
            e.duration *= scaleFactor;
            e.time = runningTime;
            runningTime += e.duration;
        });
    }

    return newPhrase;
}

export function mutateAccompanimentPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    const mutationType = random.nextInt(4);

    if (newPhrase.length === 0) return [];
    
    switch (mutationType) {
        case 0: // Rhythmic mutation: Change duration of a random note
            const noteToChange = newPhrase[random.nextInt(newPhrase.length)];
            noteToChange.duration *= (random.next() > 0.5 ? 1.5 : 0.7);
            break;

        case 1: // Pitch mutation (in-scale)
            const noteToTranspose = newPhrase[random.nextInt(newPhrase.length)];
            const scale = getScaleForMood(mood);
            const rootNote = noteToTranspose.note - (noteToTranspose.note % 12); // Get octave base
            const possibleNotes = scale.filter(n => n >= rootNote && n < rootNote + 12);
            if (possibleNotes.length > 0) {
                noteToTranspose.note = possibleNotes[random.nextInt(possibleNotes.length)];
            }
            break;
            
        case 2: // Inversion of a small fragment (order of notes)
            if (newPhrase.length > 2) {
                const start = random.nextInt(newPhrase.length - 2);
                const fragment = newPhrase.slice(start, start + 2);
                const reversedNotes = fragment.map(e => e.note).reverse();
                fragment.forEach((event, i) => event.note = reversedNotes[i]);
            }
            break;

        case 3: // Add or remove a note
            if (random.next() > 0.5 && newPhrase.length > 3) {
                newPhrase.splice(random.nextInt(newPhrase.length), 1);
            } else {
                 const lastNote = newPhrase[newPhrase.length-1];
                 const newNoteEvent = {...lastNote};
                 const scale = getScaleForMood(mood);
                 newNoteEvent.note = scale[random.nextInt(scale.length)];
                 newNoteEvent.time = lastNote.time + lastNote.duration;
                 newNoteEvent.duration = (phrase[0]?.duration || 1.0) * 0.5;
                 newPhrase.push(newNoteEvent);
            }
            break;
    }

    // Re-normalize timings to fit one bar
    let totalDuration = newPhrase.reduce((sum, e) => sum + e.duration, 0);
    if (totalDuration > 0 && totalDuration !== 4.0) {
         const scaleFactor = 4.0 / totalDuration;
         let runningTime = 0;
         newPhrase.forEach(e => {
             e.duration *= scaleFactor;
             e.time = runningTime;
             runningTime += e.duration;
         });
    }

    return newPhrase;
}

// Rhythmic Grammar Library for Drums
export const STYLE_DRUM_PATTERNS: Record<Genre, GenreRhythmGrammar> = {
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
            probability: 0.6, 
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
    reggae: {
        loops: [
            { 
                kick: [],
                snare: [{ type: 'drum_kick', time: 2, duration: 0.5, weight: 1.0 }], // Kick and snare together
                hihat: [
                    { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_closed', time: 1.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_closed', time: 2.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.8 },
                ],
                tags: ['one-drop']
            }
        ],
    },
    blues: {
        loops: [
            { 
                kick: [{ type: 'drum_kick', time: 0, duration: 0.5, weight: 0.9 }, { type: 'drum_kick', time: 2, duration: 0.5, weight: 0.9 }],
                snare: [{ type: 'drum_snare', time: 1, duration: 0.5, weight: 1.0 }, { type: 'drum_snare', time: 3, duration: 0.5, weight: 1.0 }],
                hihat: [
                    { type: 'drum_ride', time: 0, duration: 0.66, weight: 0.6 },
                    { type: 'drum_ride', time: 0.66, duration: 0.33, weight: 0.4 },
                    { type: 'drum_ride', time: 1, duration: 0.66, weight: 0.6 },
                    { type: 'drum_ride', time: 1.66, duration: 0.33, weight: 0.4 },
                    { type: 'drum_ride', time: 2, duration: 0.66, weight: 0.6 },
                    { type: 'drum_ride', time: 2.66, duration: 0.33, weight: 0.4 },
                    { type: 'drum_ride', time: 3, duration: 0.66, weight: 0.6 },
                    { type: 'drum_ride', time: 3.66, duration: 0.33, weight: 0.4 },
                ],
                tags: ['shuffle']
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

/**
 * Грамматика для генерации SFX.
 * Определяет "строительные блоки" для создания разнообразных звуковых эффектов.
 */
export const SFX_GRAMMAR = {
  // Типы осцилляторов для разных текстур
  textures: {
    industrial: ['sawtooth', 'square'],
    ambient: ['sine', 'triangle'],
    vocal: ['fatsine'],
  },
  // Диапазоны частот для разных регистров и движений
  freqRanges: {
    low: { min: 30, max: 150 },
    mid: { min: 150, max: 800 },
    high: { min: 800, max: 4000 },
    'wide-sweep-up': { minStart: 100, maxStart: 400, minEnd: 1500, maxEnd: 3000 },
    'wide-sweep-down': { minStart: 1500, maxStart: 3000, minEnd: 100, maxEnd: 400 },
  },
  // Характеристики огибающей для разной артикуляции
  envelopes: {
    percussive: { attack: {min: 0.01, max: 0.05}, decay: {min: 0.1, max: 0.3}, sustain: 0.1, release: {min: 0.1, max: 0.4} },
    pad: { attack: {min: 0.5, max: 1.5}, decay: {min: 1.0, max: 2.0}, sustain: 0.8, release: {min: 1.0, max: 2.5} },
    swell: { attack: {min: 0.2, max: 0.8}, decay: {min: 0.5, max: 1.0}, sustain: 0.6, release: {min: 0.5, max: 1.5} },
  },
  // Типы движения панорамы
  panning: {
    static: 'static',
    sweep: 'sweep',
    random: 'random'
  }
};


export function createAccompanimentAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number }, tempo: number = 120): FractalEvent[] {
    const swellParams = { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: 1.5, release: 2.5 };
    const axiom: FractalEvent[] = [];
    
    const scale = getScaleForMood(mood);
    const rootMidi = chord.rootNote;
    
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const third = rootMidi + (isMinor ? 3 : 4);
    const fifth = rootMidi + 7;

    const chordNotes = [rootMidi, third, fifth].filter(n => scale.some(scaleNote => scaleNote % 12 === n % 12));
    if (chordNotes.length < 2) return [];

    const numNotes = 2 + random.nextInt(2);
    let currentTime = 0;

    for (let i = 0; i < numNotes; i++) {
        const noteMidi = chordNotes[random.nextInt(chordNotes.length)] + 12 * (3 + random.nextInt(2));
        const duration = 4.0 / numNotes;
        
        const mainEvent: FractalEvent = {
            type: 'accompaniment', note: noteMidi, duration: duration,
            time: currentTime, weight: 0.6 + random.next() * 0.2, technique: 'swell',
            dynamics: 'p', phrasing: 'legato', params: swellParams
        };
        axiom.push(mainEvent);

        currentTime += duration;
    }

    return axiom;
}

/**
 * #ЗАЧЕМ: Эта функция создает базовую музыкальную фразу (аксиому) для слоя 'harmony'.
 * #ЧТО: Она генерирует 2-3 ноты, основываясь на переданном "призрачном" аккорде (GhostChord),
 *         выбирая ноты из этого аккорда и размещая их в 3-й октаве.
 * #СВЯЗИ: Вызывается движком (FractalMusicEngine), когда нужно создать новую гармоническую идею.
 *          Результат передается в HarmonySynthManager для воспроизведения.
 */
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


export const TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD: Record<Mood, Record<Exclude<AccompanimentInstrument, 'violin' | 'flute'>, number>> = {
  epic:          { organ: 0.4, mellotron: 0.4, synth: 0.2, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  joyful:        { organ: 0.3, synth: 0.2, mellotron: 0.2, piano: 0.3, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  enthusiastic:  { synth: 0.5, organ: 0.4, electricGuitar: 0.1, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, mellotron: 0.0, 'theremin': 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  melancholic:   { mellotron: 0.4, organ: 0.3, synth: 0.1, piano: 0.2, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dark:          { organ: 0.5, mellotron: 0.3, theremin: 0.2, synth: 0.0, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  anxious:       { synth: 0.5, theremin: 0.3, organ: 0.2, mellotron: 0.0, piano: 0.0, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dreamy:        { synth: 0.3, mellotron: 0.2, organ: 0.2, piano: 0.3, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  contemplative: { organ: 0.4, synth: 0.2, piano: 0.4, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  calm:          { synth: 0.3, organ: 0.2, piano: 0.5, guitarChords: 0.0, acousticGuitarSolo: 0.0, electricGuitar: 0.0, 'E-Bells_melody': 0.0, 'G-Drops': 0.0, 'theremin': 0.0, 'mellotron': 0.0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
};

export const AMBIENT_ACCOMPANIMENT_WEIGHTS: Record<Mood, Record<Exclude<AccompanimentInstrument, 'violin' | 'flute'>, number>> = {
  epic:          { organ: 0.4, mellotron: 0.4, synth: 0.2, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  joyful:        { organ: 0.3, synth: 0.2, mellotron: 0.2, piano: 0.3, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  enthusiastic:  { synth: 0.5, organ: 0.4, theremin: 0.1, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, mellotron: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  melancholic:   { mellotron: 0.4, organ: 0.3, synth: 0.1, piano: 0.2, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dark:          { organ: 0.5, mellotron: 0.3, theremin: 0.2, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, synth: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  anxious:       { synth: 0.5, theremin: 0.3, organ: 0.2, piano: 0, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, mellotron: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  dreamy:        { synth: 0.3, mellotron: 0.2, organ: 0.2, piano: 0.3, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  contemplative: { organ: 0.4, synth: 0.2, piano: 0.4, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'mellotron': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
  calm:          { synth: 0.3, organ: 0.2, piano: 0.5, guitarChords: 0, acousticGuitarSolo: 0, electricGuitar: 0, 'E-Bells_melody': 0, 'G-Drops': 0, 'theremin': 0, 'mellotron': 0, 'none': 0.0, 'ambientPad': 0.0, 'acousticGuitar': 0.0 },
};


export type AccompanimentTechnique = 'choral' | 'alternating-bass-chord' | 'chord-pulsation' | 'arpeggio-fast' | 'arpeggio-slow' | 'alberti-bass' | 'paired-notes' | 'long-chords';

export function getAccompanimentTechnique(genre: Genre, mood: Mood, density: number, tempo: number, barCount: number, random: { next: () => number }): AccompanimentTechnique {
    // Intro phase: prioritize calm, sustained techniques
    if (barCount < 4) {
        if (random.next() < 0.7) return 'long-chords';
        return 'choral';
    }

    // Main logic based on genre, density, and randomness
    const rand = random.next();
    const isHighEnergyGenre = ['trance', 'house', 'progressive', 'rock'].includes(genre);
    const isLowEnergyGenre = ['ambient', 'ballad', 'celtic'].includes(genre);
    
    // Higher density and tempo push towards more active techniques
    const activityPressure = (density * 0.7) + (tempo / 160 * 0.3);

    if (activityPressure > 0.65 && isHighEnergyGenre) {
        if (rand < 0.7) return 'arpeggio-fast';
        if (rand < 0.9) return 'chord-pulsation';
        return 'alberti-bass';
    }
    
    if (activityPressure > 0.4) {
        // For ambient, explicitly forbid chord-pulsation at this stage
        if (genre === 'ambient') {
            if (rand < 0.6) return 'alberti-bass';
            return 'paired-notes';
        }
        
        if (rand < 0.5) return 'alberti-bass';
        if (rand < 0.8) return 'chord-pulsation';
        return 'paired-notes';
    }

    // Low activity pressure defaults to calmer techniques
    if (isLowEnergyGenre || activityPressure <= 0.4) {
        if (rand < 0.6) return 'long-chords';
        if (rand < 0.9) return 'choral';
        return 'paired-notes';
    }
    
    // Fallback
    return 'choral';
}


export function createBassFill(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { events: FractalEvent[], penalty: number } {
    const fill: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };
    const numNotes = random.nextInt(4) + 7; // 7 to 10 notes
    let currentTime = 0;
    
    // Predominantly low, infrequently mid
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

        // "Запрет на монотонность"
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

/**
 * Creates a drum fill synchronized with a bass fill.
 */
export function createDrumFill(random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const fill: FractalEvent[] = [];
    const numHits = random.nextInt(3) + 2; // 2-4 hits
    const toms: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high'];
    let currentTime = 3.0; // Start the fill on the 4th beat
    const baseWeight = 0.75;

    for (let i = 0; i < numHits; i++) {
        const tom = toms[random.nextInt(toms.length)];
        const duration = 0.25; // 16th note
        const time = currentTime + i * duration;
        
        fill.push({
            type: tom,
            note: 50 + i, // Arbitrary midi note for uniqueness
            duration,
            time,
            weight: baseWeight + (random.next() * 0.1),
            technique: 'hit',
            dynamics: 'mf',
            phrasing: 'staccato',
            params: {}
        });

        // Add a ghost hi-hat with 50% probability
        if (random.next() < 0.5) {
             fill.push({
                type: 'drum_closed_hi_hat_ghost',
                note: 42,
                duration: 0.125,
                time: time + duration / 2,
                weight: baseWeight * 0.5,
                technique: 'ghost',
                dynamics: 'p',
                phrasing: 'staccato',
                params: {}
            });
        }
    }

    // Add final accent
    const finalTime = currentTime + numHits * 0.25;
    const numRides = random.next() > 0.5 ? 2 : 1;
    for (let i = 0; i < numRides; i++) {
         fill.push({
            type: 'drum_ride',
            note: 59,
            duration: 0.5,
            time: finalTime + i * 0.25,
            weight: baseWeight * 0.6, // Quieter accent
            technique: 'hit',
            dynamics: 'mp',
            phrasing: 'legato',
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
    
    // Note: Mood can be used here in the future to adjust weights.
    // For now, we use the static distribution.

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

export function generateGhostHarmonyTrack(totalBars: number, mood: Mood, key: number, random: { next: () => number, nextInt: (max: number) => number }): GhostChord[] {
  console.log(`[Harmony] Generating Ghost Harmony for ${totalBars} bars in key ${key} (${mood}).`);
  
  const harmonyTrack: GhostChord[] = [];
  const scale = getScaleForMood(mood);

  // Define scale degrees
  const I = scale[0];
  const IV = scale[3];
  const V = scale[4];
  const VI = mood === 'joyful' || mood === 'epic' ? scale[5] : scale[5] -1; // Aeolian has a minor 6th

  const progressionRoots = [I, VI, IV, V]; 
  const chordTypes: GhostChord['chordType'][] = mood.includes('dark') || mood.includes('melancholic')
    ? ['minor', 'major', 'major', 'minor']
    : ['major', 'minor', 'minor', 'major'];

  let currentBar = 0;
  while (currentBar < totalBars) {
    const progressionIndex = Math.floor(currentBar / 4) % progressionRoots.length;
    const rootNote = progressionRoots[progressionIndex];
    const duration = 4; // Each chord lasts 4 bars for simplicity

    if (rootNote === undefined) {
        console.error(`[Harmony] Error: Could not determine root note for chord at bar ${currentBar}. Skipping.`);
        currentBar += duration;
        continue;
    }

    harmonyTrack.push({
      rootNote: rootNote,
      chordType: chordTypes[progressionIndex % chordTypes.length],
      bar: currentBar,
      durationBars: duration,
    });

    currentBar += duration;
  }

  console.log(`[Harmony] Ghost Harmony generated. ${harmonyTrack.length} chords.`);
  return harmonyTrack;
}
    

export function createMelodyMotif(chord: GhostChord, mood: Mood, random: { next: () => number; nextInt: (max: number) => number; }, previousMotif?: FractalEvent[]): FractalEvent[] {
    const motif: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const rootOctave = 4; // Start melody in the 4th octave
    
    // #ЗАЧЕМ: Этот контур определяет "скелет" мелодии.
    // #ЧТО: Он задает последовательность шагов по гамме относительно базовой ноты, создавая музыкальную фразу.
    // #СВЯЗИ: Используется для генерации нот в цикле ниже.
    const contour = [0, 2, 4, 5, 7, 5, 4, 2]; // Classic "arching" phrase
    
    let baseNote = chord.rootNote;
    while(baseNote > 50) baseNote -= 12; // Ensure it's in a reasonable starting octave
    baseNote += (12 * rootOctave);


    // Variation logic if a previous motif is provided
    if (previousMotif && random.next() > 0.3) {
        const variationType = random.nextInt(3);
        const sourceNotes = previousMotif.map(e => e.note);
        
        switch(variationType) {
            case 0: // Inversion
                const firstNote = sourceNotes[0];
                const invertedNotes = sourceNotes.map(n => firstNote - (n - firstNote));
                contour.forEach((degree, i) => {
                    motif.push({
                        type: 'melody',
                        note: invertedNotes[i % invertedNotes.length],
                        duration: 1.0, time: i, weight: 0.7,
                        technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
                    });
                });
                break;
            case 1: // Retrograde
                const retrogradeNotes = [...sourceNotes].reverse();
                 contour.forEach((degree, i) => {
                    motif.push({
                        type: 'melody',
                        note: retrogradeNotes[i % retrogradeNotes.length],
                        duration: 1.0, time: i, weight: 0.7,
                        technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
                    });
                });
                break;
            default: // Octave shift
                const octaveShift = random.next() > 0.5 ? 12 : -12;
                 contour.forEach((degree, i) => {
                    motif.push({
                        type: 'melody',
                        note: sourceNotes[i % sourceNotes.length] + octaveShift,
                        duration: 1.0, time: i, weight: 0.7,
                        technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
                    });
                });
                break;
        }

    } else {
        // #ЗАЧЕМ: Этот блок генерирует совершенно новый мотив с нуля.
        // #ЧТО: Он проходит по `contour`, находит соответствующую ноту в `scale` и создает для нее событие `melody`.
        // #СВЯЗИ: Результат - это новая "аксиома" для мелодии.
        contour.forEach((degree, i) => {
            // Find the index of the base note in the scale to use as a reference point.
            const baseNoteIndexInScale = scale.findIndex(n => n % 12 === baseNote % 12);
            // Calculate the new note's index by adding the contour degree.
            const noteIndex = (baseNoteIndexInScale + degree + scale.length) % scale.length;
            const note = scale[noteIndex];
            motif.push({
                type: 'melody',
                note: note,
                duration: 0.5, // Eigth note duration for an 8-note phrase
                time: i * 0.5, // Each note starts on an eighth note
                weight: 0.7,
                technique: 'swell',
                dynamics: 'mf',
                phrasing: 'legato',
                params: {}
            });
        });

        // #ЗАЧЕМ: Этот лог делает видимой сгенерированную мелодическую "ДНК".
        // #ЧТО: Он преобразует массив MIDI-нот в читаемую строку и выводит ее в консоль.
        // #СВЯЗИ: Помогает отслеживать, какие именно мелодии создаются и как они мутируют.
        const motifNotes = motif.map(e => e.note);
        console.log(`%c[MelodyAxiom] New motif generated: ${motifNotes.join(' -> ')}`, 'color: #DA70D6');
    }

    return motif;
}
    
    

    


    
