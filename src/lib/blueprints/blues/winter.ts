import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Bluest Blues" (v28.0 - Universal Lottery).
 * #ЧТО: 1. Интро сокращено до 6 тактов.
 *       2. Реализована система "Лотереи Рождения": все участники (8 слоев) 
 *          перемешиваются и вводятся группами в 3 этапа.
 *       3. Оркестр "липкий" (Persistent Ensemble).
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Bluest Blues (V28)',
    description: 'A soul-drenched blues journey with a randomized 6-bar introduction lottery.',
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
                id: 'INTRO', 
                name: 'BirthLottery', 
                duration: { percent: 4 }, // ~6 bars total
                layers: { 
                    bass: true, 
                    accompaniment: true, 
                    melody: true, 
                    drums: true, 
                    harmony: true, 
                    pianoAccompaniment: true, 
                    sparkles: true, 
                    sfx: true 
                },
                // #ЗАЧЕМ: Наполнение пула для лотереи.
                // #ЧТО: Все 8 участников перечислены здесь. Движок перемешает их и распределит по сценам.
                stagedInstrumentation: [
                    { 
                        duration: { percent: 33 }, // Scene 1 (2 bars)
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 0.5 }, { name: 'telecaster', weight: 0.5 } ] }
                        }
                    },
                    {
                        duration: { percent: 33 }, // Scene 2 (2 bars)
                        instrumentation: {
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'violin', weight: 0.7 }, { name: 'guitarChords', weight: 0.3 } ] }
                        }
                    },
                    {
                        duration: { percent: 34 }, // Scene 3 (2 bars)
                        instrumentation: {
                           sparkles: { activationChance: 1.0, instrumentOptions: [ { name: 'dark', weight: 1.0 } ] },
                           sfx: { activationChance: 1.0, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.9, max: 1.0 } },
                    melody: { source: 'blues_solo', density: { min: 0.6, max: 0.8 }, register: { preferred: 'low' } },
                    drums: { kitName: 'blues_melancholic', pattern: 'ambient_beat' }
                },
                bundles: [{ id: 'WINTER_INTRO_LOTTERY', name: 'Randomized Birth', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', 
                name: 'Imperial Dialogue', 
                duration: { percent: 92 },
                layers: { 
                    bass: true, 
                    drums: true, 
                    melody: true, 
                    accompaniment: true, 
                    harmony: true, 
                    pianoAccompaniment: true, 
                    sparkles: true, 
                    sfx: true 
                },
                instrumentation: {
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
                id: 'OUTRO', 
                name: 'Final Breath', 
                duration: { percent: 4 }, 
                layers: { 
                    bass: true, 
                    drums: true, 
                    melody: false, 
                    accompaniment: true, 
                    harmony: true, 
                    pianoAccompaniment: true, 
                    sparkles: false, 
                    sfx: false 
                },
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
    continuity: {
        anchorLayers: ['bass', 'accompaniment'],
        simultaneousSilence: { allowed: false, fallback: 'bass' }
    },
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
