
/**
 * Настроение — управляет ладом, динамикой, техникой
 */
export type Mood = 'melancholic' | 'epic' | 'dreamy' | 'dark';

/**
 * Жанр — управляет формой и плотностью
 */
export type Genre = 'trance' | 'ambient' | 'progressive' | 'rock' | 'house' | 'rnb' | 'ballad' | 'reggae' | 'blues' | 'celtic';

/**
 * Техника игры
 */
export type Technique = 
  // Бас
  | 'pluck'    // щипок пальцами
  | 'ghost'    // приглушённая нота в паузе
  | 'slap'     // slap & pop (удар + щелчок)
  | 'harmonic' // флажолет
  | 'fill'     // басовый проигрыш (сбивка)
  | 'swell'    // медленное нарастание, как пэд
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
  | 'drum_snare_ghost_note'
  | 'drum_snare_off'
  | 'drum_snarepress'
  | 'drum_hihat_closed'
  | 'drum_hihat_open'
  | 'drum_ride'
  | 'drum_crash'
  | 'drum_tom_low'
  | 'drum_tom_mid'
  | 'drum_tom_high'
  | 'drum_a_ride1'
  | 'drum_a_ride2'
  | 'drum_a_ride3'
  | 'drum_a_ride4'
  | 'perc-001'
  | 'perc-002'
  | 'perc-003'
  | 'perc-004'
  | 'perc-005'
  | 'perc-006'
  | 'perc-007'
  | 'perc-008'
  | 'perc-009'
  | 'perc-010'
  | 'perc-011'
  | 'perc-012'
  | 'perc-013'
  | 'perc-014'
  | 'perc-015'
  | 'hh_bark_short'
  | 'cymbal_bell1';

/**
 * Параметры для синтезатора баса.
 */
export type BassSynthParams = {
  cutoff: number;
  resonance: number;
  distortion: number;
  portamento: number;
  attack?: number;
  release?: number;
};

/**
 * Событие фрактального композитора
 * Это единый протокол "композитор → исполнитель"
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
   * Время начала в долях такта (относительно начала такта)
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
  
  /**
   * Параметры синтеза (только для 'bass')
   * Рассчитываются композитором, исполняются синтезатором.
   */
  params?: BassSynthParams;
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
