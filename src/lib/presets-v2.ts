
// V2 Presets — совместимы with buildMultiInstrument()
// Проверено на соответствие фабрике от 2024-12

import { BASS_PRESETS } from './bass-presets';

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
    noise: { on: true, gain: 0.02 },
    adsr: { a: 0.6, d: 0.8, s: 0.7, r: 2.0 },
    lpf: { cutoff: 1600, q: 1.2, mode: '24dB' },
    lfo: { shape: 'sine', rate: 0.18, amount: 450, target: 'filter' },
    chorus: { on: true, rate: 0.2, depth: 0.007, mix: 0.4 },
    delay: { on: true, time: 0.5, fb: 0.2, hc: 4000, mix: 0.15 },
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

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRIC PIANO (Rhodes-style via Synth Engine)
  // ═══════════════════════════════════════════════════════════════════════════

  ep_rhodes_warm: {
    type: 'synth',
    name: 'Warm Suitcase Rhodes',
    volume: 0.68,
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.58 },
      { type: 'triangle', detune: 0, octave: 1, gain: 0.14 }, // +1 octave bell
      { type: 'sine', detune: 0, octave: 1, gain: 0.08 }
    ],
    noise: { on: false, gain: 0 },
    adsr: { a: 0.008, d: 0.28, s: 0.68, r: 0.90 },
    lpf: { cutoff: 3500, q: 0.9, mode: '24dB' },
    leslie: { on: true, mode: 'slow', slow: 0.6, fast: 6.0, mix: 0.3 }, 
    tremolo: { on: true, rate: 5.5, depth: 0.4, mix: 0.5 },           
    chorus: { on: true, rate: 0.25, depth: 0.006, mix: 0.22 },
    delay: { on: true, time: 0.26, fb: 0.12, hc: 4500, mix: 0.10 },
    reverbMix: 0.18
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGAN (Integrated Hammond architecture)
  // ═══════════════════════════════════════════════════════════════════════════

  organ: {
    type: 'organ',
    name: 'Cathedral Organ',
    volume: 0.35,
    drawbars: [8, 8, 4, 2, 0, 0, 0, 1, 0],
    keyClick: 0.005,
    adsr: { a: 0.1, d: 0.1, s: 0.9, r: 1.5 },
    lpf: 4500,
    leslie: { mode: 'slow', slow: 0.5, fast: 6.0, accel: 0.7 },
    reverbMix: 0.15,
    osc: [ { type: 'sine', detune: 0, octave: -1, gain: 0.4 } ],
    tonewheel: { complexity: 0 }
  },
  
  organ_soft_jazz: {
    type: 'organ',
    name: 'Soft Jazz Organ',
    volume: 0.27,
    drawbars: [8, 0, 8, 5, 0, 3, 0, 0, 0], 
    lpf: 7600,
    hpf: 90,
    adsr: { a: 0.02, d: 0.2, s: 0.9, r: 1.2 },
    reverbMix: 0.05, 
    keyClick: 0.003,
    leslie: { mode: 'slow', slow: 0.65, fast: 6.3, accel: 0.7 },
    osc: [ { type: 'sine', detune: 0, octave: -1, gain: 0.3 } ],
    tonewheel: { complexity: 0 }
  },

  organ_jimmy_smith: {
    type: 'organ',
    name: 'Jimmy Smith Trio',
    volume: 0.32,
    drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0], // 888000000 - classic trio lead
    lpf: 8000,
    hpf: 100,
    adsr: { a: 0.005, d: 0.1, s: 0.95, r: 1.0 },
    keyClick: 0.006,
    leslie: { mode: 'fast', slow: 0.7, fast: 6.8, accel: 0.5 },
    reverbMix: 0.1
  },

  organ_gospel: {
    type: 'organ',
    name: 'Gospel Shout',
    volume: 0.38,
    drawbars: [8, 8, 8, 8, 8, 8, 8, 8, 8], // All Drawbars Out
    lpf: 9000,
    hpf: 60,
    adsr: { a: 0.003, d: 0.05, s: 1.0, r: 0.8 },
    keyClick: 0.008,
    leslie: { mode: 'fast', slow: 0.8, fast: 7.2, accel: 0.4 },
    reverbMix: 0.22
  },

  organ_circus_of_dread: {
    type: 'organ',
    name: 'Circus of Dread',
    volume: 0.30,
    drawbars: [8, 0, 0, 8, 0, 0, 8, 0, 8], // Hollow, eerie registration
    lpf: 5500,
    hpf: 120,
    adsr: { a: 0.1, d: 0.2, s: 0.8, r: 2.5 },
    keyClick: 0.002,
    leslie: { mode: 'slow', slow: 0.4, fast: 5.5, accel: 1.2 },
    reverbMix: 0.45 // Very wet for atmosphere
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GUITAR (Full Pipeline Compatible)
  // ═══════════════════════════════════════════════════════════════════════════

  guitar_shineOn: {
    type: 'guitar',
    name: 'Shine On Guitar',
    volume: 0.7,
    osc: { width: 0.46, detune: 5, mainGain: 0.85, detGain: 0.18, subGain: 0.25 },
    pickup: { cutoff: 3600, q: 1.0, combFeedback: 0.35 },
    drive: { type: 'soft', amount: 0.2 },
    comp: { threshold: -18, ratio: 3, attack: 0.01, release: 0.12, makeup: 3 },
    post: { 
      lpf: 5200, 
      mids: [
        { f: 850, q: 0.9, g: 2 }, 
        { f: 2500, q: 1.4, g: -1.5 }
      ] 
    },
    phaser: { on: true, rate: 0.16, depth: 600, mix: 0.18 },
    delayA: { on: true, time: 0.38, fb: 0.25, mix: 0.15 },
    delayB: { on: false },
    adsr: { a: 0.006, d: 0.4, s: 0.75, r: 2.5 }, // Increased sustain/release
    reverbMix: 0.22
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Muff Lead Guitar',
    volume: 0.62,
    osc: { width: 0.5, detune: 7, mainGain: 0.8, detGain: 0.2, subGain: 0.3 },
    pickup: { cutoff: 3200, q: 1.2, combFeedback: 0.4 },
    drive: { type: 'muff', amount: 0.65 },
    comp: { threshold: -20, ratio: 4, attack: 0.005, release: 0.1, makeup: 4 },
    post: { 
      lpf: 4700, 
      mids: [
        { f: 850, q: 0.9, g: 2 }, 
        { f: 3200, q: 1.4, g: -2 }
      ] 
    },
    phaser: { on: true, rate: 0.18, depth: 700, mix: 0.15 },
    delayA: { on: true, time: 0.38, fb: 0.22, mix: 0.12 },
    delayB: { on: true, time: 0.52, fb: 0.18, mix: 0.08 },
    adsr: { a: 0.008, d: 0.5, s: 0.8, r: 3.0 }, // Increased sustain/release
    reverbMix: 0.25
  }

} as const;

export type PresetName = keyof typeof V2_PRESETS;
export type PresetConfig = typeof V2_PRESETS[PresetName];

export const V1_TO_V2_PRESET_MAP: Record<string, PresetName> = {
  synth: 'synth',
  organ: 'organ',
  ambientPad: 'synth_ambient_pad_lush',
  piano: 'ep_rhodes_warm',
  rhodes: 'ep_rhodes_warm'
};

export const BASS_PRESET_MAP: Record<string, keyof typeof BASS_PRESETS> = {
    bass: 'bass_jazz_warm',
    bass_jazz_warm: 'bass_jazz_warm'
};

export function getPreset(name: string): PresetConfig {
  if (name in V2_PRESETS) {
    return V2_PRESETS[name as PresetName];
  }
  return V2_PRESETS.synth;
}
