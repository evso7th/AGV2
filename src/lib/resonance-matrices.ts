
import type { FractalEvent, ResonanceMatrix, Mood, Genre } from '@/types/fractal';
import { getScaleForMood } from './music-theory';

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

/** Проверяет, что время событий совпадает с небольшой погрешностью */
function areSimultaneous(timeA: number, timeB: number, tolerance: number = 0.05): boolean {
  return Math.abs(timeA - timeB) < tolerance;
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
const isTom = (event: FractalEvent): boolean => (event.type as string).startsWith('drum_tom');
const isAccompaniment = (event: FractalEvent): boolean => event.type === 'accompaniment';
const isHarmony = (event: FractalEvent): boolean => event.type === 'harmony';

const isTonal = (event: FractalEvent): boolean => isBass(event) || isAccompaniment(event) || isHarmony(event);
const isRhythmic = (event: FractalEvent): boolean => (event.type as string).startsWith('drum_') || (event.type as string).startsWith('perc-');

// === МАТРИЦЫ РЕЗОНАНСА ===

/**
 * Матрица для ритмичных, динамичных жанров (Trance, House, Rock и т.д.)
 * Поощряет синхронизацию баса и ударных, четкую структуру.
 */
export const RhythmicK: ResonanceMatrix = (
  eventA: FractalEvent,
  eventB: FractalEvent,
  context: { mood: Mood; tempo: number; delta: number, genre: Genre }
): number => {
  if (!eventA || !eventB) return 0.5;

  const event1IsBass = isBass(eventA);
  const event2IsBass = isBass(eventB);
  const event1IsDrums = isRhythmic(eventA);
  const event2IsDrums = isRhythmic(eventB);

  // --- Ритмический резонанс (БАС ↔ УДАРНЫЕ) ---
  if ((event1IsBass && event2IsDrums) || (event1IsDrums && event2IsBass)) {
      const bassEvent = event1IsBass ? eventA : eventB;
      const drumEvent = event1IsDrums ? eventA : eventB;

      // Сильный резонанс для одновременных филлов
      if (isFill(bassEvent) && (isTom(drumEvent) || isSnare(drumEvent))) {
          if (areSimultaneous(bassEvent.time, drumEvent.time)) return 1.0;
          if (Math.abs(bassEvent.time - drumEvent.time) < 0.25) return 0.9;
      }
      
      if (isKick(drumEvent)) {
        if (areSimultaneous(bassEvent.time, drumEvent.time) && isOnStrongBeat(bassEvent.time)) return 1.0; // Идеально
        if (Math.abs(bassEvent.time - drumEvent.time - 0.5) < 0.1) return 0.8; // Классическая синкопа
        return 0.3;
      }

      if (isSnare(drumEvent)) {
        // Штраф за одновременный удар с басом
        if (areSimultaneous(bassEvent.time, drumEvent.time)) return 0.1;
        return 0.7;
      }
  }
  
  // --- ВНУТРЕННИЙ РЕЗОНАНС УДАРНЫХ ---
  if (event1IsDrums && event2IsDrums) {
      // Классический паттерн kick-snare
      if ((isKick(eventA) && isSnare(eventB)) || (isSnare(eventA) && isKick(eventB))) {
        const kickTime = isKick(eventA) ? eventA.time : eventB.time;
        const snareTime = isSnare(eventA) ? eventA.time : eventB.time;
        if (isOnStrongBeat(kickTime) && isOnSnareBeat(snareTime)) return 0.95;
      }
      // Штраф за одновременный удар крэша и другого барабана, чтобы не было "грязи"
      if ((isCrash(eventA) && !isKick(eventB)) || (isCrash(eventB) && !isKick(eventA))) {
          if (areSimultaneous(eventA.time, eventB.time)) return 0.2;
      }
      return 0.8; // В целом, барабаны хорошо резонируют друг с другом
  }

  // --- ГАРМОНИЧЕСКИЙ РЕЗОНАНС (МЕЖДУ ТОНАЛЬНЫМИ ИНСТРУМЕНТАМИ) ---
  if (isTonal(eventA) && isTonal(eventB)) {
    if (eventA.note === eventB.note && areSimultaneous(eventA.time, eventB.time, 0.1)) return 1.0; // Поощрение за дублирование в октаву

    const scale = getScaleForMood(context.mood);
    const noteAInScale = scale.some(scaleNote => (eventA.note % 12) === (scaleNote % 12));
    const noteBInScale = scale.some(scaleNote => (eventB.note % 12) === (scaleNote % 12));
    
    if (!noteAInScale || !noteBInScale) return 0.1; // Сильный штраф за ноты не из гаммы

    const interval = Math.abs(eventA.note - eventB.note) % 12;
    if ([0, 4, 7].includes(interval)) return 0.9; // Мажорное трезвучие
    if ([0, 3, 7].includes(interval)) return 0.9; // Минорное трезвучие
    
    return 0.6; // Другие ноты из гаммы
  }

  return 0.5; // Нейтральный резонанс для всех остальных комбинаций
};

/**
 * Матрица для стиля Ambient.
 * Поощряет разреженность, длинные ноты и гармоническое соответствие,
 * штрафует за одновременное начало нот.
 */
export const AmbientK: ResonanceMatrix = (
  eventA: FractalEvent,
  eventB: FractalEvent,
  context: { mood: Mood; tempo: number; delta: number, genre: Genre }
): number => {
    if (!eventA || !eventB) return 0.5;

    const event1IsTonal = isTonal(eventA);
    const event2IsTonal = isTonal(eventB);
    const event1IsDrums = isRhythmic(eventA);
    const event2IsDrums = isRhythmic(eventB);

    // Главное правило для Ambient: штраф за одновременность
    if (areSimultaneous(eventA.time, eventB.time)) {
        // Исключение: кик и бас могут быть вместе
        if ((isKick(eventA) && isBass(eventB)) || (isBass(eventA) && isKick(eventB))) {
            return 0.8;
        }
        return 0.1; // Сильный штраф за одновременное начало
    }
    
    // Внутренний резонанс тональных инструментов
    if (event1IsTonal && event2IsTonal) {
        const scale = getScaleForMood(context.mood);
        const noteAInScale = scale.some(scaleNote => (eventA.note % 12) === (scaleNote % 12));
        const noteBInScale = scale.some(scaleNote => (eventB.note % 12) === (scaleNote % 12));
        
        if (!noteAInScale || !noteBInScale) return 0.05; // Очень сильный штраф за выход из гаммы

        const interval = Math.abs(eventA.note - eventB.note) % 12;
        // Поощрение консонансов (терции, квинты, сексты)
        if ([3, 4, 7, 8, 9].includes(interval)) return 0.95;
        // Поощрение плавного движения
        if ([1, 2].includes(interval)) return 0.8;
        return 0.6;
    }
    
    // Резонанс ударных в Ambient
    if (event1IsDrums && event2IsDrums) {
        return 0.3; // Ударные в эмбиенте не должны сильно резонировать друг с другом
    }

    // Резонанс между ударными и тональными
    if ((event1IsTonal && event2IsDrums) || (event1IsDrums && event2IsTonal)) {
        return 0.2; // Практически не должны влиять друг на друга
    }

    return 0.5; // Нейтральный резонанс
};

```