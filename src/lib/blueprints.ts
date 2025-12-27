

import type { MusicBlueprint, Mood, Genre, BlueprintPart, SfxRule } from '@/types/music';

const JoyfulTranceBlueprint: MusicBlueprint = {
    id: 'joyful_trance', name: 'Sunrise Pulse', description: 'Uplifting and energetic trance.', mood: 'joyful',
    musical: {
        key: { root: 'E', scale: 'ionian', octave: 3 },
        bpm: { base: 138, range: [135, 142], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Sunrise', duration: { percent: 15 },
                layers: { accompaniment: true, drums: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] } },
                instrumentRules: { drums: { pattern: 'ambient_beat', density: { min: 0.5, max: 0.7 } } },
                bundles: [
                    { id: 'INTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Ascension', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                instrumentRules: { drums: { pattern: 'ambient_beat', density: { min: 0.7, max: 0.9 } } },
                bundles: [
                    { id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Zenith', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.8 }, { name: 'organ', weight: 0.2 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'theremin', weight: 1.0 }] }
                },
                instrumentRules: { drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 } } },
                bundles: [
                    { id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Afterglow', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: {},
                bundles: [
                    { id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};

const MelancholicTranceBlueprint: MusicBlueprint = {
    id: 'melancholic_trance', name: 'Midnight Voyage', description: 'Introspective and driving trance.', mood: 'melancholic',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 3 },
        bpm: { base: 132, range: [130, 136], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'arc', peakPosition: 0.55, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Departure', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: {},
                bundles: [
                    { id: 'INTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Journey', duration: { percent: 30 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] }
                },
                instrumentRules: { drums: { pattern: 'ambient_beat', density: { min: 0.6, max: 0.8 } } },
                bundles: [
                    { id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Reflection', duration: { percent: 35 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 } } },
                bundles: [
                    { id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fade to Silence', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: {},
                bundles: [
                    { id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};

const NeutralTranceBlueprint: MusicBlueprint = {
    id: 'neutral_trance', name: 'Orbital Path', description: 'Steady and hypnotic trance.', mood: 'calm',
    musical: {
        key: { root: 'G', scale: 'mixolydian', octave: 3 },
        bpm: { base: 135, range: [132, 138], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'plateau', peakPosition: 0.4, curve: (p, pp) => p < pp ? p / pp : (p < 0.8 ? 1.0 : 1 - ((p - 0.8) / 0.2)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Launch', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: {},
                bundles: [
                    { id: 'INTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Cruising', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                instrumentRules: { drums: { pattern: 'ambient_beat', density: { min: 0.7, max: 0.9 } } },
                bundles: [
                    { id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Orbit', duration: { percent: 45 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 } } },
                bundles: [
                    { id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Re-entry', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: {},
                bundles: [
                    { id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};

export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Melancholic Drift',
  description: 'Задумчивый, интроспективный ambient с плавными гармоническими переходами',
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 3 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.58,
      curve: (progress: number, peakPos: number): number => {
        if (progress < peakPos) return Math.pow(progress / peakPos, 1.3);
        else return Math.pow((1 - progress) / (1 - peakPos), 1.8);
      }
    }
  },
  
  structure: {
    totalDuration: { preferredBars: 120 },
    parts: [
       {
        id: 'INTRO_1', name: 'Emergence', duration: { percent: 8 }, // ~10 bars
        layers: { accompaniment: true, harmony: false, sfx: false, sparkles: false, drums: true },
        instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] } },
        instrumentRules: {
          accompaniment: { register: { preferred: 'low' } },
          drums: { pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, rareKick: false, usePerc: true }
        },
        bundles: [ { id: 'INTRO_BUNDLE_1', name: 'Emergence', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_2', name: 'Stirrings', duration: { percent: 6 }, // ~7 bars
        layers: { accompaniment: true, bass: true, sparkles: true, sfx: true, harmony: false, melody: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 0.9 }, { name: 'organ', weight: 0.1 }] },
          bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] },
           melody: {
            strategy: 'weighted',
            options: [
              { name: 'electricGuitar', weight: 0.2 },
              { name: 'acousticGuitar', weight: 0.2 },
              { name: 'organ', weight: 0.3 },
              { name: 'mellotron', weight: 0.3 },
            ]
          }
        },
        instrumentRules: {
          accompaniment: { register: { preferred: 'low' } },
          sfx: {
              eventProbability: 0.25,
              categories: [
                { name: 'voice', weight: 0.6 },
                { name: 'dark', weight: 0.3 },
                { name: 'common', weight: 0.1 }
              ]
          }
        },
        bundles: [ { id: 'INTRO_BUNDLE_2', name: 'Stirrings', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_3', name: 'Anticipation', duration: { percent: 6 }, // ~7 bars
        layers: { accompaniment: true, bass: true, melody: true, harmony: true, sfx: true, sparkles: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 0.8 }, { name: 'mellotron', weight: 0.2 }] },
          bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
          melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_pad_emerald', weight: 0.5 }] }
        },
        instrumentRules: {
          accompaniment: { register: { preferred: 'low' } }
        },
        bundles: [ { id: 'INTRO_BUNDLE_3', name: 'Anticipation', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      {
        id: 'BUILD', name: 'Rising', duration: { percent: 25 }, // ~30 bars
        layers: { accompaniment: true, bass: true, drums: true, sfx: true, melody: true, harmony: true, sparkles: true },
         instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 0.7 }, { name: 'organ', weight: 0.3 }] },
            bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
            melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.4 }, { name: 'synth_theremin_vocal', weight: 0.6 }] }
        },
        instrumentRules: { drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } } },
        bundles: [
            { id: 'BUILD_BUNDLE_1', name: 'Stirring', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'BUILD_BUNDLE_2', name: 'Intensifying', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      {
        id: 'MAIN', name: 'Apex', duration: { percent: 35 }, // ~42 bars
        layers: { accompaniment: true, bass: true, drums: true, melody: true, sparkles: true, sfx: true, harmony: true },
         instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 0.6 }, { name: 'organ', weight: 0.4 }] },
            bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }] },
            melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.3 }, { name: 'theremin', weight: 0.3 }, { name: 'guitar_shineOn', weight: 0.4 }] }
        },
        instrumentRules: { 
            drums: { 
                pattern: 'composer', 
                density: { min: 0.6, max: 0.8 },
                ride: { enabled: true, quietWindows: [{ start: 0.5, end: 0.65 }] }
            } 
        },
        bundles: [
            { id: 'MAIN_BUNDLE_1', name: 'Arrival', duration: { percent: 33 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_BUNDLE_2', name: 'Plateau', duration: { percent: 34 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_BUNDLE_3', name: 'Reflection', duration: { percent: 33 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
      },
      {
        id: 'RELEASE', name: 'Descent', duration: { percent: 20 }, // ~24 bars
        layers: { accompaniment: true, bass: true, sparkles: true, sfx: true, melody: true, harmony: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] },
            bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
            melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_pad_emerald', weight: 0.5 }] }
        },
        instrumentRules: { drums: { enabled: false } },
        bundles: [
            { id: 'RELEASE_BUNDLE_1', name: 'Softening', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'RELEASE_BUNDLE_2', name: 'Settling', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'pad' } },
      }
    ]
  },
  
  mutations: { /* Simplified for now */ },
  ambientEvents: [],
  continuity: {},
  rendering: {}
};

export const DarkAmbientBlueprint: MusicBlueprint = {
    id: 'dark_ambient',
    name: 'Sabbath Drift',
    description: 'Тёмный, давящий, медленный эмбиент, вдохновленный тяжелыми риффами.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 45, range: [42, 50], modifier: 0.85 },
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
            id: 'INTRO', name: 'The Void',
            duration: { percent: 20 },
            layers: { bass: true, sfx: true, drums: true },
            instrumentation: { bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }] } },
            instrumentRules: { 
                bass: { density: {min: 0.2, max: 0.4}, techniques: [{value: 'drone', weight: 1.0}]},
                drums: { pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, rareKick: false, usePerc: true }
            },
            bundles: [ { id: 'DARK_INTRO_BUNDLE', name: 'Drone', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'BUILD', name: 'The Riff',
            duration: { percent: 30 },
            layers: { bass: true, sfx: true, drums: true, accompaniment: true, harmony: true },
             instrumentation: {
              bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }]},
              accompaniment: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 0.8 }, {name: 'organ', weight: 0.2}]},
              harmony: { strategy: 'weighted', options: [ { name: 'violin', weight: 0.45, octaveShift: -1 }, { name: 'flute', weight: 0.45 }, { name: 'guitarChords', weight: 0.1 } ]}
            },
            instrumentRules: {
                drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: false, usePerc: true, useGhostHat: true, rareKick: true },
                bass: { density: {min: 0.5, max: 0.7} },
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
            bundles: [ { id: 'DARK_BUILD_BUNDLE', name: 'Riffage', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'MAIN', name: 'Iron God',
            duration: { percent: 35 },
            layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true },
            instrumentation: {
              bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }]},
              accompaniment: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'theremin', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
              harmony: { strategy: 'weighted', options: [ { name: 'violin', weight: 0.45, octaveShift: -1 }, { name: 'flute', weight: 0.45 }, { name: 'guitarChords', weight: 0.1 } ]}
            },
            instrumentRules: {
              drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: false, usePerc: true, useGhostHat: true, rareKick: true },
              melody: { register: { preferred: 'high' }},
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
                accompaniment: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 1.0 }]}
            },
            instrumentRules: {
                accompaniment: { techniques: [{value: 'swell', weight: 1.0}], register: { preferred: 'low' } }
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

export const DreamyAmbientBlueprint: MusicBlueprint = {
  id: 'dreamy_ambient',
  name: 'Celestial Drift',
  description: 'Воздушный, парящий, светящийся эмбиент.',
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
        id: 'INTRO_1', name: 'First Glimmer', duration: { percent: 6 }, // ~10 bars
        layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: { accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] } },
        instrumentRules: {
          accompaniment: { register: { preferred: 'high' } },
          sparkles: { eventProbability: 0.25 },
        },
        bundles: [{ id: 'DREAMY_INTRO_1', name: 'Glimmer', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'INTRO_2', name: 'Awakening', duration: { percent: 7 }, // ~11 bars
        layers: { accompaniment: true, bass: true, melody: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] },
          bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
          melody: {
            strategy: 'weighted',
            options: [
              { name: 'electricGuitar', weight: 0.2 },
              { name: 'acousticGuitar', weight: 0.2 },
              { name: 'organ', weight: 0.3 },
              { name: 'mellotron', weight: 0.3 },
            ]
          }
        },
        instrumentRules: {
          bass: { techniques: [{ value: 'floating', weight: 1.0 }], register: { preferred: 'mid' } },
        },
        bundles: [{ id: 'DREAMY_INTRO_2', name: 'Floating', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'INTRO_3', name: 'Drifting', duration: { percent: 7 }, // ~11 bars
        layers: { accompaniment: true, bass: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 0.8 }, { name: 'synth', weight: 0.2 }] },
          bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
          melody: {
            strategy: 'weighted',
            options: [
              { name: 'electricGuitar', weight: 0.2 },
              { name: 'acousticGuitar', weight: 0.2 },
              { name: 'organ', weight: 0.3 },
              { name: 'mellotron', weight: 0.3 },
            ]
          }
        },
        instrumentRules: {
          drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 }, kickVolume: 0.8 },
        },
        bundles: [{ id: 'DREAMY_INTRO_3', name: 'Light Pulse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: { type: 'shimmer_burst', duration: 2, parameters: {} },
      },
      {
        id: 'MAIN', name: 'Celestial expanse', duration: { percent: 50 },
        layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 0.5 }, { name: 'synth', weight: 0.5 }] },
            bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
            melody: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 0.25 }, { name: 'organ', weight: 0.4 }, { name: 'mellotron', weight: 0.35 }] }
        },
        instrumentRules: {
            bass: { techniques: [{ value: 'arpeggio_slow', weight: 0.6 }, {value: 'melodic', weight: 0.4}] },
            drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 } }
        },
        bundles: [
            { id: 'DREAMY_MAIN_1', name: 'Soaring', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'DREAMY_MAIN_2', name: 'Shimmering', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'reverb_burst', duration: 4, parameters: {} },
      },
       {
        id: 'OUTRO', name: 'Fading Starlight', duration: { percent: 30 },
        layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true, melody: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] },
            melody: { strategy: 'weighted', options: [{ name: 'organ', weight: 0.5 }, { name: 'mellotron', weight: 0.5 }] }
        },
        instrumentRules: {
            accompaniment: { register: { preferred: 'high' } }
        },
        bundles: [ { id: 'DREAMY_OUTRO_1', name: 'Quietude', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
    ]
  },
  mutations: {},
  ambientEvents: [
      { type: 'sparkle', probability: 0.12, activeParts: ['INTRO_2', 'INTRO_3', 'MAIN', 'OUTRO'] }, // Bells
      { type: 'shimmer_burst', probability: 0.06, activeParts: ['MAIN'] },
  ],
  continuity: {},
  rendering: {}
};

export const EnthusiasticAmbientBlueprint: MusicBlueprint = {
    id: 'enthusiastic_ambient',
    name: 'Radiant Ascent',
    description: 'Яркий, энергичный и восторженный эмбиент.',
    mood: 'enthusiastic',
    musical: {
        key: { root: 'E', scale: 'lydian', octave: 3 },
        bpm: { base: 68, range: [66, 72], modifier: 1.2 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.8, curve: (p, pp) => Math.pow(p, 1.5) }
    },
    structure: {
        totalDuration: { preferredBars: 170 },
        parts: [
            {
                id: 'INTRO', name: 'Ignition', duration: { percent: 12 },
                layers: { accompaniment: true, melody: true, drums: false, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.7 }, { name: 'organ', weight: 0.3 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'theremin', weight: 1.0 }] }
                },
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }], density: { min: 0.6, max: 0.8 } },
                    melody: { density: { min: 0.4, max: 0.6 } }
                },
                bundles: [{ id: 'ENT_INTRO_1', name: 'Spark', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Ascension', duration: { percent: 29 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 0.5 }, { name: 'theremin', weight: 0.5 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'melodic', weight: 0.5 }, { value: 'arpeggio_fast', weight: 0.5 }], density: { min: 0.7, max: 0.9 } },
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 } },
                },
                bundles: [{ id: 'ENT_BUILD_1', name: 'Climb', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'MAIN', name: 'Apex', duration: { percent: 35 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.5 }, { name: 'organ', weight: 0.5 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'syncopated', weight: 1.0 }], density: { min: 0.85, max: 1.0 } },
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 }, kickVolume: 1.2 }
                },
                bundles: [{ id: 'ENT_MAIN_1', name: 'Peak', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'RELEASE', name: 'Soaring', duration: { percent: 16 },
                layers: { accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.5, max: 0.7 } }
                },
                bundles: [{ id: 'ENT_RELEASE_1', name: 'Glide', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'accompaniment' } },
            },
            {
                id: 'OUTRO', name: 'Starlight', duration: { percent: 8 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {
                    sparkles: { eventProbability: 0.3 }
                },
                bundles: [{ id: 'ENT_OUTRO_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [
        { type: 'sparkle', probability: 0.18, activeParts: ['BUILD', 'MAIN', 'RELEASE'] }, // Bells
        { type: 'shimmer_burst', probability: 0.10, activeParts: ['BUILD', 'MAIN'] },
    ],
    continuity: {},
    rendering: {}
};

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
            options: [{ name: 'ambientPad', weight: 0.7 }, { name: 'synth', weight: 0.3 }]
          }
        },
        instrumentRules: {
          accompaniment: { density: { min: 0.4, max: 0.6 } },
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
            options: [{ name: 'ambientPad', weight: 0.6 }, { name: 'organ', weight: 0.4 }]
          },
          bass: {
            strategy: 'weighted',
            options: [{ name: 'classicBass', weight: 1.0 }]
          }
        },
        instrumentRules: {
           drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 } }
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
            options: [{ name: 'organ', weight: 0.5 }, { name: 'mellotron', weight: 0.5 }]
          },
           melody: {
            strategy: 'weighted',
            options: [{ name: 'flute', weight: 0.6 }, { name: 'piano', weight: 0.4 }]
          }
        },
        instrumentRules: {
           melody: { density: { min: 0.2, max: 0.4 } }
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
            options: [{ name: 'ambientPad', weight: 1.0 }]
          }
        },
        instrumentRules: {
            accompaniment: { density: { min: 0.3, max: 0.5 } },
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
            options: [{ name: 'ambientPad', weight: 1.0 }]
          }
        },
        instrumentRules: { },
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

export const JoyfulAmbientBlueprint: MusicBlueprint = {
    id: 'joyful_ambient',
    name: 'Golden Horizons',
    description: 'Светлый, энергичный и позитивный эмбиент.',
    mood: 'joyful',
    musical: {
        key: { root: 'C', scale: 'ionian', octave: 3 },
        bpm: { base: 62, range: [60, 66], modifier: 1.1 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => Math.pow(p, 0.8) }
    },
    structure: {
        totalDuration: { preferredBars: 160 },
        parts: [
            {
                id: 'INTRO', name: 'Dawn', duration: { percent: 13 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.6 }, { name: 'organ', weight: 0.4 }] }
                },
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }], density: { min: 0.5, max: 0.7 } }
                },
                bundles: [{ id: 'JOY_INTRO_1', name: 'First Light', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Morning', duration: { percent: 29 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 } },
                    bass: { techniques: [{ value: 'walking', weight: 0.7 }, { value: 'melodic', weight: 0.3 }] }
                },
                bundles: [{ id: 'JOY_BUILD_1', name: 'Awakening', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'MAIN', name: 'Daylight', duration: { percent: 32 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.1 }
                },
                bundles: [{ id: 'JOY_MAIN_1', name: 'Celebration', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'RELEASE', name: 'Golden Hour', duration: { percent: 18 },
                layers: { accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } }
                },
                bundles: [{ id: 'JOY_RELEASE_1', name: 'Reflection', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Sunset', duration: { percent: 8 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {},
                bundles: [{ id: 'JOY_OUTRO_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [
        { type: 'sparkle', probability: 0.15, activeParts: ['BUILD', 'MAIN', 'RELEASE'] }, // Bell
        { type: 'sparkle', probability: 0.10, activeParts: ['MAIN'] }, // Sparkle Cascade
    ],
    continuity: {},
    rendering: {}
};

export const EpicAmbientBlueprint: MusicBlueprint = {
    id: 'epic_ambient',
    name: 'Heroic Dawn',
    description: 'Величественный и масштабный эмбиент.',
    mood: 'epic',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 2 },
        bpm: { base: 62, range: [60, 65], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
            type: 'arc',
            peakPosition: 0.7,
            curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.8) : 1 - Math.pow((p - pp) / (1 - pp), 1.2)
        }
    },
    structure: {
        totalDuration: { preferredBars: 180 },
        parts: [
            {
                id: 'INTRO', name: 'The Mists', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {
                    accompaniment: { register: { preferred: 'low' }, density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'EPIC_INTRO_1', name: 'Mists', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            },
            {
                id: 'BUILD', name: 'The Gathering', duration: { percent: 35 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: false, rareKick: true, usePerc: true }
                },
                bundles: [
                    { id: 'EPIC_BUILD_1', name: 'Calling', duration: { percent: 50 }, characteristics: {}, phrases: {} },
                    { id: 'EPIC_BUILD_2', name: 'Marching', duration: { percent: 50 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 4, parameters: { crescendo: true } }
            },
            {
                id: 'MAIN', name: 'The Vista', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'violin', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'mellotron', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.3, max: 0.5 } },
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, kickVolume: 1.1 }
                },
                bundles: [
                  { id: 'EPIC_MAIN_1', name: 'Vista', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null
            },
            {
                id: 'OUTRO', name: 'The Echoes', duration: { percent: 10 },
                layers: { accompaniment: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {},
                bundles: [{ id: 'EPIC_OUTRO_1', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};

export const AnxiousAmbientBlueprint: MusicBlueprint = {
    id: 'anxious_ambient',
    name: 'Nervous System',
    description: 'Напряженный, беспокойный эмбиент с неровными ритмами.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 66, range: [64, 70], modifier: 1.1 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 4) } // Faster wave
    },
    structure: {
        totalDuration: { preferredBars: 150 },
        parts: [
            {
                id: 'INTRO', name: 'Unease', duration: { percent: 15 },
                layers: { sfx: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.8 }, { name: 'theremin', weight: 0.2 }] }
                },
                instrumentRules: {
                    accompaniment: { density: { min: 0.2, max: 0.4 }, techniques: [{ value: 'arpeggio-fast', weight: 1.0 }] },
                    sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.7 }, { name: 'laser', weight: 0.3 }] }
                },
                bundles: [{ id: 'ANX_INTRO_1', name: 'Jitters', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Rising Panic', duration: { percent: 30 },
                layers: { bass: true, drums: true, sfx: true, accompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', options: [{ name: 'theremin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.7 }, useSnare: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'glissando', weight: 1.0 }] }
                },
                bundles: [{ id: 'ANX_BUILD_1', name: 'Escalation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'MAIN', name: 'System Overload', duration: { percent: 40 },
                layers: { bass: true, drums: true, melody: true, sfx: true, accompaniment: true },
                 instrumentation: {
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 1.0 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.3 },
                    melody: { register: { preferred: 'high' } }
                },
                bundles: [{ id: 'ANX_MAIN_1', name: 'Chaos', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Aftershock', duration: { percent: 15 },
                layers: { sfx: true, accompaniment: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: {
                    sfx: { eventProbability: 0.4, categories: [{ name: 'laser', weight: 1.0 }] }
                },
                bundles: [{ id: 'ANX_OUTRO_1', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};

export const NeutralAmbientBlueprint: MusicBlueprint = {
    id: 'neutral_ambient',
    name: 'Infinite Expanse',
    description: 'Сбалансированный, универсальный и спокойный эмбиент.',
    mood: 'contemplative',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 3 },
        bpm: { base: 56, range: [54, 60], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.2, curve: (p, pp) => (p < pp ? p/pp : (p < 0.85 ? 1.0 : 1 - ((p - 0.85) / 0.15))) }
    },
    structure: {
        totalDuration: { preferredBars: 168 },
        parts: [
            {
                id: 'INTRO', name: 'Focus', duration: { percent: 12 },
                layers: { accompaniment: true, sfx: true, sparkles: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'piano', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
                },
                instrumentRules: {
                    accompaniment: { density: {min: 0.4, max: 0.6} }
                },
                bundles: [{ id: 'NEUTRAL_INTRO_1', name: 'Clarity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Stream', duration: { percent: 31 },
                layers: { accompaniment: true, sfx: true, sparkles: true, bass: true, drums: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'piano', weight: 0.7 }, { name: 'acousticGuitar', weight: 0.3 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                 instrumentRules: {
                   drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, usePerc: true, useSnare: false, useGhostHat: true }
                },
                bundles: [{ id: 'NEUTRAL_BUILD_1', name: 'Flow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Deep Work', duration: { percent: 31 },
                layers: { accompaniment: true, sfx: true, sparkles: true, bass: true, drums: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'piano', weight: 0.8 }, { name: 'acousticGuitar', weight: 0.2 }] },
                    melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.15, max: 0.3 } },
                    drums: { density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'NEUTRAL_MAIN_1', name: 'Concentration', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'RELEASE', name: 'Resolution', duration: { percent: 19 },
                layers: { accompaniment: true, sfx: true, sparkles: true, bass: true, harmony: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'piano', weight: 1.0 }] },
                },
                instrumentRules: { },
                bundles: [{ id: 'NEUTRAL_RELEASE_1', name: 'Conclusion', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Silence', duration: { percent: 7 },
                layers: { accompaniment: true, sfx: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] },
                },
                instrumentRules: {},
                bundles: [{ id: 'NEUTRAL_OUTRO_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {},
};


export const BLUEPRINT_LIBRARY: Record<Mood, MusicBlueprint> = {
    // Positive
    epic: EpicAmbientBlueprint,
    joyful: JoyfulAmbientBlueprint,
    enthusiastic: EnthusiasticAmbientBlueprint,
    
    // Negative
    melancholic: MelancholicAmbientBlueprint,
    dark: DarkAmbientBlueprint,
    anxious: AnxiousAmbientBlueprint,
    
    // Neutral
    dreamy: DreamyAmbientBlueprint,
    contemplative: NeutralAmbientBlueprint,
    calm: CalmAmbientBlueprint,
};

export function getBlueprint(genre: Genre, mood: Mood): MusicBlueprint {
    if (genre === 'trance') {
        if (mood === 'joyful' || mood === 'epic' || mood === 'enthusiastic') {
            return JoyfulTranceBlueprint;
        }
        if (mood === 'melancholic' || mood === 'anxious' || mood === 'dark') {
            return MelancholicTranceBlueprint;
        }
        return NeutralTranceBlueprint;
    }
    
    // Fallback to ambient blueprints
    return BLUEPRINT_LIBRARY[mood] || MelancholicAmbientBlueprint;
}

export default MelancholicAmbientBlueprint;
