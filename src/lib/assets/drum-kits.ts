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

const ALL_KICKS: InstrumentType[] = ['drum_kick', 'drum_cajon_kick', 'drum_drum_kick_reso', 'drum_kick_drum6', 'drum_kick_soft'];
const ALL_SNARES: InstrumentType[] = ['drum_snare', 'drum_snare_ghost_note', 'drum_snarepress', 'drum_brush2', 'drum_brush3', 'drum_brush4'];
const ALL_HIHATS: InstrumentType[] = [
    'drum_25677__walter_odington__alex-hat',
    'drum_25678__walter_odington__avalanche-hat',
    'drum_25687__walter_odington__blip-hat',
    'drum_25691__walter_odington__fastlinger',
    'drum_25693__walter_odington__hackney-hat-1',
    'drum_25694__walter_odington__hackney-hat-2',
    'drum_25695__walter_odington__hackney-hat-3',
    'drum_25696__walter_odington__hackney-hat-4',
    'drum_25701__walter_odington__new-years-hat-1',
    'drum_25702__walter_odington__new-years-hat-2',
    'drum_closed_hi_hat_ghost',
    'drum_open_hh_bottom2',
    'drum_open_hh_top2',
    'drum_brush4'
];
const ALL_RIDES: InstrumentType[] = ['drum_ride', 'drum_ride_wetter', 'drum_a-ride1', 'drum_a-ride2', 'drum_a-ride3', 'drum_a-ride4', 'drum_cymbal1', 'drum_cymbal2', 'drum_cymbal3', 'drum_cymbal4'];
const ALL_CRASHES: InstrumentType[] = ['drum_crash2'];
const ALL_TOMS: InstrumentType[] = [
    'drum_tom_low', 'drum_tom_mid', 'drum_tom_high',
    'drum_lowtom', 'drum_midtom', 'drum_hightom',
    'drum_lowtom_soft', 'drum_midtom_soft', 'drum_hightom_soft',
    'drum_Sonor_Classix_Low_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_High_Tom'
];
const ALL_PERC: InstrumentType[] = [
    ...ALL_TOMS, 
    'drum_cowbell', 'drum_cymbal_bell1', 'drum_cymbal_bell2',
    'drum_25691__walter_odington__fastlinger',
    'perc-001', 'perc-002', 'perc-005', 'perc-006', 'perc-013', 'perc-014', 'perc-015',
    'drum_Bell_-_Ambient', 'drum_Bell_-_Analog', 'drum_Bell_-_Astro', 'drum_Bell_-_Background', 'drum_Bell_-_Bright',
    'drum_Bell_-_Broken', 'drum_Bell_-_Cheap', 'drum_Bell_-_Cheesy', 'drum_Bell_-_Chorus', 'drum_Bell_-_Click',
    'drum_Bell_-_Crystals', 'drum_Bell_-_Deep', 'drum_Bell_-_Detuned', 'drum_Bell_-_Easy', 'drum_Bell_-_Echo',
    'drum_Bell_-_Evil', 'drum_Bell_-_Faded', 'drum_Bell_-_Far_Away', 'drum_Bell_-_Fast', 'drum_Bell_-_Futuristic',
    'drum_Bell_-_Glide', 'drum_Bell_-_Gong', 'drum_Bell_-_Higher', 'drum_Bell_-_High', 'drum_Bell_-_Horror',
    'drum_Bell_-_Long', 'drum_Bell_-_Moonlight', 'drum_Bell_-_Nasty', 'drum_Bell_-_Normal', 'drum_Bell_-_Plug',
    'drum_Bell_-_Quick', 'drum_Bell_-_Reverb', 'drum_Bell_-_Ring', 'drum_Bell_-_Slide', 'drum_Bell_-_Smooth',
    'drum_Bell_-_Soft', 'drum_Bell_-_Tap', 'drum_Bell_-_Too_Easy', 'drum_Bell_-_Unstable', 'drum_Bell_-_Vintage',
    'drum_Bell_-_Weird', 'drum_Bell_-_Wind',
    'drum_bongo_pc-01', 'drum_bongo_pc-02', 'drum_bongo_pc-03',
    'drum_bongo_pvc-tube-01', 'drum_bongo_pvc-tube-02', 'drum_bongo_pvc-tube-03',
];

// --- БИБЛИОТЕКА УДАРНЫХ УСТАНОВОК ---

const bluesMelancholicMaster: DrumKit = {
    kick: ['drum_kick_reso', 'drum_kick_drum6'],
    snare: ['drum_brush3', 'drum_snare', 'drum_snare_ghost_note'],
    hihat: ['drum_25693__walter_odington__hackney-hat-1', 'drum_25694__walter_odington__hackney-hat-2'],
    ride: [
        'drum_ride',
        'drum_ride_wetter',
    ],
    crash: ['drum_cymbal2', 'drum_cymbal3', 'drum_cymbal4'],
    perc: [
        'drum_hightom', 'drum_lowtom', 'drum_midtom',
        'drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Low_Tom', 'drum_Sonor_Classix_Mid_Tom',
        'drum_cowbell', 'perc-012', 'perc-013', 'perc-014', 'perc-015'
    ]
};


export const DRUM_KITS: DrumKitLibrary = {
    // =========================================================================
    // AMBIENT KITS
    // =========================================================================
    ambient: {
        // "Безопасный" кит для всех интро. НЕТ крэшей, НЕТ райдов.
        intro: {
            kick: ['drum_kick_soft', 'drum_cajon_kick'],
            snare: ['drum_snare_ghost_note'],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: [], // ПУСТО
            crash: [], // ПУСТО
            perc: ['drum_lowtom_soft', 'perc-013', 'perc-015', 'drum_Bell_-_Soft']
        },
        // Кит для спокойного эмбиента
        calm: {
            kick: ['drum_kick_soft'],
            snare: ['drum_snare_ghost_note', 'drum_snarepress', 'drum_brush1'],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: ['drum_ride_wetter'],
            crash: [], // Без крэшей для спокойствия
            perc: ['perc-001', 'perc-005', 'perc-013', 'drum_cymbal_bell1', 'drum_Bell_-_Ambient']
        },
        // Кит для темного эмбиента
        dark: {
            kick: ['drum_kick_reso'],
            snare: ['drum_snare_off'],
            hihat: [], // Без хэтов, только перкуссия
            ride: [],
            crash: ['drum_crash2'], // Редкий, гулкий крэш
            perc: ['drum_lowtom', 'perc-007', 'perc-015', 'drum_Bell_-_Gong']
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
            crash: ['drum_crash2'],
            perc: ['drum_tom_mid', 'drum_tom_low']
        },
        // Кит для медленного, меланхоличного блюза
        melancholic: bluesMelancholicMaster,
        // #ИСПРАВЛЕНО (ПЛАН 766): Полностью пересобран для классического блюз-рока без "железа".
        blues_epic: {
            kick: ALL_KICKS,
            snare: ALL_SNARES,
            hihat: ALL_HIHATS,
            ride: [], // НИКАКИХ РАЙДОВ
            crash: [], // НИКАКИХ КРЭШЕЙ
            perc: ['drum_tom_mid', 'drum_tom_low'] // Только томы для филлов
        },
        blues_dark: {
            kick: ['drum_kick_reso'],
            snare: ['drum_snare_off'],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: ['drum_a-ride1'],
            crash: [],
            perc: ['drum_lowtom', 'drum_Sonor_Classix_Low_Tom']
        },
        blues_melancholic_master: bluesMelancholicMaster,
        // --- НОВЫЕ КИТЫ ДЛЯ WINTER BLUES (ПЛАН 1587) ---
        winter_blues_prolog1: {
            kick: ['drum_kick_reso'],
            snare: [],
            hihat: ['drum_25693__walter_odington__hackney-hat-1', 'drum_25694__walter_odington__hackney-hat-2'],
            ride: [],
            crash: [],
            perc: ['perc-012', 'perc-013', 'perc-014', 'perc-015', 'drum_cowbell']
        },
        winter_blues_prolog2: {
            kick: ['drum_kick_reso'],
            snare: [],
            hihat: ['drum_25693__walter_odington__hackney-hat-1', 'drum_25694__walter_odington__hackney-hat-2'],
            ride: [],
            crash: [],
            perc: [
                'drum_hightom_soft', 'drum_lowtom_soft', 'drum_midtom_soft',
                'drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Low_Tom', 'drum_Sonor_Classix_Mid_Tom',
                'perc-012', 'perc-013', 'perc-014', 'perc-015', 'drum_cowbell'
            ]
        },
        winter_blues_prolog3: {
            kick: ['drum_kick_reso'],
            snare: ['drum_snare_ghost_note'],
            hihat: ['drum_25693__walter_odington__hackney-hat-1', 'drum_25694__walter_odington__hackney-hat-2'],
            ride: [],
            crash: [],
            perc: [
                'drum_hightom_soft', 'drum_lowtom_soft', 'drum_midtom_soft',
                'drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Low_Tom', 'drum_Sonor_Classix_Mid_Tom',
                'perc-012', 'perc-013', 'perc-014', 'perc-015', 'drum_cowbell'
            ]
        }
        // Другие настроения для blues можно добавить здесь
    },

    // =========================================================================
    // TRANCE KITS
    // =========================================================================
    trance: {
        // Типичный кит для транса
        melancholic: {
            kick: ['drum_kick_drum6'],
            snare: ['drum_snare', 'perc-009'],
            hihat: ['drum_open_hh_top2', 'drum_closed_hi_hat_ghost'],
            ride: [],
            crash: ['drum_crash2'],
            perc: ['perc-003', 'perc-008', 'perc-011']
        },
        intro: { // Безопасный кит для интро транса
            kick: ['drum_kick_soft'],
            snare: [],
            hihat: ['drum_closed_hi_hat_ghost'],
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
