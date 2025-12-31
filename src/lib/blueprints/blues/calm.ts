
import type { MusicBlueprint } from '@/types/music';

export const CalmBluesBlueprint: MusicBlueprint = {
    id: 'calm_blues',
    name: 'Laid-Back Shuffle',
    description: 'A slow, hypnotic, riff-based blues.',
    mood: 'calm',
    musical: {
        key: { root: 'G', scale: 'ionian', octave: 2 },
        bpm: { base: 98, range: [96, 108], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar structure
        tensionProfile: { type: 'plateau', peakPosition: 0.3, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'VERSE', name: 'Main Riff', duration: { percent: 75 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 }, useSnare: true, useGhostHat: false },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, // Conceptual technique for a repeating riff
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 } }
                },
                bundles: [{ id: 'BLUES_CALM_VERSE_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Solo', duration: { percent: 25 },
                layers: { bass: true, drums: true, melody: true },
                 instrumentation: {
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 } },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'high' }
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                },
                bundles: [{ id: 'BLUES_CALM_SOLO_BUNDLE', name: 'Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
