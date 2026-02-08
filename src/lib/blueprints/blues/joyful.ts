import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Detroit Shuffle" (v6.0 - Chronos Alignment).
 * #ЧТО: BPM расширен до 90-110 для уверенного драйва.
 */
export const JoyfulBluesBlueprint: MusicBlueprint = {
    id: 'joyful_blues',
    name: 'Detroit Shuffle',
    description: 'An energetic, joyful, and danceable blues shuffle. Fast and driving.',
    mood: 'joyful',
    musical: {
        key: { root: 'A', scale: 'ionian', octave: 2 },
        bpm: { base: 100, range: [90, 110], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.7, curve: (p, pp) => p }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO', name: 'Verse 1-2', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, useSnare: true, useGhostHat: true, usePerc: true, ride: { enabled: false }, useBrushes: true },
                    bass: { 
                        techniques: [{ value: 'boogie', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 } 
                    },
                    melody: { source: 'harmony_top_note', register: { preferred: 'high' } }
                },
                bundles: [{ id: 'BLUES_JOY_INTRO_BUNDLE', name: 'Verses 1-2', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Solo Section', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sparkles: true },
                 instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 }, kickVolume: 1.1, useSnare: true, useGhostHat: true, usePerc: true, ride: { enabled: false }, useBrushes: true },
                    melody: {
                        source: 'blues_solo', 
                        density: { min: 0.7, max: 0.9 },
                        register: { preferred: 'high' }
                    },
                    bass: { 
                        techniques: [{ value: 'boogie', weight: 1.0 }], 
                        presetModifiers: { octaveShift: 1 }
                    },
                },
                bundles: [{ id: 'BLUES_JOY_MAIN_BUNDLE', name: 'Guitar Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'OUTRO', name: 'Final Verses', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, useSnare: true, useGhostHat: true, usePerc: true, ride: { enabled: false }, useBrushes: true },
                    bass: { 
                        techniques: [{ value: 'boogie', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 } 
                    },
                    melody: { source: 'harmony_top_note', register: { preferred: 'high' } }
                },
                bundles: [{ id: 'BLUES_JOY_OUTRO_BUNDLE', name: 'Outro Verses', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [
        { type: 'sparkle', probability: 0.1, activeParts: ['MAIN'] },
    ],
    continuity: {},
    rendering: {}
};
