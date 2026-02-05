/**
 * @fileOverview Blues Guitar Solo Library (Licks and Plans)
 * #ЗАЧЕМ: Содержит оцифрованную библиотеку блюзовых гитарных соло.
 * #ЧТО: Экспортирует BLUES_SOLO_LICKS (30 ликов) и BLUES_SOLO_PLANS.
 * #СВЯЗИ: Используется в `fractal-music-engine.ts` и `music-theory.ts`.
 */

import type { BluesSoloPhrase } from '@/types/fractal';

// Структура события: { t: tick, d: duration_in_ticks, deg: degree, tech?: technique }
export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
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
  
  // --- SCALAR PASSAGES (NEW) ---
  L26_ASCEND: {
    phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'2'},{t:4,d:2,deg:'b3'},{t:6,d:2,deg:'3'},{t:8,d:2,deg:'4'},{t:10,d:2,deg:'5'}],
    tags: ['major', 'scale', 'ascend', 'run']
  },
  L27_DESCEND: {
    phrase: [{t:0,d:2,deg:'5'},{t:2,d:2,deg:'4'},{t:4,d:2,deg:'b3'},{t:6,d:2,deg:'2'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b7'}],
    tags: ['minor', 'scale', 'descend', 'run']
  },
  L28_TRILL: {
    phrase: [{t:0,d:1,deg:'5'},{t:1,d:1,deg:'b5'},{t:2,d:1,deg:'5'},{t:3,d:3,deg:'b7'},{t:6,d:6,deg:'R',tech:'vb'}],
    tags: ['blues', 'trill', 'fast']
  },
  L29_OCTAVE_ASC: {
    phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'5'},{t:6,d:3,deg:'R+8'},{t:9,d:3,deg:'b7'}],
    tags: ['major', 'octave', 'jump']
  },
  L30_MINOR_PENTA: {
    phrase: [{t:0,d:2,deg:'b7'},{t:2,d:2,deg:'5'},{t:4,d:2,deg:'4'},{t:6,d:2,deg:'b3'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b7'}],
    tags: ['minor', 'pentatonic', 'descend']
  },
  
  // --- HIGH DENSITY LICKS ---
  L22_ACTIVE: {
    phrase: [{t:0,d:1,deg:'R'},{t:1,d:1,deg:'2'},{t:2,d:1,deg:'b3'},{t:3,d:1,deg:'3'},{t:4,d:2,deg:'5'},{t:6,d:2,deg:'6'},{t:8,d:2,deg:'b7'},{t:10,d:2,deg:'R+8'}],
    tags: ['major', 'virtuoso', 'climb', 'fast']
  },
  L23_STACCATO: {
    phrase: [{t:0,d:1,deg:'5'},{t:2,d:1,deg:'5'},{t:4,d:1,deg:'5'},{t:6,d:2,deg:'b7',tech:'bn'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b3'}],
    tags: ['major', 'minor', 'staccato', 'stabs', 'active']
  },
  L24_SHRED: {
    phrase: [{t:0,d:1,deg:'R+8'},{t:1,d:1,deg:'b7'},{t:2,d:1,deg:'6'},{t:3,d:1,deg:'5'},{t:4,d:1,deg:'4'},{t:5,d:1,deg:'b3'},{t:6,d:2,deg:'R',tech:'vb'},{t:8,d:4,deg:'R'}],
    tags: ['minor', 'shred', 'descending', 'virtuoso']
  },
  L25_RESPONSE: {
    phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'b7'},{t:6,d:1,deg:'5'},{t:7,d:1,deg:'4'},{t:8,d:1,deg:'b3'},{t:9,d:3,deg:'R'}],
    tags: ['major', 'minor', 'response', 'quick-talk']
  }
};

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
