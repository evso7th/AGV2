import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Очистка Anxious Ambient от индастриал-звуков (ПЛАН №423).
 * #ЧТО: 1. Удалена гитара Muff Lead (причина резкости).
 *       2. Снижен темп и переименованы части.
 *       3. Все ударные переведены в режим ambient_beat для стабильности.
 */
export const AnxiousAmbientBlueprint: MusicBlueprint = {
    id: 'anxious_ambient',
    name: 'Nervous System',
    description: 'A tense, but purely ambient soundscape. Floating suspense without industrial harshness.',
    mood: 'anxious',
    musical: {
        key: { root: 'E', scale: 'phrygian', octave: 2 },
        bpm: { base: 60, range: [58, 62], modifier: 1.05 },
        timeSignature: { numerator: 4, denominator: 4 },
        harmonicJourney: [],
        tensionProfile: { 
            type: 'wave', 
            peakPosition: 0.5, 
            curve: (p) => 0.4 + 0.3 * Math.sin(p * Math.PI * 4) 
        }
    },
    structure: {
        totalDuration: { preferredBars: 150 },
        parts: [
            {
                id: 'INTRO', name: 'Shadows', duration: { percent: 15 },
                layers: { sfx: true, accompaniment: true, pianoAccompaniment: true, bass: true, drums: true },
                instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] },
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_ambient_dark', weight: 1.0 }] }
                },
                instrumentRules: {
                    accompaniment: { density: { min: 0.2, max: 0.4 }, techniques: [{ value: 'long-chords', weight: 1.0 }] },
                    drums: { kitName: 'intro', pattern: 'ambient_beat', density: { min: 0.1, max: 0.2 } },
                    sfx: { eventProbability: 0.3, categories: [{ name: 'dark', weight: 0.7 }, { name: 'laser', weight: 0.3 }] }
                },
                bundles: [{ id: 'ANX_INTRO_1', name: 'First Shiver', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'BUILD', name: 'The Suspense', duration: { percent: 35 },
                layers: { bass: true, drums: true, sfx: true, accompaniment: true, harmony: true, pianoAccompaniment: true },
                instrumentation: {
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_ambient', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'ep_rhodes_warm', weight: 1.0 }] },
                    harmony: { strategy: 'weighted', options: [{ name: 'guitarChords', weight: 1.0 }] }
                },
                instrumentRules: {
                    drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 }, usePerc: true },
                    bass: { techniques: [{ value: 'pedal', weight: 1.0 }] }
                },
                bundles: [{ id: 'ANX_BUILD_1', name: 'Creeping', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'MAIN', name: 'Static Pulse', duration: { percent: 40 },
                layers: { bass: true, drums: true, melody: true, sfx: true, accompaniment: true, sparkles: true, harmony: true },
                 instrumentation: {
                    bass: { strategy: 'weighted', v2Options: [{ name: 'bass_ambient', weight: 1.0 }] },
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
                    melody: { strategy: 'weighted', v2Options: [{ name: 'synth', weight: 0.7 }, { name: 'ep_rhodes_warm', weight: 0.3 }] }
                },
                instrumentRules: {
                    drums: { kitName: 'dark', pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } },
                    melody: { register: { preferred: 'mid' }, density: { min: 0.2, max: 0.4 } }
                },
                bundles: [{ id: 'ANX_MAIN_1', name: 'The Core', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            },
            {
                id: 'OUTRO', name: 'Fading Signal', duration: { percent: 10 },
                layers: { sfx: true, accompaniment: true, sparkles: true },
                 instrumentation: {
                    accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }] }
                },
                instrumentRules: {
                    sfx: { eventProbability: 0.4, categories: [{ name: 'laser', weight: 1.0 }] }
                },
                bundles: [{ id: 'ANX_OUTRO_1', name: 'Silence', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
                outroFill: null,
            }
        ]
    },
    mutations: {},
    ambientEvents: [],
    continuity: {},
    rendering: {
        mixTargets: {
            melody: { level: -22, pan: 0.0 },
            accompaniment: { level: -18, pan: 0.0 },
            sfx: { level: -28, pan: 0.0 }
        }
    }
};
