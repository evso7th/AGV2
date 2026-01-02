
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
                    melody: true
                },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'electricGuitar', weight: 1.0 }],
                        v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, useSnare: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{value: 'long-chords', weight: 1.0}]},
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 },
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
                    },
                    melody: { register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_INTRO_BUNDLE', name: 'Verse 1', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_A', name: 'Main Riff', duration: { percent: 20 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sparkles: true, sfx: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 1.1, ride: { enabled: false }, usePerc: true, },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{value: 'long-chords', weight: 1.0}]},
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 },
                    sparkles: { eventProbability: 0.15, categories: [{ name: 'electro', weight: 0.5 }, { name: 'ambient_common', weight: 0.5 }] },
                    sfx: { eventProbability: 0.1, categories: [{ name: 'dark', weight: 0.5 }, { name: 'common', weight: 0.5 }] },
                    melody: { register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_MAIN_A_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 20 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sparkles: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.2, ride: { enabled: true }, usePerc: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] },
                    bassAccompanimentDouble: { enabled: false, instrument: 'electricGuitar', octaveShift: 1 }, // Отключаем дублирование
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'mid' } // Повышаем регистр для соло
                    },
                    sparkles: { eventProbability: 0.2, categories: [{ name: 'electro', weight: 0.8 }, { name: 'ambient_common', weight: 0.2 }] },
                    sfx: { eventProbability: 0.15, categories: [{ name: 'dark', weight: 0.2 }, { name: 'common', weight: 0.8 }] }
                },
                bundles: [{ id: 'BLUES_SOLO_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'MAIN_B', name: 'Return to Riff', duration: { percent: 10 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sparkles: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 1.1, ride: { enabled: false }, usePerc: true, },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{value: 'long-chords', weight: 1.0}]},
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 }, // Возвращаем рифф
                    sparkles: { eventProbability: 0.15, categories: [{ name: 'electro', weight: 0.5 }, { name: 'ambient_common', weight: 0.5 }] },
                    sfx: { eventProbability: 0.1, categories: [{ name: 'dark', weight: 0.5 }, { name: 'common', weight: 0.5 }] },
                    melody: { register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_MAIN_B_BUNDLE', name: 'Riff Return', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Final Verse', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, sparkles: true, sfx: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 }, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{value: 'long-chords', weight: 1.0}]},
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 },
                    sparkles: { eventProbability: 0.15, categories: [{ name: 'electro', weight: 0.5 }, { name: 'ambient_common', weight: 0.5 }] },
                    sfx: { 
                        eventProbability: 0.1, 
                        categories: [
                            { name: 'dark', weight: 0.5 }, 
                            { name: 'common', weight: 0.5 }
                        ] 
                    },
                    melody: { register: { preferred: 'mid' } }
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
