
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

// The library of 10 classic blues bass riffs, transcribed from blues_riff.txt.
// Each riff is an array of 1-bar patterns.
export const BLUES_BASS_RIFFS: RiffPattern[][] = [
    // 1) Swamp Drone (2 bars, мрачно-минорный "стон") - Stretched to 2 bars for breathing room
    [
        [{ note: 0, tick: 0, dur: 12 }], // Bar 1: Root (long note)
        [{ note: 0, tick: 0, dur: 3 }, { note: 3, tick: 3, dur: 3 }, { note: 5, tick: 6, dur: 3 }, { note: 6, tick: 9, dur: 3 }] // Bar 2: R-b3-4-b5
    ],
    // 2) Boogie Graveyard (stretched to 4 bars)
    [
        [{ note: 0, tick: 0, dur: 6 }, { note: 7, tick: 6, dur: 6 }], // Bar 1: R, 5
        [{ note: 9, tick: 0, dur: 6 }, { note: 10, tick: 6, dur: 6 }],// Bar 2: 6, b7
        [{ note: 9, tick: 0, dur: 6 }, { note: 7, tick: 6, dur: 6 }], // Bar 3: 6, 5
        [{ note: 6, tick: 0, dur: 4 }, { note: 5, tick: 4, dur: 4 }, { note: 3, tick: 8, dur: 4 }]  // Bar 4: b5, 4, b3
    ],
    // 3) Chromatic Creep (stretched to 4 bars)
    [
        [{ note: 7, tick: 0, dur: 6 }, { note: 8, tick: 6, dur: 6 }], // Bar 1: 5, #5
        [{ note: 9, tick: 0, dur: 6 }, { note: 10, tick: 6, dur: 6 }],// Bar 2: 6, b7
        [{ note: 9, tick: 0, dur: 6 }, { note: 7, tick: 6, dur: 6 }], // Bar 3: 6, 5
        [{ note: 5, tick: 0, dur: 4 }, { note: 6, tick: 4, dur: 4 }, { note: 3, tick: 8, dur: 4 }]  // Bar 4: 4, b5, b3
    ],
    // 4) Octave Moan (2 такта, октавы и квинты) - Kept as is, already sparse
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 12, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }], // Bar 1: R, R+8ve, 5
        [{ note: 12, tick: 0, dur: 4 }, { note: 10, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }]  // Bar 2: R+8ve, b7, 5
    ],
    // 5) Shuffle Hammer (2 bars - simplified from 4)
    [
        [{ note: 0, tick: 0, dur: 4 }, { note: 0, tick: 4, dur: 4 }, { note: 7, tick: 8, dur: 4 }], // Bar 1: R, R, 5
        [{ note: 2, tick: 0, dur: 2 }, { note: 3, tick: 2, dur: 2 }, { note: 4, tick: 4, dur: 2 }, { note: 5, tick: 6, dur: 2 }, { note: 6, tick: 8, dur: 2 }, { note: 7, tick: 10, dur: 2 }] // Bar 2 (turn-around): 2-b3-3-4-#4-5
    ],
    // 6) Delta Crawl (2 такта, редкие "тяжёлые" ноты) - Kept as is
    [
        [{ note: 0, tick: 0, dur: 6 }, { note: 10, tick: 6, dur: 6 }], // Bar 1: R, b7
        [{ note: 0, tick: 0, dur: 4 }, { note: 5, tick: 4, dur: 4 }, { note: 3, tick: 8, dur: 4 }] // Bar 2: R, 4, b3
    ],
    // 7) Detroit Drive (stretched to 4 bars)
    [
        [{ note: 0, tick: 0, dur: 6 }, { note: 7, tick: 6, dur: 6 }], // Bar 1: R, 5
        [{ note: 9, tick: 0, dur: 6 }, { note: 10, tick: 6, dur: 6 }],// Bar 2: 6, b7
        [{ note: 9, tick: 0, dur: 6 }, { note: 7, tick: 6, dur: 6 }], // Bar 3: 6, 5
        [{ note: 5, tick: 0, dur: 6 }, { note: 3, tick: 6, dur: 6 }]  // Bar 4: 4, b3
    ],
    // 8) Minor Howl (2 такта, минорный ход с b5 и октавой) - Kept as is
    [
        [{ note: 0, tick: 0, dur: 2 }, { note: 3, tick: 2, dur: 2 }, { note: 5, tick: 4, dur: 2 }, { note: 6, tick: 6, dur: 2 }, { note: 7, tick: 8, dur: 2 }, { note: 3, tick: 10, dur: 2 }], // Bar 1: R-b3-4-#4-5-b3
        [{ note: 0, tick: 0, dur: 2 }, { note: 12, tick: 2, dur: 2 }, { note: 10, tick: 4, dur: 2 }, { note: 7, tick: 6, dur: 2 }, { note: 3, tick: 8, dur: 2 }, { note: 0, tick: 10, dur: 2 }]  // Bar 2: R-R+8ve-b7-5-b3-R
    ],
    // 9) Low Turn (1 такт, "низкий" turnaround для 12-го бара)
    [
        [{ note: 0, tick: 0, dur: 2 }, { note: 10, tick: 2, dur: 2 }, { note: 9, tick: 4, dur: 2 }, { note: 8, tick: 6, dur: 2 }, { note: 7, tick: 8, dur: 2 }, { note: 6, tick: 10, dur: 2 }] // R-b7-6-b6-5-#4
    ],
    // 10) V-Prep Tension (1 такт, "натяжение" к V)
    [
        [{ note: 2, tick: 0, dur: 2 }, { note: 3, tick: 2, dur: 2 }, { note: 4, tick: 4, dur: 2 }, { note: 5, tick: 6, dur: 2 }, { note: 6, tick: 8, dur: 2 }, { note: 7, tick: 10, dur: 2 }] // 2-b3-3-4-#4-5
    ]
];
