
import type { MusicBlueprint } from '@/types/music';

export const DreamyTranceBlueprint: MusicBlueprint = {
    id: 'dreamy_trance',
    name: 'Starlight Echoes',
    description: 'Atmospheric and soaring trance with lush pads and a hypnotic rhythm.',
    mood: 'dreamy',
    musical: {
        key: { root: 'F', scale: 'lydian', octave: 3 },
        bpm: { base: 130, range: [128, 134], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.65, curve: (p, pp) => p < pp ? p / pp : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Nebula', duration: { percent: 20 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 }, kickVolume: 0.9 },
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'DREAMY_INTRO_B1', name: 'Drift', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Starlight', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.6, max: 0.8 }, useSnare: true },
                    sparkles: { eventProbability: 0.15 },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'DREAMY_BUILD_B1', name: 'Glow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Supernova', duration: { percent: 35 },
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true, sparkles: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.7 }, { name: 'organ', weight: 0.3 }], v2Options: [{ name: 'synth', weight: 0.7 }, { name: 'organ', weight: 0.3 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'theremin', weight: 0.6 }, { name: 'synth', weight: 0.4 }], v2Options: [{ name: 'theremin', weight: 0.6 }, { name: 'synth', weight: 0.4 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.8, max: 1.0 }, kickVolume: 1.1, useSnare: true },
                    bass: { techniques: [{value: 'rolling', weight: 1.0}] },
                    melody: { source: 'harmony_top_note' } 
                },
                bundles: [{ id: 'DREAMY_PEAK_B1', name: 'Burst', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Echoes', duration: { percent: 20 },
                layers: { accompaniment: true, sfx: true, sparkles: true },
                instrumentation: { 
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] } 
                },
                instrumentRules: {
                    sparkles: { eventProbability: 0.2 },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'DREAMY_OUTRO_B1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
