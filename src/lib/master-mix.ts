
/**
 * @fileOverview Master Mix Registry V1.6 — "Reggae Drum Normalization".
 * #ЗАЧЕМ: Точечная настройка баланса для Регги по запросу пользователя.
 * #ЧТО: ПЛАН №2120 — Громкость ударных для 'reggae' снижена в 3 раза (0.50 -> 0.17).
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
        // #ЗАЧЕМ: ПЛАН №2120. Снижение в 3 раза для мягкого даб-звучания.
        drums: 0.17, 
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
