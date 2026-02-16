/**
 * Настроение — управляет ладом, динамикой, техникой
 */
export type Mood = 
  | 'epic' | 'joyful' | 'enthusiastic' // Позитивные
  | 'melancholic' | 'dark' | 'anxious'    // Негативные
  | 'dreamy' | 'contemplative' | 'calm' | 'gloomy';     // Нейтральные

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
  | 'riff'     // Исполнение специфического риффа
  | 'long_notes' // Длинные, протяжные ноты
  | 'boogie'   // Классический буги-вуги паттерн
  | 'walking'  // Шагающий бас
  | 'drone'    // Очень длинная, статичная нота
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
  | 'pulse'
  | 'syncopated';    

/**
 * Динамика (громкость)
 */
export type Dynamics = 'p' | 'mf' | 'f';

/**
 * Фразировка
 */
export type Phrasing = 'legato' | 'staccato' | 'detached';

/**
 * Тип инструмента
 */
export type InstrumentType =
  // Бас (синтезатор)
  | 'bass'
  // Ударные (сэмплы)
  | 'drum_25677__walter_odington__alex-hat'
  | 'drum_25678__walter_odington__avalanche-hat'
  | 'drum_25687__walter_odington__blip-hat'
  | 'drum_25688__walter_odington__brushed-bell-hat'
  | 'drum_25691__walter_odington__fastlinger'
  | 'drum_25693__walter_odington__hackney-hat-1'
  | 'drum_25694__walter_odington__hackney-hat-2'
  | 'drum_25695__walter_odington__hackney-hat-3'
  | 'drum_25696__walter_odington__hackney-hat-4'
  | 'drum_25701__walter_odington__new-years-hat-1'
  | 'drum_25702__walter_odington__new-years-hat-2'
  | 'drum_a-ride1'
  | 'drum_a-ride2'
  | 'drum_a-ride3'
  | 'drum_a-ride4'
  | 'drum_Bell_-_Ambient'
  | 'drum_Bell_-_Analog'
  | 'drum_Bell_-_Astro'
  | 'drum_Bell_-_Background'
  | 'drum_Bell_-_Bright'
  | 'drum_Bell_-_Broken'
  | 'drum_Bell_-_Cheap'
  | 'drum_Bell_-_Cheesy'
  | 'drum_Bell_-_Chorus'
  | 'drum_Bell_-_Click'
  | 'drum_Bell_-_Crystals'
  | 'drum_Bell_-_Deep'
  | 'drum_Bell_-_Detuned'
  | 'drum_Bell_-_Easy'
  | 'drum_Bell_-_Echo'
  | 'drum_Bell_-_Evil'
  | 'drum_Bell_-_Faded'
  | 'drum_Bell_-_Far_Away'
  | 'drum_Bell_-_Fast'
  | 'drum_Bell_-_Futuristic'
  | 'drum_Bell_-_Glide'
  | 'drum_Bell_-_Gong'
  | 'drum_Bell_-_Higher'
  | 'drum_Bell_-_High'
  | 'drum_Bell_-_Horror'
  | 'drum_Bell_-_Long'
  | 'drum_Bell_-_Moonlight'
  | 'drum_Bell_-_Nasty'
  | 'drum_Bell_-_Normal'
  | 'drum_Bell_-_Plug'
  | 'drum_Bell_-_Quick'
  | 'drum_Bell_-_Reverb'
  | 'drum_Bell_-_Ring'
  | 'drum_Bell_-_Slide'
  | 'drum_Bell_-_Smooth'
  | 'drum_Bell_-_Soft'
  | 'drum_Bell_-_Tap'
  | 'drum_Bell_-_Too_Easy'
  | 'drum_Bell_-_Unstable'
  | 'drum_Bell_-_Vintage'
  | 'drum_Bell_-_Weird'
  | 'drum_Bell_-_Wind'
  | 'drum_bongo_pc-01'
  | 'drum_bongo_pc-02'
  | 'drum_bongo_pc-03'
  | 'drum_bongo_pvc-tube-01'
  | 'drum_bongo_pvc-tube-02'
  | 'drum_bongo_pvc-tube-03'
  | 'drum_brush1'
  | 'drum_brush2'
  | 'drum_brush3'
  | 'drum_brush4'
  | 'drum_cajon_kick'
  | 'drum_closed_hi_hat_ghost'
  | 'drum_cowbell'
  | 'drum_crash2'
  | 'drum_cymbal1'
  | 'drum_cymbal2'
  | 'drum_cymbal3'
  | 'drum_cymbal4'
  | 'drum_cymbal_bell1'
  | 'drum_cymbal_bell2'
  | 'drum_drum_kick_reso'
  | 'drum_hightom'
  | 'drum_hightom_soft'
  | 'drum_kick_drum6'
  | 'drum_kick_soft'
  | 'drum_lowtom'
  | 'drum_lowtom_soft'
  | 'drum_midtom'
  | 'drum_midtom_soft'
  | 'drum_open_hh_bottom2'
  | 'drum_open_hh_top2'
  | 'drum_ride'
  | 'drum_ride_wetter'
  | 'drum_snare_ghost_note'
  | 'drum_snare_off'
  | 'drum_snare'
  | 'drum_snarepress'
  | 'drum_Sonor_Classix_High_Tom'
  | 'drum_Sonor_Classix_Low_Tom'
  | 'drum_Sonor_Classix_Mid_Tom'
  | 'drum_kick'
  | 'drum_hihat_closed'
  | 'drum_hihat_open'
  | 'drum_crash'
  | 'drum_tom_high'
  | 'drum_tom_mid'
  | 'drum_tom_low'
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
  | 'pianoAccompaniment' // New part for piano
  // Спецэффекты
  | 'sfx'
  | 'sparkle';

export type MelodyInstrument = 'piano' | 'violin' | 'flute' | 'synth' | 'organ' | 'mellotron' | 'theremin' | 'E-Bells_melody' | 'G-Drops' | 'acousticGuitarSolo' | 'electricGuitar' | 'ambientPad' | 'acousticGuitar' | 'none' | 'blackAcoustic' | 'telecaster' | 'darkTelecaster';
export type BassInstrument = 'classicBass' | 'glideBass' | 'ambientDrone' | 'resonantGliss' | 'hypnoticDrone' | 'livingRiff' | 'none';
export type AccompanimentInstrument = MelodyInstrument | 'guitarChords';
export type V1MelodyInstrument = 'synth' | 'organ' | 'mellotron' | 'theremin' | 'E-Bells_melody' | 'G-Drops' | 'acousticGuitarSolo' | 'electricGuitar' | 'ambientPad' | 'acousticGuitar' | 'none';
export type V2MelodyInstrument = 'guitar_muffLead' | 'guitar_shineOn' | 'ep_rhodes_warm' | 'synth_ambient_pad_lush' | 'synth_cave_pad' | 'mellotron_flute_intimate' | 'mellotron_choir' | 'ep_rhodes_70s' | 'synth_lead_shineOn' | 'synth_lead_distorted' | 'guitar_clean_chorus' | 'organ_soft_jazz' | 'organ_jimmy_smith' | 'organ_prog';

export type InstrumentPart = 'bass' | 'melody' | 'accompaniment' | 'harmony' | 'drums' | 'effects' | 'sparkles' | 'piano' | 'violin' | 'flute' | 'guitarChords' | 'acousticGuitarSolo' | 'sfx' | 'blackAcoustic' | 'telecaster' | 'darkTelecaster' | 'pianoAccompaniment';
export type BassTechnique = 'arpeggio' | 'portamento' | 'glissando' | 'glide' | 'pulse' | 'riff' | 'long_notes' | 'walking' | 'boogie' | 'syncopated';    

export type Technique = BassTechnique | 'pluck' | 'pick' | 'harm' | 'slide' | 'hit' | 'ghost' | 'swell' | 'fill';
export type AccompanimentTechnique = 'choral' | 'alternating-bass-chord' | 'chord-pulsation' | 'arpeggio-fast' | 'arpeggio-slow' | 'alberti-bass' | 'paired-notes' | 'long-chords' | 'power-chords' | 'rhythmic-comp';


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

export type SfxRule = {
    eventProbability: number;
    categories: { name: string; weight: number }[];
};


/**
 * Параметры для синтезатора спецэффектов (SFX).
 */
export type SfxSynthParams = {
    duration: number;
    attack: number;
    decay: number;
    sustainLevel: number;
    release: number;
    oscillators: { type: string; detune: number }[];
    startFreq: number;
    endFreq: number;
    pan: number;
    distortion: number;
    mood: Mood;
    genre: Genre;
    rules?: SfxRule;
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
   * Параметры синтеза.
   */
  params?: BassSynthParams | SfxSynthParams | { barCount?: number; voicingName?: string; filterCutoff?: number };
  
  /** 
   * #ЗАЧЕМ: Это поле позволяет композитору явно указать имя аккорда для сэмплеров.
   * #ЧТО: Содержит строковое представление аккорда, например, "Dm", "G", "Am".
   * #СВЯЗИ: Заполняется в `createHarmonyAxiom` и используется в `telecaster-chords-sampler.ts`.
   */
  chordName?: string;
}

export type InstrumentHints = {
    bass?: BassInstrument;
    melody?: MelodyInstrument;
    accompaniment?: AccompanimentInstrument;
    harmony?: 'piano' | 'guitarChords' | 'violin' | 'flute' | 'none';
    pianoAccompaniment?: 'piano';
    drums?: string;
    /** #ЗАЧЕМ: Эффект постепенного рождения. */
    summonProgress?: Partial<Record<InstrumentPart, number>>;
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


/**
 * Описывает один аккорд в неслышимой гармонической основе (скелете) сьюиты.
 */
export type GhostChord = {
  /** Основная нота аккорда (тоника) в MIDI формате. */
  rootNote: number;
  /** Тип аккорда (например, мажор, минор). */
  chordType: 'major' | 'minor' | 'diminished' | 'dominant'; // Можно расширить
  /** Такт, с которого начинает звучать этот аккорд. */
  bar: number;
  /** Длительность аккорда в тактах. */
  durationBars: number;
  /** Обращение аккорда (0 - основное, 1 - первое, 2 - второе). */
  inversion?: 0 | 1 | 2;
};

// --- НОВЫЕ ТИПЫ ДЛЯ "ДНК СЮИТЫ" (ПЛАН 1508) ---

export type RhythmicFeel = 'shuffle' | 'straight';
export type BassStyle = 'boogie' | 'walking' | 'pedal';
export type DrumStyle = 'heavy_backbeat' | 'light_brushes' | 'shuffle_A' | 'shuffle_B';

/**
 * #ЗАЧЕМ: "ДНК Сюиты" — это уникальный генетический код для всей пьесы.
 * #ЧТО: Он создается один раз в начале и определяет глобальные, неизменные
 *       параметры композиции: гармонию, темп и ритмический стиль.
 * #СВЯЗИ: Генерируется в `music-theory.ts` (generateSuiteDNA), хранится в
 *          `fractal-music-engine.ts` и используется для управления генерацией всех партий.
 */
export type SuiteDNA = {
  harmonyTrack: GhostChord[];
  baseTempo: number;
  rhythmicFeel: RhythmicFeel;
  bassStyle: BassStyle;
  drumStyle: DrumStyle;
  soloPlanMap: Map<string, string>;
  /** #ЗАЧЕМ: Энергетический скелет сюиты.
   *  #ЧТО: Массив значений 0..1 для каждого такта. */
  tensionMap: number[];
  /** #ЗАЧЕМ: Тип блюзовой сетки (План №175). */
  bluesGridType?: 'classic' | 'quick-change' | 'minor-blues';
  /** #ЗАЧЕМ: Тематические якоря сюиты (План №175). */
  thematicAnchors?: string[];
  /** #ЗАЧЕМ: Семантическое семя для СОР (План №218). */
  seedLickId?: string;
  /** #ЗАЧЕМ: Трансформированная аксиома лика для старта эволюции (План №242). */
  seedLickNotes?: BluesSoloPhrase;
  /** #ЗАЧЕМ: Маршрут географического путешествия (3 локации). */
  itinerary?: string[];
  /** #ЗАЧЕМ: Династия ликов для блюзовой пьесы (План №437). */
  dynasty?: string;
  /** #ЗАЧЕМ: Карта привязки ликов к частям блюпринта (План №437). */
  partLickMap?: Map<string, string>;
};


// --- BLUES TYPES ---
export type BluesRiffDegree = 'R' | '2' | 'b2' | 'b3' | '3' | '4' | '#4' | 'b5' | '5' | 'b6' | '6' | 'b7' | '9' | '11' | 'R+8';

export type BluesRiffNote = {
  t: number;      // tick (0-11 for 12/8 time)
  deg: BluesRiffDegree;
  d?: number;     // duration in ticks (optional, default 2)
};

export type BluesRiffPattern = BluesRiffNote[];

export type BluesBassRiff = {
    I: BluesRiffPattern;
    IV: BluesRiffPattern;
    V: BluesRiffPattern;
    turn: BluesRiffPattern;
};

export type BluesDrumPattern = {
  HH?: number[];
  OH?: number[];
  SD?: number[];
  K?: number[];
  R?: number[];
  T?: number[];
  ghostSD?: number[];
};

export type BluesDrumRiffs = Partial<Record<Mood, BluesDrumPattern[]>>;


export type BluesMelodyPhrase = {
  t: number; // tick (0-11 for 12/8 time)
  d: number; // duration in ticks
  deg: BluesRiffDegree;
  vel?: number;
}[];

export type BluesMelody = {
  id: string;
  moods: Mood[];
  type: 'major' | 'minor';
  tags: string[];
  progression: string[]; // Placeholder for future use, e.g., ["I", "IV", "I", "I"...]
  phraseI: BluesMelodyPhrase;
  phraseIV: BluesMelodyPhrase;
  phraseV: BluesMelodyPhrase;
  phraseTurnaround: BluesMelodyPhrase;
};

// --- GUITAR SOLO & RIFF TYPES (ПЛАН 902.2 & 989) ---

/**
 * Defines a single note within a guitar "lick" (a short musical phrase).
 */
export type BluesSoloPhrase = {
  t: number; // Start tick (0-11)
  d: number; // Duration in ticks
  deg: BluesRiffDegree; // Degree relative to the chord root
  tech?: 'sl' | 'h/p' | 'bn' | 'vb' | 'gr' | 'ds' | 'pick' | 'harm' | 'pluck' | 'hit' | 'swell'; // Performance technique
}[];

/**
 * Defines a fingerpicking pattern.
 */
export type FingerstylePattern = {
  probability: number;
  pattern: 'F_TRAVIS' | 'F_ROLL12'; // Pattern name
  voicingName: string; // The chord voicing to use
};

/**
 * Defines a strumming pattern.
 */
export type StrumPattern = {
  probability: number;
  pattern: 'S_SWING' | 'S_4DOWN'; // Pattern name
  voicingName: string; // The chord voicing to use
};

/**
 * A complete description of a guitar arrangement for a 12-bar blues chorus.
 */
export type BluesGuitarRiff = {
  id: string;
  moods: Mood[];
  type: 'major' | 'minor';
  tags: string[];
  bpm: number;
  key: string;
  // Solo phrases for each chord type in a 12-bar blues progression
  solo: {
    I: BluesSoloPhrase;
    IV: BluesSoloPhrase;
    V: BluesSoloPhrase;
    Turnaround: BluesSoloPhrase;
  };
  // Rhythm guitar patterns
  fingerstyle: FingerstylePattern[];
  strum: StrumPattern[];
};


// --- DRUM KIT TYPES (ПЛАН 756) ---

/**
 * Describes the composition of a single drum kit.
 * Each array contains the names of the samples allowed for that part.
 */
export type DrumKit = {
    kick: InstrumentType[];
    snare: InstrumentType[];
    hihat: InstrumentType[];
    ride: InstrumentType[];
    crash: InstrumentType[];
    perc: InstrumentType[]; // General percussion (toms, blocks, etc.)
};

/**
 * The library of all drum kits, grouped by genre and mood.
 */
export type DrumKitLibrary = {
    [genre in Genre]?: {
        [mood in Mood]?: DrumKit;
    } & {
        // A special kit for intros, if needed
        intro?: DrumKit;
    };
};
