
import type { EngineState, EngineConfig, ResonanceMatrix, Seed, EventID } from '@/types/fractal';
import type { Score } from '@/types/music';

export class FractalMusicEngine {
  private state: EngineState;
  private config: EngineConfig;
  private K: ResonanceMatrix;

  constructor(seed: Seed, availableMatricesRepo: Record<string, ResonanceMatrix>) {
    this.state = new Map(Object.entries(seed.initialState));
    this.config = seed.config;
    const matrix = availableMatricesRepo[seed.resonanceMatrixId];
    if (!matrix) {
      throw new Error(`Матрица резонанса ${seed.resonanceMatrixId} не найдена!`);
    }
    this.K = matrix;

    // Ensure initial state is also normalized
    this.normalizeState(this.state);
  }

  private generateImpulse(): Map<EventID, number> {
    // На данном этапе создаем простой импульс: "ударяем" по первой ветви в состоянии.
    const impulse: Map<EventID, number> = new Map();
    const firstEvent = this.state.keys().next().value;
    if (firstEvent) {
      impulse.set(firstEvent, 1.0);
    }
    return impulse;
  }

  private normalizeState(state: EngineState) {
      let sum = 0;
      for (const weight of state.values()) {
          sum += weight;
      }
      if (sum === 0) return; // Avoid division by zero
      for (const [event, weight] of state.entries()) {
          state.set(event, weight / sum);
      }
  }

  // Главный метод, реализующий формулу
  tick() {
    const nextState: EngineState = new Map();
    const impulse = this.generateImpulse();

    // 1. Применяем затухание (1-λ)w_t(j)
    for (const [event, weight] of this.state.entries()) {
      nextState.set(event, (1 - this.config.lambda) * weight);
    }

    // 2. Рассчитываем и добавляем новый резонанс Σ_i K_{ij} * δ_i
    // Мы итерируемся по всем возможным ветвям `j`, которые могут получить энергию.
    // На практике, чтобы не перебирать бесконечность, мы будем считать, что
    // резонанс могут получить только те ветви, которые уже есть в состоянии.
    for (const [event_j, current_weight_j] of nextState.entries()) {
      let resonanceSum = 0;
      // Суммируем влияние от всех "активных" импульсных ветвей `i`
      for (const [event_i, impulseValue] of impulse.entries()) {
        if (impulseValue > 0) {
          resonanceSum += this.K(event_i, event_j) * impulseValue;
        }
      }
      nextState.set(event_j, current_weight_j + resonanceSum);
    }
    
    // 3. Нормализация (Σw_i=1) и обновление состояния
    this.normalizeState(nextState);
    this.state = nextState;

    // Для отладки, как и договорились
    console.log(this.state);
  }

  // Метод для преобразования состояния w в партитуру для аудио-движка
  generateScore(): Score {
    // Пока возвращает пустую партитуру, как и запланировано
    return {};
  }
}
