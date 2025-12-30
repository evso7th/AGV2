
import type { MusicBlueprint } from '@/types/music';

export const DreamyAmbientBlueprint: MusicBlueprint = {
  id: 'dreamy_ambient',
  name: 'Celestial Drift',
  description: 'Воздушный, парящий, светящийся эмбиент.',
  mood: 'dreamy',
  musical: {
    key: { root: 'F', scale: 'lydian', octave: 3 },
    bpm: { base: 58, range: [55, 62], modifier: 1.05 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [],
    tensionProfile: {
      type: 'arc',
      peakPosition: 0.6,
      curve: (progress: number, peakPos: number): number => {
        if (progress < peakPos) return Math.pow(progress / peakPos, 1.2);
        return 1 - Math.pow((progress - peakPos) / (1 - peakPos), 1.5);
      }
    }
  },
  structure: {
    totalDuration: { preferredBars: 160 },
    parts: [
      {
        id: 'INTRO_1', name: 'First Glimmer', duration: { percent: 6 }, // ~10 bars
        layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: { accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] } },
        instrumentRules: {
          accompaniment: { register: { preferred: 'high' } },
          sparkles: { eventProbability: 0.25 },
          melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'DREAMY_INTRO_1', name: 'Glimmer', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'INTRO_2', name: 'Awakening', duration: { percent: 7 }, // ~11 bars
        layers: { accompaniment: true, bass: true, melody: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] },
          bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
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
          bass: { techniques: [{ value: 'floating', weight: 1.0 }], register: { preferred: 'mid' } },
          melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'DREAMY_INTRO_2', name: 'Floating', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: null,
      },
      {
        id: 'INTRO_3', name: 'Drifting', duration: { percent: 7 }, // ~11 bars
        layers: { accompaniment: true, bass: true, melody: true, drums: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: {
          accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.8 }, { name: 'synth', weight: 0.2 }], v1Options: [{ name: 'ambientPad', weight: 0.8 }, { name: 'synth', weight: 0.2 }] },
          bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
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
          drums: { pattern: 'ambient_beat', density: { min: 0.3, max: 0.5 }, kickVolume: 0.8 },
          melody: { source: 'harmony_top_note' }
        },
        bundles: [{ id: 'DREAMY_INTRO_3', name: 'Light Pulse', duration: { percent: 100 }, characteristics: {}, phrases: {} }],
        outroFill: { type: 'shimmer_burst', duration: 2, parameters: {} },
      },
      {
        id: 'MAIN', name: 'Celestial expanse', duration: { percent: 50 },
        layers: { bass: true, melody: true, accompaniment: true, drums: true, sparkles: true, sfx: true, harmony: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 0.5 }, { name: 'synth', weight: 0.5 }], v1Options: [{ name: 'ambientPad', weight: 0.5 }, { name: 'synth', weight: 0.5 }] },
            bass: { strategy: 'weighted', options: [{ name: 'glideBass', weight: 1.0 }] },
            melody: { strategy: 'weighted', v1Options: [{ name: 'electricGuitar', weight: 0.25 }, { name: 'organ', weight: 0.4 }, { name: 'mellotron', weight: 0.35 }], v2Options: [{ name: 'electricGuitar', weight: 0.25 }, { name: 'organ', weight: 0.4 }, { name: 'mellotron', weight: 0.35 }] }
        },
        instrumentRules: {
            bass: { techniques: [{ value: 'arpeggio_slow', weight: 0.6 }, {value: 'melodic', weight: 0.4}] },
            drums: { pattern: 'composer', density: { min: 0.5, max: 0.7 } },
            melody: { source: 'harmony_top_note' }
        },
        bundles: [
            { id: 'DREAMY_MAIN_1', name: 'Soaring', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'DREAMY_MAIN_2', name: 'Shimmering', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: { type: 'reverb_burst', duration: 4, parameters: {} },
      },
       {
        id: 'OUTRO', name: 'Fading Starlight', duration: { percent: 30 },
        layers: { accompaniment: true, sparkles: true, sfx: true, harmony: true, melody: true },
        instrumentation: {
            accompaniment: { strategy: 'weighted', v2Options: [{ name: 'synth_ambient_pad_lush', weight: 1.0 }], v1Options: [{ name: 'ambientPad', weight: 1.0 }] },
            melody: { strategy: 'weighted', v1Options: [{ name: 'organ', weight: 0.5 }, { name: 'mellotron', weight: 0.5 }], v2Options: [{ name: 'organ', weight: 0.5 }, { name: 'mellotron', weight: 0.5 }] }
        },
        instrumentRules: {
            accompaniment: { register: { preferred: 'high' } },
            melody: { source: 'harmony_top_note' }
        },
        bundles: [ { id: 'DREAMY_OUTRO_1', name: 'Quietude', duration: { percent: 100 }, characteristics: {}, phrases: {} } ],
        outroFill: null,
      },
    ]
  },
  mutations: {},
  ambientEvents: [
      { type: 'sparkle', probability: 0.12, activeParts: ['INTRO_2', 'INTRO_3', 'MAIN', 'OUTRO'] }, // Bells
      { type: 'shimmer_burst', probability: 0.06, activeParts: ['MAIN'] },
  ],
  continuity: {},
  rendering: {}
};
