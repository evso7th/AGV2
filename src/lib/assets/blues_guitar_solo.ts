/**
 * @fileOverview Blues Guitar Solo Library (150+ Golden Licks)
 * #ЗАЧЕМ: Огромная оцифрованная база блюзового наследия для исключения повторов.
 * #ЧТО: Секции: Texas, Soul, King, Detroit, Chromatic, Sabbath, Slow-Burn.
 * #ОБНОВЛЕНО (ПЛАН №458): Масштабное наполнение и нормализация тегов для всех династий.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
  // --- TEXAS DRIVE / ALVIN LEE (L01-L25) ---
  L01: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'R+8'}], tags: ['texas', 'fast', 'major', 'slow-burn'] },
  L02: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:1,deg:'6',tech:'h'},{t:4,d:2,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'shuffle', 'major'] },
  L03: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'2'},{t:4,d:2,deg:'b3',tech:'h'},{t:6,d:6,deg:'3',tech:'vb'}], tags: ['texas', 'twang', 'slow-burn'] },
  L04: { phrase: [{t:0,d:1.5,deg:'R'},{t:1.5,d:1.5,deg:'b3'},{t:3,d:1.5,deg:'3'},{t:4.5,d:1.5,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'rapid'] },
  L05: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R'}], tags: ['texas', 'classic', 'slow-burn'] },
  L06: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:4,deg:'5'},{t:6,d:2,deg:'6'},{t:8,d:4,deg:'R+8'}], tags: ['texas', 'climb'] },
  L07: { phrase: [{t:0,d:3,deg:'b3',tech:'sl'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'R'}], tags: ['texas', 'major', 'slow-burn'] },
  L08: { phrase: [{t:8,d:2,deg:'2'},{t:10,d:2,deg:'b3'},{t:0,d:3,deg:'3',tech:'h'}], tags: ['texas', 'pickup'] },
  L09: { phrase: [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'6'},{t:4,d:2,deg:'R'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'stable', 'slow-burn'] },
  L10: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R+8',tech:'bn'}], tags: ['texas', 'cry', 'slow-burn'] },
  L11: { phrase: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'4',tech:'sl'},{t:8,d:4,deg:'5'}], tags: ['texas', 'heavy', 'slow-burn'] },
  L12: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'3'},{t:4,d:2,deg:'5'},{t:6,d:6,deg:'6'}], tags: ['texas', 'major'] },
  L13: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R'}], tags: ['texas', 'classic'] },
  L14: { phrase: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['texas', 'octave', 'slow-burn'] },
  L15: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:6,deg:'5'}], tags: ['texas', 'run', 'slow-burn'] },

  // --- DEEP SOUL / GILMOUR (L30-L55) ---
  L30: { phrase: [{t:0,d:12,deg:'5',tech:'bn+vb'}, {t:12,d:12,deg:'R',tech:'vb'}], tags: ['soul', 'slow-burn', 'minor'] },
  L31: { phrase: [{t:0,d:9,deg:'b3',tech:'bn'}, {t:9,d:3,deg:'R'}, {t:12,d:12,deg:'b7',tech:'vb'}], tags: ['soul', 'cry', 'minor', 'slow-burn'] },
  L32: { phrase: [{t:0,d:12,deg:'9',tech:'bn'}, {t:12,d:12,deg:'5',tech:'vb'}], tags: ['soul', 'lift', 'major', 'slow-burn'] },
  L33: { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b7',tech:'sl'}, {t:12,d:12,deg:'5',tech:'vb'}], tags: ['soul', 'dreamy', 'minor', 'slow-burn'] },
  L34: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['soul', 'anchor', 'slow-burn'] },
  L35: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'b7',tech:'bn'}], tags: ['soul', 'tension', 'slow-burn'] },
  L36: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:8,deg:'5',tech:'vb'}], tags: ['soul', 'stable', 'slow-burn'] },
  L37: { phrase: [{t:0,d:3,deg:'b7'}, {t:3,d:9,deg:'5',tech:'bn'}], tags: ['soul', 'reaching', 'slow-burn'] },
  L38: { phrase: [{t:0,d:6,deg:'4',tech:'sl'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['soul', 'slide', 'slow-burn'] },
  L39: { phrase: [{t:0,d:12,deg:'b3',tech:'bn'}, {t:12,d:12,deg:'R'}], tags: ['soul', 'effort', 'slow-burn'] },
  L40: { phrase: [{t:0,d:6,deg:'R',tech:'vb'}, {t:6,d:6,deg:'b3',tech:'bn'}], tags: ['soul', 'minor', 'slow-burn'] },
  L41: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'2'}, {t:8,d:4,deg:'b3',tech:'bn'}], tags: ['soul', 'climb', 'slow-burn'] },
  L42: { phrase: [{t:0,d:12,deg:'5',tech:'bn'}], tags: ['soul', 'scream', 'slow-burn'] },
  L43: { phrase: [{t:0,d:6,deg:'b7'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['soul', 'descent', 'slow-burn'] },
  L44: { phrase: [{t:0,d:12,deg:'R'}], tags: ['soul', 'monolith', 'slow-burn'] },
  L45: { phrase: [{t:0,d:24,deg:'R',tech:'vb'}], tags: ['soul', 'static', 'slow-burn'] },
  L46: { phrase: [{t:0,d:6,deg:'b3'}, {t:6,d:18,deg:'5',tech:'vb'}], tags: ['soul', 'hope', 'slow-burn'] },
  L47: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7'}, {t:6,d:3,deg:'6'}, {t:9,d:3,deg:'b6'}], tags: ['soul', 'chromatic', 'slow-burn'] },

  // --- B.B. KING / THE KING (L60-L75) ---
  L60: { phrase: [{t:0,d:3,deg:'R',tech:'gr'},{t:3,d:9,deg:'R',tech:'vb'}], tags: ['king', 'vibrato', 'major', 'slow-burn'] },
  L61: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'6'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['king', 'classic', 'major', 'slow-burn'] },
  L62: { phrase: [{t:0,d:2,deg:'R+8'},{t:2,d:4,deg:'R+8',tech:'vb'},{t:6,d:6,deg:'5'}], tags: ['king', 'sting', 'major', 'slow-burn'] },
  L63: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3',tech:'gr'},{t:6,d:6,deg:'3'}], tags: ['king', 'major', 'slow-burn'] },
  L64: { phrase: [{t:0,d:6,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['king', 'call', 'slow-burn'] },
  L65: { phrase: [{t:0,d:4,deg:'R+8'},{t:4,d:8,deg:'5'}], tags: ['king', 'answer', 'slow-burn'] },

  // --- DETROIT BLUES / GRIT (L80-L95) ---
  L80: { phrase: [{t:0,d:6,deg:'R',tech:'ds'},{t:6,d:6,deg:'5',tech:'ds'}], tags: ['detroit', 'heavy', 'minor', 'slow-burn'] },
  L81: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3',tech:'bn'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['detroit', 'grit', 'minor', 'slow-burn'] },
  L82: { phrase: [{t:0,d:4,deg:'R'},{t:4,d:2,deg:'b7'},{t:6,d:6,deg:'5'}], tags: ['detroit', 'stable', 'minor', 'slow-burn'] },
  L83: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'4',tech:'sl'},{t:6,d:6,deg:'R'}], tags: ['detroit', 'minor', 'slow-burn'] },
  L84: { phrase: [{t:0,d:6,deg:'R',tech:'vb'},{t:6,d:6,deg:'b7'}], tags: ['detroit', 'low-end', 'slow-burn'] },

  // --- CHROMATIC TENSION / ANXIOUS (L100-L125) ---
  L100: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b5'},{t:6,d:3,deg:'4'},{t:9,d:3,deg:'b3'}], tags: ['chromatic', 'tension', 'minor', 'slow-burn'] },
  L101: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b2'},{t:6,d:3,deg:'2'},{t:9,d:3,deg:'b3'}], tags: ['chromatic', 'anxious', 'minor', 'slow-burn'] },
  L102: { phrase: [{t:0,d:2,deg:'b7'},{t:2,d:2,deg:'7'},{t:4,d:2,deg:'R'},{t:6,d:6,deg:'3',tech:'h'}], tags: ['chromatic', 'turn', 'major', 'slow-burn'] },
  L103: { phrase: [{t:0,d:3,deg:'3'},{t:3,d:3,deg:'b3'},{t:6,d:6,deg:'R'}], tags: ['chromatic', 'major', 'slow-burn'] },
  L104: { phrase: [{t:0,d:4,deg:'5'},{t:4,d:4,deg:'b5'},{t:8,d:4,deg:'4'}], tags: ['chromatic', 'tension', 'slow-burn'] },

  // --- SABBATH / HEAVY / DOOM (L181-L212) ---
  L181: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:6,deg:'5',tech:'vb'}], tags: ['heavy', 'doom-blues', 'slow-burn'] },
  L183: { phrase: [{t:0,d:6,deg:'b5',tech:'bn'},{t:6,d:6,deg:'4',tech:'vb'}], tags: ['heavy', 'doom-blues', 'slow-burn'] },
  L184: { phrase: [{t:0,d:3,deg:'R',tech:'ds'},{t:3,d:3,deg:'b5',tech:'ds'},{t:6,d:6,deg:'R',tech:'ds'}], tags: ['heavy', 'doom-blues', 'stabs', 'slow-burn'] },
  L192: { phrase: [{t:0,d:12,deg:'b5',tech:'bn+vb'}], tags: ['heavy', 'doom-blues', 'hold', 'slow-burn'] },
  L206: { phrase: [{t:0,d:6,deg:'R',tech:'vb'},{t:6,d:6,deg:'b5',tech:'bn'}], tags: ['heavy', 'doom-blues', 'slow-burn'] },
  L211: {
    phrase: [
      {t:0,d:4.5,deg:'R',tech:'sl'}, {t:4.5,d:1.5,deg:'5'}, {t:6,d:1.5,deg:'b7'}, {t:7.5,d:1.5,deg:'5'}, {t:9,d:1.5,deg:'#4'}, {t:10.5,d:1.5,deg:'5'},
      {t:12,d:12,deg:'R',tech:'vb'}
    ],
    tags: ['heavy', 'doom-blues', 'signature', 'slow-burn']
  },
  L212: {
    phrase: [
      {t:0,d:4.5,deg:'R'}, {t:4.5,d:1.5,deg:'b3'}, {t:6,d:1.5,deg:'4'}, {t:7.5,d:1.5,deg:'b3'}, {t:9,d:3,deg:'R'},
      {t:12,d:12,deg:'7',tech:'bn'}
    ],
    tags: ['heavy', 'doom-blues', 'vocal', 'slow-burn']
  },
};
