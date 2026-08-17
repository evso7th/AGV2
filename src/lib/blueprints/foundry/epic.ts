import type { MusicBlueprint } from '@/types/music';

/**
 * @fileOverview Foundry Epic Blueprint V1.0.
 * #ЗАЧЕМ: 100% клон Trance Epic для Foundry.
 */
export const EpicFoundryBlueprint: MusicBlueprint = {
    id: 'epic_foundry',
    name: 'Titan Rise (Foundry)',
    description: 'Cinematic industrial anthem clone.',
    mood: 'epic',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 2 },
        bpm: { base: 80, range: [78, 85], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.85, curve: (p, pp) => Math.pow(p, 1.8) }
    },
    structure: {
        totalDuration: { preferredBars: 180 },
        parts: [
            {
                id: 'INTRO', name: 'The Summoning', duration: { percent: 25 },
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'ambientDrone', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, useSnare: false, rareKick: true },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'FO_EPIC_INTRO', name: 'Calling', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 4, parameters: { crescendo: true } },
            },
            {
                id: 'BUILD', name: 'The Gathering', duration: { percent: 30 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'classicBass', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: false, rareKick: true, usePerc: true },
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Marching', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 4, parameters: { crescendo: true } }
            },
            {
                id: 'PEAK', name: 'The Vista', duration: { percent: 35 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'mellotron', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'mellotron', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.3, max: 0.5 }, source: 'harmony_top_note' },
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 1.1, useSnare: true }
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Vista', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            },
            {
                id: 'OUTRO', name: 'The Echoes', duration: { percent: 10 },
                layers: { accompaniment: true, sfx: true, sparkles: true },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};