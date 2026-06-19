
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Тёмный Транс (v1.3).
 * #ЧТО: ПЛАН №1230 — Сокращение OUTRO до 4%.
 */
export const DarkTranceBlueprint: MusicBlueprint = {
    id: 'dark_trance',
    name: 'Void Runner',
    description: 'Tense and hypnotic trance with a broken, industrial edge.',
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
                id: 'INTRO', name: 'Initial Spark', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true, drums: true, bass: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_house', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.1, max: 0.3 } },
                },
                bundles: [{ id: 'TR_DARK_INTRO1', name: 'Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'The Chase', duration: { percent: 53 }, // REBALANCED
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v2Options: [{ name: 'resonantGliss', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 1.1 },
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'PEAK', name: 'Red Line', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true },
                instrumentation: {
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.2 },
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Cool Down', duration: { percent: 4 }, // REDUCED
                layers: { accompaniment: true, sfx: true, drums: true },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
