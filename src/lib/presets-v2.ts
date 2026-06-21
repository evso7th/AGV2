
// V2 Presets — Compatible with buildMultiInstrument()
// #ОБНОВЛЕНО (ПЛАН №1264): Устранение "пароходного" гудения. Радикальное снижение суб-гармоник.

import { BASS_PRESETS } from './bass-presets';

export const V2_PRESETS = {
  // ═══════════════════════════════════════════════════════════════════════════
  // SYNTH (Pads, Leads, Keys)
  // ═══════════════════════════════════════════════════════════════════════════

  synth: { 
    type: 'synth',
    volume: 0.6,
    osc: [
      { type: 'sawtooth', detune: -5, octave: 0, gain: 0.35 },
      { type: 'sawtooth', detune: +5, octave: 0, gain: 0.35 },
      // #ЗАЧЕМ: Снижение гейна суб-осциллятора для устранения гудения.
      { type: 'sine', detune: 0, octave: -1, gain: 0.3 } 
    ],
    noise: { on: true, gain: 0.008 },
    adsr: { a: 1.0, d: 1.5, s: 0.7, r: 3.0 },
    // #ЗАЧЕМ: Подъем фильтра выше "пароходной трубы".
    lpf: { cutoff: 1200, q: 0.7 }, 
    reverbMix: 0
  },

  synth_ambient_pad_lush: {
    type: 'synth',
    name: 'Velvet Lush Pad',
    volume: 0.55,
    osc: [
      { type: 'sine', detune: -4, octave: 0, gain: 0.5 },
      { type: 'sawtooth', detune: +4, octave: 0, gain: 0.25 },
      // #ЗАЧЕМ: ПЛАН №1264. Радикальное облегчение низа.
      { type: 'sine', detune: 0, octave: -1, gain: 0.35 } 
    ],
    adsr: { a: 2.5, d: 3.0, s: 0.8, r: 4.5 },
    // #ЗАЧЕМ: Прозрачный фильтр без резонансного гула.
    lpf: { cutoff: 950, q: 0.5 }, 
    reverbMix: 0
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGAN
  // ═══════════════════════════════════════════════════════════════════════════

  organ: {
    type: 'organ',
    name: 'Clean Organ',
    volume: 0.35, 
    drawbars: [8, 8, 4, 0, 0, 0, 0, 0, 0], 
    adsr: { a: 0.05, d: 0.1, s: 0.9, r: 0.5 },
    lpf: 1600, 
    reverbMix: 0
  },
  
  organ_soft_jazz: {
    type: 'organ',
    name: 'Clean Jazz Organ',
    volume: 0.38, 
    drawbars: [8, 0, 8, 2, 0, 0, 0, 0, 0], 
    lpf: 1300, 
    adsr: { a: 0.04, d: 0.1, s: 0.85, r: 0.4 },
    reverbMix: 0
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GUITAR (LEGION ARCHITECTURE ACTIVE)
  // ═══════════════════════════════════════════════════════════════════════════

  guitar_clean: {
    type: 'guitar',
    name: 'Clean Guitar',
    volume: 0.7,
    osc: { width: 0.42 },
    adsr: { a: 0.005, d: 0.25, s: 0.7, r: 0.8 },
    lpf: 3800,
    reverbMix: 0
  },

  guitar_shineOn: {
    type: 'guitar',
    name: 'Shine On Lead',
    volume: 0.12, 
    osc: { width: 0.46 }, 
    drive: { type: 'soft', amount: 0.22 }, 
    post: { lpf: 2600 }, 
    adsr: { a: 0.025, d: 0.4, s: 0.8, r: 2.5 }, 
    delay: { time: 0.42, fb: 0.35, mix: 0.25 },
    reverbMix: 0
  },

  guitar_muffLead: {
    type: 'guitar',
    name: 'Muff Lead (Warm Grit)',
    volume: 0.08, 
    osc: { width: 0.45 },
    drive: { type: 'muff', amount: 0.38 }, 
    post: { lpf: 2200 }, 
    adsr: { a: 0.025, d: 0.6, s: 0.6, r: 1.5 },
    delay: { time: 0.32, fb: 0.2, mix: 0.15 },
    reverbMix: 0
  },

  ep_rhodes: {
    type: 'synth',
    name: 'Warm Rhodes',
    volume: 0.65,
    osc: [
      { type: 'sine', octave: 0, detune: 0, gain: 0.55 },
      { type: 'triangle', octave: 1, detune: 0, gain: 0.12 }
    ],
    adsr: { a: 0.012, d: 0.35, s: 0.6, r: 0.8 },
    lpf: { cutoff: 2200, q: 0.6 }, 
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
    linkRiff: 'bass_house'
};

export function getPreset(name: string): PresetConfig {
    if (name in V2_PRESETS) return V2_PRESETS[name as PresetName];
    if (name in V1_TO_V2_PRESET_MAP) return V2_PRESETS[V1_TO_V2_PRESET_MAP[name]];
    return V2_PRESETS.synth;
}
