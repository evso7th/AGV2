
import type { MusicBlueprint } from '@/types/music';

export const CalmAmbientBlueprint: MusicBlueprint = {
  id: 'calm_ambient',
  name: 'Still Waters',
  description: 'Теплый, обволакивающий и умиротворяющий эмбиент.',
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
        id: 'INTRO', name: 'Gentle Awakening', duration: { percent: 14 },
        layers: { sparkles: true, accompaniment: true, sfx: true },
        instrumentation: {
          accompaniment: {
            strategy: 'weighted',
            v1Options: [{ name: 'synth_ambient_pad_lush', weight: 0.7 }, { name: 'synth', weight: 0.3 }],
            v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.7 }, { name: 'synth', weight: 0.3 }],
          }
        },
        instrumentRules: {
          accompaniment: { density: { min: 0.4, max: 0.6 } },
          melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'CALM_INTRO_BUNDLE', name: 'First Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'BUILD', name: 'Flowing Stream', duration: { percent: 30 },
        layers: { sparkles: true, accompaniment: true, sfx: true, bass: true, drums: true, harmony: true, melody: true },
        instrumentation: {
          accompaniment: {
            strategy: 'weighted',
            v1Options: [{ name: 'synth_ambient_pad_lush', weight: 0.6 }, { name: 'organ', weight: 0.4 }],
            v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.6 }, { name: 'organ', weight: 0.4 }]
          },
          bass: {
            strategy: 'weighted',
            v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }],
            v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }]
          }
        },
        instrumentRules: {
           drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 } },
           melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'CALM_BUILD_BUNDLE', name: 'Movement', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN', name: 'Stillness', duration: { percent: 30 },
        layers: { sparkles: true, accompaniment: true, sfx: true, bass: true, drums: true, melody: true, harmony: true },
        instrumentation: {
          accompaniment: {
            strategy: 'weighted',
            v1Options: [{ name: 'organ', weight: 0.5 }, { name: 'mellotron', weight: 0.5 }],
            v2Options: [{ name: 'organ', weight: 0.5 }, { name: 'mellotron', weight: 0.5 }]
          },
           melody: {
            strategy: 'weighted',
            v1Options: [{ name: 'mellotron_flute_intimate', weight: 0.6 }, { name: 'ep_rhodes_warm', weight: 0.4 }],
            v2Options: [{ name: 'mellotron_flute_intimate', weight: 0.6 }, { name: 'ep_rhodes_warm', weight: 0.4 }]
          }
        },
        instrumentRules: {
           melody: { density: { min: 0.2, max: 0.4 }, source: 'harmony_top_note' }
        },
        bundles: [{ id: 'CALM_MAIN_BUNDLE', name: 'Clarity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'RELEASE', name: 'Fading Light', duration: { percent: 19 },
        layers: { sparkles: true, accompaniment: true, sfx: true, harmony: true, melody: true },
        instrumentation: {
           accompaniment: {
            strategy: 'weighted',
            v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }],
            v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }]
          }
        },
        instrumentRules: {
            accompaniment: { density: { min: 0.3, max: 0.5 } },
            melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'CALM_RELEASE_BUNDLE', name: 'Return', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'OUTRO', name: 'Final Peace', duration: { percent: 8 },
        layers: { sparkles: true, accompaniment: true, sfx: true },
         instrumentation: {
           accompaniment: {
            strategy: 'weighted',
            v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }],
            v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }]
          }
        },
        instrumentRules: {
            melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'CALM_OUTRO_BUNDLE', name: 'End', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      }
    ]
  },
  mutations: {},
  ambientEvents: [
      { type: 'sparkle', probability: 0.08, activeParts: ['BUILD', 'MAIN', 'RELEASE'] }, // Bells
      { type: 'sfx', probability: 0.06, activeParts: ['INTRO', 'OUTRO'] }, // Water droplets
  ],
  continuity: {},
  rendering: {}
};
