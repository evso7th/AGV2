import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "The Silent Hill Protocol" (Anxious Blues v8.0).
 * #ЧТО: 1. Tension Plateau (0.68-0.78) — застывшее напряжение без разрешения.
 *       2. Радикальное снижение плотности для создания эффекта пустоты.
 *       3. Использование темных текстур и редких ритмических ударов.
 */
export const AnxiousBluesBlueprint: MusicBlueprint = {
    id: 'anxious_blues',
    name: 'Suspense Soundscape',
    description: 'Cinematic suspense blues inspired by Silent Hill and Twin Peaks. Static tension and sonic glitches.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 78, range: [75, 85], modifier: 1.0 }, 
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'plateau', 
            peakPosition: 0.5, 
            // #ЗАЧЕМ: Застывшее напряжение. Музыка "тлеет", но не взрывается.
            curve: () => 0.73 + (Math.random() * 0.05)
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'PROLOGUE', name: 'The Cold Fog', duration: { percent: 3 },
                layers: { accompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'synth_cave_pad', weight: 1.0 } ] },
                           sfx: { activationChance: 0.8, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], register: { preferred: 'low' } }
                },
                bundles: [{ id: 'ANX_PROLOGUE', name: 'The Fog', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'THE_SUSPENSE', name: 'Static Dread', duration: { percent: 97 },
                layers: { bass: true, accompaniment: true, melody: true, drums: true, harmony: true, pianoAccompaniment: true, sfx: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_ambient_dark', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_dark', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.5, instrumentOptions: [ { name: 'dark', weight: 1.0 } ], transient: true },
                           sfx: { activationChance: 0.4, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    // #ЗАЧЕМ: Радикально низкая плотность для Саспенса.
                    melody: { source: 'blues_solo', density: { min: 0.15, max: 0.35 } },
                    drums: { kitName: 'blues_dark', density: { min: 0.2, max: 0.4 }, useSnare: true, rareKick: true },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }], density: { min: 0.3, max: 0.5 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], density: { min: 0.4, max: 0.6 } }
                },
                bundles: [{ id: 'ANX_MAIN_SUSPENSE', name: 'Suspense Cycle', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
