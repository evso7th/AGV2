
// V2 Presets — Compatible with buildMultiInstrument()
// #ОБНОВЛЕНО (ПЛАН №2010): Органная трансформация пэдов (ADSR, LFO, FX).

import { BASS_PRESETS } from './bass-presets';

export const V2_PRESETS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTH (Pads, Leads, Keys)
  // ═══════════════════════════════════════════════════════════════════════════

  synth: { // Emerald Pad -> Now "Emerald Organ-Synth"
    type: 'synth',
    volume: 0.65,
    comp: { threshold: -18, ratio: 4, attack: 0.003, release: 0.15, makeup: 6 },
    osc: [
      { type: 'sawtooth', detune: -5, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: +5, octave: 0, gain: 0.4 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.8 } 
    ],
    noise: { on: true, gain: 0.01 },
    // #ЗАЧЕМ: Органная динамика (быстрый вход, полный сустейн)
    adsr: { a: 0.02, d: 0.1, s: 1.0, r: 0.18 }, 
    lpf: { cutoff: 2200, q: 1.5, mode: '24dB' }, 
    // #ЗАЧЕМ: Эмуляция Leslie/Vibrato
    lfo: { shape: 'sine', rate: 6.2, amount: 450, target: 'filter' },
    chorus: { on: true, rate: 0.85, depth: 0.015, mix: 0.55 },
    delay: { on: true, time: 0.35, fb: 0.25, hc: 3500, mix: 0.15 },
    reverbMix: 0.2
  },

  synth_ambient_pad_lush: { // Velvet Lush Pad -> Now "Velvet Organ-Pad"
    type: 'synth',
    name: 'Velvet Lush Pad',
    volume: 0.6,
    comp: { threshold: -20, ratio: 3, attack: 0.005, release: 0.2, makeup: 5 },
    osc: [
      { type: 'sine', detune: -4, octave: 0, gain: 0.6 }, 
      { type: 'sawtooth', detune: +4, octave: 0, gain: 0.3 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.9 }
    ],
    noise: { on: true, gain: 0.02 },
    // #ЗАЧЕМ: Более собранная динамика
    adsr: { a: 0.08, d: 0.2, s: 0.9, r: 0.4 }, 
    lpf: { cutoff: 1400, q: 1.0, mode: '24dB' }, 
    lfo: { shape: 'sine', rate: 5.5, amount: 400, target: 'filter' },
    chorus: { on: true, rate: 0.65, depth: 0.01, mix: 0.45 },
    delay: { on: true, time: 0.5, fb: 0.3, hc: 2500, mix: 0.2 },
    reverbMix: 0.28
  },

  synth_cave_pad: {
    type: 'synth',
    name: 'Abyssal Depth Pad',
    volume: 0.55,
    osc: [
      { type: 'sine', detune: -12, octave: -1, gain: 0.7 },
      { type: 'sine', detune: 12, octave: 0, gain: 0.5 },
      { type: 'triangle', detune: 0, octave: -2, gain: 0.4 }
    ],
    noise: { on: true, gain: 0.04 },
    adsr: { a: 1.5, d: 2.0, s: 0.95, r: 3.0 }, 
    lpf: { cutoff: 650, q: 1.2, mode: '24dB' }, 
    chorus: { on: true, rate: 0.12, depth: 0.008, mix: 0.5 },
    delay: { on: true, time: 0.8, fb: 0.5, hc: 1500, mix: 0.35 },
    reverbMix: 0.4
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELECTRIC PIANO
  // ═══════════════════════════════════════════════════════════════════════════

  ep_rhodes_warm: {
    type: 'synth',
    name: 'Warm Velvet Rhodes',
    volume: 0.8, 
    osc: [
      { type: 'sine', detune: 0, octave: 0, gain: 0.65 },
      { type: 'triangle', detune: 0, octave: 1, gain: 0.12 }, 
      { type: 'sine', detune: 0, octave: 1, gain: 0.05 }
    ],
    noise: { on: false, gain: 0 },
    adsr: { a: 0.012, d: 0.4, s: 0.6, r: 1.5 },
    lpf: { cutoff: 1800, q: 0.8, mode: '24dB' }, 
    chorus: { on: true, rate: 0.2, depth: 0.005, mix: 0.25 },
    delay: { on: true, time: 0.3, fb: 0.15, hc: 2500, mix: 0.12 },
    reverbMix: 0.22
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GUITAR
  // ═══════════════════════════════════════════════════════════════════════════

  guitar_clean: {
    type: 'guitar',
    name: 'Clean Velvet Guitar',
    volume: 0.7,
    osc: { width: 0.42, detune: 3, mainGain: 0.85, detGain: 0.15, subGain: 0.2 },
    pickup: { cutoff: 4500 },
    drive: { type: 'soft', amount: 0.1 },
    comp: { threshold: -16, ratio: 2.5, makeup: 2 },
    post: { lpf: 6000 },
    chorus: { on: true, mix: 0.25 },
    delay: { on: true, time: 0.25, fb: 0.2, mix: 0.15 },
    adsr: { a: 0.005, d: 0.25, s: 0.7, r: 1.2 },
    reverbMix: 0.2
  },

  guitar_shineOn: {
    type: 'guitar',
    name: 'Shine On Lead',
    volume: 0.175, 
    osc: { width: 0.46, detune: 5, mainGain: 0.85, detGain: 0.18, subGain: 0.25 },
    pickup: { cutoff: 3600 },
    drive: { type: 'soft', amount: 0.25 },
    comp: { threshold: -18, ratio: 3, makeup: 3 },
    post: { lpf: 5200 },
    chorus: { on: true, mix: 0.35 },
    delay: { on: true, time: 0.4, fb: 0.35, mix: 0.28 },
    adsr: { a: 0.006, d: 0.35, s: 0.6, r: 1.8 },
    reverbMix: 0.22
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Muff Lead',
    volume: 0.175, 
    osc: { width: 0.5, detune: 7, mainGain: 0.8, detGain: 0.2, subGain: 0.3 },
    pickup: { cutoff: 3200 },
    drive: { type: 'muff', amount: 0.6 },
    comp: { threshold: -20, ratio: 4, makeup: 4 },
    post: { lpf: 4500 },
    chorus: { on: true, mix: 0.2 },
    delay: { on: true, time: 0.38, fb: 0.3, mix: 0.2 },
    adsr: { a: 0.008, d: 0.5, s: 0.65, r: 2.0 },
    reverbMix: 0.18
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGAN
  // ═══════════════════════════════════════════════════════════════════════════

  organ: {
    type: 'organ',
    name: 'Cathedral Depth',
    volume: 0.4, 
    drawbars: [8, 8, 4, 0, 0, 0, 0, 0, 0], 
    keyClick: 0.003,
    adsr: { a: 0.15, d: 0.2, s: 0.9, r: 2.0 },
    lpf: 1600, 
    leslie: { mode: 'slow', slow: 0.4, fast: 5.5, accel: 1.0 },
    reverbMix: 0.25
  },
  
  organ_soft_jazz: {
    type: 'organ',
    name: 'Velvet Jazz B3',
    volume: 0.4, 
    drawbars: [8, 0, 8, 2, 0, 0, 0, 0, 0], 
    lpf: 1400, 
    hpf: 90,
    sub: { gain: 0.55 }, 
    adsr: { a: 0.05, d: 0.3, s: 0.85, r: 1.8 },
    reverbMix: 0.18, 
    keyClick: 0.001,
    leslie: { mode: 'slow', slow: 0.55, fast: 6.0, accel: 0.8 }
  },

  organ_jimmy_smith: {
    type: 'organ',
    name: 'Warm Jimmy smith',
    volume: 0.4, 
    drawbars: [8, 8, 8, 0, 0, 0, 0, 0, 0], 
    lpf: 2200, 
    hpf: 100,
    adsr: { a: 0.008, d: 0.15, s: 0.9, r: 1.2 },
    keyClick: 0.004,
    leslie: { mode: 'fast', slow: 0.6, fast: 6.5, accel: 0.6 },
    reverbMix: 0.15
  },

  organ_prog: {
    type: 'organ',
    name: 'Mellow Prog Organ',
    volume: 0.4, 
    drawbars: [8, 8, 8, 6, 0, 0, 0, 0, 0],
    lpf: 2600, 
    adsr: { a: 0.006, d: 0.1, s: 0.95, r: 1.0 },
    keyClick: 0.005,
    leslie: { mode: 'fast', slow: 0.7, fast: 6.8, accel: 0.5 },
    reverbMix: 0.18
  },

  reggae_organ: {
    type: 'organ',
    name: 'Velvet Bubbler',
    volume: 0.4,
    drawbars: [8, 8, 0, 0, 0, 0, 0, 0, 0],
    lpf: 1400, 
    adsr: { a: 0.008, d: 0.1, s: 0.0, r: 0.15 }, 
    keyClick: 0.006,
    leslie: { mode: 'slow', slow: 0.7, fast: 6.2, accel: 0.7 },
    reverbMix: 0.12
  }
};

export type PresetName = keyof typeof V2_PRESETS;
export type PresetConfig = typeof V2_PRESETS[PresetName];

export const V1_TO_V2_PRESET_MAP: Record<string, PresetName> = {
  synth: 'synth',
  organ: 'organ',
  ambientPad: 'synth_ambient_pad_lush',
  piano: 'ep_rhodes_warm',
  rhodes: 'ep_rhodes_warm',
  acousticGuitar: 'blackAcoustic' as any 
};

export const BASS_PRESET_MAP: Record<string, keyof typeof BASS_PRESETS> = {
    bass: 'bass_reggae',
    classicBass: 'bass_rock_pick',
    glideBass: 'bass_ambient',
    ambientDrone: 'bass_ambient_dark',
    resonantGliss: 'bass_trance_acid',
    hypnoticDrone: 'bass_ambient',
    linkRiff: 'bass_slap',
    bass_jazz_warm: 'bass_jazz_warm',
    bass_jazz_fretless: 'bass_jazz_fretless',
    bass_blues: 'bass_blues',
    bass_ambient: 'bass_ambient',
    bass_ambient_dark: 'bass_ambient_dark',
    bass_trance: 'bass_house',
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
