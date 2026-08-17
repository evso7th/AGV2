/**
 * @fileOverview Drum Arsenal Protocol V2.5.
 * #ЗАЧЕМ: Этот файл — центральный "Арсенал Барабанщика".
 * #ОБНОВЛЕНО (ПЛАН №1960): Добавлен жанр Foundry с кастомными киками и трансовой основой.
 */

import type { DrumKit, DrumKitLibrary, InstrumentType } from '@/types/fractal';

const ALL_KICKS: InstrumentType[] = [
    'drum_kick', 'drum_cajon_kick', 'drum_drum_kick_reso', 'drum_kick_drum6', 'drum_kick_soft',
    'drum_edm_kick', 'drum_prog_house_kick', 'drum_deep_tech_kick', 'drum_standard_tech_kick', 'drum_quality_kick'
];

const FOUNDRY_KICKS: InstrumentType[] = [
    'drum_foundry_pd_27', 'drum_foundry_standard', 'drum_foundry_quality'
];

const TRANCE_SNARES: InstrumentType[] = ['drum_snare'];
const TRANCE_HATS: InstrumentType[] = ['drum_open_hh_top2'];

const ALL_SNARES: InstrumentType[] = ['drum_snare', 'drum_snare_ghost_note', 'drum_snarepress', 'drum_brush2', 'drum_brush3', 'drum_brush4'];
const ALL_HIHATS: InstrumentType[] = [
    'drum_25693__walter_odington__hackney-hat-1',
    'drum_closed_hi_hat_ghost',
    'drum_open_hh_bottom2',
    'drum_open_hh_top2',
];
const ALL_RIDES: InstrumentType[] = ['drum_ride_wetter', 'drum_cymbal_bell1', 'drum_cymbal_bell2'];

const ALL_PERC: InstrumentType[] = [
    'perc-001', 'perc-002', 'perc-003', 'perc-004', 'perc-005', 
    'perc-006', 'perc-007', 'perc-008', 'perc-009', 'perc-010',
    'perc-011', 'perc-012', 'perc-013', 'perc-014', 'perc-015'
];

export const DRUM_KITS: DrumKitLibrary = {
    foundry: {
        melancholic: { kick: FOUNDRY_KICKS, snare: TRANCE_SNARES, hihat: TRANCE_HATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        dark: { kick: FOUNDRY_KICKS, snare: ['drum_snare_off'], hihat: ['drum_closed_hi_hat_ghost'], ride: [], crash: [], perc: ALL_PERC },
        anxious: { kick: FOUNDRY_KICKS, snare: TRANCE_SNARES, hihat: ALL_HIHATS, ride: [], crash: ['drum_crash2'], perc: ALL_PERC },
        joyful: { kick: FOUNDRY_KICKS, snare: TRANCE_SNARES, hihat: TRANCE_HATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        calm: { kick: FOUNDRY_KICKS, snare: [], hihat: TRANCE_HATS, ride: ALL_RIDES, crash: [], perc: ALL_PERC },
        epic: { kick: FOUNDRY_KICKS, snare: TRANCE_SNARES, hihat: TRANCE_HATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        enthusiastic: { kick: FOUNDRY_KICKS, snare: TRANCE_SNARES, hihat: TRANCE_HATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        dreamy: { kick: FOUNDRY_KICKS, snare: [], hihat: TRANCE_HATS, ride: ALL_RIDES, crash: [], perc: ALL_PERC },
        contemplative: { kick: FOUNDRY_KICKS, snare: [], hihat: TRANCE_HATS, ride: [], crash: [], perc: ALL_PERC }
    },

    ambient: {
        melancholic: {
            kick: ['drum_kick_soft', 'drum_kick_reso', 'drum_deep_tech_kick', 'drum_quality_kick'],
            snare: ['drum_snare_ghost_note'],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: ['drum_ride_wetter'],
            perc: ALL_PERC
        },
        intro: {
            kick: ['drum_kick_soft', 'drum_quality_kick'],
            snare: [],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: ['drum_ride_wetter'],
            perc: ['perc-003', 'perc-005']
        },
        calm: {
            kick: ['drum_kick_soft', 'drum_deep_tech_kick'],
            snare: ['drum_brush1'],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: ['drum_ride_wetter'],
            perc: ALL_PERC
        },
        dark: {
            kick: ['drum_kick_reso', 'drum_deep_tech_kick'],
            snare: ['drum_snare_off'],
            hihat: [],
            ride: ['drum_a-ride1'],
            perc: ['perc-012', 'perc-015', 'perc-008']
        }
    },

    blues: {
        contemplative: { kick: ALL_KICKS, snare: ALL_SNARES, hihat: ALL_HIHATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        melancholic: { kick: ['drum_kick_reso'], snare: ['drum_snare_ghost_note'], hihat: ALL_HIHATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        blues_epic: { kick: ALL_KICKS, snare: ALL_SNARES, hihat: ALL_HIHATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        blues_dark: { kick: ['drum_kick_reso'], snare: ['drum_snare_off'], hihat: ['drum_closed_hi_hat_ghost'], ride: ['drum_a-ride1'], crash: [], perc: ALL_PERC }
    },

    trance: {
        melancholic: { 
            kick: ['drum_kick_drum6', 'drum_edm_kick', 'drum_prog_house_kick', 'drum_standard_tech_kick'], 
            snare: ['drum_snare'], 
            hihat: ['drum_open_hh_top2'], 
            ride: [], 
            crash: ['drum_crash2'], 
            perc: ALL_PERC 
        },
        intro: { kick: ['drum_kick_soft', 'drum_standard_tech_kick'], snare: [], hihat: ['drum_closed_hi_hat_ghost'], ride: [], crash: [], perc: ['perc-003'] },
        anxious: { kick: ALL_KICKS, snare: ALL_SNARES, hihat: ALL_HIHATS, ride: [], crash: ['drum_crash2'], perc: ALL_PERC }
    },

    reggae: {
        standard: { 
            kick: ALL_KICKS, 
            snare: ALL_SNARES, 
            hihat: ALL_HIHATS, 
            ride: ALL_RIDES, 
            crash: ['drum_crash2'], 
            perc: ALL_PERC 
        }
    }
};