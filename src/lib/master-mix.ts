
/**
 * @fileOverview Master Mix Registry V1.7 — "Deep Dub Drum Calibration".
 * #ЗАЧЕМ: Дополнительное снижение громкости ударных для Регги.
 * #ЧТО: ПЛАН №2121 — Громкость ударных для 'reggae' снижена ещё в 2 раза (0.17 -> 0.085).
 */

import type { Genre, SoundMix } from '@/types/music';

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: {
        bass: 1.0,           
        melody: 0.65,        
        accompaniment: 0.30, 
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        drums: 0.50,         
        sparkles: 0.45,      
        sfx: 0.50            
    },
    ambient: {
        bass: 0.45,
        melody: 0.65,
        accompaniment: 0.30,
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        drums: 0.50,
        sparkles: 0.15,
        sfx: 0.15
    },
    blues: {
        bass: 0.70,
        melody: 0.65,
        accompaniment: 0.30, 
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        drums: 0.50,
        sparkles: 0.12,
        sfx: 0.12
    },
    reggae: {
        bass: 1.0,
        melody: 0.65,
        accompaniment: 0.30,
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        // #ЗАЧЕМ: ПЛАН №2121. Дополнительное снижение в 2 раза (от 0.17) для экстремально мягкого даба.
        drums: 0.085, 
        sparkles: 0.18,
        sfx: 0.25
    },
    // Fallbacks for MVP - Standardized drum volume
    progressive: { bass: 0.8, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.50 },
    rock: { bass: 0.8, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.50 },
    house: { bass: 0.9, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.50 },
    rnb: { bass: 0.8, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.50 },
    ballad: { bass: 0.5, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.50 },
    celtic: { bass: 0.6, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.50 }
};
