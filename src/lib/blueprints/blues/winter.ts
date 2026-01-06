
import type { MusicBlueprint } from '@/types/music';

export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'Winter Blues (Sterile)',
    description: 'A sterile, minimal blues blueprint for debugging. It only uses bass, melody, and accompaniment synthesizers, with all sample-based layers disabled.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'aeolian', octave: 2 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // Uses 12-bar blues structure
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 120 }, // 10 loops of 12 bars
        parts: [
            {
                id: 'MAIN_THEME', name: 'Main Theme', duration: { percent: 60 },
                layers: {
                    drums: false, harmony: false, sfx: false, sparkles: false, // Keep sterile
                    bass: true, accompaniment: true, melody: true,
                },
                instrumentation: {
                    accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        // #ЗАЧЕМ: Указываем, что мелодию должна играть гитара.
                        // #ЧТО: Используется 'blackAcoustic' как единственный вариант.
                        // #СВЯЗИ: Эта нотация обрабатывается в audio-engine-context.tsx.
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'none' },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { 
                        source: 'motif', 
                        density: { min: 0.4, max: 0.6 },
                        register: { preferred: 'mid' }
                    }
                },
                bundles: [{ id: 'WINTER_BLUES_THEME_BUNDLE', name: 'Main Riff', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Guitar Solo', duration: { percent: 40 },
                layers: {
                    drums: false, harmony: false, sfx: false, sparkles: false, // Keep sterile
                    bass: true, accompaniment: true, melody: true,
                },
                instrumentation: {
                     accompaniment: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'organ', weight: 1.0 }],
                        v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }]
                    },
                    melody: {
                        strategy: 'weighted',
                        v1Options: [{ name: 'blackAcoustic', weight: 1.0 }],
                        v2Options: [{ name: 'blackAcoustic', weight: 1.0 }]
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'none' },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { 
                        source: 'motif', 
                        // #ИЗМЕНЕНО: Увеличиваем плотность и регистр для создания ощущения соло
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'high' }
                    }
                },
                bundles: [{ id: 'WINTER_BLUES_SOLO_BUNDLE', name: 'Improvisation', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
