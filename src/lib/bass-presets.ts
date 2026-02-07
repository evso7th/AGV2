
import type { BassPreset } from './instrument-factory';


export const BASS_PRESET_INFO: Record<string, { description: string; color: string; } | null> = {
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
  bass_cs80: { description: 'Legendary CS80 pitched down for deep synth bass.', color: '#00ced1' },
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
    bass_cs80: {
        type: 'bass' as const,
        name: 'CS80 Hybrid Bass',
        volume: 0.8,
        osc: [], 
        adsr: { a: 0.01, d: 0.3, s: 0.6, r: 1.5 } 
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
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.6 }, { type: 'triangle' as const, octave: 0, detune: 3, gain: 0.4 }, { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.15 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.45 } ],
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
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.7 }, { type: 'triangle' as const, octave: 0, detune: -3, gain: 0.25 }, { type: 'sine' as const, octave: 1, detune: 5, gain: 0.08 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.8 } ],
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
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.65 }, { type: 'triangle' as const, octave: -1, detune: 0, gain: 0.35 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.9 } ],
        adsr: { attack: 0.5, decay: 1.2, sustain: 0.9, release: 2.0 },
        filter: { type: 'lowpass' as const, cutoff: 400, q: 0.4 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0, chorus: { rate: 0.08, depth: 0.006, mix: 0.3 }, delay: { time: 0.8, feedback: 0.5, mix: 0.25 } }
    },
    bass_trance: {
        type: 'bass' as const,
        name: 'Trance Bass',
        volume: 0.75,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.7 }, { type: 'sawtooth' as const, octave: 0, detune: 5, gain: 0.3 }, { type: 'square' as const, octave: -1, detune: 0, gain: 0.25 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.6 } ],
        adsr: { attack: 0.003, decay: 0.15, sustain: 0.5, release: 0.15 },
        filter: { type: 'lowpass' as const, cutoff: 800, q: 3 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.3, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
    },
    bass_trance_acid: {
        type: 'bass' as const,
        name: 'Acid Bass',
        volume: 0.72,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.9 }, { type: 'square' as const, octave: -1, detune: 0, gain: 0.4 } ],
        adsr: { attack: 0.001, decay: 0.1, sustain: 0.3, release: 0.08 },
        filter: { type: 'lowpass' as const, cutoff: 400, q: 8 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.4, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
    },
    bass_reggae: {
        type: 'bass' as const,
        name: 'Reggae Bass',
        volume: 0.75,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.8 }, { type: 'triangle' as const, octave: 0, detune: 0, gain: 0.2 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.7 } ],
        adsr: { attack: 0.008, decay: 0.25, sustain: 0.4, release: 0.15 },
        filter: { type: 'lowpass' as const, cutoff: 900, q: 0.7 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0.375, feedback: 0.35, mix: 0.18 } }
    },
    bass_dub: {
        type: 'bass' as const,
        name: 'Dub Bass',
        volume: 0.7,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.75 }, { type: 'triangle' as const, octave: 0, detune: -2, gain: 0.25 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.85 } ],
        adsr: { attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.25 },
        filter: { type: 'lowpass' as const, cutoff: 700, q: 1.2 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.12, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0.5, feedback: 0.45, mix: 0.25 } }
    },
    bass_house: {
        type: 'bass' as const,
        name: 'House Bass',
        volume: 0.78,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.85 }, { type: 'triangle' as const, octave: 0, detune: 0, gain: 0.15 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.65 } ],
        adsr: { attack: 0.002, decay: 0.18, sustain: 0.35, release: 0.12 },
        filter: { type: 'lowpass' as const, cutoff: 1200, q: 0.8 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.2, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
    },
    bass_808: {
        type: 'bass' as const,
        name: '808 Sub',
        volume: 0.8,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 1.0 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.7 } ],
        adsr: { attack: 0.001, decay: 0.4, sustain: 0.2, release: 0.5 },
        filter: { type: 'lowpass' as const, cutoff: 500, q: 0.5 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.35, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
    },
    bass_deep_house: {
        type: 'bass' as const,
        name: 'Deep House',
        volume: 0.72,
        osc: [ { type: 'sine' as const, octave: 0, detune: 0, gain: 0.7 }, { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.25 }, { type: 'sine' as const, octave: 1, detune: 0, gain: 0.1 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.6 } ],
        adsr: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 0.18 },
        filter: { type: 'lowpass' as const, cutoff: 1000, q: 1.5 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.18, chorus: { rate: 0.15, depth: 0.003, mix: 0.12 }, delay: { time: 0, feedback: 0, mix: 0 } }
    },
    bass_rock_pick: {
        type: 'bass' as const,
        name: 'Rock Pick',
        volume: 0.75,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.6 }, { type: 'square' as const, octave: 0, detune: 2, gain: 0.25 }, { type: 'sine' as const, octave: 0, detune: 0, gain: 0.3 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.4 } ],
        adsr: { attack: 0.003, decay: 0.2, sustain: 0.6, release: 0.15 },
        filter: { type: 'lowpass' as const, cutoff: 2200, q: 1.0 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.4, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
    },
    bass_slap: {
        type: 'bass' as const,
        name: 'Slap Bass',
        volume: 0.72,
        osc: [ { type: 'sawtooth' as const, octave: 0, detune: 0, gain: 0.55 }, { type: 'square' as const, octave: 0, detune: 3, gain: 0.3 }, { type: 'sine' as const, octave: 1, detune: 0, gain: 0.2 }, { type: 'sine' as const, octave: -1, detune: 0, gain: 0.45 } ],
        adsr: { attack: 0.001, decay: 0.15, sustain: 0.4, release: 0.12 },
        filter: { type: 'lowpass' as const, cutoff: 2500, q: 2 },
        lfo: { shape: 'sine', rate: 0, amount: 0, target: 'pitch' },
        effects: { distortion: 0.25, chorus: { rate: 0, depth: 0, mix: 0 }, delay: { time: 0, feedback: 0, mix: 0 } }
    }
};
