// src/lib/assets/guitar-patterns.ts

/**
 * #ЗАЧЕМ: Этот файл хранит определения гитарных паттернов (перебор и бой).
 * #ЧТО: Экспортирует объект GUITAR_PATTERNS, который является "нотной записью"
 *       для различных техник игры.
 * #СВЯЗИ: Используется гитарными сэмплерами (`TelecasterGuitarSampler`, `BlackGuitarSampler`)
 *         для генерации последовательностей нот на основе команд из движка.
 */

// Индексы в массиве `pattern` соответствуют струнам аккордовой формы (voicings)
// 0: самая низкая нота (бас), 5: самая высокая.
export type GuitarPattern = {
    // ticks: моменты времени в долях 12/8 (0-11)
    // stringIndices: массив индексов струн для проигрывания в данный момент времени
    pattern: { ticks: number[]; stringIndices: number[] }[];
    // rollDuration: "дребезг" при ударе по струнам, в тиках
    rollDuration: number;
};

export const GUITAR_PATTERNS: Record<string, GuitarPattern> = {
    // Travis Picking
    F_TRAVIS: {
        pattern: [
            { ticks: [0], stringIndices: [0] },      // Бас
            { ticks: [3], stringIndices: [3] },      // Струна 3
            { ticks: [5], stringIndices: [2] },      // Струна 2
            { ticks: [6], stringIndices: [1] },      // Струна 1
            { ticks: [9], stringIndices: [3] },      // Струна 3
            { ticks: [11], stringIndices: [2] },     // Струна 2
        ],
        rollDuration: 0, // Нет "дребезга", т.к. это перебор
    },
    // Slow Arpeggio Roll
    F_ROLL12: {
        pattern: [
            { ticks: [0], stringIndices: [0] },
            { ticks: [2], stringIndices: [1] },
            { ticks: [4], stringIndices: [2] },
            { ticks: [6], stringIndices: [3] },
            { ticks: [8], stringIndices: [4] },
            { ticks: [10], stringIndices: [5] },
        ],
        rollDuration: 1, // Легкий "дребезг"
    },
    // Blues/Swing Strum
    S_SWING: {
        pattern: [
            { ticks: [0], stringIndices: [0, 1, 2, 3, 4, 5] }, // Downstroke
            { ticks: [10], stringIndices: [5, 4, 3] },          // Upstroke
        ],
        rollDuration: 1, // Короткий "дребезг"
    },
    // Four-on-the-floor Strum
    S_4DOWN: {
        pattern: [
            { ticks: [0], stringIndices: [0, 1, 2, 3, 4, 5] },
            { ticks: [3], stringIndices: [0, 1, 2, 3, 4, 5] },
            { ticks: [6], stringIndices: [0, 1, 2, 3, 4, 5] },
            { ticks: [9], stringIndices: [0, 1, 2, 3, 4, 5] },
        ],
        rollDuration: 1,
    }
};
