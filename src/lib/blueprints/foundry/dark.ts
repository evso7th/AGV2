
import type { MusicBlueprint } from '@/types/music';

/**
 * @fileOverview Foundry Dark Blueprint V1.2 — "Sparkle Saturation".
 * #ЗАЧЕМ: ПЛАН №1986. Троекратное увеличение плотности текстур.
 */
export const DarkFoundryBlueprint: MusicBlueprint = {
    id: 'dark_foundry',
    name: 'Void Runner (Foundry)',
    description: 'Tense and hypnotic industrial trance clone.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 70, range: [68, 74], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 6) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Initial Spark', duration: { percent: 10 }, 
                layers: { accompaniment: true, sfx: true, drums: true, bass: true, melody: true, harmony: true, pianoAccompaniment: true, sparkles: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_house', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.1, max: 0.3 } },
                    sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 1.0 }] },
                    sparkles: { density: { min: 0.4, max: 0.6 } }
                },
                bundles: [{ id: 'FO_DARK_INTRO1', name: 'Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'The Chase', duration: { percent: 30 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true, harmony: true, melody: true, sparkles: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v2Options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 1.1 },
                    sfx: { eventProbability: 0.4, categories: [{ name: 'dark', weight: 0.8 }, { name: 'voice', weight: 0.2 }] },
                    sparkles: { density: { min: 0.6, max: 0.8 } }
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'PEAK', name: 'Red Line', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true, harmony: true, sparkles: true },
                instrumentation: {
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.2 },
                    sfx: { eventProbability: 0.5, categories: [{ name: 'dark', weight: 0.5 }, { name: 'voice', weight: 0.5 }] },
                    sparkles: { density: { min: 0.8, max: 1.0 } }
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Cool Down', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true, drums: true, bass: true, melody: true, harmony: true, pianoAccompaniment: true, sparkles: true },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
