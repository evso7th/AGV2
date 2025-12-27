
export const V2_PRESETS = {
  // ───────────────────────── ORGAN ─────────────────────────
  organ: {
    type: 'organ',
    drawbars: [8, 0, 8, 6, 0, 3, 0, 2, 0], // 16', 5⅓', 8', 4', ...
    vibratoRate: 6.0, vibratoDepth: 0.003,
    leslie: { mode: 'slow', slow: 0.65, fast: 5.5, accel: 0.6 },
    lpf: 7800, hpf: 90,
    chorusMix: 0.22,
    reverbMix: 0.15
  },
  organ_soft_jazz: {
    type: 'organ',
    drawbars: [4, 0, 8, 8, 0, 4, 0, 0, 0], // мягкий «джазовый» корпус
    vibratoRate: 5.5, vibratoDepth: 0.0025,
    leslie: { mode: 'slow', slow: 0.7, fast: 6.2, accel: 0.55 },
    lpf: 7200, hpf: 100,
    chorusMix: 0.18,
    reverbMix: 0.12
  },

  // ───────────────────────── SYNTH (AMBIENT PAD / THEREMIN) ─────────────────────────
  synth: {
    type: 'synth',
    osc: [
      { type: 'sawtooth', detune: 0,  gain: 0.55 },
      { type: 'triangle', detune: -7, gain: 0.35 },
      { type: 'sine',     detune: +5, gain: 0.20 }
    ],
    noise: { on: true, color: 'white', gain: 0.02 },
    adsr:  { a: 0.5, d: 0.8, s: 0.7, r: 2.4 },
    lpf:   { cutoff: 1600, q: 0.8, mode: '24dB' },
    lfo:   { rate: 0.12, amount: 250, target: 'filter' },
    chorus:{ on: true, rate: 0.22, depth: 0.006, mix: 0.28 },
    delay: { on: true, time: 0.38, fb: 0.25, hc: 3800, mix: 0.18 },
    reverbMix: 0.22
  },
  synth_ambient_pad_lush: {
    type: 'synth',
    osc: [
      { type: 'sawtooth', detune: -8,    gain: 0.55 },
      { type: 'sawtooth', detune: +8,    gain: 0.55 },
      { type: 'sine', detune: 1200, gain: 0.25 }
    ],
    noise: { on: true, color: 'white', gain: 0.02 },
    adsr:  { a: 2.5, d: 2.0, s: 0.8, r: 4.0 },
    lpf:   { cutoff: 1200, q: 1.5, mode: '24dB' },
    lfo:   { rate: 0.05, amount: 600, target: 'filter' },
    chorus:{ on: true, rate: 0.20, depth: 0.008, mix: 0.65 },
    delay: { on: true, time: 0.75, fb: 0.45, hc: 3800, mix: 0.35 },
    reverbMix: 0.28
  },
  theremin: {
    type: 'synth',
    osc: [
      { type: 'sine',     detune: 0,  gain: 0.85 },
      { type: 'triangle', detune: +5, gain: 0.20 }
    ],
    noise: { on: false, color: 'white', gain: 0 },
    adsr:  { a: 0.08, d: 0.4, s: 0.85, r: 0.8 },
    lpf:   { cutoff: 5500, q: 0.6, mode: '12dB' },
    lfo:   { rate: 0.0, amount: 0, target: 'filter' },
    chorus:{ on: false, rate: 0.2, depth: 0.004, mix: 0.15 },
    delay: { on: true, time: 0.45, fb: 0.22, hc: 4200, mix: 0.16 },
    reverbMix: 0.24
  },

  // ───────────────────────── MELL0TRON ─────────────────────────
  mellotron: {
    type: 'mellotron',
    instrument: 'strings',
    attack: 0.05, release: 0.35,
    wow: { rate: 0.28, depth: 0.0032 },
    flutter: { rate: 5.2, depth: 0.0009 },
    noise: { level: -36 },
    lpf: 9000, hpf: 120,
    reverbMix: 0.22
  },
  mellotron_choir_dark: {
    type: 'mellotron',
    instrument: 'choir',
    attack: 0.08, release: 0.45,
    wow: { rate: 0.25, depth: 0.0028 },
    flutter: { rate: 5.5, depth: 0.0008 },
    noise: { level: -34 },
    lpf: 8500, hpf: 140,
    reverbMix: 0.26
  },
  mellotron_flute_intimate: {
    type: 'mellotron',
    instrument: 'flute',
    attack: 0.03, release: 0.28,
    wow: { rate: 0.32, depth: 0.0025 },
    flutter: { rate: 6.0, depth: 0.0007 },
    noise: { level: -35 },
    lpf: 9500, hpf: 150,
    reverbMix: 0.20
  },

  // ───────────────────────── GUITAR (электро) ─────────────────────────
  guitar_shineOn: {
    type: 'guitar',
    variant: 'shineOn',
    reverbMix: 0.18
  },
  electricGuitar: {
    type: 'guitar',
    variant: 'muffLead',
    osc: [
        { type: 'sawtooth', detune: 0, octave: 0, gain: 1.0 },
        { type: 'pulse', detune: 0, octave: -1, gain: 0.5 },
        { type: 'pulse', detune: 4, octave: 1, gain: 0.3 }
    ],
    reverbMix: 0.3,
    drive: { type: 'muff', amount: 0.85 },
    post: { lpf: 4500, mids: [{f:900, q:0.9, g:1.5}, {f:3000, q:1.2, g:-2.5}] },
    delayA: { time: 0.5, fb: 0.45, hc:3200, wet:0.3 },
  },

  // ───────────────────────── ACOUSTIC (через Mellotron-семплы) ─────────────────────────
  acousticGuitar: {
    type: 'mellotron',
    instrument: 'acoustic',
    attack: 0.01, release: 0.3,
    wow: { rate: 0.1, depth: 0.0005 },
    flutter: { rate: 7.0, depth: 0.0003 },
    noise: { level: -42 },
    lpf: 8200, hpf: 100,
    reverbMix: 0.15
  }
};
