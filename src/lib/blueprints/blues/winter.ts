
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Специальный блюпринт "The Alvin Lee Tribute" (v2.0 Smoky).
 * #ЧТО: Эмуляция "The Bluest Blues". Медленный темп, низкий регистр, 
 *       размытый аккомпанемент и плачущее соло.
 * #ИСПРАВЛЕНО: Громкость Muff Lead и Shine On снижена, регистр опущен.
 */
export const WinterBluesBlueprint: MusicBlueprint = {
    id: 'winter_blues',
    name: 'The Bluest Blues (Tribute)',
    description: 'A slow, soulful, and smoky blues tribute. Low registers and rolling accompaniment.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'arc', 
            peakPosition: 0.7, 
            curve: (p, pp) => p < pp ? Math.pow(p / pp, 1.5) : 1 - Math.pow((p - pp) / (1 - pp), 2.0) 
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'INTRO_1', name: 'The Lonely Cry', duration: { percent: 25 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 25 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'blackAcoustic', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 0.8, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 0.0, instrumentOptions: [] }
                        }
                    },
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           bass: { activationChance: 0.4, instrumentOptions: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                           drums: { activationChance: 0.4, instrumentOptions: [ { name: 'winter_blues_prolog1', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [{ name: 'blackAcoustic', weight: 0.5 }, { name: 'guitar_shineOn', weight: 0.5 }] }
                        }
                    },
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 0.8, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           harmony: { activationChance: 0.7, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 25 }, 
                        instrumentation: {
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'violin', weight: 0.5 }, { name: 'flute', weight: 0.5 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }], density: { min: 0.3, max: 0.5 } },
                    melody: { source: 'blues_solo', soloToPatternRatio: 1.0, density: { min: 0.6, max: 0.8 }, soloPlan: "S04" },
                    drums: { kitName: 'winter_blues_prolog1', density: { min: 0.2, max: 0.4 } },
                    sfx: { eventProbability: 0.1, categories: [{ name: 'common', weight: 1.0 }] }
                },
                bundles: [{ id: 'ALVIN_INTRO', name: 'Wait', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN_1', name: 'Deep Blues', duration: { percent: 35 },
                layers: { bass: true, sfx: true, drums: true, melody: true, accompaniment: true, harmony: true, sparkles: true, pianoAccompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v1Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ], v2Options: [ { name: 'bass_jazz_warm', weight: 1.0 } ] },
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [ { name: 'guitar_shineOn', weight: 0.5 }, { name: 'guitar_muffLead', weight: 0.5 } ], 
                        v2Options: [ { name: 'guitar_shineOn', weight: 0.5 }, { name: 'guitar_muffLead', weight: 0.5 } ] 
                    },
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'organ_soft_jazz', weight: 1.0 }], v2Options: [{ name: 'organ_soft_jazz', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.4, max: 0.6 }, usePerc: true },
                    melody: { source: 'blues_solo', soloPlan: "S01", density: { min: 0.7, max: 0.9 }, soloToPatternRatio: 1.0 },
                    // #ЗАЧЕМ: Замена резких чопов на мягкие наплывы
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }], density: { min: 0.4, max: 0.7 } }
                },
                bundles: [{ id: 'ALVIN_MAIN', name: 'Snowfall', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'SOLO', name: 'Explosive Licks', duration: { percent: 25 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true, sfx: true },
                instrumentation: {
                    melody: { 
                        strategy: 'weighted', 
                        v1Options: [ { name: 'guitar_muffLead', weight: 1.0 } ], 
                        v2Options: [ { name: 'guitar_muffLead', weight: 1.0 } ] 
                    }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic_master', density: { min: 0.6, max: 0.8 }, ride: { enabled: true } },
                    melody: { source: 'blues_solo', soloPlan: "S_ACTIVE", density: { min: 0.8, max: 1.0 }, register: { preferred: 'mid' } },
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }], density: { min: 0.6, max: 0.9 } }
                },
                bundles: [{ id: 'ALVIN_SOLO', name: 'The Fire', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: { instrument: 'ride' } },
            },
            {
                id: 'OUTRO', name: 'Fading Memory', duration: { percent: 15 },
                layers: { bass: true, drums: true, melody: true, harmony: true, pianoAccompaniment: true, accompaniment: true, sfx: true },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'dark_outro', density: { min: 0.2, max: 0.4 }, useSnare: false },
                    bass: { techniques: [{ value: 'long_notes', weight: 1.0 }] },
                    melody: { source: 'blues_solo', density: { min: 1.0, max: 1.0 }, soloPlan: "WINTER_OUTRO_MELODY", soloToPatternRatio: 0.0 },
                    accompaniment: { density: { min: 0.3, max: 0.5 }, techniques: [{ value: 'swell', weight: 1.0 }] }
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
