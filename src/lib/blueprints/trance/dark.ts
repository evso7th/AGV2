
import type { MusicBlueprint } from '@/types/music';

export const DarkTranceBlueprint: MusicBlueprint = {
    id: 'dark_trance',
    name: 'Void Runner',
    description: 'Tense and hypnotic trance with a broken, industrial edge.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 70, range: [68, 74], modifier: 1.0 }, // SLOWED DOWN
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 6) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO_1', name: 'Static', duration: { percent: 20 }, // INCREASED
                layers: { accompaniment: true, sfx: true, drums: true, bass: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] }
                },
                instrumentRules: { 
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                    drums: { pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, rareKick: true }, // SOFTER
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'TR_DARK_INTRO1', name: 'Noise Floor', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'filter_sweep', duration: 1, parameters: {} },
            },
            {
                id: 'BUILD', name: 'The Chase', duration: { percent: 30 }, // INCREASED
                layers: { bass: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, useSnare: true, rareKick: true, usePerc: true, alternatePerc: true, kickVolume: 1.1 }, // SOFTER
                    bass: { techniques: [{value: 'glissando', weight: 1.0}]},
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'PEAK', name: 'Red Line', duration: { percent: 30 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, useSnare: true, rareKick: true, usePerc: true, alternatePerc: true, kickVolume: 1.2 }, // SOFTER
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Cool Down', duration: { percent: 20 }, // INCREASED
                layers: { accompaniment: true, sfx: true, drums: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, useSnare: false, rareKick: true }, // SOFTER
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
