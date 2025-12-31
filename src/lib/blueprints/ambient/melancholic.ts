
import type { MusicBlueprint } from '@/types/music';

export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Melancholic Drift',
  description: 'Задумчивый, интроспективный ambient с плавными гармоническими переходами',
  
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 3 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.58,
      curve: (progress: number, peakPos: number): number => {
        if (progress < peakPos) return Math.pow(progress / peakPos, 1.3);
        else return Math.pow((1 - progress) / (1 - peakPos), 1.8);
      }
    }
  },
  
  structure: {
    totalDuration: { preferredBars: 120 },
    parts: [
       {
        id: 'INTRO_1', name: 'Emergence', duration: { percent: 8 },
        layers: { accompaniment: true, drums: true, melody: true },
        instrumentation: { 
            accompaniment: {
                strategy: 'weighted',
                v1Options: [{ name: 'ambientPad', weight: 1.0 }],
                v2Options: [{ name: 'synth_cave_pad', weight: 1.0 }],
            } 
        },
        instrumentRules: {
          accompaniment: { register: { preferred: 'low' } },
          drums: { pattern: 'composer', density: { min: 0.1, max: 0.3 }, useSnare: false, rareKick: false, usePerc: true },
          melody: { source: 'harmony_top_note' },
        },
        bundles: [ { id: 'INTRO_BUNDLE_1', name: 'Emergence', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_2', name: 'Stirrings', duration: { percent: 6 },
        layers: { accompaniment: true, bass: true, sparkles: true, sfx: true, melody: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ambientPad', weight: 0.9 }, { name: 'organ', weight: 0.1 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.9 }, { name: 'organ', weight: 0.1 }] },
          bass: { strategy: 'weighted', options: [{ name: 'ambientDrone', weight: 1.0 }] },
           melody: {
            strategy: 'weighted',
            v1Options: [
              { name: 'electricGuitar', weight: 0.2 },
              { name: 'acousticGuitar', weight: 0.2 },
              { name: 'organ', weight: 0.3 },
              { name: 'mellotron', weight: 0.3 },
            ],
             v2Options: [
              { name: 'electricGuitar', weight: 0.2 },
              { name: 'acousticGuitar', weight: 0.2 },
              { name: 'organ', weight: 0.3 },
              { name: 'mellotron', weight: 0.3 },
            ]
          }
        },
        instrumentRules: {
          accompaniment: { register: { preferred: 'low' } },
          sfx: {
              eventProbability: 0.25,
              categories: [
                { name: 'voice', weight: 0.6 },
                { name: 'dark', weight: 0.3 },
                { name: 'common', weight: 0.1 }
              ]
          },
          melody: { source: 'harmony_top_note' },
        },
        bundles: [ { id: 'INTRO_BUNDLE_2', name: 'Stirrings', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
      {
        id: 'INTRO_3', name: 'Anticipation', duration: { percent: 6 },
        layers: { accompaniment: true, bass: true, melody: true, harmony: true, sfx: true, sparkles: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ambientPad', weight: 0.8 }, { name: 'mellotron', weight: 0.2 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.8 }, { name: 'mellotron', weight: 0.2 }] },
          bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
          melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }] }
        },
        instrumentRules: {
          accompaniment: { register: { preferred: 'low' } },
          melody: { source: 'harmony_top_note' },
        },
        bundles: [ { id: 'INTRO_BUNDLE_3', name: 'Anticipation', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      {
        id: 'BUILD', name: 'Rising', duration: { percent: 25 },
        layers: { accompaniment: true, bass: true, drums: true, sfx: true, melody: true, harmony: true, sparkles: true },
         instrumentation: {
            accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ambientPad', weight: 0.7 }, { name: 'organ', weight: 0.3 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.7 }, { name: 'organ', weight: 0.3 }] },
            bass: { strategy: 'weighted', options: [{ name: 'classicBass', weight: 1.0 }] },
            melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.4 }, { name: 'theremin', weight: 0.6 }], v2Options: [{ name: 'synth', weight: 0.4 }, { name: 'theremin', weight: 0.6 }] }
        },
        instrumentRules: { 
            drums: { pattern: 'ambient_beat', density: { min: 0.4, max: 0.6 } },
            melody: { source: 'harmony_top_note' },
        },
        bundles: [
            { id: 'BUILD_BUNDLE_1', name: 'Stirring', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'BUILD_BUNDLE_2', name: 'Intensifying', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'filter_sweep', duration: 2, parameters: { filterEnd: 0.95 } },
      },
      {
        id: 'MAIN', name: 'Apex', duration: { percent: 35 },
        layers: { accompaniment: true, bass: true, drums: true, melody: true, sparkles: true, sfx: true, harmony: true },
         instrumentation: {
            accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ambientPad', weight: 0.6 }, { name: 'organ', weight: 0.4 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.6 }, { name: 'organ', weight: 0.4 }] },
            bass: { strategy: 'weighted', options: [{ name: 'livingRiff', weight: 1.0 }] },
            melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.3 }, { name: 'theremin', weight: 0.3 }, { name: 'electricGuitar', weight: 0.4 }], v2Options: [{ name: 'synth', weight: 0.3 }, { name: 'theremin', weight: 0.3 }, { name: 'electricGuitar', weight: 0.4 }] }
        },
        instrumentRules: { 
            drums: { 
                pattern: 'composer', 
                density: { min: 0.6, max: 0.8 },
                ride: { enabled: true, quietWindows: [{ start: 0.5, end: 0.65 }] }
            },
            melody: { source: 'harmony_top_note' },
        },
        bundles: [
            { id: 'MAIN_BUNDLE_1', name: 'Arrival', duration: { percent: 33 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_BUNDLE_2', name: 'Plateau', duration: { percent: 34 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_BUNDLE_3', name: 'Reflection', duration: { percent: 33 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'reverb_burst', duration: 2, parameters: {} },
      },
      {
        id: 'RELEASE', name: 'Descent', duration: { percent: 20 },
        layers: { accompaniment: true, bass: true, sparkles: true, sfx: true, melody: true, harmony: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', v1Options: [{ name: 'ambientPad', weight: 1.0 }], v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }] },
            bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
            melody: { strategy: 'weighted', v1Options: [{ name: 'synth', weight: 0.5 }, { name: 'ambientPad', weight: 0.5 }], v2Options: [{ name: 'synth', weight: 0.5 }, { name: 'synth_ambient_pad_lush', weight: 0.5 }] }
        },
        instrumentRules: { 
            drums: { enabled: false },
            melody: { source: 'harmony_top_note' },
        },
        bundles: [
            { id: 'RELEASE_BUNDLE_1', name: 'Softening', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'RELEASE_BUNDLE_2', name: 'Settling', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'density_pause', duration: 2, parameters: { soloLayer: 'pad' } },
      }
    ]
  },
  
  mutations: { },
  ambientEvents: [],
  continuity: {},
  rendering: {}
};
