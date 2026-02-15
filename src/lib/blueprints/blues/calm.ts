import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Блюпринт "Ripple Calm" (Calm Blues v10.1).
 * #ЧТО: Бас унифицирован с темными режимами (bass_ambient_dark).
 */
export const CalmBluesBlueprint: MusicBlueprint = {
    id: 'calm_blues',
    name: 'Ripple Calm',
    description: 'A stable, shimmering blues in G Mixolydian. Focus on timbral morphing around the 0.5 energy threshold.',
    mood: 'calm',
    musical: {
        key: { root: 'G', scale: 'mixolydian', octave: 2 },
        bpm: { base: 72, range: [68, 78], modifier: 1.0 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'plateau', 
            peakPosition: 0.5, 
            curve: (p: number) => {
                if (p < 0.15) return 0.3 + (p / 0.15) * 0.2; 
                if (p > 0.92) return 0.5 - ((p - 0.92) / 0.08) * 0.4; 
                return 0.50 + 0.03 * Math.sin(p * Math.PI * 16); 
            }
        }
    },
    structure: {
        totalDuration: { preferredBars: 144 },
        parts: [
            {
                id: 'PROLOGUE', name: 'Light Ripples', duration: { percent: 5 },
                layers: { accompaniment: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           sparkles: { activationChance: 0.8, instrumentOptions: [ { name: 'light', weight: 1.0 } ], transient: true },
                           sfx: { activationChance: 0.4, instrumentOptions: [ { name: 'common', weight: 1.0 } ], transient: true }
                        }
                    }
                ],
                instrumentRules: {
                    pianoAccompaniment: { density: { min: 0.2, max: 0.4 } },
                    accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
                },
                bundles: [{ id: 'CALM_PROLOGUE', name: 'Prelude', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'INTRO', name: 'Gentle Flow', duration: { percent: 10 },
                layers: { bass: true, drums: true, accompaniment: true, pianoAccompaniment: true, sparkles: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_ambient_dark', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'trance_intro', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 } },
                    bass: { techniques: [{ value: 'pedal', weight: 1.0 }] }
                },
                bundles: [{ id: 'CALM_INTRO', name: 'Awakening', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'THE_CALM', name: 'Timbral Ripple', duration: { percent: 77 },
                layers: { bass: true, drums: true, melody: true, accompaniment: true, harmony: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           melody: { activationChance: 1.0, instrumentOptions: [ { name: 'melody', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_ambient_dark', weight: 1.0 } ] },
                           drums: { activationChance: 1.0, instrumentOptions: [ { name: 'blues_melancholic_master', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'accompaniment', weight: 1.0 } ] },
                           harmony: { activationChance: 1.0, instrumentOptions: [ { name: 'guitarChords', weight: 1.0 } ] },
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    melody: { source: 'blues_solo', density: { min: 0.25, max: 0.45 } },
                    drums: { kitName: 'blues_melancholic_master', density: { min: 0.4, max: 0.6 }, usePerc: true },
                    bass: { techniques: [{ value: 'walking', weight: 1.0 }] }
                },
                bundles: [{ id: 'CALM_MAIN_RIPPLE', name: 'Main Flow', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fading Ripples', duration: { percent: 8 }, 
                layers: { bass: true, accompaniment: true, pianoAccompaniment: true, sparkles: true, sfx: true },
                stagedInstrumentation: [
                    { 
                        duration: { percent: 100 }, 
                        instrumentation: {
                           pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'piano', weight: 1.0 } ] },
                           accompaniment: { activationChance: 1.0, instrumentOptions: [ { name: 'ep_rhodes_warm', weight: 1.0 } ] },
                           bass: { activationChance: 1.0, instrumentOptions: [ { name: 'bass_ambient_dark', weight: 1.0 } ] }
                        }
                    }
                ],
                instrumentRules: {
                    bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
                    accompaniment: { techniques: [{ value: 'swell', weight: 1.0 }] }
                },
                bundles: [{ id: 'CALM_OUTRO', name: 'End Ripple', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {}
};
