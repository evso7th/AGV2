
export const prettyPresets = {
  // ───────────────────────── ORGAN ─────────────────────────
  organ_cathedral_warm: {
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
  synth_pad_emerald: {
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
  // Терменвокс: «вокальный синус», вибрато делай внешним (см. подсказки ниже)
  synth_theremin_vocal: {
    type: 'synth',
    osc: [
      { type: 'sine',     detune: 0,  gain: 0.85 },
      { type: 'triangle', detune: +5, gain: 0.20 }
    ],
    noise: { on: false, color: 'white', gain: 0 },
    adsr:  { a: 0.08, d: 0.4, s: 0.85, r: 0.8 }, // мягкая атака, длинный сустейн
    lpf:   { cutoff: 5500, q: 0.6, mode: '12dB' },
    lfo:   { rate: 0.0, amount: 0, target: 'filter' }, // питч-вибрато делаем снаружи
    chorus:{ on: false, rate: 0.2, depth: 0.004, mix: 0.15 },
    delay: { on: true, time: 0.45, fb: 0.22, hc: 4200, mix: 0.16 },
    reverbMix: 0.24
  },

  // ───────────────────────── MELL0TRON ─────────────────────────
  mellotron_strings_majestic: {
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
    // можно тонко править: pickupLPF/postLPF/drive/phaser/delays/reverbMix
    reverbMix: 0.18
  },
  guitar_muffLead: {
    type: 'guitar',
    variant: 'muffLead',
    reverbMix: 0.20
  },

  // ───────────────────────── ACOUSTIC (через Mellotron-семплы) ─────────────────────────
  acoustic_guitar_folk: {
    type: 'mellotron',
    instrument: 'acoustic', // см. карту зон ниже
    attack: 0.012, release: 0.22,
    wow: { rate: 0.1, depth: 0.0008 },   // почти без лент-дерганий
    flutter: { rate: 6.0, depth: 0.0004 },
    noise: { level: -40 },
    lpf: 7800, hpf: 110,
    reverbMix: 0.18
  }
};
