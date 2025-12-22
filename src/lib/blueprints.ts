
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
    totalDuration: {
      preferredBars: 120 // Adjusted for longer structure ~10-11 mins
    },
    
    parts: [
      {
        id: 'INTRO_1', name: 'Awakening Pad',
        duration: { percent: 7 }, // ~8 bars
        layers: { pad: true },
        instrumentRules: {},
        bundles: [
          { id: 'INTRO_1_BUNDLE_1', name: 'Emergence', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null,
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
        }
      },
      {
        id: 'INTRO_2', name: 'Rhythm Enters',
        duration: { percent: 7 }, // ~8 bars
        layers: { pad: true, bass: true, sfx: true, drums: true },
        instrumentRules: {},
        bundles: [
          { id: 'INTRO_2_BUNDLE_1', name: 'First Pulse', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null,
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
        }
      },
      {
        id: 'INTRO_3', name: 'Full Intro',
        duration: { percent: 6 }, // ~7 bars
        layers: { pad: true, bass: true, sfx: true, drums: true, melody: true, sparkles: true },
        instrumentRules: {},
        bundles: [
            { id: 'INTRO_3_BUNDLE_1', name: 'Anticipation', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
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
        }
      },
      {
        id: 'BUILD_1', name: 'First Rise',
        duration: { percent: 10 }, // ~12 bars
        layers: { pad: true, bass: true, arpeggio: true, drums: true, sfx: true, melody: true, sparkles: true },
        instrumentRules: {},
        bundles: [
            { id: 'BUILD_1_BUNDLE_1', name: 'Stirring', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null,
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
        }
      },
      {
        id: 'MAIN_1', name: 'First Apex',
        duration: { percent: 15 }, // ~18 bars
        layers: { pad: true, bass: true, arpeggio: true, melody: true, sparkles: true, drums: true, sfx: true },
        instrumentRules: {},
        bundles: [
            { id: 'MAIN_1_BUNDLE_1', name: 'Arrival', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null,
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
        }
      },
       {
        id: 'BUILD_2', name: 'Second Rise',
        duration: { percent: 10 }, // ~12 bars
        layers: { pad: true, bass: true, arpeggio: true, drums: true, sfx: true, melody: true, sparkles: true },
        instrumentRules: {},
        bundles: [
            { id: 'BUILD_2_BUNDLE_1', name: 'Intensifying', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
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
        }
      },
      {
        id: 'MAIN_2', name: 'Second Apex',
        duration: { percent: 20 }, // ~24 bars
        layers: { pad: true, bass: true, arpeggio: true, melody: true, sparkles: true, drums: true, sfx: true },
        instrumentRules: {},
        bundles: [
            { id: 'MAIN_2_BUNDLE_1', name: 'Plateau', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_2_BUNDLE_2', name: 'Reflection', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null,
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
        }
      },
      {
        id: 'RELEASE', name: 'Descent',
        duration: { percent: 15 }, // ~18 bars
        layers: { pad: true, bass: true, arpeggio: true, sparkles: true, sfx: true },
        instrumentRules: {},
        bundles: [
          { id: 'RELEASE_BUNDLE_1', name: 'Softening', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'pad' } },
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
        }
      },
      {
        id: 'OUTRO', name: 'Dissolution',
        duration: { percent: 10 }, // ~12 bars
        layers: { pad: true, sfx: true },
        instrumentRules: {},
        bundles: [
          { id: 'OUTRO_BUNDLE_1', name: 'Fading', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null, // This is where a bridge to a new suite would be triggered.
        instrumentation: {
            accompaniment: {
                strategy: 'weighted',
                options: [{ name: 'ambientPad', weight: 1.0 }]
            },
        }
      }
    ]
  },
  
  mutations: { /* Simplified for now */ },
  ambientEvents: [],
  continuity: {},
  rendering: {}
};


export const DarkAmbientBlueprint: MusicBlueprint = {
    ...MelancholicAmbientBlueprint,
    id: 'dark_ambient',
    name: 'Abyssal Descent',
    description: 'Тёмный, давящий, медленный эмбиент.',
    mood: 'dark',
    musical: {
        ...MelancholicAmbientBlueprint.musical,
        bpm: { base: 42, range: [40, 48], modifier: 0.8 },
    },
};

export const JoyfulAmbientBlueprint: MusicBlueprint = {
    ...MelancholicAmbientBlueprint,
    id: 'joyful_ambient',
    name: 'Golden Horizons',
    description: 'Светлый, радостный и воздушный эмбиент.',
    mood: 'joyful',
    musical: {
        ...MelancholicAmbientBlueprint.musical,
        key: { root: 'D', scale: 'lydian', octave: 4 },
        bpm: { base: 60, range: [58, 65], modifier: 1.1 },
    },
};

export const BLUEPRINT_LIBRARY: Record<Mood, MusicBlueprint> = {
    // Positive
    epic: MelancholicAmbientBlueprint, // Fallback
    joyful: JoyfulAmbientBlueprint,
    enthusiastic: JoyfulAmbientBlueprint, // Fallback
    
    // Negative
    melancholic: MelancholicAmbientBlueprint,
    dark: DarkAmbientBlueprint,
    anxious: DarkAmbientBlueprint, // Fallback
    
    // Neutral
    dreamy: MelancholicAmbientBlueprint, // Fallback
    contemplative: MelancholicAmbientBlueprint, // Fallback
    calm: MelancholicAmbientBlueprint, // Fallback
};

export default MelancholicAmbientBlueprint;
