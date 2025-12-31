
import type { MusicBlueprint } from '@/types/music';

export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Nervous Breakdown Shuffle',
    description: 'A fast, chaotic, and tense blues shuffle.',
    mood: 'anxious',
    musical: {
        key: { root: 'A', scale: 'mixolydian', octave: 3 },
        bpm: { base: 150, range: [148, 154], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar major
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 8) }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'MAIN', name: 'Main Frantic Riff', duration: { percent: 100 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 }, useSnare: true, useGhostHat: true, kickVolume: 1.1 },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] }, // Fast, driving boogie
                    melody: { source: 'motif', density: { min: 0.5, max: 0.8 } } // Short, nervous phrases
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
