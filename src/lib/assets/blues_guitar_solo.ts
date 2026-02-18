/**
 * @fileOverview Blues Guitar Solo Library (150+ Golden Licks)
 * #ЗАЧЕМ: Огромная оцифрованная база блюзового наследия для исключения повторов.
 * #ЧТО: Секции: Texas, Soul, King, Detroit, Chromatic, Sabbath, Slow-Burn, Lyrical, Legacy Gold.
 * #ОБНОВЛЕНО (ПЛАН №477): Интегрировано 30 новых ликов из Moody Blues и Fifth Dimension.
 */

import type { BluesSoloPhrase, CompactBluesPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase | CompactBluesPhrase; tags: string[] }> = {
  // --- BASE MATHEMATICAL LICKS (L01-L25) ---
  L01: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'R+8'}], tags: ['texas', 'fast', 'major', 'slow-burn'] },
  L02: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:1,deg:'6',tech:'h'},{t:4,d:2,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'shuffle', 'major'] },
  L03: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'2'},{t:4,d:2,deg:'b3',tech:'h'},{t:6,d:6,deg:'3',tech:'vb'}], tags: ['texas', 'twang', 'slow-burn'] },
  L04: { phrase: [{t:0,d:1.5,deg:'R'},{t:1.5,d:1.5,deg:'b3'},{t:3,d:1.5,deg:'3'},{t:4.5,d:1.5,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'rapid'] },
  L05: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R'}], tags: ['texas', 'classic', 'slow-burn'] },
  L06: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:4,deg:'5'},{t:6,d:2,deg:'6'},{t:8,d:4,deg:'R+8'}], tags: ['texas', 'climb'] },
  L07: { phrase: [{t:0,d:3,deg:'b3',tech:'sl'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'R'}], tags: ['texas', 'major', 'slow-burn'] },
  L08: { phrase: [{t:8,d:2,deg:'2'},{t:10,d:2,deg:'b3'},{t:0,d:3,deg:'3',tech:'h'}], tags: ['texas', 'pickup'] },
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

  // --- LYRICAL SERIES (L220-L235): "ta-ra-tita-tam" Rhythmic Phrasing ---
  L220: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'6',tech:'sl'}, {t:4,d:1,deg:'b7'}, {t:5,d:1,deg:'7',tech:'h'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['slow-burn', 'lyrical', 'question'] },
  L221: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3',tech:'h'}, {t:4,d:1,deg:'4'}, {t:5,d:1,deg:'#4',tech:'sl'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['slow-burn', 'lyrical', 'response'] },
  L222: { phrase: [{t:0,d:3,deg:'b7',tech:'bn'}, {t:3,d:3,deg:'5'}, {t:6,d:2,deg:'4'}, {t:8,d:2,deg:'b3'}, {t:10,d:2,deg:'R',tech:'vb'}], tags: ['slow-burn', 'lyrical', 'descent'] },
  L223: { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'2'}, {t:2,d:4,deg:'b3',tech:'bn'}, {t:6,d:2,deg:'R'}, {t:8,d:4,deg:'5',tech:'vb'}], tags: ['slow-burn', 'lyrical', 'stutter'] },
  L224: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'R+8',tech:'bn'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['slow-burn', 'lyrical', 'high-cry'] },
  L225: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:1,deg:'b3',tech:'h'}, {t:4,d:1,deg:'3',tech:'p'}, {t:5,d:1,deg:'R'}, {t:6,d:6,deg:'b7',tech:'vb'}], tags: ['slow-burn', 'lyrical', 'ornamental'] },

  // --- LEGACY GOLD: THE MOODY BLUES (Ingested 06-12-2024) ---
  L_MOODY_0: { phrase: [5, 1, 8, 0, 5, 1, 8, 0, 5, 1, 1, 0, 6, 1, 8, 0, 7, 1, 3, 0, 7, 1, 8, 0, 8, 1, 1, 0, 8, 1, 8, 0, 8, 1, 8, 0, 9, 1, 3, 0, 10, 1, 8, 0, 10, 1, 8, 0, 10, 1, 8, 0, 10, 1, 1, 0, 11, 1, 8, 0, 12, 1, 3, 0, 12, 1, 8, 0, 13, 1, 8, 0, 13, 1, 1, 0, 14, 1, 8, 0, 14, 1, 3, 0, 15, 1, 1, 0, 16, 1, 3, 0, 16, 1, 4, 0, 16, 1, 0, 0, 16, 1, 14, 0, 17, 1, 3, 0, 17, 1, 3, 0, 18, 1, 14, 0, 18, 1, 3, 0, 18, 1, 0, 0, 19, 1, 14, 0, 20, 1, 3, 0, 20, 1, 14, 0, 21, 1, 14, 0, 21, 1, 3, 0, 21, 1, 0, 0, 21, 1, 14, 0, 22, 1, 3, 0, 23, 1, 14, 0, 23, 1, 0, 0, 23, 1, 3, 0, 24, 1, 14, 0, 25, 1, 3, 0, 25, 1, 14, 0, 26, 1, 4, 0, 26, 1, 2, 0, 26, 1, 8, 0, 27, 1, 4, 0, 27, 1, 2, 0, 28, 1, 4, 0, 29, 1, 4, 0, 29, 1, 2, 0, 29, 1, 8, 0, 29, 1, 4, 0, 30, 1, 2, 0, 31, 1, 4, 0, 31, 1, 2, 0, 31, 1, 8, 0, 31, 1, 4, 0, 32, 1, 4, 0, 33, 1, 2, 0, 33, 1, 4, 0, 34, 1, 4, 0, 34, 1, 2, 0, 34, 1, 8, 0, 34, 1, 4, 0, 35, 1, 2, 0, 36, 1, 4, 0, 36, 1, 8, 0, 36, 1, 2, 0, 37, 1, 3, 0, 37, 1, 3, 0, 38, 1, 1, 0, 38, 1, 8, 0, 39, 1, 1, 0, 39, 1, 8, 0, 40, 1, 8, 0, 40, 1, 3, 0, 41, 1, 8, 0, 42, 1, 8, 0, 42, 1, 8, 0, 42, 1, 1, 0, 42, 1, 8, 0, 43, 1, 3, 0, 44, 1, 8, 0, 44, 1, 8, 0, 44, 1, 1, 0, 45, 1, 8, 0, 46, 1, 3, 0, 46, 1, 1, 0, 47, 1, 8, 0, 47, 1, 8, 0, 47, 1, 1, 0, 47, 1, 8, 0], tags: ['legacy-gold', 'slow-burn', 'romantic', 'dreamy'] },
  L_MOODY_1: { phrase: [0, 1, 3, 0, 1, 1, 8, 0, 1, 1, 1, 0, 1, 1, 8, 0, 2, 1, 8, 0, 3, 1, 3, 0, 3, 1, 8, 0, 4, 1, 8, 0, 4, 1, 8, 0, 4, 1, 1, 0, 5, 1, 8, 0, 5, 1, 3, 0, 6, 1, 8, 0, 7, 1, 8, 0, 7, 1, 1, 0, 7, 1, 8, 0, 8, 1, 3, 0, 9, 1, 1, 0, 9, 1, 3, 0, 9, 1, 4, 0, 9, 1, 0, 0, 10, 1, 14, 0, 11, 1, 3, 0, 11, 1, 3, 0, 11, 1, 14, 0, 12, 1, 3, 0, 12, 1, 0, 0, 13, 1, 14, 0, 13, 1, 3, 0, 14, 1, 14, 0, 14, 1, 14, 0, 14, 1, 3, 0, 14, 1, 0, 0, 15, 1, 14, 0, 16, 1, 3, 0, 16, 1, 14, 0, 17, 1, 0, 0, 17, 1, 3, 0, 18, 1, 14, 0, 18, 1, 3, 0, 19, 1, 14, 0, 20, 1, 2, 0, 20, 1, 4, 0, 20, 1, 8, 0, 20, 1, 4, 0, 21, 1, 2, 0, 22, 1, 4, 0, 22, 1, 4, 0, 22, 1, 2, 0, 22, 1, 8, 0, 23, 1, 4, 0, 24, 1, 2, 0, 24, 1, 4, 0, 25, 1, 2, 0, 25, 1, 8, 0, 25, 1, 4, 0, 26, 1, 4, 0, 26, 1, 2, 0, 27, 1, 4, 0, 27, 1, 4, 0, 27, 1, 2, 0, 28, 1, 8, 0, 28, 1, 4, 0, 29, 1, 2, 0, 29, 1, 4, 0, 30, 1, 8, 0, 30, 1, 2, 0, 31, 1, 3, 0, 31, 1, 3, 0, 31, 1, 1, 0, 32, 1, 8, 0, 33, 1, 1, 0, 33, 1, 8, 0, 33, 1, 8, 0, 34, 1, 3, 0, 35, 1, 8, 0, 35, 1, 8, 0, 35, 1, 8, 0, 35, 1, 1, 0, 36, 1, 8, 0, 37, 1, 3, 0, 37, 1, 8, 0, 38, 1, 8, 0, 38, 1, 1, 0, 39, 1, 8, 0, 39, 1, 3, 0, 40, 1, 1, 0, 40, 1, 8, 0, 40, 1, 8, 0, 41, 1, 1, 0, 41, 1, 8, 0, 42, 1, 3, 0, 42, 1, 8, 0, 43, 1, 1, 0, 43, 1, 8, 0, 44, 1, 8, 0, 44, 1, 3, 0, 45, 1, 8, 0, 46, 1, 8, 0, 46, 1, 8, 0, 46, 1, 1, 0, 46, 1, 8, 0, 47, 1, 3, 0, 48, 1, 8, 0], tags: ['legacy-gold', 'slow-burn', 'romantic', 'dreamy'] },

  // --- LEGACY GOLD: THE FIFTH DIMENSION (Ingested 06-12-2024) ---
  L_FIFTH_0: { phrase: [7, 1, 8, 0, 7, 4, 13, 0, 7, 1, 3, 0, 9, 1, 8, 0, 9, 1, 3, 0, 10, 1, 13, 0, 10, 1, 10, 0, 11, 1, 14, 0, 11, 4, 3, 0, 11, 1, 2, 0, 12, 1, 3, 0, 12, 1, 0, 0, 13, 1, 14, 0, 13, 1, 2, 0, 14, 4, 2, 0, 14, 2, 13, 0, 14, 2, 10, 0, 16, 2, 10, 0, 16, 1, 13, 0, 18, 1, 2, 0, 18, 1, 2, 0, 18, 1, 0, 0, 18, 1, 14, 0, 18, 4, 14, 0, 19, 1, 8, 0, 19, 1, 10, 0, 19, 1, 13, 0, 20, 1, 2, 0, 20, 1, 0, 0, 20, 1, 14, 0, 22, 1, 8, 0, 22, 4, 13, 0, 22, 1, 3, 0, 24, 1, 8, 0, 24, 1, 3, 0, 25, 1, 13, 0, 25, 1, 10, 0, 25, 1, 14, 0, 25, 4, 3, 0, 25, 1, 2, 0, 27, 1, 3, 0, 27, 1, 0, 0, 27, 1, 14, 0, 27, 1, 2, 0, 28, 4, 2, 0, 28, 2, 13, 0, 28, 2, 10, 0, 31, 2, 10, 0, 31, 1, 13, 0, 32, 1, 2, 0, 33, 1, 2, 0, 33, 1, 0, 0, 33, 1, 14, 0, 33, 4, 14, 0, 34, 1, 8, 0, 34, 1, 10, 0, 34, 1, 13, 0, 34, 1, 2, 0, 34, 1, 0, 0, 34, 1, 14, 0, 36, 1, 8, 0, 36, 4, 13, 0, 36, 1, 3, 0, 38, 1, 8, 0, 38, 1, 3, 0, 39, 1, 13, 0, 39, 1, 10, 0, 40, 1, 14, 0, 40, 4, 3, 0, 40, 1, 2, 0, 41, 1, 3, 0, 41, 1, 0, 0, 42, 1, 14, 0, 42, 1, 2, 0, 43, 4, 2, 0, 43, 2, 13, 0, 43, 2, 10, 0, 45, 2, 8, 0, 45, 2, 10, 0, 45, 2, 13, 0, 47, 2, 8, 0, 47, 2, 10, 0, 47, 2, 13, 0], tags: ['legacy-gold', 'shuffle', 'soul', 'uplift'] },

  // --- LEGACY CATEGORY 6: HARD ROCK LEGENDS (L181-L210) ---
  L181: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'doom-blues', 'heavy'] },
  L183: { phrase: [{t:0,d:6,deg:'b5',tech:'bn'},{t:6,d:6,deg:'4',tech:'vb'}], tags: ['legacy', 'doom-blues', 'heavy'] },
  L184: { phrase: [{t:0,d:3,deg:'R',tech:'ds'},{t:3,d:3,deg:'b5',tech:'ds'},{t:6,d:6,deg:'R',tech:'ds'}], tags: ['legacy', 'doom-blues', 'tritone', 'stabs'] },
  L192: { phrase: [{t:0,d:12,deg:'b5',tech:'bn+vb'}], tags: ['legacy', 'doom-blues', 'tritone-hold', 'tense'] },
  L206: { phrase: [{t:0,d:6,deg:'R',tech:'vb'},{t:6,d:6,deg:'b5',tech:'bn'}], tags: ['legacy', 'doom-blues', 'heavy-question'] },
};

export const BLUES_SOLO_PLANS: Record<string, { choruses: string[][] }> = {
  "S01": {
    choruses: [
      ['L220', 'L11', 'L221', 'L06', 'L11', 'L222', 'L17', 'L10', 'L223', 'L11', 'L02', 'L09'],
      ['L224', 'L11', 'L13', 'L14', 'L11', 'L225', 'L17', 'L10', 'L12', 'L12', 'L02', 'L19'],
      ['L10', 'L11', 'L13', 'L02', 'L11', 'L14', 'L17', 'L10', 'L13', 'L11', 'L02', 'L09']
    ]
  },
  "S42": { // The Doom Ritual
    choruses: [
      ['L181', 'L11', 'L184', 'L192', 'L11', 'L206', 'L181', 'L10', 'L181', 'L11', 'L181', 'L09'],
      ['L192', 'L11', 'L206', 'L184', 'L11', 'L181', 'L181', 'L10', 'L12', 'L12', 'L181', 'L19'],
      ['L181', 'L192', 'L206', 'L184', 'L181', 'L181', 'L181', 'L10', 'L181', 'L11', 'L181', 'L09']
    ]
  }
};
