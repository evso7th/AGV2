import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Inner Dialogue" (Contemplative Blues v7.0).
 * #ЧТО: 1. Пролог (5%) — ленивое пианино, гитарные аккорды, искры и атмосфера.
 *       2. Объединенное вступление (8%) — рождение ансамбля за один квадрат (12 тактов).
 *       3. Плато раздумий (79%) — стабильная энергия 0.55 (мерцающий тембр).
 *       4. Компактное аутро (8%) — ровно один квадрат (12 тактов) для растворения.
 */
export const ContemplativeBluesBlueprint: MusicBlueprint = {
    id: 'contemplative_blues',
    name: 'The Inner Dialogue',
    description: 'A thoughtful, introspective blues in D Dorian. Focus on space, piano echoes and subtle guitar textures.',
    mood: 'contemplative',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 1 },
        bpm: { base: 78, range: [75, 82], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'plateau', 
            peakPosition: 0.5, 
            curve: (p) => {
                if (p < 0.15) return 0.25 + (p / 0.15) * 0.30; // Прогрев: 0.25 -> 0.55
                if (p > 0.92) return 0.55 - ((p - 0.92) / 0.08) * 0.45; // Растворение (последний квадрат)
                return 0.55 + (Math.sin(p * Math.PI * 10) * 0.03); // Колыхание на плато
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'PROLOGUE', name: 'Lazy Thoughts', duration: { percent: 5 },
                layers: { sfx: true, sparkles: true, pianoAccompaniment: true, harmony: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.8, instrumentOptions: [ { name: 'ambient_common', weight: 0.6 }, { name: 'light', weight: 0.4 } ], transient: true },
                           sfx: { activationChance: 0.6, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    pianoAccompaniment: { density: { min: 0.15, max: 0.3 } },
                    harmony: { techniques: [{ value: 'swell', weight: 1.0 }] }
                },
                bundles: [{ id: 'CT_PROLOGUE', name: 'Laziness', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_COMBINED', name: 'The Ensemble Birth', duration: { percent: 8 }, // ~12 bars (1 square)
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sfx: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 } },
                    bass: { techniques: [{ value: 'pedal', weight: 1.0 }], density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'blues_solo', style: 'fingerstyle' }
                },
                bundles: [{ id: 'CT_BIRTH', name: 'Square One', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_REFLECTION', name: 'The Inner Dialogue', duration: { percent: 79 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.6 }, { name: 'flute', weight: 0.4 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { kitName: 'blues_melancholic_master', density: { min: 0.4, max: 0.6 }, useSnare: true, usePerc: true },
                    melody: { source: 'blues_solo', density: { min: 0.3, max: 0.5 }, register: { preferred: 'low' } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] }
                },
                bundles: [{ id: 'CT_MAIN_REFLECT', name: 'Thought Cycle', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Dissolving Trace', duration: { percent: 8 }, // Ровно 1 квадрат (12 тактов)
                layers: { pianoAccompaniment: true, sfx: true, bass: true, harmony: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_ambient', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] },
                           sfx: { activationChance: 0.8, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    pianoAccompaniment: { density: { min: 0.2, max: 0.3 } },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    harmony: { techniques: [{ value: 'swell', weight: 1.0 }] }
                },
                bundles: [{ id: 'CT_OUTRO', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
