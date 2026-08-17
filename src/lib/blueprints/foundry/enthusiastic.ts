import type { MusicBlueprint } from '@/types/music';

/**
 * @fileOverview Foundry Enthusiastic Blueprint V1.0.
 * #ЗАЧЕМ: 100% клон Trance Enthusiastic для Foundry.
 */
export const EnthusiasticFoundryBlueprint: MusicBlueprint = {
    id: 'enthusiastic_foundry',
    name: 'Radiant Flow (Foundry)',
    description: 'Energetic industrial flow clone.',
    mood: 'enthusiastic',
    musical: {
        key: { root: 'E', scale: 'lydian', octave: 3 },
        bpm: { base: 84, range: [82, 90], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.8, curve: (p, pp) => Math.pow(p, 1.5) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Ignition', duration: { percent: 20 },
                layers: { accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true, bass: true, pianoAccompaniment: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'theremin', weight: 1.0 }] },
                    bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_house', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }], density: { min: 0.5, max: 0.7 } },
                    melody: { density: { min: 0.3, max: 0.5 }, source: 'harmony_top_note' },
                    drums: { pattern: 'ambient_beat', density: { min: 0.5, max: 0.7 }, kickVolume: 0.9 }
                },
                bundles: [{ id: 'FO_ENT_INTRO', name: 'Spark', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'BUILD', name: 'Ascension', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v2Options: [{ name: 'classicBass', weight: 1.0 }] },
                    accompaniment: { 
                        strategy: 'weighted', 
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }], density: { min: 0.6, max: 0.8 } },
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Climb', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { crescendo: true } },
            },
            {
                id: 'PEAK', name: 'Apex', duration: { percent: 35 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v2Options: [{ name: 'livingRiff', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }], density: { min: 0.8, max: 1.0 } },
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.1, useSnare: true },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Peak', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fade', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true, harmony: true },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};