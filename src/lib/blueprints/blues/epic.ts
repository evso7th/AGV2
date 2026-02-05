import type { MusicBlueprint } from '@/types/music';

export const EpicBluesBlueprint: MusicBlueprint = {
    id: 'epic_blues',
    name: 'Blues Brothers Epic',
    description: 'A slow-building, powerful blues-rock piece that grows into a full-blown explosive solo.',
    mood: 'epic',
    musical: {
        key: { root: 'E', scale: 'mixolydian', octave: 2 },
        bpm: { base: 110, range: [100, 125], modifier: 1.0 }, // #ОБНОВЛЕНО (ПЛАН 94.1): Поднято для драйва.
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'crescendo', peakPosition: 0.8, curve: (p, pp) => Math.pow(p, 1.5) }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO', name: 'The Spark', duration: { percent: 15 },
                layers: { drums: true, accompaniment: true, bass: true, harmony: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.3, max: 0.5 }, useSnare: true, useGhostHat: true, kickVolume: 0.9, usePerc: false, ride: { enabled: false } },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 } 
                    },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], portamento: 0.05 },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'EPIC_BLUES_INTRO_BUNDLE', name: 'Beat and Organ', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'tom', crescendo: true } },
            },
            {
                id: 'VERSE', name: 'Main Theme', duration: { percent: 35 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] },
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.6, max: 0.8 }, useSnare: true, useGhostHat: true, kickVolume: 1.1, usePerc: true, ride: { enabled: false } },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 } 
                    },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.7 } }
                },
                bundles: [{ id: 'EPIC_BLUES_VERSE_BUNDLE', name: 'Theme', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: { instrument: 'tom', crescendo: true } },
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 30 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                 instrumentation: {
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_muffLead', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.8, max: 1.0 }, kickVolume: 1.3, ride: { enabled: true } },
                    melody: { 
                        source: 'blues_solo', 
                        density: { min: 0.9, max: 1.0 },
                        register: { preferred: 'high' },
                        soloPlan: 'S_ACTIVE' // #ОБНОВЛЕНО: Принудительный выбор активного соло-плана.
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
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }],
                        v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }]
                    },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'guitar_shineOn', weight: 1.0 }], v2Options: [{ name: 'guitar_shineOn', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_epic', density: { min: 0.6, max: 0.8 }, useSnare: true, useGhostHat: true, kickVolume: 1.1, ride: { enabled: false } },
                    bass: { 
                        techniques: [{ value: 'walking', weight: 1.0 }],
                        presetModifiers: { octaveShift: 1 }
                    },
                    melody: { source: 'blues_solo', density: { min: 0.3, max: 0.5 } } 
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
