/**
 * @fileOverview Blues Guitar Solo Library (80+ Golden Licks)
 * #ЗАЧЕМ: Огромная оцифрованная база блюзового наследия.
 * #ЧТО: Секции: Texas (Alvin Lee), Soul (Gilmour), King (BB), Detroit, Chromatic.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
  // --- TEXAS DRIVE / ALVIN LEE (L01-L19) ---
  L01: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'R+8'}], tags: ['texas', 'fast', 'major'] },
  L02: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:1,deg:'6',tech:'h'},{t:4,d:2,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'shuffle', 'major'] },
  L03: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'2'},{t:4,d:2,deg:'b3',tech:'h'},{t:6,d:6,deg:'3',tech:'vb'}], tags: ['texas', 'twang'] },
  L04: { phrase: [{t:0,d:1.5,deg:'R'},{t:1.5,d:1.5,deg:'b3'},{t:3,d:1.5,deg:'3'},{t:4.5,d:1.5,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'rapid'] },

  // --- DEEP SOUL / GILMOUR (L30-L49) ---
  L30: { phrase: [{t:0,d:12,deg:'5',tech:'bn+vb'}, {t:12,d:12,deg:'R',tech:'vb'}], tags: ['soul', 'slow-burn', 'minor'] },
  L31: { phrase: [{t:0,d:9,deg:'b3',tech:'bn'}, {t:9,d:3,deg:'R'}, {t:12,d:12,deg:'b7',tech:'vb'}], tags: ['soul', 'cry', 'minor'] },
  L32: { phrase: [{t:0,d:12,deg:'9',tech:'bn'}, {t:12,d:12,deg:'5',tech:'vb'}], tags: ['soul', 'lift', 'major'] },
  L35: { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b7',tech:'sl'}, {t:12,d:12,deg:'5',tech:'vb'}], tags: ['soul', 'dreamy', 'minor'] },

  // --- B.B. KING / THE KING (L50-L59) ---
  L50: { phrase: [{t:0,d:3,deg:'R',tech:'gr'},{t:3,d:9,deg:'R',tech:'vb'}], tags: ['king', 'vibrato', 'major'] },
  L51: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['king', 'classic', 'major'] },
  L52: { phrase: [{t:0,d:2,deg:'R+8'},{t:2,d:4,deg:'R+8',tech:'vb'},{t:6,d:6,deg:'5'}], tags: ['king', 'sting', 'major'] },

  // --- DETROIT BLUES (L60-L69) ---
  L60: { phrase: [{t:0,d:6,deg:'R',tech:'ds'},{t:6,d:6,deg:'5',tech:'ds'}], tags: ['detroit', 'heavy', 'minor'] },
  L61: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3',tech:'bn'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['detroit', 'grit', 'minor'] },
  L62: { phrase: [{t:0,d:4,deg:'R'},{t:4,d:2,deg:'b7'},{t:6,d:6,deg:'5'}], tags: ['detroit', 'stable', 'minor'] },

  // --- CHROMATIC TENSION (L70-L80) ---
  L70: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b5'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'b3'}], tags: ['chromatic', 'tension', 'minor'] },
  L71: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b2'},{t:6,d:3,deg:'2'},{t:9,d:3,deg:'b3'}], tags: ['chromatic', 'anxious', 'minor'] },
  L72: { phrase: [{t:0,d:2,deg:'b7'},{t:2,d:2,deg:'7'},{t:4,d:2,deg:'R'},{t:6,d:6,deg:'3',tech:'h'}], tags: ['chromatic', 'turn', 'major'] },

  // --- SABBATH / HEAVY (L211+) ---
  L211: {
    phrase: [
      {t:0,d:4.5,deg:'R',tech:'sl'}, {t:4.5,d:1.5,deg:'5'}, {t:6,d:1.5,deg:'b7'}, {t:7.5,d:1.5,deg:'5'}, {t:9,d:1.5,deg:'#4'}, {t:10.5,d:1.5,deg:'5'},
      {t:12,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['heavy', 'doom-blues', 'legend']
  },
  L212: {
    phrase: [
      {t:0,d:4.5,deg:'R'}, {t:4.5,d:1.5,deg:'b3'}, {t:6,d:1.5,deg:'4'}, {t:7.5,d:1.5,deg:'b3'}, {t:9,d:3,deg:'R'},
      {t:12,d:12,deg:'7',tech:'bn'}
    ],
    tags: ['heavy', 'vocal', 'legend']
  }
};
