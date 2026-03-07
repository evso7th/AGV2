
/**
 * @fileOverview Drum Arsenal Protocol V2.0.
 * #ЗАЧЕМ: Этот файл — центральный "Арсенал Барабанщика".
 * #ОБНОВЛЕНО (ПЛАН №736): Реализовано обязательное использование расширенной перкуссии (perc-001..015, tube, bongo).
 */

import type { DrumKit, DrumKitLibrary, InstrumentType } from '@/types/fractal';

const ALL_KICKS: InstrumentType[] = ['drum_kick', 'drum_cajon_kick', 'drum_drum_kick_reso', 'drum_kick_drum6', 'drum_kick_soft'];
const ALL_SNARES: InstrumentType[] = ['drum_snare', 'drum_snare_ghost_note', 'drum_snarepress', 'drum_brush2', 'drum_brush3', 'drum_brush4'];
const ALL_HIHATS: InstrumentType[] = [
    'drum_25693__walter_odington__hackney-hat-1',
    'drum_closed_hi_hat_ghost',
    'drum_open_hh_bottom2',
    'drum_open_hh_top2',
];
const ALL_RIDES: InstrumentType[] = ['drum_ride_wetter', 'drum_cymbal_bell1', 'drum_cymbal_bell2'];
const ALL_TOMS: InstrumentType[] = [
    'drum_Sonor_Classix_Low_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_High_Tom'
];

const ALL_BELLS: InstrumentType[] = [
    'drum_Bell_-_Ambient', 'drum_Bell_-_Analog', 'drum_Bell_-_Astro', 'drum_Bell_-_Background', 'drum_Bell_-_Bright',
    'drum_Bell_-_Deep', 'drum_Bell_-_Soft', 'drum_Bell_-_Wind'
];

/**
 * #ЗАЧЕМ: Полный набор "Текстурной Перкуссии" (ПЛАН №736).
 * #ЧТО: Все 15 perc сэмплов + трубки + бонго.
 */
const ALL_PERC: InstrumentType[] = [
    ...ALL_BELLS,
    'perc-001', 'perc-002', 'perc-003', 'perc-004', 'perc-005', 
    'perc-006', 'perc-007', 'perc-008', 'perc-009', 'perc-010',
    'perc-011', 'perc-012', 'perc-013', 'perc-014', 'perc-015',
    'bongo_pvc-tube-01', 'bongo_pvc-tube-02', 'bongo_pvc-tube-03',
    'bongo_pc-01', 'bongo_pc-02', 'bongo_pc-03'
];

export const DRUM_KITS: DrumKitLibrary = {
    ambient: {
        melancholic: {
            kick: ['drum_kick_soft', 'drum_kick_reso'],
            snare: ['drum_snare_ghost_note'],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: ['drum_ride_wetter'],
            perc: ALL_PERC
        },
        intro: {
            kick: ['drum_kick_soft'],
            snare: [],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: [],
            perc: ['perc-003', 'bongo_pvc-tube-01', 'drum_Bell_-_Soft']
        },
        calm: {
            kick: ['drum_kick_soft'],
            snare: ['drum_brush1'],
            hihat: ['drum_closed_hi_hat_ghost'],
            ride: ['drum_ride_wetter'],
            perc: ALL_PERC
        },
        dark: {
            kick: ['drum_kick_reso'],
            snare: ['drum_snare_off'],
            hihat: [],
            ride: [],
            perc: ['perc-012', 'bongo_pvc-tube-03', 'drum_Bell_-_Gong']
        }
    },

    blues: {
        contemplative: { kick: ALL_KICKS, snare: ALL_SNARES, hihat: ALL_HIHATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        melancholic: { kick: ['drum_kick_reso'], snare: ['drum_snare_ghost_note'], hihat: ALL_HIHATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        blues_epic: { kick: ALL_KICKS, snare: ALL_SNARES, hihat: ALL_HIHATS, ride: ALL_RIDES, crash: ['drum_crash2'], perc: ALL_PERC },
        blues_dark: { kick: ['drum_kick_reso'], snare: ['drum_snare_off'], hihat: ['drum_closed_hi_hat_ghost'], ride: ['drum_a-ride1'], crash: [], perc: ALL_PERC }
    },

    trance: {
        melancholic: { kick: ['drum_kick_drum6'], snare: ['drum_snare'], hihat: ['drum_open_hh_top2'], ride: [], crash: ['drum_crash2'], perc: ALL_PERC },
        intro: { kick: ['drum_kick_soft'], snare: [], hihat: ['drum_closed_hi_hat_ghost'], ride: [], crash: [], perc: ['perc-003'] },
        anxious: { kick: ALL_KICKS, snare: ALL_SNARES, hihat: ALL_HIHATS, ride: [], crash: ['drum_crash2'], perc: ALL_PERC }
    }
};
