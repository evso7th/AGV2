
/**
 * @fileOverview Master Mix Registry V1.4 — "Global Ensemble Standard".
 * #ЗАЧЕМ: Унификация дефолтных громкостей по запросу пользователя (ПЛАН №1190).
 */

import type { Genre, SoundMix } from '@/types/music';

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: {
        bass: 1.0,           
        melody: 0.65,        
        accompaniment: 0.30, 
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        drums: 0.95,         
        sparkles: 0.45,      
        sfx: 0.50            
    },
    ambient: {
        bass: 0.45,
        melody: 0.65,
        accompaniment: 0.30,
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        drums: 0.30,
        sparkles: 0.15,
        sfx: 0.15
    },
    blues: {
        bass: 0.70,
        melody: 0.65,
        accompaniment: 0.30, 
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        drums: 0.75,
        sparkles: 0.12,
        sfx: 0.12
    },
    reggae: {
        bass: 1.0,
        melody: 0.65,
        accompaniment: 0.30,
        harmony: 0.30,
        pianoAccompaniment: 0.30,
        drums: 0.85,
        sparkles: 0.18,
        sfx: 0.25
    },
    // Fallbacks for MVP - Synchronized with the global standard
    progressive: { bass: 0.8, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.8 },
    rock: { bass: 0.8, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.9 },
    house: { bass: 0.9, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.95 },
    rnb: { bass: 0.8, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.8 },
    ballad: { bass: 0.5, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.4 },
    celtic: { bass: 0.6, melody: 0.65, accompaniment: 0.30, harmony: 0.30, pianoAccompaniment: 0.30, drums: 0.5 }
};
