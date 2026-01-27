
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
        tensionProfile: { type: 'plateau', peakPosition: 0.3, curve: (p: number, pp: number) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'prolog-1', name: 'Verse 1', duration: { percent: 15 },
                introRules: {
                    instrumentPool: ['drums', 'bass', 'accompaniment', 'melody'],
                    stages: 4,
                },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    bass: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ],
                        v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ]
                    },
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'ambientPad', weight: 1.0 }],
                        v2Options: [{ name: 'synth', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                          { name: 'piano', weight: 0.5 },
                          { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: {
                        kitName: 'blues_calm_intro_outro',
                        density: { min: 0.1, max: 0.2 },
                        kitOverrides: { substitute: {} },
                        useSnare: true,
                        useGhostHat: true,
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.3, max: 0.5 } },
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                    melody: {
                        source: 'motif',
                        density: { min: 0.5, max: 0.7 },
                        register: { preferred: 'mid' },
                        fingerstyle: [ { bars: [0, 1, 2, 3], pattern: 'F_TRAVIS', voicingName: 'Em7_open' } ],
                    }
                },
                bundles: [{ id: 'BLUES_WINTER_VERSE_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'prolog-2', name: 'Build-Up', duration: { percent: 20 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentation: {
                    bass: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ],
                        v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ]
                    },
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'ambientPad', weight: 1.0 }],
                        v2Options: [{ name: 'synth', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { kitName: 'blues_no_cymbals', density: { min: 0.5, max: 0.7 } },
                    melody: { source: 'motif', density: { min: 0.6, max: 0.8 }, register: { preferred: 'mid' }, strum: [ { bars: [0, 1, 2, 3], pattern: 'S_SWING', voicingName: 'Am7_open' } ] },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { density: {min: 0.2, max: 0.4} },
                },
                bundles: [{ id: 'BLUES_WINTER_BUILD_BUNDLE', name: 'Build', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'prolog-3', name: 'Anticipation', duration: { percent: 15 },
                layers: { accompaniment: true, bass: true, melody: true, harmony: true, sfx: true, sparkles: true, drums: true },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'organ_soft_jazz', weight: 1.0 } ],
                        v2Options: [ { name: 'organ_soft_jazz', weight: 1.0 } ]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'telecaster', weight: 1.0 }], v2Options: [{ name: 'telecaster', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [ { name: 'violin', weight: 1.0 } ] } // <<< Скрипки вступают здесь
                },
                instrumentRules: {
                    accompaniment: { register: { preferred: 'low' } },
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: true, usePerc: true },
                    melody: { source: 'harmony_top_note' },
                },
                bundles: [ { id: 'BLUES_WINTER_INTRO_BUNDLE_3', name: 'Anticipation', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
            },
            {
                id: 'SOLO', name: 'Solo', duration: { percent: 30 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentation: {
                    bass: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ],
                        v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ]
                    },
                     accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ_soft_jazz', weight: 0.5 }, { name: 'synth', weight: 0.5 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 0.5 }, { name: 'ep_rhodes_warm', weight: 0.5}]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [
                            { name: 'blackAcoustic', weight: 0.3 },
                            { name: 'organ', weight: 0.3 },
                            { name: 'synth', weight: 0.1 }
                        ],
                        v2Options: [
                            { name: 'blackAcoustic', weight: 0.3 },
                            { name: 'organ_soft_jazz', weight: 0.15 },
                            { name: 'organ_prog', weight: 0.15 }, 
                            { name: 'ep_rhodes_warm', weight: 0.1 }
                        ]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: {
                        kitName: 'blues_no_cymbals',
                        density: { min: 0.7, max: 0.9 },
                        kickVolume: 1.1,
                        kitOverrides: {
                            add: ['drum_ride']
                        }
                    },
                    melody: {
                        source: 'motif',
                        density: { min: 0.8, max: 1.0 },
                        register: { preferred: 'high' },
                        soloPlan: 'S06'
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { density: {min: 0.2, max: 0.4} },
                },
                bundles: [{ id: 'BLUES_WINTER_SOLO_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'MAIN-2', name: 'Main Theme B', duration: { percent: 10 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentation: {
                    bass: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ],
                        v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ]
                    },
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ_soft_jazz', weight: 0.5 }, { name: 'ep_rhodes_warm', weight: 0.5 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 0.5 }, { name: 'ep_rhodes_warm', weight: 0.5}]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                          { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { kitName: 'blues_no_cymbals', density: { min: 0.6, max: 0.8 } },
                    melody: { source: 'motif', density: { min: 0.7, max: 0.9 }, register: { preferred: 'mid' }, strum: [ { bars: [0, 1, 2, 3], pattern: 'S_4DOWN', voicingName: 'Am7_open' } ] },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { density: {min: 0.3, max: 0.5} },
                },
                bundles: [{ id: 'BLUES_WINTER_MAIN2_BUNDLE', name: 'Main B', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Return to Riff', duration: { percent: 10 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                     bass: {
                        strategy: 'weighted',
                        v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ],
                        v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ]
                    },
                     accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ_soft_jazz', weight: 0.5 }, { name: 'ep_rhodes_warm', weight: 0.5 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 0.5 }, { name: 'ep_rhodes_warm', weight: 0.5}]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'mellotron_flute_intimate', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: {
                        kitName: 'blues_calm_intro_outro',
                        density: { min: 0.1, max: 0.2 },
                        kitOverrides: { substitute: {} }
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: {
                        source: 'motif',
                        density: { min: 0.5, max: 0.7 },
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
