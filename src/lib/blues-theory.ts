/**
 * @fileOverview THE BLUES CODEX (v1.1)
 * #ЗАЧЕМ: Централизованная библиотека законов блюза. 
 * #ОБНОВЛЕНО (ПЛАН №455): Универсальные константы теперь импортируются из music-theory.ts.
 */

import { calculateMusiNum, DEGREE_TO_SEMITONE } from './music-theory';

// Re-export for consistency
export { DEGREE_TO_SEMITONE };

// --- CORE SCALES ---
// Blue Pentatonic: 1, b3, 4, b5, 5, b7
export const BLUES_SCALE_DEGREES = [0, 3, 5, 6, 7, 10];

// --- PROGRESSIONS ---
// Classic 12-bar offsets
export const BLUES_PROGRESSION_OFFSETS = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];

/**
 * #ЗАЧЕМ: Определение "следующей станции" для баса.
 */
export function getNextChordRoot(barIndex: number, rootNote: number): number {
    const nextBar = (barIndex + 1) % 12;
    return rootNote + BLUES_PROGRESSION_OFFSETS[nextBar];
}

/**
 * #ЗАЧЕМ: Сопоставление такта с блюзовой гармонией.
 */
export function getChordNameForBar(barIndex: number): string {
    const progression = ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'v7', 'iv7', 'i7', 'v7'];
    return progression[barIndex % 12];
}

/**
 * #ЗАЧЕМ: Закон Разрешения Блюзовой Ноты.
 */
export function resolveBlueNote(pitch: number, root: number): number {
    return Math.random() < 0.75 ? root + 7 : root + 3;
}

/**
 * #ЗАЧЕМ: Определение Династии ликов на основе ДНК сюиты.
 */
export function getDynastyForMood(mood: string, seed: number): string {
    const dynasties = ['soul', 'texas', 'king', 'detroit', 'chromatic', 'slow-burn'];
    const idx = Math.abs(Math.floor(seed)) % dynasties.length;
    return dynasties[idx];
}
