
import type { MelodyInstrument, BassInstrument } from "@/types/music";

/**
 * Defines the structure of parameters for a single voice synthesizer,
 * fully compatible with the expectations of V1 synth managers.
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
    type: 'lowpass' | 'highpass' | 'bandpass' | 'notch';
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

export const BASS_PRESET_INFO: Record<string, { description: string; color: string; } | null> = {
  bass_jazz_warm: { description: 'Warm, round, finger-style jazz bass.', color: '#A0522D' },
  bass_jazz_fretless: { description: 'Expressive "mwah" sound of a fretless bass.', color: '#4682B4' },
  bass_blues: { description: 'Classic blues bass with a slight grit.', color: '#000080' },
  bass_ambient: { description: 'Deep, slow, atmospheric sub-bass.', color: '#2F4F4F' },
  bass_ambient_dark: { description: 'Very low, rumbling drone for dark soundscapes.', color: '#191970' },
  bass_trance: { description: 'Punchy, rolling bassline for trance music.', color: '#00BFFF' },
  bass_trance_acid: { description: 'Resonant, squelchy acid bass.', color: '#FFD700' },
  bass_reggae: { description: 'Deep, round, and dubby reggae bass.', color: '#228B22' },
  bass_dub: { description: 'Heavier dub bass with prominent delay.', color: '#556B2F' },
  bass_house: { description: 'Tight, modern, 808-style bass for house music.', color: '#FF69B4' },
  bass_808: { description: 'Classic 808 sub-bass with long decay.', color: '#DC143C' },
  bass_deep_house: { description: 'Warm and groovy bass for deep house.', color: '#9932CC' },
  bass_rock_pick: { description: 'Aggressive picked bass for rock music.', color: '#B22222' },
  bass_slap: { description: 'Bright, percussive slap bass for funk.', color: '#FF4500' },
  classicBass: { description: 'Classic rock bass sound.', color: '#8B4513' },
  glideBass: { description: 'Smooth, gliding synth bass.', color: '#4169E1' },
  ambientDrone: { description: 'Deep, evolving drone.', color: '#1A0033' },
  resonantGliss: { description: 'Singing, resonant lead bass.', color: '#8B008B' },
  hypnoticDrone: { description: 'Pulsating, wide drone.', color: '#483D8B' },
  livingRiff: { description: 'Dynamic, expressive riffing bass.', color: '#FF4500' },
};

export const SYNTH_PRESETS: Record<string, SynthPreset> = {
  // --- BASS PRESETS (V1 Conversions) ---
  classicBass: {
    layers: [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
    filter: { type: 'lowpass', cutoff: 400, q: 1.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.05, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0
  },
  glideBass: {
    layers: [{ type: 'triangle', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 1.5 },
    filter: { type: 'lowpass', cutoff: 300, q: 0.8 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0.03
  },
  ambientDrone: {
    layers: [{ type: 'sine', detune: 4, octave: 0, gain: 1.0 }, { type: 'sine', detune: -4, octave: -1, gain: 0.7 }],
    adsr: { attack: 0.8, decay: 1.5, sustain: 0.8, release: 3.0 },
    filter: { type: 'lowpass', cutoff: 150, q: 1.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.005, mix: 0.3 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0.08
  },
  resonantGliss: {
    layers: [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.02, decay: 0.3, sustain: 0.7, release: 1.0 },
    filter: { type: 'lowpass', cutoff: 500, q: 4.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.1, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0.06
  },
  hypnoticDrone: {
    layers: [{ type: 'sine', detune: 0, octave: 0, gain: 1.0 }, { type: 'triangle', detune: 0, octave: 0, gain: 0.8 }],
    adsr: { attack: 0.2, decay: 0.1, sustain: 0.9, release: 3.0 },
    filter: { type: 'lowpass', cutoff: 150, q: 1.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.002, mix: 0.4 }, delay: { time: 0.015, feedback: 0, mix: 0 } },
    portamento: 0
  },
  livingRiff: {
    layers: [{ type: 'sine', detune: 0, octave: 0, gain: 1.0 }, { type: 'sawtooth', detune: 0, octave: 0, gain: 0.7 }],
    adsr: { attack: 0.01, decay: 0.5, sustain: 0.6, release: 1.0 },
    filter: { type: 'lowpass', cutoff: 350, q: 1.2 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.1, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0.005, feedback: 0, mix: 0 } },
    portamento: 0
  },
   bass_jazz_warm: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.7 }, { type: 'triangle', octave: 0, detune: 2, gain: 0.35 }, { type: 'sine', octave: 1, detune: 0, gain: 0.12 }, { type: 'sine', octave: -1, detune: 0, gain: 0.5 } ],
    adsr: { attack: 0.015, decay: 0.4, sustain: 0.7, release: 0.35 },
    filter: { type: 'lowpass', cutoff: 1200, q: 0.6 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_jazz_fretless: {
    layers: [ { type: 'sawtooth', octave: 0, detune: 0, gain: 0.55 }, { type: 'sine', octave: 0, detune: 0, gain: 0.4 }, { type: 'sine', octave: 1, detune: 0, gain: 0.15 }, { type: 'sine', octave: -1, detune: 0, gain: 0.4 } ],
    adsr: { attack: 0.025, decay: 0.5, sustain: 0.75, release: 0.4 },
    filter: { type: 'lowpass', cutoff: 1800, q: 1.2 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.15, chorus: { rate: 0.25, depth: 0.004, mix: 0.2 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_blues: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.6 }, { type: 'triangle', octave: 0, detune: 3, gain: 0.4 }, { type: 'sawtooth', octave: 0, detune: 0, gain: 0.15 }, { type: 'sine', octave: -1, detune: 0, gain: 0.45 } ],
    adsr: { attack: 0.012, decay: 0.35, sustain: 0.65, release: 0.3 },
    filter: { type: 'lowpass', cutoff: 1400, q: 0.8 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.25, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_ambient: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.7 }, { type: 'triangle', octave: 0, detune: -3, gain: 0.25 }, { type: 'sine', octave: 1, detune: 5, gain: 0.08 }, { type: 'sine', octave: -1, detune: 0, gain: 0.8 } ],
    adsr: { attack: 0.3, decay: 0.8, sustain: 0.85, release: 1.5 },
    filter: { type: 'lowpass', cutoff: 600, q: 0.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.005, mix: 0.25 }, delay: { time: 0.6, feedback: 0.4, mix: 0.2 } }
  },
  bass_ambient_dark: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.65 }, { type: 'triangle', octave: -1, detune: 0, gain: 0.35 }, { type: 'sine', octave: -1, detune: 0, gain: 0.9 } ],
    adsr: { attack: 0.5, decay: 1.2, sustain: 0.9, release: 2.0 },
    filter: { type: 'lowpass', cutoff: 400, q: 0.4 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0.08, depth: 0.006, mix: 0.3 }, delay: { time: 0.8, feedback: 0.5, mix: 0.25 } }
  },
  bass_trance: {
    layers: [ { type: 'sawtooth', octave: 0, detune: 0, gain: 0.7 }, { type: 'sawtooth', octave: 0, detune: 5, gain: 0.3 }, { type: 'square', octave: -1, detune: 0, gain: 0.25 }, { type: 'sine', octave: -1, detune: 0, gain: 0.6 } ],
    adsr: { attack: 0.003, decay: 0.15, sustain: 0.5, release: 0.15 },
    filter: { type: 'lowpass', cutoff: 800, q: 3 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.3, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_trance_acid: {
    layers: [ { type: 'sawtooth', octave: 0, detune: 0, gain: 0.9 }, { type: 'square', octave: -1, detune: 0, gain: 0.4 } ],
    adsr: { attack: 0.001, decay: 0.1, sustain: 0.3, release: 0.08 },
    filter: { type: 'lowpass', cutoff: 400, q: 8 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.4, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_reggae: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.8 }, { type: 'triangle', octave: 0, detune: 0, gain: 0.2 }, { type: 'sine', octave: -1, detune: 0, gain: 0.7 } ],
    adsr: { attack: 0.008, decay: 0.25, sustain: 0.4, release: 0.15 },
    filter: { type: 'lowpass', cutoff: 900, q: 0.7 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0.375, feedback: 0.35, mix: 0.18 } }
  },
  bass_dub: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.75 }, { type: 'triangle', octave: 0, detune: -2, gain: 0.25 }, { type: 'sine', octave: -1, detune: 0, gain: 0.85 } ],
    adsr: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.25 },
    filter: { type: 'lowpass', cutoff: 700, q: 1.2 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.12, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0.5, feedback: 0.45, mix: 0.25 } }
  },
  bass_house: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.85 }, { type: 'triangle', octave: 0, detune: 0, gain: 0.15 }, { type: 'sine', octave: -1, detune: 0, gain: 0.65 } ],
    adsr: { attack: 0.002, decay: 0.18, sustain: 0.35, release: 0.12 },
    filter: { type: 'lowpass', cutoff: 1200, q: 0.8 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.2, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_808: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 1.0 }, { type: 'sine', octave: -1, detune: 0, gain: 0.7 } ],
    adsr: { attack: 0.001, decay: 0.4, sustain: 0.2, release: 0.5 },
    filter: { type: 'lowpass', cutoff: 500, q: 0.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.35, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_deep_house: {
    layers: [ { type: 'sine', octave: 0, detune: 0, gain: 0.7 }, { type: 'sawtooth', octave: 0, detune: 0, gain: 0.25 }, { type: 'sine', octave: 1, detune: 0, gain: 0.1 }, { type: 'sine', octave: -1, detune: 0, gain: 0.6 } ],
    adsr: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.18 },
    filter: { type: 'lowpass', cutoff: 1000, q: 1.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.18, chorus: { rate: 0.15, depth: 0.003, mix: 0.12 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_rock_pick: {
    layers: [ { type: 'sawtooth', octave: 0, detune: 0, gain: 0.6 }, { type: 'square', octave: 0, detune: 2, gain: 0.25 }, { type: 'sine', octave: 0, detune: 0, gain: 0.3 }, { type: 'sine', octave: -1, detune: 0, gain: 0.4 } ],
    adsr: { attack: 0.003, decay: 0.2, sustain: 0.6, release: 0.15 },
    filter: { type: 'lowpass', cutoff: 2200, q: 1.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.4, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },
  bass_slap: {
    layers: [ { type: 'sawtooth', octave: 0, detune: 0, gain: 0.55 }, { type: 'square', octave: 0, detune: 3, gain: 0.3 }, { type: 'sine', octave: 1, detune: 0, gain: 0.2 }, { type: 'sine', octave: -1, detune: 0, gain: 0.45 } ],
    adsr: { attack: 0.001, decay: 0.15, sustain: 0.4, release: 0.12 },
    filter: { type: 'lowpass', cutoff: 2500, q: 2 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.25, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
  },

  // --- MELODY/ACCOMPANIMENT PRESETS ---
  organ: { layers: [ { type: 'triangle', detune: 0, octave: 0, gain: 1.0 }, { type: 'triangle', detune: 2, octave: 1, gain: 0.6 }, { type: 'triangle', detune: -2, octave: -1, gain: 0.4 }, ], adsr: { attack: 0.1, decay: 0.1, sustain: 0.9, release: 0.6 }, filter: { type: 'lowpass', cutoff: 2500, q: 2 }, lfo: { shape: 'sine', rate: 5.5, amount: 8, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.3, depth: 0.004, mix: 0.4 }, delay: { time: 0, feedback: 0, mix: 0 } }, },
  synth: { layers: [ { type: 'sawtooth', detune: -6, octave: 0, gain: 1.0 }, { type: 'sawtooth', detune: 6, octave: 0, gain: 0.7 }, { type: 'square', detune: 0, octave: -1, gain: 0.5 }, ], adsr: { attack: 0.05, decay: 0.4, sustain: 0.6, release: 0.8 }, filter: { type: 'lowpass', cutoff: 1800, q: 3.5 }, lfo: { shape: 'sine', rate: 0.5, amount: 400, target: 'filter' }, effects: { distortion: 0.1, chorus: { rate: 0.2, depth: 0.005, mix: 0.5 }, delay: { time: 0.5, feedback: 0.3, mix: 0.3 }, }, },
  mellotron: { layers: [ { type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 }, { type: 'sine', detune: 5, octave: 0, gain: 0.7 }, ], adsr: { attack: 0.3, decay: 0.2, sustain: 0.9, release: 1.2 }, filter: { type: 'lowpass', cutoff: 2200, q: 1.5 }, lfo: { shape: 'sine', rate: 4.5, amount: 5, target: 'pitch' }, effects: { distortion: 0.05, chorus: { rate: 0.1, depth: 0.001, mix: 0.2 }, delay: { time: 0, feedback: 0, mix: 0 }, }, },
  theremin: { layers: [ { type: 'sine', detune: 0, octave: 0, gain: 1.0 }, { type: 'sine', detune: 2, octave: 1, gain: 0.3 }, ], adsr: { attack: 0.4, decay: 0.1, sustain: 1.0, release: 0.6 }, filter: { type: 'lowpass', cutoff: 5000, q: 1 }, lfo: { shape: 'sine', rate: 5, amount: 5, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.2, depth: 0.003, mix: 0.3 }, delay: { time: 0, feedback: 0, mix: 0 }, }, portamento: 0.08 },
  electricGuitar: { layers: [ { type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 }, { type: 'square', detune: 3, octave: 0, gain: 0.6 }, ], adsr: { attack: 0.02, decay: 0.8, sustain: 0.2, release: 1.0 }, filter: { type: 'bandpass', cutoff: 1500, q: 3.5 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' }, effects: { distortion: 0.6, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0.375, feedback: 0.4, mix: 0.35 }, }, },
  'E-Bells_melody': { layers: [ { type: 'sine', detune: 0, octave: 0, gain: 1.0 } ], adsr: { attack: 0.001, decay: 1.6, sustain: 0.0, release: 1.6 }, filter: { type: 'highpass', cutoff: 800, q: 1 }, lfo: { shape: 'square', rate: 1.4, amount: 20, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }, },
  'G-Drops': { layers: [ { type: 'triangle', detune: 0, octave: 0, gain: 1.0 } ], adsr: { attack: 0.01, decay: 0.7, sustain: 0.1, release: 0.4 }, filter: { type: 'lowpass', cutoff: 2000, q: 1.5 }, lfo: { shape: 'sine', rate: 0.5, amount: 0, target: 'pitch' }, effects: { distortion: 0.1, chorus: { rate: 0.1, depth: 0.001, mix: 0.2 }, delay: { time: 0.5, feedback: 0.2, mix: 0.2 } }, },
  ambientPad: { layers: [ { type: 'sawtooth', detune: -8, octave: 0, gain: 0.8 }, { type: 'sawtooth', detune: 8, octave: 0, gain: 0.8 }, { type: 'sine', detune: 0, octave: 1, gain: 0.4 }, ], adsr: { attack: 2.5, decay: 2.0, sustain: 0.8, release: 4.0 }, filter: { type: 'lowpass', cutoff: 1200, q: 1.5 }, lfo: { shape: 'sine', rate: 0.05, amount: 600, target: 'filter' }, effects: { distortion: 0, chorus: { rate: 0.2, depth: 0.008, mix: 0.7 }, delay: { time: 0.75, feedback: 0.45, mix: 0.4 }, }, },
  acousticGuitar: { layers: [ { type: 'triangle', detune: 0, octave: 0, gain: 1.0 }, { type: 'noise', detune: 0, octave: 0, gain: 0.15 }, ], adsr: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.3 }, filter: { type: 'bandpass', cutoff: 2000, q: 4.0 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.001, mix: 0.1 }, delay: { time: 0, feedback: 0, mix: 0 }, }, },
  synth_ambient_pad_lush: { layers: [ { type: 'sawtooth', detune: -4, octave: 0, gain: 0.5 }, { type: 'sawtooth', detune: 4, octave: 0, gain: 0.5 }, { type: 'sine', detune: 0, octave: -1, gain: 0.7 }, { type: 'noise', detune: 0, octave: 0, gain: 0.03 } ], adsr: { attack: 1.2, decay: 2.0, sustain: 0.8, release: 4.0 }, filter: { type: 'lowpass', cutoff: 1400, q: 1.0 }, lfo: { shape: 'sine', rate: 0.15, amount: 500, target: 'filter' }, effects: { distortion: 0, chorus: { rate: 0.18, depth: 0.008, mix: 0.45 }, delay: { time: 0.55, feedback: 0.35, mix: 0.25 } } },
  synth_cave_pad: { layers: [ { type: 'sawtooth', detune: -6, octave: 0, gain: 0.4 }, { type: 'sawtooth', detune: 6, octave: 0, gain: 0.4 }, { type: 'sawtooth', detune: 0, octave: 1, gain: 0.25 }, { type: 'sine', detune: 0, octave: -1, gain: 0.8 }, { type: 'triangle', detune: 2, octave: -1, gain: 0.5 }, { type: 'noise', detune: 0, octave: 0, gain: 0.04 } ], adsr: { attack: 1.5, decay: 2.0, sustain: 0.8, release: 5.0 }, filter: { type: 'lowpass', cutoff: 1400, q: 1.1 }, lfo: { shape: 'sine', rate: 0.1, amount: 5, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.15, depth: 0.008, mix: 0.6 }, delay: { time: 0.52, feedback: 0.45, mix: 0.35 } } },
  mellotron_flute_intimate: { layers: [ { type: 'sine', detune: 0, octave: 0, gain: 0.9 }, { type: 'triangle', detune: 2, octave: 1, gain: 0.2 }, { type: 'noise', detune: 0, octave: 0, gain: 0.07 } ], adsr: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 }, filter: { type: 'lowpass', cutoff: 7500, q: 0.8 }, lfo: { shape: 'sine', rate: 4.8, amount: 2.5, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.2, depth: 0.005, mix: 0 }, delay: { time: 0.15, feedback: 0.1, mix: 0.1 } } },
  mellotron_choir: { layers: [ { type: 'sawtooth', detune: -3, octave: 0, gain: 0.4 }, { type: 'sawtooth', detune: 3, octave: 0, gain: 0.4 }, { type: 'sine', detune: 0, octave: 0, gain: 0.5 }, { type: 'triangle', detune: 5, octave: 1, gain: 0.2 }, { type: 'noise', detune: 0, octave: 0, gain: 0.025 } ], adsr: { attack: 0.6, decay: 1.0, sustain: 0.75, release: 2.0 }, filter: { type: 'lowpass', cutoff: 2800, q: 1.0 }, lfo: { shape: 'sine', rate: 5.2, amount: 3, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.25, depth: 0.006, mix: 0.4 }, delay: { time: 0.4, feedback: 0.25, mix: 0.2 } } },
  ep_rhodes_warm: { layers: [ { type: 'sine', detune: 0, octave: 0, gain: 0.58 }, { type: 'triangle', detune: 1200, octave: 0, gain: 0.14 }, { type: 'sine', detune: 1200, octave: 0, gain: 0.08 } ], adsr: { attack: 0.008, decay: 0.28, sustain: 0.68, release: 0.90 }, filter: { type: 'lowpass', cutoff: 3500, q: 0.9 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' }, effects: { distortion: 0, chorus: { rate: 0.25, depth: 0.006, mix: 0.22 }, delay: { time: 0.26, feedback: 0.12, mix: 0.10 } } },
  ep_rhodes_70s: { layers: [ { type: 'sine', detune: 0, octave: 0, gain: 0.54 }, { type: 'triangle', detune: 1200, octave: 0, gain: 0.16 }, { type: 'sine', detune: 1200, octave: 0, gain: 0.06 } ], adsr: { attack: 0.008, decay: 0.30, sustain: 0.66, release: 0.95 }, filter: { type: 'lowpass', cutoff: 4200, q: 0.9 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' }, effects: { distortion: 0, chorus: { rate: 0.20, depth: 0.006, mix: 0.24 }, delay: { time: 0.28, feedback: 0.16, mix: 0.12 } } },
  synth_lead_shineOn: { layers: [ { type: 'sawtooth', detune: -3, octave: 0, gain: 0.6 }, { type: 'sawtooth', detune: 3, octave: 0, gain: 0.6 }, { type: 'sine', detune: 0, octave: -1, gain: 0.4 } ], adsr: { attack: 0.01, decay: 0.4, sustain: 0.8, release: 2.2 }, filter: { type: 'lowpass', cutoff: 2800, q: 2.0 }, lfo: { shape: 'sine', rate: 0.15, amount: 400, target: 'filter' }, effects: { distortion: 0, chorus: { rate: 0.12, depth: 0.006, mix: 0.4 }, delay: { time: 0.48, feedback: 0.35, mix: 0.28 } } },
  synth_lead_distorted: { layers: [ { type: 'sawtooth', detune: -8, octave: 0, gain: 0.7 }, { type: 'sawtooth', detune: 8, octave: 0, gain: 0.7 }, { type: 'square', detune: 0, octave: 0, gain: 0.5 }, { type: 'noise', detune: 0, octave: 0, gain: 0.03 } ], adsr: { attack: 0.02, decay: 0.6, sustain: 0.7, release: 1.5 }, filter: { type: 'lowpass', cutoff: 1800, q: 2.5 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' }, effects: { distortion: 0.6, chorus: { rate: 0.1, depth: 0.002, mix: 0.2 }, delay: { time: 0, feedback: 0, mix: 0 } } },
  guitar_shineOn: { layers: [ { type: 'sawtooth', detune: -4, octave: 0, gain: 0.7 }, { type: 'sine', detune: 4, octave: 0, gain: 0.5 } ], adsr: { attack: 0.01, decay: 0.4, sustain: 0.8, release: 2.2 }, filter: { type: 'lowpass', cutoff: 3600, q: 2.0 }, lfo: { shape: 'sine', rate: 0.15, amount: 400, target: 'filter' }, effects: { distortion: 0.2, chorus: { rate: 0.16, depth: 0.007, mix: 0.4 }, delay: { time: 0.38, feedback: 0.28, mix: 0.22 } } },
  guitar_muffLead: { layers: [ { type: 'sawtooth', detune: -8, octave: 0, gain: 0.7 }, { type: 'sawtooth', detune: 8, octave: 0, gain: 0.7 }, { type: 'square', detune: 0, octave: -1, gain: 0.5 } ], adsr: { attack: 0.02, decay: 0.6, sustain: 0.7, release: 1.5 }, filter: { type: 'lowpass', cutoff: 1800, q: 2.5 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' }, effects: { distortion: 0.7, chorus: { rate: 0.1, depth: 0.002, mix: 0.2 }, delay: { time: 0.38, feedback: 0.26, mix: 0.16 } } },
  guitar_clean_chorus: { layers: [ { type: 'triangle', detune: -2, octave: 0, gain: 0.8 }, { type: 'sine', detune: 2, octave: 0, gain: 0.7 } ], adsr: { attack: 0.005, decay: 0.3, sustain: 0.7, release: 1.2 }, filter: { type: 'lowpass', cutoff: 4500, q: 0.8 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.15, depth: 0.007, mix: 0.35 }, delay: { time: 0.25, feedback: 0.2, mix: 0.15 } } },
  organ_soft_jazz: { layers: [ { type: 'sine', detune: 0, octave: 0, gain: 1.0 }, { type: 'sine', detune: 702, octave: 0, gain: 0.5 }, { type: 'sine', detune: 0, octave: 1, gain: 0.35 } ], adsr: { attack: 0.025, decay: 0.3, sustain: 0.9, release: 0.35 }, filter: { type: 'lowpass', cutoff: 3500, q: 0.9 }, lfo: { shape: 'sine', rate: 5.5, amount: 3, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.5, depth: 0.005, mix: 0.65 }, delay: { time: 0, feedback: 0, mix: 0 } } },
  organ_jimmy_smith: { layers: [ { type: 'triangle', detune: 0, octave: 0, gain: 0.8 }, { type: 'square', detune: 5, octave: 0, gain: 0.4 }, { type: 'sine', detune: 0, octave: -1, gain: 0.6 } ], adsr: { attack: 0.005, decay: 0.12, sustain: 0.92, release: 0.1 }, filter: { type: 'lowpass', cutoff: 5500, q: 1.2 }, lfo: { shape: 'sine', rate: 6.5, amount: 4, target: 'pitch' }, effects: { distortion: 0.1, chorus: { rate: 0.7, depth: 0.005, mix: 0.7 }, delay: { time: 0, feedback: 0, mix: 0 } } },
  organ_prog: { layers: [ { type: 'sawtooth', detune: -4, octave: 0, gain: 0.6 }, { type: 'sawtooth', detune: 4, octave: 0, gain: 0.6 }, { type: 'square', detune: 0, octave: 1, gain: 0.4 } ], adsr: { attack: 0.003, decay: 0.06, sustain: 0.98, release: 0.05 }, filter: { type: 'lowpass', cutoff: 8000, q: 1.5 }, lfo: { shape: 'sine', rate: 7.0, amount: 5, target: 'pitch' }, effects: { distortion: 0.2, chorus: { rate: 1.0, depth: 0.006, mix: 0.85 }, delay: { time: 0, feedback: 0, mix: 0 } } },
  
  // V1 Fallbacks for V2 Instruments
  blackAcoustic: { layers: [ { type: 'triangle', detune: 0, octave: 0, gain: 1.0 }, { type: 'noise', detune: 0, octave: 0, gain: 0.15 }, ], adsr: { attack: 0.001, decay: 0.3, sustain: 0.05, release: 0.3 }, filter: { type: 'bandpass', cutoff: 2000, q: 4.0 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' }, effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.001, mix: 0.1 }, delay: { time: 0, feedback: 0, mix: 0 }, }, },
  telecaster: { layers: [ { type: 'sawtooth', detune: -2, octave: 0, gain: 0.7 }, { type: 'square', detune: 2, octave: 0, gain: 0.5 }, ], adsr: { attack: 0.01, decay: 0.4, sustain: 0.5, release: 0.8 }, filter: { type: 'bandpass', cutoff: 2500, q: 3.0 }, lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' }, effects: { distortion: 0.4, chorus: { rate: 0.2, depth: 0.004, mix: 0.3 }, delay: { time: 0.3, feedback: 0.2, mix: 0.15 }, }, },
};

```
  </change>
  <change>
    <file>src/lib/melody-synth-manager.ts</file>
    <content><![CDATA[
import type { FractalEvent, AccompanimentInstrument } from '@/types/fractal';
import type { Note } from "@/types/music";
import { SYNTH_PRESETS, type SynthPreset } from './synth-presets';
import { V1_TO_V2_PRESET_MAP } from './presets-v2';
import type { TelecasterGuitarSampler } from './telecaster-guitar-sampler';
import type { BlackGuitarSampler } from './black-guitar-sampler';

function midiToFreq(midi: number): number {
    return Math.pow(2, (midi - 69) / 12) * 440;
}

type SynthVoice = {
    envGain: GainNode;
    filter: BiquadFilterNode;
    dryGain: GainNode;
    wetGain: GainNode;
    delayNode: DelayNode;
    feedbackGain: GainNode;
    chorusDelayNode: DelayNode;
    chorusLfo: OscillatorNode;
    chorusLfoGain: GainNode;
    panner: StereoPannerNode;
    soundSources: (OscillatorNode | AudioBufferSourceNode)[];
    isActive: boolean;
};

/**
 * Manages multiple synth voices for the melody part using native AudioNodes.
 * Now includes a "smart router" to delegate to samplers.
 */
export class MelodySynthManager {
    private audioContext: AudioContext;
    private destination: AudioNode;
    private activeInstrumentName: AccompanimentInstrument | 'none' = 'organ';
    public isInitialized = false;
    private partName: 'melody';

    private voicePool: SynthVoice[] = [];
    private nextVoice = 0;
    private preamp: GainNode;
    private noiseBuffer: AudioBuffer | null = null;
    
    // Sampler dependencies
    private telecasterSampler: TelecasterGuitarSampler;
    private blackAcousticSampler: BlackGuitarSampler;

    constructor(
        audioContext: AudioContext, 
        destination: AudioNode,
        telecasterSampler: TelecasterGuitarSampler,
        blackAcousticSampler: BlackGuitarSampler,
        partName: 'melody'
    ) {
        this.audioContext = audioContext;
        this.destination = destination;
        this.telecasterSampler = telecasterSampler;
        this.blackAcousticSampler = blackAcousticSampler;
        this.partName = partName;

        this.preamp = this.audioContext.createGain();
        this.preamp.gain.value = 1.0;
        this.preamp.connect(this.destination);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[MelodyManagerV1] Initializing native synth voices...');
        this.createNoiseBuffer();
        this.initVoicePool(3); 
        this.isInitialized = true;
        console.log('[MelodyManagerV1] Native voices initialized.');
    }

    private createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate;
        this.noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    private initVoicePool(poolSize: number) {
        for (let i = 0; i < poolSize; i++) {
            const envGain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            const panner = this.audioContext.createStereoPanner();
            const dryGain = this.audioContext.createGain();
            const wetGain = this.audioContext.createGain();
            const delayNode = this.audioContext.createDelay(1.0);
            const feedbackGain = this.audioContext.createGain();
            const chorusLfo = this.audioContext.createOscillator();
            const chorusLfoGain = this.audioContext.createGain();
            const chorusDelayNode = this.audioContext.createDelay(0.1);

            chorusLfo.connect(chorusLfoGain);
            chorusLfoGain.connect(chorusDelayNode.delayTime);
            chorusLfo.start();

            envGain.connect(filter);
            filter.connect(dryGain);
            filter.connect(wetGain);
            dryGain.connect(panner);
            wetGain.connect(chorusDelayNode).connect(delayNode).connect(panner);
            delayNode.connect(feedbackGain);
            feedbackGain.connect(delayNode);
            panner.connect(this.preamp);
            envGain.gain.value = 0;

            this.voicePool.push({
                envGain, filter, dryGain, wetGain, delayNode, feedbackGain,
                chorusDelayNode, chorusLfo, chorusLfoGain, panner,
                soundSources: [], isActive: false,
            });
        }
    }

    public schedule(events: FractalEvent[], barStartTime: number, tempo: number, barCount: number, instrumentHint?: AccompanimentInstrument, composerControlsInstruments: boolean = true) {
        if (!this.isInitialized) return;
        
        const hint = (composerControlsInstruments && instrumentHint) ? instrumentHint : this.activeInstrumentName;
        
        const melodyEvents = events.filter(e => e.type === this.partName);
        if (melodyEvents.length === 0) return;

        // --- SMART ROUTER ---
        if (hint === 'telecaster') {
            console.log(`%c[MelodyManagerV1] Routing to TelecasterSampler for bar ${barCount}`, 'color: #DA70D6');
            const notesToPlay = melodyEvents.map(e => ({ midi: e.note, time: e.time * (60/tempo), duration: e.duration * (60/tempo), velocity: e.weight, technique: e.technique, params: e.params }));
            this.telecasterSampler.schedule(notesToPlay, barStartTime, tempo);
            return; // Stop further execution
        }
        if (hint === 'blackAcoustic') {
            console.log(`%c[MelodyManagerV1] Routing to BlackGuitarSampler for bar ${barCount}`, 'color: #DA70D6');
            const notesToPlay = melodyEvents.map(e => ({ midi: e.note, time: e.time * (60/tempo), duration: e.duration * (60/tempo), velocity: e.weight, technique: e.technique, params: e.params }));
            this.blackAcousticSampler.schedule(notesToPlay, barStartTime, tempo);
            return; // Stop further execution
        }
        
        // --- V1 SYNTH LOGIC (Fallback) ---
        const finalInstrument = V1_TO_V2_PRESET_MAP[hint as keyof typeof V1_TO_V2_PRESET_MAP] || hint;
        
        if (!finalInstrument || finalInstrument === 'none' || !(finalInstrument in SYNTH_PRESETS)) {
            console.warn(`[MelodyManagerV1] Hint "${finalInstrument}" not found in V1 SYNTH_PRESETS. Skipping.`);
            return;
        }

        console.log(`%c[MelodyManagerV1 @ Bar ${barCount}] Using internal synth. Instrument: ${finalInstrument} | Scheduling ${melodyEvents.length} notes...`, 'color: #DA70D6;');

        const beatDuration = 60 / tempo;
        const notes: Note[] = melodyEvents.map(event => ({ midi: event.note, time: event.time * beatDuration, duration: event.duration * beatDuration, velocity: event.weight }));
        this.scheduleSynth(finalInstrument as keyof typeof SYNTH_PRESETS, notes, barStartTime);
    }


    private scheduleSynth(instrumentName: keyof typeof SYNTH_PRESETS, notes: Note[], barStartTime: number) {
        const preset = SYNTH_PRESETS[instrumentName];
        if (!preset) return;

        for (const note of notes) {
            const voice = this.voicePool.find(v => !v.isActive) || this.voicePool[this.nextVoice % this.voicePool.length];
            this.nextVoice++;
            this.triggerVoice(voice, note, preset, barStartTime);
        }
    }
    
    private triggerVoice(voice: SynthVoice, note: Note, preset: SynthPreset, barStartTime: number) {
        const velocity = note.velocity ?? 0.7;
        const noteTime = note.time;
        const noteDuration = note.duration;

        if (!isFinite(noteTime) || !isFinite(noteDuration) || !isFinite(velocity) || !isFinite(barStartTime)) {
            console.error('[MelodyManagerV1] Triggering aborted due to non-finite value:', { noteTime, noteDuration, velocity, barStartTime });
            return;
        }
        
        const now = this.audioContext.currentTime;
        const noteOnTime = barStartTime + noteTime;
        if (noteOnTime < now) return;

        voice.isActive = true;
        
        voice.filter.type = preset.filter.type;
        voice.filter.Q.value = preset.filter.q;
        voice.filter.frequency.setValueAtTime(preset.filter.cutoff, noteOnTime);
        const chorus = preset.effects.chorus;
        voice.chorusLfo.frequency.setValueAtTime(chorus.rate, noteOnTime);
        voice.chorusLfoGain.gain.setValueAtTime(chorus.depth, noteOnTime);
        const delay = preset.effects.delay;
        voice.delayNode.delayTime.setValueAtTime(delay.time, noteOnTime);
        voice.feedbackGain.gain.setValueAtTime(delay.feedback, noteOnTime);
        const wetMix = Math.max(chorus.mix, delay.mix);
        voice.wetGain.gain.setValueAtTime(wetMix, noteOnTime);
        voice.dryGain.gain.setValueAtTime(1.0 - wetMix, noteOnTime);

        const gainParam = voice.envGain.gain;
        const peakGain = velocity * 0.5;
        const sustainValue = peakGain * preset.adsr.sustain;
        
        const attackEndTime = noteOnTime + preset.adsr.attack;
        const decayEndTime = attackEndTime + preset.adsr.decay;
        const noteOffTime = noteOnTime + noteDuration;
        const releaseEndTime = noteOffTime + preset.adsr.release;

        if (!isFinite(attackEndTime) || !isFinite(decayEndTime) || !isFinite(noteOffTime) || !isFinite(releaseEndTime) || !preset.adsr.attack || !preset.adsr.decay || !preset.adsr.sustain || !preset.adsr.release) {
            console.error('[MelodyManagerV1] Aborting due to non-finite envelope time calculation.');
            voice.isActive = false;
            return;
        }

        gainParam.cancelScheduledValues(noteOnTime);
        gainParam.setValueAtTime(0, noteOnTime);
        gainParam.linearRampToValueAtTime(peakGain, attackEndTime);
        gainParam.linearRampToValueAtTime(sustainValue, decayEndTime);
        gainParam.setValueAtTime(sustainValue, noteOffTime);
        gainParam.linearRampToValueAtTime(0, releaseEndTime);
        
        voice.soundSources = [];
        const baseFrequency = midiToFreq(note.midi);
        
        preset.layers.forEach(layer => {
            let sourceNode: OscillatorNode | AudioBufferSourceNode;

            if (layer.type === 'noise') {
                if (!this.noiseBuffer) return;
                const noiseSource = this.audioContext.createBufferSource();
                noiseSource.buffer = this.noiseBuffer;
                noiseSource.loop = true;
                sourceNode = noiseSource;
            } else {
                const osc = this.audioContext.createOscillator();
                const detuneFactor = Math.pow(2, layer.detune / 1200);
                const octaveFactor = Math.pow(2, layer.octave);
                osc.frequency.value = baseFrequency * detuneFactor * octaveFactor;
                osc.type = layer.type as OscillatorType;
                sourceNode = osc;
                
                if (preset.lfo.target === 'pitch' && preset.lfo.amount > 0) {
                     const lfo = this.audioContext.createOscillator();
                     lfo.frequency.value = preset.lfo.rate;
                     const lfoGain = this.audioContext.createGain();
                     lfoGain.gain.value = preset.lfo.amount; // Direct cents value
                     lfo.connect(lfoGain).connect(osc.detune);
                     lfo.start(noteOnTime);
                     lfo.stop(releaseEndTime + 0.1);
                }
            }

            const sourceGain = this.audioContext.createGain();
            sourceGain.gain.value = layer.gain;
            sourceNode.connect(sourceGain).connect(voice.envGain);
            
            sourceNode.start(noteOnTime);
            sourceNode.stop(releaseEndTime + 0.1); 
            voice.soundSources.push(sourceNode);
        });

        setTimeout(() => {
            voice.isActive = false;
            voice.soundSources.forEach(source => source.disconnect());
            voice.soundSources = [];
        }, (releaseEndTime - now + 0.2) * 1000);
    }

    public setInstrument(instrumentName: AccompanimentInstrument | 'none') {
        if (!this.isInitialized) return;
        this.activeInstrumentName = instrumentName;
    }
    
    public setPreampGain(gain: number) {
      if (this.preamp) {
        this.preamp.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.01);
      }
    }

    public allNotesOff() {
        this.voicePool.forEach(voice => {
            if (voice.isActive) {
                voice.envGain.gain.cancelScheduledValues(this.audioContext.currentTime);
                voice.envGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.05);
                voice.soundSources.forEach(source => {
                    try { source.stop(this.audioContext.currentTime + 0.1); } catch (e) {}
                });
                voice.isActive = false;
            }
        });
    }

    public stop() {
        this.allNotesOff();
    }

    public dispose() {
        this.stop();
        this.voicePool.forEach(voice => {
        });
        this.preamp.disconnect();
    }
}
