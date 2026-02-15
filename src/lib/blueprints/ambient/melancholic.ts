
import type { MusicBlueprint } from '@/types/music';

/**
 * #ЗАЧЕМ: Флагманский блюпринт "Nostalgic Morning" (v41.1).
 * #ЧТО: 1. Тональность переведена в D Dorian (светлая печаль).
 *       2. Оркестровка сфокусирована на Piano (Harold Budd) и CS80.
 *       3. Лимит высоты нот MIDI 75.
 *       4. Усилены SFX винила и ветра (Whiskey & Smoke feel).
 */
export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Nostalgic Morning',
  description: 'The light sadness of a morning after. Whiskey, smoke and fragile hope in D Dorian.',
  
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 1 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.5,
      curve: (p: number) => {
        // Мягкая дуга с легким мерцанием
        return 0.4 + 0.15 * Math.sin(p * Math.PI);
      }
    }
  },
  
  structure: {
    totalDuration: { preferredBars: 156 },
    parts: [
      {
        id: 'INTRO', name: 'The Awakening', duration: { percent: 15 }, 
        stagedInstrumentation: [
          {
            duration: { percent: 50 }, 
            instrumentation: {
              accompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
              sfx: { activationChance: 1.0, instrumentOptions: [{ name: 'common', weight: 1.0 }] } // vinyl/tape hiss
            }
          },
          {
            duration: { percent: 50 }, 
            instrumentation: {
              pianoAccompaniment: { activationChance: 1.0, instrumentOptions: [{ name: 'piano', weight: 1.0 }] },
              bass: { activationChance: 1.0, instrumentOptions: [{ name: 'bass_jazz_warm', weight: 1.0 }] }
            }
          }
        ],
        instrumentRules: {
          drums: { kitName: 'melancholic', pattern: 'ambient_beat', density: { min: 0.05, max: 0.1 } },
          bass: { techniques: [{ value: 'pedal', weight: 1.0 }] }
        },
        bundles: [{ id: 'INTRO_B1', name: 'Foggy Morning', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'MAIN', name: 'Nostalgic Dialogue', duration: { percent: 70 }, 
        layers: { bass: true, drums: true, melody: true, accompaniment: true, pianoAccompaniment: true, sfx: true, harmony: true, sparkles: true },
        instrumentation: {
            melody: { strategy: 'weighted', v2Options: [{ name: 'cs80', weight: 0.7 }, { name: 'ep_rhodes_warm', weight: 0.3 }] },
            accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] }
        },
        instrumentRules: {
          drums: { kitName: 'melancholic', pattern: 'composer', density: { min: 0.3, max: 0.5 } },
          melody: { register: { preferred: 'mid' }, density: { min: 0.2, max: 0.4 } } // Ceiling enforced in Brain
        },
        bundles: [{ id: 'MAIN_B1', name: 'Whiskey & Hope', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'OUTRO', name: 'Dissolving Trace', duration: { percent: 15 },
        layers: { bass: true, accompaniment: true, sfx: true, pianoAccompaniment: true },
        instrumentRules: {
          bass: { techniques: [{ value: 'drone', weight: 1.0 }] },
          accompaniment: { techniques: [{ value: 'long-chords', weight: 1.0 }] }
        },
        bundles: [{ id: 'OUTRO_B1', name: 'Fade to Light', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      }
    ]
  },
  
  mutations: { },
  ambientEvents: [],
  continuity: {
    anchorLayers: ['bass', 'accompaniment'],
    simultaneousSilence: { allowed: false, fallback: 'accompaniment' }
  },
  rendering: {
    mixTargets: {
      bass: { level: -18, pan: 0.0 },
      accompaniment: { level: -16, pan: 0.0 },
      melody: { level: -18, pan: -0.1 },
      pianoAccompaniment: { level: -22, pan: 0.2 },
      sfx: { level: -26, pan: 0.0 }
    }
  }
};
