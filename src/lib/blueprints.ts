

import type { MusicBlueprint, Mood } from '@/types/music';

export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Melancholic Drift',
  description: 'Задумчивый, интроспективный ambient с плавными гармоническими переходами',
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 3 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [], // Simplified for now
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
    totalDuration: { preferredBars: 120 }, // ~10-11 mins
    
    parts: [
      {
        id: 'INTRO_1', name: 'Awakening Pad & Melody',
        duration: { percent: 7 }, // ~8 bars
        layers: { accompaniment: true, melody: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
            melody: {
                strategy: 'weighted',
                options: [{ name: 'synth', weight: 1.0 }]
            }
        },
        instrumentRules: {},
        bundles: [ { id: 'INTRO_1_BUNDLE_1', name: 'Emergence', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_2', name: 'Rhythm Enters',
        duration: { percent: 7 }, // ~8 bars
        layers: { accompaniment: true, melody: true, bass: true, drums: true, sparkles: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
            melody: {
                strategy: 'weighted',
                options: [{ name: 'synth', weight: 1.0 }]
            }
        },
        instrumentRules: {},
        bundles: [ { id: 'INTRO_2_BUNDLE_1', name: 'First Pulse', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_3', name: 'Full Intro',
        duration: { percent: 6 }, // ~7 bars
        layers: { accompaniment: true, melody: true, bass: true, drums: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
            melody: {
                strategy: 'weighted',
                options: [
                    { name: 'synth', weight: 0.4 },
                    { name: 'organ', weight: 0.4 },
                    { name: 'theremin', weight: 0.1 },
                    { name: 'mellotron', weight: 0.1 },
                ]
            }
        },
        instrumentRules: {},
        bundles: [ { id: 'INTRO_3_BUNDLE_1', name: 'Anticipation', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      {
        id: 'BUILD_1', name: 'First Rise',
        duration: { percent: 10 }, // ~12 bars
        layers: { pad: true, bass: true, arpeggio: true, drums: true, sfx: true, melody: true, sparkles: true, harmony: true, accompaniment: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
            melody: {
                strategy: 'weighted',
                options: [
                    { name: 'synth', weight: 0.4 },
                    { name: 'organ', weight: 0.4 },
                    { name: 'theremin', weight: 0.1 },
                    { name: 'mellotron', weight: 0.1 },
                ]
            }
        },
        instrumentRules: {},
        bundles: [ { id: 'BUILD_1_BUNDLE_1', name: 'Stirring', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'MAIN_1', name: 'First Apex',
        duration: { percent: 17 }, // ~18 bars
        layers: { pad: true, bass: true, arpeggio: true, melody: true, sparkles: true, drums: true, sfx: true, harmony: true, accompaniment: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
            melody: {
                strategy: 'weighted',
                options: [
                    { name: 'synth', weight: 0.4 },
                    { name: 'organ', weight: 0.4 },
                    { name: 'theremin', weight: 0.1 },
                    { name: 'mellotron', weight: 0.1 },
                ]
            }
        },
        instrumentRules: {},
        bundles: [ { id: 'MAIN_1_BUNDLE_1', name: 'Arrival', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
       {
        id: 'BUILD_2', name: 'Second Rise',
        duration: { percent: 10 }, // ~12 bars
        layers: { pad: true, bass: true, arpeggio: true, drums: true, sfx: true, melody: true, sparkles: true, harmony: true, accompaniment: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
            melody: {
                strategy: 'weighted',
                options: [
                    { name: 'synth', weight: 0.4 },
                    { name: 'organ', weight: 0.4 },
                    { name: 'theremin', weight: 0.1 },
                    { name: 'mellotron', weight: 0.1 },
                ]
            }
        },
        instrumentRules: {},
        bundles: [ { id: 'BUILD_2_BUNDLE_1', name: 'Intensifying', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
      },
      {
        id: 'MAIN_2', name: 'Second Apex',
        duration: { percent: 23 }, // ~24 bars
        layers: { pad: true, bass: true, arpeggio: true, melody: true, sparkles: true, drums: true, sfx: true, harmony: true, accompaniment: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
            melody: {
                strategy: 'weighted',
                options: [
                    { name: 'synth', weight: 0.4 },
                    { name: 'organ', weight: 0.4 },
                    { name: 'theremin', weight: 0.1 },
                    { name: 'mellotron', weight: 0.1 },
                ]
            }
        },
        instrumentRules: {},
        bundles: [
            { id: 'MAIN_2_BUNDLE_1', name: 'Plateau', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_2_BUNDLE_2', name: 'Reflection', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null,
      },
      {
        id: 'RELEASE', name: 'Descent',
        duration: { percent: 15 }, // ~18 bars
        layers: { pad: true, bass: true, arpeggio: true, sparkles: true, sfx: true, harmony: true, accompaniment: true },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
        },
        instrumentRules: {},
        bundles: [ { id: 'RELEASE_BUNDLE_1', name: 'Softening', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'pad' } },
      },
      {
        id: 'BRIDGE', name: 'Promenade',
        duration: { percent: 5 }, // ~6 bars
        layers: { accompaniment: true, bass: true, sfx: true },
        instrumentation: {
          accompaniment: {
            strategy: 'weighted',
            options: [{ name: 'synth', weight: 1.0 }]
          },
          bass: {
            strategy: 'weighted',
            options: [{ name: 'glideBass', weight: 1.0 }]
          }
        },
        instrumentRules: {},
        bundles: [ { id: 'BRIDGE_BUNDLE_1', name: 'Transition', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
    ]
  },
  
  mutations: { /* Simplified for now */ },
  ambientEvents: [],
  continuity: {},
  rendering: {}
};


export const DarkAmbientBlueprint: MusicBlueprint = {
    id: 'dark_ambient',
    name: 'Abyssal Descent',
    description: 'Тёмный, давящий, медленный эмбиент.',
    mood: 'dark',
    musical: {
        key: { root: 'C', scale: 'phrygian', octave: 2 },
        bpm: { base: 42, range: [40, 48], modifier: 0.8 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
          type: 'arc',
          peakPosition: 0.65,
          curve: (progress: number, peakPos: number): number => {
            if (progress < peakPos) return Math.pow(progress / peakPos, 1.1);
            else return Math.pow((1 - progress) / (1 - peakPos), 2.0);
          }
        }
    },
    structure: {
        totalDuration: { preferredBars: 120 },
        parts: [
          {
            id: 'INTRO_1', name: 'Creeping Fog',
            duration: { percent: 10 },
            layers: { bass: true, accompaniment: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'DARK_INTRO_BUNDLE_1', name: 'Drone', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'INTRO_2', name: 'First Glimmer',
            duration: { percent: 10 },
            layers: { bass: true, accompaniment: true, melody: true, sparkles: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'theremin', weight: 1.0 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'DARK_INTRO_BUNDLE_2', name: 'Whispers', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'INTRO_3', name: 'Full Darkness',
            duration: { percent: 10 },
            layers: { bass: true, accompaniment: true, melody: true, sparkles: true, drums: true, sfx: true, harmony: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'theremin', weight: 0.7 }, { name: 'synth', weight: 0.3 }] }
            },
            instrumentRules: {},
            bundles: [ { id: 'DARK_INTRO_BUNDLE_3', name: 'Deepening', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'BUILD', name: 'Distant Thunder',
            duration: { percent: 20 },
            layers: { bass: true, sfx: true, drums: true, melody: true, pad: true, accompaniment: true, harmony: true, sparkles: true },
             instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'theremin', weight: 0.5 }, { name: 'synth', weight: 0.5 }] }
            },
            instrumentRules: {},
            bundles: [ { id: 'BUILD_BUNDLE_1', name: 'Rumble', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'MAIN', name: 'The Abyss',
            duration: { percent: 30 },
            layers: { bass: true, sfx: true, drums: true, melody: true, pad: true, accompaniment: true, harmony: true, sparkles: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }]},
              melody: { strategy: 'weighted', options: [{ name: 'theremin', weight: 0.4 }, { name: 'synth', weight: 0.4 }, { name: 'electricGuitar', weight: 0.2 }] }
            },
            instrumentRules: {},
            bundles: [
              { id: 'MAIN_BUNDLE_1', name: 'Stasis', duration: { percent: 50 }, characteristics: {}, phrases: {} },
              { id: 'MAIN_BUNDLE_2', name: 'Pressure', duration: { percent: 50 }, characteristics: {}, phrases: {} }
            ],
            outroFill: null,
          },
          {
            id: 'OUTRO', name: 'Fading Echo',
            duration: { percent: 20 },
            layers: { bass: true, sfx: true, accompaniment: true },
             instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'OUTRO_BUNDLE_1', name: 'Silence', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          }
        ]
    },
    mutations: { },
    ambientEvents: [],
    continuity: {},
    rendering: {}
};

export const JoyfulAmbientBlueprint: MusicBlueprint = {
    id: 'joyful_ambient',
    name: 'Golden Horizons',
    description: 'Светлый, радостный и воздушный эмбиент.',
    mood: 'joyful',
    musical: {
        key: { root: 'G', scale: 'lydian', octave: 4 },
        bpm: { base: 60, range: [58, 65], modifier: 1.1 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
          type: 'wave',
          peakPosition: 0.5,
          curve: (progress: number, peakPos: number): number => 0.5 + 0.5 * Math.sin(progress * Math.PI * 2)
        }
    },
     structure: {
        totalDuration: { preferredBars: 120 },
        parts: [
          {
            id: 'INTRO_1', name: 'Sunrise',
            duration: { percent: 10 },
            layers: { melody: true, sparkles: true },
            instrumentation: {
              melody: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'JOY_INTRO_BUNDLE_1', name: 'First Light', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
           {
            id: 'INTRO_2', name: 'Awakening',
            duration: { percent: 10 },
            layers: { melody: true, sparkles: true, bass: true, drums: true, accompaniment: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'JOY_INTRO_BUNDLE_2', name: 'First Pulse', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'BUILD', name: 'Gathering Light',
            duration: { percent: 30 },
            layers: { melody: true, sparkles: true, bass: true, drums: true, arpeggio: true, accompaniment: true, harmony: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'organ', weight: 0.5 }, { name: 'mellotron', weight: 0.5 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'JOY_BUILD_BUNDLE_1', name: 'Ascension', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'MAIN', name: 'Zenith',
            duration: { percent: 30 },
            layers: { melody: true, sparkles: true, bass: true, drums: true, arpeggio: true, pad: true, accompaniment: true, harmony: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'electricGuitar', weight: 0.5 }, { name: 'synth', weight: 0.5 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'JOY_MAIN_BUNDLE_1', name: 'Celebration', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          },
          {
            id: 'OUTRO', name: 'Afterglow',
            duration: { percent: 20 },
            layers: { melody: true, sparkles: true, accompaniment: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }]}
            },
            instrumentRules: {},
            bundles: [ { id: 'JOY_OUTRO_BUNDLE_1', name: 'Lingering', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
            outroFill: null,
          }
        ]
    },
    mutations: { },
    ambientEvents: [],
    continuity: {},
    rendering: {}
};

export const BLUEPRINT_LIBRARY: Record<Mood, MusicBlueprint> = {
    // Positive
    epic: JoyfulAmbientBlueprint,
    joyful: JoyfulAmbientBlueprint,
    enthusiastic: JoyfulAmbientBlueprint,
    
    // Negative
    melancholic: MelancholicAmbientBlueprint,
    dark: DarkAmbientBlueprint,
    anxious: DarkAmbientBlueprint,
    
    // Neutral
    dreamy: MelancholicAmbientBlueprint,
    contemplative: MelancholicAmbientBlueprint,
    calm: MelancholicAmbientBlueprint,
};

export default MelancholicAmbientBlueprint;
