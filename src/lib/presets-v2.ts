

// V2 Presets — совместимы с buildMultiInstrument()
// Проверено на соответствие фабрике от 2024-01

export const V2_PRESETS = {

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTH (Pads, Leads, Keys)
  // ═══════════════════════════════════════════════════════════════════════════

  synth: { // Emerald Pad — основной ambient pad
    type: 'synth',
    comp: { threshold: -18, ratio: 4, attack: 0.003, release: 0.15, makeup: 6 },
    osc: [
      { type: 'sawtooth', detune: -4, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: +4, octave: 0, gain: 0.5 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.7 }
    ],
    noise: { on: true, gain: 0.03 },
    adsr: { a: 0.8, d: 1.2, s: 0.7, r: 3.0 },
    lpf: { cutoff: 1600, q: 1.2, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0.18, amount: 450, target: 'filter' },
    chorus: { on: true, rate: 0.2, depth: 0.007, mix: 0.4 },
    delay: { on: true, time: 0.5, fb: 0.3, hc: 4000, mix: 0.2 },
    reverbMix: 0.25
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    comp: { threshold: -20, ratio: 3, attack: 0.005, release: 0.2, makeup: 5 },
    osc: [
      { type: 'sawtooth', detune: -4, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: +4, octave: 0, gain: 0.5 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.7 }
    ],
    noise: { on: true, gain: 0.03 },
    adsr: { a: 1.2, d: 2.0, s: 0.8, r: 4.0 },
    lpf: { cutoff: 1400, q: 1.0, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0.15, amount: 500, target: 'filter' },
    chorus: { on: true, rate: 0.18, depth: 0.008, mix: 0.45 },
    delay: { on: true, time: 0.55, fb: 0.35, hc: 3500, mix: 0.25 },
    reverbMix: 0.3
  },

  synth_cave_pad: {
    type: 'synth',
    comp: { threshold: -22, ratio: 3, attack: 0.01, release: 0.25, makeup: 4 },
    osc: [
      { type: 'sawtooth', detune: -6, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: +6, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: 0, octave: 1, gain: 0.25 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.8 },
      { type: 'triangle', detune: 2, octave: -1, gain: 0.5 }
    ],
    noise: { on: true, gain: 0.04 },
    adsr: { a: 1.5, d: 2.0, s: 0.8, r: 5.0 },
    lpf: { cutoff: 1400, q: 1.1, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0.1, amount: 5, target: 'pitch' }, // TODO: pitch LFO не реализован
    chorus: { on: true, rate: 0.15, depth: 0.008, mix: 0.6 },
    delay: { on: true, time: 0.52, fb: 0.45, hc: 2500, mix: 0.35 },
    reverbMix: 0.45
  },

  theremin: {
    type: 'synth',
    comp: { threshold: -15, ratio: 2, attack: 0.01, release: 0.1, makeup: 3 },
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 1.0 },
      { type: 'sine', detune: 2, octave: 1, gain: 0.3 }
    ],
    noise: { on: false, gain: 0 },
    adsr: { a: 0.4, d: 0.1, s: 0.9, r: 2.8 },
    lpf: { cutoff: 5000, q: 0.7, mode: '12dB' },
    lfo: { shape: 'sine', rate: 5.5, amount: 3, target: 'pitch' }, // TODO: pitch LFO
    chorus: { on: true, rate: 0.1, depth: 0.002, mix: 0.2 },
    delay: { on: false, time: 0.3, fb: 0.2, hc: 4000, mix: 0 },
    reverbMix: 0.28
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MELLOTRON-STYLE (Synth-based strings/choir/flute emulation)
  // ═══════════════════════════════════════════════════════════════════════════

  mellotron: { // Majestic Strings
    type: 'synth',
    comp: { threshold: -18, ratio: 3, attack: 0.005, release: 0.15, makeup: 5 },
    osc: [
      { type: 'sawtooth', detune: -5, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: +5, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 0, octave: -1, gain: 0.4 }
    ],
    noise: { on: true, gain: 0.02 },
    adsr: { a: 0.4, d: 0.8, s: 0.7, r: 1.5 },
    lpf: { cutoff: 3200, q: 1.5, mode: '24dB' },
    lfo: { shape: 'sine', rate: 4.5, amount: 4, target: 'pitch' },
    chorus: { on: true, rate: 0.3, depth: 0.008, mix: 0.5 },
    delay: { on: true, time: 0.3, fb: 0.2, hc: 4500, mix: 0.15 },
    reverbMix: 0.35
  },

  mellotron_flute_intimate: {
    type: 'synth',
    comp: { threshold: -15, ratio: 2, attack: 0.01, release: 0.1, makeup: 4 },
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.9 },
      { type: 'triangle', detune: 2, octave: 1, gain: 0.2 }
    ],
    noise: { on: true, gain: 0.07 }, // breath noise
    adsr: { a: 0.05, d: 0.2, s: 0.8, r: 0.3 },
    lpf: { cutoff: 7500, q: 0.8, mode: '12dB' },
    lfo: { shape: 'sine', rate: 4.8, amount: 2.5, target: 'pitch' },
    chorus: { on: false, rate: 0.2, depth: 0.005, mix: 0 },
    delay: { on: true, time: 0.15, fb: 0.1, hc: 5000, mix: 0.1 },
    reverbMix: 0.15
  },

  mellotron_choir: {
    type: 'synth',
    comp: { threshold: -20, ratio: 3, attack: 0.008, release: 0.2, makeup: 5 },
    osc: [
      { type: 'sawtooth', detune: -3, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: +3, octave: 0, gain: 0.4 },
      { type: 'sine', detune: 0, octave: 0, gain: 0.5 },
      { type: 'triangle', detune: 5, octave: 1, gain: 0.2 }
    ],
    noise: { on: true, gain: 0.025 },
    adsr: { a: 0.6, d: 1.0, s: 0.75, r: 2.0 },
    lpf: { cutoff: 2800, q: 1.0, mode: '24dB' },
    lfo: { shape: 'sine', rate: 5.2, amount: 3, target: 'pitch' },
    chorus: { on: true, rate: 0.25, depth: 0.006, mix: 0.4 },
    delay: { on: true, time: 0.4, fb: 0.25, hc: 3800, mix: 0.2 },
    reverbMix: 0.4
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRIC PIANO (Rhodes-style)
  // ═══════════════════════════════════════════════════════════════════════════

  ep_rhodes_warm: {
    type: 'synth',
    comp: { threshold: -16, ratio: 3, attack: 0.003, release: 0.12, makeup: 4 },
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.58 },
      { type: 'triangle', detune: 0, octave: 1, gain: 0.14 }, // +1200 cents = +1 octave
      { type: 'sine', detune: 0, octave: 1, gain: 0.08 }
    ],
    noise: { on: false, gain: 0 },
    adsr: { a: 0.008, d: 0.28, s: 0.68, r: 0.90 },
    lpf: { cutoff: 3500, q: 0.9, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    chorus: { on: true, rate: 0.25, depth: 0.006, mix: 0.22 },
    delay: { on: true, time: 0.26, fb: 0.12, hc: 4500, mix: 0.10 },
    reverbMix: 0.18
  },

  ep_rhodes_70s: {
    type: 'synth',
    comp: { threshold: -16, ratio: 3, attack: 0.003, release: 0.12, makeup: 4 },
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.54 },
      { type: 'triangle', detune: 0, octave: 1, gain: 0.16 },
      { type: 'sine', detune: 0, octave: 1, gain: 0.06 }
    ],
    noise: { on: false, gain: 0 },
    adsr: { a: 0.008, d: 0.30, s: 0.66, r: 0.95 },
    lpf: { cutoff: 4200, q: 0.9, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    chorus: { on: true, rate: 0.20, depth: 0.006, mix: 0.24 },
    delay: { on: true, time: 0.28, fb: 0.16, hc: 4200, mix: 0.12 },
    reverbMix: 0.22
    // NOTE: tremolo и phaser требуют доработки фабрики
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTH-BASED LEADS (используют synth engine с гитарным характером)
  // ═══════════════════════════════════════════════════════════════════════════

  synth_lead_shineOn: { // Gilmour-style clean lead
    type: 'synth',
    comp: { threshold: -18, ratio: 4, attack: 0.005, release: 0.15, makeup: 6 },
    osc: [
      { type: 'sawtooth', detune: -3, octave: 0, gain: 0.6 },
      { type: 'sawtooth', detune: +3, octave: 0, gain: 0.6 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.4 }
    ],
    noise: { on: false, gain: 0 },
    adsr: { a: 0.01, d: 0.4, s: 0.8, r: 2.2 },
    lpf: { cutoff: 2800, q: 2.0, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0.15, amount: 400, target: 'filter' },
    chorus: { on: true, rate: 0.12, depth: 0.006, mix: 0.4 },
    delay: { on: true, time: 0.48, fb: 0.35, hc: 3500, mix: 0.28 },
    reverbMix: 0.25
  },

  synth_lead_distorted: { // Muff-style lead (через synth engine)
    type: 'synth',
    comp: { threshold: -15, ratio: 6, attack: 0.003, release: 0.1, makeup: 8 },
    osc: [
      { type: 'sawtooth', detune: -8, octave: 0, gain: 0.7 },
      { type: 'sawtooth', detune: +8, octave: 0, gain: 0.7 },
      { type: 'square', detune: 0, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: 4, octave: 1, gain: 0.3 }
    ],
    noise: { on: true, gain: 0.03 },
    adsr: { a: 0.02, d: 0.6, s: 0.7, r: 1.5 },
    lpf: { cutoff: 1800, q: 2.5, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0, amount: 0, target: 'filter' },
    chorus: { on: true, rate: 0.1, depth: 0.002, mix: 0.2 },
    delay: { on: false, time: 0.3, fb: 0.2, hc: 4000, mix: 0 },
    reverbMix: 0.15
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GUITAR (правильный формат для guitar engine)
  // ═══════════════════════════════════════════════════════════════════════════

  guitar_shineOn: {
    type: 'guitar',
    volume: 0.25,
    comp: { threshold: -18, ratio: 3, attack: 0.01, release: 0.12, makeup: 3 },
    osc: { width: 0.46, detune: 5, mainGain: 0.85, detGain: 0.18, subGain: 0.25 },
    pickup: { cutoff: 3600, q: 1.0 },
    drive: { type: 'soft', amount: 0.2 },
    post: { 
      lpf: 5200, 
      mids: [
        { f: 850, q: 0.9, g: 2 }, 
        { f: 2500, q: 1.4, g: -1.5 }
      ] 
    },
    phaser: { on: true, rate: 0.16, depth: 600, mix: 0.22 },
    delayA: { on: true, time: 0.38, fb: 0.28, hc: 3600, mix: 0.22 },
    delayB: { on: false },
    adsr: { a: 0.006, d: 0.35, s: 0.6, r: 1.6 },
    reverbMix: 0.18
  },

  guitar_muffLead: {
    type: 'guitar',
    volume: 0.25,
    comp: { threshold: -20, ratio: 4, attack: 0.005, release: 0.1, makeup: 4 },
    osc: { width: 0.5, detune: 7, mainGain: 0.8, detGain: 0.2, subGain: 0.3 },
    pickup: { cutoff: 3200, q: 1.2 },
    drive: { type: 'muff', amount: 0.65 },
    post: { 
      lpf: 4700, 
      mids: [
        { f: 850, q: 0.9, g: 2 }, 
        { f: 3200, q: 1.4, g: -2 }
      ] 
    },
    phaser: { on: true, rate: 0.18, depth: 700, mix: 0.18 },
    delayA: { on: true, time: 0.38, fb: 0.26, hc: 3600, mix: 0.16 },
    delayB: { on: true, time: 0.52, fb: 0.22, hc: 3600, mix: 0.12 },
    adsr: { a: 0.008, d: 0.5, s: 0.65, r: 1.8 },
    reverbMix: 0.2
  },

  guitar_clean_chorus: {
    type: 'guitar',
    comp: { threshold: -16, ratio: 2.5, attack: 0.01, release: 0.15, makeup: 2 },
    osc: { width: 0.4, detune: 3, mainGain: 0.9, detGain: 0.15, subGain: 0.2 },
    pickup: { cutoff: 4500, q: 0.8 },
    drive: { type: 'soft', amount: 0.1 },
    post: { 
      lpf: 6000, 
      mids: [
        { f: 800, q: 1.0, g: 1 }, 
        { f: 2200, q: 1.2, g: 0 }
      ] 
    },
    phaser: { on: false, rate: 0.15, depth: 500, mix: 0 },
    delayA: { on: true, time: 0.25, fb: 0.2, hc: 5000, mix: 0.15 },
    delayB: { on: false },
    adsr: { a: 0.005, d: 0.3, s: 0.7, r: 1.2 },
    reverbMix: 0.22
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGAN (требует реализации organ engine в фабрике)
  // ═══════════════════════════════════════════════════════════════════════════

  organ: {
    type: 'organ' as const,
    volume: 0.7,
    drawbars: [8, 8, 8, 6, 0, 0, 0, 0, 0],  // Full and rich
    vibrato: { type: 'C3' as const, rate: 6.5 },
    leslie: { on: true, mode: 'slow' as const, slow: 0.8, fast: 6.5, accel: 0.8, mix: 0.75 },
    percussion: { on: true, harmonic: '2nd' as const, decay: 'fast' as const, volume: 'normal' as const },
    keyClick: 0.005,
    tonewheel: { crosstalk: 0.03, leakage: 0.02, complexity: 0.4 },
    lpf: 6000,
    hpf: 50,
    reverbMix: 0.18,
    adsr: { a: 0.004, d: 0.1, s: 0.95, r: 0.08 }
  },
  
  organ_soft_jazz: {
    type: 'organ' as const,
    volume: 0.15,
    drawbars: [8, 4, 8, 4, 0, 0, 0, 0, 0],
    vibrato: { type: 'C2' as const, rate: 5.5 },
    leslie: { on: true, mode: 'slow' as const, slow: 0.5, fast: 5.5, accel: 1.0, mix: 0.65 },
    percussion: { on: false, harmonic: '2nd' as const, decay: 'slow' as const, volume: 'soft' as const },
    keyClick: 0,
    tonewheel: { crosstalk: 0.01, leakage: 0.005, complexity: 0.15 },
    lpf: 3500,
    hpf: 50,
    reverbMix: 0.25,
    adsr: { a: 0.025, d: 0.3, s: 0.9, r: 0.35 }
  },

  organ_jimmy_smith: {
    type: 'organ' as const,
    volume: 0.65,
    drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0],
    vibrato: { type: 'C3' as const, rate: 6.5 },
    leslie: { on: true, mode: 'slow' as const, slow: 0.7, fast: 6.2, accel: 0.7, mix: 0.7 },
    percussion: { on: true, harmonic: '2nd' as const, decay: 'fast' as const, volume: 'soft' as const },
    keyClick: 0.004,
    tonewheel: { crosstalk: 0.025, leakage: 0.015, complexity: 0.35 },
    lpf: 5500,
    hpf: 55,
    reverbMix: 0.15,
    adsr: { a: 0.005, d: 0.12, s: 0.92, r: 0.1 }
  },

  organ_prog: {
    type: 'organ' as const,
    volume: 0.75,
    drawbars: [8, 6, 8, 8, 4, 5, 3, 2, 0],
    vibrato: { type: 'V3' as const, rate: 7.0 },
    leslie: { on: true, mode: 'fast' as const, slow: 1.0, fast: 7.5, accel: 0.5, mix: 0.85 },
    percussion: { on: true, harmonic: '3rd' as const, decay: 'slow' as const, volume: 'normal' as const },
    keyClick: 0.007,
    tonewheel: { crosstalk: 0.05, leakage: 0.03, complexity: 0.6 },
    lpf: 8000,
    hpf: 70,
    reverbMix: 0.22,
    adsr: { a: 0.003, d: 0.06, s: 0.98, r: 0.05 }
  }


} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Type Helpers
// ═══════════════════════════════════════════════════════════════════════════

export type PresetName = keyof typeof V2_PRESETS;
export type PresetConfig = typeof V2_PRESETS[PresetName];

// ═══════════════════════════════════════════════════════════════════════════
// V1 -> V2 Mapping
// ═══════════════════════════════════════════════════════════════════════════

export const V1_TO_V2_PRESET_MAP: Record<string, PresetName> = {
  synth: 'synth',
  organ: 'organ',
  mellotron: 'mellotron',
  theremin: 'theremin',
  electricGuitar: 'guitar_shineOn',
  ambientPad: 'synth_ambient_pad_lush',
  acousticGuitar: 'mellotron_flute_intimate',
  // Новые маппинги
  strings: 'mellotron',
  choir: 'mellotron_choir',
  flute: 'mellotron_flute_intimate',
  rhodes: 'ep_rhodes_warm',
  piano: 'ep_rhodes_warm',
  lead: 'synth_lead_shineOn',
  pad: 'synth_ambient_pad_lush'
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper для получения пресета с fallback
// ═══════════════════════════════════════════════════════════════════════════

export function getPreset(name: string): PresetConfig {
  // Попробовать напрямую
  if (name in V2_PRESETS) {
    return V2_PRESETS[name as PresetName];
  }
  
  // Попробовать через маппинг V1
  if (name in V1_TO_V2_PRESET_MAP) {
    const mapped = V1_TO_V2_PRESET_MAP[name];
    return V2_PRESETS[mapped];
  }
  
  // Fallback
  console.warn(`[Presets] Unknown preset "${name}", falling back to "synth"`);
  return V2_PRESETS.synth;
}
