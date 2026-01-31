

import type { MusicBlueprint } from '@/types/music';

export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'Winter Blues',
    description: 'A slow, atmospheric blues with a melancholic feel.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 }, // Lowered octave for deeper feel
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.4) : 1 - Math.pow((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'prolog-1', name: 'Frost', duration: { percent: 10 },
                layers: { drums: true, bass: true, accompaniment: true, harmony: true, melody: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }] },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }],
                        v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], presetModifiers: { octaveShift: 1 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.9 }, soloPlan: "S06" },
                    drums: { pattern: 'composer', kitName: 'winter_blues_prolog1', density: { min: 0.1, max: 0.2 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_INTRO_1', name: 'Icy Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'prolog-2', name: 'First Snow', duration: { percent: 10 },
                layers: { drums: true, bass: true, accompaniment: true, harmony: true, melody: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.5 }, { name: 'synth', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'organ_soft_jazz', weight: 0.5 }] },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }],
                        v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], presetModifiers: { octaveShift: 1 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.9 }, soloPlan: "S07" },
                    drums: { pattern: 'composer', kitName: 'winter_blues_prolog2', density: { min: 0.2, max: 0.3 } },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_INTRO_2', name: 'Flurries', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'prolog-3', name: 'Frozen Lake', duration: { percent: 5 },
                layers: { drums: true, bass: true, accompaniment: true, harmony: true, melody: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.5 }, { name: 'synth', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'organ_soft_jazz', weight: 0.5 }] },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }],
                        v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], presetModifiers: { octaveShift: 1 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.9 }, soloPlan: "S08" },
                    drums: { pattern: 'composer', kitName: 'winter_blues_prolog3', density: { min: 0.3, max: 0.4 }, useSnare: true },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_INTRO_3', name: 'Mirror', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', density: 0.5 } },
            },
            {
                id: 'MAIN-1', name: 'Verse', duration: { percent: 25 },
                layers: { drums: true, bass: true, accompaniment: true, harmony: true, melody: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.5 }, { name: 'synth', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'organ_soft_jazz', weight: 0.5 }] },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }],
                        v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.5, max: 0.7 }, ride: { enabled: true, probability: 0.15 } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], presetModifiers: { octaveShift: 1 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.9 }, register: { preferred: 'mid' }, soloPlan: "S09" },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_MAIN_1', name: 'The Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Solo', duration: { percent: 25 },
                layers: { drums: true, bass: true, accompaniment: true, melody: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.5 }, { name: 'synth', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'organ_soft_jazz', weight: 0.5 }] },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }],
                        v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.6, max: 0.8 }, ride: { enabled: true, probability: 0.15 } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], presetModifiers: { octaveShift: 1 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.9 }, register: { preferred: 'high' }, soloPlan: "S10" },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_SOLO_1', name: 'The Cry', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'ride' } },
            },
            {
                id: 'MAIN-2', name: 'Final Verse', duration: { percent: 20 },
                layers: { drums: true, bass: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.5 }, { name: 'synth', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'organ_soft_jazz', weight: 0.5 }] },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }],
                        v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                           { name: 'piano', weight: 0.5 },
                           { name: 'guitarChords', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.2, max: 0.4 }, ride: { enabled: true, probability: 0.15 } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], presetModifiers: { octaveShift: 1 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.9 }, register: { preferred: 'mid' }, soloPlan: "S15" },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }] }
                },
                bundles: [{ id: 'WINTER_MAIN_2', name: 'The Last Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
