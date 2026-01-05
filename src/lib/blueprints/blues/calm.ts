
import type { MusicBlueprint } from '@/types/music';

export const CalmBluesBlueprint: MusicBlueprint = {
    id: 'calm_blues',
    name: 'Laid-Back Shuffle',
    description: 'A slow, hypnotic, riff-based blues.',
    mood: 'calm',
    musical: {
        key: { root: 'G', scale: 'ionian', octave: 2 },
        bpm: { base: 68, range: [64, 72], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar structure
        tensionProfile: { type: 'plateau', peakPosition: 0.3, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Main Riff', duration: { percent: 40 },
                introRules: {
                    allowedInstruments: ['drums', 'bass', 'accompaniment'],
                    buildUpSpeed: 0.3
                },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 }, useSnare: false, useGhostHat: true, ride: { enabled: false } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 }, register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_CALM_VERSE_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Solo', duration: { percent: 35 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true },
                 instrumentation: {
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, ride: { enabled: true }, useGhostHat: true, useSnare: false },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'mid' }
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                },
                bundles: [{ id: 'BLUES_CALM_SOLO_BUNDLE', name: 'Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
             {
                id: 'OUTRO', name: 'Return to Riff', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 }, useSnare: false, useGhostHat: true, ride: { enabled: false } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 }, register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_CALM_OUTRO_BUNDLE', name: 'Final Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
