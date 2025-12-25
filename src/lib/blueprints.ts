

import type { MusicBlueprint, Mood, Genre, BlueprintPart } from '@/types/music';

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
        id: 'INTRO_1', name: 'Emergence',
        duration: { percent: 5 },
        layers: { accompaniment: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] }
        },
        instrumentRules: {
            accompaniment: {
                density: { min: 0.3, max: 0.5 },
                voices: { min: 2, max: 3 },
                envelope: { attack: { min: 1500, max: 3000 }, release: { min: 5000, max: 9000 } }
            }
        },
        bundles: [ { id: 'INTRO_BUNDLE_1', name: 'Emergence', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_2', name: 'Stirrings',
        duration: { percent: 10 },
        layers: { accompaniment: true, bass: true, sparkles: true },
        instrumentation: {
          accompaniment: {
            strategy: 'weighted',
            options: [{ name: 'ambientPad', weight: 0.8 }, { name: 'organ', weight: 0.2 }]
          },
          bass: {
            strategy: 'weighted',
            options: [{ name: 'ambientDrone', weight: 1.0 }]
          }
        },
        instrumentRules: {
            bass: {
                techniques: [{ value: 'drone', weight: 1.0 }],
                register: { preferred: 'low', range: { min: 26, max: 43 } },
                density: { min: 0.2, max: 0.35 },
            },
            accompaniment: {
                density: { min: 0.5, max: 0.7 },
            }
        },
        bundles: [ { id: 'INTRO_BUNDLE_2', name: 'Stirrings', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_3', name: 'Anticipation',
        duration: { percent: 5 },
        layers: { accompaniment: true, bass: true, sfx: true },
        instrumentation: {
          accompaniment: {
            strategy: 'weighted',
            options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }]
          },
          bass: {
            strategy: 'weighted',
            options: [{ name: 'classicBass', weight: 1.0 }]
          }
        },
        instrumentRules: {
            bass: {
                techniques: [{ value: 'pedal', weight: 0.7 }, { value: 'walking', weight: 0.3 }],
                density: { min: 0.4, max: 0.6 },
            },
        },
        bundles: [ { id: 'INTRO_BUNDLE_3', name: 'Anticipation', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      {
        id: 'BUILD', name: 'Rising',
        duration: { percent: 25 },
        layers: { accompaniment: true, bass: true, drums: true, sparkles: true, sfx: true },
         instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'organ', weight: 0.7 }, { name: 'ambientPad', weight: 0.3 }] },
            bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
        },
        instrumentRules: {
            bass: {
                techniques: [{ value: 'ostinato', weight: 0.5 }, { value: 'walking', weight: 0.5 }],
                density: { min: 0.5, max: 0.7 },
                envelope: { attack: { min: 400, max: 800 }, release: { min: 1500, max: 3000 } }
            },
            accompaniment: {
                density: { min: 0.7, max: 0.85 },
                voices: { min: 4, max: 5 },
            },
            drums: {
                pattern: 'ambient_beat',
                density: { min: 0.25, max: 0.4 },
            }
        },
        bundles: [ { id: 'BUILD_BUNDLE_1', name: 'Stirring', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      {
        id: 'MAIN', name: 'Apex',
        duration: { percent: 35 },
        layers: { accompaniment: true, bass: true, drums: true, melody: true, sparkles: true, sfx: true, harmony: true },
         instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'mellotron', weight: 0.6 }, { name: 'organ', weight: 0.4 }] },
            bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }] },
            melody: { strategy: 'weighted', options: [{ name: 'synth', weight: 0.8 }, { name: 'theremin', weight: 0.2 }] }
        },
        instrumentRules: {
            bass: {
                techniques: [{ value: 'walking', weight: 0.6 }, { value: 'melodic', weight: 0.4 }],
                density: { min: 0.65, max: 0.85 },
                envelope: { attack: { min: 200, max: 500 }, release: { min: 1000, max: 2000 } }
            },
            accompaniment: {
                density: { min: 0.8, max: 0.95 },
                voices: { min: 4, max: 6 },
            },
            drums: {
                pattern: 'composer',
                density: { min: 0.45, max: 0.65 },
            },
            melody: {
                density: { min: 0.2, max: 0.4 },
                phrasing: { phraseLength: { min: 4, max: 8 }, restBetween: { min: 4, max: 12 } }
            }
        },
        bundles: [
            { id: 'MAIN_BUNDLE_1', name: 'Arrival', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_BUNDLE_2', name: 'Plateau', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
      },
      {
        id: 'RELEASE', name: 'Descent',
        duration: { percent: 20 },
        layers: { accompaniment: true, bass: true, sparkles: true, sfx: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', options: [{ name: 'ambientPad', weight: 1.0 }] },
            bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] }
        },
        instrumentRules: {
            bass: {
                techniques: [{ value: 'pedal', weight: 0.7 }, { value: 'drone', weight: 0.3 }],
                density: { min: 0.4, max: 0.6 },
                envelope: { attack: { min: 600, max: 1200 }, release: { min: 2500, max: 5000 } }
            },
             accompaniment: {
                density: { min: 0.65, max: 0.8 },
                voices: { min: 3, max: 4 },
            }
        },
        bundles: [ { id: 'RELEASE_BUNDLE_1', name: 'Softening', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
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
    description: 'Светлый, энергичный, позитивный эмбиент.',
    mood: 'joyful',
    musical: {
        key: { root: 'C', scale: 'ionian', octave: 3 },
        bpm: { base: 62, range: [60, 70], modifier: 1.1 },
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
            layers: { accompaniment: true, melody: true, sparkles: true },
            instrumentation: {
              accompaniment: { strategy: 'weighted', options: [{ name: 'synth', weight: 1.0 }]},
              melody: { strategy: 'weighted', options: [{ name: 'organ', weight: 1.0 }]}
            },
            instrumentRules: {
              melody: { density: { min: 0.5, max: 0.7 }, register: { preferred: 'high' } },
              accompaniment: { density: { min: 0.4, max: 0.6 }, register: { preferred: 'mid' } },
              sparkles: { eventProbability: 0.2 },
            },
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
            instrumentRules: {
              bass: { techniques: [{value: 'walking', weight: 1.0}], density: {min: 0.6, max: 0.8}},
              drums: { pattern: 'ambient_beat', density: {min: 0.5, max: 0.7}}
            },
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
            instrumentRules: {
                bass: { techniques: [{value: 'melodic', weight: 0.7}, {value: 'walking', weight: 0.3}], density: {min: 0.7, max: 0.9}},
                accompaniment: { techniques: [{value: 'arpeggio-fast', weight: 1.0}]},
                drums: { pattern: 'composer', density: {min: 0.7, max: 0.9}}
            },
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
            instrumentRules: {
                bass: { techniques: [{value: 'syncopated', weight: 1.0}], density: {min: 0.8, max: 1.0}},
                drums: { pattern: 'composer', kickVolume: 1.2, density: {min: 0.8, max: 1.0}}
            },
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
            instrumentRules: {
                accompaniment: { techniques: [{value: 'long-chords', weight: 1.0}], density: {min: 0.3, max: 0.5}},
                melody: { density: {min: 0.2, max: 0.4} }
            },
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
      type: 'plateau', // Длинное плато спокойствия
      peakPosition: 0.3,
      curve: (progress: number, peakPos: number): number => {
        if (progress < peakPos) return progress / peakPos;
        if (progress < 0.8) return 1.0;
        return 1.0 - ((progress - 0.8) / 0.2);
      }
    }
  },
  structure: {
    totalDuration: { preferredBars: 120 },
    parts: [
      {
        id: 'INTRO', name: 'Gentle Awakening',
        duration: { percent: 20 },
        layers: { sparkles: true, accompaniment: true, sfx: true },
        instrumentation: {
          accompaniment: {
            strategy: 'weighted',
            options: [{ name: 'ambientPad', weight: 0.7 }, { name: 'synth', weight: 0.3 }]
          }
        },
        instrumentRules: {
          accompaniment: { density: { min: 0.4, max: 0.6 } },
          sparkles: { eventProbability: 0.15 },
          sfx: { density: 0.4 },
        },
        bundles: [{ id: 'CALM_INTRO_BUNDLE', name: 'First Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'BUILD', name: 'Flowing Stream',
        duration: { percent: 30 },
        layers: { sparkles: true, accompaniment: true, sfx: true, bass: true, arpeggio: true, drums: true },
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
        id: 'MAIN', name: 'Stillness',
        duration: { percent: 35 },
        layers: { sparkles: true, accompaniment: true, sfx: true, bass: true, arpeggio: true, drums: true, melody: true },
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
           melody: { density: { min: 0.2, max: 0.4 } } // редкая, спокойная мелодия
        },
        bundles: [{ id: 'CALM_MAIN_BUNDLE', name: 'Clarity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'OUTRO', name: 'Fading Light',
        duration: { percent: 15 },
        layers: { sparkles: true, accompaniment: true, sfx: true },
        instrumentation: {
           accompaniment: {
            strategy: 'weighted',
            options: [{ name: 'ambientPad', weight: 1.0 }]
          }
        },
        instrumentRules: {
            accompaniment: { density: { min: 0.3, max: 0.5 } },
            sparkles: { eventProbability: 0.1 },
        },
        bundles: [{ id: 'CALM_OUTRO_BUNDLE', name: 'Return', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      }
    ]
  },
  mutations: {},
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
    dreamy: CalmAmbientBlueprint,
    contemplative: CalmAmbientBlueprint,
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



    

    



