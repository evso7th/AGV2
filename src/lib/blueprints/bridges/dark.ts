import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Mood-specific Dark Bridge (The Obsidian Crossing).
 * #ЧТО: Короткий (4 такта) мистический переход. Использует сэмплы из папки promenade.
 */
export const DarkBridgeBlueprint: MusicBlueprint = {
    id: 'dark_bridge',
    name: 'Obsidian Transition',
    description: 'A dark, short bridge with deep pads and promenade textures.',
    mood: 'dark',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 1 },
        bpm: { base: 60, range: [60, 60], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: () => 0.3 }
    },
    structure: {
        totalDuration: { preferredBars: 4 },
        parts: [
            {
                id: 'BRIDGE', name: 'The Crossing', duration: { percent: 100 },
                layers: { accompaniment: true, sfx: true, bass: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'synth_cave_pad', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'ambientDrone', weight: 1.0 } ] },
                           sparkles: { activationChance: 1.0, instrumentOptions: [ { name: 'promenade', weight: 1.0, category: 'promenade' } as any ] },
                           sfx: { activationChance: 0.8, instrumentOptions: [ { name: 'voice', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }], register: { preferred: 'low' } },
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] }
                },
                bundles: [{ id: 'DARK_BRIDGE_B1', name: 'The Crossing', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
