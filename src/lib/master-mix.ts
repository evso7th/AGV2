/**
 * @fileOverview Master Mix Registry V2.6 — "Harmony Taming Update".
 * #ЗАЧЕМ: ПЛАН №1991. Усмирение громкости гармонии и аккомпанемента в Foundry.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.0625,    
    pianoAccompaniment: 0.43,
    drums: 0.75,         
    sparkles: 0.65,      
    sfx: 0.65            
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { ...UNIVERSAL_IMPERIAL_MIX },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    foundry: {
        ...UNIVERSAL_IMPERIAL_MIX,
        accompaniment: 0.25,      // Снижено с 0.55 для чистоты
        melody: 0.45,             // Сбалансировано
        harmony: 0.32,            // СНИЖЕНО с 0.85 (Taming)
        pianoAccompaniment: 0.55  // Чуть тише
    },
    blues: {
        bass: 0.68,
        melody: 0.50,
        accompaniment: 0.06,
        harmony: 0.0875,
        pianoAccompaniment: 0.32,
        drums: 0.50,
        sparkles: 0.65, 
        sfx: 0.65       
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
