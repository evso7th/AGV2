/**
 * @fileOverview Blues Guitar Solo Library (Licks and Plans)
 * #ЗАЧЕМ: Содержит оцифрованную библиотеку блюзовых гитарных соло.
 * #ЧТО: Экспортирует BLUES_SOLO_LICKS (180 ликов) и BLUES_SOLO_PLANS.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` и `music-theory.ts`.
 * #ОБНОВЛЕНО (ПЛАН №290): Внедрено 150 Legacy-ликов (L31-L180) для культурного наследования.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

// Структура события: { t: tick, d: duration_in_ticks, deg: degree, tech?: technique }
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
  // Deep bends, longing sustains, slow vibrato. Inspired by David Gilmour & Peter Green.
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
  L48: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b3'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'slow-burn', 'minimal'] },
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

  // --- LEGACY CATEGORY 2: TEXAS SHUFFLE (L61-L90) ---
  // Rhythmic, triplet-based, aggressive pick attack. Inspired by Stevie Ray Vaughan.
  L61: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'R'}, {t:4,d:2,deg:'R'}, {t:6,d:6,deg:'b3',tech:'bn'}], tags: ['legacy', 'texas', 'rhythmic', 'stabs'] },
  L62: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'R'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'texas', 'answer'] },
  L63: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3'}, {t:4,d:2,deg:'3'}, {t:6,d:2,deg:'5'}, {t:8,d:4,deg:'6'}], tags: ['legacy', 'texas', 'major-run'] },
  L64: { phrase: [{t:0,d:3,deg:'5',tech:'ds'}, {t:3,d:3,deg:'5',tech:'ds'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'texas', 'double-stop'] },
  L65: { phrase: [{t:0,d:2,deg:'b7'}, {t:2,d:2,deg:'5'}, {t:4,d:2,deg:'4'}, {t:6,d:2,deg:'b3'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'texas', 'penta-descend'] },
  L66: { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'b3'}, {t:2,d:1,deg:'3'}, {t:3,d:3,deg:'5'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'texas', 'rake', 'fast'] },
  L67: { phrase: [{t:0,d:3,deg:'R',tech:'ds'}, {t:3,d:3,deg:'b3',tech:'ds'}, {t:6,d:6,deg:'R',tech:'ds'}], tags: ['legacy', 'texas', 'chordal'] },
  L68: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'6'}, {t:4,d:2,deg:'b7'}, {t:6,d:6,deg:'R+8'}], tags: ['legacy', 'texas', 'climb'] },
  L69: { phrase: [{t:0,d:4,deg:'R',tech:'sl'}, {t:4,d:4,deg:'R',tech:'sl'}, {t:8,d:4,deg:'R',tech:'sl'}], tags: ['legacy', 'texas', 'sliding-roots'] },
  L70: { phrase: [{t:0,d:3,deg:'b3',tech:'h'}, {t:3,d:3,deg:'3',tech:'p'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'texas', 'ornament'] },
  L71: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'5'}, {t:6,d:6,deg:'4',tech:'bn'}], tags: ['legacy', 'texas', 'tension-end'] },
  L72: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b7'}, {t:6,d:3,deg:'R+8'}, {t:9,d:3,deg:'b7'}], tags: ['legacy', 'texas', 'syncopated'] },
  L73: { phrase: [{t:0,d:6,deg:'5',tech:'vb'}, {t:6,d:2,deg:'4'}, {t:8,d:2,deg:'b3'}, {t:10,d:2,deg:'R'}], tags: ['legacy', 'texas', 'descent'] },
  L74: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3'}, {t:4,d:2,deg:'R'}, {t:6,d:6,deg:'b7',tech:'vb'}], tags: ['legacy', 'texas', 'shuffle-riff'] },
  L75: { phrase: [{t:0,d:3,deg:'R',tech:'gr'}, {t:3,d:3,deg:'5'}, {t:6,d:6,deg:'R+8',tech:'bn'}], tags: ['legacy', 'texas', 'big-bend'] },
  L76: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'2'}, {t:4,d:2,deg:'b3'}, {t:6,d:2,deg:'3'}, {t:8,d:2,deg:'5'}, {t:10,d:2,deg:'6'}], tags: ['legacy', 'texas', 'chromatic-run'] },
  L77: { phrase: [{t:0,d:4,deg:'R',tech:'vb'}, {t:4,d:2,deg:'5'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'texas', 'heavy-root'] },
  L78: { phrase: [{t:0,d:3,deg:'b7'}, {t:3,d:3,deg:'5'}, {t:6,d:6,deg:'b3',tech:'bn'}], tags: ['legacy', 'texas', 'blues-fall'] },
  L79: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'5'}, {t:4,d:2,deg:'R'}, {t:6,d:2,deg:'b7'}, {t:8,d:2,deg:'R'}, {t:10,d:2,deg:'5'}], tags: ['legacy', 'texas', 'rolling-stabs'] },
  L80: { phrase: [{t:0,d:6,deg:'R',tech:'ds'}, {t:6,d:6,deg:'b3',tech:'bn'}], tags: ['legacy', 'texas', 'aggressive-start'] },
  L81: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'texas', 'high-road'] },
  L82: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3'}, {t:4,d:2,deg:'R'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'texas', 'standard'] },
  L83: { phrase: [{t:0,d:3,deg:'b7',tech:'h'}, {t:3,d:3,deg:'R+8',tech:'p'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'texas', 'flick'] },
  L84: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b7'}, {t:8,d:4,deg:'5'}], tags: ['legacy', 'texas', 'triplet-feel'] },
  L85: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'4'}, {t:4,d:2,deg:'b3'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'texas', 'resolution'] },
  L86: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3',tech:'bn'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'texas', 'quick-aching'] },
  L87: { phrase: [{t:0,d:6,deg:'R',tech:'ds'}, {t:6,d:6,deg:'5',tech:'ds'}], tags: ['legacy', 'texas', 'power-chordal'] },
  L88: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'6'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'texas', 'classic-tail'] },
  L89: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['legacy', 'texas', 'anchor-long'] },
  L90: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R',tech:'h'}], tags: ['legacy', 'texas', 'ascending-end'] },

  // --- LEGACY CATEGORY 3: JAZZY BLUES (L91-L120) ---
  // Dorian 6ths, 9ths, chromatic enclosures. Inspired by B.B. King & T-Bone Walker.
  L91: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'9',tech:'gr'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'jazzy', 'bb-king', 'sweet'] },
  L92: { phrase: [{t:0,d:4,deg:'5'}, {t:4,d:4,deg:'6'}, {t:8,d:4,deg:'R+8'}], tags: ['legacy', 'jazzy', 'dorian-six'] },
  L93: { phrase: [{t:0,d:3,deg:'3',tech:'gr'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'jazzy', 'major-feel'] },
  L94: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'6'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'jazzy', 't-bone'] },
  L95: { phrase: [{t:0,d:3,deg:'9'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'b7'}], tags: ['legacy', 'jazzy', 'cool-school'] },
  L96: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'b6'}, {t:4,d:2,deg:'6'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'jazzy', 'chromatic-climb'] },
  L97: { phrase: [{t:0,d:6,deg:'R',tech:'vb'}, {t:6,d:6,deg:'9'}], tags: ['legacy', 'jazzy', 'lift'] },
  L98: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'6'}], tags: ['legacy', 'jazzy', 'six-resolve'] },
  L99: { phrase: [{t:0,d:4,deg:'5'}, {t:4,d:4,deg:'R'}, {t:8,d:4,deg:'9'}], tags: ['legacy', 'jazzy', 'stable-ninth'] },
  L100: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3',tech:'gr'}, {t:6,d:6,deg:'3',tech:'vb'}], tags: ['legacy', 'jazzy', 'major-minor-blur'] },
  L101: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'2'}, {t:4,d:2,deg:'b3'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'jazzy', 'enclosure'] },
  L102: { phrase: [{t:0,d:6,deg:'5',tech:'vb'}, {t:6,d:6,deg:'6'}], tags: ['legacy', 'jazzy', 'mellow-six'] },
  L103: { phrase: [{t:0,d:3,deg:'9'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'jazzy', 'pop-blues'] },
  L104: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:8,deg:'b7',tech:'vb'}], tags: ['legacy', 'jazzy', 'long-seventh'] },
  L105: { phrase: [{t:0,d:3,deg:'5',tech:'gr'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'9'}], tags: ['legacy', 'jazzy', 'ninth-lift'] },
  L106: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'6'}, {t:6,d:2,deg:'5'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'jazzy', 'classic-descent'] },
  L107: { phrase: [{t:0,d:6,deg:'3',tech:'vb'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'jazzy', 'major-anchor'] },
  L108: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'9'}, {t:6,d:6,deg:'R+8'}], tags: ['legacy', 'jazzy', 'octave-run'] },
  L109: { phrase: [{t:0,d:4,deg:'5'}, {t:4,d:4,deg:'6'}, {t:8,d:4,deg:'5'}], tags: ['legacy', 'jazzy', 'wavering-six'] },
  L110: { phrase: [{t:0,d:12,deg:'9',tech:'vb'}], tags: ['legacy', 'jazzy', 'hold-ninth'] },
  L111: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R',tech:'sl'}], tags: ['legacy', 'jazzy', 'descent-slide'] },
  L112: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'jazzy', 'high-resolution'] },
  L113: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'9'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'jazzy', 'motive'] },
  L114: { phrase: [{t:0,d:3,deg:'b7'}, {t:3,d:3,deg:'6'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'jazzy', 'descending-six'] },
  L115: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3'}, {t:4,d:2,deg:'3'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'jazzy', 'quick-blur'] },
  L116: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['legacy', 'jazzy', 'pure-anchor'] },
  L117: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'6'}], tags: ['legacy', 'jazzy', 'sixth-swell'] },
  L118: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'jazzy', 'v-chord-answer'] },
  L119: { phrase: [{t:0,d:4,deg:'9'}, {t:4,d:4,deg:'R'}, {t:8,d:4,deg:'b7'}], tags: ['legacy', 'jazzy', 'soulful-descent'] },
  L120: { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'jazzy', 'final-call'] },

  // --- LEGACY CATEGORY 4: SOUL BALLAD (L121-L150) ---
  // Arpeggiated, lush grace notes, major pentatonic focus. Inspired by Curtis Mayfield & Albert King.
  L121: { phrase: [{t:0,d:4,deg:'R',tech:'sl'}, {t:4,d:4,deg:'3'}, {t:8,d:4,deg:'5',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'major-sweet'] },
  L122: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'2',tech:'h'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'soul', 'ballad', 'ornament'] },
  L123: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'reaching-hope'] },
  L124: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7',tech:'ds'}, {t:6,d:6,deg:'5',tech:'ds'}], tags: ['legacy', 'soul', 'ballad', 'double-stop-lush'] },
  L125: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'9'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'soul', 'ballad', 'mellow-motif'] },
  L126: { phrase: [{t:0,d:6,deg:'3',tech:'vb'}, {t:6,d:6,deg:'2'}], tags: ['legacy', 'soul', 'ballad', 'falling-star'] },
  L127: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'5',tech:'sl'}, {t:6,d:6,deg:'R+8'}], tags: ['legacy', 'soul', 'ballad', 'climb-up'] },
  L128: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'peaceful-hold'] },
  L129: { phrase: [{t:0,d:4,deg:'5'}, {t:4,d:4,deg:'R'}, {t:8,d:4,deg:'b7'}], tags: ['legacy', 'soul', 'ballad', 'gentle-answer'] },
  L130: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3',tech:'bn'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'soul', 'ballad', 'sigh'] },
  L131: { phrase: [{t:0,d:6,deg:'R+8'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'high-descent'] },
  L132: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'3'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'soul', 'ballad', 'major-anchor'] },
  L133: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'standard-rise'] },
  L134: { phrase: [{t:0,d:6,deg:'R',tech:'sl'}, {t:6,d:6,deg:'b3',tech:'bn'}], tags: ['legacy', 'soul', 'ballad', 'aching-start'] },
  L135: { phrase: [{t:0,d:12,deg:'5',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'warm-fifth'] },
  L136: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'5'}], tags: ['legacy', 'soul', 'ballad', 'blues-reply'] },
  L137: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'2'}, {t:8,d:4,deg:'3'}], tags: ['legacy', 'soul', 'ballad', 'lifting-hope'] },
  L138: { phrase: [{t:0,d:6,deg:'5',tech:'vb'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'soul', 'ballad', 'resolution'] },
  L139: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'9'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'bb-style-warm'] },
  L140: { phrase: [{t:0,d:12,deg:'R'}], tags: ['legacy', 'soul', 'ballad', 'silence-anchor'] },
  L141: { phrase: [{t:0,d:6,deg:'5'}, {t:6,d:6,deg:'b7',tech:'bn'}], tags: ['legacy', 'soul', 'ballad', 'longing-seven'] },
  L142: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b3'}, {t:8,d:4,deg:'R'}], tags: ['legacy', 'soul', 'ballad', 'gentle-cry'] },
  L143: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'5'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'soaring-spirit'] },
  L144: { phrase: [{t:0,d:6,deg:'R+8'}, {t:6,d:6,deg:'b7',tech:'bn'}], tags: ['legacy', 'soul', 'ballad', 'descending-tear'] },
  L145: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b7'}, {t:8,d:4,deg:'5'}], tags: ['legacy', 'soul', 'ballad', 'blues-root'] },
  L146: { phrase: [{t:0,d:12,deg:'3',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'major-third-hold'] },
  L147: { phrase: [{t:0,d:6,deg:'R'}, {t:6,d:6,deg:'9',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'ninth-answer'] },
  L148: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'b7'}], tags: ['legacy', 'soul', 'ballad', 'cool-descent'] },
  L149: { phrase: [{t:0,d:4,deg:'R',tech:'sl'}, {t:4,d:8,deg:'5'}], tags: ['legacy', 'soul', 'ballad', 'sliding-fifth'] },
  L150: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['legacy', 'soul', 'ballad', 'final-peace'] },

  // --- LEGACY CATEGORY 5: VIRTUOSO/ACTIVE (L151-L180) ---
  // High density, fast runs, syncopation. Inspired by Buddy Guy & Gary Moore.
  L151: { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'b3'}, {t:2,d:1,deg:'R'}, {t:3,d:1,deg:'b3'}, {t:4,d:8,deg:'5',tech:'bn'}], tags: ['legacy', 'virtuoso', 'tremor', 'active'] },
  L152: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'4'}, {t:4,d:2,deg:'b3'}, {t:6,d:2,deg:'R'}, {t:8,d:4,deg:'5',tech:'vb'}], tags: ['legacy', 'virtuoso', 'rapid-descent'] },
  L153: { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'2'}, {t:2,d:1,deg:'b3'}, {t:3,d:1,deg:'3'}, {t:4,d:8,deg:'5',tech:'vb'}], tags: ['legacy', 'virtuoso', 'chromatic-climb'] },
  L154: { phrase: [{t:0,d:2,deg:'R+8'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'5'}, {t:6,d:6,deg:'R',tech:'vb'}], tags: ['legacy', 'virtuoso', 'shred-light'] },
  L155: { phrase: [{t:0,d:3,deg:'R',tech:'ds'}, {t:3,d:3,deg:'b3',tech:'ds'}, {t:6,d:6,deg:'R',tech:'ds'}], tags: ['legacy', 'virtuoso', 'double-stabs'] },
  L156: { phrase: [{t:0,d:1,deg:'5'}, {t:1,d:1,deg:'b5'}, {t:2,d:1,deg:'4'}, {t:3,d:9,deg:'R',tech:'vb'}], tags: ['legacy', 'virtuoso', 'blue-run'] },
  L157: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'R'}, {t:6,d:6,deg:'R+8',tech:'bn'}], tags: ['legacy', 'virtuoso', 'power-bend'] },
  L158: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b3',tech:'h'}, {t:6,d:3,deg:'R',tech:'p'}, {t:9,d:3,deg:'b7'}], tags: ['legacy', 'virtuoso', 'hammer-pull-fast'] },
  L159: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'R+8'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'virtuoso', 'triadic-jump'] },
  L160: { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'b3'}, {t:2,d:1,deg:'4'}, {t:3,d:1,deg:'b5'}, {t:4,d:1,deg:'5'}, {t:5,d:1,deg:'b7'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'virtuoso', 'complete-scale'] },
  L161: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'R',tech:'bn'}], tags: ['legacy', 'virtuoso', 'rhythmic-bend'] },
  L162: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'R'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'virtuoso', 'standard-active'] },
  L163: { phrase: [{t:0,d:1,deg:'R+8'}, {t:1,d:1,deg:'b7'}, {t:2,d:1,deg:'5'}, {t:3,d:1,deg:'4'}, {t:4,d:8,deg:'R',tech:'vb'}], tags: ['legacy', 'virtuoso', 'descending-shred'] },
  L164: { phrase: [{t:0,d:3,deg:'R',tech:'h'}, {t:3,d:3,deg:'b3',tech:'p'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'virtuoso', 'quick-ornament'] },
  L165: { phrase: [{t:0,d:2,deg:'5'}, {t:2,d:2,deg:'R'}, {t:4,d:8,deg:'5',tech:'bn'}], tags: ['legacy', 'virtuoso', 'wide-bend'] },
  L166: { phrase: [{t:0,d:3,deg:'R'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'virtuoso', 'climb-up-fast'] },
  L167: { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'b3'}, {t:2,d:1,deg:'4'}, {t:3,d:9,deg:'5',tech:'bn'}], tags: ['legacy', 'virtuoso', 'reaching-scream'] },
  L168: { phrase: [{t:0,d:6,deg:'R',tech:'vb'}, {t:6,d:6,deg:'R',tech:'sl'}], tags: ['legacy', 'virtuoso', 'anchor-movement'] },
  L169: { phrase: [{t:0,d:3,deg:'b7'}, {t:3,d:3,deg:'5'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'virtuoso', 'blues-resolution'] },
  L170: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3'}, {t:4,d:2,deg:'4'}, {t:6,d:6,deg:'5',tech:'vb'}], tags: ['legacy', 'virtuoso', 'ascending-standard'] },
  L171: { phrase: [{t:0,d:12,deg:'R+8',tech:'vb'}], tags: ['legacy', 'virtuoso', 'high-anchor'] },
  L172: { phrase: [{t:0,d:3,deg:'5',tech:'ds'}, {t:3,d:3,deg:'R',tech:'ds'}, {t:6,d:6,deg:'b7',tech:'ds'}], tags: ['legacy', 'virtuoso', 'aggressive-chordal'] },
  L173: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'5'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'virtuoso', 'classic-descent'] },
  L174: { phrase: [{t:0,d:1,deg:'R'}, {t:1,d:1,deg:'b3'}, {t:2,d:1,deg:'R'}, {t:3,d:1,deg:'b3'}, {t:4,d:8,deg:'R',tech:'vb'}], tags: ['legacy', 'virtuoso', 'vibrating-start'] },
  L175: { phrase: [{t:0,d:6,deg:'R+8',tech:'bn'}, {t:6,d:6,deg:'R'}], tags: ['legacy', 'virtuoso', 'big-fall'] },
  L176: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'4'}, {t:6,d:6,deg:'b3',tech:'bn'}], tags: ['legacy', 'virtuoso', 'bending-resolve'] },
  L177: { phrase: [{t:0,d:4,deg:'R'}, {t:4,d:4,deg:'b7'}, {t:8,d:4,deg:'5'}], tags: ['legacy', 'virtuoso', 'heavy-stabs'] },
  L178: { phrase: [{t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3'}, {t:4,d:2,deg:'R'}, {t:6,d:6,deg:'R',tech:'sl'}], tags: ['legacy', 'virtuoso', 'sliding-root'] },
  L179: { phrase: [{t:0,d:3,deg:'5'}, {t:3,d:3,deg:'b7'}, {t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['legacy', 'virtuoso', 'shining-end'] },
  L180: { phrase: [{t:0,d:12,deg:'R',tech:'vb'}], tags: ['legacy', 'virtuoso', 'final-virtuoso-anchor'] },
};

// 20 планов соло, каждый на 36 тактов (3 хора по 12 тактов)
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
  }
};
