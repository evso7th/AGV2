
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
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.4) : 1 - Math.pow((p - pp) / (1 - pp), 1.2) }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            // --- INTRO (12 bars total) ---
            {
                id: 'INTRO_1', name: 'The Summoning', duration: { percent: 3 }, // ~4 bars
                layers: { accompaniment: true, sfx: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }]
                    },
                },
                instrumentRules: {
                    accompaniment: { register: { preferred: 'low' }, density: { min: 0.1, max: 0.2 } },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'DARK_INTRO_1_BUNDLE', name: 'Ritual Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'First Echoes', duration: { percent: 3 }, // ~4 bars
                layers: { drums: true, bass: true, accompaniment: true, melody: true, sfx: true },
                instrumentation: {
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] 
                    },
                    bass: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'ambientDrone', weight: 1.0 }], 
                        v2Options: [{ name: 'bass_ambient_dark', weight: 1.0 }] 
                    },
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }]
                    },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.2, max: 0.3 }, useSnare: false, rareKick: true, usePerc: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'DARK_INTRO_2_BUNDLE', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_3', name: 'Calling the Spirits', duration: { percent: 4 }, // ~4 bars
                layers: { drums: true, bass: true, accompaniment: true, melody: true, sfx: true, harmony: true },
                instrumentation: {
                    harmony: { strategy: 'weighted', options: [{ name: 'piano', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'ambientDrone', weight: 1.0 }], v2Options: [{ name: 'bass_ambient_dark', weight: 1.0 }] },
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }]
                    },
                },
                instrumentRules: {
                    drums: { density: { min: 0.2, max: 0.4 } },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'DARK_INTRO_3_BUNDLE', name: 'Spirits', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom_low', density: 0.5 } },
            },
            // --- MAIN (96 bars total) ---
            {
                id: 'MAIN_1', name: 'The Chant', duration: { percent: 27 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, sfx: true, harmony: true, sparkles: true },
                instrumentation: {
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.4, max: 0.6 }, useSnare: true, kickVolume: 1.2 },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: { source: 'blues_solo', density: { min: 0.3, max: 0.5 }, register: { preferred: 'low' }, soloPlan: 'S06' }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_A_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_2', name: 'Ritual Peak', duration: { percent: 27 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, sfx: true, harmony: true, sparkles: true },
                 instrumentation: {
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                    drums: { density: { min: 0.5, max: 0.7 }, ride: { enabled: true, probability: 0.2 } },
                    melody: { source: 'blues_solo', density: { min: 0.4, max: 0.6 }, soloPlan: 'S07' }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_B_BUNDLE', name: 'Intensity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'ride' } },
            },
            {
                id: 'MAIN_3', name: 'Waning Chant', duration: { percent: 26 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, sfx: true, harmony: true, sparkles: true },
                 instrumentation: {
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                    drums: { density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'blues_solo', density: { min: 0.3, max: 0.5 }, soloPlan: 'S08' }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_C_BUNDLE', name: 'Waning', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            // --- OUTRO (12 bars total) ---
            {
                id: 'OUTRO_1', name: 'Fading Embers', duration: { percent: 3 },
                layers: { bass: true, drums: true, accompaniment: true, sfx: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }]
                    },
                },
                instrumentRules: {
                    drums: { density: { min: 0.2, max: 0.4 }, ride: { enabled: true, probability: 0.05 } },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'BLUES_DARK_OUTRO_1', name: 'Embers', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO_2', name: 'Cold Ash', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true },
                 instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 0.5 }, { name: 'synth', weight: 0.5 }]
                    },
                 },
                instrumentRules: {
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'BLUES_DARK_OUTRO_2', name: 'Ashes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO_3', name: 'Silence', duration: { percent: 4 },
                layers: { sfx: true },
                instrumentRules: {
                    sfx: { eventProbability: 0.1 },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'BLUES_DARK_OUTRO_3', name: 'Final Echo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
