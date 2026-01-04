
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
                id: 'INTRO', name: 'Verse 1', duration: { percent: 25 },
                layers: { bass: true, drums: false, accompaniment: true, harmony: true, sfx: false },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.1, max: 0.2 }, useSnare: false, rareKick: true, usePerc: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    melody: { source: 'harmony_top_note', register: { preferred: 'low' } }
                },
                bundles: [{ id: 'BLUES_INTRO_BUNDLE_1', name: 'Verse 1', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Solo Section', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true, sfx: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] },
                    bassAccompanimentDouble: { enabled: true, instrument: 'electricGuitar', octaveShift: 1 }
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        density: { min: 0.4, max: 0.6 }, 
                        kickVolume: 1.2,
                        usePerc: true,
                        fills: { onBundleBoundary: true },
                        useGhostHat: true
                    },
                    melody: {
                        density: { min: 0.4, max: 0.6 },
                        source: 'motif',
                        register: { preferred: 'low' }
                    },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    sfx: { eventProbability: 0.1, categories: [{ name: 'voice', weight: 0.8 }, { name: 'dark', weight: 0.2 }] }
                },
                bundles: [{ id: 'BLUES_MAIN_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {}, outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'crash', density: 0.4, dynamics: 'mf' } } }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'OUTRO', name: 'Final Verse', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useGhostHat: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] },
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    sfx: { eventProbability: 0.1, categories: [{ name: 'voice', weight: 0.8 }, { name: 'dark', weight: 0.2 }] },
                    melody: { source: 'harmony_top_note', register: { preferred: 'low' } }
                },
                bundles: [{ id: 'BLUES_OUTRO_BUNDLE', name: 'Last Verse', duration: { percent: 100 }, characteristics: {}, phrases: {}, outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'crash', density: 0.2, dynamics: 'p' } } }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
