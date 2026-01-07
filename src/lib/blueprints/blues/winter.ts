
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
                id: 'INTRO',
                name: 'Intro',
                duration: { percent: 20 },
                layers: {
                    drums: false, harmony: false, sfx: false, sparkles: false,
                    bass: true, accompaniment: true, melody: true,
                },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'none' },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { source: 'motif', density: { min: 0, max: 0 } }, // Melody is silent but instrument is set
                },
                bundles: [{ id: 'WINTER_BLUES_INTRO_BUNDLE', name: 'Foundation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_THEME',
                name: 'Main Theme',
                duration: { percent: 25 },
                layers: {
                    drums: false, harmony: false, sfx: false, sparkles: false,
                    bass: true, accompaniment: true, melody: true,
                },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 1.0 }],
                        v2Options: [{ name: 'telecaster', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'none' },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.4, max: 0.6 },
                        register: { preferred: 'mid' }
                    }
                },
                bundles: [{ id: 'WINTER_BLUES_THEME_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO',
                name: 'Guitar Solo',
                duration: { percent: 30 }, // 36 bars
                layers: {
                    drums: false, harmony: false, sfx: false, sparkles: false,
                    bass: true, accompaniment: true, melody: true,
                },
                 instrumentation: {
                     accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'telecaster', weight: 1.0 }],
                        v2Options: [{ name: 'telecaster', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'none' },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.7, max: 0.9 }, // Higher density for solo
                        register: { preferred: 'high' } // Higher register for solo
                    }
                },
                bundles: [{ id: 'WINTER_BLUES_SOLO_BUNDLE', name: 'Improvisation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO',
                name: 'Outro',
                duration: { percent: 25 },
                layers: {
                    drums: false, harmony: false, sfx: false, sparkles: false,
                    bass: true, accompaniment: true, melody: true,
                },
                 instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'none' },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.3, max: 0.5 }, // Return to main theme density
                        register: { preferred: 'mid' }
                    }
                },
                bundles: [{ id: 'WINTER_BLUES_OUTRO_BUNDLE', name: 'Fade Out', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
