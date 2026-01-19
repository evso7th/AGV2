
import type { MusicBlueprint } from '@/types/music';

export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Nervous Breakdown Shuffle',
    description: 'A fast, chaotic, and tense blues shuffle that builds from an empty start.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'aeolian', octave: 2 },
        bpm: { base: 66, range: [64, 72], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar minor
        tensionProfile: { type: 'crescendo', peakPosition: 0.7, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Nervous Build-up', duration: { percent: 15 },
                introRules: {
                    instrumentPool: ['accompaniment', 'bass', 'drums'],
                    stages: 3
                },
                layers: {
                    accompaniment: true,
                    bass: true,
                    drums: true
                },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'synth_cave_pad', weight: 1.0 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                   accompaniment: { register: { preferred: 'low' }, density: { min: 0.1, max: 0.3 } },
                   melody: { source: 'harmony_top_note' }
                },
                bundles: [
                    {
                        id: 'BLUES_ANX_INTRO_BUNDLE_1', name: 'Cave Pad Drone', duration: { percent: 100 },
                        characteristics: { },
                        phrases: {}
                    },
                ],
                outroFill: null,
            },
            {
                id: 'MAIN_A', name: 'Frantic Riff', duration: { percent: 35 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_cave_pad', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_muffLead', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: {
                        pattern: 'composer',
                        density: { min: 0.7, max: 0.9 },
                        useSnare: true, kickVolume: 1.1, usePerc: true, ride: { enabled: true }, useGhostHat: true
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    accompaniment: { register: { preferred: 'low' }, density: { min: 0.2, max: 0.4 } },
                    melody: {
                        source: 'motif',
                        density: { min: 0.4, max: 0.6 }
                    },
                    sparkles: { eventProbability: 0.2, categories: [{ name: 'dark', weight: 0.8 }, { name: 'electro', weight: 0.2 }] }
                },
                bundles: [{ id: 'BLUES_ANX_MAIN_A_BUNDLE', name: 'Main Riff A', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', density: 0.7 } },
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 30 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_cave_pad', weight: 0.6 }, { name: 'organ', weight: 0.4 }], v2Options: [{ name: 'synth_cave_pad', weight: 0.6 }, { name: 'organ', weight: 0.4 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'guitar_muffLead', weight: 1.0 }], 
                        v2Options: [
                            { name: 'guitar_muffLead', weight: 0.5 },
                            { name: 'guitar_shineOn', weight: 0.5 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: {
                        pattern: 'composer',
                        density: { min: 0.85, max: 1.0 },
                        useSnare: true, kickVolume: 1.2, usePerc: true, ride: { enabled: true }, useGhostHat: true
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.7, max: 0.9 },
                        register: { preferred: 'high' },
                        soloPlan: 'S06'
                    },
                     accompaniment: { register: { preferred: 'low' }, density: { min: 0.2, max: 0.4 } },
                     sparkles: { eventProbability: 0.25, categories: [{ name: 'dark', weight: 1.0 }] }
                },
                bundles: [{ id: 'BLUES_ANX_SOLO_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'crash', density: 0.5 } },
            },
            {
                id: 'OUTRO', name: 'Relaxed Fade Out', duration: { percent: 20 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'acousticGuitar', weight: 0.5 }, {name: 'electricGuitar', weight: 0.5}], v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: true },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], density: {min: 0.2, max: 0.4} },
                    melody: { source: 'motif', density: { min: 0.1, max: 0.3 }, register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_ANX_OUTRO_BUNDLE', name: 'Relaxed Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
