import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Mood-specific Winter Bridge (Promenade v2.0).
 * #ЧТО: Короткий (4 такта) меланхоличный переход.
 */
export const WinterBridgeBlueprint: MusicBlueprint = {
    id: 'winter_bridge',
    name: 'Frost Transition',
    description: 'A melancholic winter bridge with soft organ and wind.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'dorian', octave: 1 },
        bpm: { base: 60, range: [60, 60], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'flat', peakPosition: 0.5, curve: () => 0.3 }
    },
    structure: {
        totalDuration: { preferredBars: 4 },
        parts: [
            {
                id: 'BRIDGE', name: 'Frozen Path', duration: { percent: 100 },
                layers: { accompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'organ_soft_jazz', weight: 1.0 } ] },
                           sfx: { activationChance: 0.7, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }], register: { preferred: 'low' } }
                },
                bundles: [{ id: 'WINTER_BRIDGE', name: 'Bridge', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
