
import type { MusicBlueprint } from '@/types/music';

export const AnxiousAmbientBlueprint: MusicBlueprint = {
    id: 'anxious_ambient',
    name: 'Nervous System',
    description: 'Напряженный, беспокойный эмбиент с неровными ритмами.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 66, range: [64, 70], modifier: 1.1 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 4) } // Faster wave
    },
    structure: {
        totalDuration: { preferredBars: 150 },
        parts: [
            {
                id: 'INTRO', name: 'Unease', duration: { percent: 15 },
                layers: { sfx: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.8 }, { name: 'theremin', weight: 0.2 }], v2Options: [{ name: 'synth', weight: 0.8 }, { name: 'theremin', weight: 0.2 }] }
                },
                instrumentRules: {
                    accompaniment: { density: { min: 0.2, max: 0.4 }, techniques: [{ value: 'arpeggio-fast', weight: 1.0 }] },
                    sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.7 }, { name: 'laser', weight: 0.3 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ANX_INTRO_1', name: 'Jitters', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Rising Panic', duration: { percent: 30 },
                layers: { bass: true, drums: true, sfx: true, accompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v1Options: [{ name: 'resonantGliss', weight: 1.0 }], v2Options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 1.0 }], v2Options: [{ name: 'theremin', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.7 }, useSnare: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'glissando', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ANX_BUILD_1', name: 'Escalation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'MAIN', name: 'System Overload', duration: { percent: 40 },
                layers: { bass: true, drums: true, melody: true, sfx: true, accompaniment: true },
                 instrumentation: {
                    bass: { strategy: 'weighted', v1Options: [{ name: 'resonantGliss', weight: 1.0 }], v2Options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'guitar_muffLead', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 1.3 },
                    melody: { register: { preferred: 'high' }, source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ANX_MAIN_1', name: 'Chaos', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Aftershock', duration: { percent: 15 },
                layers: { sfx: true, accompaniment: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: {
                    sfx: { eventProbability: 0.4, categories: [{ name: 'laser', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'ANX_OUTRO_1', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
