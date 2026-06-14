
import type { FractalEvent } from '@/types/fractal';

// Helper type for defining a riff note pattern.
// Note is represented as semitones from the root of the chord.
type RiffNote = {
    note: number; // Semitones from root
    tick: number; // 0-11 for a 12/8 bar
    dur: number;  // in ticks
};

// Represents a 1-bar riff pattern.
type RiffPattern = RiffNote[];

// The library of 10 classic neutral/laid-back blues bass riffs.
// Each riff is an array of 1-bar patterns.
export const NEUTRAL_BLUES_BASS_RIFFS: RiffPattern[][] = [
    // 1) Laid-Back Pedal (2 bars)
    [
        [{ note: 0, tick: 0, dur: 12 }],
        [{ note: 0, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }]
    ],
    // 2) Two-Feel Shuffle (2 bars)
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 7, tick: 4, dur: 4 }, { note: 12, tick: 8, dur: 4 }],
        [{ note: 7, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }]
    ],
    // 3) Soul Walk Up (2 bars)
    [
        [{ note: 0, tick: 0, dur: 3 }, { note: 2, tick: 3, dur: 3 }, { note: 4, tick: 6, dur: 3 }, { note: 5, tick: 9, dur: 3 }],
        [{ note: 7, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 10, tick: 8, dur: 4 }]
    ],
    // 4) Octave Breathe (2 bars)
    [
        [{ note: 0, tick: 0, dur: 6 }, { note: 12, tick: 6, dur: 6 }],
        [{ note: 7, tick: 0, dur: 4 }, { note: 5, tick: 4, dur: 4 }, { note: 0, tick: 8, dur: 4 }]
    ],
    // 5) Plush Sixth (4 bars)
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }],
        [{ note: 0, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 12, tick: 8, dur: 4 }],
        [{ note: 5, tick: 0, dur: 4 }, { note: 7, tick: 4, dur: 4 }, { note: 9, tick: 8, dur: 4 }],
        [{ note: 7, tick: 0, dur: 4 }, { note: 5, tick: 4, dur: 4 }, { note: 0, tick: 8, dur: 4 }]
    ],
    // 6) West-Coast Glide (2 bars)
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 2, tick: 4, dur: 4 }, { note: 4, tick: 8, dur: 4 }],
        [{ note: 5, tick: 0, dur: 4 }, { note: 7, tick: 4, dur: 4 }, { note: 9, tick: 8, dur: 4 }]
    ],
    // 7) Gentle b7 Turn (2 bars)
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 10, tick: 4, dur: 4 }, { note: 0, tick: 8, dur: 4 }],
        [{ note: 7, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }]
    ],
    // 8) Soft b5 Touch (2 bars)
    [
        [{ note: 0, tick: 0, dur: 6 }, { note: 5, tick: 6, dur: 4 }, { note: 6, tick: 10, dur: 2 }],
        [{ note: 7, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }]
    ],
    // 9) Answer Climb (2 bars)
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 7, tick: 4, dur: 4 }, { note: 9, tick: 8, dur: 4 }],
        [{ note: 9, tick: 0, dur: 4 }, { note: 10, tick: 4, dur: 4 }, { note: 12, tick: 8, dur: 4 }]
    ],
    // 10) Slow Turn Calm (2 bars)
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 9, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }],
        [{ note: 0, tick: 0, dur: 12 }]
    ]
];
