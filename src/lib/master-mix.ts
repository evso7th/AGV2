/**
 * @fileOverview Master Mix Registry V3.4 — "Systemic Balance Hardening".
 * #ЗАЧЕМ: ПЛАН №1220. Глобальное снижение громкости: Harmony (4x), Piano (2x).
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.0225,      // Was 0.09 (Reduced 4x)
    pianoAccompaniment: 0.1075, // Was 0.215 (Reduced 2x)
    drums: 0.1875,
    sparkles: 0.65,      
    sfx: 0.65            
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        accompaniment: 0.20 
    },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    foundry: {
        ...UNIVERSAL_IMPERIAL_MIX,
        accompaniment: 0.25,      
        melody: 0.45,             
        harmony: 0.04,           // Was 0.16 (Reduced 4x)
        pianoAccompaniment: 0.1375 // Was 0.275 (Reduced 2x)
    },
    blues: {
        bass: 0.68,
        melody: 0.50,
        accompaniment: 0.06,
        harmony: 0.0109,        // Was 0.04375 (Reduced 4x)
        pianoAccompaniment: 0.08, // Was 0.16 (Reduced 2x)
        drums: 0.125,
        sparkles: 0.65, 
        sfx: 0.65       
    },
    cyber_blues: {
        bass: 0.68,
        melody: 0.50,
        accompaniment: 0.06,
        harmony: 0.0109,        // Was 0.04375 (Reduced 4x)
        pianoAccompaniment: 0.08, // Was 0.16 (Reduced 2x)
        drums: 0.125,
        sparkles: 0.65, 
        sfx: 0.65       
    },
    reggae: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        drums: 0.055,
        harmony: 0.0047         // Was 0.01875 (Reduced 4x)
    },
    progressive: { ...UNIVERSAL_IMPERIAL_MIX },
    rock: { ...UNIVERSAL_IMPERIAL_MIX },
    house: { ...UNIVERSAL_IMPERIAL_MIX },
    rnb: { ...UNIVERSAL_IMPERIAL_MIX },
    ballad: { ...UNIVERSAL_IMPERIAL_MIX },
    celtic: { ...UNIVERSAL_IMPERIAL_MIX }
};
