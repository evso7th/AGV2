import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Очистка Anxious Ambient и внедрение Medieval Shadow (ПЛАН №424).
 * #ОБНОВЛЕНО (ПЛАН №426): Замена гудящего баса на чистый bass_808.
 */
export const AnxiousAmbientBlueprint: MusicBlueprint = {
    id: 'anxious_ambient',
    name: 'Medieval Nervous System',
    description: 'A tense, gothic soundscape inspired by Faun and Blackmore. Ritual pulses and ancient echoes.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 60, range: [58, 62], modifier: 1.05 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'wave', 
            peakPosition: 0.5, 
            curve: (p) => 0.4 + 0.3 * Math.sin(p * Math.PI * 4) 
        }
    },
    structure: {
        totalDuration: { preferredBars: 150 },
        parts: [
            {
                id: 'INTRO', name: 'ShadowsLottery', duration: { percent: 15 },
                layers: { sfx: true, accompaniment: true, pianoAccompaniment: true, bass: true, drums: true, melody: true, harmony: true, sparkles: true },
                stagedInstrumentation: [
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            // #ЗАЧЕМ: Чистый, артикулированный бас вместо гула.
                            bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_808', weight: 1.0 }] },
                            accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_cave_pad', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            drums: { activationChance: 1.0, instrumentOptions: [{ name: 'dark', weight: 1.0 }] },
                            melody: { activationChance: 1.0, instrumentOptions: [{ name: 'blackAcoustic', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
                            sfx: { activationChance: 0.8, instrumentOptions: [{ name: 'dark', weight: 1.0 }], transient: true }
                        }
                    },
                    {
                        duration: { percent: 25 },
                        instrumentation: {
                            harmony: { activationChance: 1.0, instrumentOptions: [{ name: 'violin', weight: 1.0 }] },
                            sparkles: { activationChance: 0.7, instrumentOptions: [{ name: 'dark', weight: 1.0 }] }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { density: { min: 0.2, max: 0.4 }, techniques: [{ value: 'long-chords', weight: 1.0 }] },
                    drums: { kitName: 'intro', pattern: 'ambient_beat', density: { min: 0.1, max: 0.2 } },
                    sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.7 }, { name: 'laser', weight: 0.3 }] }
                },
                bundles: [{ id: 'ANX_INTRO_1', name: 'First Shiver', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Ritual Pulse', duration: { percent: 75 },
                layers: { bass: true, drums: true, sfx: true, accompaniment: true, harmony: true, pianoAccompaniment: true, melody: true, sparkles: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_808', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'blackAcoustic', weight: 0.7 }, { name: 'organ_soft_jazz', weight: 0.3 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 }, usePerc: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    melody: { source: 'motif', style: 'solo' }
                },
                bundles: [{ id: 'ANX_MAIN_1', name: 'The Cycle', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fading Signals', duration: { percent: 10 },
                layers: { sfx: true, accompaniment: true, sparkles: true, bass: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] }
                },
                instrumentRules: {
                    sfx: { eventProbability: 0.4, categories: [{ name: 'dark', weight: 1.0 }] },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] }
                },
                bundles: [{ id: 'ANX_OUTRO_1', name: 'Silence', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {
        mixTargets: {
            melody: { level: -24, pan: 0.0 },
            accompaniment: { level: -18, pan: 0.0 },
            sfx: { level: -28, pan: 0.0 }
        }
    }
};
