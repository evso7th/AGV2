

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
export const SYNTH_PRESETS: Record<Exclude<MelodyInstrument | BassInstrument, 'piano' | 'violin' | 'flute' | 'acousticGuitarSolo' | 'guitarChords' | 'none' | 'E-Bells_melody' | 'G-Drops'>, SynthPreset> = {
  
  // --- BASS PRESETS ---
  classicBass: {
    layers: [{ type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.3 },
    filter: { type: 'lpf', cutoff: 400, q: 2.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0.05, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0
  },
  glideBass: {
    layers: [{ type: 'triangle', detune: 0, octave: 0, gain: 1.0 }],
    adsr: { attack: 0.05, decay: 0.1, sustain: 0.9, release: 1.5 },
    filter: { type: 'lpf', cutoff: 300, q: 1.2 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } },
    portamento: 0.03
  },
  ambientDrone: {
    layers: [{ type: 'sine', detune: 4, octave: 0, gain: 1.0 }, { type: 'sine', detune: -4, octave: -1, gain: 0.7 }],
    adsr: { attack: 0.8, decay: 1.5, sustain: 0.8, release: 3.0 },
    filter: { type: 'lpf', cutoff: 250, q: 1.5 },
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
    filter: { type: 'lpf', cutoff: 180, q: 1.0 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: { distortion: 0, chorus: { rate: 0.1, depth: 0.002, mix: 0.4 }, delay: { time: 0.015, feedback: 0, mix: 0 } },
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
      { type: 'sine', detune: 0, octave: 0, gain: 1.0 }, // Основной тон
      { type: 'sine', detune: 2, octave: 1, gain: 0.5 }, // Верхний регистр
      { type: 'sine', detune: 0, octave: 0, gain: 0.4 }, // 5-й регистр (гармоника)
      { type: 'noise', detune: 0, octave: 0, gain: 0.05 }, // "Клик" клавиши
    ],
    adsr: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.4 },
    filter: { type: 'lpf', cutoff: 3500, q: 2 },
    lfo: { shape: 'sine', rate: 5.5, amount: 0.01, target: 'pitch' }, // Более выраженное вибрато
    effects: {
      distortion: 0,
      chorus: { rate: 0.5, depth: 0.005, mix: 0.4 }, // Имитация Leslie-динамика
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  synth: {
    layers: [
      { type: 'sawtooth', detune: -6, octave: 0, gain: 1.0 },
      { type: 'sawtooth', detune: 6, octave: 0, gain: 1.5 },
      { type: 'square', detune: 0, octave: -1, gain: 1.5 },
    ],
    adsr: { attack: 0.02, decay: 0.4, sustain: 0.7, release: 0.5 },
    filter: { type: 'lpf', cutoff: 2200, q: 4.5 }, // Более агрессивный резонанс
    lfo: { shape: 'sine', rate: 0.2, amount: 800, target: 'filter' }, // Медленная развертка фильтра
    effects: {
      distortion: 0.1,
      chorus: { rate: 0.3, depth: 0.005, mix: 0.6 },
      delay: { time: 0.4, feedback: 0.35, mix: 0.25 },
    },
  },

  mellotron: {
    layers: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 },
      { type: 'sine', detune: 5, octave: 0, gain: 0.7 },
    ],
    adsr: { attack: 0.15, decay: 0.1, sustain: 0.9, release: 1.0 }, // Чуть более быстрая атака
    filter: { type: 'lpf', cutoff: 1800, q: 2.5 }, // Более "лоу-файный" звук
    lfo: { shape: 'sine', rate: 1.5, amount: 0.03, target: 'pitch' }, // "Wow and flutter" ленты
    effects: {
      distortion: 0.1,
      chorus: { rate: 0.1, depth: 0.001, mix: 0.3 },
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },

  theremin: {
    layers: [
      { type: 'sine', detune: 0, octave: 0, gain: 1.0 },
      { type: 'sine', detune: 2, octave: 1, gain: 0.3 },
    ],
    adsr: { attack: 0.3, decay: 0.1, sustain: 1.0, release: 0.5 },
    filter: { type: 'lpf', cutoff: 6000, q: 1 },
    lfo: { shape: 'sine', rate: 4.5, amount: 0.06, target: 'pitch' }, // Классическое вибрато
    effects: {
      distortion: 0,
      chorus: { rate: 0.2, depth: 0.003, mix: 0.3 },
      delay: { time: 0.25, feedback: 0.2, mix: 0.15 },
    },
    portamento: 0.08
  },
  
  electricGuitar: {
    layers: [
      { type: 'sawtooth', detune: -2, octave: 0, gain: 1.2 },
      { type: 'sawtooth', detune: 2, octave: 0, gain: 1.1 },
      { type: 'square', detune: 0, octave: 1, gain: 0.6 },
    ],
    adsr: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.8 },
    filter: { type: 'bpf', cutoff: 1800, q: 2.5 },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: {
      distortion: 0.8,
      chorus: { rate: 0.1, depth: 0.002, mix: 0.2 },
      delay: { time: 0.375, feedback: 0.4, mix: 0.35 },
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
      { type: 'triangle', detune: 0, octave: 0, gain: 1.2 },
      { type: 'noise', detune: 0, octave: 0, gain: 0.4 }, // Увеличиваем громкость "щипка"
    ],
    adsr: { attack: 0.001, decay: 0.4, sustain: 0.2, release: 0.4 }, // Увеличиваем сустейн и затухание
    filter: { type: 'lpf', cutoff: 4000, q: 3.0 }, // Открываем фильтр, чтобы было больше верхов
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
    effects: {
      distortion: 0,
      chorus: { rate: 0.1, depth: 0.002, mix: 0.2 }, // Добавляем легкий хорус для объема
      delay: { time: 0, feedback: 0, mix: 0 },
    },
  },
};
