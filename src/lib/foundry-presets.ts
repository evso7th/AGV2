
/**
 * @fileOverview Foundry Presets Library V2.3 — "High Power Restoration".
 * #ЗАЧЕМ: Резкое повышение громкости для устранения тишины в Foundry.
 */

export const FOUNDRY_PRESETS = {
  synth: { 
    type: 'synth',
    name: 'Industrial Pulse Pad',
    volume: 0.75, // Поднято с 0.58
    osc: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 0.8 }, 
      { type: 'sine', detune: 0, octave: -1, gain: 0.5 } 
    ],
    noise: { on: false },
    adsr: { a: 0.15, d: 0.4, s: 0.5, r: 0.65 }, 
    lpf: { cutoff: 2200, q: 1.5 }, 
    lfo: { rate: 0.4, amount: 600, target: 'filter' },
    drive: { type: 'soft', amount: 0.35 },
    reverbMix: 0.08
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    name: 'Foundry Steel Pad',
    volume: 0.70, // Поднято с 0.52
    osc: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 0.7 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.6 }
    ],
    adsr: { a: 0.8, d: 1.2, s: 0.6, r: 1.2 }, 
    lpf: { cutoff: 950, q: 1.2 }, 
    lfo: { rate: 0.1, amount: 200, target: 'filter' },
    drive: { type: 'soft', amount: 0.18 },
    reverbMix: 0.12
  },

  organ: {
    type: 'synth',
    name: 'Industrial B3 (Dirty)',
    volume: 0.65, // Поднято
    osc: [
        { type: 'sine', octave: 0, detune: 0, gain: 0.8 },
        { type: 'sawtooth', octave: 1, detune: 5, gain: 0.3 }
    ],
    adsr: { a: 0.05, d: 0.1, s: 0.8, r: 0.45 }, 
    lpf: { cutoff: 3200, q: 1.0 },
    reverbMix: 0.08,
    drive: { type: 'soft', amount: 0.55 }
  },

  organ_soft_jazz: {
    type: 'synth',
    name: 'Foundry Jazz B3',
    volume: 0.62, // Поднято
    osc: [
        { type: 'sine', octave: 0, detune: 0, gain: 0.75 },
        { type: 'triangle', octave: 0, detune: 0, gain: 0.25 }
    ],
    lpf: { cutoff: 2400, q: 0.8 },
    adsr: { a: 0.03, d: 0.1, s: 0.7, r: 0.4 }, 
    reverbMix: 0.08,
    drive: { type: 'soft', amount: 0.35 }
  },

  guitar_clean: {
    type: 'guitar',
    name: 'Clean Guitar',
    volume: 0.75, 
    osc: { width: 0.42 },
    adsr: { a: 0.005, d: 0.20, s: 0.5, r: 0.4 },
    lpf: 5000, 
    pluckBrightness: 0.8,
    reverbMix: 0.05
  },

  guitar_shineOn: {
    type: 'guitar',
    name: 'Shine On Lead',
    volume: 0.68, // Поднято радикально (было 0.12)
    osc: { width: 0.46 },
    drive: { type: 'soft', amount: 0.30 },
    post: { lpf: 5000 }, 
    adsr: { a: 0.020, d: 0.30, s: 0.6, r: 1.5 }, 
    delay: { time: 0.42, fb: 0.28, mix: 0.18 },
    reverbMix: 0.08,
    attackTransient: 0.12,
    pluckBrightness: 0.9,
    vibrato: { rate: 5.0, depthCents: 8, delay: 0.40 },
    calibrationTrimDb: 7.54
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Muff Lead (Warm Grit)',
    volume: 0.72, // Поднято радикально (было 0.08)
    osc: { width: 0.45 },
    drive: { type: 'muff', amount: 0.55 },
    post: { lpf: 4200 },
    adsr: { a: 0.020, d: 0.4, s: 0.55, r: 1.0 }, 
    delay: { time: 0.30, fb: 0.18, mix: 0.10 },
    reverbMix: 0.08,
    attackTransient: 0.10,
    pluckBrightness: 0.5,
    vibrato: { rate: 5.5, depthCents: 10, delay: 0.30 },
    calibrationTrimDb: 3.13
  },

  ep_rhodes_warm: {
    type: 'synth',
    name: 'Warm Rhodes',
    volume: 0.65,
    osc: [
      { type: 'sine', octave: 0, detune: 0, gain: 0.6 },
      { type: 'triangle', octave: 1, detune: 0, gain: 0.15 }
    ],
    adsr: { a: 0.01, d: 0.25, s: 0.5, r: 0.5 }, 
    lpf: { cutoff: 2800, q: 0.7 }, 
    reverbMix: 0.08
  }
};
