import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Ritual" (Dark Blues v14.0 - Voice Support).
 * #ЧТО: 1. Добавлена инструкция SFX для активации редких голосовых вставок.
 *       2. Tension Curve оптимизирована для создания "окон" затишья (0.65-0.70).
 */
export const DarkBluesBlueprint: MusicBlueprint = {
    id: 'dark_blues',
    name: 'Ritual of Smoldering Textures',
    description: 'A heavy, ritualistic blues in E Phrygian. Solid energetic core with rare ghostly voices.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 62, range: [60, 75], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'wave', 
            peakPosition: 0.5, 
            curve: (p, pp) => {
                if (p < 0.20) {
                    return 0.2 + (p / 0.20) * 0.55; 
                }
                return 0.75 + 0.1 * Math.sin(p * Math.PI); 
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'PROLOGUE', name: 'The Void Opening', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true, drums: true, bass: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'synth_cave_pad', weight: 1.0 } ] },
                           sfx: { activationChance: 0.6, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_dark', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_ambient_dark', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], register: { preferred: 'low' } },
                    drums: { kitName: 'blues_dark', density: { min: 0.3, max: 0.5 } }
                },
                bundles: [ { id: 'DARK_PROLOGUE_BUNDLE', name: 'The Void', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            },
            {
                id: 'THE_RITUAL', name: 'The Accumulation', duration: { percent: 97 },
                layers: { bass: true, accompaniment: true, melody: true, sfx: true, sparkles: true, drums: true, harmony: true, pianoAccompaniment: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 20 }, 
                        instrumentation: {
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 20 }, 
                        instrumentation: {
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 20 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    },
                    {
                        duration: { percent: 40 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 0.6 }, { name: 'flute', weight: 0.4 } ] },
                           sparkles: { activationChance: 0.4, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true },
                           // #ЗАЧЕМ: Редкие голосовые вставки.
                           sfx: { activationChance: 0.25, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }], density: { min: 0.4, max: 0.6 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.6, max: 0.9 } },
                    melody: { source: 'blues_solo', density: { min: 0.5, max: 0.8 } },
                    drums: { kitName: 'blues_melancholic_master', density: { min: 0.5, max: 0.7 }, usePerc: true }
                },
                bundles: [ { id: 'DARK_RITUAL_BUNDLE', name: 'The Cycle', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
