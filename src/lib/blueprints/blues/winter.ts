import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Специальный блюпринт "The Alvin Lee Tribute" (v4.1 Grounded Soul).
 * #ЧТО: Оптимизирован для живой акустики с жестким потолком регистра 70.
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Bluest Blues (Grounded)',
    description: 'A deep, soulful acoustic blues tribute. Low register ceiling (MIDI 70), busy fingers.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'arc', 
            peakPosition: 0.7, 
            curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.2) : 1 - Math.pow((p - pp) / (1 - pp), 1.5) 
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO_1', name: 'Midnight Start', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 0.7, max: 0.9 } },
                    accompaniment: { 
                        techniques: [{ value: 'rhythmic-comp', weight: 1.0 }], 
                        density: { min: 0.8, max: 1.0 },
                        register: { preferred: 'low' } // Ограничение регистра в блюпринте
                    },
                    melody: { 
                        source: 'blues_solo', 
                        density: { min: 0.6, max: 0.8 },
                        register: { preferred: 'low' } // Целевой регистр - низкий
                    },
                    drums: { kitName: 'blues_melancholic', density: { min: 0.5, max: 0.7 } }
                },
                bundles: [{ id: 'ALVIN_INTRO', name: 'The Wait', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'Deep Blues', duration: { percent: 50 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.7, max: 0.9 } },
                    melody: { 
                        source: 'blues_solo', 
                        soloPlan: "S01", 
                        density: { min: 0.8, max: 1.0 },
                        register: { preferred: 'low' } 
                    }
                },
                bundles: [{ id: 'ALVIN_MAIN', name: 'Snowfall', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Dissolution', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true },
                instrumentRules: {
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'motif', density: { min: 0.2, max: 0.4 }, register: { preferred: 'low' } }
                },
                bundles: [{ id: 'ALVIN_OUTRO', name: 'Dissolution', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
