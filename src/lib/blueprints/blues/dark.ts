import type { MusicBlueprint } from '@/types/music';

export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Ritual Blues',
    description: 'A slow, heavy, and ritualistic blues with a sense of dread. Focused on acoustic guitar and gradual build.',
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
                        duration: { percent: 25 }, // Stage 1: Fragile Start
                        instrumentation: {
                           melody: {
                                activationChance: 1.0,
                                transient: false,
                                instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ]
                           },
                           pianoAccompaniment: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'piano', weight: 1.0 } ]
                           }
                        }
                    },
                    {
                        duration: { percent: 25 }, // Stage 2: Foundation
                        instrumentation: {
                           bass: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'bass_dub', weight: 1.0 } ]
                           },
                           drums: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'winter_blues_prolog1', weight: 1.0 } ]
                           }
                        }
                    },
                    {
                        duration: { percent: 25 }, // Stage 3: Texture
                        instrumentation: {
                           accompaniment: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'organ_circus_of_dread', weight: 1.0 } ]
                           },
                           sfx: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'dark', weight: 1.0 } ]
                           }
                        }
                    },
                    {
                        duration: { percent: 25 }, // Stage 4: Orchestration
                        instrumentation: {
                           harmony: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'violin', weight: 1.0 } ]
                           },
                           sparkles: {
                               activationChance: 1.0,
                               instrumentOptions: [ { name: 'dark', weight: 1.0 } ]
                           }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'power-chords', weight: 1.0 }], density: { min: 0.1, max: 0.3 } },
                    melody: { source: 'blues_solo', soloToPatternRatio: 0.7, density: { min: 0.5, max: 0.9 }, soloPlan: "S06" },
                    drums: { kitName: 'winter_blues_prolog1', density: { min: 0.3, max: 0.5 }, usePerc: true },
                    sfx: { eventProbability: 0.15, categories: [{ name: 'dark', weight: 1.0 }] },
                    sparkles: { eventProbability: 0.25, categories: [{ name: 'dark', weight: 1.0 }] }
                },
                bundles: [ { id: 'DARK_INTRO_BUNDLE_1', name: 'Drone', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'The Chant', duration: { percent: 35 },
                layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true, sparkles: true, pianoAccompaniment: true },
                 instrumentation: {
                    bass: { strategy: 'weighted', v1Options: [ { name: 'bass_dub', weight: 1.0 } ], v2Options: [ { name: 'bass_dub', weight: 1.0 } ] },
                    melody: { strategy: 'weighted', v1Options: [{name: 'blackAcoustic', weight: 1.0}], v2Options: [{name: 'blackAcoustic', weight: 1.0}] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ_circus_of_dread', weight: 1.0 }], v2Options: [{ name: 'organ_circus_of_dread', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.5, max: 0.7 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S06", density: { min: 0.5, max: 0.9 }, soloToPatternRatio: 0.7 },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 0.8 }, { value: 'arpeggio-slow', weight: 0.2 }] },
                    sparkles: { eventProbability: 0.25, categories: [{name: 'dark', weight: 1.0}] }
                },
                bundles: [{ id: 'DARK_MAIN_BUNDLE_1', name: 'Ritual', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fading Embers', duration: { percent: 25 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'dark_outro', density: { min: 0.2, max: 0.4 }, useSnare: false, usePerc: true },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], density: {min: 0.3, max: 0.5} },
                    melody: { source: 'blues_solo', density: { min: 1.0, max: 1.0 }, soloPlan: "WINTER_OUTRO_MELODY", soloToPatternRatio: 0.0 },
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