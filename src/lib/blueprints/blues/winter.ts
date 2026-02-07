
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Bluest Blues" (v14.0 - Main Theme Focus).
 * #ЧТО: Радикально сокращенное интро с мгновенным встулением ритм-секции и гармонии.
 *       Гитара вступает на 2-м такте. Флейта и пианино на 4-м.
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Bluest Blues (Singing Guitar)',
    description: 'A deep, cognitive blues journey with a delayed guitar entry and continuous legato phrasing.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 },
        bpm: { base: 72, range: [68, 78], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'arc', 
            peakPosition: 0.7, 
            curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.2) : 1 - Math.pow((p - pp) / (1 - pp), 1.5) 
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO_1', name: 'Rapid Opening', duration: { percent: 25 }, 
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true, sparkles: true },
                stagedInstrumentation: [
                    // СЦЕНА 1: Фундамент (Такты 0-1).
                    { 
                        duration: { percent: 1 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
                        }
                    },
                    // СЦЕНА 2: Вход Гилмора (Такты 2-3).
                    {
                        duration: { percent: 1 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'guitar_shineOn', weight: 1.0 } ] }
                        }
                    },
                    // СЦЕНА 3: Детализация (Такты 4-5).
                    {
                        duration: { percent: 1 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.5 }, { name: 'flute', weight: 0.5 } ] },
                           sparkles: { activationChance: 0.8, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true }
                        }
                    },
                    // СЦЕНА 4: Полный Глубокий Состав (Такты 6+).
                    {
                        duration: { percent: 97 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'guitar_shineOn', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.6 }, { name: 'flute', weight: 0.4 } ] },
                           sparkles: { activationChance: 0.3, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    accompaniment: { 
                        techniques: [{ value: 'long-chords', weight: 1.0 }], 
                        density: { min: 0.9, max: 1.0 }
                    },
                    melody: { 
                        source: 'blues_solo', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'low' } 
                    }
                },
                bundles: [{ id: 'FAST_INTRO', name: 'Rapid Buildup', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'The Soul Flow', duration: { percent: 50 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'guitar_shineOn', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.6 }, { name: 'flute', weight: 0.4 } ] },
                           sparkles: { activationChance: 0.25, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.8, max: 1.0 } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    melody: { source: 'blues_solo', density: { min: 0.8, max: 1.0 } }
                },
                bundles: [{ id: 'MAIN_FLOW', name: 'Harmonic Ocean', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Final Breath', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'guitar_shineOn', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.15, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'DISSOLUTION', name: 'Fade Away', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
