import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Abyssal Ritual" (Dark Ambient v4.3).
 * #ЧТО: 1. Инструмент "flute" удален из списка лотереи.
 *       2. Гармония переведена на скрипки и гитарные аккорды.
 *       3. Внедрен 60/40 микс SFX (dark/voice) через явные правила.
 */
export const DarkAmbientBlueprint: MusicBlueprint = {
    id: 'dark_ambient',
    name: 'Abyssal Ritual',
    description: 'A heavy, ritualistic journey with variable intro scenes and breathing orchestra.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 75, range: [70, 80], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
          type: 'plateau',
          peakPosition: 0.5,
          curve: (p) => 0.65 + 0.15 * Math.sin(p * Math.PI)
        }
    },
    structure: {
        totalDuration: { preferredBars: 156 },
        parts: [
          {
            id: 'INTRO', name: 'AwakeningLottery', duration: { percent: 10 },
            layers: { bass: true, drums: true, melody: true, accompaniment: true, sfx: true, sparkles: true, harmony: true, pianoAccompaniment: true },
            stagedInstrumentation: [
              {
                duration: { percent: 25 },
                instrumentation: {
                  bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_ambient_dark', weight: 1.0 }] },
                  accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_cave_pad', weight: 1.0 }] }
                }
              },
              {
                duration: { percent: 25 },
                instrumentation: {
                  drums: { activationChance: 1.0, instrumentOptions: [{ name: 'dark', weight: 1.0 }] },
                  pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] }
                }
              },
              {
                duration: { percent: 25 },
                instrumentation: {
                  melody: { activationChance: 1.0, instrumentOptions: [{ name: 'organ_soft_jazz', weight: 0.7 }, { name: 'theremin', weight: 0.3 }] },
                  // #ЗАЧЕМ: Лотерея теперь включает выбор между dark и voice для SFX.
                  sfx: { activationChance: 0.8, instrumentOptions: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }], transient: true }
                }
              },
              {
                duration: { percent: 25 },
                instrumentation: {
                  harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'violin', weight: 0.7 }, { name: 'guitarChords', weight: 0.3 }] },
                  sparkles: { activationChance: 0.7, instrumentOptions: [{ name: 'dark', weight: 1.0 }] }
                }
              }
            ],
            instrumentRules: { 
                drums: { kitName: 'dark', pattern: 'ambient_beat', density: { min: 0.1, max: 0.2 } },
                bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] }
            },
            bundles: [ { id: 'DARK_INTRO_B1', name: 'The Entry', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'BUILD', name: 'The Accumulation', duration: { percent: 10 },
            layers: { bass: true, drums: true, melody: true, accompaniment: true, sfx: true, sparkles: true, harmony: true, pianoAccompaniment: true },
            instrumentation: {
                melody: { strategy: 'weighted', v2Options: [{ name: 'theremin', weight: 0.6 }, { name: 'organ_soft_jazz', weight: 0.4 }] }
            },
            instrumentRules: {
                drums: { kitName: 'dark', pattern: 'composer', density: { min: 0.3, max: 0.5 } },
                sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] }
            },
            bundles: [ { id: 'DARK_BUILD_B1', name: 'Gathering', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'MAIN_1', name: 'Ritual_I', duration: { percent: 30 },
            layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, harmony: true, sfx: true },
            instrumentRules: {
              drums: { kitName: 'dark', density: { min: 0.4, max: 0.6 } },
              melody: { source: 'blues_solo' },
              sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] }
            },
            bundles: [ { id: 'DARK_M1', name: 'The Monolith', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'BRIDGE', name: 'Breathing', duration: { percent: 5 },
            layers: { bass: true, accompaniment: true, sfx: true, pianoAccompaniment: true },
            instrumentRules: {
                accompaniment: { density: { min: 0.3, max: 0.5 } },
                sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] }
            },
            bundles: [ { id: 'DARK_B1', name: 'Void Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'MAIN_2', name: 'Ritual_II', duration: { percent: 35 },
            layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, sfx: true, sparkles: true, pianoAccompaniment: true },
            instrumentation: {
                melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_muffLead', weight: 0.5 }, { name: 'organ_soft_jazz', weight: 0.5 }] }
            },
            instrumentRules: {
              drums: { kitName: 'dark', density: { min: 0.6, max: 0.8 } },
              sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] }
            },
            bundles: [ { id: 'DARK_M2', name: 'The Peak', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'OUTRO', name: 'Dissolution', duration: { percent: 10 },
            layers: { bass: true, accompaniment: true, sfx: true },
            instrumentRules: {
                bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }] },
                sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] }
            },
            bundles: [ { id: 'DARK_OUTRO', name: 'End', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          }
        ]
    },
    mutations: { },
    ambientEvents: [],
    continuity: {
        anchorLayers: ['bass', 'accompaniment'],
        simultaneousSilence: { allowed: false, fallback: 'bass' }
    },
    rendering: {
        mixTargets: {
            bass: { level: -16, pan: 0.0 },
            accompaniment: { level: -18, pan: 0.0 },
            melody: { level: -16, pan: -0.1 },
            sfx: { level: -26, pan: 0.0 }
        }
    }
};
