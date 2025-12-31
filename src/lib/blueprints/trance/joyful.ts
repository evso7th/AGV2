
import type { MusicBlueprint } from '@/types/music';

export const JoyfulTranceBlueprint: MusicBlueprint = {
    id: 'joyful_trance', name: 'Sunrise Pulse', description: 'Uplifting and energetic trance.', mood: 'joyful',
    musical: {
        key: { root: 'E', scale: 'ionian', octave: 3 },
        bpm: { base: 138, range: [135, 142], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Sunrise', duration: { percent: 15 },
                layers: { accompaniment: true, drums: true, sfx: true, bass: true, melody: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] } },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.5, max: 0.7 } },
                    melody: { source: 'motif' } 
                },
                bundles: [
                    { id: 'INTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Ascension', duration: { percent: 25 },
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
                id: 'PEAK', name: 'Zenith', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.8 }, { name: 'organ', weight: 0.2 }], v2Options: [{ name: 'synth', weight: 0.8 }, { name: 'organ', weight: 0.2 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 1.0 }], v2Options: [{ name: 'theremin', weight: 1.0 }] }
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
                id: 'OUTRO', name: 'Afterglow', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true, bass: true, melody: true, drums: true },
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
