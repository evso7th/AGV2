
import type { MusicBlueprint } from '@/types/music';

export const DreamyBluesBlueprint: MusicBlueprint = {
    id: 'dreamy_blues',
    name: 'Soul-Blues Ballad',
    description: 'A slow, soulful, and emotional blues ballad.',
    mood: 'dreamy',
    musical: {
        key: { root: 'Bb', scale: 'ionian', octave: 2 },
        bpm: { base: 72, range: [68, 78], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 }, // Interpreted as 12/8
        harmonicJourney: [], // 12-bar structure with 7th and 9th chords
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? p/pp : 1 - ((p-pp)/(1-pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 96 }, // 8 loops of 12 bars
        parts: [
            {
                id: 'VERSE', name: 'Verse', duration: { percent: 40 },
                introRules: {
                    allowedInstruments: ['drums', 'bass', 'accompaniment', 'melody'],
                    buildUpSpeed: 0.5
                },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.6 }, { name: 'piano', weight: 0.4 }], v2Options: [{ name: 'organ_soft_jazz', weight: 0.6 }, { name: 'piano', weight: 0.4 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: true, useGhostHat: true, ride: { enabled: true, volume: 0.08, probability: 0.4 } },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] }, 
                    melody: { source: 'motif', density: { min: 0.3, max: 0.5 }, register: { preferred: 'high' } }
                },
                bundles: [{ id: 'BLUES_DREAMY_VERSE_BUNDLE', name: 'Verse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Solo', duration: { percent: 35 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.7 }, { name: 'piano', weight: 0.3 }], v2Options: [{ name: 'organ_soft_jazz', weight: 0.7 }, { name: 'piano', weight: 0.3 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: {
                        pattern: 'composer',
                        density: { min: 0.4, max: 0.6 },
                        useSnare: true,
                        useGhostHat: true,
                        ride: { enabled: true, volume: 0.08, probability: 0.4 }
                    },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] }, 
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'high' }
                    }
                },
                bundles: [{ id: 'BLUES_DREAMY_SOLO_BUNDLE', name: 'Guitar Solo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'ride' } },
            },
            {
                id: 'OUTRO', name: 'Fade Out', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 }, ride: { enabled: true, volume: 0.08, probability: 0.4 } },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 }, register: { preferred: 'high' } } // Return to lower density
                },
                bundles: [{ id: 'BLUES_DREAMY_OUTRO_BUNDLE', name: 'Outro', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
