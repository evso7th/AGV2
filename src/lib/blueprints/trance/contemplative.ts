
import type { MusicBlueprint } from '@/types/music';

export const ContemplativeTranceBlueprint: MusicBlueprint = {
    id: 'contemplative_trance',
    name: 'Focus Flow',
    description: 'Сдержанный и гипнотический транс для глубокой концентрации.',
    mood: 'contemplative',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 3 },
        bpm: { base: 120, range: [118, 124], modifier: 1.0 }, // ЗАМЕДЛЕНО
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.2, curve: (p, pp) => p < pp ? p / pp : (p < 0.9 ? 1.0 : 1 - ((p - 0.9) / 0.1)) }
    },
    structure: {
        totalDuration: { preferredBars: 128 },
        parts: [
            {
                id: 'INTRO', name: 'Focus', duration: { percent: 20 }, // УВЕЛИЧЕНО
                layers: { accompaniment: true, sfx: true, bass: true, drums: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 }, useSnare: false, useGhostHat: true },
                    bass: { techniques: [{ value: 'pulse', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'CT_INTRO_1', name: 'Initial Pulse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Deep Work', duration: { percent: 60 }, // УМЕНЬШЕНО
                layers: { bass: true, accompaniment: true, drums: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 1.0 }], v2Options: [{ name: 'synth', weight: 1.0 }] },
                    bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, useSnare: false, useGhostHat: true }, // СМЯГЧЕНО
                    accompaniment: { techniques: [{ value: 'arpeggio-fast', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [
                  { id: 'CT_MAIN_1', name: 'Flow State', duration: { percent: 100 }, characteristics: {}, phrases: {} }
                ],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Cool Down', duration: { percent: 20 }, // УВЕЛИЧЕНО
                layers: { accompaniment: true, sfx: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { source: 'harmony_top_note' }
                },
                bundles: [{ id: 'CT_OUTRO_1', name: 'Fade', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
