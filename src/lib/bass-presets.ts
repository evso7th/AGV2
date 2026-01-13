

/**
 * @fileoverview This file acts as a cookbook for bass synthesizer techniques.
 * It defines the sound characteristics for different playing styles,
 * which are then used by the BassSynthManager to configure the audio worklet.
 */

import type { BassInstrument } from '@/types/music';
import type { BassPreset } from './instrument-factory';


/**
 * Legacy preset definitions for UI mapping and description purposes.
 * This can be used to populate UI elements and provide user-facing text.
 */
export type BassPresetInfo = {
  description: string;
  color: string;
};

// This info is now mainly for UI purposes. The actual synth parameters are in presets-v2.ts
export const BASS_PRESET_INFO: Record<string, BassPresetInfo | null> = {
  // --- New V2 Presets ---
  bass_jazz_warm: { description: 'Warm, round, finger-style jazz bass.', color: '#A0522D' },
  bass_jazz_fretless: { description: 'Expressive "mwah" sound of a fretless bass.', color: '#4682B4' },
  bass_blues: { description: 'Classic blues bass with a slight grit.', color: '#000080' },
  bass_ambient: { description: 'Deep, slow, atmospheric sub-bass.', color: '#2F4F4F' },
  bass_ambient_dark: { description: 'Very low, rumbling drone for dark soundscapes.', color: '#191970' },
  bass_trance: { description: 'Punchy, rolling bassline for trance music.', color: '#00BFFF' },
  bass_trance_acid: { description: 'Resonant, squelchy acid bass.', color: '#FFD700' },
  bass_reggae: { description: 'Deep, round, and dubby reggae bass.', color: '#228B22' },
  bass_dub: { description: 'Heavier dub bass with prominent delay.', color: '#556B2F' },
  bass_house: { description: 'Tight, modern, 808-style bass for house music.', color: '#FF69B4' },
  bass_808: { description: 'Classic 808 sub-bass with long decay.', color: '#DC143C' },
  bass_deep_house: { description: 'Warm and groovy bass for deep house.', color: '#9932CC' },
  bass_rock_pick: { description: 'Aggressive picked bass for rock music.', color: '#B22222' },
  bass_slap: { description: 'Bright, percussive slap bass for funk.', color: '#FF4500' },
  
  // --- Legacy V1 Presets (for mapping) ---
  classicBass: { description: 'Classic rock bass sound.', color: '#8B4513' },
  glideBass: { description: 'Smooth, gliding synth bass.', color: '#4169E1' },
  ambientDrone: { description: 'Deep, evolving drone.', color: '#1A0033' },
  resonantGliss: { description: 'Singing, resonant lead bass.', color: '#8B008B' },
  hypnoticDrone: { description: 'Pulsating, wide drone.', color: '#483D8B' },
  livingRiff: { description: 'Dynamic, expressive riffing bass.', color: '#FF4500' },
};


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
