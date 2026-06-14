import type { FractalEvent } from '@/types/fractal';

// Этот рифф основан на партитуре, которую вы предоставили.
// Он записан для гитары в тональности Ми-минор (E minor)
// и использует характерные для рок-музыки интервалы.
export const PARANOID_STYLE_RIFF: Omit<FractalEvent, 'type' | 'weight' | 'technique' | 'dynamics' | 'phrasing' | 'params'>[] = [
  // Bar 1
  { note: 64, time: 0, duration: 0.5 },    // E5
  { note: 59, time: 0.5, duration: 0.5 },  // B4
  { note: 62, time: 1, duration: 0.5 },    // D5
  { note: 59, time: 1.5, duration: 0.5 },  // B4
  { note: 61, time: 2, duration: 0.5 },    // C#5
  { note: 59, time: 2.5, duration: 0.5 },  // B4
  { note: 62, time: 3, duration: 0.5 },    // D5
  { note: 59, time: 3.5, duration: 0.5 },  // B4
  // Bar 2
  { note: 64, time: 4, duration: 0.5 },    // E5
  { note: 59, time: 4.5, duration: 0.5 },  // B4
  { note: 62, time: 5, duration: 0.5 },    // D5
  { note: 58, time: 5.5, duration: 0.5 },  // A#4
  { note: 61, time: 6, duration: 0.5 },    // C#5
  { note: 58, time: 6.5, duration: 0.5 },  // A#4
  { note: 62, time: 7, duration: 0.5 },    // D5
  { note: 58, time: 7.5, duration: 0.5 },  // A#4
  // Bar 3
  { note: 64, time: 8, duration: 0.5 },    // E5
  { note: 59, time: 8.5, duration: 0.5 },  // B4
  { note: 62, time: 9, duration: 0.5 },    // D5
  { note: 59, time: 9.5, duration: 0.5 },  // B4
  { note: 61, time: 10, duration: 0.5 },   // C#5
  { note: 59, time: 10.5, duration: 0.5 }, // B4
  { note: 62, time: 11, duration: 0.5 },   // D5
  { note: 59, time: 11.5, duration: 0.5 }, // B4
  // Bar 4
  { note: 64, time: 12, duration: 0.5 },   // E5
  { note: 61, time: 12.5, duration: 0.5 }, // C#5
  { note: 59, time: 13, duration: 0.5 },   // B4
  { note: 57, time: 13.5, duration: 0.5 }, // A4
  { note: 56, time: 14, duration: 0.5 },   // G#4
  { note: 57, time: 14.5, duration: 0.5 }, // A4
  { note: 59, time: 15, duration: 0.5 },   // B4
  { note: 57, time: 15.5, duration: 0.5 }, // A4
  // Bar 5
  { note: 64, time: 16, duration: 0.5 },   // E5
  { note: 61, time: 16.5, duration: 0.5 }, // C#5
  { note: 59, time: 17, duration: 0.5 },   // B4
  { note: 58, time: 17.5, duration: 0.5 }, // A#4
  { note: 56, time: 18, duration: 0.5 },   // G#4
  { note: 58, time: 18.5, duration: 0.5 }, // A#4
  { note: 59, time: 19, duration: 0.5 },   // B4
  { note: 58, time: 19.5, duration: 0.5 }, // A#4
  // Bar 6
  { note: 64, time: 20, duration: 0.5 },   // E5
  { note: 61, time: 20.5, duration: 0.5 }, // C#5
  { note: 59, time: 21, duration: 0.5 },   // B4
  { note: 57, time: 21.5, duration: 0.5 }, // A4
  { note: 56, time: 22, duration: 0.5 },   // G#4
  { note: 57, time: 22.5, duration: 0.5 }, // A4
  { note: 59, time: 23, duration: 0.5 },   // B4
  { note: 57, time: 23.5, duration: 0.5 }, // A4
  // Bar 7
  { note: 64, time: 24, duration: 0.5 },   // E5
  { note: 59, time: 24.5, duration: 0.5 }, // B4
  { note: 57, time: 25, duration: 0.5 },   // A4
  { note: 56, time: 25.5, duration: 0.5 }, // G#4
  { note: 57, time: 26, duration: 0.5 },   // A4
  { note: 59, time: 26.5, duration: 0.5 }, // B4
  { note: 57, time: 27, duration: 0.5 },   // A4
  { note: 56, time: 27.5, duration: 0.5 }, // G#4
  // Bar 8
  { note: 64, time: 28, duration: 0.5 },   // E5
  { note: 59, time: 28.5, duration: 0.5 }, // B4
  { note: 57, time: 29, duration: 0.5 },   // A4
  { note: 56, time: 29.5, duration: 0.5 }, // G#4
  { note: 57, time: 30, duration: 0.5 },   // A4
  { note: 59, time: 30.5, duration: 0.5 }, // B4
  { note: 61, time: 31, duration: 0.5 },   // C#5
  { note: 59, time: 31.5, duration: 0.5 }, // B4
  // Bar 9
  { note: 64, time: 32, duration: 0.5 },   // E5
  { note: 59, time: 32.5, duration: 0.5 }, // B4
  { note: 62, time: 33, duration: 0.5 },   // D5
  { note: 59, time: 33.5, duration: 0.5 }, // B4
  { note: 61, time: 34, duration: 0.5 },   // C#5
  { note: 59, time: 34.5, duration: 0.5 }, // B4
  { note: 62, time: 35, duration: 0.5 },   // D5
  { note: 59, time: 35.5, duration: 0.5 }, // B4
];
