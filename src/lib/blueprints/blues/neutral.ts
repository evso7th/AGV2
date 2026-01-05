
import type { MusicBlueprint } from '@/types/music';

export const NeutralBluesBlueprint: MusicBlueprint = {
    id: 'neutral_blues',
    name: 'Mid-Shuffle Chicago',
    description: 'A classic, mid-tempo Chicago blues shuffle.',
    mood: 'contemplative', // Using for neutral mood
    musical: {
        key: { root: 'G', scale: 'ionian', octave: 2 },
        bpm: { base: 72, range: [68, 78], modifier: 1.0 }, // TEMPO ADJUSTED
        timeSignature: { numerator: 4, denominator: 4 }, // Interpreted as 12/8 shuffle
        harmonicJourney: [], // Driven by 12-bar blues structure in the engine
        tensionProfile: { type: 'plateau', peakPosition: 0.4, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Verse 1-2', duration: { percent: 25 },
                introRules: {
                    allowedInstruments: ['drums', 'bass', 'accompaniment', 'harmony'],
                    buildUpSpeed: 0.4
                },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, useSnare: true, useGhostHat: true, ride: { enabled: false } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { source: 'harmony_top_note', register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_NEUTRAL_INTRO_BUNDLE', name: 'Verses 1-2', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Solo Section', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { 
                        strategy: 'weighted', 
                        v2Options: [
                            { name: 'guitar_shineOn', weight: 0.7 },
                            { name: 'synth_ambient_pad_lush', weight: 0.1 },
                            { name: 'mellotron', weight: 0.1 },
                            { name: 'mellotron_flute_intimate', weight: 0.1 }
                        ],
                         v1Options: [
                            { name: 'electricGuitar', weight: 0.7 },
                            { name: 'ambientPad', weight: 0.1 },
                            { name: 'mellotron', weight: 0.1 },
                            { name: 'flute', weight: 0.1 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.0, ride: { enabled: false } },
                    melody: { density: { min: 0.5, max: 0.7 }, source: 'motif', register: { preferred: 'mid' } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                },
                bundles: [{ id: 'BLUES_NEUTRAL_MAIN_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'OUTRO', name: 'Final Verses', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 }, useSnare: true, useGhostHat: true, ride: { enabled: false } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note', register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_NEUTRAL_OUTRO_BUNDLE', name: 'Last Verse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
