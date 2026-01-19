
import type { MusicBlueprint } from '@/types/music';

export const EpicTranceBlueprint: MusicBlueprint = {
    id: 'epic_trance',
    name: 'Titan\'s Ascent',
    description: 'Величественный и кинематографичный транс с оркестровыми элементами.',
    mood: 'epic',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 2 },
        bpm: { base: 80, range: [78, 85], modifier: 1.0 }, // SLOWED DOWN
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.85, curve: (p, pp) => Math.pow(p, 1.8) }
    },
    structure: {
        totalDuration: { preferredBars: 180 },
        parts: [
            {
                id: 'INTRO', name: 'The Summoning', duration: { percent: 25 }, // INCREASED
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'ambientDrone', weight: 1.0 }], v2Options: [{ name: 'ambientDrone', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, useSnare: false, rareKick: true }, // SOFTER
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'EPIC_INTRO1_B1', name: 'Calling', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 4, parameters: { crescendo: true } },
            },
            {
                id: 'BUILD', name: 'The Gathering', duration: { percent: 30 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }], v2Options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'classicBass', weight: 1.0 }], v2Options: [{ name: 'classicBass', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: false, rareKick: true, usePerc: true }, // SOFTER
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] }, // CHANGED from offbeat
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [
                    { id: 'EPIC_BUILD_1', name: 'Marching', duration: { percent: 50 }, characteristics: {}, phrases: {} },
                    { id: 'EPIC_BUILD_2', name: 'Rising', duration: { percent: 50 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 4, parameters: { crescendo: true } }
            },
            {
                id: 'PEAK', name: 'The Vista', duration: { percent: 35 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'resonantGliss', weight: 1.0 }], v2Options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'mellotron', weight: 0.6 }, { name: 'synth', weight: 0.4 }], v2Options: [{ name: 'mellotron', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'mellotron', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.3, max: 0.5 }, source: 'harmony_top_note' },
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 1.1, useSnare: true } // SOFTER
                },
                bundles: [
                  { id: 'EPIC_PEAK_1', name: 'Vista', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null
            },
            {
                id: 'OUTRO', name: 'The Echoes', duration: { percent: 10 },
                layers: { accompaniment: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'EPIC_OUTRO_1', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
