import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Ступень Йоги 1 — EPIC: «Зов и Подготовка».
 * #ЧТО: Величественный Mixolydian амбиент. Модель Vangelis.
 * #ОБНОВЛЕНО (ПЛАН №432): Внедрена лотерея интро и поддержка светового атласа.
 */
export const EpicAmbientBlueprint: MusicBlueprint = {
    id: 'epic_ambient',
    name: 'The Pillars of Space',
    description: 'Stage 1: Preparation. Majestic Mixolydian soundscapes inspired by Vangelis.',
    mood: 'epic',
    musical: {
        key: { root: 'D', scale: 'mixolydian', octave: 2 },
        bpm: { base: 62, range: [60, 65], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
            type: 'arc',
            peakPosition: 0.7,
            curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.8) : 1 - Math.pow((p - pp) / (1 - pp), 1.2)
        }
    },
    structure: {
        totalDuration: { preferredBars: 180 },
        parts: [
            {
                id: 'INTRO', name: 'PreparationLottery', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true, bass: true, drums: true, harmony: true, pianoAccompaniment: true, melody: true, sparkles: true },
                stagedInstrumentation: [
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                            bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            drums: { activationChance: 1.0, instrumentOptions: [{ name: 'intro', weight: 1.0 }] },
                            harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'violin', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
                            sfx: { activationChance: 0.6, instrumentOptions: [{ name: 'common', weight: 1.0 }], transient: true }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            melody: { activationChance: 1.0, instrumentOptions: [{ name: 'organ', weight: 1.0 }] },
                            sparkles: { activationChance: 0.3, instrumentOptions: [{ name: 'light', weight: 1.0 }] }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { register: { preferred: 'low' }, density: { min: 0.3, max: 0.5 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'EPIC_INTRO_1', name: 'Preparation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            },
            {
                id: 'MAIN', name: 'The Great Atlas', duration: { percent: 75 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ', weight: 0.7 }, { name: 'synth_ambient_pad_lush', weight: 0.3 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'mellotron', weight: 0.6 }, { name: 'synth', weight: 0.4 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.3, max: 0.5 }, source: 'harmony_top_note' },
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: false, usePerc: true }
                },
                bundles: [{ id: 'EPIC_MAIN_1', name: 'Vista', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            },
            {
                id: 'OUTRO', name: 'The Echoes', duration: { percent: 10 },
                layers: { accompaniment: true, sfx: true, sparkles: true },
                bundles: [{ id: 'EPIC_OUTRO_1', name: 'Fading Space', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
