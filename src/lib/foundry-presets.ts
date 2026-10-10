/**
 * @fileOverview Foundry Presets Library V2.0 — "Zero Clipping Edition".
 * #ЗАЧЕМ: Тотальное подавление перегрузки через радикальное снижение Gain и Release.
 */

export const FOUNDRY_PRESETS = {
  synth: { 
    type: 'synth',
    name: 'Industrial Pulse Pad',
    volume: 0.22, // Снижено с 0.42
    osc: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 0.8 }, 
      { type: 'sine', detune: 0, octave: -1, gain: 0.15 }
    ],
    noise: { on: false },
    adsr: { a: 0.2, d: 0.4, s: 0.4, r: 0.12 }, // Экстремально короткий релиз
    lpf: { cutoff: 1200, q: 1.5 }, 
    lfo: { rate: 0.2, amount: 400, target: 'filter' },
    drive: { type: 'soft', amount: 0.20 },
    reverbMix: 0
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    name: 'Stable Steel Pad',
    volume: 0.18, // Снижено с 0.40
    osc: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 0.7 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.2 }
    ],
    adsr: { a: 0.8, d: 1.2, s: 0.5, r: 0.22 }, // Релиз 0.22с
    lpf: { cutoff: 750, q: 1.2 }, 
    lfo: { rate: 0.1, amount: 200, target: 'filter' },
    drive: { type: 'soft', amount: 0.12 },
    reverbMix: 0
  },

  organ: {
    type: 'organ',
    name: 'Industrial B3 (Dirty)',
    volume: 0.20, // Снижено
    drawbars: [8, 8, 8, 5, 0, 0, 0, 0, 0],
    adsr: { a: 0.05, d: 0.1, s: 0.8, r: 0.18 }, 
    lpf: 2100,
    reverbMix: 0,
    drive: { type: 'soft', amount: 0.35 },
    leslie: { rate: 5.8, pitchDepth: 0.00005, ampDepth: 0.06, driftPct: 0.12, driftRate: 0.2 },
    humanize: { detuneCents: 2.0, levelPct: 0.05, brightnessPct: 0.08 }
  },

  organ_soft_jazz: {
    type: 'organ',
    name: 'Gritty Jazz B3',
    volume: 0.18,
    drawbars: [8, 0, 8, 4, 2, 0, 0, 0, 0],
    lpf: 1600,
    adsr: { a: 0.03, d: 0.1, s: 0.7, r: 0.15 }, 
    reverbMix: 0,
    drive: { type: 'soft', amount: 0.18 },
    leslie: { rate: 5.2, pitchDepth: 0.00005, ampDepth: 0.04, driftPct: 0.15, driftRate: 0.15 },
    humanize: { detuneCents: 2.0, levelPct: 0.05, brightnessPct: 0.06 }
  },

  guitar_clean: {
    type: 'guitar',
    name: 'Clean Guitar',
    volume: 0.45, // Снижено
    osc: { width: 0.42 },
    adsr: { a: 0.005, d: 0.20, s: 0.5, r: 0.2 },
    lpf: 4500, 
    pluckBrightness: 0.7,
    reverbMix: 0
  },

  guitar_shineOn: {
    type: 'guitar',
    name: 'Shine On Lead',
    volume: 0.04, // Снижено с 0.09
    osc: { width: 0.46 },
    drive: { type: 'soft', amount: 0.20 },
    post: { lpf: 4500 }, 
    adsr: { a: 0.020, d: 0.30, s: 0.6, r: 0.45 }, 
    delay: { time: 0.42, fb: 0.28, mix: 0.18 },
    reverbMix: 0,
    attackTransient: 0.12,
    pluckBrightness: 0.8,
    vibrato: { rate: 5.0, depthCents: 8, delay: 0.40 },
    calibrationTrimDb: 7.54
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Muff Lead (Warm Grit)',
    volume: 0.02, // Снижено с 0.05
    osc: { width: 0.45 },
    drive: { type: 'muff', amount: 0.35 },
    post: { lpf: 3500 },
    adsr: { a: 0.020, d: 0.4, s: 0.5, r: 0.35 }, 
    delay: { time: 0.30, fb: 0.15, mix: 0.10 },
    reverbMix: 0,
    attackTransient: 0.08,
    pluckBrightness: 0.5,
    vibrato: { rate: 5.5, depthCents: 10, delay: 0.30 },
    calibrationTrimDb: 3.13
  },

  ep_rhodes_warm: {
    type: 'synth',
    name: 'Warm Rhodes',
    volume: 0.45,
    osc: [
      { type: 'sine', octave: 0, detune: 0, gain: 0.6 },
      { type: 'triangle', octave: 1, detune: 0, gain: 0.15 }
    ],
    adsr: { a: 0.01, d: 0.25, s: 0.5, r: 0.15 }, 
    lpf: { cutoff: 2200, q: 0.7 }, 
    reverbMix: 0
  }
};
