// src/lib/music-theory.ts
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType } from '@/types/fractal';

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

export function generateAmbientBassPhrase(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const phrase: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const numNotes = 5 + random.nextInt(8); // 5 to 12 notes per phrase
    let currentTime = 0;
    
    // Predominantly low, infrequently mid
    const selectNote = (): number => {
      const rand = random.next();
      if (rand < 0.8) { // 80% chance low register
          const half = Math.floor(scale.length / 2);
          return scale[random.nextInt(half)];
      } else { // 20% chance mid register
          const half = Math.floor(scale.length / 2);
          return scale[half + random.nextInt(scale.length - half)];
      }
    };

    let currentNote = selectNote();

    for (let i = 0; i < numNotes; i++) {
        // Vary duration
        const durationRand = random.next();
        let duration;
        if (durationRand < 0.6) duration = 0.5; // eighth note
        else if (durationRand < 0.9) duration = 1.0; // quarter note
        else duration = 0.25; // sixteenth note

        phrase.push({
            type: 'bass',
            note: currentNote,
            duration: duration,
            time: currentTime,
            weight: 0.7 + random.next() * 0.3,
            technique: 'swell',
            dynamics: 'mf',
            phrasing: 'legato',
            params: { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: 0.2, release: duration * 1.2 }
        });
        
        currentTime += duration;

        // Select next note, mostly stepwise
        const currentIndex = scale.indexOf(currentNote);
        let step = 0;
        if (random.next() < 0.85) { // 85% chance stepwise
            step = random.next() > 0.5 ? 1 : -1;
        } else { // 15% chance leap
            step = random.nextInt(5) - 2; // Leap of -2 to +2 scale degrees
        }
        const nextIndex = Math.max(0, Math.min(scale.length - 1, currentIndex + step));
        currentNote = scale[nextIndex];
    }
    
    // Normalize phrase to fit into exactly 4 beats (one bar)
    const totalDuration = phrase.reduce((sum, e) => sum + e.duration, 0);
    if (totalDuration > 4.0) {
        const scaleFactor = 4.0 / totalDuration;
        let runningTime = 0;
        phrase.forEach(e => {
            e.duration *= scaleFactor;
            e.time = runningTime;
            runningTime += e.duration;
        });
    }


    return phrase;
};


export function mutateBassPhrase(phrase: FractalEvent[], mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    const mutationType = random.nextInt(4); // 4 types of mutation

    if (newPhrase.length === 0) return [];
    
    switch (mutationType) {
        case 0: // Rhythmic mutation
            const noteToChange = newPhrase[random.nextInt(newPhrase.length)];
            noteToChange.duration *= (random.next() > 0.5 ? 1.5 : 0.5);
            break;

        case 1: // Pitch mutation (in-scale)
            const noteToTranspose = newPhrase[random.nextInt(newPhrase.length)];
            const scale = getScaleForMood(mood);
            const currentIndex = scale.indexOf(noteToTranspose.note);
            if (currentIndex !== -1) {
                const step = random.next() > 0.5 ? 1 : -1;
                const newIndex = (currentIndex + step + scale.length) % scale.length;
                noteToTranspose.note = scale[newIndex];
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
            if (random.next() > 0.5 && newPhrase.length > 3) {
                newPhrase.splice(random.nextInt(newPhrase.length), 1);
            } else {
                 const scale = getScaleForMood(mood);
                 const newNoteEvent = {...newPhrase[0]}; // copy properties from first note
                 newNoteEvent.note = scale[random.nextInt(scale.length)];
                 newNoteEvent.time = newPhrase[newPhrase.length-1].time + newPhrase[newPhrase.length-1].duration;
                 newNoteEvent.duration = 0.5;
                 newPhrase.push(newNoteEvent);
            }
            break;
    }

    // Re-normalize timings after mutation
    let currentTime = 0;
    newPhrase.forEach(e => {
        e.time = currentTime;
        currentTime += e.duration;
    });

    if (currentTime > 4.0) {
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

// Rhythmic Grammar Library for Drums
export const STYLE_DRUM_PATTERNS: Record<Genre, GenreRhythmGrammar> = {
    ambient: {
        loops: [
            { 
                kick: [{ type: 'drum_kick', time: 0, duration: 4, weight: 0.5, probability: 0.1 }],
                snare: [],
                hihat: [
                    { type: AMBIENT_PERC, probabilities: [0.2, 0.2, 0.2, 0.2, 0.2], time: 1.5, duration: 0.5, weight: 0.4, probability: 0.5 },
                    { type: 'drum_closed_hi_hat_ghost', time: 2.75, duration: 0.25, weight: 0.2, probability: 0.4 }
                ],
                tags: ['ambient-pulse-minimal']
            },
            {
                kick: [],
                snare: [],
                hihat: [
                    { type: 'drum_a_ride1', time: 0.75, duration: 0.25, weight: 0.3, probability: 0.6 },
                    { type: 'drum_tom_low', time: 2.25, duration: 0.25, weight: 0.2, probability: 0.5 },
                    { type: 'drum_a_ride2', time: 3.5, duration: 0.25, weight: 0.35, probability: 0.6 }
                ],
                tags: ['ambient-intro', 'sparse']
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
                    { type: ALL_RIDES, time: 0.5, duration: 0.5, weight: 0.6 },
                    { type: ALL_RIDES, time: 1.5, duration: 0.5, weight: 0.6 },
                    { type: ALL_RIDES, time: 2.5, duration: 0.5, weight: 0.6 },
                    { type: ALL_RIDES, time: 3.5, duration: 0.5, weight: 0.6 },
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
                     { type: ALL_RIDES, time: 0, duration: 0.5, weight: 0.5, probability: 0.8 },
                     { type: ALL_RIDES, time: 1, duration: 0.5, weight: 0.5, probability: 0.8 },
                     { type: ALL_RIDES, time: 2, duration: 0.5, weight: 0.5, probability: 0.8 },
                     { type: ALL_RIDES, time: 3, duration: 0.5, weight: 0.5, probability: 0.8 },
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

// Bass Riff Library
export const STYLE_BASS_PATTERNS: Record<Genre, BassPatternDefinition[]> = {
    ambient: [
        { pattern: (scale, random) => generateAmbientBassPhrase('calm', 'ambient', random).map(e => ({ note: e.note, time: e.time, duration: e.duration })), tags: ['ambient-generative'] }
    ],
    rock: [
        { pattern: [{ note: 0, time: 0, duration: 0.5 }, { note: 0, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 0, time: 1.5, duration: 0.5 }, { note: 0, time: 2, duration: 0.5 }, { note: 0, time: 2.5, duration: 0.5 }, { note: 0, time: 3, duration: 0.5 }, { note: 0, time: 3.5, duration: 0.5 }], tags: ['rock-standard', 'rock-eighths'] },
        { pattern: [{ note: 0, time: 0, duration: 1 }, { note: 2, time: 2, duration: 1 }, { note: 4, time: 3, duration: 1 }], tags: ['rock-standard'] },
    ],
    house: [
        { pattern: [{ note: 0, time: 0, duration: 1 }, { note: 0, time: 1, duration: 1 }, { note: 0, time: 2, duration: 1 }, { note: 0, time: 3, duration: 1 }], tags: ['four-on-the-floor'] },
        { pattern: [{ note: 0, time: 0, duration: 0.5 }, { note: 7, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 7, time: 1.5, duration: 0.5 }, { note: 0, time: 2, duration: 0.5 }, { note: 7, time: 2.5, duration: 0.5 }, { note: 0, time: 3, duration: 0.5 }, { note: 7, time: 3.5, duration: 0.5 }], tags: ['four-on-the-floor', 'octave-jump'] },
    ],
    trance: [
        { pattern: [{ note: 0, time: 0, duration: 0.5 }, { note: 0, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 0, time: 1.5, duration: 0.5 }, { note: 0, time: 2, duration: 0.5 }, { note: 0, time: 2.5, duration: 0.5 }, { note: 0, time: 3, duration: 0.5 }, { note: 0, time: 3.5, duration: 0.5 }], tags: ['trance-drive'] },
        { pattern: [{ note: 0, time: 0, duration: 0.25 }, { note: 0, time: 0.75, duration: 0.25 }, { note: 0, time: 1.5, duration: 0.25 }, { note: 0, time: 2.25, duration: 0.25 }, { note: 0, time: 3, duration: 0.25 }, { note: 0, time: 3.75, duration: 0.25 }], tags: ['trance-drive', 'syncopated'] },
    ],
    rnb: [
        { pattern: [{ note: 0, time: 0, duration: 1.5 }, { note: 4, time: 1.5, duration: 0.5 }, { note: 2, time: 2, duration: 1.5 }, { note: 0, time: 3.5, duration: 0.5, technique: 'ghost' }], tags: ['rnb-groove'] },
        { pattern: [{ note: 0, time: 1, duration: 0.75 }, { note: 2, time: 1.75, duration: 0.75 }, { note: -1, time: 2.5, duration: 0.5 }, { note: 0, time: 3.25, duration: 0.75 }], tags: ['rnb-groove', 'hip-hop'] },
    ],
    ballad: [
        { pattern: [{ note: 0, time: 0, duration: 3 }, { note: 4, time: 3, duration: 1 }], tags: ['ballad-simple'] },
        { pattern: [{ note: 0, time: 0, duration: 2 }, { note: 2, time: 2, duration: 2 }], tags: ['ballad-simple'] },
    ],
    reggae: [
        { pattern: [{ note: 0, time: 1, duration: 1 }, { note: 0, time: 3, duration: 1, technique: 'ghost' }], tags: ['one-drop'] },
        { pattern: [{ note: 0, time: 2.5, duration: 1.5 }], tags: ['one-drop'] },
    ],
    blues: [
        { pattern: [{ note: 0, time: 0, duration: 1 }, { note: 2, time: 1, duration: 1 }, { note: 4, time: 2, duration: 1 }, { note: 5, time: 3, duration: 1 }], tags: ['shuffle', 'walking-bass'] },
        { pattern: [{ note: 0, time: 0, duration: 0.66 }, { note: 2, time: 0.66, duration: 0.33 }, { note: 4, time: 1, duration: 0.66 }, { note: 2, time: 1.66, duration: 0.33 }], tags: ['shuffle'] },
    ],
    celtic: [
        { pattern: [{ note: 0, time: 0, duration: 1 }, { note: 4, time: 2, duration: 1 }], tags: ['bodhran-pulse'] },
        { pattern: [{ note: 0, time: 0, duration: 0.5 }, { note: 7, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 7, time: 1.5, duration: 0.5 }], tags: ['bodhran-pulse'] },
    ],
    progressive: [
        { pattern: [{ note: 0, time: 0, duration: 0.75 }, { note: 0, time: 0.75, duration: 0.25 }, { note: 2, time: 1, duration: 1 }, { note: -1, time: 2.5, duration: 1.5 }], tags: ['prog-rock-sparse', 'syncopated'] },
    ],
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
