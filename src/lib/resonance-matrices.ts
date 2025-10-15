
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
    // Поощрение за бас и бочку в сильные доли, если они звучат одновременно
    if (areSimultaneous(eventA.time, eventB.time) && isOnStrongBeat(eventA.time)) {
      return 1.0;
    }
    return 0.3; // Слабый резонанс в остальных случаях
  }

  if ((isBass(eventA) && isSnare(eventB)) || (isSnare(eventA) && isBass(eventB))) {
    // Штраф за бас и малый барабан на одной доле
    if (areSimultaneous(eventA.time, eventB.time)) {
      return 0.1;
    }
    return 0.8; // Нейтрально-положительный, если не совпадают
  }

  // --- ВНУТРЕННИЙ РЕЗОНАНС УДАРНЫХ ---
  if ((isKick(eventA) && isSnare(eventB)) || (isSnare(eventA) && isKick(eventB))) {
    // Классический грув: бочка в сильной доле, малый - в слабой, даже если не строго одновременно
    const kickTime = isKick(eventA) ? eventA.time : eventB.time;
    const snareTime = isSnare(eventA) ? eventA.time : eventB.time;
    if (isOnStrongBeat(kickTime) && isOnSnareBeat(snareTime)) {
      return 0.95;
    }
    return 0.4; // Конфликт ритма
  }

  // Ghost notes (тихие, призрачные ноты) поощряются в слабых долях
  if (isGhostNote(eventA) || isGhostNote(eventB)) {
      const time = isGhostNote(eventA) ? eventA.time : eventB.time;
      return !isOnStrongBeat(time) ? 0.9 : 0.2;
  }

  // --- ГАРМОНИЧЕСКИЙ РЕЗОНАНС (БАС ↔ БАС) ---
  if (isBass(eventA) && isBass(eventB) && eventA.note !== eventB.note) { // Сравниваем разные ноты
    const scale = getScaleForMood(context.mood);
    const noteAInScale = scale.some(scaleNote => (eventA.note % 12) === (scaleNote % 12));
    const noteBInScale = scale.some(scaleNote => (eventB.note % 12) === (scaleNote % 12));
    // Поощрение, если обе ноты принадлежат текущей гамме
    return noteAInScale && noteBInScale ? 0.9 : 0.3;
  }

  // --- ДРАМАТУРГИЧЕСКИЙ РЕЗОНАНС (КУЛЬМИНАЦИЯ) ---
  if (context.delta > 0.9) { // Фаза высокой энергии
    if (eventA.type.includes('tom') || eventB.type.includes('tom')) return 0.85; // Сбивки на томах
    if (isCrash(eventA) || isCrash(eventB)) return 1.0; // Тарелка crash
  } else { // Фаза низкой энергии
    // Штраф за использование crash вне кульминации
    if (isCrash(eventA) || isCrash(eventB)) return 0.05;
  }

  // Нейтральный резонанс для всех остальных комбинаций
  return 0.5;
};
