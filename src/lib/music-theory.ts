
// src/lib/music-theory.ts
import type { Mood, Genre, FractalEvent, BassSynthParams, InstrumentType } from '@/types/fractal';

type DrumPatternEvent = {
    type: InstrumentType | InstrumentType[];
    time: number;
    duration: number;
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


/**
 * Возвращает ноты лада в MIDI для заданного настроения.
 * Все ноты начинаются с E2 (MIDI 40).
 */
export function getScaleForMood(mood: Mood): number[] {
  const E2 = 40; // E2
  if (mood === 'melancholic') {
    // E Dorian: E F# G A B C# D
    return [E2, E2+2, E2+3, E2+5, E2+7, E2+9, E2+10];
  }
   if (mood === 'epic') {
    // E Lydian: E F# G# A# B C# D#
    return [E2, E2+2, E2+4, E2+6, E2+7, E2+9, E2+11];
  }
  if (mood === 'dreamy') {
    // E Pentatonic: E G A B D
    return [E2, E2+3, E2+5, E2+7, E2+10];
  }
  // По умолчанию — E Minor
  return [E2, E2+2, E2+3, E2+5, E2+7, E2+8, E2+10]; // E Aeolian
}


const defaultHitParams: BassSynthParams = { cutoff: 500, resonance: 0.2, distortion: 0.0, portamento: 0.0 };

// Rhythmic Grammar Library
export const STYLE_DRUM_PATTERNS: Record<Genre, GenreRhythmGrammar> = {
    ambient: {
        loops: [
            { // Sparse pattern
                kick: [{ type: 'drum_kick', time: 0, duration: 4, weight: 0.6 }],
                snare: [],
                hihat: [{ type: ['drum_hihat_closed', 'perc-008'], probabilities: [0.7, 0.3], time: 1.5, duration: 0.5, weight: 0.3 }],
            }
        ],
        percussion: {
            types: ['perc-011', 'perc-007', 'drum_ride'],
            allowedTimes: [1.75, 2.5, 3.25],
            probability: 0.3,
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
            probability: 0.15, // Crash hits infrequently
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
            probability: 0.5,
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
             probability: 0.4,
             weight: 0.5
        }
    },
    rnb: {
        loops: [
            { // "Limping" kick, snare on 2 and 4
                kick: [
                    { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
                    { type: 'drum_kick', time: 1.75, duration: 0.25, weight: 0.8 },
                ],
                snare: [
                    { type: ['drum_snare', 'drum_snare_ghost_note'], probabilities: [0.8, 0.2], time: 1, duration: 0.25, weight: 0.9 },
                    { type: 'drum_snare', time: 3, duration: 0.25, weight: 1.0 },
                ],
                hihat: [
                    { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.6},
                    { type: 'drum_hihat_closed', time: 2.5, duration: 0.5, weight: 0.6},
                    { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.6},
                ]
            }
        ],
        percussion: {
            types: ['perc-001', 'perc-004', 'perc-009'],
            allowedTimes: [0.75, 2.25, 2.75, 3.25],
            probability: 0.6,
            weight: 0.4
        }
    },
    ballad: {
       loops: [
           {
                kick: [{ type: 'drum_kick', time: 0, duration: 1, weight: 0.8 }],
                snare: [{ type: 'drum_snare', time: 2, duration: 1, weight: 0.7 }],
                hihat: [
                     { type: 'drum_ride', time: 0, duration: 0.5, weight: 0.5},
                     { type: 'drum_ride', time: 1, duration: 0.5, weight: 0.5},
                     { type: 'drum_ride', time: 2, duration: 0.5, weight: 0.5},
                     { type: 'drum_ride', time: 3, duration: 0.5, weight: 0.5},
                ]
           }
       ],
       percussion: {
           types: ['perc-013', 'perc-014'],
           allowedTimes: [1.5, 3.5],
           probability: 0.4,
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
            probability: 0.7,
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
            types: ['perc-002'],
            allowedTimes: [3.75],
            probability: 0.4,
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
            probability: 0.8,
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
            probability: 0.5,
            weight: 0.6
        }
    },
    // Fallback genres
    dark: { loops: [], percussion: { types: [], allowedTimes: [], probability: 0, weight: 0 } },
    dreamy: { loops: [], percussion: { types: [], allowedTimes: [], probability: 0, weight: 0 } },
    epic: { loops: [], percussion: { types: [], allowedTimes: [], probability: 0, weight: 0 } },
};
    
