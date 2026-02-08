import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Grand Finale" (Epic Blues v11.0).
 * #ЧТО: 1. Грандиозное нарастание в D Ionian.
 *       2. Переход от интимного пианино к мощному стадионному гимну.
 */
export const EpicBluesBlueprint: MusicBlueprint = {
    id: 'epic_blues',
    name: 'The Grand Finale',
    description: 'A cinematic, slow-building blues rock anthem. From piano whispers to stadium leads.',
    mood: 'epic',
    musical: {
        key: { root: 'D', scale: 'ionian', octave: 2 },
        bpm: { base: 110, range: [100, 120], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'crescendo', 
            peakPosition: 0.9, 
            curve: (p) => Math.pow(p, 2.0) // Резкое экспоненциальное нарастание
        }
    },
    structure: {
        totalDuration: { preferredBars: 180 },
        parts: [
            {
                id: 'PROLOGUE', name: 'The Overture', duration: { percent: 10 },
                layers: { pianoAccompaniment: true, sfx: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sfx: { activationChance: 0.5, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    pianoAccompaniment: { density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'EPIC_PROLOGUE', name: 'Overture', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'THE_ANTHEM', name: 'The Rise', duration: { percent: 90 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 30 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 70 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_epic', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'rockBass', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    melody: { source: 'blues_solo', density: { min: 0.7, max: 1.0 }, register: { preferred: 'high' } },
                    drums: { kitName: 'blues_epic', density: { min: 0.8, max: 1.0 }, ride: { enabled: true } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] }
                },
                bundles: [{ id: 'EPIC_MAIN', name: 'Anthem Cycle', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
