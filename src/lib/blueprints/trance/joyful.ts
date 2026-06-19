
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Светлый Транс (v1.3).
 * #ЧТО: ПЛАН №1230 — Сокращение OUTRO до 4%.
 */
export const JoyfulTranceBlueprint: MusicBlueprint = {
    id: 'joyful_trance', name: 'Sunrise Pulse', description: 'Uplifting and energetic trance.', mood: 'joyful',
    musical: {
        key: { root: 'E', scale: 'ionian', octave: 3 },
        bpm: { base: 84, range: [80, 88], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Sunrise', duration: { percent: 3 },
                layers: { accompaniment: true, drums: true, sfx: true, bass: true },
                instrumentation: { 
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 } }
                },
                bundles: [
                    { id: 'INTRO_BUNDLE_1', name: 'Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Ascension', duration: { percent: 53 }, // REBALANCED
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, pianoAccompaniment: true },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 } }
                },
                bundles: [
                    { id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Zenith', duration: { percent: 40 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, sparkles: true, pianoAccompaniment: true },
                instrumentation: {
                    melody: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 0.9 },
                },
                bundles: [
                    { id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Afterglow', duration: { percent: 4 }, // REDUCED
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                bundles: [
                    { id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
