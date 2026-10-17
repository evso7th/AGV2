/**
 * @fileOverview Master Mix Registry V4.5 — "Ultra-Soft Melody Calibration".
 * #ЗАЧЕМ: Финальное снижение громкости лид-инструментов. 
 * #ЧТО: ПЛАН №2755 — Громкость melody снижена еще в 2 раза для ambient (0.035), blues и cyber_blues (0.0535).
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.035, // Снижено еще в 2 раза (было 0.07)
    accompaniment: 0.10, 
    harmony: 0.0225,      
    pianoAccompaniment: 0.1075, 
    drums: 0.1875,
    sparkles: 0.65,      
    sfx: 0.65            
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        melody: 0.75,
        accompaniment: 0.80,
        pianoAccompaniment: 0.035,
        drums: 0.12
    },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    foundry: {
        bass: 0.75,               
        melody: 0.50,             
        accompaniment: 0.75,      
        harmony: 0.035,           
        pianoAccompaniment: 0.035, 
        drums: 0.14,
        sparkles: 0.50,
        sfx: 0.20
    },
    blues: {
        bass: 0.68,
        melody: 0.0535, // Снижено еще в 2 раза (было 0.107)
        accompaniment: 0.06,
        harmony: 0.0109,        
        pianoAccompaniment: 0.08, 
        drums: 0.125,
        sparkles: 0.65, 
        sfx: 0.65       
    },
    cyber_blues: {
        bass: 0.68,
        melody: 0.0535, // Снижено еще в 2 раза (было 0.107)
        accompaniment: 0.06,
        harmony: 0.0109,        
        pianoAccompaniment: 0.08, 
        drums: 0.125,
        sparkles: 0.65, 
        sfx: 0.65       
    },
    reggae: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        drums: 0.055,
        harmony: 0.0047         
    },
    progressive: { ...UNIVERSAL_IMPERIAL_MIX },
    rock: { ...UNIVERSAL_IMPERIAL_MIX },
    house: { ...UNIVERSAL_IMPERIAL_MIX },
    rnb: { ...UNIVERSAL_IMPERIAL_MIX },
    ballad: { ...UNIVERSAL_IMPERIAL_MIX },
    celtic: { ...UNIVERSAL_IMPERIAL_MIX }
};
