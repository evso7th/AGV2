
/**
 * @fileOverview Master Mix Registry V2.7 — "Harmony Balance Calibration".
 * #ЗАЧЕМ: ПЛАН №1263 — Снижение громкости гармонии в 2 раза.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.15,        
    accompaniment: 0.06, 
    harmony: 0.075,      // Снижено в 2 раза (было 0.15)
    pianoAccompaniment: 0.43,
    drums: 0.75,         
    sparkles: 0.25,      
    sfx: 0.25            
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        drums: 0.85,      
        bass: 0.75        
    },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    blues: { ...UNIVERSAL_IMPERIAL_MIX },
    reggae: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        drums: 0.22,      
        harmony: 0.05    
    },
    progressive: { ...UNIVERSAL_IMPERIAL_MIX },
    rock: { ...UNIVERSAL_IMPERIAL_MIX },
    house: { ...UNIVERSAL_IMPERIAL_MIX },
    rnb: { ...UNIVERSAL_IMPERIAL_MIX },
    ballad: { ...UNIVERSAL_IMPERIAL_MIX },
    celtic: { ...UNIVERSAL_IMPERIAL_MIX }
};
