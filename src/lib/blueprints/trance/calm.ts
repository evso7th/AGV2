
import type { MusicBlueprint } from '@/types/music';

export const CalmTranceBlueprint: MusicBlueprint = {
    id: 'calm_trance', name: 'Orbital Path', description: 'Steady and hypnotic trance.', mood: 'calm',
    musical: {
        key: { root: 'G', scale: 'mixolydian', octave: 3 },
        bpm: { base: 80, range: [78, 84], modifier: 1.0 }, // SLOWED DOWN
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'plateau', peakPosition: 0.4, curve: (p, pp) => p < pp ? p / pp : (p < 0.8 ? 1.0 : 1 - ((p - 0.8) / 0.2)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Launch', duration: { percent: 25 }, // INCREASED
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { source: 'motif' },
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, useSnare: false, usePerc: true }, // SOFTER
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] }
                },
                bundles: [
                    { id: 'INTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Cruising', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, useSnare: true, usePerc: true }, // SOFTER
                    melody: { source: 'motif' } 
                },
                bundles: [
                    { id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Orbit', duration: { percent: 30 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 0.9 }, // SOFTER
                    melody: { source: 'motif' } 
                },
                bundles: [
                    { id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Re-entry', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] } },
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
