import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Imperial Narrative" (v30.0 - Multi-Main & Morphing Bridges).
 * #ЧТО: 1. Интро 6 тактов с полной лотереей (включая Пианино).
 *       2. MAIN разбит на 4 части с семантической связью.
 *       3. Внедрены 4-тактные бриджи между всеми частями.
 *       4. Липкий оркестр (Persistent Ensemble).
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Imperial Bluest Blues',
    description: 'A grand narrative blues with dynamic transitions and emotional piano layering.',
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
        totalDuration: { preferredBars: 160 },
        parts: [
            // --- 1. INTRO (6 bars) ---
            {
                id: 'INTRO', name: 'BirthLottery', duration: { percent: 4 }, 
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 33 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'ep_rhodes_warm', weight: 1.0 }] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 0.5 }, { name: 'telecaster', weight: 0.5 } ] }
                        }
                    },
                    {
                        duration: { percent: 33 }, 
                        instrumentation: {
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'violin', weight: 0.7 }, { name: 'guitarChords', weight: 0.3 } ] }
                        }
                    },
                    {
                        duration: { percent: 34 }, 
                        instrumentation: {
                           sparkles: { activationChance: 1.0, instrumentOptions: [ { name: 'dark', weight: 1.0 } ] },
                           sfx: { activationChance: 1.0, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] },
                    melody: { source: 'blues_solo', register: { preferred: 'low' } }
                },
                bundles: [{ id: 'INTRO_B', name: 'Birth', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 2. MAIN 1 (The Theme) ---
            {
                id: 'MAIN_1', name: 'Theme Arrival', duration: { percent: 20 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                   accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                   melody: { strategy: 'weighted', v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.6, max: 0.8 } },
                    melody: { source: 'blues_solo', density: { min: 0.6, max: 0.8 } }
                },
                bundles: [{ id: 'M1_B', name: 'Establishment', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 3. BRIDGE 1 (Morph) ---
            {
                id: 'BRIDGE_1', name: 'Transition_I', duration: { percent: 3 }, // ~4 bars
                layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true },
                instrumentRules: { accompaniment: { density: { min: 0.2, max: 0.4 } } },
                bundles: [{ id: 'B1_B', name: 'Crossing', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 4. MAIN 2 (Dialogue) ---
            {
                id: 'MAIN_2', name: 'The Dialogue', duration: { percent: 20 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                   accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 0.7 }, { name: 'organ_prog', weight: 0.3 }] },
                   melody: { strategy: 'weighted', v2Options: [{ name: 'cs80', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.7, max: 0.9 } },
                    melody: { source: 'blues_solo' }
                },
                bundles: [{ id: 'M2_B', name: 'Exchange', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 5. BRIDGE 2 ---
            {
                id: 'BRIDGE_2', name: 'Transition_II', duration: { percent: 3 },
                layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true },
                bundles: [{ id: 'B2_B', name: 'Breath', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 6. MAIN 3 (Deep Inversion) ---
            {
                id: 'MAIN_3', name: 'Introspection', duration: { percent: 20 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                   accompaniment: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] },
                   melody: { strategy: 'weighted', v2Options: [{ name: 'telecaster', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', kitName: 'blues_melancholic' },
                    melody: { source: 'blues_solo', density: { min: 0.4, max: 0.6 } }
                },
                bundles: [{ id: 'M3_B', name: 'Deep Sea', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 7. BRIDGE 3 ---
            {
                id: 'BRIDGE_3', name: 'Transition_III', duration: { percent: 3 },
                layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true },
                bundles: [{ id: 'B3_B', name: 'Rise', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 8. MAIN 4 (The Peak) ---
            {
                id: 'MAIN_4', name: 'The Final Climax', duration: { percent: 20 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                   accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_prog', weight: 1.0 }] },
                   melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.9, max: 1.0 } },
                    melody: { source: 'blues_solo', density: { min: 0.8, max: 1.0 } }
                },
                bundles: [{ id: 'M4_B', name: 'The Peak', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 9. BRIDGE 4 ---
            {
                id: 'BRIDGE_4', name: 'Transition_IV', duration: { percent: 3 },
                layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sfx: true },
                bundles: [{ id: 'B4_B', name: 'Dissolve', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 10. OUTRO ---
            {
                id: 'OUTRO', name: 'Final Breath', duration: { percent: 4 }, 
                layers: { bass: true, accompaniment: true, pianoAccompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    harmony: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'OUT_B', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
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
