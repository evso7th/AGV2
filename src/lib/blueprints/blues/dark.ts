
import type { MusicBlueprint } from '@/types/music';

export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Ritual Blues',
    description: 'A slow, heavy, and ritualistic blues with a sense of dread.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 62, range: [60, 66], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // This will be driven by the parts now
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.4) : 1 - Math.pow((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 120 },
        parts: [
            {
                id: 'INTRO_1', name: 'Dark Telecaster Intro', duration: { percent: 15 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true },
                instrumentation: {
                    melody: {
                        strategy: 'weighted',
                        v2Options: [{ name: 'darkTelecaster', weight: 1.0 }]
                    },
                    accompaniment: {
                        strategy: 'weighted',
                        v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'power-chords', weight: 1.0 }], density: { min: 0.1, max: 0.3 } },
                    melody: {
                        source: 'blues_solo',
                        soloPlan: 'S06', // <--- ВОТ ИСПРАВЛЕНИЕ
                        soloToPatternRatio: 0.5,
                        density: { min: 0.2, max: 0.4 }
                    },
                    sfx: { eventProbability: 0.15, categories: [{ name: 'dark', weight: 1.0 }] },
                    sparkles: { eventProbability: 0.2, categories: [{ name: 'dark', weight: 1.0 }] }
                },
                bundles: [ { id: 'DARK_INTRO_BUNDLE_1', name: 'Drone', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'First Echoes', duration: { percent: 10 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, drums: true, sparkles: true },
                instrumentation: { 
                  bass: { strategy: 'weighted', v1Options: [{ name: 'ambientDrone', weight: 1.0 }], v2Options: [{ name: 'ambientDrone', weight: 1.0 }] },
                  accompaniment: { strategy: 'weighted', v1Options: [{name: 'synth_cave_pad', weight: 1.0}], v2Options: [{name: 'synth_cave_pad', weight: 1.0}] },
                  melody: { strategy: 'weighted', v1Options: [{name: 'guitar_shineOn', weight: 1.0}], v2Options: [{name: 'guitar_shineOn', weight: 1.0}] }
                },
                instrumentRules: { 
                    drums: { enabled: true, pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, rareKick: true, usePerc: true, alternatePerc: false },
                    sfx: { eventProbability: 0.2, categories: [{name: 'dark', weight: 1.0}] },
                    sparkles: { eventProbability: 0.2, categories: [{ name: 'dark', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [ { id: 'DARK_INTRO_BUNDLE_2', name: 'Echoes', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'The Chant', duration: { percent: 25 },
                layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true, sparkles: true },
                harmonicJourney: [{ center: 'i', satellites: ['iv'], weight: 0.7 }],
                 instrumentation: {
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_muffLead', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'blues_solo', soloPlan: "S06", density: { min: 0.5, max: 0.9 } },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 0.8 }, { value: 'arpeggio-slow', weight: 0.2 }] },
                    sparkles: { eventProbability: 0.15, categories: [{name: 'dark', weight: 1.0}] }
                },
                bundles: [{ id: 'DARK_MAIN_BUNDLE_1', name: 'The Chant', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_2', name: 'Ritual Peak', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, sfx: true, harmony: true, sparkles: true },
                harmonicJourney: [{ center: 'bVI', satellites: ['V'], weight: 0.6 }],
                 instrumentation: {
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_muffLead', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.5, max: 0.7 } },
                    melody: { source: 'blues_solo', soloPlan: "S07", density: { min: 0.6, max: 1.0 } },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 0.9 }, { value: 'arpeggio-fast', weight: 0.1 }] },
                    sparkles: { eventProbability: 0.2, categories: [{name: 'dark', weight: 1.0}] }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_B_BUNDLE', name: 'Intensity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'tom' } },
            },
            {
                id: 'OUTRO', name: 'Fading Embers', duration: { percent: 25 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true },
                instrumentRules: {
                    drums: { density: { min: 0.2, max: 0.4 } },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'motif' },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'BLUES_DARK_OUTRO_1', name: 'Embers', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
