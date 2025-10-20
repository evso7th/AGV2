
// src/lib/music-theory.ts
import type { Mood, Genre, Technique, BassSynthParams, InstrumentType } from '@/types/fractal';

export const PERCUSSION_SETS: Record<'NEUTRAL' | 'ELECTRONIC' | 'DARK', InstrumentType[]> = {
    NEUTRAL: ['perc-001', 'perc-002', 'perc-005', 'perc-006', 'perc-013', 'perc-014', 'perc-015', 'drum_ride', 'cymbal_bell1'],
    ELECTRONIC: ['perc-003', 'perc-004', 'perc-007', 'perc-008', 'perc-009', 'perc-010', 'perc-011', 'perc-012', 'hh_bark_short'],
    DARK: ['perc-013', 'drum_snare_off', 'drum_tom_low', 'perc-007', 'perc-015']
};

export const ALL_RIDES: InstrumentType[] = ['drum_ride', 'drum_a_ride1', 'drum_a_ride2', 'drum_a_ride3', 'drum_a_ride4'];
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
    time: number; // Beat
    duration: number; // In beats
    technique?: Technique;
};

type BassPatternGenerator = (scale: number[], random: { next: () => number, nextInt: (max: number) => number }) => { note: number, time: number, duration: number, technique?: Technique }[];

export type BassPatternDefinition = {
    pattern: BassPattern | BassPatternGenerator;
    tags: string[];
};


/**
 * Returns the MIDI notes of a mode for a given mood across multiple octaves.
 * The scale now spans from E1 (MIDI 28) up to E4, providing a wide range for bass.
 */
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
  // Generate notes for 3 octaves: E1-E2, E2-E3, E3-E4
  for (let octave = 0; octave < 3; octave++) {
      for (const note of baseScale) {
          fullScale.push(E1 + (octave * 12) + note);
      }
  }
  // Add the final E4
  fullScale.push(E1 + 36);

  return fullScale;
}


const generateAmbientBassPattern: BassPatternGenerator = (scale, random) => {
    const pattern: { note: number, time: number, duration: number, technique?: Technique }[] = [];
    const numNotes = 15 + random.nextInt(11); // 15-25 notes
    let currentTime = 0;
    
    // Start on the root note of the lower part of the scale
    const rootNote = scale.find(n => n % 12 === scale[0] % 12) || scale[0];
    let currentNote = rootNote;
    let lastNote = -1;

    for (let i = 0; i < numNotes; i++) {
        const duration = 0.25 + random.next() * 0.75; // 0.25 to 1.0 beats

        pattern.push({
            note: currentNote,
            time: currentTime,
            duration: duration + 0.5, // Add overlap
            technique: 'swell'
        });

        currentTime += duration;
        
        lastNote = currentNote;
        
        // Find next note
        const currentIndex = scale.indexOf(currentNote);
        let nextIndex;

        // Tendency to move stepwise, occasionally leap
        if (random.next() < 0.8) { // 80% chance stepwise
            nextIndex = currentIndex + (random.next() > 0.5 ? 1 : -1);
        } else { // 20% chance leap
            const leap = random.nextInt(5) - 2; // Leap of -2 to +2 scale degrees
            nextIndex = currentIndex + leap;
        }

        // Keep within bounds and avoid repeating the last note
        if (nextIndex < 0 || nextIndex >= scale.length || scale[nextIndex] === lastNote) {
            nextIndex = (currentIndex + (i % 2 === 0 ? 1 : -1) + scale.length) % scale.length;
        }
        
        currentNote = scale[nextIndex];
    }

    return pattern;
};


// Rhythmic Grammar Library for Drums
export const STYLE_DRUM_PATTERNS: Record<Genre, GenreRhythmGrammar> = {
    ambient: {
        loops: [
            { 
                kick: [{ type: 'drum_kick', time: 0, duration: 4, weight: 0.5, probability: 0.25 }],
                snare: [{ type: AMBIENT_SNARES, time: 2.5, duration: 0.5, weight: 0.3, probability: 0.15 }],
                hihat: [{ type: AMBIENT_PERC, time: 1.5, duration: 0.5, weight: 0.4, probability: 0.4 }],
                tags: ['ambient-pulse']
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
                    { type: ALL_RIDES, time: 0, duration: 0.66, weight: 0.6 },
                    { type: ALL_RIDES, time: 0.66, duration: 0.33, weight: 0.4 },
                    { type: ALL_RIDES, time: 1, duration: 0.66, weight: 0.6 },
                    { type: ALL_RIDES, time: 1.66, duration: 0.33, weight: 0.4 },
                    { type: ALL_RIDES, time: 2, duration: 0.66, weight: 0.6 },
                    { type: ALL_RIDES, time: 2.66, duration: 0.33, weight: 0.4 },
                    { type: ALL_RIDES, time: 3, duration: 0.66, weight: 0.6 },
                    { type: ALL_RIDES, time: 3.66, duration: 0.33, weight: 0.4 },
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
        { pattern: generateAmbientBassPattern, tags: ['ambient-generative'] }
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
        { pattern: [{ note: 0, time: 0, duration: 1 }, { note: 2, time: 1.75, duration: 0.75 }, { note: -1, time: 2.5, duration: 0.5 }, { note: 0, time: 3.25, duration: 0.75 }], tags: ['rnb-groove', 'hip-hop'] },
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
