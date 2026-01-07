
import type { MusicBlueprint } from '@/types/music';

export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Nervous Breakdown Shuffle',
    description: 'A fast, chaotic, and tense blues shuffle that builds from an empty start.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'mixolydian', octave: 2 },
        bpm: { base: 82, range: [80, 88], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar major
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 8) }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Nervous Build-up', duration: { percent: 15 },
                introRules: {
                    instrumentPool: ['drums', 'bass', 'accompaniment'],
                    stages: 3,
                },
                layers: {
                    accompaniment: true,
                    bass: true,
                    drums: true,
                    sfx: true, 
                },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ', weight: 1.0 }]
                    },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: {min: 0.1, max: 0.4}, useSnare: false, usePerc: true, rareKick: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }, 
                    sfx: { eventProbability: 0.6, categories: [{name: 'voice', weight: 0.8}, {name: 'dark', weight: 0.2}]}
                },
                bundles: [
                    {
                        id: 'BLUES_ANX_INTRO_BUNDLE_1', name: 'Organ Chords', duration: { percent: 100 },
                        characteristics: { },
                        phrases: {}
                    },
                ],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', density: 0.6 } }
            },
            {
                id: 'MAIN_A', name: 'Frantic Riff', duration: { percent: 35 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }], v1Options: [{ name: 'synth', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v1Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: {
                        pattern: 'composer',
                        density: { min: 0.8, max: 1.0 },
                        useSnare: true, kickVolume: 1.1, usePerc: true, ride: { enabled: true }, useGhostHat: true
                    },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 },
                bundles: [{ id: 'BLUES_ANX_MAIN_A_BUNDLE', name: 'Main Riff A', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', density: 0.7 } },
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 30 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 0.6 }, { name: 'organ', weight: 0.4 }], v1Options: [{ name: 'synth', weight: 0.6 }, { name: 'organ', weight: 0.4 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v1Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: {
                        pattern: 'composer',
                        density: { min: 0.85, max: 1.0 },
                        useSnare: true, kickVolume: 1.2, usePerc: true, ride: { enabled: true }, useGhostHat: true
                    },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] },
                    bassAccompanimentDouble: { enabled: false, instrument: 'electricGuitar', octaveShift: 0 },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'high' }
                    }
                },
                bundles: [{ id: 'BLUES_ANX_SOLO_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'crash', density: 0.5 } },
            },
            {
                id: 'OUTRO', name: 'Relaxed Fade Out', duration: { percent: 20 },
                layers: { bass: true, drums: false, accompaniment: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'telecaster', weight: 0.5 }, { name: 'blackAcoustic', weight: 0.5 }], v1Options: [{ name: 'acousticGuitar', weight: 0.5 }, {name: 'electricGuitar', weight: 0.5}] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }], density: {min: 0.2, max: 0.4} },
                    melody: { source: 'motif', density: { min: 0.1, max: 0.3 }, register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_ANX_OUTRO_BUNDLE', name: 'Relaxed Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
