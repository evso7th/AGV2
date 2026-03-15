import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Imperial Narrative" (v31.0 - Lottery Ready).
 * #ЧТО: ПЛАН №844 — INTRO очищено от жестких сценариев для работы Ensemble Lottery.
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
            // --- 1. INTRO (9 bars for 3 lottery phases) ---
            {
                id: 'INTRO', name: 'BirthLottery', duration: { percent: 6 }, 
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                   bass: { strategy: 'weighted', options: [ { name: 'bass', weight: 1.0 } ] },
                   accompaniment: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] },
                   melody: { strategy: 'weighted', options: [ { name: 'blackAcoustic', weight: 0.5 }, { name: 'telecaster', weight: 0.5 } ] },
                   harmony: { strategy: 'weighted', options: [ { name: 'violin', weight: 0.7 }, { name: 'guitarChords', weight: 0.3 } ] },
                   sfx: { strategy: 'weighted', options: [ { name: 'voice', weight: 1.0 } ] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] },
                    melody: { source: 'blues_solo', register: { preferred: 'low' }, timeScale: 1 },
                    pianoAccompaniment: { timeScale: 1 }
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
                   melody: { strategy: 'weighted', v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                   harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] } 
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.6, max: 0.8 } },
                    melody: { source: 'blues_solo', density: { min: 0.6, max: 0.8 }, timeScale: 1 },
                    pianoAccompaniment: { timeScale: 1 }
                },
                bundles: [{ id: 'M1_B', name: 'Establishment', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },

            // --- 3. BRIDGE 1 (Morph) ---
            {
                id: 'BRIDGE_1', name: 'Transition_I', duration: { percent: 3 }, 
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
                   accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 0.7 }, { name: 'organ', weight: 0.3 }] },
                   melody: { strategy: 'weighted', v2Options: [{ name: 'cs80', weight: 1.0 }] },
                   harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.7, max: 0.9 } },
                    melody: { source: 'blues_solo', timeScale: 1 },
                    pianoAccompaniment: { timeScale: 1 }
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
                   melody: { strategy: 'weighted', v2Options: [{ name: 'telecaster', weight: 1.0 }] },
                   harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', kitName: 'blues_melancholic' },
                    melody: { source: 'blues_solo', density: { min: 0.4, max: 0.6 }, timeScale: 1 },
                    pianoAccompaniment: { timeScale: 1 }
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
                   melody: { strategy: 'weighted', v2Options: [{ name: 'cs80', weight: 1.0 }] },
                   harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.9, max: 1.0 } },
                    melody: { source: 'blues_solo', density: { min: 0.8, max: 1.0 }, timeScale: 1 },
                    pianoAccompaniment: { timeScale: 1 }
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
                    harmony: { techniques: [{ value: 'long-chords', weight: 1.0 }] },
                    pianoAccompaniment: { timeScale: 1 }
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
