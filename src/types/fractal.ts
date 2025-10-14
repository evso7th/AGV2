/**
 * Настроение — управляет ладом, динамикой, техникой
 */
export type Mood = 'melancholic' | 'epic' | 'dreamy' | 'dark';

/**
 * Жанр — управляет формой и плотностью
 */
export type Genre = 'trance' | 'ambient' | 'progressive' | 'rock';

/**
 * Техника игры
 */
export type Technique = 
  // Бас
  | 'pluck'    // щипок пальцами
  | 'ghost'    // приглушённая нота в паузе
  | 'slap'     // slap & pop (удар + щелчок)
  | 'harmonic' // флажолет
  // Ударные
  | 'hit';     // стандартный удар по сэмплу

/**
 * Динамика (громкость)
 */
export type Dynamics = 'p' | 'mf' | 'f';

/**
 * Фразировка (артикуляция)
 */
export type Phrasing = 'legato' | 'staccato';

/**
 * Тип инструмента
 */
export type InstrumentType =
  // Бас (синтезатор)
  | 'bass'
  // Ударные (сэмплы)
  | 'drum_kick'
  | 'drum_snare'
  | 'drum_hihat_closed'
  | 'drum_hihat_open'
  | 'drum_ride'
  | 'drum_crash'
  | 'drum_tom_low'
  | 'drum_tom_mid'
  | 'drum_tom_high';

/**
 * Событие фрактального композитора
 * Это единый протокол "композитор → исполнитель"
 */
export interface FractalEvent {
  /**
   * Тип инструмента
   */
  type: InstrumentType;

  /**
   * Нота в MIDI (например, 40 = E2, 36 = kick)
   */
  note: number;

  /**
   * Длительность в долях такта (1 = целая при 4/4)
   */
  duration: number;

  /**
   * Абсолютное время начала в секундах от старта композиции
   */
  time: number;

  /**
   * Вес ветви (0.0–1.0) — мера "живости" идеи в фрактальной модели
   */
  weight: number;

  /**
   * Техника исполнения
   */
  technique: Technique;

  /**
   * Динамика (громкость)
   */
  dynamics: Dynamics;

  /**
   * Фразировка (артикуляция)
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
  context: {
    mood: Mood;
    tempo: number;
    delta: number; // текущий импульс δ(t)
  }
) => number;
