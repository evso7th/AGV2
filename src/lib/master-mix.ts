
/**
 * @fileOverview Master Mix Registry V2.6 — "Atmospheric Balance Update".
 * #ЗАЧЕМ: ПЛАН №1259 — Внедрение спарклов/sfx и снижение громкости аккомпанемента.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.15,        
    accompaniment: 0.06, // Снижено в 2 раза (было 0.12)
    harmony: 0.15,       
    pianoAccompaniment: 0.43,
    drums: 0.75,         
    sparkles: 0.25,      // Установлено на 0.25
    sfx: 0.25            // Установлено на 0.25
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
