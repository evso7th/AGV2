import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Mood-specific Anxious Bridge (The Nervous Knot).
 * #ЧТО: Короткий (4 такта) тревожный переход. Rhodes-глюки и лазеры.
 */
export const AnxiousBridgeBlueprint: MusicBlueprint = {
    id: 'anxious_bridge',
    name: 'Nervous Bridge',
    description: 'A jittery anxious bridge with Rhodes and glitches.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 60, range: [60, 60], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: () => 0.4 }
    },
    structure: {
        totalDuration: { preferredBars: 4 },
        parts: [
            {
                id: 'BRIDGE', name: 'System Glitch', duration: { percent: 100 },
                layers: { accompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           sfx: { activationChance: 0.9, instrumentOptions: [ { name: 'laser', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'arpeggio-slow', weight: 1.0 }], register: { preferred: 'mid' } }
                },
                bundles: [{ id: 'ANX_BRIDGE_B1', name: 'Glitch Knot', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
