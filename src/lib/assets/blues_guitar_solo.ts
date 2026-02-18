/**
 * @fileOverview Blues Guitar Solo Library (150+ Golden Licks)
 * #ЗАЧЕМ: Огромная оцифрованная база блюзового наследия для исключения повторов.
 * #ЧТО: Секции: Texas, Soul, King, Detroit, Chromatic, Sabbath, Slow-Burn, Lyrical, Legacy Gold.
 * #ОБНОВЛЕНО (ПЛАН №481): Введены Донорские Династии (moody-blues, fifth-dimension).
 */

import type { BluesSoloPhrase, CompactBluesPhrase } from '@/types/fractal';

export const BLUES_SOLO_LICKS: Record<string, { phrase: BluesSoloPhrase | CompactBluesPhrase; tags: string[] }> = {
  // --- BASE MATHEMATICAL LICKS (L01-L20) ---
  L01: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3',tech:'h'},{t:4,d:2,deg:'3',tech:'p'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'R+8'}], tags: ['slow-burn', 'texas', 'major'] },
  L02: { phrase: [{t:0,d:3,deg:'5'},{t:3,d:1,deg:'6',tech:'h'},{t:4,d:2,deg:'5'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['texas', 'major'] },
  L03: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'2'},{t:4,d:2,deg:'b3',tech:'h'},{t:6,d:6,deg:'3',tech:'vb'}], tags: ['texas', 'slow-burn'] },
  L04: { phrase: [{t:0,d:6,deg:'b3',tech:'vb'}, {t:6,d:6,deg:'11'}], tags: ['slow-burn', 'soul'] },
  L05: { phrase: [{t:0,d:3,deg:'b2',tech:'gr'}, {t:3,d:3,deg:'R'}, {t:6,d:6,deg:'b7'}], tags: ['chromatic', 'legacy'] },
  L06: { phrase: [{t:0,d:4,deg:'9'}, {t:4,d:8,deg:'R',tech:'vb'}], tags: ['soul', 'dreamy'] },
  L07: { phrase: [{t:0,d:6,deg:'5',tech:'ds'}, {t:6,d:6,deg:'R'}], tags: ['texas', 'soul'] },
  L08: { phrase: [{t:8,d:2,deg:'2'},{t:10,d:2,deg:'b3'},{t:0,d:3,deg:'3',tech:'h'}], tags: ['texas', 'lyrical'] },
  L09: { phrase: [{t:0,d:2,deg:'2'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'4'},{t:8,d:2,deg:'#4'},{t:10,d:2,deg:'5'}], tags: ['turnaround', 'chromatic'] },
  L10: { phrase: [{t:0,d:6,deg:'R'},{t:6,d:6,deg:'R+8',tech:'vb'}], tags: ['slow-burn', 'lyrical'] },
  L11: { phrase: [{t:0,d:3,deg:'R'},{t:3,d:3,deg:'3'},{t:6,d:6,deg:'6',tech:'vb'}], tags: ['texas', 'soul'] },
  L12: { phrase: [{t:0,d:12,deg:'5',tech:'bn'}], tags: ['slow-burn', 'soul'] },
  L13: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'5'},{t:8,d:2,deg:'6'},{t:10,d:2,deg:'5'}], tags: ['texas', 'lyrical'] },
  L14: { phrase: [{t:0,d:3,deg:'4',tech:'sl'},{t:3,d:3,deg:'#4'},{t:6,d:6,deg:'6',tech:'vb'}], tags: ['texas', 'chromatic'] },
  L15: { phrase: [{t:0,d:3,deg:'b3',tech:'bn'},{t:3,d:3,deg:'2'},{t:6,d:6,deg:'R',tech:'vb'}], tags: ['slow-burn', 'soul'] },
  L16: { phrase: [{t:0,d:2,deg:'b2'},{t:2,d:2,deg:'R'},{t:4,d:2,deg:'b7'},{t:6,d:6,deg:'5'}], tags: ['chromatic', 'legacy'] },
  L17: { phrase: [{t:0,d:3,deg:'5',tech:'ds'},{t:3,d:3,deg:'6',tech:'ds'},{t:6,d:6,deg:'R'}], tags: ['texas', 'soul'] },
  L18: { phrase: [{t:0,d:4,deg:'11'},{t:4,d:8,deg:'9'}], tags: ['slow-burn', 'soul'] },
  L19: { phrase: [{t:0,d:2,deg:'R'},{t:2,d:2,deg:'b7'},{t:4,d:2,deg:'6'},{t:6,d:2,deg:'b6'},{t:8,d:2,deg:'5'},{t:10,d:2,deg:'#4'}], tags: ['turnaround', 'chromatic'] },
  L20: { phrase: [{t:0,d:2,deg:'3'},{t:2,d:2,deg:'b3'},{t:4,d:2,deg:'3'},{t:6,d:2,deg:'2'},{t:8,d:2,deg:'R'},{t:10,d:2,deg:'b7'}], tags: ['texas', 'chromatic'] },

  // --- DYNASTY: TEXAS (SRV Style / Twang) ---
  T_01: { phrase: [0,2,0,0, 3,2,3,2, 6,2,8,0, 9,6,13,4], tags: ['texas', 'bright', 'climb'] },
  T_02: { phrase: [0,3,8,0, 3,1,10,2, 4,2,8,0, 6,6,0,4], tags: ['texas', 'shuffle'] },
  T_03: { phrase: [0,2,8,0, 2,2,10,1, 4,2,11,3, 6,6,13,4], tags: ['texas', 'aggressive'] },
  T_04: { phrase: [0,1,0,0, 1,1,3,2, 2,4,4,3, 6,2,0,0, 8,4,8,4], tags: ['texas', 'rapid'] },
  T_05: { phrase: [6,2,11,3, 8,2,8,0, 10,2,4,2, 0,6,0,4], tags: ['texas', 'twang'] },

  // --- DYNASTY: SOUL (B.B. King / Vocal) ---
  S_01: { phrase: [0,6,4,4, 6,6,8,4], tags: ['soul', 'vocal', 'stable'] },
  S_02: { phrase: [0,3,11,3, 3,9,8,4], tags: ['soul', 'aching', 'reaching'] },
  S_03: { phrase: [0,6,5,1, 6,6,8,4], tags: ['soul', 'smooth', 'slide'] },
  S_04: { phrase: [0,3,0,0, 3,3,11,0, 6,6,0,4], tags: ['soul', 'sweet', 'resigned'] },
  S_05: { phrase: [0,9,3,3, 9,3,0,0], tags: ['soul', 'effort', 'short'] },

  // --- DYNASTY: CHROMATIC (Jazz-Blues / Passing) ---
  C_01: { phrase: [0,2,4,0, 2,2,3,0, 4,2,2,0, 6,2,1,0, 8,4,0,4], tags: ['chromatic', 'descending'] },
  C_02: { phrase: [0,2,8,0, 2,2,7,0, 4,2,6,0, 6,2,5,0, 8,4,4,4], tags: ['chromatic', 'complex'] },
  C_03: { phrase: [0,3,11,0, 3,3,10,0, 6,3,9,0, 9,3,8,0], tags: ['chromatic', 'stepwise'] },
  C_04: { phrase: [0,1,0,0, 1,1,1,0, 2,1,2,0, 3,1,3,0, 4,8,4,4], tags: ['chromatic', 'tension'] },
  C_05: { phrase: [0,4,8,0, 4,4,14,0, 8,4,11,0], tags: ['chromatic', 'expansive'] },

  // --- DYNASTY: LYRICAL (Call and Response) ---
  LY_01: { phrase: [0,3,0,0, 3,3,3,0, 6,6,4,4], tags: ['lyrical', 'question'] },
  LY_02: { phrase: [0,3,8,0, 3,3,11,0, 6,6,13,4], tags: ['lyrical', 'answer'] },
  LY_03: { phrase: [0,2,0,0, 2,2,3,2, 4,2,4,0, 6,6,0,4], tags: ['lyrical', 'balanced'] },
  LY_04: { phrase: [0,1,8,0, 3,1,11,0, 6,1,13,0, 9,3,0,4], tags: ['lyrical', 'stutter'] },
  LY_05: { phrase: [0,6,14,4, 6,6,8,4], tags: ['lyrical', 'high-cry'] },

  // --- DYNASTY: SLOW-BURN (Pink Floyd / Long Tails) ---
  SB_01: { phrase: [0,12,8,3], tags: ['slow-burn', 'scream', 'monolith'] },
  SB_02: { phrase: [0,9,3,3, 9,3,0,4], tags: ['slow-burn', 'cry', 'effort'] },
  SB_03: { phrase: [0,6,0,0, 6,6,13,4], tags: ['slow-burn', 'octave-sigh'] },
  SB_04: { phrase: [0,4,8,0, 4,8,11,3], tags: ['slow-burn', 'reaching'] },
  SB_05: { phrase: [0,12,0,4], tags: ['slow-burn', 'anchor'] },

  // --- DYNASTY: LEGACY (Mathematical / L-System) ---
  LG_01: { phrase: [0,3,0,0, 3,3,7,0, 6,3,14,0, 9,3,11,0], tags: ['legacy', 'geometric'] },
  LG_02: { phrase: [0,2,3,0, 2,2,11,0, 4,2,14,0, 6,6,8,4], tags: ['legacy', 'structured'] },
  LG_03: { phrase: [0,6,6,3, 6,6,3,3], tags: ['legacy', 'tritone', 'heavy'] },
  LG_04: { phrase: [0,4,0,0, 4,4,14,0, 8,4,4,0], tags: ['legacy', 'symmetry'] },
  LG_05: { phrase: [0,3,11,0, 3,3,3,0, 6,3,11,0, 9,3,3,0], tags: ['legacy', 'oscillation'] },

  // --- DYNASTY: MOODY BLUES (Legacy Gold) ---
  L_MOODY_0: { phrase: [5, 1, 8, 0, 5, 1, 8, 0, 5, 1, 1, 0, 6, 1, 8, 0, 7, 1, 3, 0, 7, 1, 8, 0, 8, 1, 1, 0, 8, 1, 8, 0, 8, 1, 8, 0, 9, 1, 3, 0, 10, 1, 8, 0, 10, 1, 8, 0, 10, 1, 8, 0, 10, 1, 1, 0, 11, 1, 8, 0, 12, 1, 3, 0, 12, 1, 8, 0, 13, 1, 8, 0, 13, 1, 1, 0, 14, 1, 8, 0, 14, 1, 3, 0, 15, 1, 1, 0, 16, 1, 3, 0, 16, 1, 4, 0, 16, 1, 0, 0, 16, 1, 14, 0, 17, 1, 3, 0, 17, 1, 3, 0, 18, 1, 14, 0, 18, 1, 3, 0, 18, 1, 0, 0, 19, 1, 14, 0, 20, 1, 3, 0, 20, 1, 14, 0, 21, 1, 14, 0, 21, 1, 3, 0, 21, 1, 0, 0, 21, 1, 14, 0, 22, 1, 3, 0, 23, 1, 14, 0, 23, 1, 0, 0, 23, 1, 3, 0, 24, 1, 14, 0, 25, 1, 3, 0, 25, 1, 14, 0, 26, 1, 4, 0, 26, 1, 2, 0, 26, 1, 8, 0, 27, 1, 4, 0, 27, 1, 2, 0, 28, 1, 4, 0, 29, 1, 4, 0, 29, 1, 2, 0, 29, 1, 8, 0, 29, 1, 4, 0, 30, 1, 2, 0, 31, 1, 4, 0, 31, 1, 2, 0, 31, 1, 8, 0, 31, 1, 4, 0, 32, 1, 4, 0, 33, 1, 2, 0, 33, 1, 4, 0, 34, 1, 4, 0, 34, 1, 2, 0, 34, 1, 8, 0, 34, 1, 4, 0, 35, 1, 2, 0, 36, 1, 4, 0, 36, 1, 8, 0, 36, 1, 2, 0, 37, 1, 3, 0, 37, 1, 3, 0, 38, 1, 1, 0, 38, 1, 8, 0, 39, 1, 1, 0, 39, 1, 8, 0, 40, 1, 8, 0, 40, 1, 3, 0, 41, 1, 8, 0, 42, 1, 8, 0, 42, 1, 8, 0, 42, 1, 1, 0, 42, 1, 8, 0, 43, 1, 3, 0, 44, 1, 8, 0, 44, 1, 8, 0, 44, 1, 1, 0, 45, 1, 8, 0, 46, 1, 3, 0, 46, 1, 1, 0, 47, 1, 8, 0, 47, 1, 8, 0, 47, 1, 1, 0, 47, 1, 8, 0], tags: ['moody-blues', 'slow-burn', 'romantic', 'dreamy'] },
  
  // --- DYNASTY: FIFTH DIMENSION (Legacy Gold) ---
  L_FIFTH_0: { phrase: [7, 1, 8, 0, 7, 4, 13, 0, 7, 1, 3, 0, 9, 1, 8, 0, 9, 1, 3, 0, 10, 1, 13, 0, 10, 1, 10, 0, 11, 1, 14, 0, 11, 4, 3, 0, 11, 1, 2, 0, 12, 1, 3, 0, 12, 1, 0, 0, 13, 1, 14, 0, 13, 1, 2, 0, 14, 4, 2, 0, 14, 2, 13, 0, 14, 2, 10, 0, 16, 2, 10, 0, 16, 1, 13, 0, 18, 1, 2, 0, 18, 1, 2, 0, 18, 1, 0, 0, 18, 1, 14, 0, 18, 4, 14, 0, 19, 1, 8, 0, 19, 1, 10, 0, 19, 1, 13, 0, 20, 1, 2, 0, 20, 1, 0, 0, 20, 1, 14, 0, 22, 1, 8, 0, 22, 4, 13, 0, 22, 1, 3, 0, 24, 1, 8, 0, 24, 1, 3, 0, 25, 1, 13, 0, 25, 1, 10, 0, 25, 1, 14, 0, 25, 4, 3, 0, 25, 1, 2, 0, 27, 1, 3, 0, 27, 1, 0, 0, 27, 1, 14, 0, 27, 1, 2, 0, 28, 4, 2, 0, 28, 2, 13, 0, 28, 2, 10, 0, 31, 2, 10, 0, 31, 1, 13, 0, 32, 1, 2, 0, 33, 1, 2, 0, 33, 1, 0, 0, 33, 1, 14, 0, 33, 4, 14, 0, 34, 1, 8, 0, 34, 1, 10, 0, 34, 1, 13, 0, 34, 1, 2, 0, 34, 1, 0, 0, 34, 1, 14, 0, 36, 1, 8, 0, 36, 4, 13, 0, 36, 1, 3, 0, 38, 1, 8, 0, 38, 1, 3, 0, 39, 1, 13, 0, 39, 1, 10, 0, 40, 1, 14, 0, 40, 4, 3, 0, 40, 1, 2, 0, 41, 1, 3, 0, 41, 1, 0, 0, 42, 1, 14, 0, 42, 1, 2, 0, 43, 4, 2, 0, 43, 2, 13, 0, 43, 2, 10, 0, 45, 2, 8, 0, 45, 2, 10, 0, 45, 2, 13, 0, 47, 2, 8, 0, 47, 2, 10, 0, 47, 2, 13, 0], tags: ['fifth-dimension', 'soul', 'uplift'] },
};

export const BLUES_SOLO_PLANS: Record<string, { choruses: string[][] }> = {
  "S01": {
    choruses: [
      ['L01', 'L11', 'L13', 'L06', 'L11', 'L01', 'L17', 'L10', 'L13', 'L11', 'L02', 'L09'],
      ['L31', 'L11', 'L13', 'L14', 'L11', 'L32', 'L17', 'L10', 'L12', 'L12', 'L02', 'L19'],
      ['L10', 'L11', 'L13', 'L02', 'L11', 'L14', 'L17', 'L10', 'L13', 'L11', 'L02', 'L09']
    ]
  },
};
