import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Texas Flood" (Enthusiastic Blues v9.1).
 * #ЧТО: ПЛАН №817 — Смесь агрессивного Prog органа и классического Jimmy Smith.
 */
export const EnthusiasticBluesBlueprint: MusicBlueprint = {
    id: 'enthusiastic_blues',
    name: 'Texas Power Drive',
    description: 'A high-octane blues-rock in E Mixolydian. Fuzzed leads and heavy walking bass.',
    mood: 'enthusiastic',
    musical: {
        key: { root: 'E', scale: 'mixolydian', octave: 2 },
        bpm: { base: 120, range: [115, 130], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'crescendo', 
            peakPosition: 0.8, 
            curve: (p) => 0.6 + (Math.pow(p, 1.5) * 0.35) // Высокий старт (0.6) и улет в космос
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'MAIN_RIFF', name: 'Texas Drive', duration: { percent: 100 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'guitar_muffLead', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_epic', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'rockBass', weight: 1.0 } ] },
                           // #ЗАЧЕМ: ПЛАН №817. Ротация энергичных органов.
                           accompaniment: { 
                               activationChance: 1.0, 
                               instrumentOptions: [ 
                                   { name: 'organ_prog', weight: 0.6 }, 
                                   { name: 'organ_jimmy_smith', weight: 0.4 } 
                               ] 
                           },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    melody: { source: 'blues_solo', density: { min: 0.8, max: 1.0 }, soloPlan: 'S_ACTIVE' },
                    drums: { kitName: 'blues_epic', density: { min: 0.8, max: 1.0 }, kickVolume: 1.3, ride: { enabled: true } },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }], density: { min: 1.0, max: 1.0 } },
                    accompaniment: { techniques: [{ value: 'power-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'ENT_MAIN_RIFF', name: 'The Flood', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
