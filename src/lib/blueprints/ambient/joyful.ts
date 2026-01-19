
import type { MusicBlueprint } from '@/types/music';

export const JoyfulAmbientBlueprint: MusicBlueprint = {
    id: 'joyful_ambient',
    name: 'Golden Horizons',
    description: 'Светлый, энергичный и позитивный эмбиент.',
    mood: 'joyful',
    musical: {
        key: { root: 'C', scale: 'ionian', octave: 3 },
        bpm: { base: 62, range: [60, 66], modifier: 1.1 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => Math.pow(p, 0.8) }
    },
    structure: {
        totalDuration: { preferredBars: 160 },
        parts: [
            {
                id: 'INTRO', name: 'Dawn', duration: { percent: 13 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.6 }, { name: 'organ', weight: 0.4 }], v2Options: [{ name: 'synth', weight: 0.6 }, { name: 'organ', weight: 0.4 }] }
                },
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }], density: { min: 0.5, max: 0.7 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'JOY_INTRO_1', name: 'First Light', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Morning', duration: { percent: 29 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v1Options: [{ name: 'classicBass', weight: 1.0 }], v2Options: [{ name: 'classicBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 } },
                    bass: { techniques: [{ value: 'walking', weight: 0.7 }, { value: 'melodic', weight: 0.3 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'JOY_BUILD_1', name: 'Awakening', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'MAIN', name: 'Daylight', duration: { percent: 32 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.1 },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'JOY_MAIN_1', name: 'Celebration', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'RELEASE', name: 'Golden Hour', duration: { percent: 18 },
                layers: { accompaniment: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'JOY_RELEASE_1', name: 'Reflection', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Sunset', duration: { percent: 8 },
                layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'JOY_OUTRO_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [
        { type: 'sparkle', probability: 0.15, activeParts: ['BUILD', 'MAIN', 'RELEASE'] }, // Bell
        { type: 'sparkle', probability: 0.10, activeParts: ['MAIN'] }, // Sparkle Cascade
    ],
    continuity: {},
    rendering: {}
};
