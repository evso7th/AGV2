import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Флагманский блюпринт "The Imperial Orchestra" (Melancholic v35.0).
 * #ЧТО: 1. Реализация "Липкого Оркестра" с пошаговой активацией всех слоев.
 *       2. Ударные вступают со Сцены 2 Интро (такт 5).
 *       3. Использование "Имперской" ударной установки.
 *       4. Тройная структура Мэйнов (36 тактов каждый) с Бриджами.
 */
export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Imperial Melancholic Drift',
  description: 'A grand, cinematic ambient odyssey with a sticky orchestral buildup and deep, lush textures.',
  
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 1 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.7,
      curve: (p: number) => {
        const introEnd = 12 / 156;
        const buildEnd = 24 / 156;
        const main1End = 60 / 156;
        const bridge1End = 64 / 156;
        const main2End = 100 / 156;
        const bridge2End = 104 / 156;
        const main3End = 140 / 156;
        const bridge3End = 144 / 156;

        if (p < introEnd) return 0.3 + (p / introEnd) * 0.2; // 0.3 -> 0.5
        if (p < buildEnd) return 0.5 + ((p - introEnd) / (buildEnd - introEnd)) * 0.1; 
        if (p < main1End) return 0.6 + ((p - buildEnd) / (main1End - buildEnd)) * 0.1; 
        if (p < bridge1End) return 0.7 - ((p - main1End) / (bridge1End - main1End)) * 0.3; 
        if (p < main2End) return 0.4 + ((p - bridge1End) / (main2End - bridge1End)) * 0.35; 
        if (p < bridge2End) return 0.75 - ((p - main2End) / (bridge2End - main2End)) * 0.35; 
        if (p < main3End) return 0.4 + ((p - bridge2End) / (main3End - bridge2End)) * 0.4; 
        if (p < bridge3End) return 0.8 - ((p - main3End) / (bridge3End - main3End)) * 0.4; 
        return 0.4 - ((p - bridge3End) / (1.0 - bridge3End)) * 0.1; 
      }
    }
  },
  
  structure: {
    totalDuration: { preferredBars: 156 },
    parts: [
      // 1. INTRO (12 тактов, 3 сцены по 4 такта)
      {
        id: 'INTRO', name: 'Awakening Scenes', duration: { percent: 8 }, 
        stagedInstrumentation: [
          {
            duration: { percent: 33 }, // Сцена 1 (1-4 такта)
            instrumentation: {
              accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 0.5 }, { name: 'synth_cave_pad', weight: 0.5 }] },
              bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
            }
          },
          {
            duration: { percent: 33 }, // Сцена 2 (5-8 такта)
            instrumentation: {
              drums: { activationChance: 1.0, instrumentOptions: [{ name: 'melancholic', weight: 1.0 }] },
              melody: { activationChance: 1.0, instrumentOptions: [{ name: 'synth', weight: 0.7 }, { name: 'guitar_shineOn', weight: 0.15 }, { name: 'organ_soft_jazz', weight: 0.15 }] },
              pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
              sfx: { activationChance: 0.8, instrumentOptions: [{ name: 'bongo', weight: 0.5 }, { name: 'laser', weight: 0.5 }], transient: true }
            }
          },
          {
            duration: { percent: 34 }, // Сцена 3 (9-12 такта)
            instrumentation: {
              sparkles: { activationChance: 0.8, instrumentOptions: [{ name: 'dark', weight: 1.0 }], transient: true },
              harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'violin', weight: 0.4 }, { name: 'flute', weight: 0.4 }, { name: 'guitarChords', weight: 0.2 }] }
            }
          }
        ],
        instrumentRules: {
          drums: { pattern: 'ambient_beat', density: { min: 0.1, max: 0.2 }, useSnare: false, rareKick: true },
          bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
          pianoAccompaniment: { density: { min: 0.1, max: 0.2 } }
        },
        bundles: [{ id: 'IMPERIAL_INTRO', name: 'The Bloom', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      // 2. BUILD (12 тактов)
      {
        id: 'BUILD', name: 'Orchestral Gathering', duration: { percent: 8 },
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sfx: true, harmony: true },
        instrumentRules: {
          drums: { kitName: 'melancholic', pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: true },
          melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'IMPERIAL_BUILD', name: 'Preparation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      // 3. MAIN-1 (36 тактов)
      {
        id: 'MAIN_1', name: 'Imperial Flow I', duration: { percent: 23 },
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, harmony: true },
        instrumentRules: {
          drums: { kitName: 'melancholic', density: { min: 0.5, max: 0.7 }, ride: { enabled: true } },
          melody: { source: 'blues_solo', density: { min: 0.4, max: 0.6 } }
        },
        bundles: [{ id: 'MAIN_1_B1', name: 'Theme Arrival', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: { type: 'shimmer_burst', duration: 4, parameters: {} },
      },
      // 3.1 BRIDGE-1 (4 такта)
      {
        id: 'BRIDGE_1', name: 'The Pivot I', duration: { percent: 3 },
        layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true, harmony: true },
        instrumentRules: {
          accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }] }
        },
        bundles: [{ id: 'BRIDGE_1_B1', name: 'Pivot', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      // 4. MAIN-2 (36 тактов)
      {
        id: 'MAIN_2', name: 'Imperial Flow II', duration: { percent: 23 },
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, harmony: true },
        instrumentRules: {
          drums: { kitName: 'melancholic', density: { min: 0.6, max: 0.8 }, ride: { enabled: true } },
          melody: { source: 'blues_solo', density: { min: 0.5, max: 0.7 } }
        },
        bundles: [{ id: 'MAIN_2_B1', name: 'Mutation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: { type: 'reverb_burst', duration: 4, parameters: {} },
      },
      // 4.2 BRIDGE-2 (4 такта)
      {
        id: 'BRIDGE_2', name: 'The Pivot II', duration: { percent: 3 },
        layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true, harmony: true },
        bundles: [{ id: 'BRIDGE_2_B1', name: 'Pivot', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      // 5. MAIN-3 (36 тактов)
      {
        id: 'MAIN_3', name: 'Imperial Final', duration: { percent: 23 },
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, harmony: true },
        instrumentRules: {
          drums: { kitName: 'melancholic', density: { min: 0.7, max: 0.9 }, ride: { enabled: true } },
          melody: { source: 'blues_solo', density: { min: 0.6, max: 0.8 }, register: { preferred: 'high' } }
        },
        bundles: [{ id: 'MAIN_3_B1', name: 'Peak Ensemble', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: { type: 'density_pause', duration: 4, parameters: { soloLayer: 'accompaniment' } },
      },
      // 5.1 BRIDGE-3 (4 такта)
      {
        id: 'BRIDGE_3', name: 'The Descent', duration: { percent: 3 },
        layers: { bass: true, accompaniment: true, pianoAccompaniment: true, harmony: true },
        bundles: [{ id: 'BRIDGE_3_B1', name: 'Descent', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      // 6. OUTRO (12 тактов)
      {
        id: 'OUTRO', name: 'Imperial Dissolution', duration: { percent: 8 },
        layers: { bass: true, accompaniment: true, sfx: true, pianoAccompaniment: true },
        instrumentRules: {
          bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
          accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] },
          drums: { enabled: false }
        },
        bundles: [{ id: 'IMPERIAL_OUTRO', name: 'The End', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
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
      pianoAccompaniment: { level: -22, pan: 0.2 },
      sfx: { level: -28, pan: 0.0 }
    }
  }
};
