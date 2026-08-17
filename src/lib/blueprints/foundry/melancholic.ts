
import type { MusicBlueprint } from '@/types/music';

/**
 * @fileOverview Foundry Melancholic Blueprint V2.0 — "Absolute Trance Clone".
 * #ЗАЧЕМ: ПЛАН №1950. Принудительная установка трансовой энергии (pattern: composer, kickVolume: 1.1).
 */
export const MelancholicFoundryBlueprint: MusicBlueprint = {
    id: 'melancholic_foundry',
    name: 'Industrial Echo',
    description: 'Energetic industrial synthesis with heavy bass and neuro drums.',
    mood: 'melancholic',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 3 },
        bpm: { base: 82, range: [80, 88], modifier: 1.0 }, 
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
                    drums: { pattern: 'composer', kitName: 'trance_intro', density: { min: 0.4, max: 0.6 }, kickVolume: 1.1 },
                },
                bundles: [{ id: 'TR_INTRO_B1', name: 'Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Neuro Drive', duration: { percent: 75 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', kitName: 'trance_melancholic', density: { min: 0.6, max: 0.8 }, kickVolume: 1.2 },
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fading Industrial', duration: { percent: 15 },
                layers: { accompaniment: true, sfx: true, bass: true, melody: true, harmony: true, pianoAccompaniment: true, drums: true },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
