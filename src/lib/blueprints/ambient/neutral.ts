import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Contemplative Atlas" (Neutral Ambient v13.0).
 * #ЧТО: 1. Лотерея интро.
 *       2. Маршрут из 3-х географических локаций.
 */
export const NeutralAmbientBlueprint: MusicBlueprint = {
    id: 'neutral_ambient',
    name: 'Atlas of Contemplation',
    description: 'A deep walk through neutral landscapes. From foggy harbors to zen monasteries.',
    mood: 'contemplative',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 3 },
        bpm: { base: 56, range: [54, 60], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.2, curve: (p, pp) => (p < pp ? p/pp : (p < 0.85 ? 1.0 : 1 - ((p - 0.85) / 0.15))) }
    },
    structure: {
        totalDuration: { preferredBars: 168 },
        parts: [
            {
                id: 'INTRO', name: 'AtlasLottery', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true, sparkles: true, harmony: true, bass: true, drums: true, pianoAccompaniment: true, melody: true },
                stagedInstrumentation: [
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                            bass: { activationChance: 1.0, instrumentOptions: [{ name: 'classicBass', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            drums: { activationChance: 1.0, instrumentOptions: [{ name: 'calm', weight: 1.0 }] },
                            melody: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
                            sfx: { activationChance: 0.7, instrumentOptions: [{ name: 'common', weight: 1.0 }], transient: true }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'violin', weight: 1.0 }] },
                            sparkles: { activationChance: 0.6, instrumentOptions: [{ name: 'ambient_common', weight: 1.0 }] }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { density: {min: 0.4, max: 0.6} },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'NEUTRAL_INTRO_1', name: 'Clarity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'The Atlas Walk', duration: { percent: 75 },
                layers: { accompaniment: true, sfx: true, sparkles: true, bass: true, drums: true, harmony: true, melody: true, pianoAccompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                 instrumentRules: {
                   drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 }, useGhostHat: true },
                   melody: { source: 'motif', density: { min: 0.2, max: 0.4 } }
                },
                bundles: [{ id: 'NEUTRAL_MAIN_1', name: 'Walking', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'The Arrival', duration: { percent: 10 },
                layers: { accompaniment: true, sfx: true, sparkles: true },
                bundles: [{ id: 'NEUTRAL_OUTRO_1', name: 'End', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {
        mixTargets: {
            melody: { level: -28, pan: 0.0 },
            accompaniment: { level: -18, pan: 0.0 }
        }
    }
};
