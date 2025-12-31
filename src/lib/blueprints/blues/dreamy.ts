
import type { MusicBlueprint } from '@/types/music';

export const DreamyBluesBlueprint: MusicBlueprint = {
    id: 'dreamy_blues',
    name: 'Soul-Blues Ballad',
    description: 'A slow, soulful, and emotional blues ballad.',
    mood: 'dreamy',
    musical: {
        key: { root: 'Bb', scale: 'ionian', octave: 2 },
        bpm: { base: 78, range: [72, 86], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 }, // Interpreted as 12/8
        harmonicJourney: [], // 12-bar structure with 7th and 9th chords
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? p/pp : 1 - ((p-pp)/(1-pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 96 }, // 8 loops of 12 bars
        parts: [
            {
                id: 'VERSE', name: 'Verse', duration: { percent: 60 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, melody: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.6 }, { name: 'piano', weight: 0.4 }], v2Options: [{ name: 'organ', weight: 0.6 }, { name: 'piano', weight: 0.4 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.3, max: 0.5 }, useSnare: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'motif', density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'BLUES_DREAMY_VERSE_BUNDLE', name: 'Verse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fade Out', duration: { percent: 40 },
                layers: { bass: true, drums: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.2, max: 0.4 } },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
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
