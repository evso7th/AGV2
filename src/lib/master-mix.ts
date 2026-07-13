/**
 * @fileOverview Master Mix Registry V2.2 — "Violin Attenuation".
 * #ЗАЧЕМ: ПЛАН №1320 — Громкость гармонии (скрипок) снижена еще в 2 раза (итого в 4 от базы) для прозрачности.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.0625,    // Снижено в 4 раза от исходного 0.25
    pianoAccompaniment: 0.43,
    drums: 0.75,         
    sparkles: 0.12,      
    sfx: 0.12            
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { ...UNIVERSAL_IMPERIAL_MIX },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    blues: {
        bass: 0.68,
        melody: 0.50,
        accompaniment: 0.06,
        harmony: 0.0875, // Снижено пропорционально (было 0.35)
        pianoAccompaniment: 0.32,
        drums: 0.50,
        sparkles: 0.15,
        sfx: 0.15
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