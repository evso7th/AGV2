
import type { Mood } from '@/types/fractal';

export type BluesDrumPattern = {
  HH?: number[];
  OH?: number[];
  SD?: number[];
  K?: number[];
  R?: number[];
  T?: number[];
  ghostSD?: number[];
};

export type BluesDrumRiffs = Partial<Record<Mood, BluesDrumPattern[]>>;

// Transcribed from blues_drums_riffs.txt. Ticks are for a 12/8 measure.
export const BLUES_DRUM_RIFFS: BluesDrumRiffs = {
  joyful: [
    { K: [0, 6, 8], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat A
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11], OH: [5, 11] }, // Beat B
    { K: [0, 6, 10], SD: [3, 9], R: [3, 6, 9], HH: [0, 2, 6, 8] }, // Beat C
  ],
  enthusiastic: [
    { K: [0, 5, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat A
    { K: [0, 6, 8], SD: [3, 9], ghostSD: [2, 8], HH: [0, 2, 3, 5, 6, 8, 9, 11], OH: [11] }, // Beat B
    { K: [0, 6], SD: [3, 9], R: [3, 6, 9, 11] }, // Beat C
  ],
  contemplative: [ // Mapped from Neutral
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat A
    { K: [0, 6, 10], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat B
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11], T: [11] }, // Beat C
  ],
  dreamy: [
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 6, 8] }, // Beat A
    { K: [0, 6, 10], SD: [3, 9], R: [3, 9], HH: [0, 2, 6, 8] }, // Beat B
    { K: [0], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat C (brushes feel)
  ],
  calm: [
    { K: [0, 6], SD: [9], HH: [0, 2, 6, 8] }, // Beat A
    { K: [0], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11], ghostSD: [2, 5, 8, 11] }, // Beat B
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat C
  ],
  melancholic: [
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat A
    { K: [0, 6, 10], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat B
    { K: [0, 6], SD: [3, 9], R: [6, 9], HH: [0, 2] }, // Beat C
  ],
  gloomy: [
    { K: [0, 8], SD: [9], HH: [0, 2, 6, 8] }, // Beat A
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 6, 8, 11] }, // Beat B
    { K: [0, 6], SD: [9], HH: [0, 2, 6, 8], T: [3, 11] }, // Beat C
  ],
  dark: [
    { K: [0, 6, 8], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] }, // Beat A
    { K: [0, 6], SD: [3, 9], T: [11], HH: [0, 2, 6, 8] }, // Beat B
    { K: [0, 6], SD: [3, 9], R: [3, 6, 9], HH: [0, 2] }, // Beat C
  ],
};
