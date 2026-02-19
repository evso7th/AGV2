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
    comp: { threshold: -20, ratio: 3, attack: 0.005, release: 0.2, makeup: 5 },
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
      { type: 'triangle', detune: 0, octave: 1, gain: 0.14 }, // +1200 cents = +1 octave
      { type: 'sine', detune: 0, octave: 1, gain: 0.08 }
    ],
    noise: { on: false, gain: 0 },
    adsr: { a: 0.008, d: 0.28, s: 0.68, r: 0.90 },
    lpf: { cutoff: 3500, q: 0.9, mode: '24dB' },
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
    // #ЗАЧЕМ: Системное снижение громкости (ПЛАН №491).
    volume: 0.17, 
    drawbars: [8, 8, 4, 2, 0, 0, 0, 1, 0],
    keyClick: 0.005,
    adsr: { a: 0.1, d: 0.1, s: 0.9, r: 1.5 },
    lpf: 4500,
    leslie: { mode: 'slow', slow: 0.5, fast: 6.0, accel: 0.7 },
    reverbMix: 0.15
  },
  
  organ_soft_jazz: {
    type: 'organ',
    name: 'Soft Jazz Organ',
    // #ЗАЧЕМ: Системное снижение громкости (ПЛАН №491).
    volume: 0.1, 
    drawbars: [8, 0, 8, 5, 0, 3, 0, 0, 0], 
    lpf: 7600,
    hpf: 90,
    adsr: { a: 0.02, d: 0.2, s: 0.9, r: 1.2 },
    reverbMix: 0.05, 
    keyClick: 0.003,
    leslie: { mode: 'slow', slow: 0.65, fast: 6.3, accel: 0.7 }
  },

  organ_jimmy_smith: {
    type: 'organ',
    name: 'Jimmy Smith Trio',
    // #ЗАЧЕМ: Системное снижение громкости (ПЛАН №491).
    volume: 0.16, 
    drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0], 
    lpf: 8000,
    hpf: 100,
    adsr: { a: 0.005, d: 0.1, s: 0.95, r: 1.0 },
    keyClick: 0.006,
    leslie: { mode: 'fast', slow: 0.7, fast: 6.8, accel: 0.5 },
    reverbMix: 0.1
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GUITAR (Full Pipeline Compatible)
  // ═══════════════════════════════════════════════════════════════════════════

  guitar_shineOn: {
    type: 'guitar',
    name: 'Velvet Lead', 
    volume: 0.11,
    osc: { width: 0.32, detune: 2, mainGain: 0.9, detGain: 0.1, subGain: 0.3 },
    pickup: { cutoff: 2200, q: 0.8 },
    drive: { type: 'soft', amount: 0.15 }, 
    comp: { threshold: -22, ratio: 4, attack: 0.01, release: 0.2, makeup: 4 },
    post: { lpf: 3800 },
    phaser: { on: false }, 
    delayA: { on: true, time: 0.42, fb: 0.25, mix: 0.12 },
    adsr: { a: 0.015, d: 0.4, s: 0.7, r: 2.4 }, 
    reverbMix: 0.2
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Muff Lead Guitar',
    volume: 0.15, 
    osc: { width: 0.5, detune: 7, mainGain: 0.8, detGain: 0.2, subGain: 0.3 },
    pickup: { cutoff: 3200, q: 1.2 },
    drive: { type: 'muff', amount: 0.25 }, 
    comp: { threshold: -20, ratio: 4, attack: 0.005, release: 0.1, makeup: 4 },
    post: { lpf: 4700 },
    phaser: { on: true, rate: 0.18, depth: 700, mix: 0.18 },
    delayA: { on: true, time: 0.38, fb: 0.26, hc: 3600, mix: 0.16 },
    delayB: { on: true, time: 0.52, fb: 0.22, hc: 3600, mix: 0.12 },
    adsr: { a: 0.008, d: 0.5, s: 0.8, r: 1.8 }, 
    reverbMix: 0.25
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGENDARY SAMPLERS (Routing identity)
  // ═══════════════════════════════════════════════════════════════════════════

  cs80: {
    type: 'guitar', // Sampler mode in manager
    name: 'Vangelis CS80',
    volume: 0.38, // #ЗАЧЕМ: Уменьшено в 2 раза (было 0.75) по требованию пользователя.
    adsr: { a: 0.01, d: 0.3, s: 0.6, r: 1.5 }
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

/**
 * #ЗАЧЕМ: Сопоставление V1-имен баса с новыми V2-пресетами.
 * #ОБНОВЛЕНО (ПЛАН №434): bass_trance удален и замещен на bass_house.
 */
export const BASS_PRESET_MAP: Record<string, keyof typeof BASS_PRESETS> = {
    bass: 'bass_jazz_warm',
    classicBass: 'bass_rock_pick',
    glideBass: 'bass_ambient', // SUBSTITUTE for pure sound
    ambientDrone: 'bass_ambient_dark',
    resonantGliss: 'bass_trance_acid',
    hypnoticDrone: 'bass_ambient',
    linkRiff: 'bass_slap',
    // V2 identity mapping
    bass_jazz_warm: 'bass_jazz_warm',
    bass_jazz_fretless: 'bass_jazz_fretless',
    bass_blues: 'bass_blues',
    bass_ambient: 'bass_ambient',
    bass_ambient_dark: 'bass_ambient_dark',
    bass_trance: 'bass_house', // SUBSTITUTE
    bass_trance_acid: 'bass_trance_acid',
    bass_reggae: 'bass_reggae',
    bass_dub: 'bass_dub',
    bass_house: 'bass_house',
    bass_808: 'bass_808',
    bass_deep_house: 'bass_deep_house',
    bottom_heavy: 'bass_ambient_dark',
    rockBass: 'bass_rock_pick',
    slapBass: 'bass_slap',
    cs80: 'bass_cs80' 
};

export function getPreset(name: string): PresetConfig {
  if (name in V2_PRESETS) {
    return V2_PRESETS[name as PresetName];
  }
  return V2_PRESETS.synth;
}