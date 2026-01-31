
import type { MusicBlueprint } from '@/types/music';

export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Ritual Blues',
    description: 'A slow, heavy, and ritualistic blues with a sense of dread.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 62, range: [60, 66], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // This will be driven by the parts now
        tensionProfile: { type: 'arc', peakPosition: 0.6, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.4) : 1 - Math.pow((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 120 },
        parts: [
            // --- INTRO (12 bars total, sliced from one 12-bar generation) ---
            {
                id: 'INTRO_1', name: 'Organ Drone', duration: { percent: 4 },
                layers: { accompaniment: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{name: 'organ_soft_jazz', weight: 0.5}, {name: 'synth_cave_pad', weight: 0.5}], v2Options: [{name: 'organ_soft_jazz', weight: 0.5}, {name: 'synth_cave_pad', weight: 0.5}] },
                },
                instrumentRules: { 
                    melody: { source: 'motif' } 
                },
                bundles: [{ id: 'DARK_INTRO_1_BUNDLE', name: 'Drone', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'Guitar & Beat', duration: { percent: 4 },
                layers: { accompaniment: true, bass: true, drums: true, melody: true },
                instrumentation: {
                    melody: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v1Options: [{ name: 'ambientDrone', weight: 1.0 }], v2Options: [{ name: 'bass_ambient_dark', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.1, max: 0.2 }, useSnare: false, rareKick: true },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'DARK_INTRO_2_BUNDLE', name: 'First Pulse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_3', name: 'Harmony Enter', duration: { percent: 4 },
                layers: { accompaniment: true, bass: true, drums: true, melody: true, harmony: true },
                 instrumentation: {
                    harmony: { strategy: 'weighted', options: [{ name: 'piano', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                },
                instrumentRules: { drums: { density: { min: 0.2, max: 0.3 } }, melody: { source: 'motif' } },
                bundles: [{ id: 'DARK_INTRO_3_BUNDLE', name: 'Full Intro', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            // --- MAIN (3 sections of 32 bars each) ---
            {
                id: 'MAIN_1', name: 'The Chant', duration: { percent: 27 },
                layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true, sparkles: true },
                harmonicJourney: [{ center: 'i', satellites: ['iv'], weight: 0.7 }],
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'blues_solo', soloDramaturgy: { phraseLength: 4, callLickTags: ['slow-bend', 'minor'], responseLickTags: ['low-register', 'sparse'] } }
                },
                bundles: [ { id: 'DARK_MAIN_BUNDLE_1', name: 'The Chant', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            },
            {
                id: 'MAIN_2', name: 'Ritual Peak', duration: { percent: 27 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, sfx: true, harmony: true, sparkles: true },
                harmonicJourney: [{ center: 'bVI', satellites: ['V'], weight: 0.6 }],
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.5, max: 0.7 }, ride: { enabled: true, probability: 0.3 } },
                    melody: { source: 'blues_solo', soloDramaturgy: { phraseLength: 4, callLickTags: ['high-sustain', 'tense'], responseLickTags: ['fast-run', 'chromatic'] } }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_B_BUNDLE', name: 'Intensity', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'ride' } },
            },
            {
                id: 'MAIN_3', name: 'Waning Chant', duration: { percent: 26 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, sfx: true, harmony: true, sparkles: true },
                harmonicJourney: [{ center: 'i', satellites: ['v'], weight: 0.8 }],
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_dark', density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'blues_solo', soloDramaturgy: { phraseLength: 4, callLickTags: ['question', 'quiet'], responseLickTags: ['final', 'resolve'] } }
                },
                bundles: [{ id: 'BLUES_DARK_MAIN_C_BUNDLE', name: 'Waning', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            // --- OUTRO (12 bars total, sliced) ---
            {
                id: 'OUTRO_1', name: 'Fading Embers', duration: { percent: 4 },
                layers: { accompaniment: true, bass: true, drums: true, sfx: true },
                instrumentRules: {
                    drums: { density: { min: 0.2, max: 0.4 }, ride: { enabled: false } },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'BLUES_DARK_OUTRO_1', name: 'Embers', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO_2', name: 'Cold Ash', duration: { percent: 3 }, // Adjusted to 3 to make total 100
                layers: { accompaniment: true, sfx: true },
                instrumentRules: {
                    accompaniment: { density: { min: 0.1, max: 0.2 } },
                    melody: { source: 'motif' }
                },
                bundles: [{ id: 'BLUES_DARK_OUTRO_2', name: 'Ashes', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO_3', name: 'Silence', duration: { percent: 3 }, // Adjusted to 3
                layers: { sfx: true },
                instrumentRules: { sfx: { eventProbability: 0.1 }, melody: { source: 'motif' } },
                bundles: [{ id: 'BLUES_DARK_OUTRO_3', name: 'Final Echo', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
