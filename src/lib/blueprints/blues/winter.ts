import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Bluest Blues" (v27.0 - Lightning Intro).
 * #ЧТО: 1. Интро сокращено до 6 тактов (4% от 144).
 *       2. Разделено на 3 сцены по 2 такта (33% каждая).
 *       3. Попарный ввод: [Bass+Rhodes] -> [Drums+Melody] -> [Piano+Harmony].
 *       4. Оркестр "липкий" (все слои активны после вступления).
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Bluest Blues (V27)',
    description: 'A soul-drenched blues journey with a lightning 6-bar intro and staged instrumental arrival.',
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
                name: 'LightningLottery', 
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
                stagedInstrumentation: [
                    { 
                        duration: { percent: 33 }, // Bars 1-2
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                        }
                    },
                    {
                        duration: { percent: 33 }, // Bars 3-4
                        instrumentation: {
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 0.5 }, { name: 'telecaster', weight: 0.5 } ] }
                        }
                    },
                    {
                        duration: { percent: 34 }, // Bars 5-6
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'violin', weight: 0.7 }, { name: 'guitarChords', weight: 0.3 } ] },
                           sparkles: { activationChance: 0.6, instrumentOptions: [ { name: 'dark', weight: 1.0 } ] },
                           sfx: { activationChance: 0.5, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.9, max: 1.0 } },
                    melody: { source: 'blues_solo', density: { min: 0.6, max: 0.8 }, register: { preferred: 'low' } },
                    drums: { kitName: 'blues_melancholic', pattern: 'ambient_beat' }
                },
                bundles: [{ id: 'WINTER_INTRO_STAGED', name: 'Staged Birth', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', 
                name: 'Organ Dialogue', 
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
