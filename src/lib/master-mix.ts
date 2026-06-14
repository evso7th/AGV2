
/**
 * @fileOverview Master Mix Registry V2.0 — "The Harmony Balance Update".
 * #ЗАЧЕМ: Устранение доминирования аккордовых подкладок.
 * #ЧТО: ПЛАН №1155 — Громкость гармонии снижена в 2 раза во всех режимах.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.15,       // ПЛАН №1155: Снижено с 0.30 для прозрачности
    pianoAccompaniment: 0.43,
    drums: 0.75,         
    sparkles: 0.12,      
    sfx: 0.12            
};

export const GENRE_MASTER_MIX: Record<Genre, SoundMix> = {
    psybient: { ...UNIVERSAL_IMPERIAL_MIX },
    ambient: { ...UNIVERSAL_IMPERIAL_MIX },
    blues: { ...UNIVERSAL_IMPERIAL_MIX },
    reggae: { 
        ...UNIVERSAL_IMPERIAL_MIX,
        drums: 0.22,      // ПЛАН №1145: Радикально тихо для прозрачного даба
        harmony: 0.05     // ПЛАН №1155: Снижено с 0.10 для минимального акцента
    },
    progressive: { ...UNIVERSAL_IMPERIAL_MIX },
    rock: { ...UNIVERSAL_IMPERIAL_MIX },
    house: { ...UNIVERSAL_IMPERIAL_MIX },
    rnb: { ...UNIVERSAL_IMPERIAL_MIX },
    ballad: { ...UNIVERSAL_IMPERIAL_MIX },
    celtic: { ...UNIVERSAL_IMPERIAL_MIX }
};
