
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Cloud Dub" (Reggae Dreamy v1.0).
 * #ЧТО: Воздушный дабовый реджи — простор, эхо, разрежённая «парящая» мелодия.
 * Риддим-палитра (kit standard, organ_soft_jazz, bass_jazz_warm) — как у melancholic.
 */
export const DreamyReggaeBlueprint: MusicBlueprint = {
    id: 'dreamy_reggae',
    name: 'Cloud Dub',
    description: 'Airy dub reggae with spacious echoes and a sparse, floating melody in D Dorian.',
    mood: 'dreamy',
    musical: {
        key: { root: 'D', scale: 'dorian', octave: 1 },
        bpm: { base: 70, range: [66, 74], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: (p: number) => 0.3 + 0.2 * Math.sin(p * Math.PI) }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO', name: 'Drifting In', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true, bass: true, harmony: true, pianoAccompaniment: true, drums: true, sparkles: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'REG_DREAM_INTRO', name: 'Haze', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Floating Roots', duration: { percent: 85 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] },
                    pianoAccompaniment: { strategy: 'weighted', options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 } }
                },
                bundles: [{ id: 'REG_DREAM_MAIN', name: 'Cloud Riddim', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fading Sky', duration: { percent: 12 },
                layers: { accompaniment: true, sfx: true, harmony: true, bass: true, drums: true, sparkles: true },
                instrumentation: {
                    drums: { strategy: 'weighted', options: [{ name: 'standard', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
                },
                instrumentRules: {
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }] }
                },
                bundles: [{ id: 'REG_DREAM_OUTRO', name: 'Dissolve', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {}, ambientEvents: [], continuity: {}, rendering: {}
};
