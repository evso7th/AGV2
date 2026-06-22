
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Easy Skank" (Reggae Calm v1.0).
 * #ЧТО: Ровный, мягкий реджи-скэнк, стабильное напряжение около 0.45.
 * Риддим-палитра (kit standard, organ_soft_jazz, bass_jazz_warm) — как у melancholic.
 */
export const CalmReggaeBlueprint: MusicBlueprint = {
    id: 'calm_reggae',
    name: 'Easy Skank',
    description: 'A steady, mellow reggae skank in G Mixolydian. Stable, unhurried groove.',
    mood: 'calm',
    musical: {
        key: { root: 'G', scale: 'mixolydian', octave: 1 },
        bpm: { base: 74, range: [70, 78], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: (p: number) => 0.45 + 0.04 * Math.sin(p * Math.PI * 12) }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO', name: 'Settle In', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true, bass: true, harmony: true, pianoAccompaniment: true, drums: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'pedal', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'REG_CALM_INTRO', name: 'Warm Up', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Steady Riddim', duration: { percent: 87 },
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
                    melody: { source: 'motif', density: { min: 0.25, max: 0.45 } }
                },
                bundles: [{ id: 'REG_CALM_MAIN', name: 'The Groove', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Wind Down', duration: { percent: 10 },
                layers: { accompaniment: true, sfx: true, harmony: true, bass: true, drums: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }] }
                },
                bundles: [{ id: 'REG_CALM_OUTRO', name: 'Rest', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
