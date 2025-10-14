
import type { FractalEvent, Mood, Genre, Technique } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood } from './music-theory';

export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
  type: 'bass' | 'drums';
};

interface EngineConfig {
  mood: Mood;
  genre: Genre;
  tempo: number;
  seed?: number;
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getParamsForTechnique(technique: Technique, mood: Mood): object {
  switch (technique) {
    case 'pluck':
      return { cutoff: 800, resonance: 0.3, distortion: 0.1, portamento: 0.01 };
    case 'ghost':
      return { cutoff: 250, resonance: 0.1, distortion: 0.0, portamento: 0.0 };
    case 'slap':
       return { cutoff: 1200, resonance: 0.5, distortion: 0.3, portamento: 0.0 };
    default: // Для техник не от баса или по умолчанию
      return { cutoff: 500, resonance: 0.2, distortion: 0.0, portamento: 0.0 };
  }
}

function seededRandom(seed: number) {
  let state = seed;
  const self = {
    next: () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    },
    nextInt: (max: number) => Math.floor(self.next() * max)
  };
  return self;
}

function weightToDynamics(weight: number): 'p' | 'mf' | 'f' {
  if (weight < 0.3) return 'p';
  if (weight < 0.7) return 'mf';
  return 'f';
}

function safeTime(value: number, fallback: number = 0): number {
  return isFinite(value) ? value : fallback;
}

// === УДАРНЫЙ АКСОН (duration в ДОЛЯХ ТАКТА!) ===
function createDrumAxiom(): FractalEvent[] {
  return [
    { type: 'drum_kick', note: 36, duration: 0.25, time: 0, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 1.0, weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' },
    { type: 'drum_kick', note: 36, duration: 0.25, time: 2.0, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 3.0, weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' },
    // Hi-hat closed — 8 раз за такт (восьмые = 0.5 доли)
    ...Array.from({ length: 8 }, (_, i) => ({
      type: 'drum_hihat_closed' as const,
      note: 42,
      duration: 0.5, // восьмая нота = 0.5 доли такта
      time: i * 0.5,
      weight: 0.8,
      technique: 'hit' as Technique,
      dynamics: 'p' as const,
      phrasing: 'staccato' as const
    }))
  ];
}

// === БАСОВЫЙ АКСОН (duration в ДОЛЯХ ТАКТА!) ===
function createBassAxiom(mood: Mood): FractalEvent[] {
  const scale = getScaleForMood(mood);
  const root = scale[0];
  const pluckParams = getParamsForTechnique('pluck', mood);
  return [
    { type: 'bass', note: root, duration: 1.5, time: 0, weight: 1.0, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato', params: pluckParams },
    { type: 'bass', note: root + 3, duration: 0.5, time: 1.5, weight: 1.0, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato', params: pluckParams },
    { type: 'bass', note: root + 2, duration: 1.5, time: 2.0, weight: 1.0, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato', params: pluckParams },
    { type: 'bass', note: root, duration: 0.5, time: 3.5, weight: 1.0, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato', params: pluckParams }
  ];
}

// === ТРАНСФОРМАЦИИ УДАРНЫХ (duration в ДОЛЯХ ТАКТА!) ===
function createTomFill(): FractalEvent[] {
  return [
    { type: 'drum_tom_low', note: 41, duration: 0.25, time: 3.0, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' },
    { type: 'drum_tom_mid', note: 45, duration: 0.25, time: 3.25, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' },
    { type: 'drum_tom_high', note: 50, duration: 0.25, time: 3.5, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 3.75, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' }
  ];
}

// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  private config: EngineConfig;
  private branches: Branch[] = [];
  private time: number = 0;
  private lambda: number;
  private epoch = 0;
  private random: { next: () => number; nextInt: (max: number) => number };

  constructor(config: EngineConfig) {
    if (!config || config.tempo <= 0 || !isFinite(config.tempo)) {
      console.warn('[FractalEngine] Invalid tempo, defaulting to 120');
      config = { ...config, tempo: 120 };
    }
    this.config = {
      ...config,
      tempo: Math.max(20, Math.min(300, config.tempo))
    };
    this.lambda = config.mood === 'melancholic' ? 0.25 : 0.15;
    this.random = seededRandom(config.seed ?? Date.now());
    this.initialize();
  }

  private initialize() {
    // БАСОВЫЙ АКСОН
    const bassAxiom = createBassAxiom(this.config.mood);
    this.branches.push({
      id: 'bass_axon',
      events: bassAxiom,
      weight: 0.9,
      age: 0,
      technique: 'pluck',
      type: 'bass'
    });

    // УДАРНЫЙ АКСОН
    const drumAxiom = createDrumAxiom();
    this.branches.push({
      id: 'drum_axon',
      events: drumAxiom,
      weight: 0.8,
      age: 0,
      technique: 'hit',
      type: 'drums'
    });
  }

  // === ГЕНЕРАЦИЯ СОБЫТИЙ НА 1 ТАКТ ===
  private generateOneBar(): FractalEvent[] {
    const output: FractalEvent[] = [];
    let currentTime = this.time;
    const beatDuration = 60 / this.config.tempo; // длительность доли в секундах

    // Обработка всех ветвей
    this.branches.forEach(branch => {
      branch.events.forEach(event => {
        // ПЕРЕВОД duration из долей такта в секунды
        const durationInSeconds = event.duration * beatDuration;
        const newEvent = {
          ...event,
          time: currentTime + event.time * beatDuration, // time тоже в долях → в секунды
          duration: durationInSeconds
        };

        output.push(newEvent);
      });
    });

    // DLA: новые ветви (каждые 4 такта) — с ВОСПРОИЗВОДИМЫМ random!
    if (this.epoch % 4 === 0 && this.random.next() < 0.4) {
      if (this.random.next() > 0.5 && this.branches.filter(b => b.type === 'bass').length < 3) {
        const base = this.branches.find(b => b.type === 'bass');
        if (base) {
          const ghostParams = getParamsForTechnique('ghost', this.config.mood);
          this.branches.push({
            id: `bass_ghost_${Date.now()}`,
            events: [{ ...base.events[1], duration: 0.2, time: 1.5, technique: 'ghost', params: ghostParams }],
            weight: 0.15,
            age: 0,
            technique: 'ghost',
            type: 'bass'
          });
        }
      } else if (this.branches.filter(b => b.type === 'drums').length < 3) {
        this.branches.push({
          id: `drum_fill_${Date.now()}`,
          events: createTomFill(),
          weight: 0.2,
          age: 0,
          technique: 'hit',
          type: 'drums'
        });
      }
    }

    return output;
  }

  // === ОСНОВНОЙ МЕТОД ===
  public evolve(): FractalEvent[] {
    if (!isFinite(this.time)) this.time = 0;
    const delta = this.getDeltaProfile()(this.time);
    const barDuration = 4 * (60 / this.config.tempo);
    if (!isFinite(barDuration)) return [];

    // Обновление весов
    this.branches = this.branches.map(branch => {
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id) return sum;
        const k = MelancholicMinorK(
          branch.events[0],
          other.events[0],
          { mood: this.config.mood, tempo: this.config.tempo, delta }
        );
        return sum + k * delta;
      }, 0);
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      return { ...branch, weight: isFinite(newWeight) ? newWeight : 0.01, age: branch.age + 1 };
    });

    // Нормализация
    const totalWeight = this.branches.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight > 0 && isFinite(totalWeight)) {
      this.branches.forEach(b => b.weight = isFinite(b.weight) ? b.weight / totalWeight : 0.01);
    }

    // Смерть слабых ветвей
    this.branches = this.branches.filter(b => b.weight > 0.05);

    // Генерация событий
    const events = this.generateOneBar();

    // Обновление времени
    this.time += barDuration;
    this.epoch++;
    return events;
  }

  private getDeltaProfile(): (t: number) => number {
    return (t: number) => {
      const safeT = safeTime(t);
      const phase = (safeT / 120) % 1;
      if (this.config.mood === 'melancholic') {
        if (phase < 0.4) return 0.3 + phase * 1.5;
        if (phase < 0.7) return 1.0;
        return 1.0 - (phase - 0.7) * 2.3;
      }
      return 0.5;
    };
  }
}
