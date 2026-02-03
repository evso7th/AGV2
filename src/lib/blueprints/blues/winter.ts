import type { MusicBlueprint } from '@/types/music';

export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'Winter Blues',
    description: 'A slow, atmospheric blues with a melancholic feel. Uses staged intro lottery.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.4) : 1 - Math.pow((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO_1', name: 'The Frost', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 10 }, // Stage 1: Quick entry
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 0.8, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 0.8, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.8 }, { name: 'flute', weight: 0.2 } ] }
                        }
                    },
                    {
                        duration: { percent: 10 }, // Stage 2: Foundation
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           bass: { activationChance: 0.4, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 0.4, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.8 }, { name: 'flute', weight: 0.2 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 20 }, // Stage 3: Cold Air
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'synth_ambient_pad_lush', weight: 1.0 } ] },
                           drums: { activationChance: 0.7, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.8 }, { name: 'flute', weight: 0.2 } ] }
                        }
                    },
                    {
                        duration: { percent: 60 }, // Stage 4: Long Wait
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.8 }, { name: 'flute', weight: 0.2 } ] },
                           sfx: { activationChance: 0.2, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true },
                           sparkles: { activationChance: 0.05, instrumentOptions: [ { name: 'light', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.4, max: 0.7 } },
                    melody: { source: 'blues_solo', soloToPatternRatio: 0.7, density: { min: 0.5, max: 0.9 }, soloPlan: "S07" },
                    drums: { kitName: 'blues_melancholic_master', density: { min: 0.2, max: 0.4 }, usePerc: true },
                    sfx: { eventProbability: 0.1, categories: [{ name: 'common', weight: 1.0 }] },
                    sparkles: { eventProbability: 0.05, categories: [{ name: 'light', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_INTRO_BUNDLE_1', name: 'Wait', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'Deep Winter', duration: { percent: 35 },
                layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true, sparkles: true, pianoAccompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ], v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                    melody: { strategy: 'weighted', v1Options: [{name: 'blackAcoustic', weight: 1.0}], v2Options: [{name: 'blackAcoustic', weight: 1.0}] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [ { name: 'guitarChords', weight: 0.8 }, { name: 'flute', weight: 0.2 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.5, max: 0.7 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S09", density: { min: 0.5, max: 0.9 }, soloToPatternRatio: 0.7 },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.5, max: 0.8 } },
                    sparkles: { eventProbability: 0.05 }
                },
                bundles: [{ id: 'WINTER_MAIN_BUNDLE_1', name: 'Snowfall', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Ice Cry', duration: { percent: 25 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ], v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                    melody: { strategy: 'weighted', v1Options: [{name: 'blackAcoustic', weight: 1.0}], v2Options: [{name: 'blackAcoustic', weight: 1.0}] },
                    harmony: { strategy: 'weighted', options: [ { name: 'guitarChords', weight: 0.8 }, { name: 'flute', weight: 0.2 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.6, max: 0.8 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S10", density: { min: 0.7, max: 1.0 }, soloToPatternRatio: 0.7, register: { preferred: 'high' } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.6, max: 0.9 } }
                },
                bundles: [{ id: 'WINTER_SOLO_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'ride' } },
            },
            {
                id: 'OUTRO', name: 'Dissolution', duration: { percent: 15 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [ { name: 'guitarChords', weight: 0.8 }, { name: 'flute', weight: 0.2 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.2, max: 0.4 }, useSnare: false },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], density: {min: 0.3, max: 0.5} },
                    melody: { source: 'blues_solo', density: { min: 1.0, max: 1.0 }, soloPlan: "WINTER_OUTRO_MELODY", soloToPatternRatio: 0.0 },
                    accompaniment: { density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'WINTER_OUTRO_BUNDLE', name: 'Final Embers', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
