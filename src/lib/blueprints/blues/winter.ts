import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Bluest Blues" (v26.0 - Imperial Orchestration).
 * #ЧТО: 1. Лотерея интро: Аккомпанемент ТОЛЬКО Rhodes, Мелодия - Black или Telecaster.
 *       2. Пианист включен в лотерею вступления.
 *       3. Пост-интро: Органы как база, Rhodes только в пиках напряжения.
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Bluest Blues (V26)',
    description: 'A soul-drenched blues journey with a staged Rhodes entrance and dynamic organ layering.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 },
        bpm: { base: 72, range: [60, 75], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'arc', 
            peakPosition: 0.7, 
            curve: (p, pp) => {
                const base = p < pp ? Math.pow(p / pp, 1.2) : 1 - Math.pow((p - pp) / (1 - pp), 1.5);
                return 0.3 + (base * 0.7);
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'PROLOGUE', name: 'The Overture', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           // #ЗАЧЕМ: Rhodes как единственный голос пролога.
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           sfx: { activationChance: 0.45, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'WINTER_PROLOGUE', name: 'First Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO', name: 'ImperialLottery', duration: { percent: 27 }, 
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 25 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           // #ЗАЧЕМ: Аккомпанемент в интро только Rhodes.
                           accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           // #ЗАЧЕМ: Мелодия Black или Telecaster.
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 0.5 }, { name: 'telecaster', weight: 0.5 } ] }
                        }
                    },
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           // #ЗАЧЕМ: Пианино участвует в лотерее.
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'violin', weight: 0.7 }, { name: 'guitarChords', weight: 0.3 } ] }
                        }
                    },
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           sparkles: { activationChance: 0.6, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true },
                           sfx: { activationChance: 0.4, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.9, max: 1.0 } },
                    melody: { source: 'blues_solo', density: { min: 0.6, max: 0.8 }, register: { preferred: 'low' } },
                    drums: { kitName: 'blues_melancholic', pattern: 'ambient_beat' }
                },
                bundles: [{ id: 'WINTER_INTRO_STAGED', name: 'Scenaric Buildup', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'Organ Dialogue', duration: { percent: 66 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true },
                instrumentation: {
                   // #ЗАЧЕМ: Пост-интро база - Органы.
                   accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 0.7 }, { name: 'organ_prog', weight: 0.3 }] },
                   melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.8, max: 1.0 } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    melody: { source: 'blues_solo', density: { min: 0.8, max: 1.0 } }
                },
                bundles: [{ id: 'MAIN_FLOW', name: 'Harmonic Ocean', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Final Breath', duration: { percent: 4 }, 
                layers: { bass: true, drums: true, melody: false, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: false, sfx: false },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'pedal', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 } },
                    harmony: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'DISSOLUTION', name: 'Fade Away', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {
        mixTargets: {
            bass: { level: -18, pan: 0.0 },
            accompaniment: { level: -16, pan: 0.0 },
            melody: { level: -18, pan: -0.1 },
            harmony: { level: -30, pan: 0.0 },
            pianoAccompaniment: { level: -22, pan: 0.2 }
        }
    }
};
