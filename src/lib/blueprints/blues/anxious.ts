
import type { MusicBlueprint } from '@/types/music';

export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Nervous Breakdown Shuffle',
    description: 'A fast, chaotic, and tense blues shuffle that builds from an empty start.',
    mood: 'anxious',
    musical: {
        key: { root: 'A', scale: 'mixolydian', octave: 3 },
        bpm: { base: 82, range: [80, 88], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar major
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 8) }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Nervous Accompaniment', duration: { percent: 15 },
                layers: { 
                    accompaniment: true, 
                    bass: false, 
                    drums: false, 
                    melody: false 
                },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 1.0 }], // Emerald Pad for V1
                        v2Options: [{ name: 'synth', weight: 1.0 }]  // Emerald Pad for V2
                    },
                },
                instrumentRules: {
                    accompaniment: { density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BLUES_ANX_INTRO_BUNDLE', name: 'Tension', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Frantic Riff', duration: { percent: 85 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.8, max: 1.0 }, 
                        useSnare: false, // OFF
                        kickVolume: 1.1,
                        usePerc: false, // OFF
                        ride: { enabled: false }
                    },
                    bass: { 
                        techniques: [{ value: 'boogie', weight: 1.0 }] // Use boogie for shuffle feel
                    },
                    melody: { source: 'motif', density: { min: 0.5, max: 0.8 } }
                },
                bundles: [{ id: 'BLUES_ANX_MAIN_BUNDLE', name: 'Main Frantic Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
