
import type { MusicBlueprint } from '@/types/music';

export const MelancholicTranceBlueprint: MusicBlueprint = {
    id: 'melancholic_trance',
    name: 'Midnight Voyage',
    description: 'Introspective and driving trance with a progressive buildup.',
    mood: 'melancholic',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 3 },
        bpm: { base: 124, range: [120, 128], modifier: 1.0 }, // ЗАМЕДЛЕНО
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'arc', peakPosition: 0.7, curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.2) : 1 - ((p - pp) / (1 - pp)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO_1', name: 'Atmosphere', duration: { percent: 10 }, // УВЕЛИЧЕНО
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: { 
                    accompaniment: { 
                        strategy: 'weighted', 
                        v1Options: [{ name: 'ambientPad', weight: 1.0 }],
                        v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] 
                    } 
                },
                instrumentRules: { 
                    melody: { source: 'harmony_top_note' },
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, useSnare: false }, // СМЯГЧЕНО
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] }
                },
                bundles: [{ id: 'TR_INTRO1_B1', name: 'Pad', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_2', name: 'Pulse', duration: { percent: 10 }, // УВЕЛИЧЕНО
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: { 
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.2, max: 0.4 }, useSnare: false }, // СМЯГЧЕНО
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'TR_INTRO2_B1', name: 'Groove', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO_3', name: 'Anticipation', duration: { percent: 10 }, // УВЕЛИЧЕНО
                layers: { accompaniment: true, sfx: true, bass: true, drums: true, melody: true, harmony: true },
                instrumentation: { 
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'piano', weight: 1.0 }] }
                },
                instrumentRules: { 
                    melody: { density: { min: 0.1, max: 0.25 }, source: 'motif' },
                    drums: { density: { min: 0.3, max: 0.5 } }, // СМЯГЧЕНО
                },
                bundles: [{ id: 'TR_INTRO3_B1', name: 'Tease', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'Journey', duration: { percent: 20 }, // УМЕНЬШЕНО
                layers: { bass: true, accompaniment: true, drums: true, sfx: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'ambient_beat', density: { min: 0.5, max: 0.7 } }, // СМЯГЧЕНО
                    melody: { source: 'motif' } 
                },
                bundles: [{ id: 'BUILD_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 2, parameters: {} },
            },
            {
                id: 'PEAK', name: 'Reflection', duration: { percent: 30 }, // УМЕНЬШЕНО
                layers: { bass: true, melody: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 1.0 }], v2Options: [{ name: 'organ', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] }
                },
                instrumentRules: { 
                    drums: { pattern: 'composer', density: { min: 0.7, max: 0.9 }, kickVolume: 0.9 }, // СМЯГЧЕНО
                    melody: { source: 'motif' } 
                },
                bundles: [{ id: 'PEAK_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fade to Silence', duration: { percent: 15 }, // УМЕНЬШЕНО
                layers: { accompaniment: true, sfx: true },
                instrumentation: { accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] } },
                instrumentRules: { melody: { source: 'motif' } },
                bundles: [{ id: 'OUTRO_BUNDLE_1', name: 'Main', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
