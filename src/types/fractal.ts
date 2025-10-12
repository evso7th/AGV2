
// types/fractal.ts

/**
 * Настроение (определяет лад, динамику, технику)
 */
export type Mood = 'melancholic' | 'epic' | 'dreamy' | 'dark';

/**
 * Жанр (определяет форму, темп, плотность)
 */
export type Genre = 'trance' | 'ambient' | 'progressive' | 'rock';

/**
 * Техника игры на басу или ударных
 * Расширено для поддержки всех инструментов
 */
export type Technique = 'pluck' | 'ghost' | 'slap' | 'hit' | 'harmonic';

/**
 * Динамика (громкость)
 */
export type Dynamics = 'p' | 'mf' | 'f';

/**
 * Фразировка (артикуляция)
 */
export type Phrasing = 'legato' | 'staccato';

/**
 * Тип инструмента (для маршрутизации события)
 */
export type InstrumentType =
  | 'bass'
  | 'drum_kick'
  | 'drum_snare'
  | 'drum_hat'
  | 'pad'
  | 'lead'
  | 'arp';

/**
 * Событие фрактального композитора
 * Это основной протокол "композитор → инструмент"
 */
export interface FractalEvent {
  /**
   * Тип инструмента — определяет, кто играет
   */
  type: InstrumentType;

  /**
   * Нота в MIDI (например, 40 = E2)
   */
  note: number;

  /**
   * Длительность в долях такта (1 = целая нота при 4/4)
   */
  duration: number;

  /**
   * Абсолютное время начала события в секундах
   */
  time: number;

  /**
   * Вес ветви (0.0–1.0) — мера "живости" идеи
   */
  weight: number;

  /**
   * Техника исполнения
   */
  technique: Technique;

  /**
   * Динамика
   */
  dynamics: Dynamics;

  /**
   * Фразировка
   */
  phrasing: Phrasing;
}

/**
 * Идентификатор события (для отладки и трассировки)
 */
export type EventID = string;

/**
 * Ядро связности (резонансная матрица)
 * Принимает два события и возвращает меру совместимости [0.0, 1.0]
 */
export type ResonanceMatrix = (
  eventA: FractalEvent,
  eventB: FractalEvent,
  context?: ResonanceContext
) => number;

/**
 * Контекст для расширенного резонанса (опционален)
 */
export interface ResonanceContext {
  mood: Mood;
  delta: number; // текущий импульс δ(t)
  kickTimes: number[];
  snareTimes: number[];
  beatPhase: number; // фаза доли (0.0–4.0)
}
