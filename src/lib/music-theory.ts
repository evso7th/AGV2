
// src/lib/music-theory.ts
import type { Mood, Genre, Technique, BassSynthParams, InstrumentType } from '@/types/fractal';

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
};

type PercussionRule = {
    // Instruments to choose from
    types: InstrumentType[];
    // Times where they are allowed to be placed (in beats)
    allowedTimes: number[];
    // Probability of a percussion hit occurring in one of the allowed times per bar
    probability: number;
    // Base weight for the percussion hit
    weight: number;
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

// Rhythmic Grammar Library for Drums
export const STYLE_DRUM_PATTERNS: Record<Genre, GenreRhythmGrammar> = {
    ambient: {
        loops: [
            { // More atmospheric and pulsing ambient beat
                kick: [
                    { type: 'drum_kick', time: 0, duration: 1, weight: 0.7, probability: 0.9 },
                    { type: 'drum_kick', time: 2.5, duration: 0.5, weight: 0.4, probability: 0.6 }
                ],
                snare: [
                    { type: 'drum_snare_ghost_note', time: 3.5, duration: 0.25, weight: 0.3, probability: 0.7 }
                ],
                hihat: [
                    { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.4, probability: 0.5 },
                    { type: 'drum_hihat_closed', time: 1.5, duration: 0.5, weight: 0.4, probability: 0.5 },
                    { type: 'drum_hihat_open', time: 2, duration: 1, weight: 0.3, probability: 0.4 },
                    { type: 'drum_hihat_closed', time: 3, duration: 0.5, weight: 0.2, probability: 0.6 }
                ],
            }
        ],
        percussion: {
            types: ['perc-013', 'drum_ride', 'perc-001', 'perc-002', 'perc-005', 'perc-006', 'perc-014', 'perc-015'],
            allowedTimes: [1.75, 2.5, 3.25],
            probability: 0.4, 
            weight: 0.25
        }
    },
    rock: {
        loops: [
            { // Classic rock beat
                kick: [{ type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 }, { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 }],
                snare: [{ type: 'drum_snare', time: 1, duration: 0.25, weight: 1.0 }, { type: 'drum_snare', time: 3, duration: 0.25, weight: 1.0 }],
                hihat: [
                    { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.6 },
                    { type: 'drum_hihat_closed', time: 1.5, duration: 0.5, weight: 0.6 },
                    { type: 'drum_hihat_closed', time: 2.5, duration: 0.5, weight: 0.6 },
                    { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.6 },
                ]
            }
        ],
        percussion: {
            types: ['drum_crash'],
            allowedTimes: [0],
            probability: 0.25, 
            weight: 0.7
        }
    },
    house: {
        loops: [
            { // Four-on-the-floor
                kick: [
                    { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 1, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 3, duration: 0.25, weight: 1.0 },
                ],
                snare: [
                    { type: 'drum_snare', time: 1, duration: 0.25, weight: 0.9 },
                    { type: 'drum_snare', time: 3, duration: 0.25, weight: 0.9 },
                ],
                hihat: [
                    { type: 'drum_hihat_open', time: 0.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_open', time: 1.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_open', time: 2.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_open', time: 3.5, duration: 0.5, weight: 0.8 },
                ]
            }
        ],
        percussion: {
            types: ['perc-003', 'perc-007'],
            allowedTimes: [1.75, 3.25],
            probability: 0.6, 
            weight: 0.6
        }
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
                    { type: 'drum_snare', time: 2, duration: 0.25, weight: 0.9, probability: 0.5 }, // Snare on 3rd beat
                ],
                hihat: [
                    { type: 'drum_hihat_open', time: 0.5, duration: 0.25, weight: 0.7 },
                    { type: 'drum_hihat_open', time: 1.5, duration: 0.25, weight: 0.7 },
                    { type: 'drum_hihat_open', time: 2.5, duration: 0.25, weight: 0.7 },
                    { type: 'drum_hihat_open', time: 3.5, duration: 0.25, weight: 0.7 },
                ]
             }
        ],
        percussion: {
             types: ['perc-010', 'perc-012'],
             allowedTimes: [0.75, 1.75, 2.75, 3.75],
             probability: 0.5, 
             weight: 0.5
        }
    },
    rnb: {
        loops: [
            { // "Limping" kick, snare on 2 and 4
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
                    { type: 'drum_hihat_closed', time: 2.5, duration: 0.5, weight: 0.6},
                    { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.6, probability: 0.7 },
                ]
            }
        ],
        percussion: {
            types: ['perc-001', 'perc-004', 'perc-009', 'drum_tom_high'],
            allowedTimes: [0.75, 2.25, 2.75, 3.25],
            probability: 0.65, 
            weight: 0.4
        }
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
                ]
           }
       ],
       percussion: {
           types: ['perc-013', 'perc-014', 'cymbal_bell1'],
           allowedTimes: [1.5, 3.5],
           probability: 0.45, 
           weight: 0.4
       }
    },
    reggae: {
        loops: [
            { // One drop
                kick: [],
                snare: [{ type: 'drum_kick', time: 2, duration: 0.5, weight: 1.0 }], // Kick and snare together
                hihat: [
                    { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_closed', time: 1.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_closed', time: 2.5, duration: 0.5, weight: 0.8 },
                    { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.8 },
                ]
            }
        ],
        percussion: {
            types: ['drum_snare_off', 'perc-009'],
            allowedTimes: [1, 3],
            probability: 0.8, 
            weight: 0.9,
        }
    },
    blues: {
        loops: [
            { // Shuffle feel
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
                ]
            }
        ],
        percussion: {
            types: ['perc-002', 'hh_bark_short'],
            allowedTimes: [3.75],
            probability: 0.5, 
            weight: 0.3
        }
    },
    celtic: {
        loops: [
            {
                kick: [],
                snare: [],
                hihat: [],
            }
        ],
        percussion: {
            types: ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high'],
            allowedTimes: [0, 0.75, 1, 1.75, 2, 2.75, 3, 3.75],
            probability: 0.85, 
            weight: 0.8
        }
    },
    progressive: {
        loops: [
            {
                kick: [{ type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 }],
                snare: [{ type: 'drum_snare', time: 1, duration: 0.25, weight: 1.0 }, { type: 'drum_snare', time: 3, duration: 0.25, weight: 1.0 }],
                hihat: []
            }
        ],
        percussion: {
            types: ['perc-008', 'perc-011', 'drum_tom_mid'],
            allowedTimes: [0.75, 1.5, 2.75, 3.5],
            probability: 0.6, 
            weight: 0.6
        }
    },
    // Fallback genres
    dark: { loops: [], percussion: { types: [], allowedTimes: [], probability: 0, weight: 0 } },
    dreamy: { loops: [], percussion: { types: [], allowedTimes: [], probability: 0, weight: 0 } },
    epic: { loops: [], percussion: { types: [], allowedTimes: [], probability: 0, weight: 0 } },
};

// Bass Riff Library
export const STYLE_BASS_PATTERNS: Record<Genre, BassPattern[]> = {
    ambient: [
        [{ note: 0, time: 0, duration: 4 }], // One long note
        [{ note: 0, time: 0, duration: 2 }, { note: 4, time: 2, duration: 2 }], // Root -> Fifth
    ],
    rock: [
        [{ note: 0, time: 0, duration: 0.5 }, { note: 0, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 0, time: 1.5, duration: 0.5 }, { note: 0, time: 2, duration: 0.5 }, { note: 0, time: 2.5, duration: 0.5 }, { note: 0, time: 3, duration: 0.5 }, { note: 0, time: 3.5, duration: 0.5 }], // Straight eighths
        [{ note: 0, time: 0, duration: 1 }, { note: 2, time: 2, duration: 1 }, { note: 4, time: 3, duration: 1 }], // Basic rock riff
    ],
    house: [
        [{ note: 0, time: 0, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 0, time: 2, duration: 0.5 }, { note: 0, time: 3, duration: 0.5 }], // Four on the floor root
        [{ note: 0, time: 0, duration: 0.5 }, { note: 7, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 7, time: 1.5, duration: 0.5 }, { note: 0, time: 2, duration: 0.5 }, { note: 7, time: 2.5, duration: 0.5 }, { note: 0, time: 3, duration: 0.5 }, { note: 7, time: 3.5, duration: 0.5 }], // Octave jumping
    ],
    trance: [
        [{ note: 0, time: 0, duration: 0.5 }, { note: 0, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 0, time: 1.5, duration: 0.5 }, { note: 0, time: 2, duration: 0.5 }, { note: 0, time: 2.5, duration: 0.5 }, { note: 0, time: 3, duration: 0.5 }, { note: 0, time: 3.5, duration: 0.5 }], // Driving eighths
        [{ note: 0, time: 0, duration: 0.25 }, { note: 0, time: 0.75, duration: 0.25 }, { note: 0, time: 1.5, duration: 0.25 }, { note: 0, time: 2.25, duration: 0.25 }, { note: 0, time: 3, duration: 0.25 }, { note: 0, time: 3.75, duration: 0.25 }], // Syncopated 16ths
    ],
    rnb: [
        [{ note: 0, time: 0, duration: 1.5 }, { note: 4, time: 1.5, duration: 0.5 }, { note: 2, time: 2, duration: 1.5 }, { note: 0, time: 3.5, duration: 0.5, technique: 'ghost' }],
        [{ note: 0, time: 0, duration: 1 }, { note: 2, time: 1.75, duration: 0.75 }, { note: -1, time: 2.5, duration: 0.5 }, { note: 0, time: 3.25, duration: 0.75 }],
    ],
    ballad: [
        [{ note: 0, time: 0, duration: 3 }, { note: 4, time: 3, duration: 1 }],
        [{ note: 0, time: 0, duration: 2 }, { note: 2, time: 2, duration: 2 }],
    ],
    reggae: [
        [{ note: 0, time: 1, duration: 1 }, { note: 0, time: 3, duration: 1, technique: 'ghost' }],
        [{ note: 0, time: 2.5, duration: 1.5 }],
    ],
    blues: [
        [{ note: 0, time: 0, duration: 1 }, { note: 2, time: 1, duration: 1 }, { note: 4, time: 2, duration: 1 }, { note: 5, time: 3, duration: 1 }], // Walking
        [{ note: 0, time: 0, duration: 0.66 }, { note: 2, time: 0.66, duration: 0.33 }, { note: 4, time: 1, duration: 0.66 }, { note: 2, time: 1.66, duration: 0.33 }], // Shuffle
    ],
    celtic: [
        [{ note: 0, time: 0, duration: 1 }, { note: 4, time: 2, duration: 1 }],
        [{ note: 0, time: 0, duration: 0.5 }, { note: 7, time: 0.5, duration: 0.5 }, { note: 0, time: 1, duration: 0.5 }, { note: 7, time: 1.5, duration: 0.5 }],
    ],
    progressive: [
        [{ note: 0, time: 0, duration: 0.75 }, { note: 0, time: 0.75, duration: 0.25 }, { note: 2, time: 1, duration: 1 }, { note: -1, time: 2.5, duration: 1.5 }],
    ],
    dark: [[{ note: 0, time: 0, duration: 4 }]],
    dreamy: [[{ note: 0, time: 0, duration: 4 }]],
    epic: [[{ note: 0, time: 0, duration: 2 }, { note: 4, time: 2, duration: 2 }]],
};
