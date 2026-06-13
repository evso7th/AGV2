
/**
 * @fileOverview Master Mix Registry V1.6 — "Imperial Mixing Standard".
 * #ЗАЧЕМ: Унификация дефолтных громкостей на основе "Золотых настроек" пользователя.
 * #ЧТО: ПЛАН №89 — Все жанры теперь используют идентичный сбалансированный микс.
 * #ОБНОВЛЕНО (ПЛАН №90): Громкость аккомпанемента снижена еще в 2 раза (0.20 -> 0.10).
 * #ОБНОВЛЕНО (ПЛАН №1142): Громкость гармонии (guitar chords) снижена в 2 раза (0.30 -> 0.15).
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.15, // #ЗАЧЕМ: ПЛАН №1142. Снижение громкости в 2 раза для прозрачности аккордов.
    pianoAccompaniment: 0.43,
    drums: 0.75,         
    sparkles: 0.12,      
    sfx: 0.12            
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { ...UNIVERSAL_IMPERIAL_MIX },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    blues: { ...UNIVERSAL_IMPERIAL_MIX },
    reggae: { ...UNIVERSAL_IMPERIAL_MIX },
    progressive: { ...UNIVERSAL_IMPERIAL_MIX },
    rock: { ...UNIVERSAL_IMPERIAL_MIX },
    house: { ...UNIVERSAL_IMPERIAL_MIX },
    rnb: { ...UNIVERSAL_IMPERIAL_MIX },
    ballad: { ...UNIVERSAL_IMPERIAL_MIX },
    celtic: { ...UNIVERSAL_IMPERIAL_MIX }
};
