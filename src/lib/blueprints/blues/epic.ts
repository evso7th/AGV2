
import type { MusicBlueprint } from '@/types/music';

export const EpicBluesBlueprint: MusicBlueprint = {
    id: 'epic_blues',
    name: 'Monumental Sorrow',
    description: 'A slow, powerful, and majestic minor-key blues epic.',
    mood: 'epic',
    musical: {
        key: { root: 'G', scale: 'aeolian', octave: 2 },
        bpm: { base: 70, range: [68, 74], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar minor structure
        tensionProfile: { type: 'crescendo', peakPosition: 0.8, curve: (p, pp) => Math.pow(p, 1.5) }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'VERSE', name: 'Main Theme', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, useSnare: true, useGhostHat: false },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] }, // UNIQUE TECHNIQUE
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 }, register: { preferred: 'high' } }
                },
                bundles: [{ id: 'BLUES_EPIC_VERSE_BUNDLE', name: 'Main Theme', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.2 },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.9 },
                        register: { preferred: 'high' }
                    },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                },
                bundles: [{ id: 'BLUES_EPIC_SOLO_BUNDLE', name: 'Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
