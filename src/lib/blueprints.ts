

import type { MusicBlueprint, TensionProfile, HarmonicCenter } from '@/types/music';

export const MelancholicAmbientBlueprint: MusicBlueprint = {
  id: 'melancholic_ambient',
  name: 'Melancholic Drift',
  description: 'Задумчивый, интроспективный ambient с плавными гармоническими переходами',
  mood: 'melancholic',
  
  musical: {
    key: { root: 'D', scale: 'dorian', octave: 3 },
    bpm: { base: 52, range: [48, 56], modifier: 0.95 },
    timeSignature: { numerator: 4, denominator: 4 },
    harmonicJourney: [], // Simplified for now
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
    totalDuration: {
      preferredBars: 72 // Roughly 6.5 minutes at 52 BPM
    },
    
    parts: [
      {
        id: 'INTRO', name: 'Awakening',
        duration: { percent: 20 }, // ~14 bars
        layers: { bass: true, pad: true },
        instrumentRules: {},
        bundles: [
          { id: 'INTRO_BUNDLE_1', name: 'Emergence', duration: { percent: 50 }, characteristics: {}, phrases: {} },
          { id: 'INTRO_BUNDLE_2', name: 'Unfolding', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null
      },
      {
        id: 'BUILD', name: 'Rising',
        duration: { percent: 25 }, // ~18 bars
        layers: { bass: true, pad: true, arpeggio: true, drums: true, sfx: true },
        instrumentRules: {},
        bundles: [
            { id: 'BUILD_BUNDLE_1', name: 'Stirring', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'BUILD_BUNDLE_2', name: 'Anticipation', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null
      },
      {
        id: 'MAIN', name: 'Apex',
        duration: { percent: 30 }, // ~22 bars
        layers: { bass: true, pad: true, arpeggio: true, melody: true, sparkles: true, drums: true, sfx: true },
        instrumentRules: {},
        bundles: [
            { id: 'MAIN_BUNDLE_1', name: 'Arrival', duration: { percent: 50 }, characteristics: {}, phrases: {} },
            { id: 'MAIN_BUNDLE_2', name: 'Plateau', duration: { percent: 50 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null
      },
       {
        id: 'RELEASE', name: 'Descent',
        duration: { percent: 15 }, // ~11 bars
        layers: { bass: true, pad: true, arpeggio: true, sparkles: true },
        instrumentRules: {},
        bundles: [
          { id: 'RELEASE_BUNDLE_1', name: 'Softening', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null
      },
      {
        id: 'OUTRO', name: 'Dissolution',
        duration: { percent: 10 }, // ~7 bars
        layers: { bass: true, pad: true, sfx: true },
        instrumentRules: {},
        bundles: [
          { id: 'OUTRO_BUNDLE_1', name: 'Fading', duration: { percent: 100 }, characteristics: {}, phrases: {} }
        ],
        outroFill: null
      }
    ]
  },
  
  mutations: { /* Simplified for now */ },
  ambientEvents: [],
  continuity: {},
  rendering: {}
};
