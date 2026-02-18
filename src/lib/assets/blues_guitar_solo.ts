/**
 * @fileOverview Blues Guitar Solo Library (150+ Golden Licks)
 * #ЗАЧЕМ: Огромная оцифрованная база блюзового наследия для исключения повторов.
 * #ЧТО: Секции: Texas, Soul, King, Detroit, Chromatic, Sabbath, Slow-Burn, Lyrical.
 * #ОБНОВЛЕНО (ПЛАН №466): Добавлена Lyrical Series (L220+) с ритмикой "та-ра-тита-там".
 */

import type { BluesSoloPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase; tags: string[] }> = {
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
  L220: { 
    phrase: [
      {t:0,d:2,deg:'5'}, {t:2,d:2,deg:'6',tech:'sl'}, {t:4,d:1,deg:'b7'}, {t:5,d:1,deg:'7',tech:'h'}, {t:6,d:6,deg:'R',tech:'vb'}
    ], 
    tags: ['slow-burn', 'lyrical', 'question'] 
  },
  L221: { 
    phrase: [
      {t:0,d:2,deg:'R'}, {t:2,d:2,deg:'b3',tech:'h'}, {t:4,d:1,deg:'4'}, {t:5,d:1,deg:'#4',tech:'sl'}, {t:6,d:6,deg:'5',tech:'vb'}
    ], 
    tags: ['slow-burn', 'lyrical', 'response'] 
  },
  L222: { 
    phrase: [
      {t:0,d:3,deg:'b7',tech:'bn'}, {t:3,d:3,deg:'5'}, {t:6,d:2,deg:'4'}, {t:8,d:2,deg:'b3'}, {t:10,d:2,deg:'R',tech:'vb'}
    ], 
    tags: ['slow-burn', 'lyrical', 'descent'] 
  },
  L223: { 
    phrase: [
      {t:0,d:1,deg:'R'}, {t:1,d:1,deg:'2'}, {t:2,d:4,deg:'b3',tech:'bn'}, {t:6,d:2,deg:'R'}, {t:8,d:4,deg:'5',tech:'vb'}
    ], 
    tags: ['slow-burn', 'lyrical', 'stutter'] 
  },
  L224: { 
    phrase: [
      {t:0,d:2,deg:'5'}, {t:2,d:2,deg:'b7'}, {t:4,d:2,deg:'R+8',tech:'bn'}, {t:6,d:6,deg:'5',tech:'vb'}
    ], 
    tags: ['slow-burn', 'lyrical', 'high-cry'] 
  },
  L225: { 
    phrase: [
      {t:0,d:3,deg:'R'}, {t:3,d:1,deg:'b3',tech:'h'}, {t:4,d:1,deg:'3',tech:'p'}, {t:5,d:1,deg:'R'}, {t:6,d:6,deg:'b7',tech:'vb'}
    ], 
    tags: ['slow-burn', 'lyrical', 'ornamental'] 
  }
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
      ['L181', 'L11', 'L184', 'L192', 'L11', 'L206', 'L181', 'L10', 'L211', 'L11', 'L181', 'L09'],
      ['L192', 'L11', 'L206', 'L184', 'L11', 'L212', 'L181', 'L10', 'L12', 'L12', 'L181', 'L19'],
      ['L181', 'L192', 'L206', 'L184', 'L181', 'L211', 'L181', 'L10', 'L181', 'L11', 'L181', 'L09']
    ]
  }
};
