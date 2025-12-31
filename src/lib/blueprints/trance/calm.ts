
import type { MusicBlueprint } from '@/types/music';

export const CalmTranceBlueprint: MusicBlueprint = {
    id: 'calm_trance', name: 'Orbital Path', description: 'Steady and hypnotic trance.', mood: 'calm',
    musical: {
        key: { root: 'G', scale: 'mixolydian', octave: 3 },
        bpm: { base: 135, range: [132, 138], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'plateau', peakPosition: 0.4, curve: (p, pp) => p < pp ? p / pp : (p < 0.8 ? 1.0 : 1 - ((p - 0.8) / 0.2)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Launch', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { source: 'motif' },
                    drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } },
                    bass: { techniques: [{ value: 'arpeggio_slow', weight: 1.0 }] }
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
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.7, max: 0.9 } },
                    melody: { source: 'motif' } 
                },
                bundles: [
                    { id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Orbit', duration: { percent: 45 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
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
                id: 'OUTRO', name: 'Re-entry', duration: { percent: 15 },
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
