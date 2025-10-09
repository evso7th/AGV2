// Уникальный ID музыкального события, например "piano_C4" или "drums_kick"
export type EventID = string;

// Состояние системы: веса всех возможных событий
export type EngineState = Map<EventID, number>;

// Конфигурация движка, управляемая пользователем
export type EngineConfig = {
  lambda: number;      // Коэффициент затухания (0-1)
  bpm: number;         // Влияет на частоту импульсов
  density: number;     // Влияет на количество и силу импульсов
  organic: number;     // Модификатор случайности в K и δ
};

// Функция резонанса, ядро стиля/настроения
export type ResonanceMatrix = (eventA: EventID, eventB: EventID) => number;

// Полный снимок состояния для сохранения и шаринга
export type Seed = {
  initialState: Record<EventID, number>; // Сериализуемая версия EngineState
  resonanceMatrixId: string;
  config: EngineConfig;
};
