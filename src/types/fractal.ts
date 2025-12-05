

/**
 * Настроение — управляет ладом, динамикой, техникой
 */
export type Mood = 
  | 'epic' | 'joyful' | 'enthusiastic' // Позитивные
  | 'melancholic' | 'dark' | 'anxious'    // Негативные
  | 'dreamy' | 'contemplative' | 'calm';     // Нейтральные

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
  | 'hit'
  // Гитара
  | 'pick'
  | 'harm'
  | 'slide'
   // Legacy bass
  | 'arpeggio'
  | 'portamento'
  | 'glissando'
  | 'glide'
  | 'pulse';    

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
  | 'drum_tom_low'
  | 'drum_tom_mid'
  | 'drum_tom_high'
  | 'drum_ride'
  | 'drum_a_ride1'
  | 'drum_a_ride2'
  | 'drum_a_ride3'
  | 'drum_a_ride4'
  | 'drum_crash'
  | 'drum_closed_hi_hat_ghost'
  | 'drum_hihat_open'
  | 'drum_hihat_closed'
  | 'cymbal_bell1'
  | 'hh_bark_short'
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
  // Гармонические инструменты
  | 'accompaniment'
  | 'harmony'
  // Мелодические инструменты
  | 'melody'
  // Спецэффекты
  | 'sfx';

export type MelodyInstrument = 'piano' | 'violin' | 'flute' | 'synth' | 'organ' | 'mellotron' | 'theremin' | 'E-Bells_melody' | 'G-Drops' | 'acousticGuitarSolo' | 'electricGuitar' | 'ambientPad' | 'none';
export type BassInstrument = 'classicBass' | 'glideBass' | 'ambientDrone' | 'resonantGliss' | 'hypnoticDrone' | 'livingRiff' | 'none';
export type AccompanimentInstrument = MelodyInstrument | 'guitarChords' | 'ambientPad';


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
  chord?: number[];
};

/**
 * Параметры для синтезатора спецэффектов (SFX).
 */
export type SfxSynthParams = {
    duration: number;
    attack: { min: number; max: number };
    decay: { min: number; max: number };
    sustainLevel: number;
    release: { min: number; max: number };
    oscillators: { type: string; detune: number }[];
    startFreq: number;
    endFreq: number;
    pan: number;
    distortion: number;
};


/**
 * Событие фрактального композитора
 * Это единый протокол "композитор → исполнитель"
 */
export interface FractalEvent {
  /**
   * Тип инструмента — определяет, кто играет
   */
  type: InstrumentType | InstrumentType[];

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
  params?: BassSynthParams | SfxSynthParams;
}

export type InstrumentHints = {
    bass?: BassInstrument;
    melody?: MelodyInstrument;
    accompaniment?: AccompanimentInstrument;
    harmony?: 'piano' | 'guitarChords' | 'violin' | 'flute';
    bassTechnique?: BassTechnique;
};

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
    genre: Genre;
  }
) => number;

export type AccompanimentTechnique = 'choral' | 'alternating-bass-chord' | 'chord-pulsation' | 'arpeggio-fast' | 'arpeggio-slow' | 'alberti-bass' | 'paired-notes' | 'long-chords';


// --- Blueprint Types ---

export type SectionName = 'INTRO_A' | 'INTRO_B' | 'INTRO_C' | 'BUILD' | 'MAIN' | 'RELEASE' | 'OUTRO' | 'BRIDGE';

export type PartBlueprint = {
  techniquesByPart: Record<SectionName, { technique: string, weight: number }[]>;
  densityByPart: Record<SectionName, number>;
  registerByPart?: Record<SectionName, { min: number, max: number }>;
  envelopeByPart?: Record<SectionName, { attack: number, decay: number, sustain: number, release: number }>;
};

export type MusicBlueprint = {
  id: string;
  name: string;
  mood: Mood;
  timing: {
    bpm: number;
    suiteMinutes: number;
    secondsPerBar: number;
    barsPerMinute: number;
    totalBars: number;
    introDuration?: number; // Optional now, as we have specific intro sections
    partsDistribution: { part: SectionName, bars: number, percent?: number }[];
  };
  harmony: {
    key: { root: string, scale: string, octave: number };
    chords: {
      primary: { name: string, notes: string[], midi: number[], tension: number }[];
      secondary: { name: string, notes: string[], midi: number[], tension: number }[];
      tension?: { name: string, notes: string[], midi: number[], tension: number }[];
    };
    progressions: Partial<Record<SectionName, string[]>>; // Use Partial to allow omitting sections
    motion: { ascending: number, descending: number, static: number };
  };
  voicings: {
    preferredType: string;
    voiceCount: { min: number, max: number };
    spread: { min: number, max: number };
    examples: Record<string, number[]>;
  };
  bass: PartBlueprint;
  pad: PartBlueprint;
  drums: {
    activeParts: SectionName[];
    kit: { type: string, pattern: string, velocity: { min: number, max: number }, probability: number }[];
    densityByPart: Partial<Record<SectionName, number>>;
  };
  layers: Partial<Record<SectionName, Record<string, boolean>>>;
  mutations: {
    microProbability: number;
    mediumProbability: number;
    allowedTranspositions: number[];
    microTypes: string[];
    mediumTypes: string[];
  };
  fills: {
    bundle: { type: string, duration: number, probability: number };
    part: { type: string, duration: number, probability: number };
  };
  unique: {
    filterCutoff: { min: number, max: number };
    reverbSize: number;
    subBassBoost?: number;
    noiselevel?: number;
    shimmerMix?: number;
    brightness?: number;
    swing?: number;
    character: string;
    ambientEvents: { type: string, probability: number, activeParts: SectionName[] }[];
  };
  unisonPolicy?: any; // To be fully defined later
  transitions?: any; // To be fully defined later
};
