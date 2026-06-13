
/**
 * @fileOverview Master Mix Registry V1.9 — "The Ultimate Dub Balance".
 * #ЗАЧЕМ: Устранение перегрузки и обеспечение прозрачности Регги.
 * #ЧТО: ПЛАН №1145 — Громкость ударных снижена до 0.22, гармония до 0.10.
 */

import type { Genre, SoundMix } from '@/types/music';

const UNIVERSAL_IMPERIAL_MIX: SoundMix = {
    bass: 0.70,           
    melody: 0.21,        
    accompaniment: 0.10, 
    harmony: 0.30, 
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
        harmony: 0.10     // ПЛАН №1145: Минимальный акцент сканка
    },
    progressive: { ...UNIVERSAL_IMPERIAL_MIX },
    rock: { ...UNIVERSAL_IMPERIAL_MIX },
    house: { ...UNIVERSAL_IMPERIAL_MIX },
    rnb: { ...UNIVERSAL_IMPERIAL_MIX },
    ballad: { ...UNIVERSAL_IMPERIAL_MIX },
    celtic: { ...UNIVERSAL_IMPERIAL_MIX }
};
