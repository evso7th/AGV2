
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Sunshine Rockers" (Reggae Joyful v1.0).
 * #ЧТО: Бодрый мажорный реджи-рокстеди, нарастающее напряжение, живее и плотнее.
 * Риддим-палитра (kit standard, organ_soft_jazz, bass_jazz_warm) — как у melancholic.
 */
export const JoyfulReggaeBlueprint: MusicBlueprint = {
    id: 'joyful_reggae',
    name: 'Sunshine Rockers',
    description: 'Upbeat major-key rocksteady reggae in C Ionian. Bright, lively, building energy.',
    mood: 'joyful',
    musical: {
        key: { root: 'C', scale: 'ionian', octave: 2 },
        bpm: { base: 86, range: [82, 92], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: {
            type: 'crescendo',
            peakPosition: 0.7,
            curve: (p: number) => {
                if (p < 0.15) return 0.5 + (p / 0.15) * 0.1;
                return 0.6 + (p - 0.15) * 0.24;
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO', name: 'Sunrise', duration: { percent: 3 },
                layers: { accompaniment: true, bass: true, harmony: true, pianoAccompaniment: true, drums: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'pedal', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }] }
                },
                bundles: [{ id: 'REG_JOY_INTRO', name: 'First Light', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Rocksteady Drive', duration: { percent: 87 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'telecaster', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { source: 'motif', density: { min: 0.4, max: 0.6 } }
                },
                bundles: [{ id: 'REG_JOY_MAIN', name: 'Uptempo Riddim', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Golden Hour', duration: { percent: 10 },
                layers: { accompaniment: true, harmony: true, bass: true, drums: true, pianoAccompaniment: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }] }
                },
                bundles: [{ id: 'REG_JOY_OUTRO', name: 'Sunset', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
