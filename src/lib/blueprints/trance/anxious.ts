
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Очистка Anxious Trance и удаление дефектного баса.
 * #ЧТО: Замена bass_trance на bass_house.
 */
export const AnxiousTranceBlueprint: MusicBlueprint = {
    id: 'anxious_trance',
    name: 'Glitch in the System',
    description: 'Fast, chaotic, and glitchy trance with a sense of urgency.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'locrian', octave: 2 },
        bpm: { base: 88, range: [86, 92], modifier: 1.0 }, // SLOWED DOWN
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 8) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO_1', name: 'Signal Lost', duration: { percent: 20 }, // INCREASED
                layers: { sfx: true, accompaniment: true, drums: true },
                instrumentation: { 
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    }
                },
                instrumentRules: { 
                    accompaniment: { techniques: [{value: 'arpeggio-fast', weight: 1.0}], density: {min: 0.3, max: 0.5} },
                    drums: { pattern: 'composer', kitName: 'trance_intro', density: {min: 0.4, max: 0.6}, kickVolume: 0.8 }, // Use safe intro kit
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'TR_ANX_INTRO1', name: 'Static', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'BUILD', name: 'System Alert', duration: { percent: 30 }, // INCREASED
                layers: { bass: true, sfx: true, drums: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'resonantGliss', weight: 1.0 }], v2Options: [{ name: 'resonantGliss', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_anxious', density: { min: 0.7, max: 0.9 }, kickVolume: 1.0 },
                    bass: { techniques: [{value: 'glissando', weight: 0.7}, {value: 'pulse', weight: 0.3}]},
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Alert', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'PEAK', name: 'Red Alert', duration: { percent: 30 },
                layers: { bass: true, melody: true, sfx: true, drums: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'resonantGliss', weight: 1.0 }], v2Options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 1.0 }], v2Options: [{ name: 'theremin', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_anxious', density: { min: 0.8, max: 1.0 }, kickVolume: 1.1 },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Chaos', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'sfx' } },
            },
            {
                id: 'OUTRO', name: 'Corruption', duration: { percent: 20 }, // INCREASED
                layers: { sfx: true, drums: true, accompaniment: true },
                instrumentation: { 
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_intro', density: { min: 0.3, max: 0.5 }},
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Decay', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
