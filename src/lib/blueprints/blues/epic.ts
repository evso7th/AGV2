
import type { MusicBlueprint } from '@/types/music';

export const EpicBluesBlueprint: MusicBlueprint = {
    id: 'epic_blues',
    name: 'Ascending Blues Epic',
    description: 'A slow-building, powerful blues-rock piece that grows from a simple beat to a full-blown guitar solo.',
    mood: 'epic',
    musical: {
        key: { root: 'E', scale: 'mixolydian', octave: 2 },
        bpm: { base: 84, range: [78, 90], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 }, // Will be interpreted with a shuffle feel by the engine
        harmonicJourney: [], // Standard 12-bar blues progression will be used by the engine
        tensionProfile: { type: 'crescendo', peakPosition: 0.8, curve: (p, pp) => Math.pow(p, 1.5) }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'The Spark', duration: { percent: 15 },
                layers: { drums: true, accompaniment: true, bass: true, harmony: true, melody: true },
                introRules: {
                    allowedInstruments: ['drums', 'bass', 'accompaniment', 'melody'],
                    buildUpSpeed: 0.4
                },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                            { name: 'guitarChords', weight: 0.5 },
                            { name: 'violin', weight: 0.25 },
                            { name: 'flute', weight: 0.25 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.3, max: 0.5 }, useSnare: true, useGhostHat: true, kickVolume: 0.0, usePerc: false, ride: { enabled: false } },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 } 
                    },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], portamento: 0.05 }, // Adding portamento effect
                    melody: { source: 'harmony_top_note' } // Melody is silent here but rule is needed
                },
                bundles: [{ id: 'EPIC_BLUES_INTRO_BUNDLE', name: 'Beat and Organ', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', crescendo: true } },
            },
            {
                id: 'VERSE', name: 'Main Theme', duration: { percent: 35 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                            { name: 'guitarChords', weight: 0.5 },
                            { name: 'violin', weight: 0.25 },
                            { name: 'flute', weight: 0.25 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.6, max: 0.8 }, useSnare: true, useGhostHat: true, kickVolume: 1.1, usePerc: true, ride: { enabled: false } },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 } 
                    },
                    melody: { source: 'motif', density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'EPIC_BLUES_VERSE_BUNDLE', name: 'Theme', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'tom', crescendo: true } },
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 30 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                            { name: 'guitarChords', weight: 0.5 },
                            { name: 'violin', weight: 0.25 },
                            { name: 'flute', weight: 0.25 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.8, max: 1.0 }, kickVolume: 1.3, ride: { enabled: false } },
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.7, max: 0.9 }, // Higher density for solo
                        register: { preferred: 'mid' }
                    },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 }
                    },
                },
                bundles: [{ id: 'EPIC_BLUES_SOLO_BUNDLE', name: 'Lead Break', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'crash' } },
            },
            {
                id: 'OUTRO', name: 'Final Riff', duration: { percent: 20 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                    harmony: {
                        strategy: 'weighted',
                        options: [
                            { name: 'guitarChords', weight: 0.5 },
                            { name: 'violin', weight: 0.25 },
                            { name: 'flute', weight: 0.25 }
                        ]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.6, max: 0.8 }, useSnare: true, useGhostHat: true, kickVolume: 1.1, ride: { enabled: false } },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 }
                    },
                    melody: { source: 'motif', density: { min: 0.3, max: 0.5 } } // Return to main theme density
                },
                bundles: [{ id: 'EPIC_BLUES_OUTRO_BUNDLE', name: 'Outro Theme', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
