
import type { MusicBlueprint } from '@/types/music';

export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Heavy Sorrow Blues',
    description: 'A slow, heavy, and gritty blues with a lot of tension.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 62, range: [60, 66], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // Will be driven by a 12-bar structure in the engine
        tensionProfile: { type: 'plateau', peakPosition: 0.6, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'INTRO_1', name: 'Verse 1', duration: { percent: 15 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, sfx: false },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.1, max: 0.2 }, useSnare: false, rareKick: true, usePerc: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BLUES_INTRO_BUNDLE_1', name: 'Verse 1', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'Verse 2', duration: { percent: 10 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, sfx: false },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.1, max: 0.2 }, useSnare: false, rareKick: true, usePerc: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BLUES_INTRO_BUNDLE_2', name: 'Verse 2', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_3', name: 'Verse 3', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, sfx: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, useSnare: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    sfx: { eventProbability: 0.25, categories: [{ name: 'voice', weight: 0.8 }, { name: 'dark', weight: 0.2 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BLUES_INTRO_BUNDLE_3', name: 'Verse 3', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Solo Section', duration: { percent: 35 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sfx: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 }
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.6, max: 0.8 }, 
                        kickVolume: 1.2,
                        ride: { enabled: true, quietWindows: [ { start: 0.0, end: 0.2 }, { start: 0.4, end: 0.6 }, { start: 0.8, end: 1.0 } ] },
                        usePerc: true
                    },
                    melody: { density: { min: 0.4, max: 0.6 }, source: 'motif' },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    sfx: { eventProbability: 0.25, categories: [{ name: 'voice', weight: 0.8 }, { name: 'dark', weight: 0.2 }] }
                },
                bundles: [{ id: 'BLUES_MAIN_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'OUTRO', name: 'Final Verse', duration: { percent: 15 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    sfx: { eventProbability: 0.25, categories: [{ name: 'voice', weight: 0.8 }, { name: 'dark', weight: 0.2 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BLUES_OUTRO_BUNDLE', name: 'Last Verse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
