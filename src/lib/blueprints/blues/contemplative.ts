
import type { MusicBlueprint } from '@/types/music';

export const ContemplativeBluesBlueprint: MusicBlueprint = {
    id: 'contemplative_blues',
    name: 'Mid-Shuffle Chicago',
    description: 'A thoughtful, mid-tempo blues shuffle.',
    mood: 'contemplative',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // Will be driven by a 12-bar structure in the engine
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Verse 1', duration: { percent: 25 },
                layers: {
                    bass: true,
                    drums: true,
                    accompaniment: true,
                    harmony: true,
                    sparkles: true,
                    sfx: true,
                    melody: true // Мелодия включена с самого начала
                },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    melody: { // Правило для инструмента мелодии
                        strategy: 'weighted', 
                        v1Options: [{ name: 'electricGuitar', weight: 1.0 }], // Аналог для V1
                        v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] // Желаемый инструмент для V2
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, useSnare: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{value: 'choral', weight: 1.0}]},
                    melody: { 
                        source: 'motif',
                        density: { min: 0.2, max: 0.4 } // Умеренная плотность для вступления
                    },
                    sparkles: { 
                        eventProbability: 0.15,
                        categories: [
                            { name: 'electro', weight: 0.5 },
                            { name: 'ambient_common', weight: 0.5 }
                        ]
                    },
                    sfx: { 
                        eventProbability: 0.1, 
                        categories: [
                            { name: 'dark', weight: 0.5 }, 
                            { name: 'common', weight: 0.5 }
                        ] 
                    }
                },
                bundles: [{ id: 'BLUES_INTRO_BUNDLE', name: 'Verse 1', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Guitar Solo', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sparkles: true, sfx: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.6, max: 0.8 }, 
                        kickVolume: 1.1,
                        ride: {
                            enabled: true,
                            quietWindows: [
                                { start: 0.25, end: 0.65 }
                            ]
                        },
                        usePerc: true,
                    },
                    melody: { density: { min: 0.4, max: 0.6 }, source: 'motif' },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    sparkles: { eventProbability: 0.15, categories: [{ name: 'electro', weight: 0.5 }, { name: 'ambient_common', weight: 0.5 }] },
                    sfx: { 
                        eventProbability: 0.1, 
                        categories: [
                            { name: 'dark', weight: 0.5 }, 
                            { name: 'common', weight: 0.5 }
                        ] 
                    }
                },
                bundles: [{ id: 'BLUES_MAIN_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'OUTRO', name: 'Final Verse', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, sparkles: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{value: 'choral', weight: 1.0}]},
                    melody: { source: 'harmony_top_note' },
                    sparkles: { eventProbability: 0.15, categories: [{ name: 'electro', weight: 0.5 }, { name: 'ambient_common', weight: 0.5 }] },
                    sfx: { 
                        eventProbability: 0.1, 
                        categories: [
                            { name: 'dark', weight: 0.5 }, 
                            { name: 'common', weight: 0.5 }
                        ] 
                    }
                },
                bundles: [{ id: 'BLUES_OUTRO_BUNDLE', name: 'Last Verse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
