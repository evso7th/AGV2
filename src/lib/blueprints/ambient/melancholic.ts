import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Флагманский блюпринт "Nostalgic Morning" (v43.0).
 * #ЧТО: 1. Техника баса изменена на 'walking' для получения риффового движения.
 *       2. Аккомпанемент переведен на 'synth_ambient_pad_lush'.
 *       3. Гарантированный старт ударных и фундамента.
 */
export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Nostalgic Morning',
  description: 'The light sadness of a morning after. Whiskey, smoke and fragile hope in D Dorian.',
  
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 1 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.5,
      curve: (p: number) => {
        return 0.4 + 0.15 * Math.sin(p * Math.PI);
      }
    }
  },
  
  structure: {
    totalDuration: { preferredBars: 156 },
    parts: [
      {
        id: 'INTRO', name: 'The Awakening', duration: { percent: 15 }, 
        layers: { accompaniment: true, sfx: true, pianoAccompaniment: true, bass: true, drums: true, sparkles: true, harmony: true, melody: true },
        stagedInstrumentation: [
          {
            duration: { percent: 25 },
            instrumentation: {
              accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
              bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
            }
          },
          {
            duration: { percent: 25 },
            instrumentation: {
              drums: { activationChance: 1.0, instrumentOptions: [{ name: 'melancholic', weight: 1.0 }] },
              melody: { activationChance: 1.0, instrumentOptions: [{ name: 'organ_soft_jazz', weight: 1.0 }] }
            }
          },
          {
            duration: { percent: 25 },
            instrumentation: {
              pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
              harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'guitarChords', weight: 1.0 }] }
            }
          },
          {
            duration: { percent: 25 },
            instrumentation: {
              sfx: { activationChance: 0.8, instrumentOptions: [{ name: 'common', weight: 1.0 }], transient: true },
              sparkles: { activationChance: 0.7, instrumentOptions: [{ name: 'ambient_common', weight: 1.0 }] }
            }
          }
        ],
        instrumentRules: {
          drums: { kitName: 'melancholic', pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 } },
          // #ЗАЧЕМ: Риффовый бас вместо статичной педали.
          bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
          accompaniment: { activationChance: 1.0 } 
        },
        bundles: [{ id: 'INTRO_B1', name: 'Foggy Morning', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN', name: 'Nostalgic Dialogue', duration: { percent: 70 }, 
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sfx: true, harmony: true, sparkles: true },
        instrumentation: {
            melody: { strategy: 'weighted', v2Options: [
                { name: 'organ_soft_jazz', weight: 0.4 }, 
                { name: 'synth', weight: 0.3 }, 
                { name: 'organ_prog', weight: 0.2 },
                { name: 'ep_rhodes_warm', weight: 0.1 }
            ]},
            accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
            harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 0.5 }, { name: 'guitarChords', weight: 0.5 }] }
        },
        instrumentRules: {
          drums: { kitName: 'melancholic', pattern: 'composer', density: { min: 0.4, max: 0.6 } },
          bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
          melody: { register: { preferred: 'mid' }, density: { min: 0.2, max: 0.4 } }
        },
        bundles: [{ id: 'MAIN_B1', name: 'Whiskey & Hope', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'OUTRO', name: 'Dissolving Trace', duration: { percent: 15 },
        layers: { bass: true, accompaniment: true, sfx: true, pianoAccompaniment: true, harmony: true },
        instrumentRules: {
          bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
          accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
        },
        bundles: [{ id: 'OUTRO_B1', name: 'Fade to Light', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
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
      harmony: { level: -30, pan: 0.0 },
      pianoAccompaniment: { level: -22, pan: 0.2 },
      sfx: { level: -26, pan: 0.0 }
    }
  }
};
