
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Ritual" (Dark Blues v2.0).
 * #ЧТО: Реализует 4-этапный ритуал накопления в E Phrygian.
 *       Инструменты вступают парами и мутируют по Закон Динамического Тембра.
 * #СВЯЗИ: Управляется BluesBrain в режиме реального времени.
 */
export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Ritual of Morphing Textures',
    description: 'A heavy, ritualistic blues in E Phrygian. Instruments morph their timbre based on tension.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 62, range: [60, 66], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'arc', 
            peakPosition: 0.6, 
            curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.4) : 1 - Math.pow((p - pp) / (1 - pp)) 
        }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'THE_RITUAL', name: 'The Accumulation', duration: { percent: 100 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    // ЭТАП 1: Одинокий Орган (0-25%).
                    { 
                        duration: { percent: 25 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    },
                    // ЭТАП 2: Вход Глубокого Баса (25-50%).
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           bass: { activationChance: 0.8, instrumentOptions: [ { name: 'bass_dub', weight: 1.0 } ] }
                        }
                    },
                    // ЭТАП 3: Вход Гитариста (50-75%).
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_dub', weight: 1.0 } ] },
                           melody: { activationChance: 0.9, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           drums: { activationChance: 0.7, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] }
                        }
                    },
                    // ЭТАП 4: Полномасштабный Ритуал (75-100%).
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_dub', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.2, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true },
                           sfx: { activationChance: 0.1, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.3, max: 0.5 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.5, max: 0.8 } },
                    melody: { source: 'blues_solo', density: { min: 0.4, max: 0.8 } }, // NO soloPlan, purely NFM thinking
                    drums: { kitName: 'blues_melancholic_master', density: { min: 0.4, max: 0.6 }, usePerc: true }
                },
                bundles: [ { id: 'DARK_RITUAL_BUNDLE', name: 'The Cycle', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
