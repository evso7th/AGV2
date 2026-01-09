
import type { MusicBlueprint } from '@/types/music';

export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'Winter Blues',
    description: 'A deep, melancholic blues based on a calm, riff-based structure, featuring a wide range of guitars.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'aeolian', octave: 2 },
        bpm: { base: 66, range: [64, 72], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar structure
        tensionProfile: { type: 'plateau', peakPosition: 0.3, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars = 120 bars total
        parts: [
            {
                id: 'INTRO', name: 'Main Riff Intro', duration: { percent: 15 },
                introRules: {
                    instrumentPool: ['drums', 'bass', 'melody'],
                    stages: 3,
                },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'acousticGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                          { name: 'guitarChords', weight: 0.6 },
                          { name: 'piano', weight: 0.4 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.1, max: 0.3 }, useSnare: false, usePerc: true, rareKick: true },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.3, max: 0.5 } },
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.2, max: 0.4 }, 
                        register: { preferred: 'mid' },
                        fingerstyle: [ { bars: [0, 1, 2, 3], pattern: 'F_TRAVIS', voicingName: 'Em7_open' } ],
                    }
                },
                bundles: [{ id: 'BLUES_WINTER_VERSE_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Build-Up', duration: { percent: 20 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'electricGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: { strategy: 'weighted', options: [ { name: 'piano', weight: 1.0 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.5, max: 0.7 }, ride: { enabled: false } },
                    melody: { source: 'motif', density: { min: 0.5, max: 0.7 }, register: { preferred: 'mid' }, strum: [ { bars: [0, 1, 2, 3], pattern: 'S_SWING', voicingName: 'Am7_open' } ] },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                },
                bundles: [{ id: 'BLUES_WINTER_BUILD_BUNDLE', name: 'Build', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'MAIN-1', name: 'Main Theme A', duration: { percent: 15 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'electricGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: { strategy: 'weighted', options: [ { name: 'piano', weight: 1.0 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.6, max: 0.8 }, ride: { enabled: true } },
                    melody: { source: 'motif', density: { min: 0.5, max: 0.7 }, register: { preferred: 'mid' }, fingerstyle: [ { bars: [0, 1, 2, 3], pattern: 'F_ROLL12', voicingName: 'Em7_open' } ] },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                },
                bundles: [{ id: 'BLUES_WINTER_MAIN1_BUNDLE', name: 'Main A', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Solo', duration: { percent: 30 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'electricGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }]
                    },
                    harmony: { strategy: 'weighted', options: [ { name: 'piano', weight: 1.0 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.7, max: 0.9 }, ride: { enabled: true }, kickVolume: 1.1 },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'high' },
                        soloPlan: 'S06'
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                },
                bundles: [{ id: 'BLUES_WINTER_SOLO_BUNDLE', name: 'Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'MAIN-2', name: 'Main Theme B', duration: { percent: 10 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'electricGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: { strategy: 'weighted', options: [ { name: 'piano', weight: 1.0 } ] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.6, max: 0.8 }, ride: { enabled: true } },
                    melody: { source: 'motif', density: { min: 0.5, max: 0.7 }, register: { preferred: 'mid' }, strum: [ { bars: [0, 1, 2, 3], pattern: 'S_4DOWN', voicingName: 'Am7_open' } ] },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                },
                bundles: [{ id: 'BLUES_WINTER_MAIN2_BUNDLE', name: 'Main B', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Return to Riff', duration: { percent: 10 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'acousticGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                          { name: 'guitarChords', weight: 0.6 },
                          { name: 'piano', weight: 0.4 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.4, max: 0.6 } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.2, max: 0.4 }, 
                        register: { preferred: 'mid' },
                        fingerstyle: [ { bars: [0, 1, 2, 3], pattern: 'F_TRAVIS', voicingName: 'Em7_open' } ],
                    }
                },
                bundles: [{ id: 'BLUES_WINTER_OUTRO_BUNDLE', name: 'Final Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
