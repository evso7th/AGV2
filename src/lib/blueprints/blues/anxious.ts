
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
                // Layers are now controlled per bundle
                layers: {
                    accompaniment: true,
                    bass: true,
                    drums: true,
                    melody: true, // Melody layer is used for the guitar double
                    harmony: false,
                    sfx: false,
                    sparkles: false,
                },
                instrumentation: {
                    // Default for the intro part
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 1.0 }], // Emerald Pad
                        v2Options: [{ name: 'synth', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                     // Rules here can be placeholders if bundles override them
                    drums: { pattern: 'composer', density: {min: 0.0, max: 0.0}, useSnare: false, usePerc: false, kickVolume: 1.1, ride: { enabled: false }, useGhostHat: false },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                // Split the intro into two distinct phases using bundles
                bundles: [
                    { 
                        id: 'BLUES_ANX_INTRO_BUNDLE_1', name: 'Pad Only', duration: { percent: 50 }, 
                        // In this bundle, ONLY accompaniment plays
                        characteristics: { activeLayers: ['accompaniment'] },
                        phrases: {}
                    },
                    { 
                        id: 'BLUES_ANX_INTRO_BUNDLE_2', name: 'Unison Riff', duration: { percent: 50 },
                        // In this bundle, bass, drums, and the melody (guitar double) enter
                        characteristics: { 
                            activeLayers: ['bass', 'drums', 'melody'],
                            bassAccompanimentDouble: { 
                                enabled: true, 
                                instrument: 'electricGuitar', // This is our "Muff Lead" sound
                                octaveShift: 2
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
                id: 'MAIN', name: 'Frantic Solo', duration: { percent: 85 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.8, max: 1.0 }, 
                        useSnare: true,
                        kickVolume: 1.1,
                        usePerc: true,
                        ride: { enabled: true },
                        useGhostHat: true
                    },
                    bass: { 
                        techniques: [{ value: 'boogie', weight: 1.0 }]
                    },
                    melody: { source: 'motif', density: { min: 0.5, max: 0.8 } }
                },
                bundles: [{ id: 'BLUES_ANX_MAIN_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
