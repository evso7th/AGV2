/**
 * @fileOverview Cyber Blues Presets Library V1.2 — "Ensemble Hardening".
 * #ЗАЧЕМ: Выделенный реестр тембров для жанра Cyber Blues.
 * #ЧТО: Принудительная установка агрессивных роковых настроек для ВСЕХ органов и пэдов,
 *       включая те, что используются в динамических группах (dynamicOrgan, dynamicPad).
 */

export const SB_PRESETS = {
  // ───── PADS & SYNTHS (Dynamic Group: dynamicPad) ─────
  
  synth: { 
    type: 'synth',
    name: 'Cyber Lead Synth',
    volume: 0.65,
    osc: [
      { type: 'sawtooth', detune: -8, octave: 0, gain: 0.5 }, 
      { type: 'sawtooth', detune: +8, octave: 0, gain: 0.4 }, 
      { type: 'square', detune: 0, octave: -1, gain: 0.3 }
    ],
    noise: { on: true, gain: 0.025 },
    adsr: { a: 0.1, d: 0.6, s: 0.7, r: 1.0 }, 
    lpf: { cutoff: 2800, q: 3.5 }, 
    lfo: { rate: 1.2, amount: 800, target: 'filter' },
    drive: { type: 'soft', amount: 0.45 },
    reverbMix: 0.25
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    name: 'Cyber Wall Pad',
    volume: 0.62,
    osc: [
      { type: 'sawtooth', detune: -5, octave: 0, gain: 0.6 },
      { type: 'sawtooth', detune: +5, octave: 0, gain: 0.5 },
      { type: 'square', detune: 0, octave: -1, gain: 0.4 }
    ],
    adsr: { a: 1.2, d: 2.0, s: 0.8, r: 2.5 },
    lpf: { cutoff: 1400, q: 1.5 }, 
    lfo: { rate: 0.15, amount: 400, target: 'filter' },
    drive: { type: 'soft', amount: 0.30 },
    reverbMix: 0.3
  },

  synth_cave_pad: {
    type: 'synth',
    name: 'Cyber Abyssal Wall',
    volume: 0.60,
    osc: [
      { type: 'sawtooth', detune: -12, octave: -1, gain: 0.6 },
      { type: 'square', detune: 12, octave: -1, gain: 0.5 },
      { type: 'sine', detune: 0, octave: -2, gain: 0.8 }
    ],
    adsr: { a: 2.0, d: 3.0, s: 0.9, r: 4.0 },
    lpf: { cutoff: 800, q: 2.0 }, 
    drive: { type: 'soft', amount: 0.50 },
    reverbMix: 0.45
  },

  // ───── ORGANS (Dynamic Group: dynamicOrgan) ─────

  organ: {
    type: 'organ',
    name: 'Cyber Rock B3 (Lord)',
    volume: 0.50,
    // Extreme drawbars for "Purple" growl
    drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8],
    adsr: { a: 0.01, d: 0.1, s: 0.95, r: 0.5 },
    lpf: 4500,
    reverbMix: 0.18,
    drive: { type: 'soft', amount: 0.72 },
    leslie: { rate: 6.8, pitchDepth: 0.00015, ampDepth: 0.10, driftPct: 0.12, driftRate: 0.4 },
    humanize: { detuneCents: 4.0, levelPct: 0.10, brightnessPct: 0.15 }
  },

  organ_soft_jazz: {
    type: 'organ',
    name: 'Cyber Gritty Jazz B3',
    volume: 0.46,
    drawbars: [8, 0, 8, 6, 4, 0, 0, 0, 0],
    lpf: 2400,
    adsr: { a: 0.03, d: 0.1, s: 0.85, r: 0.4 },
    reverbMix: 0.12,
    drive: { type: 'soft', amount: 0.40 },
    leslie: { rate: 5.8, pitchDepth: 0.0001, ampDepth: 0.06, driftPct: 0.15, driftRate: 0.2 },
    humanize: { detuneCents: 2.5, levelPct: 0.06, brightnessPct: 0.08 }
  },

  organ_prog: {
    type: 'organ',
    name: 'Cyber Prog B3',
    volume: 0.52,
    drawbars: [8, 8, 8, 0, 0, 8, 8, 8, 8],
    lpf: 5500,
    adsr: { a: 0.02, d: 0.1, s: 0.9, r: 0.6 },
    reverbMix: 0.2,
    drive: { type: 'soft', amount: 0.55 },
    leslie: { rate: 7.2, pitchDepth: 0.0002, ampDepth: 0.12, driftPct: 0.10, driftRate: 0.5 }
  },

  organ_jimmy_smith: {
    type: 'organ',
    name: 'Cyber Percussive B3',
    volume: 0.44,
    drawbars: [8, 8, 0, 0, 0, 0, 0, 0, 0],
    lpf: 3800,
    adsr: { a: 0.005, d: 0.08, s: 0.7, r: 0.3 },
    reverbMix: 0.1,
    drive: { type: 'soft', amount: 0.30 }
  },

  // ───── GUITARS ─────

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
