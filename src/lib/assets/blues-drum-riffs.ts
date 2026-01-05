/**
 * #ЗАЧЕМ: Этот файл содержит оцифрованную библиотеку блюзовых барабанных битов,
 *          сгруппированных по настроениям. Он служит "ритмической картой" для
 *          FractalMusicEngine при генерации стилистически верных партий ударных.
 * #ЧТО: Экспортирует константу BLUES_DRUM_RIFFS, где каждый ключ — это настроение,
 *       а значение — массив битов, подходящих для этого настроения.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` функцией `generateDrumEvents`.
 */

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
    { K: [0, 6, 8], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11], OH: [5, 11] },
    { K: [0, 6, 10], SD: [3, 9], R: [3, 6, 9], HH: [0, 2, 6, 8] },
  ],
  enthusiastic: [
    { K: [0, 5, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
    { K: [0, 6, 8], SD: [3, 9], ghostSD: [2, 8], HH: [0, 2, 3, 5, 6, 8, 9, 11], OH: [11] },
    { K: [0, 6], SD: [3, 9], R: [3, 6, 9, 11] },
  ],
  contemplative: [ // Mapped from Neutral
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
    { K: [0, 6, 10], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11], T: [11] },
  ],
  dreamy: [
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 6, 8] },
    { K: [0, 6, 10], SD: [3, 9], R: [3, 9], HH: [0, 2, 6, 8] },
    { K: [0], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
  ],
  calm: [
    { K: [0, 6], SD: [9], HH: [0, 2, 6, 8] },
    { K: [0], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11], ghostSD: [2, 5, 8, 11] },
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
  ],
  melancholic: [
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
    { K: [0, 6, 10], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
    { K: [0, 6], SD: [3, 9], R: [6, 9], HH: [0, 2] },
  ],
  gloomy: [
    { K: [0, 8], SD: [9], HH: [0, 2, 6, 8] },
    { K: [0, 6], SD: [3, 9], HH: [0, 2, 3, 6, 8, 11] },
    { K: [0, 6], SD: [9], HH: [0, 2, 6, 8], T: [3, 11] },
  ],
  dark: [
    { K: [0, 6, 8], SD: [3, 9], HH: [0, 2, 3, 5, 6, 8, 9, 11] },
    { K: [0, 6], SD: [3, 9], T: [11], HH: [0, 2, 6, 8] },
    { K: [0, 6], SD: [3, 9], R: [3, 6, 9], HH: [0, 2] },
  ],
   // Fallbacks
  epic: [],
  anxious: [],
};

// Copy joyful to epic as a starting point
BLUES_DRUM_RIFFS.epic = BLUES_DRUM_RIFFS.joyful;

// Copy dark to anxious as a starting point
BLUES_DRUM_RIFFS.anxious = BLUES_DRUM_RIFFS.dark;
