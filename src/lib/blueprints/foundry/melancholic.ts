
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт Foundry Melancholic V1.0.
 * #ЧТО: 100% клон Trance Melancholic.
 */
export const MelancholicFoundryBlueprint: MusicBlueprint = {
    id: 'melancholic_foundry',
    name: 'Industrial Echo',
    description: '100% Trance Clone for Foundry Genre.',
    mood: 'melancholic',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 3 },
        bpm: { base: 74, range: [70, 78], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.7, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Ignition', duration: { percent: 10 }, 
                layers: { accompaniment: true, sfx: true, drums: true, bass: true, melody: true, harmony: true, pianoAccompaniment: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_house', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_intro', density: { min: 0.1, max: 0.3 } },
                },
                bundles: [{ id: 'TR_INTRO_B1', name: 'Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Journey', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, harmony: true, pianoAccompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_ambient', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'theremin', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_melancholic', density: { min: 0.5, max: 0.7 }, kickVolume: 0.9 },
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Reflection', duration: { percent: 50 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_melancholic', density: { min: 0.6, max: 0.8 }, kickVolume: 0.9 },
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fade to Silence', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true, bass: true, melody: true, harmony: true, pianoAccompaniment: true, drums: true },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
