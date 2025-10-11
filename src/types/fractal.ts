
import type { DrumSettings } from './music';

// Настроение, определяющее гармоническую и драматургическую окраску
export type Mood = 'melancholic' | 'epic' | 'dreamy' | 'dark';

// Жанр, влияющий на ритмическую структуру и выбор техник
export type Genre = 'trance' | 'ambient' | 'progressive';

// Техника исполнения, влияющая на тембр и артикуляцию
export type Technique = 'pluck' | 'slap' | 'ghost' | 'harmonic';

// Фразировка, управляющая связностью нот
export type Phrasing = 'legato' | 'staccato';

// Динамика (громкость) ноты
export type Dynamics = 'p' | 'mf' | 'f';

// Единое музыкальное событие, базовый "квант" системы
export type FractalEvent = {
  type: 'bass' | 'lead' | 'pad' | 'arp' | `drum_${string}`; // Тип инструмента или партии
  note: number;          // MIDI-нота
  duration: number;      // Длительность в долях такта
  time: number;          // Позиция внутри такта (от 0 до 4)
  technique: Technique;
  dynamics: Dynamics;
  phrasing: Phrasing;
  weight: number;        // "Жизненная сила" события
};

// "Ветвь" фрактального дерева, представляющая музыкальную фразу или мотив
export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
};

// Конфигурация движка, управляемая пользователем
export type EngineConfig = {
  lambda: number;      // Коэффициент затухания (0-1)
  bpm: number;         // Влияет на частоту импульсов
  density: number;     // Влияет на количество и силу импульсов
  organic: number;     // Модификатор случайности в K и δ
  drumSettings: DrumSettings; // Настройки ударных
  mood: Mood;
  genre: Genre;
  seed?: number;
};

// Состояние системы: веса всех возможных событий
export type EngineState = Map<EventID, number>;

// Уникальный ID музыкального события, например "piano_C4" или "drums_kick"
export type EventID = string;

// Функция резонанса, ядро стиля/настроения
export type ResonanceMatrix = (eventA: EventID, eventB: EventID) => number;

// Полный снимок состояния для сохранения и шаринга
export type Seed = {
  initialState: Record<EventID, number>; // Сериализуемая версия EngineState
  resonanceMatrixId: string;
  config: EngineConfig;
};
