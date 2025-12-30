
import type { MusicBlueprint } from '@/types/music';

export const MelancholicTranceBlueprint: MusicBlueprint = {
    id: 'melancholic_trance', name: 'Midnight Voyage', description: 'Introspective and driving trance.', mood: 'melancholic',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 3 },
        bpm: { base: 132, range: [130, 136], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'arc', peakPosition: 0.55, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Departure', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: {
                    melody: { source: 'motif' }
                },
                bundles: [
                    { id: 'INTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Journey', duration: { percent: 30 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.6, max: 0.8 } },
                    melody: { source: 'motif' } 
                },
                bundles: [
                    { id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Reflection', duration: { percent: 35 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 } },
                    melody: { source: 'motif' } 
                },
                bundles: [
                    { id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fade to Silence', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: {
                    melody: { source: 'motif' }
                },
                bundles: [
                    { id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
