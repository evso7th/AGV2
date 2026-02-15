import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Ступень Йоги 3 — JOYFUL: «Чистое Присутствие».
 * #ЧТО: Кристально чистый Ionian амбиент. Модель Harold Budd.
 * #ОБНОВЛЕНО (ПЛАН №435): Мелодия теперь гарантирована (activationChance 1.0).
 */
export const JoyfulAmbientBlueprint: MusicBlueprint = {
    id: 'joyful_ambient',
    name: 'The Pure Presence',
    description: 'Stage 3: Samadhi. Crystal clarity and stillness in C Ionian. Inspired by Harold Budd.',
    mood: 'joyful',
    musical: {
        key: { root: 'C', scale: 'ionian', octave: 3 },
        bpm: { base: 62, range: [60, 66], modifier: 1.1 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => Math.pow(p, 0.8) }
    },
    structure: {
        totalDuration: { preferredBars: 160 },
        parts: [
            {
                id: 'INTRO', name: 'PresenceLottery', duration: { percent: 13 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true, bass: true, drums: true, pianoAccompaniment: true, melody: true },
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
                            pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
                            // #ЗАЧЕМ: Мелодия гарантирована.
                            melody: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            harmony: { activationChance: 0.4, instrumentOptions: [{ name: 'guitarChords', weight: 1.0 }] },
                            sfx: { activationChance: 0.5, instrumentOptions: [{ name: 'common', weight: 1.0 }], transient: true }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            sparkles: { activationChance: 0.4, instrumentOptions: [{ name: 'light', weight: 1.0 }] },
                            drums: { activationChance: 0.3, instrumentOptions: [{ name: 'calm', weight: 1.0 }] }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.5, max: 0.7 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'JOY_INTRO_1', name: 'Presence', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'The Clarity Atlas', duration: { percent: 75 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    melody: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 0.5 }, { name: 'guitarChords', weight: 0.5 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 } },
                    melody: { source: 'harmony_top_note', density: { min: 0.2, max: 0.4 } }
                },
                bundles: [{ id: 'JOY_MAIN_1', name: 'Clarity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Dissolution', duration: { percent: 12 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                bundles: [{ id: 'JOY_OUTRO_1', name: 'Final Peace', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {
        mixTargets: {
            melody: { level: -18, pan: -0.1 },
            harmony: { level: -32, pan: 0.0 }
        }
    }
};
