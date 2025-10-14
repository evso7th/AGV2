// src/lib/music-theory.ts
import type { Mood } from '@/types/fractal';

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
