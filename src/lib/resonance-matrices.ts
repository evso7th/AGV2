
import type { FractalEvent, ResonanceMatrix, Mood, Genre } from '@/types/fractal';
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
const isFill = (event: FractalEvent): boolean => event.technique === 'fill';
const isTom = (event: FractalEvent): boolean => event.type.startsWith('drum_tom');

// === ОСНОВНАЯ ФУНКЦИЯ РЕЗОНАНСА ===

export const MelancholicMinorK: ResonanceMatrix = (
  eventA: FractalEvent,
  eventB: FractalEvent,
  context: { mood: Mood; tempo: number; delta: number, genre: Genre }
): number => {
  const event1IsBass = isBass(eventA);
  const event2IsBass = isBass(eventB);
  const event1IsDrums = eventA.type.startsWith('drum_') || eventA.type.startsWith('perc-');
  const event2IsDrums = eventB.type.startsWith('drum_') || eventB.type.startsWith('perc-');

  // --- Ритмический резонанс (БАС ↔ УДАРНЫЕ) ---
  if ((event1IsBass && event2IsDrums) || (event1IsDrums && event2IsBass)) {
      const bassEvent = event1IsBass ? eventA : eventB;
      const drumEvent = event1IsDrums ? eventA : eventB;

      // Сценарий 3: "Джем" - сильный резонанс для одновременных филлов
      if (isFill(bassEvent) && (isTom(drumEvent) || (isSnare(drumEvent) && drumEvent.weight > 0.8))) {
          if (areSimultaneous(bassEvent.time, drumEvent.time)) return 1.0;
          if (Math.abs(bassEvent.time - drumEvent.time) < 0.25) return 0.9;
      }
      
      if (isKick(drumEvent)) {
        if (areSimultaneous(bassEvent.time, drumEvent.time) && isOnStrongBeat(bassEvent.time)) return 1.0; // Идеально
        if (Math.abs(bassEvent.time - drumEvent.time - 0.5) < 0.1 && isOnStrongBeat(drumEvent.time)) return 0.85; // Синкопа
        return 0.3;
      }

      if (isSnare(drumEvent)) {
        if (areSimultaneous(bassEvent.time, drumEvent.time) && isOnSnareBeat(bassEvent.time)) return 0.1; // Конфликт
        return 0.8;
      }
  }
  
  // --- ВНУТРЕННИЙ РЕЗОНАНС УДАРНЫХ ---
  if (event1IsDrums && event2IsDrums) {
      if ((isKick(eventA) && isSnare(eventB)) || (isSnare(eventA) && isKick(eventB))) {
        const kickTime = isKick(eventA) ? eventA.time : eventB.time;
        const snareTime = isSnare(eventA) ? eventA.time : eventB.time;
        if (isOnStrongBeat(kickTime) && isOnSnareBeat(snareTime)) return 0.95;
        return 0.4;
      }
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
    
    // Для филлов более строгая гармоническая проверка
    if (isFill(eventA) && isFill(eventB)) {
        return noteAInScale && noteBInScale ? 0.95 : 0.2;
    }
    
    return noteAInScale && noteBInScale ? 0.9 : 0.3;
  }

  // --- ДРАМАТУРГИЧЕСКИЙ РЕЗОНАНС (КУЛЬМИНАЦИЯ) ---
  if (context.delta > 0.9) { 
    if (eventA.type.includes('tom') || eventB.type.includes('tom')) return 0.85;
    // Crash is inappropriate for ambient
    if ((isCrash(eventA) || isCrash(eventB)) && context.genre !== 'ambient') return 1.0;
  } else { 
    if (isCrash(eventA) || isCrash(eventB)) return 0.05;
  }

  // Нейтральный резонанс для всех остальных комбинаций
  return 0.5;
};
