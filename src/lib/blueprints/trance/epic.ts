
import type { MusicBlueprint } from '@/types/music';

export const EpicTranceBlueprint: MusicBlueprint = {
    id: 'epic_trance',
    name: 'Titan\'s Ascent',
    description: 'Величественный и кинематографичный транс с оркестровыми элементами.',
    mood: 'epic',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 2 },
        bpm: { base: 134, range: [132, 138], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.85, curve: (p, pp) => Math.pow(p, 1.8) }
    },
    structure: {
        totalDuration: { preferredBars: 180 },
        parts: [
            {
                id: 'INTRO_1', name: 'The Summoning', duration: { percent: 15 },
                layers: { accompaniment: true, drums: true, sfx: true, bass: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ', weight: 1.0 }], v1Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 }, useSnare: false, rareKick: true },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'EPIC_INTRO1_B1', name: 'Calling', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'The Gathering', duration: { percent: 35 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }], v2Options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, useSnare: false, rareKick: true, usePerc: true },
                    bass: { techniques: [{ value: 'offbeat', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [
                    { id: 'EPIC_BUILD_1', name: 'Marching', duration: { percent: 50 }, characteristics: {}, phrases: {} },
                    { id: 'EPIC_BUILD_2', name: 'Rising', duration: { percent: 50 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 4, parameters: { crescendo: true } }
            },
            {
                id: 'PEAK', name: 'The Vista', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'violin', weight: 0.6 }, { name: 'synth', weight: 0.4 }], v2Options: [{ name: 'violin', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'mellotron', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.3, max: 0.5 }, source: 'harmony_top_note' },
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 }, kickVolume: 1.2, useSnare: true },
                    bass: { techniques: [{ value: 'rolling', weight: 1.0 }] }
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
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] }
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
