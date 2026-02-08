import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Nervous Flux" (Anxious Blues v7.0 - Ambient Alignment).
 * #ЧТО: 1. Tension Profile сглажен для сохранения фонового режима.
 *       2. Плотность инструментов значительно снижена для высоких темпов (80-100 BPM).
 *       3. Убраны резкие провалы.
 */
export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Nervous Ambient Shuffle',
    description: 'High-tempo but low-density blues. Focuses on jitter and syncopation over speed.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 90, range: [85, 100], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'wave', 
            peakPosition: 0.5, 
            // #ЗАЧЕМ: Сглаженная волна без резких провалов.
            curve: (p, pp) => {
                return 0.6 + 0.2 * Math.sin(p * Math.PI * 2);
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            // ========================================================================
            // 0. PROLOGUE (4 такта / 3%) — Алгоритмический вход
            // ========================================================================
            {
                id: 'PROLOGUE', name: 'The Glitch', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           sfx: { activationChance: 0.4, instrumentOptions: [ { name: 'laser', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-slow', weight: 1.0 }], register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'ANX_PROLOGUE', name: 'Glitch Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            // ========================================================================
            // 1. THE_FLUX (97%) — Persistent Nervousness
            // ========================================================================
            {
                id: 'THE_FLUX', name: 'Nervous Ensemble', duration: { percent: 97 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 25 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 50 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] },
                           sfx: { activationChance: 0.3, instrumentOptions: [ { name: 'laser', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    // #ЗАЧЕМ: Снижение плотности для высокого BPM.
                    melody: { source: 'blues_solo', density: { min: 0.3, max: 0.5 } },
                    drums: { kitName: 'trance_melancholic', density: { min: 0.4, max: 0.6 }, useSnare: true },
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }], density: { min: 0.5, max: 0.7 } }
                },
                bundles: [{ id: 'ANX_MAIN_BUNDLE', name: 'The Flux', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
