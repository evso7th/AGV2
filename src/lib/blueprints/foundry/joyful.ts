import type { MusicBlueprint } from '@/types/music';

/**
 * @fileOverview Foundry Joyful Blueprint V1.0.
 * #ЗАЧЕМ: 100% клон Trance Joyful для Foundry.
 */
export const JoyfulFoundryBlueprint: MusicBlueprint = {
    id: 'joyful_foundry',
    name: 'Sunrise Pulse (Foundry)',
    description: 'Uplifting industrial synthesis clone.',
    mood: 'joyful',
    musical: {
        key: { root: 'E', scale: 'ionian', octave: 3 },
        bpm: { base: 84, range: [80, 88], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Sunrise', duration: { percent: 10 }, 
                layers: { accompaniment: true, drums: true, sfx: true, bass: true, pianoAccompaniment: true },
                instrumentation: { 
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 } },
                    accompaniment: { density: { min: 0.6, max: 0.8 } }
                },
                bundles: [{ id: 'FO_JOY_INTRO', name: 'Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Ascension', duration: { percent: 30 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true, melody: true },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 } },
                    melody: { density: { min: 0.5, max: 0.7 }, source: 'motif' }
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Zenith', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, sparkles: true, pianoAccompaniment: true, harmony: true },
                instrumentation: {
                    melody: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 0.95 },
                    melody: { density: { min: 0.7, max: 1.0 }, source: 'motif' },
                    accompaniment: { density: { min: 0.8, max: 1.0 } }
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Afterglow', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true, bass: true, drums: true, sparkles: true },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.1, max: 0.3 } },
                    accompaniment: { density: { min: 0.5, max: 0.7 } }
                },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};