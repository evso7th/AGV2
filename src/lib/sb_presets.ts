/**
 * @fileOverview Cyber Blues Presets Library V1.0.
 * #ЗАЧЕМ: Выделенный реестр тембров для жанра Cyber Blues.
 * #ЧТО: Клон реестра Foundry для обеспечения тяжелого индустриального звука.
 */

export const SB_PRESETS = {
  synth: { 
    type: 'synth',
    name: 'Cyber Pulse Lead',
    volume: 0.65,
    osc: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 0.8 }, 
      { type: 'sine', detune: 0, octave: -1, gain: 0.15 }
    ],
    noise: { on: false },
    adsr: { a: 0.4, d: 1.0, s: 0.7, r: 1.0 }, 
    lpf: { cutoff: 1400, q: 2.0 }, 
    lfo: { rate: 0.2, amount: 400, target: 'filter' },
    drive: { type: 'soft', amount: 0.25 },
    reverbMix: 0
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    name: 'Cyber Steel Pad',
    volume: 0.62,
    osc: [
      { type: 'sawtooth', detune: 0, octave: 0, gain: 0.7 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.2 }
    ],
    adsr: { a: 1.2, d: 2.0, s: 0.8, r: 2.0 },
    lpf: { cutoff: 850, q: 1.5 }, 
    lfo: { rate: 0.1, amount: 200, target: 'filter' },
    drive: { type: 'soft', amount: 0.15 },
    reverbMix: 0
  },

  organ: {
    type: 'organ',
    name: 'Cyber B3 (Industrial)',
    volume: 0.45,
    drawbars: [8, 8, 8, 5, 0, 0, 0, 0, 0],
    adsr: { a: 0.05, d: 0.1, s: 0.85, r: 0.8 },
    lpf: 2400,
    reverbMix: 0,
    drive: { type: 'soft', amount: 0.45 },
    leslie: { rate: 5.8, pitchDepth: 0.00005, ampDepth: 0.06, driftPct: 0.12, driftRate: 0.2 },
    humanize: { detuneCents: 2.0, levelPct: 0.05, brightnessPct: 0.08 }
  },

  organ_soft_jazz: {
    type: 'organ',
    name: 'Cyber Jazz B3',
    volume: 0.42,
    drawbars: [8, 0, 8, 4, 2, 0, 0, 0, 0],
    lpf: 1800,
    adsr: { a: 0.03, d: 0.1, s: 0.8, r: 0.6 },
    reverbMix: 0,
    drive: { type: 'soft', amount: 0.22 },
    leslie: { rate: 5.2, pitchDepth: 0.00005, ampDepth: 0.04, driftPct: 0.15, driftRate: 0.15 },
    humanize: { detuneCents: 2.0, levelPct: 0.05, brightnessPct: 0.06 }
  },

  guitar_clean: {
    type: 'guitar',
    name: 'Cyber Clean Guitar',
    volume: 0.7,
    osc: { width: 0.42 },
    adsr: { a: 0.005, d: 0.25, s: 0.6, r: 0.6 },
    lpf: 5000,
    pluckBrightness: 0.8,
    reverbMix: 0
  },

  guitar_shineOn: {
    type: 'guitar',
    name: 'Cyber Shine Lead',
    volume: 0.10,
    osc: { width: 0.46 },
    drive: { type: 'soft', amount: 0.25 },
    post: { lpf: 5000 },
    adsr: { a: 0.020, d: 0.35, s: 0.65, r: 1.8 },
    delay: { time: 0.42, fb: 0.32, mix: 0.24 },
    reverbMix: 0,
    attackTransient: 0.15,
    pluckBrightness: 0.9,
    vibrato: { rate: 5.0, depthCents: 8, delay: 0.40 },
    calibrationTrimDb: 7.54
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Cyber Muff Lead',
    volume: 0.06,
    osc: { width: 0.45 },
    drive: { type: 'muff', amount: 0.4 },
    post: { lpf: 4000 },
    adsr: { a: 0.020, d: 0.5, s: 0.55, r: 1.0 },
    delay: { time: 0.30, fb: 0.18, mix: 0.12 },
    reverbMix: 0,
    attackTransient: 0.10,
    pluckBrightness: 0.6,
    vibrato: { rate: 5.5, depthCents: 10, delay: 0.30 },
    calibrationTrimDb: 3.13
  },

  ep_rhodes_warm: {
    type: 'synth',
    name: 'Cyber Rhodes',
    volume: 0.68,
    osc: [
      { type: 'sine', octave: 0, detune: 0, gain: 0.6 },
      { type: 'triangle', octave: 1, detune: 0, gain: 0.15 }
    ],
    adsr: { a: 0.01, d: 0.3, s: 0.6, r: 0.4 },
    lpf: { cutoff: 2400, q: 0.7 }, 
    reverbMix: 0
  }
};
