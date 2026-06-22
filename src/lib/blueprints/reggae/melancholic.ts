
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Midnight Dub" (Reggae v1.4 — Standard Kit Integration).
 * #ЧТО: ПЛАН №1141 — Установлен кит 'standard' как дефолт для всех секций.
 */
export const MelancholicReggaeBlueprint: MusicBlueprint = {
    id: 'melancholic_reggae',
    name: 'Midnight Dub Station',
    description: 'Deep roots dub with atmospheric echoes and a bluesy instrumental palette.',
    mood: 'melancholic',
    musical: {
        key: { root: 'A', scale: 'dorian', octave: 1 },
        bpm: { base: 72, range: [68, 76], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: (p: number) => 0.4 + 0.2 * Math.sin(p * Math.PI) }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO', name: 'MistyMorning', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true, bass: true, harmony: true, pianoAccompaniment: true, drums: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] },
                    drums: { kitName: 'standard', pattern: 'ambient_beat' }
                },
                bundles: [{ id: 'REG_INTRO_1', name: 'Mist', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'The Roots Cycle', duration: { percent: 87 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'telecaster', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { kitName: 'standard', pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } },
                    melody: { source: 'motif', density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'REG_MAIN_1', name: 'The Riddim', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Smoke & Echo', duration: { percent: 10 },
                layers: { accompaniment: true, sfx: true, harmony: true, bass: true, drums: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { kitName: 'standard', pattern: 'ambient_beat' }
                },
                bundles: [{ id: 'REG_OUTRO_1', name: 'Silence', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
