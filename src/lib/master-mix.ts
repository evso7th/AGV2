/**
 * @fileOverview Master Mix Registry V2.7 — "Harmony Presence Update".
 * #ЗАЧЕМ: ПЛАН №1150. Повышение слышимости слоя гармонии.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.18,       // Усилено с 0.0625 для уверенного присутствия
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
        accompaniment: 0.25,      
        melody: 0.45,             
        harmony: 0.32,            
        pianoAccompaniment: 0.55  
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
