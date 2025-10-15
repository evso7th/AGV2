
import type { FractalEvent, ResonanceMatrix, Mood } from '@/types/fractal';
import { getScaleForMood } from './music-theory';

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

/** Проверяет, что время событий совпадает с небольшой погрешностью */
function areSimultaneous(timeA: number, timeB: number): boolean {
  return Math.abs(timeA - timeB) < 0.05; // Увеличено окно для более гибкого сравнения
}

/** Получает долю такта (0, 1, 2, 3) из времени в долях */
function getBeat(timeInBeats: number): number {
  return Math.floor(timeInBeats) % 4;
}

/** Проверяет, находится ли доля в сильной части такта (1 или 3) */
function isOnStrongBeat(timeInBeats: number): boolean {
  const beat = getBeat(timeInBeats);
  return beat === 0 || beat === 2;
}

/** Проверяет, находится ли доля в слабой части такта (2 или 4) */
function isOnSnareBeat(timeInBeats: number): boolean {
  const beat = getBeat(timeInBeats);
  return beat === 1 || beat === 3;
}

// Функции-предикаты для типов событий
const isGhostNote = (event: FractalEvent): boolean => event.technique === 'ghost';
const isKick = (event: FractalEvent): boolean => event.type === 'drum_kick';
const isSnare = (event: FractalEvent): boolean => event.type === 'drum_snare';
const isBass = (event: FractalEvent): boolean => event.type === 'bass';
const isCrash = (event: FractalEvent): boolean => event.type === 'drum_crash';

// === ОСНОВНАЯ ФУНКЦИЯ РЕЗОНАНСА ===

export const MelancholicMinorK: ResonanceMatrix = (
  eventA: FractalEvent,
  eventB: FractalEvent,
  context: { mood: Mood; tempo: number; delta: number }
): number => {
  // --- Ритмический резонанс (БАС ↔ УДАРНЫЕ) ---
  if ((isBass(eventA) && isKick(eventB)) || (isKick(eventA) && isBass(eventB))) {
    const bassTime = isBass(eventA) ? eventA.time : eventB.time;
    const kickTime = isKick(eventA) ? eventA.time : eventB.time;

    // Идеально: бас на долю, kick на долю, одновременно
    if (areSimultaneous(bassTime, kickTime) && isOnStrongBeat(bassTime)) {
      return 1.0;
    }
    // Хорошо: бас на "и", kick на долю (синкопа)
    if (Math.abs(bassTime - kickTime - 0.5) < 0.1 && isOnStrongBeat(kickTime)) {
      return 0.85;
    }
    return 0.3; // Слабый резонанс в остальных случаях
  }

  if ((isBass(eventA) && isSnare(eventB)) || (isSnare(eventA) && isBass(eventB))) {
    // Штраф за бас и малый барабан на одной доле
    if (areSimultaneous(eventA.time, eventB.time) && isOnSnareBeat(eventA.time)) {
      return 0.1;
    }
    return 0.8; // Нейтрально-положительный, если не совпадают
  }
  
  // --- ВНУТРЕННИЙ РЕЗОНАНС УДАРНЫХ ---
  if ((isKick(eventA) && isSnare(eventB)) || (isSnare(eventA) && isKick(eventB))) {
    const kickTime = isKick(eventA) ? eventA.time : eventB.time;
    const snareTime = isSnare(eventA) ? eventA.time : eventB.time;
    if (isOnStrongBeat(kickTime) && isOnSnareBeat(snareTime)) {
      return 0.95;
    }
    return 0.4;
  }

  // Ghost notes поощряются в слабых долях
  if (isGhostNote(eventA) || isGhostNote(eventB)) {
      const time = isGhostNote(eventA) ? eventA.time : eventB.time;
      return !isOnStrongBeat(time) ? 0.9 : 0.2;
  }

  // --- ГАРМОНИЧЕСКИЙ РЕЗОНАНС (БАС ↔ БАС) ---
  if (isBass(eventA) && isBass(eventB) && eventA.note !== eventB.note) {
    const scale = getScaleForMood(context.mood);
    const noteAInScale = scale.some(scaleNote => (eventA.note % 12) === (scaleNote % 12));
    const noteBInScale = scale.some(scaleNote => (eventB.note % 12) === (scaleNote % 12));
    return noteAInScale && noteBInScale ? 0.9 : 0.3;
  }

  // --- ДРАМАТУРГИЧЕСКИЙ РЕЗОНАНС (КУЛЬМИНАЦИЯ) ---
  if (context.delta > 0.9) { 
    if (eventA.type.includes('tom') || eventB.type.includes('tom')) return 0.85;
    if (isCrash(eventA) || isCrash(eventB)) return 1.0;
  } else { 
    if (isCrash(eventA) || isCrash(eventB)) return 0.05;
  }

  // Нейтральный резонанс для всех остальных комбинаций
  return 0.5;
};
