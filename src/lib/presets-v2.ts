
// V2 Presets — Compatible with buildMultiInstrument()
// #ОБНОВЛЕНО (ПЛАН №18): Naked Sound Test. Все эффекты отключены для проверки новой архитектуры.

import { BASS_PRESETS } from './bass-presets';

export const V2_PRESETS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTH (Pads, Leads, Keys)
  // ═══════════════════════════════════════════════════════════════════════════

  synth: { 
    type: 'synth',
    volume: 0.65,
    osc: [
      { type: 'sawtooth', detune: -5, octave: 0, gain: 0.4 },
      { type: 'sawtooth', detune: +5, octave: 0, gain: 0.4 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.8 }
    ],
    noise: { on: true, gain: 0.015 },
    adsr: { a: 0.8, d: 1.2, s: 0.7, r: 2.5 },
    lpf: { cutoff: 1200, q: 1.0 },
    reverbMix: 0
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    name: 'Velvet Lush Pad',
    volume: 0.6,
    osc: [
      { type: 'sine', detune: -4, octave: 0, gain: 0.6 },
      { type: 'sawtooth', detune: +4, octave: 0, gain: 0.3 },
      { type: 'sine', detune: 0, octave: -1, gain: 0.9 }
    ],
    adsr: { a: 2.0, d: 2.5, s: 0.85, r: 3.0 },
    lpf: { cutoff: 800, q: 0.8 },
    reverbMix: 0
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGAN
  // ═══════════════════════════════════════════════════════════════════════════

  organ: {
    type: 'organ',
    name: 'Clean Organ',
    volume: 0.4, 
    drawbars: [8, 8, 4, 0, 0, 0, 0, 0, 0], 
    adsr: { a: 0.05, d: 0.1, s: 0.9, r: 0.5 },
    lpf: 2500, 
    reverbMix: 0
  },
  
  organ_soft_jazz: {
    type: 'organ',
    name: 'Clean Jazz Organ',
    volume: 0.4, 
    drawbars: [8, 0, 8, 2, 0, 0, 0, 0, 0], 
    lpf: 1800, 
    adsr: { a: 0.03, d: 0.1, s: 0.85, r: 0.4 },
    reverbMix: 0
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GUITAR (NAKED TEST MODE - PLAN №18)
  // ═══════════════════════════════════════════════════════════════════════════

  guitar_clean: {
    type: 'guitar',
    name: 'Clean Guitar',
    volume: 0.7,
    osc: { width: 0.42 },
    adsr: { a: 0.005, d: 0.25, s: 0.7, r: 0.8 },
    reverbMix: 0
  },

  guitar_shineOn: {
    type: 'guitar',
    name: 'Shine On Lead (Naked)',
    volume: 0.19, 
    osc: { width: 0.46 }, 
    drive: { amount: 0 }, // ВЫКЛЮЧЕНО ДЛЯ ТЕСТА
    post: { lpf: 3600 },
    adsr: { a: 0.006, d: 0.35, s: 0.72, r: 0.7 }, 
    reverbMix: 0
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Muff Lead (Naked)',
    volume: 0.25,
    osc: { width: 0.45 },
    drive: { amount: 0 }, // ВЫКЛЮЧЕНО ДЛЯ ТЕСТА
    post: { lpf: 3800 },
    adsr: { a: 0.008, d: 0.5, s: 0.65, r: 0.8 },
    reverbMix: 0
  },

  ep_rhodes: {
    type: 'synth',
    name: 'Warm Rhodes',
    volume: 0.68,
    osc: [
      { type: 'sine', octave: 0, detune: 0, gain: 0.6 },
      { type: 'triangle', octave: 1, detune: 0, gain: 0.15 }
    ],
    adsr: { a: 0.01, d: 0.3, s: 0.65, r: 0.8 },
    lpf: { cutoff: 2800, q: 0.8 },
    reverbMix: 0
  }
} as const;

export type PresetName = keyof typeof V2_PRESETS;
export type PresetConfig = typeof V2_PRESETS[PresetName];

export const V1_TO_V2_PRESET_MAP: Record<string, PresetName> = {
    synth: 'synth',
    organ: 'organ',
    electricGuitar: 'guitar_shineOn',
    ambientPad: 'synth_ambient_pad_lush',
    acousticGuitar: 'guitar_clean',
    lead: 'synth',
    pad: 'synth_ambient_pad_lush',
    bass: 'bass_jazz'
};

export const BASS_PRESET_MAP: Record<string, string> = {
    classicBass: 'bass_jazz_warm',
    glideBass: 'bass_ambient',
    ambientDrone: 'bass_ambient_dark',
    resonantGliss: 'bass_trance_acid',
    hypnoticDrone: 'bass_ambient',
    livingRiff: 'bass_house'
};

export function getPreset(name: string): PresetConfig {
    if (name in V2_PRESETS) return V2_PRESETS[name as PresetName];
    if (name in V1_TO_V2_PRESET_MAP) return V2_PRESETS[V1_TO_V2_PRESET_MAP[name]];
    return V2_PRESETS.synth;
}
