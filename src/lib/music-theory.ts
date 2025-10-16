
// src/lib/music-theory.ts
import type { Mood, Genre, FractalEvent, BassSynthParams, InstrumentType } from '@/types/fractal';

type DrumPatternEvent = {
    type: InstrumentType | InstrumentType[];
    time: number;
    duration: number;
    weight: number;
    probabilities?: number[];
    probability?: number; // Chance for the event to occur at all
};

/**
 * Возвращает ноты лада в MIDI для заданного настроения.
 * Все ноты начинаются с E2 (MIDI 40).
 */
export function getScaleForMood(mood: Mood): number[] {
  const E2 = 40; // E2
  if (mood === 'melancholic') {
    // E Dorian: E F# G A B C# D
    return [E2, E2+2, E2+3, E2+5, E2+7, E2+9, E2+10];
  }
   if (mood === 'epic') {
    // E Lydian: E F# G# A# B C# D#
    return [E2, E2+2, E2+4, E2+6, E2+7, E2+9, E2+11];
  }
  if (mood === 'dreamy') {
    // E Pentatonic: E G A B D
    return [E2, E2+3, E2+5, E2+7, E2+10];
  }
  // По умолчанию — E Minor
  return [E2, E2+2, E2+3, E2+5, E2+7, E2+8, E2+10]; // E Aeolian
}


const defaultHitParams: BassSynthParams = { cutoff: 500, resonance: 0.2, distortion: 0.0, portamento: 0.0 };

export const STYLE_DRUM_PATTERNS: Record<Genre, DrumPatternEvent[]> = {
    ambient: [
        { type: 'drum_kick', time: 0, duration: 4, weight: 0.6, probability: 0.8 },
        { type: ['drum_hihat_closed', 'drum_hihat_open'], probabilities: [0.8, 0.2], time: 1.5, duration: 0.5, weight: 0.3 },
        { type: 'drum_kick', time: 2, duration: 2, weight: 0.4, probability: 0.5 },
        { type: ['drum_hihat_closed', 'drum_hihat_open'], probabilities: [0.8, 0.2], time: 3.5, duration: 0.5, weight: 0.3 },
        { type: 'drum_tom_low', time: 3.75, duration: 0.25, weight: 0.2, probability: 0.1 },
    ],
    rock: [
        { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
        { type: ['drum_snare', 'drum_snare_ghost_note'], probabilities: [0.9, 0.1], time: 1, duration: 0.25, weight: 1.0 },
        { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 },
        { type: 'drum_snare', time: 3, duration: 0.25, weight: 1.0 },
        { type: 'drum_crash', time: 0, duration: 1, weight: 0.7, probability: 0.15 },
        { type: 'drum_hihat_closed', time: 0.5, duration: 0.5, weight: 0.6 },
        { type: 'drum_hihat_closed', time: 1.5, duration: 0.5, weight: 0.6 },
        { type: 'drum_hihat_closed', time: 2.5, duration: 0.5, weight: 0.6 },
        { type: 'drum_hihat_closed', time: 3.5, duration: 0.5, weight: 0.6 },
    ],
    house: [
        { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
        { type: 'drum_kick', time: 1, duration: 0.25, weight: 1.0 },
        { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 },
        { type: 'drum_kick', time: 3, duration: 0.25, weight: 1.0 },
        { type: ['drum_hihat_closed', 'drum_hihat_open'], probabilities: [0.6, 0.4], time: 0.5, duration: 0.5, weight: 0.8 },
        { type: 'drum_snare', time: 1, duration: 0.25, weight: 0.9 },
        { type: ['drum_hihat_closed', 'drum_hihat_open'], probabilities: [0.6, 0.4], time: 1.5, duration: 0.5, weight: 0.8 },
        { type: 'drum_snare', time: 2, duration: 0.25, weight: 0.9 },
        { type: ['drum_hihat_closed', 'drum_hihat_open'], probabilities: [0.6, 0.4], time: 2.5, duration: 0.5, weight: 0.8 },
        { type: 'drum_snare', time: 3, duration: 0.25, weight: 0.9 },
        { type: ['drum_hihat_closed', 'drum_hihat_open'], probabilities: [0.6, 0.4], time: 3.5, duration: 0.5, weight: 0.8 },
    ],
    trance: [
        { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
        { type: 'drum_hihat_open', time: 0.5, duration: 0.25, weight: 0.7 },
        { type: 'drum_kick', time: 1, duration: 0.25, weight: 0.8 },
        { type: 'drum_hihat_open', time: 1.5, duration: 0.25, weight: 0.7 },
        { type: 'drum_kick', time: 2, duration: 0.25, weight: 1.0 },
        { type: 'drum_hihat_open', time: 2.5, duration: 0.25, weight: 0.7 },
        { type: 'drum_snare', time: 3, duration: 0.25, weight: 0.9 },
        { type: 'drum_hihat_open', time: 3.5, duration: 0.25, weight: 0.7 },
    ],
    rnb: [
        { type: 'drum_kick', time: 0, duration: 0.25, weight: 1.0 },
        { type: 'drum_snare', time: 1, duration: 0.25, weight: 0.9 },
        { type: 'drum_kick', time: 1.75, duration: 0.25, weight: 0.8 },
        { type: ['drum_snare', 'drum_snare_ghost_note'], probabilities: [0.8, 0.2], time: 3, duration: 0.25, weight: 1.0 },
        { type: 'drum_hihat_closed', time: 3.5, duration: 0.25, weight: 0.7 },
        { type: 'drum_hihat_closed', time: 0.5, duration: 0.25, weight: 0.5, probability: 0.6 },
        { type: 'drum_hihat_closed', time: 2.5, duration: 0.25, weight: 0.5, probability: 0.6 },
    ],
    ballad: [
        { type: 'drum_kick', time: 0, duration: 1, weight: 0.8 },
        { type: 'drum_snare', time: 2, duration: 1, weight: 0.7 },
        { type: ['drum_ride', 'drum_hihat_closed'], probabilities: [0.9, 0.1], time: 0, duration: 0.5, weight: 0.5},
        { type: ['drum_ride', 'drum_hihat_closed'], probabilities: [0.9, 0.1], time: 1, duration: 0.5, weight: 0.5},
        { type: ['drum_ride', 'drum_hihat_closed'], probabilities: [0.9, 0.1], time: 2, duration: 0.5, weight: 0.5},
        { type: ['drum_ride', 'drum_hihat_closed'], probabilities: [0.9, 0.1], time: 3, duration: 0.5, weight: 0.5},
    ],
    reggae: [
        { type: 'drum_kick', time: 2.5, duration: 0.25, weight: 1.0 },
        { type: 'drum_snare', time: 1, duration: 0.25, weight: 0.9, technique: 'hit' },
        { type: 'drum_hihat_closed', time: 0.5, duration: 0.25, weight: 0.8 },
        { type: 'drum_hihat_closed', time: 1.5, duration: 0.25, weight: 0.8 },
        { type: 'drum_hihat_closed', time: 2.5, duration: 0.25, weight: 0.8 },
        { type: 'drum_hihat_closed', time: 3.5, duration: 0.25, weight: 0.8 },
    ],
    blues: [
        { type: 'drum_kick', time: 0, duration: 0.5, weight: 0.9 },
        { type: 'drum_snare', time: 1, duration: 0.5, weight: 1.0 },
        { type: 'drum_kick', time: 2, duration: 0.5, weight: 0.9 },
        { type: 'drum_snare', time: 3, duration: 0.5, weight: 1.0 },
        { type: 'drum_ride', time: 1.5, duration: 0.5, weight: 0.4, probability: 0.5},
    ],
    celtic: [
        { type: 'drum_tom_low', time: 0, duration: 0.5, weight: 1.0 },
        { type: 'drum_tom_high', time: 1, duration: 0.5, weight: 0.8 },
        { type: 'drum_tom_low', time: 2, duration: 0.5, weight: 1.0 },
        { type: 'drum_tom_high', time: 3, duration: 0.5, weight: 0.8 },
        { type: 'drum_kick', time: 0, duration: 0.25, weight: 0.7, probability: 0.5},
        { type: 'drum_kick', time: 2, duration: 0.25, weight: 0.7, probability: 0.5},
    ],
    progressive: [
        { type: 'drum_kick', note: 36, duration: 0.25, time: 0, weight: 1.0 },
        { type: 'drum_snare', note: 38, duration: 0.25, time: 1.0, weight: 1.0 },
        { type: 'drum_kick', note: 36, duration: 0.25, time: 2.0, weight: 1.0 },
        { type: 'drum_snare', note: 38, duration: 0.25, time: 3.0, weight: 1.0 },
    ],
    dark: [],
    dreamy: [],
    epic: [],
};
