
/**
 * Настроение — управляет ладом, динамикой, техникой
 */
export type Mood = 
  | 'epic' | 'joyful' | 'enthusiastic' // Позитивные (LIGHT)
  | 'melancholic' | 'dark' | 'anxious' | 'gloomy'    // Негативные (DARK)
  | 'dreamy' | 'contemplative' | 'calm';     // Нейтральные (NEUTRAL)

/**
 * Common Mood — мета-категории для векторного поиска
 */
export type CommonMood = 'dark' | 'neutral' | 'light';

/**
 * Жанр — управляет формой и плотностью
 */
export type Genre = 'trance' | 'ambient' | 'progressive' | 'rock' | 'house' | 'rnb' | 'ballad' | 'reggae' | 'blues' | 'celtic';

/**
 * Техника игры
 */
export type Technique = 
  | 'pluck' | 'ghost' | 'slap' | 'harmonic' | 'fill' | 'swell' | 'riff' 
  | 'long_notes' | 'boogie' | 'walking' | 'drone' | 'hit' | 'pick' 
  | 'harm' | 'slide' | 'arpeggio' | 'portamento' | 'glissando' | 'glide' 
  | 'pulse' | 'syncopated' | 'bend' | 'vibrato';

export type Dynamics = 'p' | 'mf' | 'f';
export type Phrasing = 'legato' | 'staccato' | 'detached';

/**
 * Векторные координаты в Гиперкубе (0.0 - 1.0)
 */
export interface AxiomVector {
    t: number; // Tension (хроматизм, диссонанс)
    b: number; // Brightness (регистр, мажорность)
    e: number; // Entropy (ритмическая сложность)
    h: number; // Harmonic Stability (тяготение к тонике)
}

export interface FractalEvent {
  type: string | string[];
  note: number;
  duration: number;
  time: number;
  weight: number;
  technique: Technique;
  dynamics: Dynamics;
  phrasing: Phrasing;
  params?: any;
  chordName?: string;
}

export type InstrumentHints = {
    bass?: string;
    melody?: string;
    accompaniment?: string;
    harmony?: string;
    pianoAccompaniment?: string;
    drums?: string;
    summonProgress?: Partial<Record<string, number>>;
};

export type GhostChord = {
  rootNote: number;
  chordType: 'major' | 'minor' | 'diminished' | 'dominant';
  bar: number;
  durationBars: number;
  inversion?: 0 | 1 | 2;
};

export type SuiteDNA = {
  harmonyTrack: GhostChord[];
  baseTempo: number;
  rhythmicFeel: string;
  bassStyle: string;
  drumStyle: string;
  soloPlanMap: Map<string, string>;
  tensionMap: number[];
  seedLickId?: string;
  itinerary?: string[];
  dynasty?: string;
  partLickMap?: Map<string, string>;
};

export type BluesSoloPhrase = {
  t: number;
  d: number;
  deg: string;
  tech?: string;
}[];
