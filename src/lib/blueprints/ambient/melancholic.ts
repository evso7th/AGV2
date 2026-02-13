import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Флагманский блюпринт "Imperial Sticky Orchestra" (v40.0).
 * #ЧТО: 1. Исправлен останов на 12-м баре: все части теперь имеют правила.
 *       2. Tension точно по графику: 0.5 (Мэйны), 0.4 (Бриджи), 0.3 (Финал).
 *       3. Сценарное интро и постепенный вывод в аутро.
 */
export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Imperial Sticky Orchestra',
  description: 'A grand orchestral odyssey with sticky instrumentation and breathing textures.',
  
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 1 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.5,
      // #ЗАЧЕМ: Точное управление энергией по требованию пользователя.
      curve: (p: number) => {
        const bar = p * 156;
        if (bar < 12) return 0.3 + (bar / 12) * 0.2; // Интро: 0.3 -> 0.5
        if (bar < 60) return 0.5; // Main 1
        if (bar < 64) return 0.4; // Bridge 1
        if (bar < 100) return 0.5; // Main 2
        if (bar < 104) return 0.4; // Bridge 2
        if (bar < 140) return 0.5; // Main 3
        if (bar < 144) return 0.4; // Bridge 3
        return 0.4 - ((bar - 144) / 12) * 0.1; // Outro fall to 0.3
      }
    }
  },
  
  structure: {
    totalDuration: { preferredBars: 156 },
    parts: [
      {
        id: 'INTRO', name: 'AwakeningScenes', duration: { percent: 8 }, // 12.48 bars
        stagedInstrumentation: [
          {
            duration: { percent: 33 }, // Bars 1-4
            instrumentation: {
              accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 0.5 }, { name: 'synth_cave_pad', weight: 0.5 }] },
              bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
            }
          },
          {
            duration: { percent: 33 }, // Bars 5-8
            instrumentation: {
              drums: { activationChance: 1.0, instrumentOptions: [{ name: 'melancholic', weight: 1.0 }] },
              melody: { activationChance: 1.0, instrumentOptions: [{ name: 'synth', weight: 0.7 }, { name: 'guitar_shineOn', weight: 0.15 }, { name: 'organ_soft_jazz', weight: 0.15 }] },
              pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] }
            }
          },
          {
            duration: { percent: 34 }, // Bars 9-12
            instrumentation: {
              sfx: { activationChance: 0.8, instrumentOptions: [{ name: 'dark', weight: 1.0 }], transient: true },
              harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'flute', weight: 0.4 }, { name: 'violin', weight: 0.4 }, { name: 'guitarChords', weight: 0.2 }] },
              sparkles: { activationChance: 0.6, instrumentOptions: [{ name: 'dark', weight: 1.0 }] }
            }
          }
        ],
        instrumentRules: {
          drums: { kitName: 'melancholic', pattern: 'ambient_beat', density: { min: 0.1, max: 0.2 } },
          bass: { techniques: [{ value: 'walking', weight: 1.0 }] }
        },
        bundles: [{ id: 'INTRO_B1', name: 'The Entry', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'BUILD', name: 'OrchestralGathering', duration: { percent: 8 }, // 12 bars
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sfx: true, harmony: true, sparkles: true },
        instrumentation: {
            melody: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 0.7 }, { name: 'guitar_shineOn', weight: 0.15 }, { name: 'organ_soft_jazz', weight: 0.15 }] },
            accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.5 }, { name: 'synth_cave_pad', weight: 0.5 }] }
        },
        instrumentRules: {
          drums: { kitName: 'melancholic', pattern: 'composer', density: { min: 0.3, max: 0.5 } }
        },
        bundles: [{ id: 'BUILD_B1', name: 'Preparation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN_1', name: 'ImperialFlow_I', duration: { percent: 23 },
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, harmony: true, sfx: true },
        instrumentRules: {
          drums: { kitName: 'melancholic', density: { min: 0.5, max: 0.7 }, ride: { enabled: true, probability: 0.2 } },
          melody: { source: 'blues_solo' }
        },
        bundles: [{ id: 'M1_B1', name: 'Theme', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'BRIDGE_1', name: 'Pivot_I', duration: { percent: 3 },
        layers: { bass: true, accompaniment: true, pianoAccompaniment: true, harmony: true, sfx: true },
        instrumentRules: {
            accompaniment: { density: { min: 0.4, max: 0.6 } }
        },
        bundles: [{ id: 'B1_B1', name: 'Rest', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN_2', name: 'ImperialFlow_II', duration: { percent: 23 },
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, harmony: true, sfx: true },
        instrumentRules: {
          drums: { kitName: 'melancholic', density: { min: 0.6, max: 0.8 }, ride: { enabled: true } },
          melody: { source: 'blues_solo' }
        },
        bundles: [{ id: 'M2_B1', name: 'Mutation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'BRIDGE_2', name: 'Pivot_II', duration: { percent: 3 },
        layers: { bass: true, accompaniment: true, harmony: true },
        bundles: [{ id: 'B2_B1', name: 'Rest', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN_3', name: 'ImperialFinal', duration: { percent: 23 },
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, harmony: true, sfx: true },
        instrumentRules: {
          drums: { kitName: 'melancholic', density: { min: 0.7, max: 0.9 } },
          melody: { source: 'blues_solo' }
        },
        bundles: [{ id: 'M3_B1', name: 'Peak', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'BRIDGE_3', name: 'Pivot_III', duration: { percent: 3 },
        layers: { bass: true, accompaniment: true },
        bundles: [{ id: 'B3_B1', name: 'Rest', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'OUTRO', name: 'Dissolution', duration: { percent: 6 },
        layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true },
        stagedInstrumentation: [
            {
                duration: { percent: 50 },
                instrumentation: {
                    pianoAccompaniment: { activationChance: 0, instrumentOptions: [] }, // Remove
                    sfx: { activationChance: 0, instrumentOptions: [] }
                }
            },
            {
                duration: { percent: 50 },
                instrumentation: {
                    bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_ambient', weight: 1.0 }] },
                    accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] }
                }
            }
        ],
        instrumentRules: {
          bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
          accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
        },
        bundles: [{ id: 'OUTRO_B1', name: 'End', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      }
    ]
  },
  
  mutations: { },
  ambientEvents: [],
  continuity: {
    anchorLayers: ['bass', 'accompaniment'],
    simultaneousSilence: { allowed: false, fallback: 'accompaniment' }
  },
  rendering: {
    mixTargets: {
      bass: { level: -18, pan: 0.0 },
      accompaniment: { level: -16, pan: 0.0 },
      melody: { level: -18, pan: -0.1 },
      pianoAccompaniment: { level: -24, pan: 0.2 },
      sfx: { level: -28, pan: 0.0 }
    }
  }
};
