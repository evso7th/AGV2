
import type { MusicBlueprint } from '@/types/music';

export const DreamyTranceBlueprint: MusicBlueprint = {
    id: 'dreamy_trance',
    name: 'Starlight Echoes',
    description: 'Atmospheric and soaring trance with lush pads and a hypnotic rhythm.',
    mood: 'dreamy',
    musical: {
        key: { root: 'F', scale: 'lydian', octave: 3 },
        bpm: { base: 82, range: [80, 86], modifier: 1.0 }, // SLOWED DOWN
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.65, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Nebula', duration: { percent: 25 }, // INCREASED
                layers: { accompaniment: true, bass: true, drums: true, sfx: true },
                instrumentation: { 
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'glideBass', weight: 1.0 }], v2Options: [{ name: 'glideBass', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, kickVolume: 0.8, useSnare: false }, // SOFTER
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'DREAMY_INTRO_B1', name: 'Drift', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'reverb_burst', duration: 4, parameters: {} },
            },
            {
                id: 'BUILD', name: 'Starlight', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 }, useSnare: true, kickVolume: 0.9 }, // SOFTER
                    sparkles: { eventProbability: 0.15 },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'DREAMY_BUILD_B1', name: 'Glow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Supernova', duration: { percent: 30 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'bass_jazz_warm', weight: 1.0 }], v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 0.6 }, { name: 'synth', weight: 0.4 }], v2Options: [{ name: 'theremin', weight: 0.6 }, { name: 'synth', weight: 0.4 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, kickVolume: 1.0, useSnare: true }, // SOFTER
                    bass: { techniques: [{value: 'pulse', weight: 1.0}] },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'DREAMY_PEAK_B1', name: 'Burst', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Echoes', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true, sparkles: true },
                instrumentation: { 
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    } 
                },
                instrumentRules: {
                    sparkles: { eventProbability: 0.2 },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'DREAMY_OUTRO_B1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
