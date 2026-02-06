import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Bluest Blues" (v12.7 - Lottery Introduction).
 * #ЧТО: Реализация пошагового сценария вступления (3+3+3 такта).
 * #ИСПРАВЛЕНО (ПЛАН 172): Внедрена трехактная лотерея инструментов в INTRO_1.
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Bluest Blues (Lottery Intro)',
    description: 'A deep, cognitive blues journey with a staged probabilistic introduction.',
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
                id: 'INTRO_1', name: 'Midnight Opening', duration: { percent: 25 }, // ~36 bars
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    // СЦЕНА 1: Лотерея первых 3-х тактов (8% от 36 тактов ≈ 3 такта)
                    { 
                        duration: { percent: 8 }, 
                        instrumentation: {
                           bass: { activationChance: 0.6, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 0.6, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 0.6, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    },
                    // СЦЕНА 2: Вступление "опоздавших" + Мелодия (следующие 3 такта)
                    {
                        duration: { percent: 8 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           melody: { activationChance: 0.7, instrumentOptions: [ { name: 'telecaster', weight: 1.0 } ] }
                        }
                    },
                    // СЦЕНА 3: Пианино и Спарклы (следующие 3 такта)
                    {
                        duration: { percent: 8 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'telecaster', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 0.8, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.5, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true }
                        }
                    },
                    // СЦЕНА 4: Полный состав (оставшееся интро)
                    {
                        duration: { percent: 76 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'telecaster', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    accompaniment: { 
                        techniques: [
                            { value: 'long-chords', weight: 0.8 },
                            { value: 'arpeggio-slow', weight: 0.2 }
                        ], 
                        density: { min: 0.9, max: 1.0 },
                        register: { preferred: 'low' } 
                    },
                    melody: { 
                        source: 'blues_solo', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'low' } 
                    }
                },
                bundles: [{ id: 'SYNTHESIS_INTRO', name: 'Grounded Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'The Deepest Blue', duration: { percent: 50 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.8, max: 1.0 } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    melody: { 
                        source: 'blues_solo', 
                        density: { min: 0.8, max: 1.0 },
                        register: { preferred: 'low' } 
                    },
                    accompaniment: { 
                        techniques: [
                            { value: 'long-chords', weight: 0.7 },
                            { value: 'arpeggio-slow', weight: 0.3 }
                        ], 
                        density: { min: 0.9, max: 1.0 }
                    }
                },
                bundles: [{ id: 'SYNTHESIS_MAIN', name: 'The Soul Flow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Final Breath', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'telecaster', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 0.5, max: 0.7 } },
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 }, register: { preferred: 'low' } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'SYNTHESIS_OUTRO', name: 'Fading Synthesis', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
