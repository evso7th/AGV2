
import type { MusicBlueprint } from '@/types/music';

export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Ritual Blues',
    description: 'A slow, heavy, and ritualistic blues with a sense of dread.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 62, range: [60, 66], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.4) : 1 - Math.pow((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 120 },
        parts: [
            {
                id: 'INTRO_1', name: 'The Void', duration: { percent: 15 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 25 }, // Stage 1: Melancholic Acoustic Start
                        instrumentation: {
                           melody: {
                                activationChance: 1.0,
                                instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ]
                           },
                           pianoAccompaniment: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'piano', weight: 1.0 } ]
                           }
                        }
                    },
                    {
                        duration: { percent: 25 }, // Stage 2: Heavy Foundation Enters
                        instrumentation: {
                           bass: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'bass_dub', weight: 1.0 } ]
                           },
                           drums: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'winter_blues_prolog1', weight: 1.0 } ]
                           },
                           melody: {
                               activationChance: 1.0,
                               instrumentOptions: [ 
                                   { name: 'darkTelecaster', weight: 0.5 },
                                   { name: 'blackAcoustic', weight: 0.5 }
                               ] 
                           }
                        }
                    },
                    {
                        duration: { percent: 25 }, // Stage 3: Texture and Dread
                        instrumentation: {
                           accompaniment: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'organ_circus_of_dread', weight: 1.0 } ]
                           },
                           sfx: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'dark', weight: 1.0 } ]
                           },
                           melody: {
                                activationChance: 1.0,
                                instrumentOptions: [ 
                                    { name: 'darkTelecaster', weight: 0.5 },
                                    { name: 'blackAcoustic', weight: 0.5 }
                                ] 
                            }
                        }
                    },
                    {
                        duration: { percent: 25 }, // Stage 4: Orchestral Doom
                        instrumentation: {
                           harmony: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'violin', weight: 1.0 } ]
                           },
                           sparkles: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'dark', weight: 1.0 } ]
                           },
                           melody: {
                                activationChance: 1.0,
                                instrumentOptions: [ 
                                    { name: 'darkTelecaster', weight: 0.5 },
                                    { name: 'blackAcoustic', weight: 0.5 }
                                ] 
                            }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'power-chords', weight: 1.0 }], density: { min: 0.1, max: 0.3 } },
                    melody: { source: 'blues_solo', soloToPatternRatio: 0.5, density: { min: 0.5, max: 0.9 }, soloPlan: "S06" },
                    drums: { kitName: 'winter_blues_prolog1', density: { min: 0.3, max: 0.5 }, usePerc: true },
                    sfx: { eventProbability: 0.15, categories: [{ name: 'dark', weight: 1.0 }] },
                    sparkles: { eventProbability: 0.25, categories: [{ name: 'dark', weight: 1.0 }] }
                },
                bundles: [ { id: 'DARK_INTRO_BUNDLE_1', name: 'Drone', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'First Echoes', duration: { percent: 10 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, drums: true, sparkles: true, pianoAccompaniment: true },
                instrumentation: {
                  bass: { strategy: 'weighted', v1Options: [{ name: 'bass_dub', weight: 1.0 }], v2Options: [{ name: 'bass_dub', weight: 1.0 }] },
                  accompaniment: { strategy: 'weighted', v1Options: [{name: 'synth_cave_pad', weight: 1.0}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] },
                  melody: { strategy: 'weighted', v1Options: [{name: 'darkTelecaster', weight: 0.5}, {name: 'blackAcoustic', weight: 0.5}], v2Options: [{name: 'darkTelecaster', weight: 0.5}, {name: 'blackAcoustic', weight: 0.5}] }
                },
                instrumentRules: {
                    drums: { enabled: true, pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: true, rareKick: true, usePerc: true, alternatePerc: false, kitName: 'winter_blues_prolog2' },
                    sfx: { eventProbability: 0.2, categories: [{name: 'dark', weight: 1.0}] },
                    sparkles: { eventProbability: 0.25, categories: [{ name: 'dark', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [ { id: 'DARK_INTRO_BUNDLE_2', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'The Chant', duration: { percent: 25 },
                layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true, sparkles: true, pianoAccompaniment: true },
                harmonicJourney: [{ center: 'i', satellites: ['iv'], weight: 0.7 }],
                 instrumentation: {
                    bass: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'bass_deep_house', weight: 0.6 }, { name: 'bass_dub', weight: 0.4 } ],
                        v2Options: [ { name: 'bass_deep_house', weight: 0.6 }, { name: 'bass_dub', weight: 0.4 } ]
                    },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'darkTelecaster', weight: 0.5 }, {name: 'blackAcoustic', weight: 0.5}], v2Options: [{ name: 'darkTelecaster', weight: 0.5 }, {name: 'blackAcoustic', weight: 0.5}] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ_circus_of_dread', weight: 1.0 }], v2Options: [{ name: 'organ_circus_of_dread', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.5, max: 0.7 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S06", density: { min: 0.5, max: 0.9 } },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 0.8 }, { value: 'arpeggio-slow', weight: 0.2 }] },
                    sparkles: { eventProbability: 0.25, categories: [{name: 'dark', weight: 1.0}] }
                },
                bundles: [{ id: 'DARK_MAIN_BUNDLE_1', name: 'The Chant', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_2', name: 'Ritual Peak', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, sfx: true, harmony: true, sparkles: true, pianoAccompaniment: true },
                harmonicJourney: [{ center: 'bVI', satellites: ['V'], weight: 0.6 }],
                 instrumentation: {
                    bass: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'bass_house', weight: 0.5 }, { name: 'bass_dub', weight: 0.5 } ],
                        v2Options: [ { name: 'bass_house', weight: 0.5 }, { name: 'bass_dub', weight: 0.5 } ]
                    },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'darkTelecaster', weight: 0.5 }, {name: 'blackAcoustic', weight: 0.5}], v2Options: [{ name: 'darkTelecaster', weight: 0.5 }, {name: 'blackAcoustic', weight: 0.5}] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ_circus_of_dread', weight: 1.0 }], v2Options: [{ name: 'organ_circus_of_dread', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.6, max: 0.8 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S07", density: { min: 0.6, max: 1.0 } },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 0.9 }, { value: 'arpeggio-fast', weight: 0.1 }] },
                    sparkles: { eventProbability: 0.25, categories: [{name: 'dark', weight: 1.0}] }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_B_BUNDLE', name: 'Intensity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'tom' } },
            },
            {
                id: 'OUTRO', name: 'Fading Embers', duration: { percent: 25 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true },
                stagedInstrumentation: [
                  {
                    duration: { percent: 100 },
                    instrumentation: {
                      bass: {
                        activationChance: 1.0,
                        instrumentOptions: [{ name: 'bass_dub', weight: 1.0 }]
                      },
                      melody: {
                        activationChance: 1.0,
                        instrumentOptions: [{ name: 'blackAcoustic', weight: 1.0 }]
                      },
                      harmony: {
                        activationChance: 1.0,
                        instrumentOptions: [{ name: 'piano', weight: 1.0 }]
                      },
                      accompaniment: {
                        activationChance: 1.0,
                        instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }]
                      },
                      drums: {
                        activationChance: 1.0,
                        instrumentOptions: [{ name: 'blues_dark_outro', weight: 1.0 }]
                      }
                    }
                  }
                ],
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark_outro', density: { min: 0.2, max: 0.4 }, useSnare: false, usePerc: true, rareKick: true },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], density: {min: 0.3, max: 0.5} },
                    melody: { 
                      source: 'blues_solo', 
                      density: { min: 1.0, max: 1.0 },
                      soloPlan: "WINTER_OUTRO_MELODY" 
                    },
                },
                bundles: [{ id: 'DARK_OUTRO_BUNDLE', name: 'Embers', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
