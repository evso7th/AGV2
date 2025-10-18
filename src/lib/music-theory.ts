
// src/lib/music-theory.ts
import type { Mood, Genre, Technique, BassSynthParams, InstrumentType } from '@/types/fractal';

export const PERCUSSION_SETS: Record<'NEUTRAL' | 'ELECTRONIC' | 'DARK', InstrumentType[]> = {
    NEUTRAL: ['perc-001', 'perc-002', 'perc-005', 'perc-006', 'perc-013', 'perc-014', 'perc-015', 'drum_ride', 'cymbal_bell1'],
    ELECTRONIC: ['perc-003', 'perc-004', 'perc-007', 'perc-008', 'perc-009', 'perc-010', 'perc-011', 'perc-012', 'hh_bark_short'],
    DARK: ['perc-013', 'drum_snare_off', 'drum_tom_low', 'perc-007', 'perc-015']
};

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
    // Instruments to choose from
    types: InstrumentType[];
    // Times where they are allowed to be placed (in beats)
    allowedTimes: number[];
    // Probability of a percussion hit occurring in one of the allowed times per bar
    probability: number;
    // Base weight for the percussion hit
    weight: number;
    // Optional: define a type for intellectual selection in the composer
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

export type BassPatternDefinition = {
    pattern: BassPattern;
    tags: string[];
};


/**
 * Returns the MIDI notes of a mode for a given mood across multiple octaves.
 * The scale now spans from E1 (MIDI 28) up to E4, providing a wide range for bass.
 */
export function getScaleForMood(mood: Mood): number[] {
  const E1 = 28;
  let baseScale: number[];

  if (mood === 'melancholic') {
    // E Dorian: E F# G A B C# D
    baseScale = [0, 2, 3, 5, 7, 9, 10];
  } else if (mood === 'epic') {
    // E Lydian: E F# G# A# B C# D#
    baseScale = [0, 2, 4, 6, 7, 9, 11];
  } else if (mood === 'dreamy') {
    // E Pentatonic: E G A B D
    baseScale = [0, 3, 5, 7, 10];
  } else { // 'dark' or default to E Minor
    // E Aeolian: E F# G A B C D
    baseScale = [0, 2, 3, 5, 7, 8, 10];
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


const defaultHitParams: BassSynthParams = { cutoff: 500, resonance: 0.2, distortion: 0.0, portamento: 0.0 };
const ALL_RIDES: InstrumentType[] = ['drum_ride', 'drum_a_ride1', 'drum_a_ride2', 'drum_a_ride3', 'drum_a_ride4'];
const AMBIENT_SNARES: InstrumentType[] = ['drum_snare_ghost_note', 'drum_snarepress', 'drum_snare_off'];
const AMBIENT_PERC: InstrumentType[] = [...PERCUSSION_SETS.ELECTRONIC, ...ALL_RIDES];


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
    // Fallback genres
    dark: { loops: [{ kick: [], snare: [], hihat: [], tags: ['ambient-pulse'] }] },
    dreamy: { loops: [{ kick: [], snare: [], hihat: [], tags: ['ambient-pulse'] }] },
    epic: { loops: [{ kick: [], snare: [], hihat: [], tags: ['rock-standard', 'ballad-simple'] }] },
};

export const STYLE_PERCUSSION_RULES: Record<Genre, PercussionRule> = {
    ambient: {
        types: PERCUSSION_SETS.ELECTRONIC,
        allowedTimes: [0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75],
        probability: 0.6, 
        weight: 0.3,
        type: 'electronic'
    },
    rock: {
        types: ['drum_crash', 'perc-005', 'drum_tom_high'],
        allowedTimes: [0, 1.75, 3.75],
        probability: 0.25, 
        weight: 0.7,
        type: 'acoustic'
    },
    house: {
        types: ['perc-003', 'perc-007', 'perc-009', 'hh_bark_short'],
        allowedTimes: [0.75, 1.25, 1.75, 2.75, 3.25, 3.75],
        probability: 0.6, 
        weight: 0.6,
        type: 'electronic'
    },
    trance: {
         types: ['perc-010', 'perc-012', 'hh_bark_short', 'perc-008'],
         allowedTimes: [0.75, 1.75, 2.75, 3.75],
         probability: 0.5, 
         weight: 0.5,
         type: 'electronic'
    },
    rnb: {
        types: ['perc-001', 'perc-004', 'perc-009', 'drum_tom_high', 'cymbal_bell2'],
        allowedTimes: [0.75, 2.25, 2.75, 3.25],
        probability: 0.65, 
        weight: 0.4,
        type: 'electronic'
    },
    ballad: {
       types: ['perc-013', 'perc-014', 'cymbal_bell1', 'drum_crash'],
       allowedTimes: [1.5, 3.5],
       probability: 0.45, 
       weight: 0.4,
       type: 'acoustic'
    },
    reggae: {
        types: ['drum_snare_off', 'perc-009', 'perc-001'],
        allowedTimes: [1, 3],
        probability: 0.8, 
        weight: 0.9,
        type: 'acoustic'
    },
    blues: {
        types: ['perc-002', 'hh_bark_short', 'drum_snare_ghost_note'],
        allowedTimes: [3.75],
        probability: 0.5, 
        weight: 0.3,
        type: 'acoustic'
    },
    celtic: {
        types: ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'perc-006', 'drum_snare_off'],
        allowedTimes: [0, 0.75, 1, 1.75, 2, 2.75, 3, 3.75],
        probability: 0.85, 
        weight: 0.8,
        type: 'acoustic'
    },
    progressive: {
        types: ['perc-008', 'perc-011', 'drum_tom_mid', 'drum_ride', 'cymbal_bell2'],
        allowedTimes: [0.75, 1.5, 2.5, 2.75, 3.5],
        probability: 0.6, 
        weight: 0.6,
        type: 'acoustic'
    },
    // Fallbacks
    dark: { types: PERCUSSION_SETS.DARK, allowedTimes: [1.25, 2.75], probability: 0.7, weight: 0.5, type: 'acoustic' },
    dreamy: { types: [], allowedTimes: [], probability: 0, weight: 0 },
    epic: { types: [], allowedTimes: [], probability: 0, weight: 0 },
};

// Bass Riff Library
export const STYLE_BASS_PATTERNS: Record<Genre, BassPatternDefinition[]> = {
    ambient: [
        { pattern: [{ note: 0, time: 0, duration: 4, technique: 'swell' }], tags: ['ambient-pulse'] },
        { pattern: [{ note: 0, time: 0, duration: 2, technique: 'swell' }, { note: 4, time: 2, duration: 2, technique: 'swell' }], tags: ['ambient-pulse'] },
        { pattern: Array.from({ length: 16 }, (_, i) => ({ note: 0, time: i * 0.25, duration: 0.25, technique: 'pluck' })), tags: ['ambient-pulse', 'pulsing'] },
        { pattern: Array.from({ length: 32 }, (_, i) => ({ note: 0, time: i * 0.125, duration: 0.125, technique: 'pluck' })), tags: ['ambient-pulse', 'pulsing'] },
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
    dark: [{ pattern: [{ note: 0, time: 0, duration: 4, technique: 'swell' }], tags:['ambient-pulse'] }],
    dreamy: [{ pattern: [{ note: 0, time: 0, duration: 4, technique: 'swell' }], tags:['ambient-pulse'] }],
    epic: [{ pattern: [{ note: 0, time: 0, duration: 2 }, { note: 4, time: 2, duration: 2 }], tags: ['ballad-simple'] }],
};
