
import type { MelodyInstrument, BassInstrument } from "@/types/music";

/**
 * Defines the structure of parameters for a single voice synthesizer,
 * fully compatible with the expectations of `chord-processor.js`.
 */
export type SynthPreset = {
  layers: {
    type: 'sine' | 'square' | 'sawtooth' | 'triangle' | 'noise';
    detune: number; // In cents
    octave: number; // -2 to 2
    gain: number;   // 0 to 1
  }[];
  adsr: {
    attack: number; // seconds
    decay: number;  // seconds
    sustain: number;// 0 to 1
    release: number;// seconds
  };
  filter: {
    type: 'lpf' | 'hpf' | 'bpf' | 'notch';
    cutoff: number; // Hz
    q: number;      // 0.1 to 20
  };
  lfo: {
    shape: 'sine' | 'square';
    rate: number;   // Hz
    amount: number; // 0 to 1 for filter, cents for pitch
    target: 'pitch' | 'filter';
  };
  effects: {
    distortion: number; // 0 to 1
    chorus: {
        rate: number; // Hz
        depth: number; // 0 to 1
        mix: number; // 0 to 1
    };
    delay: {
        time: number; // seconds
        feedback: number; // 0 to 1
        mix: number; // 0 to 1
    };
  };
  portamento?: number; // Optional: seconds for glide
};


/**
 * Библиотека пресетов для синтезаторных инструментов.
 * Каждый пресет - это "рецепт" звука.
 */
export const SYNTH_PRESETS: Record<Exclude<MelodyInstrument | BassInstrument, 'piano' | 'violin' | 'flute' | 'acousticGuitarSolo' | 'guitarChords' | 'none'>, SynthPreset> = {
  
  // --- BASS PRESETS ---
  classicBass: {
    layers: [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
    filter: { type: 'lpf', cutoff: 400, q: 1.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.05, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0
  },
  glideBass: {
    layers: [{ type: 'triangle', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 1.5 },
    filter: { type: 'lpf', cutoff: 300, q: 0.8 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0.03
  },
  ambientDrone: {
    layers: [{ type: 'sine', detune: 4, octave: 0, gain: 1.0 }, { type: 'sine', detune: -4, octave: -1, gain: 0.7 }],
    adsr: { attack: 0.8, decay: 1.5, sustain: 0.8, release: 3.0 },
    filter: { type: 'lpf', cutoff: 150, q: 1.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.005, mix: 0.3 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0.08
  },
  resonantGliss: {
    layers: [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 1.0 },
    filter: { type: 'lpf', cutoff: 500, q: 4.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.1, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0.06
  },
  hypnoticDrone: {
    layers: [{ type: 'sine', detune: 0, octave: 0, gain: 1.0 }, { type: 'triangle', detune: 0, octave: 0, gain: 0.8 }],
    adsr: { attack: 0.2, decay: 0.1, sustain: 0.9, release: 3.0 },
    filter: { type: 'lpf', cutoff: 150, q: 1.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.002, mix: 0.4 }, delay: { time: 0.015, feedback: 0, mix: 0 } }, // Stagger simulation
    portamento: 0
  },
  livingRiff: {
    layers: [{ type: 'sine', detune: 0, octave: 0, gain: 1.0 }, { type: 'sawtooth', detune: 0, octave: 0, gain: 0.7 }],
    adsr: { attack: 0.01, decay: 0.5, sustain: 0.6, release: 1.0 },
    filter: { type: 'lpf', cutoff: 350, q: 1.2 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.1, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0.005, feedback: 0, mix: 0 } },
    portamento: 0
  },

  // --- MELODY/ACCOMPANIMENT PRESETS ---
  organ: {
    layers: [
      { type: 'triangle', detune: 0, octave: 0, gain: 1.0 },
      { type: 'triangle', detune: 2, octave: 1, gain: 0.6 },
      { type: 'triangle', detune: -2, octave: -1, gain: 0.4 },
    ],
    adsr: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.6 },
    filter: { type: 'lpf', cutoff: 2500, q: 2 },
    lfo: { shape: 'sine', rate: 4.8, amount: 0, target: 'pitch' }, // Cents
    effects: {
      distortion: 0,
      chorus: { rate: 0.7, depth: 0.006, mix: 0.4 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  synth: {
    layers: [
      { type: 'sawtooth', detune: -6, octave: 0, gain: 1.0 },
      { type: 'sawtooth', detune: 6, octave: 0, gain: 0.7 },
      { type: 'square', detune: 0, octave: -1, gain: 0.5 },
    ],
    adsr: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 0.8 },
    filter: { type: 'lpf', cutoff: 1800, q: 3.5 },
    lfo: { shape: 'sine', rate: 0.5, amount: 400, target: 'filter' },
    effects: {
      distortion: 0.1,
      chorus: { rate: 0.2, depth: 0.005, mix: 0.5 },
      delay: { time: 0.5, feedback: 0.3, mix: 0.3 },
    },
  },

  mellotron: {
    layers: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 },
      { type: 'sine', detune: 5, octave: 0, gain: 0.7 },
    ],
    adsr: { attack: 0.3, decay: 0.2, sustain: 0.9, release: 1.2 },
    filter: { type: 'lpf', cutoff: 2200, q: 1.5 },
    lfo: { shape: 'sine', rate: 4.5, amount: 5, target: 'pitch' }, // "Wow and flutter"
    effects: {
      distortion: 0.05,
      chorus: { rate: 0.1, depth: 0.001, mix: 0.2 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  theremin: {
    layers: [
      { type: 'sine', detune: 0, octave: 0, gain: 1.0 },
      { type: 'sine', detune: 2, octave: 1, gain: 0.3 },
    ],
    adsr: { attack: 0.4, decay: 0.1, sustain: 1.0, release: 0.6 },
    filter: { type: 'lpf', cutoff: 5000, q: 1 },
    lfo: { shape: 'sine', rate: 5, amount: 5, target: 'pitch' }, // Classic vibrato in cents
    effects: {
      distortion: 0,
      chorus: { rate: 0.2, depth: 0.003, mix: 0.3 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
    portamento: 0.08
  },
  
  electricGuitar: {
    layers: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 },
      { type: 'square', detune: 3, octave: 0, gain: 0.6 },
    ],
    adsr: { attack: 0.02, decay: 0.8, sustain: 0.8, release: 2.5 },
    filter: { type: 'bpf', cutoff: 1500, q: 3.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: {
      distortion: 0.8,
      chorus: { rate: 0.7, depth: 0.006, mix: 0.3 },
      delay: { time: 0.375, feedback: 0.4, mix: 0.35 },
    },
  },

  'E-Bells_melody': {
      layers: [ { type: 'sine', detune: 0, octave: 0, gain: 1.0 } ],
      adsr: { attack: 0.001, decay: 1.6, sustain: 0.0, release: 1.6 },
      filter: { type: 'hpf', cutoff: 800, q: 1 },
      lfo: { shape: 'square', rate: 1.4, amount: 20, target: 'pitch' }, // Represents FM
      effects: { 
          distortion: 0, 
          chorus: { rate: 0, depth: 0, mix: 0 }, 
          delay: { time: 0, feedback: 0, mix: 0 } 
      },
  },

  'G-Drops': {
      layers: [ { type: 'triangle', detune: 0, octave: 0, gain: 1.0 } ],
      adsr: { attack: 0.01, decay: 0.7, sustain: 0.1, release: 0.4 },
      filter: { type: 'lpf', cutoff: 2000, q: 1.5 },
      lfo: { shape: 'sine', rate: 0.5, amount: 0, target: 'pitch' }, // Amount was 3.5, seems too high for pitch
      effects: { 
          distortion: 0.1, 
          chorus: { rate: 0.1, depth: 0.001, mix: 0.2 }, 
          delay: { time: 0.5, feedback: 0.2, mix: 0.2 } 
      },
  },
  
  ambientPad: {
    layers: [
      { type: 'sawtooth', detune: -8, octave: 0, gain: 0.8 },
      { type: 'sawtooth', detune: 8, octave: 0, gain: 0.8 },
      { type: 'sine', detune: 0, octave: 1, gain: 0.4 },
    ],
    adsr: { attack: 2.5, decay: 2.0, sustain: 0.8, release: 4.0 },
    filter: { type: 'lpf', cutoff: 1200, q: 1.5 },
    lfo: { shape: 'sine', rate: 0.05, amount: 600, target: 'filter' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.2, depth: 0.008, mix: 0.7 },
      delay: { time: 0.75, feedback: 0.45, mix: 0.4 },
    },
  },

  acousticGuitar: {
    layers: [
      { type: 'triangle', detune: 0, octave: 0, gain: 1.0 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.15 },
    ],
    adsr: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.3 },
    filter: { type: 'bpf', cutoff: 2000, q: 4.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.1, depth: 0.001, mix: 0.1 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },
};

    