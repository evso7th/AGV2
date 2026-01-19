
import type { MusicBlueprint } from '@/types/music';

export const EnthusiasticBluesBlueprint: MusicBlueprint = {
    id: 'enthusiastic_blues',
    name: 'Blues Rock Ascent',
    description: 'An energetic, driving blues-rock blueprint focused on powerful guitar solos.',
    mood: 'enthusiastic',
    musical: {
        key: { root: 'E', scale: 'mixolydian', octave: 2 },
        bpm: { base: 84, range: [82, 90], modifier: 1.0 }, // TEMPO ADJUSTED
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // Driven by 12-bar blues structure in the engine
        tensionProfile: { type: 'crescendo', peakPosition: 0.75, curve: (p, pp) => Math.pow(p, 1.2) }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Riff Setup', duration: { percent: 15 },
                introRules: {
                    instrumentPool: ['drums', 'bass', 'accompaniment'],
                    stages: 4
                },
                layers: { bass: true, drums: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, useSnare: true, useGhostHat: true },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 } 
                    },
                    melody: { source: 'harmony_top_note', register: { preferred: 'high' } }
                },
                bundles: [{ id: 'BLUES_ENT_INTRO_BUNDLE', name: 'Verse 1', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Lead Guitar Solo', duration: { percent: 60 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_muffLead', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.3, ride: { enabled: true } }, // RIDE ADDED
                    melody: {
                        density: { min: 0.5, max: 0.7 },
                        source: 'motif',
                        register: { preferred: 'high' }
                    },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 }
                    },
                },
                bundles: [{ id: 'BLUES_ENT_MAIN_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { crescendo: true } },
            },
            {
                id: 'OUTRO', name: 'Final Riff Out', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 } },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 }
                    },
                    melody: { source: 'harmony_top_note', register: { preferred: 'high' } }
                },
                bundles: [{ id: 'BLUES_ENT_OUTRO_BUNDLE', name: 'Final Verse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
