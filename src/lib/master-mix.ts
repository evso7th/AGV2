
/**
 * @fileOverview Master Mix Registry V1.0 — "The Sonic DNA".
 * #ЗАЧЕМ: Глобальный реестр эталонных громкостей для каждого жанра.
 * #ЧТО: ПЛАН №1024 — Определение базовых "фейдеров" для Ambient, Trance, Blues и Reggae.
 */

import type { Genre, SoundMix } from '@/types/music';

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    ambient: {
        bass: 0.45,
        melody: 0.55,
        accompaniment: 0.85,
        harmony: 0.70,
        pianoAccompaniment: 0.35,
        drums: 0.30,
        sparkles: 0.15,
        sfx: 0.15
    },
    trance: {
        bass: 0.95,
        melody: 0.75,
        accompaniment: 0.65,
        harmony: 0.60,
        pianoAccompaniment: 0.40,
        drums: 0.90,
        sparkles: 0.20,
        sfx: 0.20
    },
    blues: {
        bass: 0.70,
        melody: 0.90,
        accompaniment: 0.60,
        harmony: 0.75,
        pianoAccompaniment: 0.50,
        drums: 0.75,
        sparkles: 0.12,
        sfx: 0.12
    },
    reggae: {
        bass: 1.0,
        melody: 0.75,
        accompaniment: 0.80,
        harmony: 0.65,
        pianoAccompaniment: 0.60,
        drums: 0.85,
        sparkles: 0.18,
        sfx: 0.25
    },
    // Fallbacks for MVP
    progressive: { bass: 0.8, melody: 0.8, drums: 0.8 },
    rock: { bass: 0.8, melody: 0.9, drums: 0.9 },
    house: { bass: 0.9, melody: 0.7, drums: 0.95 },
    rnb: { bass: 0.8, melody: 0.8, drums: 0.8 },
    ballad: { bass: 0.5, melody: 0.7, drums: 0.4 },
    celtic: { bass: 0.6, melody: 0.8, drums: 0.5 }
};
