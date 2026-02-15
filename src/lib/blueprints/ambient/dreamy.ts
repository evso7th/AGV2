import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Atlas Voyage" (Dreamy Ambient v15.1).
 * #ОБНОВЛЕНО (ПЛАН №430): glideBass заменен на bass_ambient.
 */
export const DreamyAmbientBlueprint: MusicBlueprint = {
  id: 'dreamy_ambient',
  name: 'Celestial Geography',
  description: 'A physical journey through misty peaks and astral plains. Geography of Spirit.',
  mood: 'dreamy',
  musical: {
    key: { root: 'F', scale: 'lydian', octave: 3 },
    bpm: { base: 58, range: [55, 62], modifier: 1.05 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.6,
      curve: (progress: number, peakPos: number): number => {
        if (progress < peakPos) return Math.pow(progress / peakPos, 1.2);
        return 1 - Math.pow((progress - peakPos) / (1 - peakPos), 1.5);
      }
    }
  },
  structure: {
    totalDuration: { preferredBars: 160 },
    parts: [
      {
        id: 'INTRO', name: 'LotteryEntrance', duration: { percent: 15 },
        layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true, bass: true, drums: true, pianoAccompaniment: true, melody: true },
        stagedInstrumentation: [
            {
                duration: { percent: 25 },
                instrumentation: {
                    accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    // #ЗАЧЕМ: Удаление glideBass.
                    bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_ambient', weight: 1.0 }] }
                }
            },
            {
                duration: { percent: 25 },
                instrumentation: {
                    drums: { activationChance: 1.0, instrumentOptions: [{ name: 'calm', weight: 1.0 }] },
                    melody: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                }
            },
            {
                duration: { percent: 25 },
                instrumentation: {
                    pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
                    sfx: { activationChance: 0.8, instrumentOptions: [{ name: 'common', weight: 1.0 }], transient: true }
                }
            },
            {
                duration: { percent: 25 },
                instrumentation: {
                    harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'violin', weight: 1.0 }] },
                    sparkles: { activationChance: 0.7, instrumentOptions: [{ name: 'light', weight: 1.0 }] }
                }
            }
        ],
        instrumentRules: {
          accompaniment: { register: { preferred: 'high' } },
          melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'DREAMY_INTRO_1', name: 'Glimmer', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN', name: 'The Geography', duration: { percent: 75 },
        layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true, pianoAccompaniment: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.5 }, { name: 'synth', weight: 0.5 }] },
            melody: { strategy: 'weighted', v2Options: [{ name: 'synth_lead_shineOn', weight: 0.4 }, { name: 'ep_rhodes_warm', weight: 0.6 }] }
        },
        instrumentRules: {
            drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } },
            melody: { source: 'motif', density: { min: 0.3, max: 0.5 } }
        },
        bundles: [
            { id: 'DREAMY_MAIN_1', name: 'The Path', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null,
      },
       {
        id: 'OUTRO', name: 'Dissolution', duration: { percent: 10 },
        layers: { accompaniment: true, sfx: true, harmony: true },
        bundles: [ { id: 'DREAMY_OUTRO_1', name: 'Fading', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
    ]
  },
  mutations: {},
  ambientEvents: [
      { type: 'sparkle', probability: 0.12, activeParts: ['MAIN', 'OUTRO'] },
  ],
  continuity: {},
  rendering: {
      mixTargets: {
          melody: { level: -26, pan: 0.0 },
          accompaniment: { level: -18, pan: 0.0 }
      }
  }
};