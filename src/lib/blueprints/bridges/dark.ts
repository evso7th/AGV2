import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Mood-specific Dark Bridge (Promenade v2.0).
 * #ЧТО: Короткий (4 такта) мистический переход.
 */
export const DarkBridgeBlueprint: MusicBlueprint = {
    id: 'dark_bridge',
    name: 'Obsidian Transition',
    description: 'A dark, short bridge with deep pads and voices.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 60, range: [60, 60], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'flat', peakPosition: 0.5, curve: () => 0.3 }
    },
    structure: {
        totalDuration: { preferredBars: 4 },
        parts: [
            {
                id: 'BRIDGE', name: 'The Crossing', duration: { percent: 100 },
                layers: { accompaniment: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'synth_cave_pad', weight: 1.0 } ] },
                           sfx: { activationChance: 0.8, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }], register: { preferred: 'low' } }
                },
                bundles: [{ id: 'DARK_BRIDGE', name: 'Bridge', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
