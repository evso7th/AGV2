/**
 * @fileOverview Blues Guitar Solo Library (Licks and Plans)
 * #ЗАЧЕМ: Содержит оцифрованную библиотеку блюзовых гитарных соло.
 * #ЧТО: Лики переписаны в формат длинных музыкальных аксиом (2-4 такта).
 * #ОБНОВЛЕНО (ПЛАН №440): Внедрена система Choral Narrative.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
  // --- BASE MATHEMATICAL LICKS ---
  L01: { 
    phrase: [
        {t:0,d:6,deg:'b3',tech:'bn'}, {t:6,d:6,deg:'R',tech:'vb'},
        {t:12,d:3,deg:'R'}, {t:15,d:3,deg:'b7'}, {t:18,d:6,deg:'5',tech:'vb'}
    ], 
    tags: ['minor', 'cry', 'slow-burn'] 
  },
  
  L06: { 
    phrase: [
        {t:0,d:4,deg:'9'}, {t:4,d:8,deg:'R',tech:'vb'},
        {t:12,d:6,deg:'6'}, {t:18,d:6,deg:'5',tech:'vb'},
        {t:24,d:12,deg:'R+8',tech:'vb'}
    ], 
    tags: ['major', 'dreamy', 'lift'] 
  },

  // --- SIGNATURE LONG AXIOMS (4 BARS / 48 TICKS) ---
  L211_SABBATH_RIFF: {
    phrase: [
      // Bar 1
      {t:0,d:4.5,deg:'R',tech:'sl'}, {t:4.5,d:1.5,deg:'5'}, {t:6,d:1.5,deg:'b7'}, {t:7.5,d:1.5,deg:'5'}, {t:9,d:1.5,deg:'#4'}, {t:10.5,d:1.5,deg:'5'},
      // Bar 2
      {t:12,d:4.5,deg:'R',tech:'vb'}, {t:16.5,d:1.5,deg:'5'}, {t:18,d:1.5,deg:'b7'}, {t:19.5,d:1.5,deg:'b5',tech:'bn'}, {t:21,d:1.5,deg:'b7'}, {t:22.5,d:1.5,deg:'b5'},
      // Bar 3 (Development)
      {t:24,d:6,deg:'b3',tech:'sl'}, {t:30,d:6,deg:'4',tech:'vb'},
      // Bar 4 (Resolution)
      {t:36,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['legacy', 'doom-blues', 'heavy', 'signature']
  },
  
  L212_SABBATH_REVELATION: {
    phrase: [
      // Bar 1
      {t:0,d:4.5,deg:'R'}, {t:4.5,d:1.5,deg:'b3'}, {t:6,d:1.5,deg:'4'}, {t:7.5,d:1.5,deg:'b3'}, {t:9,d:3,deg:'R'},
      // Bar 2
      {t:12,d:3,deg:'7',tech:'bn'}, {t:15,d:1.5,deg:'5'}, {t:16.5,d:7.5,deg:'R',tech:'vb'},
      // Bar 3 (Echo)
      {t:24,d:4.5,deg:'5'}, {t:28.5,d:1.5,deg:'b7'}, {t:30,d:6,deg:'R+8',tech:'vb'},
      // Bar 4 (Sigh)
      {t:36,d:6,deg:'5'}, {t:42,d:6,deg:'4'}
    ],
    tags: ['legacy', 'doom-blues', 'heavy', 'vocal']
  },
};

export const BLUES_SOLO_PLANS: Record<string, { choruses: string[][] }> = {
  "S01": {
    choruses: [
      ['L01', 'L06', 'L211_SABBATH_RIFF', 'L212_SABBATH_REVELATION']
    ]
  }
};
