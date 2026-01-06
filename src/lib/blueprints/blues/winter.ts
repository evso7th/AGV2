
import type { MusicBlueprint } from '@/types/music';

export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'Winter Blues (Sterile)',
    description: 'A sterile, minimal blues blueprint for debugging. It only uses bass, melody, and accompaniment synthesizers, with all sample-based layers disabled.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'aeolian', octave: 2 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // Uses 12-bar blues structure
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'MAIN', name: 'Main Section', duration: { percent: 100 },
                layers: {
                    // CRITICAL: All sample-based layers are explicitly disabled.
                    drums: false,
                    harmony: false,
                    sfx: false,
                    sparkles: false,
                    // Only synth-based layers are active.
                    bass: true,
                    accompaniment: true,
                    melody: true,
                },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'electricGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'none' }, // Explicitly none
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { source: 'motif', density: { min: 0.4, max: 0.6 } }
                },
                bundles: [{ id: 'WINTER_BLUES_MAIN_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
