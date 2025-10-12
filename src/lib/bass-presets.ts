
/**
 * @fileoverview This file acts as a cookbook for bass synthesizer techniques.
 * It defines the sound characteristics for different playing styles,
 * which are then used by the BassSynthManager to configure the audio worklet.
 */

import type { BassInstrument } from '@/types/music';

/**
 * Defines the parameters for a specific bass synthesis technique.
 * These values are sent to the bass-processor worklet.
 */
export type BassTechniqueParams = {
  cutoff: number;
  resonance: number;
  distortion: number;
  portamento: number;
};

/**
 * A read-only collection of pre-defined sound recipes for each bass technique.
 * This object serves as the single source of truth for how each technique should sound.
 * Inspired by basstech.txt.
 */
export const TECHNIQUE_PRESETS: Record<'pluck' | 'ghost' | 'slap', BassTechniqueParams> = {
  pluck: { 
    cutoff: 450, 
    resonance: 0.6, 
    distortion: 0.05, 
    portamento: 0 
  },
  ghost: { 
    cutoff: 250, 
    resonance: 0.3, 
    distortion: 0.01, 
    portamento: 0 
  },
  slap:  { 
    cutoff: 800, 
    resonance: 0.8, 
    distortion: 0.2, 
    portamento: 0 
  }
} as const;


/**
 * Legacy preset definitions for UI mapping and description purposes.
 * This can be used to populate UI elements and provide user-facing text.
 */
export type BassPresetInfo = {
  description: string;
  color: string;
};

export const BASS_PRESET_INFO: Record<BassInstrument, BassPresetInfo | null> = {
  classicBass: {
    description: 'Чёткий, ритмичный, как настоящая бас-гитара',
    color: '#8B4513',
  },
  glideBass: {
    description: 'Плавный, как скольжение по струне',
    color: '#4169E1',
  },
  ambientDrone: {
    description: 'Тёмный, плотный, как вибрация под землёй',
    color: '#1A0033',
  },
  resonantGliss: {
    description: 'Резонирующий, с "пением", идеален для глиссандо',
    color: '#8B008B',
  },
  hypnoticDrone: {
    description: 'Вибрация земли со стерео-движением',
    color: '#483D8B',
  },
  livingRiff: {
    description: 'Живой, дышащий рифф с характером',
    color: '#FF4500',
  },
  // Instruments that are not bass presets
  piano: null,
  violin: null,
  flute: null,
  acousticGuitarSolo: null,
  none: null
};

