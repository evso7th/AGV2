
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Nervous Shuffle" (Anxious Blues v2.2 - Stability Fix).
 * #ЧТО: Сцены сделаны более плотными и кумулятивными. Барабанщик вступает раньше (25%).
 * #СВЯЗИ: Динамически управляется BluesBrain.
 */
export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Nervous Breakdown Shuffle',
    description: 'A jittery, unstable blues in E Phrygian. Features Rhodes and staged accumulation.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 88, range: [84, 96], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'wave', 
            peakPosition: 0.5, 
            curve: (p, pp) => 0.5 + 0.4 * Math.sin(p * Math.PI * 6) // Jittery waves
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'THE_BREAKDOWN', name: 'System Degeneration', duration: { percent: 100 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    // Сцена 1: Rhodes + Пад + Пианино (0-25%). Начальная тревога.
                    { 
                        duration: { percent: 25 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    },
                    // Сцена 2: Вход Баса и Барабанов (25-50%). Появление пульса.
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] }
                        }
                    },
                    // Сцена 3: Вход Гитариста (50-75%). Нагнетание.
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
                        }
                    },
                    // Сцена 4: Полный хаос (75-100%).
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.4, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true },
                           sfx: { activationChance: 0.15, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'syncopated', weight: 1.0 }], density: { min: 0.4, max: 0.6 } },
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }], density: { min: 0.6, max: 0.9 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.9 } },
                    drums: { kitName: 'trance_melancholic', density: { min: 0.5, max: 0.8 }, useSnare: true }
                },
                bundles: [ { id: 'ANXIOUS_CYCLE', name: 'Nervous Loop', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
