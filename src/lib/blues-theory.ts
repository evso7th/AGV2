/**
 * @fileOverview THE BLUES CODEX (v1.0)
 * #ЗАЧЕМ: Централизованная библиотека законов блюза. 
 * #ЧТО: Содержит шкалы, прогрессии, правила разрешения и когнитивные маппинги.
 * #СВЯЗИ: Используется в blues-brain.ts и music-theory.ts.
 */

import { calculateMusiNum } from './music-theory';

// --- CORE SCALES ---
// Blue Pentatonic: 1, b3, 4, b5, 5, b7
export const BLUES_SCALE_DEGREES = [0, 3, 5, 6, 7, 10];

export const DEGREE_TO_SEMITONE: Record<string, number> = {
    'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7,
    'b6': 8, '6': 9, 'b7': 10, '7': 11, 'R+8': 12, '9': 14, '11': 17
};

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
