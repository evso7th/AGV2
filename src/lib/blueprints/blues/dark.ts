import type { MusicBlueprint } from '@/types/music';

export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Ritual Blues',
    description: 'A slow, heavy, and ritualistic blues with a sense of dread.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 62, range: [60, 66], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar minor progression
        tensionProfile: { type: 'plateau', peakPosition: 0.6, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'The Summoning', duration: { percent: 25 },
                layers: { drums: true, accompaniment: true },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.1, max: 0.2 }, useSnare: false, rareKick: true },
                    accompaniment: { register: { preferred: 'low' }, density: { min: 0.1, max: 0.3 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BLUES_DARK_INTRO_BUNDLE', name: 'Ritual Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'The Chant', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.4, max: 0.6 }, useSnare: true, kickVolume: 1.2, ride: { enabled: true, probability: 0.1 } },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    melody: {
                        source: 'blues_solo',
                        density: { min: 0.3, max: 0.5 },
                        register: { preferred: 'low' },
                        soloPlan: "S06",
                        presetModifiers: { reverbMix: 0.6, delay: { on: true, time: 0.5, fb: 0.4, hc: 2000, mix: 0.3 } } // FX for "ghost" guitar
                    }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_BUNDLE', name: 'Main Chant', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'ride' } },
            },
            {
                id: 'OUTRO', name: 'Fading Echoes', duration: { percent: 25 },
                layers: { drums: true, accompaniment: true, sfx: true },
                 instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.1, max: 0.3 }, useSnare: false, ride: { enabled: true, probability: 0.05 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BLUES_DARK_OUTRO_BUNDLE', name: 'Fade Out', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
