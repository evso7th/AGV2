
import type { MusicBlueprint } from '@/types/music';

export const MelancholicTranceBlueprint: MusicBlueprint = {
    id: 'melancholic_trance',
    name: 'Midnight Voyage',
    description: 'Introspective and driving trance with a progressive buildup.',
    mood: 'melancholic',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 3 },
        bpm: { base: 74, range: [70, 78], modifier: 1.0 }, // SLOWED DOWN
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.7, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.2) : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO_1', name: 'Atmosphere', duration: { percent: 15 }, // INCREASED
                layers: { accompaniment: true, sfx: true, drums: true },
                instrumentation: { 
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'ambientPad', weight: 1.0 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] 
                    } 
                },
                instrumentRules: { 
                    melody: { source: 'harmony_top_note' },
                    drums: { pattern: 'composer', kitName: 'trance_intro', density: { min: 0.1, max: 0.3 } },
                },
                bundles: [{ id: 'TR_INTRO1_B1', name: 'Pad', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'Pulse', duration: { percent: 15 }, // INCREASED
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: { 
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_melancholic', density: { min: 0.2, max: 0.4 } },
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'TR_INTRO2_B1', name: 'Groove', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'filter_sweep', duration: 2, parameters: {} },
            },
            {
                id: 'BUILD', name: 'Journey', duration: { percent: 25 }, // INCREASED
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_melancholic', density: { min: 0.5, max: 0.7 }, kickVolume: 0.9 },
                    melody: { source: 'motif' } 
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Reflection', duration: { percent: 30 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_melancholic', density: { min: 0.6, max: 0.8 }, kickVolume: 0.9 },
                    melody: { source: 'motif' } 
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fade to Silence', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: { melody: { source: 'motif' } },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
