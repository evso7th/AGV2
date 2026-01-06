
import type { MusicBlueprint } from '@/types/music';

export const MelancholicBluesBlueprint: MusicBlueprint = {
    id: 'melancholic_blues',
    name: 'Empty Room Blues',
    description: 'A slow, soulful blues with a heavy heart.',
    mood: 'melancholic',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 64, range: [60, 68], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [], // Will be driven by a 12-bar structure in the engine
        tensionProfile: { type: 'plateau', peakPosition: 0.5, curve: (p, pp) => p < pp ? p / pp : 1.0 }
    },
    structure: {
        totalDuration: { preferredBars: 144 }, // 12 loops of 12 bars
        parts: [
            {
                id: 'INTRO', name: 'Verse 1', duration: { percent: 25 },
                introRules: {
                    allowedInstruments: ['drums', 'bass', 'accompaniment', 'melody'],
                    buildUpSpeed: 0.35
                },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic', density: { min: 0.5, max: 0.7 } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] }, 
                    melody: { source: 'harmony_top_note', register: { preferred: 'low' } }
                },
                bundles: [{ id: 'BLUES_INTRO_BUNDLE', name: 'Verse 1', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Guitar Solo', duration: { percent: 50 },
                layers: { bass: true, drums: true, accompaniment: true, melody: true, harmony: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 1.0 }], v2Options: [{ name: 'guitar_muffLead', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { 
                        pattern: 'composer', 
                        kitName: 'blues_melancholic',
                        density: { min: 0.6, max: 0.8 }, 
                        kickVolume: 1.1,
                        ride: {
                            enabled: true,
                            quietWindows: [
                                { start: 0.25, end: 0.65 } // Молчать с 25% до 65% части
                            ]
                        },
                    },
                    melody: {
                        density: { min: 0.4, max: 0.6 },
                        source: 'motif',
                        register: { preferred: 'low' },
                        presetModifiers: { octaveShift: 0 } // Use base, lower octave
                    },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                },
                bundles: [{ id: 'BLUES_MAIN_BUNDLE', name: 'Solo Section', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: { type: 'roll', duration: 1, parameters: {} },
            },
            {
                id: 'OUTRO', name: 'Final Verse', duration: { percent: 25 },
                layers: { bass: true, drums: true, accompaniment: true, harmony: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v1Options: [{ name: 'blackAcoustic', weight: 1.0 }], v2Options: [{ name: 'blackAcoustic', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'composer', kitName: 'blues_melancholic', density: { min: 0.4, max: 0.6 } },
                    bass: { techniques: [{ value: 'riff', weight: 1.0 }] },
                    melody: { source: 'harmony_top_note', register: { preferred: 'low' } }
                },
                bundles: [{ id: 'BLUES_OUTRO_BUNDLE', name: 'Last Verse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
