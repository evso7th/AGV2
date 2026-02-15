import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Ступень Йоги 2 — ENTHUSIASTIC: «Восхождение».
 * #ЧТО: Парящий Lydian амбиент. Модель Jean-Michel Jarre.
 * #ОБНОВЛЕНО (ПЛАН №432): Внедрена лотерея интро и поддержка светового атласа.
 */
export const EnthusiasticAmbientBlueprint: MusicBlueprint = {
    id: 'enthusiastic_ambient',
    name: 'Vibrations of Flow',
    description: 'Stage 2: Ascension. Evolving Lydian textures inspired by Jean-Michel Jarre.',
    mood: 'enthusiastic',
    musical: {
        key: { root: 'E', scale: 'lydian', octave: 3 },
        bpm: { base: 68, range: [66, 72], modifier: 1.2 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.8, curve: (p, pp) => Math.pow(p, 1.5) }
    },
    structure: {
        totalDuration: { preferredBars: 170 },
        parts: [
            {
                id: 'INTRO', name: 'IgnitionLottery', duration: { percent: 12 },
                layers: { accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true, bass: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth', weight: 1.0 }] },
                            bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_trance', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            drums: { activationChance: 1.0, instrumentOptions: [{ name: 'intro', weight: 1.0 }] },
                            melody: { activationChance: 1.0, instrumentOptions: [{ name: 'theremin', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
                            sfx: { activationChance: 0.7, instrumentOptions: [{ name: 'laser', weight: 1.0 }], transient: true }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'violin', weight: 1.0 }] },
                            sparkles: { activationChance: 0.6, instrumentOptions: [{ name: 'light', weight: 1.0 }] }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }], density: { min: 0.6, max: 0.8 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ENT_INTRO_1', name: 'Spark', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'The Light Stream', duration: { percent: 75 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 0.5 }, { name: 'theremin', weight: 0.5 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }], density: { min: 0.7, max: 0.9 } },
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 } },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'ENT_MAIN_1', name: 'The Flow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Afterglow', duration: { percent: 13 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                bundles: [{ id: 'ENT_OUTRO_1', name: 'Fading Flow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
