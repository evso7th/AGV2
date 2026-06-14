import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Detroit Shuffle" (Joyful Blues v7.2).
 * #ЧТО: ПЛАН №817 — Расширен парк органов: Jimmy Smith, Soft Jazz и Cathedral.
 */
export const JoyfulBluesBlueprint: MusicBlueprint = {
    id: 'joyful_blues',
    name: 'Detroit Shuffle',
    description: 'An energetic, joyful, and danceable blues shuffle in A Ionian. Pure uplift and drive.',
    mood: 'joyful',
    musical: {
        key: { root: 'A', scale: 'ionian', octave: 2 },
        bpm: { base: 100, range: [95, 110], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'crescendo', 
            peakPosition: 0.7, 
            curve: (p) => {
                if (p < 0.15) return 0.4 + (p / 0.15) * 0.2; 
                return 0.6 + (p - 0.15) * 0.3; 
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO', name: 'The Setup', duration: { percent: 20 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true, pianoAccompaniment: true, melody: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_epic', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           // #ЗАЧЕМ: ПЛАН №817. Разнообразие органов.
                           accompaniment: { 
                               activationChance: 1.0, 
                               instrumentOptions: [ 
                                   { name: 'organ_jimmy_smith', weight: 0.5 }, 
                                   { name: 'organ_soft_jazz', weight: 0.3 },
                                   { name: 'organ', weight: 0.2 } 
                               ] 
                           },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'telecaster', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { pattern: 'composer', density: { min: 0.6, max: 0.8 }, useSnare: true, useGhostHat: true },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }], density: { min: 0.8, max: 1.0 } },
                    accompaniment: { techniques: [{ value: 'rhythmic-comp', weight: 1.0 }] },
                    melody: { source: 'blues_solo', density: { min: 0.3, max: 0.5 } }
                },
                bundles: [{ id: 'JOY_INTRO', name: 'Shuffle Start', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_DRIVE', name: 'Detroit Solo', duration: { percent: 80 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'telecaster', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_epic', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           accompaniment: { 
                               activationChance: 1.0, 
                               instrumentOptions: [ 
                                   { name: 'organ_jimmy_smith', weight: 0.5 }, 
                                   { name: 'organ_soft_jazz', weight: 0.3 },
                                   { name: 'organ_prog', weight: 0.2 } 
                               ] 
                           },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.4, instrumentOptions: [ { name: 'light', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    melody: { source: 'blues_solo', density: { min: 0.6, max: 0.9 }, register: { preferred: 'high' } },
                    drums: { kitName: 'blues_epic', density: { min: 0.7, max: 0.9 }, useSnare: true, ride: { enabled: true } },
                    bass: { techniques: [{ value: 'boogie', weight: 1.0 }] }
                },
                bundles: [{ id: 'JOY_MAIN', name: 'High Energy', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
