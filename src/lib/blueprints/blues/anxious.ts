
import type { MusicBlueprint } from '@/types/music';

export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Nervous Breakdown Shuffle',
    description: 'A fast, chaotic, and tense blues shuffle that builds from an empty start.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'ionian', octave: 2 },
        bpm: { base: 82, range: [80, 88], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar major
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 8) }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Nervous Build-up', duration: { percent: 15 },
                layers: {
                    accompaniment: true,
                    bass: true,
                    drums: true,
                    melody: true,
                    harmony: false,
                    sfx: false,
                    sparkles: false,
                },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 1.0 }],
                        v2Options: [{ name: 'synth', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: {min: 0.0, max: 0.0}, useSnare: false, usePerc: false, kickVolume: 1.1, ride: { enabled: false }, useGhostHat: false },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [
                    { 
                        id: 'BLUES_ANX_INTRO_BUNDLE_1', name: 'Pad Only', duration: { percent: 50 }, 
                        characteristics: { activeLayers: ['accompaniment'] },
                        phrases: {}
                    },
                    { 
                        id: 'BLUES_ANX_INTRO_BUNDLE_2', name: 'Unison Riff', duration: { percent: 50 },
                        characteristics: { 
                            activeLayers: ['bass', 'drums', 'melody'],
                            bassAccompanimentDouble: { 
                                enabled: true, 
                                instrument: 'electricGuitar',
                                octaveShift: 1
                            },
                             instrumentRules: {
                                drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, useSnare: true, usePerc: true, useGhostHat: true, kickVolume: 1.0, fills: { onBundleBoundary: true } },
                                bass: { techniques: [{ value: 'boogie', weight: 1.0 }] }
                            }
                        },
                        phrases: {},
                        outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', density: 0.6 } }
                    }
                ],
                outroFill: null,
            },
            {
                id: 'MAIN_A', name: 'Main Riff', duration: { percent: 35 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.8, max: 1.0 }, 
                        useSnare: true, kickVolume: 1.1, usePerc: true, ride: { enabled: true }, useGhostHat: true
                    },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] },
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 },
                },
                bundles: [{ id: 'BLUES_ANX_MAIN_A_BUNDLE', name: 'Main Riff A', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', density: 0.7 } },
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 30 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.85, max: 1.0 }, 
                        useSnare: true, kickVolume: 1.2, usePerc: true, ride: { enabled: true }, useGhostHat: true
                    },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] },
                    bassAccompanimentDouble: { enabled: false, instrument: 'electricGuitar', octaveShift: 1 },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.7, max: 0.9 },
                        register: { preferred: 'high' } 
                    }
                },
                bundles: [{ id: 'BLUES_ANX_SOLO_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'crash', density: 0.5 } },
            },
            {
                id: 'MAIN_B', name: 'Return to Riff', duration: { percent: 20 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.8, max: 1.0 }, 
                        useSnare: true, kickVolume: 1.1, usePerc: true, ride: { enabled: true }, useGhostHat: true
                    },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] },
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 },
                },
                bundles: [{ id: 'BLUES_ANX_MAIN_B_BUNDLE', name: 'Main Riff B', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
