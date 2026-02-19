/**
 * @fileOverview Blues Guitar Solo Library (The Narrative Age)
 * #ЗАЧЕМ: Тотальная очистка генофонда от "атомарных" огрызков.
 * #ЧТО: Библиотека LN_01 - LN_20 состоит исключительно из 4-х тактовых "Музыкальных Предложений".
 * #ОБНОВЛЕНО (ПЛАН №516): Удалены все лики короче 2-х тактов. Внедрен стандарт 48 тиков.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
  // --- NARRATIVE SENTENCES (4 BARS / 48 TICKS) ---
  
  LN_01: { // Slow Burn Dorian Descent
    phrase: [
      {t:0,d:6,deg:'b3'}, {t:6,d:6,deg:'4'}, {t:12,d:12,deg:'5',tech:'vb'},
      {t:24,d:6,deg:'b7'}, {t:30,d:6,deg:'R+8',tech:'bn'}, {t:36,d:12,deg:'5',tech:'vb'}
    ],
    tags: ['slow-burn', 'dorian', 'narrative']
  },
  LN_02: { // Texas Shuffle Question & Answer
    phrase: [
      {t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3',tech:'h'}, {t:6,d:3,deg:'3',tech:'p'}, {t:9,d:3,deg:'5'},
      {t:12,d:12,deg:'R',tech:'vb'},
      {t:24,d:3,deg:'5'}, {t:27,d:3,deg:'b7',tech:'h'}, {t:30,d:6,deg:'R+8',tech:'vb'},
      {t:36,d:12,deg:'5',tech:'vb'}
    ],
    tags: ['texas', 'shuffle', 'narrative']
  },
  LN_03: { // Soulful Longing (B.B. King Style)
    phrase: [
      {t:0,d:9,deg:'b3',tech:'bn'}, {t:9,d:3,deg:'R'},
      {t:12,d:12,deg:'5',tech:'vb'},
      {t:24,d:6,deg:'b7',tech:'gr'}, {t:30,d:18,deg:'R',tech:'vb'}
    ],
    tags: ['soul', 'vocal', 'narrative']
  },
  LN_04: { // Chromatic Weaving
    phrase: [
      {t:0,d:2,deg:'5'}, {t:2,d:2,deg:'b5'}, {t:4,d:2,deg:'4'}, {t:6,d:6,deg:'b3',tech:'vb'},
      {t:12,d:4,deg:'R'}, {t:16,d:4,deg:'2'}, {t:20,d:4,deg:'b3'},
      {t:24,d:12,deg:'R',tech:'vb'},
      {t:36,d:12,deg:'5',tech:'swell'}
    ],
    tags: ['chromatic', 'jazz-blues', 'narrative']
  },
  LN_05: { // High Octave Reach
    phrase: [
      {t:0,d:12,deg:'R+8',tech:'bn+vb'},
      {t:12,d:6,deg:'b7'}, {t:18,d:6,deg:'5'},
      {t:24,d:12,deg:'4',tech:'sl'},
      {t:36,d:12,deg:'b3',tech:'vb'}
    ],
    tags: ['climax', 'high-register', 'narrative']
  },
  LN_06: { // Suspended Mystery
    phrase: [
      {t:0,d:12,deg:'9',tech:'vb'},
      {t:12,d:12,deg:'11',tech:'vb'},
      {t:24,d:12,deg:'5',tech:'vb'},
      {t:36,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['dreamy', 'suspended', 'narrative']
  },
  LN_07: { // Double-Stop Anthem
    phrase: [
      {t:0,d:6,deg:'5',tech:'ds'}, {t:6,d:6,deg:'6',tech:'ds'},
      {t:12,d:12,deg:'R',tech:'ds'},
      {t:24,d:12,deg:'5',tech:'ds'},
      {t:36,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['anthem', 'heavy', 'narrative']
  },
  LN_08: { // The Walking Lead
    phrase: [
      {t:0,d:3,deg:'R'}, {t:3,d:3,deg:'2'}, {t:6,d:3,deg:'b3'}, {t:9,d:3,deg:'3'},
      {t:12,d:3,deg:'4'}, {t:15,d:3,deg:'#4'}, {t:18,d:6,deg:'5',tech:'vb'},
      {t:24,d:12,deg:'b7',tech:'bn'},
      {t:36,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['climb', 'walking', 'narrative']
  },
  LN_09: { // Resigned Sigh
    phrase: [
      {t:0,d:12,deg:'5',tech:'vb'},
      {t:12,d:6,deg:'4'}, {t:18,d:6,deg:'b3'},
      {t:24,d:12,deg:'2',tech:'sl'},
      {t:36,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['sad', 'resigned', 'narrative']
  },
  LN_10: { // Rapid Fire Response
    phrase: [
      {t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3',tech:'h'}, {t:4,d:2,deg:'R'}, 
      {t:6,d:2,deg:'5'}, {t:8,d:2,deg:'b7',tech:'h'}, {t:10,d:2,deg:'5'},
      {t:12,d:12,deg:'R+8',tech:'vb'},
      {t:24,d:24,deg:'R',tech:'vb'}
    ],
    tags: ['rapid', 'texas', 'narrative']
  },

  // --- SIGNATURE RIFFS (2-4 BARS) ---
  
  L211_SABBATH_RIFF: {
    phrase: [
      {t:0,d:4.5,deg:'R',tech:'sl'}, {t:4.5,d:1.5,deg:'5'}, {t:6,d:1.5,deg:'b7'}, {t:7.5,d:1.5,deg:'5'}, {t:9,d:1.5,deg:'#4'}, {t:10.5,d:1.5,deg:'5'},
      {t:12,d:4.5,deg:'R',tech:'vb'}, {t:16.5,d:1.5,deg:'5'}, {t:18,d:1.5,deg:'b7'}, {t:19.5,d:1.5,deg:'b5',tech:'bn'}, {t:21,d:1.5,deg:'b7'}, {t:22.5,d:1.5,deg:'b5'}
    ],
    tags: ['legacy', 'doom-blues', 'heavy', 'signature']
  },
  
  L212_SABBATH_REVELATION: {
    phrase: [
      {t:0,d:4.5,deg:'R'}, {t:4.5,d:1.5,deg:'b3'}, {t:6,d:1.5,deg:'4'}, {t:7.5,d:1.5,deg:'b3'}, {t:9,d:3,deg:'R'},
      {t:12,d:3,deg:'7',tech:'bn'}, {t:15,d:1.5,deg:'5'}, {t:16.5,d:7.5,deg:'R',tech:'vb'}
    ],
    tags: ['legacy', 'doom-blues', 'heavy', 'vocal']
  },

  L_MOODY_0: { 
    phrase: [
      {t:0,d:6,deg:'R'}, {t:6,d:6,deg:'5'}, {t:12,d:12,deg:'b7',tech:'vb'},
      {t:24,d:6,deg:'R'}, {t:30,d:6,deg:'9'}, {t:36,d:12,deg:'R',tech:'vb'}
    ], 
    tags: ['moody-blues', 'slow-burn', 'narrative'] 
  },
  
  L_FIFTH_0: { 
    phrase: [
      {t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3'}, {t:6,d:3,deg:'4'}, {t:9,d:3,deg:'5'},
      {t:12,d:12,deg:'b7',tech:'bn'},
      {t:24,d:12,deg:'R+8',tech:'vb'},
      {t:36,d:12,deg:'5',tech:'vb'}
    ], 
    tags: ['fifth-dimension', 'soul', 'narrative'] 
  },
};

export const BLUES_SOLO_PLANS: Record<string, { choruses: string[][] }> = {
  "S01": {
    choruses: [
      ['LN_01', 'LN_02', 'LN_03', 'LN_04', 'LN_01', 'LN_05', 'LN_02', 'LN_06', 'LN_03', 'LN_07', 'LN_04', 'LN_08'],
      ['LN_09', 'LN_10', 'LN_01', 'LN_02', 'LN_05', 'LN_06', 'LN_07', 'LN_08', 'LN_09', 'LN_10', 'LN_01', 'LN_02'],
      ['L_MOODY_0', 'L_FIFTH_0', 'LN_01', 'LN_02', 'L_MOODY_0', 'L_FIFTH_0', 'LN_03', 'LN_04', 'LN_01', 'LN_02', 'LN_03', 'LN_04']
    ]
  },
  "S42": { // The Doom Ritual
    choruses: [
      ['L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_01', 'LN_09', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_04', 'LN_05', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_01', 'LN_09'],
      ['LN_01', 'LN_09', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_01', 'LN_09', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_01', 'LN_09', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION'],
      ['L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_01', 'LN_09', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_04', 'LN_05', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION', 'LN_01', 'LN_09']
    ]
  }
};
