
import type { MusicBlueprint } from '@/types/music';

export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'Winter Blues (Calm Foundation)',
    description: 'A deep, melancholic blues based on a calm, riff-based structure, featuring a wide range of guitars.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'aeolian', octave: 2 },
        bpm: { base: 66, range: [64, 72], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // 12-bar structure
        tensionProfile: { type: 'plateau', peakPosition: 0.3, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Main Riff', duration: { percent: 40 },
                introRules: {
                    instrumentPool: ['bass', 'drums', 'accompaniment', 'melody'],
                    stages: 4,
                },
                layers: { bass: true, drums: true, accompaniment: true, harmony: false, melody: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'organ', weight: 0.8 }, { name: 'mellotron', weight: 0.2 }], 
                        v2Options: [{ name: 'organ_soft_jazz', weight: 0.8 }, { name: 'mellotron', weight: 0.2 }] 
                    },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [
                            { name: 'acousticGuitar', weight: 0.5 },
                            { name: 'electricGuitar', weight: 0.5 },
                        ],
                        v2Options: [
                            { name: 'telecaster', weight: 0.5 },
                            { name: 'blackAcoustic', weight: 0.5 },
                        ]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                          { name: 'guitarChords', weight: 0.6 },
                          { name: 'piano', weight: 0.4 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.1, max: 0.3 }, useSnare: false, usePerc: true, rareKick: true }, // VERY SOFT INTRO
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.3, max: 0.5 } }, // Use Riffs in Intro
                    accompaniment: { density: {min: 0.1, max: 0.3} },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.2, max: 0.4 }, 
                        register: { preferred: 'mid' },
                        techniques: [{ value: 'arpeggio-slow', weight: 0.4 }, { value: 'long-chords', weight: 0.6 }] 
                    }
                },
                bundles: [{ id: 'BLUES_WINTER_VERSE_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Solo', duration: { percent: 35 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: false },
                 instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'organ', weight: 0.7 }, { name: 'ambientPad', weight: 0.3 }], 
                        v2Options: [{ name: 'organ_soft_jazz', weight: 0.7 }, { name: 'synth_ambient_pad_lush', weight: 0.3 }] 
                    },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [
                            { name: 'electricGuitar', weight: 1.0 },
                        ],
                        v2Options: [
                            { name: 'guitar_shineOn', weight: 0.5 },
                            { name: 'guitar_muffLead', weight: 0.5 },
                        ]
                    },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                          { name: 'piano', weight: 1.0 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.5, max: 0.7 }, ride: { enabled: true } },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'mid' }
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                },
                bundles: [{ id: 'BLUES_WINTER_SOLO_BUNDLE', name: 'Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
             {
                id: 'OUTRO', name: 'Return to Riff', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'organ', weight: 0.6 }, { name: 'ambientPad', weight: 0.4 }], 
                        v2Options: [{ name: 'organ_soft_jazz', weight: 0.6 }, { name: 'synth_ambient_pad_lush', weight: 0.4 }] 
                    },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [
                           { name: 'acousticGuitar', weight: 0.5 },
                           { name: 'electricGuitar', weight: 0.5 },
                        ],
                        v2Options: [
                            { name: 'telecaster', weight: 0.5 },
                            { name: 'blackAcoustic', weight: 0.5 },
                        ]
                    },
                     harmony: {
                        strategy: 'weighted',
                        options: [
                          { name: 'guitarChords', weight: 0.6 },
                          { name: 'piano', weight: 0.4 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_calm', density: { min: 0.4, max: 0.6 } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 }, register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'BLUES_WINTER_OUTRO_BUNDLE', name: 'Final Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
