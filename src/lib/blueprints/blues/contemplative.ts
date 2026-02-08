
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Deep Contemplation" (Contemplative Blues v5.0).
 * #ЧТО: 1. Долгий 144-тактовый цикл с акцентом на "плато раздумий".
 *       2. Tension зафиксирован в зоне 0.52 - 0.58 для создания эффекта 
 *          тембрального мерцания между Акустикой и CS80.
 *       3. Пианино является центральным якорным инструментом.
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
            // #ЗАЧЕМ: Эффект "Задумчивости". 
            // #ЧТО: Напряжение быстро достигает 0.55 и остается стабильным до самого финала.
            curve: (p) => {
                if (p < 0.15) return 0.25 + (p / 0.15) * 0.30; // Прогрев: 0.25 -> 0.55
                if (p > 0.90) return 0.55 - ((p - 0.90) / 0.10) * 0.30; // Растворение
                return 0.55 + (Math.sin(p * Math.PI * 10) * 0.03); // Колыхание на плато
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'PROLOGUE', name: 'The Silent Thought', duration: { percent: 4 },
                layers: { sfx: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sfx: { activationChance: 0.7, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    pianoAccompaniment: { density: { min: 0.2, max: 0.4 } }
                },
                bundles: [{ id: 'CT_PROLOGUE', name: 'Silence', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_1', name: 'Gathering Focus', duration: { percent: 21 },
                layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 50 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 50 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.4, instrumentOptions: [ { name: 'ambient_common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'pedal', weight: 1.0 }], density: { min: 0.4, max: 0.6 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'CT_INTRO_BLOOM', name: 'Foundation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_FLOW', name: 'The Deep Flow', duration: { percent: 65 },
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
                           harmony: { activationChance: 0.6, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
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
                id: 'OUTRO', name: 'Dissolving Trace', duration: { percent: 10 },
                layers: { pianoAccompaniment: true, sfx: true, bass: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_ambient', weight: 1.0 } ] },
                           sfx: { activationChance: 0.8, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    pianoAccompaniment: { density: { min: 0.2, max: 0.3 } },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] }
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
