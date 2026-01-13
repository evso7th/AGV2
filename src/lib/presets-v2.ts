


// V2 Presets — совместимы с buildMultiInstrument()
// Проверено на соответствие фабрике от 2024-01

import type { BassPreset } from './instrument-factory';

export const BASS_PRESETS: Record<string, BassPreset> = {
    bass_jazz_warm: {
        type: 'bass' as const,
        name: 'Jazz Upright',
        volume: 0.72,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.7 }, { type: 'triangle' as const, octave: 0, detune: 2, gain: 0.35 }, { type: 'sine' as const, octave: 1, detune: 0, gain: 0.12 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.5 },
        adsr: { a: 0.015, d: 0.4, s: 0.7, r: 0.35 },
        filter: { type: 'lowpass' as const, cutoff: 1200, q: 0.6, keyTrack: 0.25 },
        filterEnv: { on: true, attack: 0.01, decay: 0.25, sustain: 0.2, release: 0.2, depth: 600, velocity: 0.5 },
        drive: { on: false, type: 'tube' as const, amount: 0, tone: 2000 },
        comp: { threshold: -18, ratio: 3, attack: 0.01, release: 0.15, makeup: 4 },
        eq: { lowShelf: { freq: 80, gain: 3 }, mid: { freq: 800, q: 1.2, gain: -2 }, highShelf: { freq: 2500, gain: -4 } },
        stringNoise: { on: true, type: 'finger' as const, amount: 0.15 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.12
    },
    bass_jazz_fretless: {
        type: 'bass' as const,
        name: 'Fretless Jaco',
        volume: 0.7,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.55 }, { type: 'sine' as const, octave: 0, detune: 0, gain: 0.4 }, { type: 'sine' as const, octave: 1, detune: 0, gain: 0.15 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.4 },
        adsr: { a: 0.025, d: 0.5, s: 0.75, r: 0.4 },
        filter: { type: 'lowpass' as const, cutoff: 1800, q: 1.2, keyTrack: 0.4 },
        filterEnv: { on: true, attack: 0.02, decay: 0.35, sustain: 0.3, release: 0.25, depth: 800, velocity: 0.6 },
        drive: { on: true, type: 'tube' as const, amount: 0.15, tone: 3500 },
        comp: { threshold: -16, ratio: 3.5, attack: 0.008, release: 0.12, makeup: 5 },
        eq: { lowShelf: { freq: 100, gain: 2 }, mid: { freq: 1200, q: 1.5, gain: 3 }, highShelf: { freq: 3000, gain: -2 } },
        stringNoise: { on: true, type: 'finger' as const, amount: 0.08 },
        chorus: { on: true, rate: 0.25, depth: 0.004, mix: 0.2 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.15
    },
    bass_blues: {
        type: 'bass' as const,
        name: 'Blues Bass',
        volume: 0.7,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.6 }, { type: 'triangle' as const, octave: 0, detune: 3, gain: 0.4 }, { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.15 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.45 },
        adsr: { a: 0.012, d: 0.35, s: 0.65, r: 0.3 },
        filter: { type: 'lowpass' as const, cutoff: 1400, q: 0.8, keyTrack: 0.3 },
        filterEnv: { on: true, attack: 0.01, decay: 0.2, sustain: 0.25, release: 0.2, depth: 500, velocity: 0.5 },
        drive: { on: true, type: 'tube' as const, amount: 0.25, tone: 2500 },
        comp: { threshold: -15, ratio: 4, attack: 0.008, release: 0.12, makeup: 5 },
        eq: { lowShelf: { freq: 90, gain: 2 }, mid: { freq: 600, q: 1.0, gain: 1 }, highShelf: { freq: 2800, gain: -3 } },
        stringNoise: { on: true, type: 'finger' as const, amount: 0.12 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.1
    },
    bass_ambient: {
        type: 'bass' as const,
        name: 'Ambient Sub',
        volume: 0.65,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.7 }, { type: 'triangle' as const, octave: 0, detune: -3, gain: 0.25 }, { type: 'sine' as const, octave: 1, detune: 5, gain: 0.08 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.8 },
        adsr: { a: 0.3, d: 0.8, s: 0.85, r: 1.5 },
        filter: { type: 'lowpass' as const, cutoff: 600, q: 0.5, keyTrack: 0.15 },
        filterEnv: { on: true, attack: 0.4, decay: 1.0, sustain: 0.4, release: 0.8, depth: 400, velocity: 0.3 },
        drive: { on: false, type: 'tube' as const, amount: 0, tone: 1500 },
        comp: { threshold: -20, ratio: 3, attack: 0.02, release: 0.3, makeup: 4 },
        eq: { lowShelf: { freq: 60, gain: 5 }, mid: { freq: 400, q: 0.8, gain: -3 }, highShelf: { freq: 1500, gain: -6 } },
        stringNoise: { on: false, type: 'finger' as const, amount: 0 },
        chorus: { on: true, rate: 0.1, depth: 0.005, mix: 0.25 },
        delay: { on: true, time: 0.6, fb: 0.4, mix: 0.2, hc: 1200 },
        reverbMix: 0.35
    },
    bass_ambient_dark: {
        type: 'bass' as const,
        name: 'Dark Ambient',
        volume: 0.6,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.65 }, { type: 'triangle' as const, octave: -1, detune: 0, gain: 0.35 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.9 },
        adsr: { a: 0.5, d: 1.2, s: 0.9, r: 2.0 },
        filter: { type: 'lowpass' as const, cutoff: 400, q: 0.4, keyTrack: 0.1 },
        filterEnv: { on: true, attack: 0.6, decay: 1.5, sustain: 0.3, release: 1.0, depth: 300, velocity: 0.2 },
        drive: { on: false, type: 'tube' as const, amount: 0, tone: 1000 },
        comp: { threshold: -22, ratio: 2.5, attack: 0.03, release: 0.4, makeup: 3 },
        eq: { lowShelf: { freq: 50, gain: 6 }, mid: { freq: 300, q: 0.6, gain: -4 }, highShelf: { freq: 1000, gain: -8 } },
        stringNoise: { on: false, type: 'finger' as const, amount: 0 },
        chorus: { on: true, rate: 0.08, depth: 0.006, mix: 0.3 },
        delay: { on: true, time: 0.8, fb: 0.5, mix: 0.25, hc: 800 },
        reverbMix: 0.45
    },
    bass_trance: {
        type: 'bass' as const,
        name: 'Trance Bass',
        volume: 0.75,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.7 }, { type: 'sawtooth' as const, octave: 0, detune: 5, gain: 0.3 }, { type: 'square' as const, octave: -1, detune: 0, gain: 0.25 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.6 },
        adsr: { a: 0.003, d: 0.15, s: 0.5, r: 0.15 },
        filter: { type: 'lowpass' as const, cutoff: 800, q: 3, keyTrack: 0.4 },
        filterEnv: { on: true, attack: 0.001, decay: 0.12, sustain: 0.1, release: 0.1, depth: 2500, velocity: 0.7 },
        drive: { on: true, type: 'soft' as const, amount: 0.3, tone: 4000 },
        comp: { threshold: -12, ratio: 6, attack: 0.001, release: 0.08, makeup: 6 },
        eq: { lowShelf: { freq: 80, gain: 2 }, mid: { freq: 1500, q: 2, gain: 2 }, highShelf: { freq: 4000, gain: -2 } },
        stringNoise: { on: false, type: 'finger' as const, amount: 0 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.08
    },
    bass_trance_acid: {
        type: 'bass' as const,
        name: 'Acid Bass',
        volume: 0.72,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.9 } ],
        sub: { on: true, type: 'square' as const, octave: -1, gain: 0.4 },
        adsr: { a: 0.001, d: 0.1, s: 0.3, r: 0.08 },
        filter: { type: 'lowpass' as const, cutoff: 400, q: 8, keyTrack: 0.5 },
        filterEnv: { on: true, attack: 0.001, decay: 0.15, sustain: 0.05, release: 0.08, depth: 4000, velocity: 0.8 },
        drive: { on: true, type: 'tube' as const, amount: 0.4, tone: 5000 },
        comp: { threshold: -10, ratio: 8, attack: 0.001, release: 0.06, makeup: 7 },
        eq: { lowShelf: { freq: 100, gain: 1 }, mid: { freq: 2000, q: 2.5, gain: 3 }, highShelf: { freq: 5000, gain: 0 } },
        stringNoise: { on: false, type: 'finger' as const, amount: 0 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.05
    },
    bass_reggae: {
        type: 'bass' as const,
        name: 'Reggae Bass',
        volume: 0.75,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.8 }, { type: 'triangle' as const, octave: 0, detune: 0, gain: 0.2 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.7 },
        adsr: { a: 0.008, d: 0.25, s: 0.4, r: 0.15 },
        filter: { type: 'lowpass' as const, cutoff: 900, q: 0.7, keyTrack: 0.2 },
        filterEnv: { on: true, attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.1, depth: 400, velocity: 0.4 },
        drive: { on: false, type: 'tube' as const, amount: 0, tone: 2000 },
        comp: { threshold: -14, ratio: 5, attack: 0.005, release: 0.1, makeup: 5 },
        eq: { lowShelf: { freq: 70, gain: 4 }, mid: { freq: 500, q: 1.0, gain: -2 }, highShelf: { freq: 2000, gain: -5 } },
        stringNoise: { on: true, type: 'finger' as const, amount: 0.08 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: true, time: 0.375, fb: 0.35, mix: 0.18, hc: 1500 },
        reverbMix: 0.15
    },
    bass_dub: {
        type: 'bass' as const,
        name: 'Dub Bass',
        volume: 0.7,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.75 }, { type: 'triangle' as const, octave: 0, detune: -2, gain: 0.25 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.85 },
        adsr: { a: 0.01, d: 0.3, s: 0.5, r: 0.25 },
        filter: { type: 'lowpass' as const, cutoff: 700, q: 1.2, keyTrack: 0.2 },
        filterEnv: { on: true, attack: 0.01, decay: 0.2, sustain: 0.15, release: 0.15, depth: 600, velocity: 0.5 },
        drive: { on: true, type: 'tube' as const, amount: 0.12, tone: 1800 },
        comp: { threshold: -16, ratio: 4, attack: 0.008, release: 0.12, makeup: 4 },
        eq: { lowShelf: { freq: 60, gain: 5 }, mid: { freq: 400, q: 0.8, gain: -3 }, highShelf: { freq: 1800, gain: -6 } },
        stringNoise: { on: true, type: 'finger' as const, amount: 0.06 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: true, time: 0.5, fb: 0.45, mix: 0.25, hc: 1200 },
        reverbMix: 0.22
    },
    bass_house: {
        type: 'bass' as const,
        name: 'House Bass',
        volume: 0.78,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.85 }, { type: 'triangle' as const, octave: 0, detune: 0, gain: 0.15 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.65 },
        adsr: { a: 0.002, d: 0.18, s: 0.35, r: 0.12 },
        filter: { type: 'lowpass' as const, cutoff: 1200, q: 0.8, keyTrack: 0.3 },
        filterEnv: { on: true, attack: 0.001, decay: 0.1, sustain: 0.15, release: 0.08, depth: 800, velocity: 0.6 },
        drive: { on: true, type: 'soft' as const, amount: 0.2, tone: 3000 },
        comp: { threshold: -10, ratio: 6, attack: 0.001, release: 0.08, makeup: 6 },
        eq: { lowShelf: { freq: 80, gain: 3 }, mid: { freq: 800, q: 1.5, gain: 1 }, highShelf: { freq: 3000, gain: -2 } },
        stringNoise: { on: false, type: 'finger' as const, amount: 0 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.06
    },
    bass_808: {
        type: 'bass' as const,
        name: '808 Sub',
        volume: 0.8,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 1.0 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.7 },
        adsr: { a: 0.001, d: 0.4, s: 0.2, r: 0.5 },
        filter: { type: 'lowpass' as const, cutoff: 500, q: 0.5, keyTrack: 0.2 },
        filterEnv: { on: true, attack: 0.001, decay: 0.25, sustain: 0.1, release: 0.2, depth: 600, velocity: 0.5 },
        drive: { on: true, type: 'tube' as const, amount: 0.35, tone: 2000 },
        comp: { threshold: -8, ratio: 8, attack: 0.001, release: 0.1, makeup: 7 },
        eq: { lowShelf: { freq: 60, gain: 4 }, mid: { freq: 200, q: 1.0, gain: 2 }, highShelf: { freq: 1500, gain: -4 } },
        stringNoise: { on: false, type: 'finger' as const, amount: 0 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.04
    },
    bass_deep_house: {
        type: 'bass' as const,
        name: 'Deep House',
        volume: 0.72,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.7 }, { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.25 }, { type: 'sine' as const, octave: 1, detune: 0, gain: 0.1 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.6 },
        adsr: { a: 0.005, d: 0.2, s: 0.5, r: 0.18 },
        filter: { type: 'lowpass' as const, cutoff: 1000, q: 1.5, keyTrack: 0.35 },
        filterEnv: { on: true, attack: 0.003, decay: 0.15, sustain: 0.2, release: 0.12, depth: 1000, velocity: 0.6 },
        drive: { on: true, type: 'tube' as const, amount: 0.18, tone: 2800 },
        comp: { threshold: -12, ratio: 5, attack: 0.003, release: 0.1, makeup: 5 },
        eq: { lowShelf: { freq: 90, gain: 2 }, mid: { freq: 600, q: 1.2, gain: 0 }, highShelf: { freq: 2500, gain: -1 } },
        stringNoise: { on: false, type: 'finger' as const, amount: 0 },
        chorus: { on: true, rate: 0.15, depth: 0.003, mix: 0.12 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.1
    },
    bass_rock_pick: {
        type: 'bass' as const,
        name: 'Rock Pick',
        volume: 0.75,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.6 }, { type: 'square' as const, octave: 0, detune: 2, gain: 0.25 }, { type: 'sine' as const, octave: 0, detune: 0, gain: 0.3 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.4 },
        adsr: { a: 0.003, d: 0.2, s: 0.6, r: 0.15 },
        filter: { type: 'lowpass' as const, cutoff: 2200, q: 1.0, keyTrack: 0.4 },
        filterEnv: { on: true, attack: 0.002, decay: 0.12, sustain: 0.25, release: 0.1, depth: 1200, velocity: 0.6 },
        drive: { on: true, type: 'tube' as const, amount: 0.4, tone: 4000 },
        comp: { threshold: -14, ratio: 5, attack: 0.003, release: 0.1, makeup: 5 },
        eq: { lowShelf: { freq: 100, gain: 1 }, mid: { freq: 1000, q: 1.5, gain: 2 }, highShelf: { freq: 3500, gain: 1 } },
        stringNoise: { on: true, type: 'pick' as const, amount: 0.25 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.08
    },
    bass_slap: {
        type: 'bass' as const,
        name: 'Slap Bass',
        volume: 0.72,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.55 }, { type: 'square' as const, octave: 0, detune: 3, gain: 0.3 }, { type: 'sine' as const, octave: 1, detune: 0, gain: 0.2 } ],
        sub: { on: true, type: 'sine' as const, octave: -1, gain: 0.45 },
        adsr: { a: 0.001, d: 0.15, s: 0.4, r: 0.12 },
        filter: { type: 'lowpass' as const, cutoff: 2500, q: 2, keyTrack: 0.5 },
        filterEnv: { on: true, attack: 0.001, decay: 0.08, sustain: 0.15, release: 0.08, depth: 3000, velocity: 0.8 },
        drive: { on: true, type: 'tube' as const, amount: 0.25, tone: 5000 },
        comp: { threshold: -12, ratio: 6, attack: 0.001, release: 0.08, makeup: 6 },
        eq: { lowShelf: { freq: 80, gain: 2 }, mid: { freq: 800, q: 1.2, gain: -2 }, highShelf: { freq: 4000, gain: 3 } },
        stringNoise: { on: true, type: 'slap' as const, amount: 0.35 },
        chorus: { on: false, rate: 0.3, depth: 0.003, mix: 0 },
        delay: { on: false, time: 0.3, fb: 0.2, mix: 0, hc: 2000 },
        reverbMix: 0.06
    }
};


export const V2_PRESETS = {
  ...BASS_PRESETS,
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

export const BASS_PRESET_MAP: Record<string, keyof typeof BASS_PRESETS> = {
    bass: 'bass_jazz_warm',
    jazzBass: 'bass_jazz_warm',
    fretlessBass: 'bass_jazz_fretless',
    bluesBass: 'bass_blues',
    ambientBass: 'bass_ambient',
    darkBass: 'bass_ambient_dark',
    tranceBass: 'bass_trance',
    acidBass: 'bass_trance_acid',
    reggaeBass: 'bass_reggae',
    dubBass: 'bass_dub',
    houseBass: 'bass_house',
    '808': 'bass_808',
    deepHouseBass: 'bass_deep_house',
    rockBass: 'bass_rock_pick',
    slapBass: 'bass_slap'
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
