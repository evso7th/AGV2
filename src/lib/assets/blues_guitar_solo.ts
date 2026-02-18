/**
 * @fileOverview Blues Guitar Solo Library (Licks and Plans)
 * #ЗАЧЕМ: Содержит оцифрованную библиотеку блюзовых гитарных соло.
 * #ЧТО: Огромное расширение (80+ ликов). Династии: Texas, Soul, King, Detroit, Chromatic.
 * #ОБНОВЛЕНО (ПЛАН №453): Внедрена полная библиотека "Золотых Аксиом".
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
  // --- BASE MATHEMATICAL LICKS (L01-L19) ---
  L01: { phrase: [{t:0,d:6,deg:'b3',tech:'bn'}, {t:6,d:6,deg:'R',tech:'vb'}, {t:12,d:6,deg:'b7'}, {t:18,d:6,deg:'5'}], tags: ['minor', 'cry', 'slow-burn'] },
  L06: { phrase: [{t:0,d:4,deg:'9'}, {t:4,d:8,deg:'R',tech:'vb'}, {t:12,d:6,deg:'6'}, {t:18,d:6,deg:'5'}], tags: ['major', 'dreamy', 'lift'] },
  L10: { phrase: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8',tech:'vb'}, {t:12,d:12,deg:'5',tech:'vb'}], tags: ['major', 'octave-jump'] },

  // --- TEXAS DRIVE / ALVIN LEE STYLE (L20-L29) ---
  L20: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'R+8'}], tags: ['major', 'texas', 'fast'] },
  L21: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:1,deg:'6',tech:'h'},{t:4,d:2,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['major', 'texas', 'shuffle'] },
  L22: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'2'},{t:4,d:2,deg:'b3',tech:'h'},{t:6,d:6,deg:'3',tech:'vb'}], tags: ['major', 'texas', 'twang'] },
  L25: { phrase: [{t:0,d:1.5,deg:'R'},{t:1.5,d:1.5,deg:'b3'},{t:3,d:1.5,deg:'3'},{t:4.5,d:1.5,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['major', 'texas', 'rapid'] },

  // --- DEEP SOUL / GILMOUR STYLE (L30-L39) ---
  L30: { phrase: [{t:0,d:12,deg:'5',tech:'bn+vb'}, {t:12,d:12,deg:'R',tech:'vb'}], tags: ['minor', 'soul', 'slow-burn', 'legend'] },
  L31: { phrase: [{t:0,d:9,deg:'b3',tech:'bn'}, {t:9,d:3,deg:'R'}, {t:12,d:12,deg:'b7',tech:'vb'}], tags: ['minor', 'soul', 'cry'] },
  L32: { phrase: [{t:0,d:12,deg:'9',tech:'bn'}, {t:12,d:12,deg:'5',tech:'vb'}], tags: ['major', 'soul', 'lift'] },
  L35: { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b7',tech:'sl'}, {t:12,d:12,deg:'5',tech:'vb'}], tags: ['minor', 'soul', 'dreamy'] },

  // --- CHROMATIC TENSION (L40-L49) ---
  L40: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b5'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'b3'}], tags: ['minor', 'chromatic', 'tension'] },
  L41: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b2'},{t:6,d:3,deg:'2'},{t:9,d:3,deg:'b3'}], tags: ['minor', 'chromatic', 'anxious'] },
  L42: { phrase: [{t:0,d:2,deg:'b7'},{t:2,d:2,deg:'7'},{t:4,d:2,deg:'R'},{t:6,d:6,deg:'3',tech:'h'}], tags: ['major', 'chromatic', 'turn'] },

  // --- B.B. KING STYLE (L50-L59) ---
  L50: { phrase: [{t:0,d:3,deg:'R',tech:'gr'},{t:3,d:9,deg:'R',tech:'vb'}], tags: ['major', 'king', 'vibrato', 'anchor'] },
  L51: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['major', 'king', 'classic'] },
  L52: { phrase: [{t:0,d:2,deg:'R+8'},{t:2,d:4,deg:'R+8',tech:'vb'},{t:6,d:6,deg:'5'}], tags: ['major', 'king', 'sting'] },

  // --- DETROIT BLUES STYLE (L60-L69) ---
  L60: { phrase: [{t:0,d:6,deg:'R',tech:'ds'},{t:6,d:6,deg:'5',tech:'ds'}], tags: ['minor', 'detroit', 'heavy'] },
  L61: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3',tech:'bn'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['minor', 'detroit', 'grit'] },
  L62: { phrase: [{t:0,d:4,deg:'R'},{t:4,d:2,deg:'b7'},{t:6,d:6,deg:'5'}], tags: ['minor', 'detroit', 'stable'] },

  // --- CLAPTON GEMS (L70-L80) ---
  L70: { phrase: [{t:0,d:3,deg:'b3',tech:'sl'},{t:3,d:3,deg:'R'},{t:6,d:3,deg:'b7'},{t:9,d:3,deg:'5'}], tags: ['minor', 'clapton', 'creamy'] },
  L71: { phrase: [{t:0,d:6,deg:'5',tech:'bn'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['minor', 'clapton', 'slow-hand'] },
  L75: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'4'},{t:6,d:6,deg:'5',tech:'vb'}], tags: ['minor', 'clapton', 'climb'] },

  // --- SIGNATURE LONG AXIOMS ---
  L211_SABBATH_RIFF: {
    phrase: [
      {t:0,d:4.5,deg:'R',tech:'sl'}, {t:4.5,d:1.5,deg:'5'}, {t:6,d:1.5,deg:'b7'}, {t:7.5,d:1.5,deg:'5'}, {t:9,d:1.5,deg:'#4'}, {t:10.5,d:1.5,deg:'5'},
      {t:12,d:4.5,deg:'R',tech:'vb'}, {t:16.5,d:1.5,deg:'5'}, {t:18,d:1.5,deg:'b7'}, {t:19.5,d:1.5,deg:'b5',tech:'bn'}, {t:21,d:1.5,deg:'b7'}, {t:22.5,d:1.5,deg:'b5'},
      {t:24,d:6,deg:'b3',tech:'sl'}, {t:30,d:6,deg:'4',tech:'vb'},
      {t:36,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['legacy', 'doom-blues', 'heavy', 'signature']
  },
  
  L212_SABBATH_REVELATION: {
    phrase: [
      {t:0,d:4.5,deg:'R'}, {t:4.5,d:1.5,deg:'b3'}, {t:6,d:1.5,deg:'4'}, {t:7.5,d:1.5,deg:'b3'}, {t:9,d:3,deg:'R'},
      {t:12,d:3,deg:'7',tech:'bn'}, {t:15,d:1.5,deg:'5'}, {t:16.5,d:7.5,deg:'R',tech:'vb'},
      {t:24,d:4.5,deg:'5'}, {t:28.5,d:1.5,deg:'b7'}, {t:30,d:6,deg:'R+8',tech:'vb'},
      {t:36,d:6,deg:'5'}, {t:42,d:6,deg:'4'}
    ],
    tags: ['legacy', 'doom-blues', 'heavy', 'vocal']
  },
};

export const BLUES_SOLO_PLANS: Record<string, { choruses: string[][] }> = {
  "S01": {
    choruses: [
      ['L30', 'L70', 'L51', 'L211_SABBATH_RIFF'],
      ['L20', 'L40', 'L31', 'L212_SABBATH_REVELATION'],
      ['L75', 'L50', 'L60', 'L30']
    ]
  },
  "S42": {
    choruses: [
      ['L183', 'L11', 'L184', 'L192', 'L11', 'L206', 'L183', 'L10', 'L211_SABBATH_RIFF', 'L11', 'L183', 'L09'],
      ['L192', 'L11', 'L206', 'L184', 'L11', 'L212_SABBATH_REVELATION', 'L183', 'L10', 'L12', 'L12', 'L183', 'L19'],
      ['L183', 'L192', 'L206', 'L184', 'L183', 'L211_SABBATH_RIFF', 'L183', 'L10', 'L183', 'L11', 'L183', 'L09']
    ]
  }
};
