
import type { MusicBlueprint } from '@/types/music';

// This is a new blueprint file.
export const GloomyBluesBlueprint: MusicBlueprint = {
    id: 'gloomy_blues',
    name: 'Swamp Electric',
    description: 'A slow, gritty, and atmospheric blues with a swampy feel.',
    mood: 'gloomy',
    musical: {
        key: { root: 'E', scale: 'aeolian', octave: 2 },
        bpm: { base: 68, range: [66, 74], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // Uses 8 or 12-bar blues
        tensionProfile: { type: 'plateau', peakPosition: 0.4, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 },
        parts: [
            {
                id: 'MAIN_RIFF', name: 'Main Riff', duration: { percent: 60 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: false, useGhostHat: true },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: {
                        source: 'motif',
                        density: { min: 0.3, max: 0.5 },
                        register: { preferred: 'low' },
                        presetModifiers: { octaveShift: 0 } // Use base, lower octave
                    }
                },
                bundles: [{ id: 'GLOOMY_BLUES_MAIN_BUNDLE', name: 'Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BREAKDOWN', name: 'Breakdown', duration: { percent: 40 },
                layers: { bass: true, drums: true, melody: true, sfx: true },
                 instrumentation: {
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, useGhostHat: false, usePerc: true, rareKick: true },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.5, max: 0.7 },
                        register: { preferred: 'low' },
                        presetModifiers: { octaveShift: 0 } // Use base, lower octave
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                },
                bundles: [{ id: 'GLOOMY_BLUES_BREAK_BUNDLE', name: 'Slide Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
