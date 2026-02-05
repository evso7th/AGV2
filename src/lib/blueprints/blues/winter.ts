import type { MusicBlueprint } from '@/types/music';

export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'Winter Blues',
    description: 'A slow, atmospheric blues with a melancholic feel. Uses sticky orchestra and staged scenes.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? p / pp : 1 - Math.pow((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO_1', name: 'The Frost', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 33 },
                        instrumentation: {
                           bass: { activationChance: 0.66, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 0.66, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           melody: { 
                               activationChance: 0.5, 
                               instrumentOptions: [ 
                                   { name: 'blackAcoustic', weight: 0.33 }, 
                                   { name: 'guitar_shineOn', weight: 0.33 }, 
                                   { name: 'guitar_muffLead', weight: 0.34 } 
                               ] 
                           },
                           accompaniment: { activationChance: 0.66, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 33 },
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           melody: { 
                               activationChance: 1.0, 
                               instrumentOptions: [ 
                                   { name: 'blackAcoustic', weight: 0.33 }, 
                                   { name: 'guitar_shineOn', weight: 0.33 }, 
                                   { name: 'guitar_muffLead', weight: 0.34 } 
                               ] 
                           }
                        }
                    },
                    {
                        duration: { percent: 34 },
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           melody: { 
                               activationChance: 1.0, 
                               instrumentOptions: [ 
                                   { name: 'blackAcoustic', weight: 0.33 }, 
                                   { name: 'guitar_shineOn', weight: 0.33 }, 
                                   { name: 'guitar_muffLead', weight: 0.34 } 
                               ] 
                           },
                           harmony: { 
                               activationChance: 1.0, 
                               instrumentOptions: [ 
                                   { name: 'guitarChords', weight: 0.8 }, 
                                   { name: 'mellotron_flute_intimate', weight: 0.2 } 
                               ] 
                           },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'choral', weight: 1.0 }], density: { min: 0.4, max: 0.7 } },
                    melody: { source: 'blues_solo', soloToPatternRatio: 1.0, density: { min: 0.7, max: 1.0 }, soloPlan: "S04" },
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
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [
                            { name: 'blackAcoustic', weight: 0.33 },
                            { name: 'guitar_shineOn', weight: 0.33 },
                            { name: 'guitar_muffLead', weight: 0.34 }
                        ], 
                        v2Options: [
                            { name: 'blackAcoustic', weight: 0.33 },
                            { name: 'guitar_shineOn', weight: 0.33 },
                            { name: 'guitar_muffLead', weight: 0.34 }
                        ] 
                    },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [ { name: 'guitarChords', weight: 0.8 }, { name: 'mellotron_flute_intimate', weight: 0.2 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.5, max: 0.7 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S_ACTIVE", density: { min: 0.8, max: 1.0 }, soloToPatternRatio: 1.0 },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }], density: { min: 0.5, max: 0.8 } },
                    sparkles: { eventProbability: 0.05 },
                    sfx: { eventProbability: 0.15, categories: [{ name: 'common', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_MAIN_BUNDLE_1', name: 'Snowfall', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Ice Cry', duration: { percent: 25 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true, sfx: true, sparkles: true },
                instrumentation: {
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [
                            { name: 'blackAcoustic', weight: 0.33 },
                            { name: 'guitar_shineOn', weight: 0.33 },
                            { name: 'guitar_muffLead', weight: 0.34 }
                        ], 
                        v2Options: [
                            { name: 'blackAcoustic', weight: 0.33 },
                            { name: 'guitar_shineOn', weight: 0.33 },
                            { name: 'guitar_muffLead', weight: 0.34 }
                        ] 
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.6, max: 0.8 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S_ACTIVE", density: { min: 0.9, max: 1.0 }, soloToPatternRatio: 1.0, register: { preferred: 'high' } },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }], density: { min: 0.6, max: 0.9 } },
                    sfx: { eventProbability: 0.2, categories: [{ name: 'common', weight: 1.0 }] },
                    sparkles: { eventProbability: 0.1 }
                },
                bundles: [{ id: 'WINTER_SOLO_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'ride' } },
            },
            {
                id: 'OUTRO', name: 'Dissolution', duration: { percent: 15 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true, sfx: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 33 },
                        instrumentation: {
                           harmony: { activationChance: 0.0, instrumentOptions: [] },
                           melody: { 
                               activationChance: 1.0, 
                               instrumentOptions: [ 
                                   { name: 'blackAcoustic', weight: 0.33 }, 
                                   { name: 'guitar_shineOn', weight: 0.33 }, 
                                   { name: 'guitar_muffLead', weight: 0.34 } 
                               ] 
                           },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 33 },
                        instrumentation: {
                           harmony: { activationChance: 0.0, instrumentOptions: [] },
                           melody: { activationChance: 0.0, instrumentOptions: [] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 34 },
                        instrumentation: {
                           harmony: { activationChance: 0.0, instrumentOptions: [] },
                           melody: { activationChance: 0.0, instrumentOptions: [] },
                           bass: { activationChance: 0.0, instrumentOptions: [] },
                           drums: { activationChance: 0.0, instrumentOptions: [] },
                           accompaniment: { activationChance: 0.0, instrumentOptions: [] }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.2, max: 0.4 }, useSnare: false },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], density: {min: 0.3, max: 0.5} },
                    melody: { source: 'blues_solo', density: { min: 1.0, max: 1.0 }, soloPlan: "WINTER_OUTRO_MELODY", soloToPatternRatio: 0.0 },
                    accompaniment: { density: { min: 0.3, max: 0.5 }, techniques: [{ value: 'choral', weight: 1.0 }] }
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
