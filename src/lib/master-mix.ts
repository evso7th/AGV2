/**
 * @fileOverview Master Mix Registry V2.3 — "Texture Prominence Update".
 * #ЗАЧЕМ: Увеличение громкости Sparkles и SFX до 0.65 по умолчанию.
 * #ЧТО: Новые сэмплы требуют более высокого уровня в миксе для создания атмосферы.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.0625,    
    pianoAccompaniment: 0.43,
    drums: 0.75,         
    sparkles: 0.65,      // Повышено с 0.12
    sfx: 0.65            // Повышено с 0.12
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { ...UNIVERSAL_IMPERIAL_MIX },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    blues: {
        bass: 0.68,
        melody: 0.50,
        accompaniment: 0.06,
        harmony: 0.0875,
        pianoAccompaniment: 0.32,
        drums: 0.50,
        sparkles: 0.65, // Повышено для консистентности
        sfx: 0.65       // Повышено для консистентности
    },
    reggae: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        drums: 0.22,      
        harmony: 0.0375    
    },
    progressive: { ...UNIVERSAL_IMPERIAL_MIX },
    rock: { ...UNIVERSAL_IMPERIAL_MIX },
    house: { ...UNIVERSAL_IMPERIAL_MIX },
    rnb: { ...UNIVERSAL_IMPERIAL_MIX },
    ballad: { ...UNIVERSAL_IMPERIAL_MIX },
    celtic: { ...UNIVERSAL_IMPERIAL_MIX }
};
