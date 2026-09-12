/**
 * @fileOverview Cyber Blues Presets Library V1.1 — "Rock Hardening".
 * #ЗАЧЕМ: Выделенный реестр тембров для жанра Cyber Blues.
 * #ЧТО: Внедрение агрессивных роковых тембров (sawtooth, drive) для органов и пэдов.
 */

export const SB_PRESETS = {
  // ───── PADS & LEADS ─────
  
  synth: { 
    type: 'synth',
    name: 'Cyber Rock Pad',
    volume: 0.65,
    osc: [
      { type: 'sawtooth', detune: -7, octave: 0, gain: 0.5 }, 
      { type: 'sawtooth', detune: +7, octave: 0, gain: 0.4 }, 
      { type: 'square', detune: 0, octave: -1, gain: 0.25 }
    ],
    noise: { on: true, gain: 0.02 },
    adsr: { a: 0.2, d: 0.8, s: 0.7, r: 1.2 }, 
    lpf: { cutoff: 2200, q: 2.5 }, 
    lfo: { rate: 0.8, amount: 600, target: 'filter' },
    drive: { type: 'soft', amount: 0.40 },
    reverbMix: 0.2
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    name: 'Cyber Wall Pad',
    volume: 0.62,
    osc: [
      { type: 'sawtooth', detune: -4, octave: 0, gain: 0.6 },
      { type: 'sawtooth', detune: +4, octave: 1, gain: 0.3 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.4 }
    ],
    adsr: { a: 1.5, d: 2.0, s: 0.8, r: 2.5 },
    lpf: { cutoff: 1100, q: 1.2 }, 
    lfo: { rate: 0.1, amount: 300, target: 'filter' },
    drive: { type: 'soft', amount: 0.20 },
    reverbMix: 0.3
  },

  // ───── ORGANS ─────

  organ: {
    type: 'organ',
    name: 'Cyber Rock B3',
    volume: 0.48,
    // "All out" drawbars for heavy rock sound
    drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8],
    adsr: { a: 0.02, d: 0.1, s: 0.9, r: 0.6 },
    lpf: 3200,
    reverbMix: 0.15,
    drive: { type: 'soft', amount: 0.65 },
    leslie: { rate: 6.2, pitchDepth: 0.0001, ampDepth: 0.08, driftPct: 0.15, driftRate: 0.3 },
    humanize: { detuneCents: 3.5, levelPct: 0.08, brightnessPct: 0.12 }
  },

  organ_soft_jazz: {
    type: 'organ',
    name: 'Cyber Dirty Jazz',
    volume: 0.45,
    drawbars: [8, 0, 8, 5, 3, 0, 0, 0, 0],
    lpf: 2100,
    adsr: { a: 0.03, d: 0.1, s: 0.8, r: 0.5 },
    reverbMix: 0.1,
    drive: { type: 'soft', amount: 0.35 },
    leslie: { rate: 5.4, pitchDepth: 0.00008, ampDepth: 0.05, driftPct: 0.18, driftRate: 0.2 },
    humanize: { detuneCents: 2.5, levelPct: 0.06, brightnessPct: 0.08 }
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