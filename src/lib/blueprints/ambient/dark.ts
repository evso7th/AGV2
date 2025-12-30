
import type { MusicBlueprint } from '@/types/music';

export const DarkAmbientBlueprint: MusicBlueprint = {
    id: 'dark_ambient',
    name: 'Sabbath Drift',
    description: 'Тёмный, давящий, медленный эмбиент, вдохновленный тяжелыми риффами.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 42, range: [42, 50], modifier: 0.85 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
          type: 'plateau',
          peakPosition: 0.3,
          curve: (p, pp) => (p < pp ? p / pp : (p < 0.9 ? 1.0 : 1 - ((p - 0.9) / 0.1)))
        }
    },
    structure: {
        totalDuration: { preferredBars: 120 },
        parts: [
          {
            id: 'INTRO_1', name: 'The Void', duration: { percent: 8 },
            layers: { bass: true, accompaniment: true, drums: true },
            instrumentation: { 
              bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] },
              accompaniment: { strategy: 'weighted', v1Options: [{name: 'ambientPad', weight: 1.0}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] }
            },
            instrumentRules: { 
                bass: { density: {min: 0.2, max: 0.4}, techniques: [{value: 'drone', weight: 1.0}]},
                drums: { enabled: true, pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, rareKick: true, usePerc: true, alternatePerc: false },
                melody: { source: 'harmony_top_note' }
            },
            bundles: [ { id: 'DARK_INTRO_BUNDLE_1', name: 'Drone', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'INTRO_2', name: 'First Echoes', duration: { percent: 6 },
            layers: { bass: true, accompaniment: true, melody: true, sfx: true, drums: true },
            instrumentation: { 
              bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] },
              accompaniment: { strategy: 'weighted', v1Options: [{name: 'ambientPad', weight: 1.0}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] },
              melody: { strategy: 'weighted', v1Options: [{name: 'theremin', weight: 1.0}], v2Options: [{name: 'guitar_shineOn', weight: 1.0}] }
            },
            instrumentRules: { 
                drums: { enabled: true, pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, rareKick: true, usePerc: true, alternatePerc: false },
                sfx: { eventProbability: 0.2, categories: [{name: 'dark', weight: 1.0}] },
                melody: { source: 'harmony_top_note' }
            },
            bundles: [ { id: 'DARK_INTRO_BUNDLE_2', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'INTRO_3', name: 'Full Ensemble', duration: { percent: 6 },
            layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true, sparkles: true },
            instrumentation: {
              bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }]},
              accompaniment: { strategy: 'weighted', v1Options: [{name: 'organ', weight: 0.8 }, {name: 'theremin', weight: 0.2}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] },
              melody: { strategy: 'weighted', v1Options: [{name: 'theremin', weight: 1.0}], v2Options: [{name: 'guitar_shineOn', weight: 1.0}] },
              harmony: { strategy: 'weighted', options: [ { name: 'violin', weight: 0.45 }, { name: 'flute', weight: 0.45 }, { name: 'guitarChords', weight: 0.1 } ]}
            },
            instrumentRules: {
                drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: false, usePerc: true, useGhostHat: true, rareKick: true, alternatePerc: false },
                bass: { density: {min: 0.5, max: 0.7} },
                sfx: { eventProbability: 0.25, categories: [{ name: 'voice', weight: 0.6 }, { name: 'dark', weight: 0.3 }] },
                melody: { source: 'harmony_top_note' }
            },
            bundles: [ { id: 'DARK_INTRO_BUNDLE_3', name: 'Ensemble', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'BUILD', name: 'The Riff',
            duration: { percent: 30 },
            layers: { bass: true, sfx: true, drums: true, accompaniment: true, harmony: true },
             instrumentation: {
              bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }]},
              accompaniment: { strategy: 'weighted', v1Options: [{name: 'organ', weight: 0.8 }, {name: 'theremin', weight: 0.2}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] },
              harmony: { strategy: 'weighted', options: [ { name: 'violin', weight: 0.45 }, { name: 'flute', weight: 0.45 }, { name: 'guitarChords', weight: 0.1 } ]}
            },
            instrumentRules: {
                drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: false, usePerc: true, useGhostHat: true, rareKick: true, alternatePerc: true },
                bass: { density: {min: 0.5, max: 0.7} },
                sfx: {
                  eventProbability: 0.25,
                  categories: [
                    { name: 'voice', weight: 0.6 },
                    { name: 'dark', weight: 0.3 },
                    { name: 'common', weight: 0.1 }
                  ]
                },
                melody: { source: 'harmony_top_note' }
            },
            bassAccompanimentDouble: {
              enabled: true,
              instrument: 'synth',
              octaveShift: 1
            },
            bundles: [ { id: 'DARK_BUILD_BUNDLE', name: 'Riffage', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'MAIN', name: 'Iron God',
            duration: { percent: 35 },
            layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true },
            instrumentation: {
              bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }]},
              accompaniment: { strategy: 'weighted', v1Options: [{name: 'organ', weight: 1.0}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] },
              melody: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 0.6 }, { name: 'synth', weight: 0.4 }], v2Options: [{ name: 'theremin', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
              harmony: { strategy: 'weighted', options: [ { name: 'violin', weight: 0.45 }, { name: 'flute', weight: 0.45 }, { name: 'guitarChords', weight: 0.1 } ]}
            },
            instrumentRules: {
              drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: false, usePerc: true, useGhostHat: true, rareKick: true, alternatePerc: true },
              melody: { register: { preferred: 'high' }, source: 'harmony_top_note' },
              sfx: {
                  eventProbability: 0.25,
                  categories: [
                    { name: 'voice', weight: 0.6 },
                    { name: 'dark', weight: 0.3 },
                    { name: 'common', weight: 0.1 }
                  ]
              }
            },
            bassAccompanimentDouble: {
              enabled: true,
              instrument: 'synth',
              octaveShift: 1
            },
            bundles: [
              { id: 'DARK_MAIN_BUNDLE', name: 'The Monolith', duration: { percent: 100 }, characteristics: {}, phrases: {} },
            ],
            outroFill: null,
          },
          {
            id: 'OUTRO', name: 'Feedback',
            duration: { percent: 15 },
            layers: { sfx: true, accompaniment: true },
            instrumentation: {
                accompaniment: { strategy: 'weighted', v1Options: [{name: 'organ', weight: 1.0}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] }
            },
            instrumentRules: {
                accompaniment: { techniques: [{value: 'swell', weight: 1.0}], register: { preferred: 'low' } },
                melody: { source: 'harmony_top_note' }
            },
            bundles: [ { id: 'DARK_OUTRO_BUNDLE', name: 'Decay', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          }
        ]
    },
    mutations: { },
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
