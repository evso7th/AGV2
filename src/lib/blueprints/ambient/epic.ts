
import type { MusicBlueprint } from '@/types/music';

export const EpicAmbientBlueprint: MusicBlueprint = {
    id: 'epic_ambient',
    name: 'Heroic Dawn',
    description: 'Величественный и масштабный эмбиент.',
    mood: 'epic',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 2 },
        bpm: { base: 62, range: [60, 65], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
            type: 'arc',
            peakPosition: 0.7,
            curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.8) : 1 - Math.pow((p - pp) / (1 - pp), 1.2)
        }
    },
    structure: {
        totalDuration: { preferredBars: 180 },
        parts: [
            {
                id: 'INTRO', name: 'The Mists', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {
                    accompaniment: { register: { preferred: 'low' }, density: { min: 0.3, max: 0.5 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'EPIC_INTRO_1', name: 'Mists', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            },
            {
                id: 'BUILD', name: 'The Gathering', duration: { percent: 35 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }], v2Options: [{ name: 'organ', weight: 0.7 }, { name: 'mellotron', weight: 0.3 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'violin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: false, rareKick: true, usePerc: true },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [
                    { id: 'EPIC_BUILD_1', name: 'Calling', duration: { percent: 50 }, characteristics: {}, phrases: {} },
                    { id: 'EPIC_BUILD_2', name: 'Marching', duration: { percent: 50 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 4, parameters: { crescendo: true } }
            },
            {
                id: 'MAIN', name: 'The Vista', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'violin', weight: 0.6 }, { name: 'synth', weight: 0.4 }], v2Options: [{ name: 'violin', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'mellotron', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.3, max: 0.5 }, source: 'harmony_top_note' },
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, kickVolume: 1.1 }
                },
                bundles: [
                  { id: 'EPIC_MAIN_1', name: 'Vista', duration: { percent: 100 }, characteristics: {}, phrases: {} }
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
