
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Double-Peak Anxiety" (Anxious Blues v3.0).
 * #ЧТО: 1. Сокращенные Intro/Outro (по 12 тактов).
 *       2. Разделение на два Main-блока с коротким "пустым" Bridge между ними.
 *       3. Гарантированный полный состав в Main-секциях.
 * #СВЯЗИ: Управляется BluesBrain и Navigator.
 */
export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Double-Peak Nervous Shuffle',
    description: 'A high-tension blues structure with rapid build-up and a dramatic breakdown in the middle.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 88, range: [84, 96], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'wave', 
            peakPosition: 0.5, 
            curve: (p, pp) => {
                // Двойная волна: один пик на 30%, второй на 80%
                return 0.5 + 0.4 * Math.sin(p * Math.PI * 4);
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            // ========================================================================
            // 1. INTRO (12 тактов / 8%) — Быстрый запуск
            // ========================================================================
            {
                id: 'INTRO', name: 'Sudden Unease', duration: { percent: 8 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 50 }, // Первые 6 тактов
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] }
                        }
                    },
                    { 
                        duration: { percent: 50 }, // Следующие 6 тактов
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { kitName: 'trance_melancholic', density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'ANX_FAST_START', name: 'Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            // ========================================================================
            // 2. MAIN 1 (40%) — Первая атака
            // ========================================================================
            {
                id: 'MAIN_1', name: 'First Panic', duration: { percent: 40 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    melody: { source: 'blues_solo', density: { min: 0.6, max: 0.8 } },
                    drums: { kitName: 'trance_melancholic', density: { min: 0.6, max: 0.8 }, useSnare: true }
                },
                bundles: [{ id: 'ANX_PEAK_1', name: 'Attack 1', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'sfx' } },
            },
            // ========================================================================
            // 3. BRIDGE (4%) — Ложная разрядка (Вздох)
            // ========================================================================
            {
                id: 'BRIDGE', name: 'The Void', duration: { percent: 4 }, // ~6 тактов
                layers: { bass: true, accompaniment: true, sfx: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sfx: { activationChance: 0.8, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }], register: { preferred: 'low' } }
                },
                bundles: [{ id: 'ANX_BREATH', name: 'Breather', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            // ========================================================================
            // 4. MAIN 2 (40%) — Финальная Тревога
            // ========================================================================
            {
                id: 'MAIN_2', name: 'Final Meltdown', duration: { percent: 40 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'flute', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.6, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    melody: { source: 'blues_solo', register: { preferred: 'high' }, density: { min: 0.8, max: 1.0 } },
                    drums: { kitName: 'trance_melancholic', density: { min: 0.8, max: 1.0 }, kickVolume: 1.2 }
                },
                bundles: [{ id: 'ANX_PEAK_2', name: 'Attack 2', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            // ========================================================================
            // 5. OUTRO (8%) — Быстрое исчезновение
            // ========================================================================
            {
                id: 'OUTRO', name: 'Exhaustion', duration: { percent: 8 },
                layers: { bass: true, accompaniment: true, sfx: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    }
                ],
                bundles: [{ id: 'ANX_EXIT', name: 'Final Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
