/**
 * @fileOverview Blues Guitar Solo Library (Licks and Plans)
 * #ЗАЧЕМ: Содержит оцифрованную библиотеку блюзовых гитарных соло.
 * #ЧТО: Экспортирует BLUES_SOLO_LICKS (212 ликов) и BLUES_SOLO_PLANS.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` и `music-theory.ts`.
 * #ОБНОВЛЕНО (ПЛАН №439): Добавлен L212_SABBATH_REVELATION, оцифрованный с изображения пользователя.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
  // --- BASE MATHEMATICAL LICKS (L01-L30) ---
  L01: { phrase: [{t:0,d:3,deg:'b3',tech:'bn'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['minor', 'cry', 'slow-burn'] },
  L02: { phrase: [{t:0,d:3,deg:'b3',tech:'gr'}, {t:3,d:3,deg:'3'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['major', 'turn', 'classic'] },
  L03: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'4'}, {t:4,d:2,deg:'#4'}, {t:6,d:2,deg:'5'}, {t:8,d:2,deg:'6'}, {t:10,d:2,deg:'5'}], tags: ['major', 'boogie', 'texas'] },
  L04: { phrase: [{t:0,d:6,deg:'b3',tech:'vb'}, {t:6,d:6,deg:'11'}], tags: ['minor', 'pad', 'slow-burn'] },
  L05: { phrase: [{t:0,d:3,deg:'b2',tech:'gr'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'b7'}], tags: ['minor', 'doom-blues', 'tension'] },
  L06: { phrase: [{t:0,d:4,deg:'9'}, {t:4,d:8,deg:'R',tech:'vb'}], tags: ['major', 'dreamy', 'lift'] },
  L07: { phrase: [{t:0,d:6,deg:'5',tech:'ds'}, {t:6,d:6,deg:'R'}], tags: ['major', 'double-stop', 'cry'] },
  L08: { phrase: [{t:8,d:2,deg:'2'}, {t:10,d:2,deg:'b3'}, {t:0,d:3,deg:'3',tech:'h'}], tags: ['major', 'pickup', 'texas'] },
  L09: { phrase: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}], tags: ['turnaround', 'chromatic', 'classic'] },
  L10: { phrase: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['major', 'minor', 'octave-jump', 'slow-burn'] },
  L11: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'6',tech:'vb'}], tags: ['major', 'texas', 'voicing'] },
  L12: { phrase: [{t:0,d:12,deg:'5',tech:'bn'}], tags: ['stop-time', 'scream', 'slow-burn'] },
  L13: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}], tags: ['major', 'run', 'texas'] },
  L14: { phrase: [{t:0,d:3,deg:'4',tech:'sl'},{t:3,d:3,deg:'#4'},{t:6,d:6,deg:'6',tech:'vb'}], tags: ['major', 'slide', 'texas'] },
  L15: { phrase: [{t:0,d:3,deg:'b3',tech:'bn'},{t:3,d:3,deg:'2'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['minor', 'cry', 'slow-burn'] },
  L16: { phrase: [{t:0,d:2,deg:'b2'},{t:2,d:2,deg:'R'},{t:4,d:2,deg:'b7'},{t:6,d:6,deg:'5'}], tags: ['minor', 'doom-blues', 'chromatic'] },
  L17: { phrase: [{t:0,d:3,deg:'5',tech:'ds'},{t:3,d:3,deg:'6',tech:'ds'},{t:6,d:6,deg:'R'}], tags: ['major', 'double-stop', 'texas'] },
  L18: { phrase: [{t:0,d:4,deg:'11'},{t:4,d:8,deg:'9'}], tags: ['minor', 'iv-chord', 'slow-burn'] },
  L19: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}], tags: ['turnaround', 'chromatic', 'descending'] },
  L20: { phrase: [{t:0,d:2,deg:'3'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'2'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b7'}], tags: ['major', 'texas', 'fast-run'] },

  // --- LEGACY CATEGORY 1: SLOW BURN (L31-L60) ---
  L31: { phrase: [{t:0,d:12,deg:'5',tech:'bn'}], tags: ['legacy', 'slow-burn', 'scream', 'long'] },
  L32: { phrase: [{t:0,d:6,deg:'b3',tech:'bn'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'slow-burn', 'cry', 'minor'] },
  L33: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:8,deg:'5',tech:'vb'}], tags: ['legacy', 'slow-burn', 'stable'] },
  L34: { phrase: [{t:0,d:3,deg:'b7'}, {t:3,d:9,deg:'5',tech:'bn'}], tags: ['legacy', 'slow-burn', 'reaching'] },
  L35: { phrase: [{t:0,d:6,deg:'4',tech:'sl'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'slow-burn', 'slide'] },
  L36: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'slow-burn', 'minor'] },
  L37: { phrase: [{t:0,d:9,deg:'b3',tech:'bn'}, {t:9,d:3,deg:'R'}], tags: ['legacy', 'slow-burn', 'effort'] },
  L38: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'b7',tech:'bn'}], tags: ['legacy', 'slow-burn', 'tension'] },
  L39: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'2'}, {t:8,d:4,deg:'b3',tech:'bn'}], tags: ['legacy', 'slow-burn', 'minor', 'climb'] },
  L40: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['legacy', 'slow-burn', 'anchor'] },

  // --- LEGACY CATEGORY 6: HARD ROCK LEGENDS (L181-L210) ---
  L181: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'doom-blues', 'heavy'] },
  L183: { phrase: [{t:0,d:6,deg:'b5',tech:'bn'},{t:6,d:6,deg:'4',tech:'vb'}], tags: ['legacy', 'doom-blues', 'heavy'] },
  L184: { phrase: [{t:0,d:3,deg:'R',tech:'ds'},{t:3,d:3,deg:'b5',tech:'ds'},{t:6,d:6,deg:'R',tech:'ds'}], tags: ['legacy', 'doom-blues', 'tritone', 'stabs'] },
  L192: { phrase: [{t:0,d:12,deg:'b5',tech:'bn+vb'}], tags: ['legacy', 'doom-blues', 'tritone-hold', 'tense'] },
  L206: { phrase: [{t:0,d:6,deg:'R',tech:'vb'},{t:6,d:6,deg:'b5',tech:'bn'}], tags: ['legacy', 'doom-blues', 'heavy-question'] },

  // --- SIGNATURE RIFFS (L211-L212) ---
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
};

export const BLUES_SOLO_PLANS: Record<string, { choruses: string[][] }> = {
  "S01": {
    choruses: [
      ['L01', 'L11', 'L13', 'L06', 'L11', 'L01', 'L17', 'L10', 'L13', 'L11', 'L02', 'L09'],
      ['L31', 'L11', 'L13', 'L14', 'L11', 'L32', 'L17', 'L10', 'L12', 'L12', 'L02', 'L19'],
      ['L10', 'L11', 'L13', 'L02', 'L11', 'L14', 'L17', 'L10', 'L13', 'L11', 'L02', 'L09']
    ]
  },
  "S42": { // The Doom Ritual
    choruses: [
      ['L183', 'L11', 'L184', 'L192', 'L11', 'L206', 'L183', 'L10', 'L211_SABBATH_RIFF', 'L11', 'L183', 'L09'],
      ['L192', 'L11', 'L206', 'L184', 'L11', 'L212_SABBATH_REVELATION', 'L183', 'L10', 'L12', 'L12', 'L183', 'L19'],
      ['L183', 'L192', 'L206', 'L184', 'L183', 'L211_SABBATH_RIFF', 'L183', 'L10', 'L183', 'L11', 'L183', 'L09']
    ]
  }
};
