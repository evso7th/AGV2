
import type { MusicBlueprint } from '@/types/music';

export const AnxiousTranceBlueprint: MusicBlueprint = {
    id: 'anxious_trance',
    name: 'Glitch in the System',
    description: 'Fast, chaotic, and glitchy trance with a sense of urgency.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'locrian', octave: 2 },
        bpm: { base: 144, range: [142, 148], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'wave', peakPosition: 0.5, curve: (p, pp) => 0.5 + 0.5 * Math.sin(p * Math.PI * 8) } // Very fast, nervous wave
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO_1', name: 'Signal Lost', duration: { percent: 10 },
                layers: { sfx: true, accompaniment: true, drums: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 1.0 }], v1Options: [{ name: 'synth', weight: 1.0 }] } },
                instrumentRules: { 
                    accompaniment: { techniques: [{value: 'arpeggio-fast', weight: 1.0}], density: {min: 0.3, max: 0.5} },
                    drums: { pattern: 'composer', density: {min: 0.7, max: 0.9}, useSnare: true, kickVolume: 0.9, usePerc: true, alternatePerc: true },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'TR_ANX_INTRO1', name: 'Static', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'Glitching Beat', duration: { percent: 10 },
                layers: { sfx: true, drums: true, accompaniment: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] } },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, useSnare: true, kickVolume: 1.0, usePerc: true, alternatePerc: true, rareKick: true },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'TR_ANX_INTRO2', name: 'Broken Sync', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'System Alert', duration: { percent: 25 },
                layers: { bass: true, sfx: true, drums: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 1.0 }], v2Options: [{ name: 'theremin', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 }, useSnare: true, usePerc: true, kickVolume: 1.2 },
                    bass: { techniques: [{value: 'glissando', weight: 0.7}, {value: 'pulse', weight: 0.3}]},
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Alert', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { crescendo: true } },
            },
            {
                id: 'PEAK', name: 'Red Alert', duration: { percent: 40 },
                layers: { bass: true, melody: true, sfx: true, drums: true, accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'electricGuitar', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'resonantGliss', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 1.0 }], v2Options: [{ name: 'theremin', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.9, max: 1.0 }, useSnare: true, usePerc: true, alternatePerc: true, kickVolume: 1.5 },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Chaos', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Corruption', duration: { percent: 15 },
                layers: { sfx: true, drums: true, accompaniment: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] } },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.4, max: 0.6 }, useSnare: false, rareKick: true, usePerc: true },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Decay', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
