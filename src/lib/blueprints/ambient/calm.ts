import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Stable Geography" (Calm Ambient v12.0).
 * #ЧТО: 1. Внедрена лотерея интро.
 *       2. Реализована поддержка маршрута (3 локации).
 */
export const CalmAmbientBlueprint: MusicBlueprint = {
  id: 'calm_ambient',
  name: 'Still Geography',
  description: 'Stable waters and stone temples. A meditative tour through three locations.',
  mood: 'calm',
  musical: {
    key: { root: 'G', scale: 'mixolydian', octave: 3 },
    bpm: { base: 54, range: [50, 58], modifier: 1.0 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'plateau', 
      peakPosition: 0.3,
      curve: (p, pp) => (p < pp ? p / pp : (p < 0.8 ? 1.0 : 1 - ((p - 0.8) / 0.2)))
    }
  },
  structure: {
    totalDuration: { preferredBars: 148 },
    parts: [
      {
        id: 'INTRO', name: 'CalmLottery', duration: { percent: 15 },
        layers: { sparkles: true, accompaniment: true, sfx: true, bass: true, drums: true, harmony: true, pianoAccompaniment: true, melody: true },
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
                    drums: { activationChance: 1.0, instrumentOptions: [{ name: 'calm', weight: 1.0 }] },
                    melody: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                }
            },
            {
                duration: { percent: 25 },
                instrumentation: {
                    pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
                    sfx: { activationChance: 0.6, instrumentOptions: [{ name: 'common', weight: 1.0 }], transient: true }
                }
            },
            {
                duration: { percent: 25 },
                instrumentation: {
                    harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'guitarChords', weight: 1.0 }] },
                    sparkles: { activationChance: 0.5, instrumentOptions: [{ name: 'ambient_common', weight: 1.0 }] }
                }
            }
        ],
        instrumentRules: {
          accompaniment: { density: { min: 0.4, max: 0.6 } },
          melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'CALM_INTRO_BUNDLE', name: 'Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN', name: 'The Atlas', duration: { percent: 75 },
        layers: { sparkles: true, accompaniment: true, sfx: true, bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
          melody: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
        },
        instrumentRules: {
           drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 } },
           melody: { source: 'harmony_top_note', density: { min: 0.2, max: 0.4 } }
        },
        bundles: [{ id: 'CALM_MAIN_BUNDLE', name: 'Travel', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'OUTRO', name: 'The End', duration: { percent: 10 },
        layers: { accompaniment: true, sfx: true, bass: true },
        bundles: [{ id: 'CALM_OUTRO_BUNDLE', name: 'Silence', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      }
    ]
  },
  mutations: {},
  ambientEvents: [
      { type: 'sparkle', probability: 0.08, activeParts: ['MAIN'] },
      { type: 'sfx', probability: 0.06, activeParts: ['INTRO', 'OUTRO'] },
  ],
  continuity: {},
  rendering: {
      mixTargets: {
          melody: { level: -28, pan: 0.0 },
          accompaniment: { level: -18, pan: 0.0 }
      }
  }
};
