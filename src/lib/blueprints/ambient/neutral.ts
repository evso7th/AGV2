
import type { MusicBlueprint } from '@/types/music';

export const NeutralAmbientBlueprint: MusicBlueprint = {
    id: 'neutral_ambient',
    name: 'Infinite Expanse',
    description: 'Сбалансированный, универсальный и спокойный эмбиент.',
    mood: 'contemplative',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 3 },
        bpm: { base: 56, range: [54, 60], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.2, curve: (p, pp) => (p < pp ? p/pp : (p < 0.85 ? 1.0 : 1 - ((p - 0.85) / 0.15))) }
    },
    structure: {
        totalDuration: { preferredBars: 168 },
        parts: [
            {
                id: 'INTRO', name: 'Focus', duration: { percent: 12 },
                layers: { accompaniment: true, sfx: true, sparkles: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ep_rhodes_warm', weight: 0.6 }, { name: 'synth', weight: 0.4 }], v2Options: [{ name: 'ep_rhodes_warm', weight: 0.6 }, { name: 'synth', weight: 0.4 }] },
                },
                instrumentRules: {
                    accompaniment: { density: {min: 0.4, max: 0.6} },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'NEUTRAL_INTRO_1', name: 'Clarity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Stream', duration: { percent: 31 },
                layers: { accompaniment: true, sfx: true, sparkles: true, bass: true, drums: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ep_rhodes_warm', weight: 0.7 }, { name: 'mellotron_flute_intimate', weight: 0.3 }], v2Options: [{ name: 'ep_rhodes_warm', weight: 0.7 }, { name: 'mellotron_flute_intimate', weight: 0.3 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                 instrumentRules: {
                   drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, usePerc: true, useSnare: false, useGhostHat: true },
                   melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'NEUTRAL_BUILD_1', name: 'Flow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Deep Work', duration: { percent: 31 },
                layers: { accompaniment: true, sfx: true, sparkles: true, bass: true, drums: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ep_rhodes_warm', weight: 0.8 }, { name: 'mellotron_flute_intimate', weight: 0.2 }], v2Options: [{ name: 'ep_rhodes_warm', weight: 0.8 }, { name: 'mellotron_flute_intimate', weight: 0.2 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { density: { min: 0.15, max: 0.3 }, source: 'harmony_top_note' },
                    drums: { density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'NEUTRAL_MAIN_1', name: 'Concentration', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'RELEASE', name: 'Resolution', duration: { percent: 19 },
                layers: { accompaniment: true, sfx: true, sparkles: true, bass: true, harmony: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }], v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] },
                },
                instrumentRules: {
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'NEUTRAL_RELEASE_1', name: 'Conclusion', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Silence', duration: { percent: 7 },
                layers: { accompaniment: true, sfx: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                },
                instrumentRules: {
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'NEUTRAL_OUTRO_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
