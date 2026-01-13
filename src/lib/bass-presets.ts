

/**
 * @fileoverview This file acts as a cookbook for bass synthesizer techniques.
 * It defines the sound characteristics for different playing styles,
 * which are then used by the BassSynthManager to configure the audio worklet.
 */

import type { BassInstrument } from '@/types/music';

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
