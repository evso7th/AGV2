
import type { MusicBlueprint } from '@/types/music';

export const EnthusiasticTranceBlueprint: MusicBlueprint = {
    id: 'enthusiastic_trance',
    name: 'Radiant Ascent',
    description: 'Яркий, энергичный и восторженный транс.',
    mood: 'enthusiastic',
    musical: {
        key: { root: 'E', scale: 'lydian', octave: 3 },
        bpm: { base: 128, range: [126, 132], modifier: 1.0 }, // ЗАМЕДЛЕНО
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.8, curve: (p, pp) => Math.pow(p, 1.5) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Ignition', duration: { percent: 15 }, // УВЕЛИЧЕНО
                layers: { accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true, bass: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.7 }, { name: 'organ', weight: 0.3 }], v2Options: [{ name: 'synth', weight: 0.7 }, { name: 'organ', weight: 0.3 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 1.0 }], v2Options: [{ name: 'theremin', weight: 1.0 }] }
                },
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }], density: { min: 0.6, max: 0.8 } },
                    melody: { density: { min: 0.4, max: 0.6 }, source: 'harmony_top_note' },
                    drums: { pattern: 'ambient_beat', density: { min: 0.6, max: 0.8 }, kickVolume: 0.9 } // СМЯГЧЕНО
                },
                bundles: [{ id: 'ENT_INTRO_1', name: 'Spark', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Ascension', duration: { percent: 25 }, // УМЕНЬШЕНО
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 0.5 }, { name: 'theremin', weight: 0.5 }], v2Options: [{ name: 'electricGuitar', weight: 0.5 }, { name: 'theremin', weight: 0.5 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'rolling', weight: 1.0 }], density: { min: 0.7, max: 0.9 } },
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 } }, // СМЯГЧЕНО
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ENT_BUILD_1', name: 'Climb', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { crescendo: true } },
            },
            {
                id: 'PEAK', name: 'Apex', duration: { percent: 35 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'organ', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'organ', weight: 0.5 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'rolling', weight: 1.0 }], density: { min: 0.9, max: 1.0 } },
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 }, kickVolume: 1.1, useSnare: true }, // СМЯГЧЕНО
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ENT_PEAK_1', name: 'Peak', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'RELEASE', name: 'Soaring', duration: { percent: 15 }, // УМЕНЬШЕНО
                layers: { accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.5, max: 0.7 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ENT_RELEASE_1', name: 'Glide', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'accompaniment' } },
            },
            {
                id: 'OUTRO', name: 'Starlight', duration: { percent: 10 }, // УВЕЛИЧЕНО
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {
                    sparkles: { eventProbability: 0.3 },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ENT_OUTRO_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [
        { type: 'sparkle', probability: 0.18, activeParts: ['BUILD', 'PEAK', 'RELEASE'] },
        { type: 'shimmer_burst', probability: 0.10, activeParts: ['BUILD', 'PEAK'] },
    ],
    continuity: {},
    rendering: {}
};
