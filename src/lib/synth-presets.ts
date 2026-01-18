
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
 * #ЗАЧЕМ: Эта библиотека пресетов для V1-движка.
 * #ЧТО: Она является полным аналогом не-басовых пресетов из `presets-v2.ts`.
 *       Имена пресетов здесь ДОЛЖНЫ один-в-один совпадать с именами в V2,
 *       чтобы UI-переключатель работал корректно для обоих движков.
 *       Тембры адаптированы под возможности простого V1-синтезатора.
 * #СВЯЗИ: Используется `MelodySynthManager` и `AccompanimentSynthManager` (V1).
 */
export const SYNTH_PRESETS: Record<string, SynthPreset> = {
  
  // --- SYNTH PRESETS ---

  synth: { // Emerald Pad
    layers: [
      { type: 'sawtooth', detune: -4, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 4, octave: 0, gain: 0.5 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.7 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.03 }
    ],
    adsr: { attack: 0.8, decay: 1.2, sustain: 0.7, release: 3.0 },
    filter: { type: 'lpf', cutoff: 1600, q: 1.2 },
    lfo: { shape: 'sine', rate: 0.18, amount: 450, target: 'filter' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.2, depth: 0.007, mix: 0.4 },
      delay: { time: 0.5, feedback: 0.3, mix: 0.2 },
    },
  },

  synth_ambient_pad_lush: {
    layers: [
      { type: 'sawtooth', detune: -4, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 4, octave: 0, gain: 0.5 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.7 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.03 }
    ],
    adsr: { attack: 1.2, decay: 2.0, sustain: 0.8, release: 4.0 },
    filter: { type: 'lpf', cutoff: 1400, q: 1.0 },
    lfo: { shape: 'sine', rate: 0.15, amount: 500, target: 'filter' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.18, depth: 0.008, mix: 0.45 },
      delay: { time: 0.55, feedback: 0.35, mix: 0.25 },
    },
  },

  synth_cave_pad: {
    layers: [
      { type: 'sawtooth', detune: -6, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: 6, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: 0, octave: 1, gain: 0.25 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.8 },
      { type: 'triangle', detune: 2, octave: -1, gain: 0.5 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.04 }
    ],
    adsr: { attack: 1.5, decay: 2.0, sustain: 0.8, release: 5.0 },
    filter: { type: 'lpf', cutoff: 1400, q: 1.1 },
    lfo: { shape: 'sine', rate: 0.1, amount: 5, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.15, depth: 0.008, mix: 0.6 },
      delay: { time: 0.52, feedback: 0.45, mix: 0.35 },
    },
  },

  theremin: {
    layers: [
      { type: 'sine', detune: 0, octave: 0, gain: 1.0 },
      { type: 'sine', detune: 2, octave: 1, gain: 0.3 },
    ],
    adsr: { attack: 0.4, decay: 0.1, sustain: 0.9, release: 2.8 },
    filter: { type: 'lpf', cutoff: 5000, q: 0.7 },
    lfo: { shape: 'sine', rate: 5.5, amount: 3, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.1, depth: 0.002, mix: 0.2 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
    portamento: 0.08,
  },
  
  // --- MELLOTRON EMULATIONS ---

  mellotron: { // Majestic Strings
    layers: [
      { type: 'sawtooth', detune: -5, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 5, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 0, octave: -1, gain: 0.4 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.02 }
    ],
    adsr: { attack: 0.4, decay: 0.8, sustain: 0.7, release: 1.5 },
    filter: { type: 'lpf', cutoff: 3200, q: 1.5 },
    lfo: { shape: 'sine', rate: 4.5, amount: 4, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.3, depth: 0.008, mix: 0.5 },
      delay: { time: 0.3, feedback: 0.2, mix: 0.15 },
    },
  },

  mellotron_flute_intimate: {
    layers: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.9 },
      { type: 'triangle', detune: 2, octave: 1, gain: 0.2 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.07 }
    ],
    adsr: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.3 },
    filter: { type: 'lpf', cutoff: 7500, q: 0.8 },
    lfo: { shape: 'sine', rate: 4.8, amount: 2.5, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0, depth: 0, mix: 0 },
      delay: { time: 0.15, feedback: 0.1, mix: 0.1 },
    },
  },

  mellotron_choir: {
    layers: [
      { type: 'sawtooth', detune: -3, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: 3, octave: 0, gain: 0.4 },
      { type: 'sine', detune: 0, octave: 0, gain: 0.5 },
      { type: 'triangle', detune: 5, octave: 1, gain: 0.2 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.025 }
    ],
    adsr: { attack: 0.6, decay: 1.0, sustain: 0.75, release: 2.0 },
    filter: { type: 'lpf', cutoff: 2800, q: 1.0 },
    lfo: { shape: 'sine', rate: 5.2, amount: 3, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.25, depth: 0.006, mix: 0.4 },
      delay: { time: 0.4, feedback: 0.25, mix: 0.2 },
    },
  },

  // --- ELECTRIC PIANO EMULATIONS ---

  ep_rhodes_warm: {
    layers: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.58 },
      { type: 'triangle', detune: 0, octave: 1, gain: 0.14 },
      { type: 'sine', detune: 0, octave: 1, gain: 0.08 }
    ],
    adsr: { attack: 0.008, decay: 0.28, sustain: 0.68, release: 0.90 },
    filter: { type: 'lpf', cutoff: 3500, q: 0.9 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.25, depth: 0.006, mix: 0.22 },
      delay: { time: 0.26, feedback: 0.12, mix: 0.10 },
    },
  },

  ep_rhodes_70s: {
    layers: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.54 },
      { type: 'triangle', detune: 0, octave: 1, gain: 0.16 },
      { type: 'sine', detune: 0, octave: 1, gain: 0.06 }
    ],
    adsr: { attack: 0.008, decay: 0.30, sustain: 0.66, release: 0.95 },
    filter: { type: 'lpf', cutoff: 4200, q: 0.9 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.20, depth: 0.006, mix: 0.24 },
      delay: { time: 0.28, feedback: 0.16, mix: 0.12 },
    },
  },

  // --- GUITAR & LEAD EMULATIONS ---

  synth_lead_shineOn: {
    layers: [
      { type: 'sawtooth', detune: -3, octave: 0, gain: 0.6 },
      { type: 'sawtooth', detune: 3, octave: 0, gain: 0.6 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.4 }
    ],
    adsr: { attack: 0.01, decay: 0.4, sustain: 0.8, release: 2.2 },
    filter: { type: 'lpf', cutoff: 2800, q: 2.0 },
    lfo: { shape: 'sine', rate: 0.15, amount: 400, target: 'filter' },
    effects: {
      distortion: 0.1,
      chorus: { rate: 0.12, depth: 0.006, mix: 0.4 },
      delay: { time: 0.48, feedback: 0.35, mix: 0.28 },
    },
  },
  
  synth_lead_distorted: {
    layers: [
      { type: 'sawtooth', detune: -8, octave: 0, gain: 0.7 },
      { type: 'sawtooth', detune: 8, octave: 0, gain: 0.7 },
      { type: 'square', detune: 0, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 4, octave: 1, gain: 0.3 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.03 }
    ],
    adsr: { attack: 0.02, decay: 0.6, sustain: 0.7, release: 1.5 },
    filter: { type: 'lpf', cutoff: 1800, q: 2.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    effects: {
      distortion: 0.3,
      chorus: { rate: 0.1, depth: 0.002, mix: 0.2 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  guitar_shineOn: {
    layers: [
      { type: 'sawtooth', detune: -4, octave: 0, gain: 0.7 },
      { type: 'sine', detune: 4, octave: 0, gain: 0.5 }
    ],
    adsr: { attack: 0.01, decay: 0.4, sustain: 0.8, release: 2.2 },
    filter: { type: 'lpf', cutoff: 3600, q: 2.0 },
    lfo: { shape: 'sine', rate: 0.15, amount: 400, target: 'filter' },
    effects: {
      distortion: 0.1,
      chorus: { rate: 0.16, depth: 0.007, mix: 0.4 },
      delay: { time: 0.38, feedback: 0.28, mix: 0.22 },
    },
  },

  guitar_muffLead: {
    layers: [
      { type: 'sawtooth', detune: -8, octave: 0, gain: 0.7 },
      { type: 'sawtooth', detune: 8, octave: 0, gain: 0.7 },
      { type: 'square', detune: 0, octave: -1, gain: 0.5 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.03 }
    ],
    adsr: { attack: 0.02, decay: 0.6, sustain: 0.7, release: 1.8 },
    filter: { type: 'lpf', cutoff: 1800, q: 2.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    effects: {
      distortion: 0.6,
      chorus: { rate: 0.1, depth: 0.002, mix: 0.2 },
      delay: { time: 0.38, feedback: 0.26, mix: 0.16 },
    },
  },
  
  guitar_clean_chorus: {
    layers: [
      { type: 'triangle', detune: -2, octave: 0, gain: 0.8 },
      { type: 'sine', detune: 2, octave: 0, gain: 0.7 }
    ],
    adsr: { attack: 0.005, decay: 0.3, sustain: 0.7, release: 1.2 },
    filter: { type: 'lpf', cutoff: 4500, q: 0.8 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.15, depth: 0.007, mix: 0.35 },
      delay: { time: 0.25, feedback: 0.2, mix: 0.15 },
    },
  },

  // --- ORGAN EMULATIONS ---
  
  organ: {
    layers: [
      { type: 'triangle', detune: 0, octave: 0, gain: 1.0 },
      { type: 'triangle', detune: 2, octave: 1, gain: 0.6 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.5 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.01 },
    ],
    adsr: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.2 },
    filter: { type: 'lpf', cutoff: 4500, q: 1.5 },
    lfo: { shape: 'sine', rate: 6.5, amount: 4, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.8, depth: 0.004, mix: 0.75 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  organ_soft_jazz: {
    layers: [
      { type: 'sine', detune: 0, octave: 0, gain: 1.0 }, // 8'
      { type: 'sine', detune: 702, octave: 0, gain: 0.5 }, // 5 1/3'
      { type: 'sine', detune: 0, octave: 1, gain: 0.35 } // 4'
    ],
    adsr: { attack: 0.025, decay: 0.3, sustain: 0.9, release: 0.35 },
    filter: { type: 'lpf', cutoff: 3500, q: 0.9 },
    lfo: { shape: 'sine', rate: 5.5, amount: 3, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.5, depth: 0.005, mix: 0.65 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  organ_jimmy_smith: {
    layers: [
      { type: 'triangle', detune: 0, octave: 0, gain: 0.8 },
      { type: 'square', detune: 5, octave: 0, gain: 0.4 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.6 }
    ],
    adsr: { attack: 0.005, decay: 0.12, sustain: 0.92, release: 0.1 },
    filter: { type: 'lpf', cutoff: 5500, q: 1.2 },
    lfo: { shape: 'sine', rate: 6.5, amount: 4, target: 'pitch' },
    effects: {
      distortion: 0.05,
      chorus: { rate: 0.7, depth: 0.005, mix: 0.7 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },
  
  organ_prog: {
    layers: [
      { type: 'sawtooth', detune: -4, octave: 0, gain: 0.6 },
      { type: 'sawtooth', detune: 4, octave: 0, gain: 0.6 },
      { type: 'square', detune: 0, octave: 1, gain: 0.4 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.5 }
    ],
    adsr: { attack: 0.003, decay: 0.06, sustain: 0.98, release: 0.05 },
    filter: { type: 'lpf', cutoff: 8000, q: 1.5 },
    lfo: { shape: 'sine', rate: 7.0, amount: 5, target: 'pitch' },
    effects: {
      distortion: 0.2,
      chorus: { rate: 1.0, depth: 0.006, mix: 0.85 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  // Fallback / Legacy
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
};
