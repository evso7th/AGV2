/**
 * @fileOverview Blues Guitar Solo Library (Licks and Plans)
 * #ЗАЧЕМ: Содержит оцифрованную библиотеку блюзовых гитарных соло.
 * #ЧТО: Экспортирует BLUES_SOLO_LICKS (211 ликов) и BLUES_SOLO_PLANS.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` и `music-theory.ts`.
 * #ОБНОВЛЕНО (ПЛАН №439): Добавлен L211_SABBATH_RIFF, оцифрованный с изображения пользователя.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
  // --- BASE MATHEMATICAL LICKS (L01-L30) ---
  L01: { phrase: [{t:0,d:3,deg:'b3',tech:'bn'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['minor', 'cry', 'slow-bend'] },
  L02: { phrase: [{t:0,d:3,deg:'b3',tech:'gr'}, {t:3,d:3,deg:'3'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['major', 'turn', 'classic'] },
  L03: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'4'}, {t:4,d:2,deg:'#4'}, {t:6,d:2,deg:'5'}, {t:8,d:2,deg:'6'}, {t:10,d:2,deg:'5'}], tags: ['major', 'boogie', 'answer'] },
  L04: { phrase: [{t:0,d:6,deg:'b3',tech:'vb'}, {t:6,d:6,deg:'11'}], tags: ['minor', 'pad', 'drone'] },
  L05: { phrase: [{t:0,d:3,deg:'b2',tech:'gr'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'b7'}], tags: ['minor', 'V-chord', 'tension'] },
  L06: { phrase: [{t:0,d:4,deg:'9'}, {t:4,d:8,deg:'R',tech:'vb'}], tags: ['major', 'dreamy', 'lift'] },
  L07: { phrase: [{t:0,d:6,deg:'5',tech:'ds'}, {t:6,d:6,deg:'R'}], tags: ['major', 'double-stop', 'cry'] },
  L08: { phrase: [{t:8,d:2,deg:'2'}, {t:10,d:2,deg:'b3'}, {t:0,d:3,deg:'3',tech:'h'}], tags: ['major', 'pickup', 'intro'] },
  L09: { phrase: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}], tags: ['turnaround', 'chromatic', 'classic'] },
  L10: { phrase: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['major', 'minor', 'octave-jump', 'sigh'] },
  L11: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'6',tech:'vb'}], tags: ['major', 'IV-chord', 'voicing'] },
  L12: { phrase: [{t:0,d:12,deg:'5',tech:'bn'}], tags: ['stop-time', 'scream', 'high-sustain'] },
  L13: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}], tags: ['major', 'run', 'boogie'] },
  L14: { phrase: [{t:0,d:3,deg:'4',tech:'sl'},{t:3,d:3,deg:'#4'},{t:6,d:6,deg:'6',tech:'vb'}], tags: ['major', 'slide', 'lift'] },
  L15: { phrase: [{t:0,d:3,deg:'b3',tech:'bn'},{t:3,d:3,deg:'2'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['minor', 'cry', 'quick'] },
  L16: { phrase: [{t:0,d:2,deg:'b2'},{t:2,d:2,deg:'R'},{t:4,d:2,deg:'b7'},{t:6,d:6,deg:'5'}], tags: ['minor', 'V-chord', 'chromatic'] },
  L17: { phrase: [{t:0,d:3,deg:'5',tech:'ds'},{t:3,d:3,deg:'6',tech:'ds'},{t:6,d:6,deg:'R'}], tags: ['major', 'double-stop', 'stabs'] },
  L18: { phrase: [{t:0,d:4,deg:'11'},{t:4,d:8,deg:'9'}], tags: ['minor', 'iv-chord', 'color'] },
  L19: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}], tags: ['turnaround', 'chromatic', 'descending'] },
  L20: { phrase: [{t:0,d:2,deg:'3'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'2'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b7'}], tags: ['major', 'chuck-berry', 'fast-run'] },
  L22_ACTIVE: { phrase: [{t:0,d:1,deg:'R'},{t:1,d:1,deg:'2'},{t:2,d:1,deg:'b3'},{t:3,d:1,deg:'3'},{t:4,d:2,deg:'5'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'b7'},{t:10,d:2,deg:'R+8'}], tags: ['major', 'virtuoso', 'climb', 'fast'] },
  L23_STACCATO: { phrase: [{t:0,d:1,deg:'5'},{t:2,d:1,deg:'5'},{t:4,d:1,deg:'5'},{t:6,d:2,deg:'b7',tech:'bn'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b3'}], tags: ['major', 'minor', 'staccato', 'stabs', 'active'] },
  L24_SHRED: { phrase: [{t:0,d:1,deg:'R+8'},{t:1,d:1,deg:'b7'},{t:2,d:1,deg:'6'},{t:3,d:1,deg:'5'},{t:4,d:1,deg:'4'},{t:5,d:1,deg:'b3'},{t:6,d:2,deg:'R',tech:'vb'},{t:8,d:4,deg:'R'}], tags: ['minor', 'shred', 'descending', 'virtuoso'] },
  L25_RESPONSE: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:1,deg:'5'},{t:7,d:1,deg:'4'},{t:8,d:1,deg:'b3'},{t:9,d:3,deg:'R'}], tags: ['major', 'minor', 'response', 'quick-talk'] },
  L26_ASCEND: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'2'},{t:4,d:2,deg:'b3'},{t:6,d:2,deg:'3'},{t:8,d:2,deg:'4'},{t:10,d:2,deg:'5'}], tags: ['major', 'scale', 'ascend', 'run'] },
  L27_DESCEND: { phrase: [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'4'},{t:4,d:2,deg:'b3'},{t:6,d:2,deg:'2'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b7'}], tags: ['minor', 'scale', 'descend', 'run'] },
  L28_TRILL: { phrase: [{t:0,d:1,deg:'5'},{t:1,d:1,deg:'b5'},{t:2,d:1,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['blues', 'trill', 'fast'] },
  L29_OCTAVE_ASC: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'5'},{t:6,d:3,deg:'R+8'},{t:9,d:3,deg:'b7'}], tags: ['major', 'octave', 'jump'] },
  L30_MINOR_PENTA: { phrase: [{t:0,d:2,deg:'b7'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'4'},{t:6,d:2,deg:'b3'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b7'}], tags: ['minor', 'pentatonic', 'descend'] },

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
  L41: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'slow-burn', 'soaring'] },
  L42: { phrase: [{t:0,d:6,deg:'R+8'}, {t:6,d:6,deg:'b7',tech:'bn'}], tags: ['legacy', 'slow-burn', 'high', 'cry'] },
  L43: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:10,deg:'5',tech:'vb'}], tags: ['legacy', 'slow-burn', 'wide-jump'] },
  L44: { phrase: [{t:0,d:6,deg:'b3',tech:'bn'}, {t:6,d:3,deg:'4'}, {t:9,d:3,deg:'5'}], tags: ['legacy', 'slow-burn', 'evolving'] },
  L45: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'4'}, {t:6,d:6,deg:'b3',tech:'vb'}], tags: ['legacy', 'slow-burn', 'resigned'] },
  L46: { phrase: [{t:0,d:12,deg:'4',tech:'bn'}], tags: ['legacy', 'slow-burn', 'tension-hold'] },
  L47: { phrase: [{t:0,d:6,deg:'b7'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'slow-burn', 'simple'] },
  L48: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b3'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'soul', 'ballad'] },
  L49: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:9,deg:'5',tech:'vb'}], tags: ['legacy', 'slow-burn', 'meditative'] },
  L50: { phrase: [{t:0,d:2,deg:'b7'}, {t:2,d:2,deg:'R'}, {t:4,d:8,deg:'5',tech:'bn'}], tags: ['legacy', 'slow-burn', 'reaching-up'] },
  L51: { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'b3',tech:'bn'}], tags: ['legacy', 'slow-burn', 'aching'] },
  L52: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'6'}, {t:6,d:6,deg:'R+8'}], tags: ['legacy', 'slow-burn', 'major', 'sweet'] },
  L53: { phrase: [{t:0,d:4,deg:'9'}, {t:4,d:8,deg:'5'}], tags: ['legacy', 'slow-burn', 'dreamy'] },
  L54: { phrase: [{t:0,d:12,deg:'b7',tech:'vb'}], tags: ['legacy', 'slow-burn', 'seventh-hold'] },
  L55: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'R',tech:'sl'}], tags: ['legacy', 'slow-burn', 'descent'] },
  L56: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'3'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'slow-burn', 'major-penta'] },
  L57: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'2'}, {t:4,d:8,deg:'R'}], tags: ['legacy', 'slow-burn', 'breath'] },
  L58: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'4',tech:'bn'}], tags: ['legacy', 'slow-burn', 'blues-node'] },
  L59: { phrase: [{t:0,d:3,deg:'b3'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'5',tech:'bn'}], tags: ['legacy', 'slow-burn', 'question'] },
  L60: { phrase: [{t:0,d:12,deg:'R',tech:'sl'}], tags: ['legacy', 'slow-burn', 'final-sigh'] },

  // --- LEGACY CATEGORY 6: HARD ROCK LEGENDS (L181-L210) ---
  L181: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'zeppelin', 'page-style', 'ornament'] },
  L182: { phrase: [{t:0,d:3,deg:'5',tech:'sl'},{t:3,d:3,deg:'7'},{t:6,d:6,deg:'R+8',tech:'bn'}], tags: ['legacy', 'zeppelin', 'climb', 'soaring'] },
  L183: { phrase: [{t:0,d:6,deg:'b5',tech:'bn'},{t:6,d:6,deg:'4',tech:'vb'}], tags: ['legacy', 'sabbath', 'doom-blues', 'heavy'] },
  L184: { phrase: [{t:0,d:3,deg:'R',tech:'ds'},{t:3,d:3,deg:'b5',tech:'ds'},{t:6,d:6,deg:'R',tech:'ds'}], tags: ['legacy', 'sabbath', 'tritone', 'stabs'] },
  L185: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b2'},{t:4,d:2,deg:'2'},{t:6,d:6,deg:'b3',tech:'sl'}], tags: ['legacy', 'doors', 'krieger-style', 'chromatic'] },
  L186: { phrase: [{t:0,d:4,deg:'9'},{t:4,d:4,deg:'b7'},{t:8,d:4,deg:'6'}], tags: ['legacy', 'doors', 'jazzy-resolve', 'mellow'] },
  L187: { phrase: [{t:0,d:1,deg:'R'},{t:1,d:1,deg:'b3'},{t:2,d:1,deg:'3'},{t:3,d:1,deg:'5'},{t:4,d:1,deg:'6'},{t:5,d:1,deg:'b7'},{t:6,d:6,deg:'R+8'}], tags: ['legacy', 'purple', 'blackmore-style', 'fast-run'] },
  L188: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7',tech:'h'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'heep', 'box-style', 'classic'] },
  L189: { phrase: [{t:0,d:1,deg:'R'},{t:1,d:1,deg:'b7'},{t:2,d:1,deg:'5'},{t:3,d:1,deg:'4'},{t:4,d:1,deg:'b3'},{t:5,d:1,deg:'R'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'ten-years-after', 'alvin-lee', 'shred'] },
  L190: { phrase: [{t:0,d:6,deg:'R',tech:'ds'},{t:6,d:6,deg:'b3',tech:'bn'}], tags: ['legacy', 'butterfly', 'heavy-stabs', 'psych'] },
  L191: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'4'},{t:6,d:2,deg:'b5'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'b7'}], tags: ['legacy', 'zeppelin', 'blues-scale', 'complete'] },
  L192: { phrase: [{t:0,d:12,deg:'b5',tech:'bn+vb'}], tags: ['legacy', 'sabbath', 'tritone-hold', 'tense'] },
  L193: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b3',tech:'h'},{t:6,d:6,deg:'R',tech:'p'}], tags: ['legacy', 'purple', 'blackmore-flick', 'ornament'] },
  L194: { phrase: [{t:0,d:4,deg:'R'},{t:4,d:4,deg:'b2',tech:'sl'},{t:8,d:4,deg:'R'}], tags: ['legacy', 'doors', 'chromatic-sigh'] },
  L195: { phrase: [{t:0,d:1,deg:'5'},{t:1,d:1,deg:'b7'},{t:2,d:1,deg:'R+8'},{t:3,d:9,deg:'R+8',tech:'vb'}], tags: ['legacy', 'heep', 'high-climb'] },
  L196: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'R'},{t:6,d:6,deg:'b7',tech:'bn'}], tags: ['legacy', 'zeppelin', 'page-shuffle'] },
  L197: { phrase: [{t:0,d:6,deg:'R',tech:'ds'},{t:6,d:6,deg:'b7',tech:'ds'}], tags: ['legacy', 'sabbath', 'power-chordal'] },
  L198: { phrase: [{t:0,d:3,deg:'9'},{t:3,d:3,deg:'R'},{t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'doors', 'jazz-blues'] },
  L199: { phrase: [{t:0,d:1,deg:'R'},{t:1,d:1,deg:'b3'},{t:2,d:1,deg:'4'},{t:3,d:1,deg:'b5'},{t:4,d:8,deg:'5',tech:'vb'}], tags: ['legacy', 'purple', 'shred-climb'] },
  L200: { phrase: [{t:0,d:12,deg:'R+8',tech:'vb'}], tags: ['legacy', 'butterfly', 'psych-hold'] },
  L201: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'R'},{t:6,d:2,deg:'b3'},{t:8,d:4,deg:'R'}], tags: ['legacy', 'ten-years-after', 'repetitive-burn'] },
  L202: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R',tech:'bn'}], tags: ['legacy', 'heep', 'rock-resolution'] },
  L203: { phrase: [{t:0,d:6,deg:'b3',tech:'sl'},{t:6,d:6,deg:'R'}], tags: ['legacy', 'zeppelin', 'lazy-slide'] },
  L204: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b2'},{t:4,d:2,deg:'2'},{t:6,d:6,deg:'3'}], tags: ['legacy', 'doors', 'chromatic-rise'] },
  L205: { phrase: [{t:0,d:1,deg:'5'},{t:1,d:1,deg:'4'},{t:2,d:1,deg:'b3'},{t:3,d:9,deg:'R',tech:'vb'}], tags: ['legacy', 'purple', 'major-fall'] },
  L206: { phrase: [{t:0,d:6,deg:'R',tech:'vb'},{t:6,d:6,deg:'b5',tech:'bn'}], tags: ['legacy', 'sabbath', 'heavy-question'] },
  L207: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'heep', 'reaching-up'] },
  L208: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'4'},{t:6,d:6,deg:'R',tech:'sl'}], tags: ['legacy', 'zeppelin', 'anchored-slide'] },
  L209: { phrase: [{t:0,d:4,deg:'5'},{t:4,d:4,deg:'6'},{t:8,d:4,deg:'R'}], tags: ['legacy', 'butterfly', 'ascending-stable'] },
  L210: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['legacy', 'ten-years-after', 'final-shred-anchor'] },

  // --- NEW: SABBATH SIGNATURE RIFF (L211) — Digitized from image ---
  L211_SABBATH_RIFF: {
    phrase: [
      // Bar 1 (G minor base)
      {t:0,d:4.5,deg:'R',tech:'sl'}, {t:4.5,d:1.5,deg:'5'}, {t:6,d:1.5,deg:'b7'}, {t:7.5,d:1.5,deg:'5'}, {t:9,d:1.5,deg:'#4'}, {t:10.5,d:1.5,deg:'5'},
      // Bar 2 (G minor variant)
      {t:12,d:4.5,deg:'R',tech:'vb'}, {t:16.5,d:1.5,deg:'5'}, {t:18,d:1.5,deg:'b7'}, {t:19.5,d:1.5,deg:'b5',tech:'bn'}, {t:21,d:1.5,deg:'b7'}, {t:22.5,d:1.5,deg:'b5'},
      // Bar 3 (Rising Hope)
      {t:24,d:4.5,deg:'R'}, {t:28.5,d:1.5,deg:'b3',tech:'h'}, {t:30,d:1.5,deg:'4',tech:'p'}, {t:31.5,d:4.5,deg:'5',tech:'vb'}
    ],
    tags: ['legacy', 'sabbath', 'doom-blues', 'heavy', 'signature']
  },
};

// 25 планов соло, каждый на 36 тактов (3 хора по 12 тактов)
export const BLUES_SOLO_PLANS: Record<string, { choruses: string[][] }> = {
  "S01": {
    choruses: [
      ['L26_ASCEND', 'L11', 'L13', 'L06', 'L11', 'L27_DESCEND', 'L17', 'L10', 'L13', 'L11', 'L02', 'L09'],
      ['L08', 'L11', 'L13', 'L14', 'L11', 'L28_TRILL', 'L17', 'L10', 'L12', 'L12', 'L02', 'L19'],
      ['L10', 'L11', 'L29_OCTAVE_ASC', 'L02', 'L11', 'L14', 'L17', 'L10', 'L30_MINOR_PENTA', 'L11', 'L02', 'L09']
    ]
  },
  "S04": { // Smoother for Winter Blues (Active Start)
    choruses: [
      ['L26_ASCEND', 'L11', 'L04', 'L27_DESCEND', 'L11', 'L04', 'L03', 'L10', 'L28_TRILL', 'L11', 'L02', 'L09'],
      ['L08', 'L11', 'L04', 'L01', 'L11', 'L30_MINOR_PENTA', 'L03', 'L10', 'L12', 'L12', 'L01', 'L19'],
      ['L10', 'L11', 'L29_OCTAVE_ASC', 'L06', 'L11', 'L04', 'L03', 'L10', 'L06', 'L11', 'L02', 'L09']
    ]
  },
  "S06": { // Dark/Minor
    choruses: [
      ['L01', 'L11', 'L03', 'L04', 'L11', 'L04', 'L03', 'L10', 'L18', 'L05', 'L01', 'L19'],
      ['L15', 'L11', 'L03', 'L04', 'L11', 'L04', 'L03', 'L10', 'L12', 'L12', 'L01', 'L09'],
      ['L10', 'L11', 'L03', 'L01', 'L11', 'L04', 'L03', 'L10', 'L18', 'L05', 'L01', 'L09']
    ]
  },
  "S_ACTIVE": { // High density plan for "Blues Explosion"
    choruses: [
      ['L22_ACTIVE', 'L23_STACCATO', 'L25_RESPONSE', 'L22_ACTIVE', 'L23_STACCATO', 'L25_RESPONSE', 'L22_ACTIVE', 'L23_STACCATO', 'L24_SHRED', 'L25_RESPONSE', 'L22_ACTIVE', 'L09'],
      ['L24_SHRED', 'L25_RESPONSE', 'L22_ACTIVE', 'L23_STACCATO', 'L24_SHRED', 'L25_RESPONSE', 'L22_ACTIVE', 'L23_STACCATO', 'L12', 'L12', 'L24_SHRED', 'L19'],
      ['L22_ACTIVE', 'L24_SHRED', 'L22_ACTIVE', 'L24_SHRED', 'L22_ACTIVE', 'L24_SHRED', 'L22_ACTIVE', 'L24_SHRED', 'L22_ACTIVE', 'L24_SHRED', 'L22_ACTIVE', 'L09']
    ]
  },
  "WINTER_OUTRO_MELODY": {
    choruses: [
      ['L04', 'L04', 'L04', 'L04', 'L04', 'L04', 'L04', 'L04', 'L04', 'L04', 'L04', 'L04']
    ]
  },
  
  // --- LEGACY PLANS (S21-S40) ---
  
  "S21": { // Slow Burn Masterpiece
    choruses: [
      ['L31', 'L33', 'L35', 'L36', 'L38', 'L40', 'L45', 'L47', 'L48', 'L50', 'L51', 'L09'],
      ['L32', 'L34', 'L37', 'L39', 'L41', 'L42', 'L43', 'L44', 'L12', 'L12', 'L55', 'L19'],
      ['L52', 'L53', 'L54', 'L56', 'L57', 'L58', 'L59', 'L60', 'L31', 'L32', 'L33', 'L09']
    ]
  },
  "S25": { // Texas Shuffle Core
    choruses: [
      ['L61', 'L62', 'L63', 'L64', 'L65', 'L66', 'L67', 'L68', 'L69', 'L70', 'L71', 'L09'],
      ['L72', 'L73', 'L74', 'L75', 'L76', 'L77', 'L78', 'L79', 'L12', 'L12', 'L80', 'L19'],
      ['L81', 'L82', 'L83', 'L84', 'L85', 'L86', 'L87', 'L88', 'L89', 'L90', 'L61', 'L09']
    ]
  },
  "S29": { // Jazzy Sophistication
    choruses: [
      ['L91', 'L92', 'L93', 'L94', 'L95', 'L96', 'L97', 'L98', 'L99', 'L100', 'L101', 'L09'],
      ['L102', 'L103', 'L104', 'L105', 'L106', 'L107', 'L108', 'L109', 'L12', 'L12', 'L110', 'L19'],
      ['L111', 'L112', 'L113', 'L114', 'L115', 'L116', 'L117', 'L118', 'L119', 'L120', 'L91', 'L09']
    ]
  },
  "S33": { // Soulful Emotions
    choruses: [
      ['L121', 'L122', 'L123', 'L124', 'L125', 'L126', 'L127', 'L128', 'L129', 'L130', 'L131', 'L09'],
      ['L132', 'L133', 'L134', 'L135', 'L136', 'L137', 'L138', 'L139', 'L12', 'L12', 'L140', 'L19'],
      ['L141', 'L142', 'L143', 'L144', 'L145', 'L146', 'L147', 'L148', 'L149', 'L150', 'L121', 'L09']
    ]
  },
  "S37": { // Virtuoso Explosion
    choruses: [
      ['L151', 'L152', 'L153', 'L154', 'L155', 'L156', 'L157', 'L158', 'L159', 'L160', 'L161', 'L09'],
      ['L162', 'L163', 'L164', 'L165', 'L166', 'L167', 'L168', 'L169', 'L12', 'L12', 'L170', 'L19'],
      ['L171', 'L172', 'L173', 'L174', 'L175', 'L176', 'L177', 'L178', 'L179', 'L180', 'L151', 'L09']
    ]
  },

  // --- HARD ROCK LEGENDS PLANS (S41-S45) ---

  "S41": { // Hard Rock Blues Anthology (Zeppelin & Purple)
    choruses: [
      ['L181', 'L11', 'L191', 'L182', 'L11', 'L193', 'L181', 'L10', 'L196', 'L11', 'L181', 'L09'],
      ['L191', 'L11', 'L187', 'L199', 'L11', 'L193', 'L181', 'L10', 'L12', 'L12', 'L182', 'L19'],
      ['L181', 'L187', 'L191', 'L199', 'L181', 'L193', 'L181', 'L10', 'L181', 'L11', 'L181', 'L09']
    ]
  },
  "S42": { // The Doom Ritual (Sabbath focus)
    choruses: [
      ['L183', 'L11', 'L184', 'L192', 'L11', 'L206', 'L183', 'L10', 'L197', 'L11', 'L183', 'L09'],
      ['L192', 'L11', 'L206', 'L184', 'L11', 'L197', 'L183', 'L10', 'L12', 'L12', 'L183', 'L19'],
      ['L183', 'L192', 'L206', 'L184', 'L183', 'L197', 'L183', 'L10', 'L183', 'L11', 'L183', 'L09']
    ]
  },
  "S43": { // Psychedelic Doors
    choruses: [
      ['L185', 'L11', 'L194', 'L186', 'L11', 'L198', 'L185', 'L10', 'L200', 'L11', 'L185', 'L09'],
      ['L194', 'L11', 'L198', 'L186', 'L11', 'L204', 'L185', 'L10', 'L12', 'L12', 'L186', 'L19'],
      ['L185', 'L194', 'L198', 'L186', 'L185', 'L204', 'L185', 'L10', 'L185', 'L11', 'L185', 'L09']
    ]
  },
  "S44": { // Speed King (Ten Years After & Heep)
    choruses: [
      ['L189', 'L11', 'L201', 'L188', 'L11', 'L195', 'L189', 'L10', 'L207', 'L11', 'L189', 'L09'],
      ['L201', 'L11', 'L195', 'L188', 'L11', 'L202', 'L189', 'L10', 'L12', 'L12', 'L210', 'L19'],
      ['L189', 'L201', 'L195', 'L188', 'L189', 'L207', 'L189', 'L10', 'L189', 'L11', 'L189', 'L09']
    ]
  },
  "S45": { // Anthology Mix (The Legends United)
    choruses: [
      ['L181', 'L183', 'L185', 'L187', 'L189', 'L191', 'L193', 'L195', 'L197', 'L199', 'L201', 'L09'],
      ['L182', 'L184', 'L186', 'L188', 'L190', 'L192', 'L194', 'L196', 'L12', 'L12', 'L210', 'L19'],
      ['L200', 'L202', 'L204', 'L206', 'L208', 'L210', 'L181', 'L183', 'L185', 'L187', 'L189', 'L09']
    ]
  }
};
