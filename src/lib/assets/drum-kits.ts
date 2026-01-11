/**
 * #ЗАЧЕМ: Этот файл — центральный "Арсенал Барабанщика". Он декларативно описывает,
 *          какие именно сэмплы ударных доступны для каждого жанра и настроения.
 * #ЧТО: Экспортирует константу DRUM_KITS, которая является единым источником правды
 *       для состава всех ударных установок в приложении.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` и `music-theory.ts` для генерации
 *          стилистически и технически корректных партий ударных.
 */

import type { DrumKit, DrumKitLibrary, InstrumentType } from '@/types/fractal';

// --- БАЗОВЫЕ НАБОРЫ СЭМПЛОВ ДЛЯ ПЕРЕИСПОЛЬЗОВАНИЯ ---

const ALL_KICKS: InstrumentType[] = ['drum_kick'];
const ALL_SNARES: InstrumentType[] = ['drum_snare', 'drum_snare_ghost_note', 'drum_snare_off', 'drum_snarepress'];
const ALL_HIHATS: InstrumentType[] = ['drum_hihat_closed', 'drum_hihat_open', 'hh_bark_short'];
const ALL_RIDES: InstrumentType[] = ['drum_ride', 'drum_a_ride1', 'drum_a_ride2', 'drum_a_ride3', 'drum_a_ride4'];
const ALL_CRASHES: InstrumentType[] = ['drum_crash', 'cymbal1', 'cymbal2', 'cymbal3', 'cymbal4'];
const ALL_TOMS: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high'];
const ALL_PERC: InstrumentType[] = [
    ...ALL_TOMS, 'cymbal_bell1',
    'perc-001', 'perc-002', 'perc-003', 'perc-004', 'perc-005', 'perc-006', 'perc-007',
    'perc-008', 'perc-009', 'perc-010', 'perc-011', 'perc-012', 'perc-013', 'perc-014', 'perc-015'
];
const BRUSHES: InstrumentType[] = ['drum_brush1', 'drum_brush2', 'drum_brush3', 'drum_brush4'];

// --- БИБЛИОТЕКА УДАРНЫХ УСТАНОВОК ---

export const DRUM_KITS: DrumKitLibrary = {
    // =========================================================================
    // AMBIENT KITS
    // =========================================================================
    ambient: {
        // "Безопасный" кит для всех интро. НЕТ крэшей, НЕТ райдов.
        intro: {
            kick: ['drum_kick'],
            snare: ['drum_snare_ghost_note'],
            hihat: ['drum_hihat_closed'],
            ride: [], // ПУСТО
            crash: [], // ПУСТО
            perc: ['drum_tom_low', 'perc-013', 'perc-015']
        },
        // Кит для спокойного эмбиента
        calm: {
            kick: ['drum_kick'],
            snare: ['drum_snare_ghost_note', 'drum_snarepress'],
            hihat: ['drum_hihat_closed'],
            ride: ['drum_ride'],
            crash: [], // Без крэшей для спокойствия
            perc: ['perc-001', 'perc-005', 'perc-013', 'cymbal_bell1']
        },
        // Кит для темного эмбиента
        dark: {
            kick: ['drum_kick'],
            snare: ['drum_snare_off'],
            hihat: [], // Без хэтов, только перкуссия
            ride: [],
            crash: ['drum_crash'], // Редкий, гулкий крэш
            perc: ['drum_tom_low', 'perc-007', 'perc-015']
        }
        // Другие настроения для ambient можно добавить здесь
    },

    // =========================================================================
    // BLUES KITS
    // =========================================================================
    blues: {
        // Стандартный кит для чикагского шаффла
        contemplative: { // Используем neutral/contemplative как базу
            kick: ALL_KICKS,
            snare: ALL_SNARES,
            hihat: ALL_HIHATS,
            ride: ALL_RIDES,
            crash: ['drum_crash'],
            perc: ['drum_tom_mid', 'drum_tom_low']
        },
        // Кит для медленного, меланхоличного блюза
        melancholic: {
            kick: ALL_KICKS,
            snare: ['drum_snare', 'drum_snarepress', ...BRUSHES], // Добавляем щетки
            hihat: ALL_HIHATS,
            ride: ['drum_ride'], // Только основной райд
            crash: [], // Без крэшей
            perc: ['drum_tom_low']
        },
        // КИТ ДЛЯ СПОКОЙНОГО БЛЮЗА (ПЛАН 762)
        // #ИСПРАВЛЕНО (ПЛАН 1186): Добавлен хай-хэт для проверки логики "обогащения".
        blues_calm: {
            kick: ['drum_kick'],
            snare: ['drum_snare_ghost_note', ...BRUSHES],
            hihat: ['drum_hihat_closed'], // ДОБАВЛЕНО
            ride: [],
            crash: [],
            perc: ['perc-001', 'perc-013']
        },
        // #ИСПРАВЛЕНО (ПЛАН 766): Полностью пересобран для классического блюз-рока без "железа".
        blues_epic: {
            kick: ALL_KICKS,
            snare: ALL_SNARES,
            hihat: ALL_HIHATS,
            ride: [], // НИКАКИХ РАЙДОВ
            crash: [], // НИКАКИХ КРЭШЕЙ
            perc: ['drum_tom_mid', 'drum_tom_low'] // Только томы для филлов
        },
        // Другие настроения для blues можно добавить здесь
    },

    // =========================================================================
    // TRANCE KITS
    // =========================================================================
    trance: {
        // Типичный кит для транса
        melancholic: {
            kick: ['drum_kick'],
            snare: ['drum_snare', 'perc-009'],
            hihat: ['drum_hihat_open', 'drum_hihat_closed'],
            ride: [],
            crash: ['drum_crash'],
            perc: ['perc-003', 'perc-008', 'perc-011']
        },
        intro: { // Безопасный кит для интро транса
            kick: ['drum_kick'],
            snare: [],
            hihat: ['drum_hihat_closed'],
            ride: [],
            crash: [],
            perc: ['perc-003']
        },
        anxious: {
            kick: ALL_KICKS,
            snare: ALL_SNARES,
            hihat: ALL_HIHATS,
            ride: [],
            crash: [ALL_CRASHES[0]],
            perc: ALL_PERC,
        }
        // Другие настроения для trance можно добавить здесь
    }

    // Другие жанры можно добавить здесь
};
