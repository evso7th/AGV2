
import type { FractalEvent, Mood, Genre } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';

// === ТИПЫ ===
export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: 'pluck' | 'ghost' | 'slap';
};

// === КОНФИГУРАЦИЯ ===
interface EngineConfig {
  mood: Mood;      // 'melancholic', 'epic', 'dreamy', 'dark'
  genre: Genre;    // 'trance', 'ambient', 'progressive'
  tempo: number;   // BPM
  seed?: number;
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function seededRandom(seed: number) {
  let state = seed;
  const random = {
    next: () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    },
    nextInt: (max: number) => Math.floor(random.next() * max)
  };
  return random;
}

function getScaleForMood(mood: Mood): number[] {
  const E2 = 40; // E2 — реальный бас
  if (mood === 'melancholic') return [E2, E2+2, E2+3, E2+5, E2+7, E2+9, E2+10]; // E Dorian
  return [E2, E2+2, E2+4, E2+5, E2+7, E2+9, E2+11]; // E Major
}

function weightToDynamics(weight: number): 'p' | 'mf' | 'f' {
  if (weight < 0.3) return 'p';
  if (weight < 0.7) return 'mf';
  return 'f';
}

// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  private config: EngineConfig;
  private branches: Branch[] = [];
  private time: number = 0;
  private lambda: number;
  private epoch = 0;
  private random;

  constructor(config: EngineConfig) {
    this.config = config;
    this.lambda = config.mood === 'melancholic' ? 0.25 : 0.15;
    const seed = this.config.seed ?? Date.now();
    this.random = seededRandom(seed);
    this.initialize();
  }

  private initialize() {
    const scale = getScaleForMood(this.config.mood);
    const root = scale[this.random.nextInt(scale.length)];

    const axiomEvents: FractalEvent[] = [
      { type: 'bass', note: root, duration: 1.5, time: 0, weight: 1.0, technique: 'pluck', dynamics: 'f', phrasing: 'legato' },
      { type: 'bass', note: root + 3, duration: 0.5, time: 1.5, weight: 0.8, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato' },
      { type: 'bass', note: root + 2, duration: 1.5, time: 2.0, weight: 0.9, technique: 'pluck', dynamics: 'f', phrasing: 'legato' },
      { type: 'bass', note: root, duration: 0.5, time: 3.5, weight: 1.0, technique: 'pluck', dynamics: 'f', phrasing: 'staccato' }
    ];

    this.branches = [{
      id: 'axon',
      events: axiomEvents,
      weight: 1.0,
      age: 0,
      technique: 'pluck'
    }];
  }

    public updateConfig(newConfig: Partial<EngineConfig>) {
        this.config = { ...this.config, ...newConfig };
        this.lambda = this.config.mood === 'melancholic' ? 0.25 : 0.15;
    }


  // === ГЕНЕРАЦИЯ УДАРНЫХ (4/4 ПАТТЕРН) ===
  private generateDrumEvents(barStartTime: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const beat = barDuration / 4;

    // Kick on 1 and 3
    events.push({
      type: 'drum_kick', note: 36, duration: 0.1, time: barStartTime,
      weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato'
    });
    events.push({
      type: 'drum_kick', note: 36, duration: 0.1, time: barStartTime + 2 * beat,
      weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato'
    });

    // Snare on 2 and 4
    events.push({
      type: 'drum_snare', note: 38, duration: 0.1, time: barStartTime + 1 * beat,
      weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
    });
    events.push({
      type: 'drum_snare', note: 38, duration: 0.1, time: barStartTime + 3 * beat,
      weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
    });

    return events;
  }

  // === ОСНОВНОЙ МЕТОД ===
  public evolve(barDuration: number): FractalEvent[] {
    const delta = this.getDeltaProfile()(this.time);
    const output: FractalEvent[] = [];

    // 1. Обновление весов по формуле
    this.branches = this.branches.map(branch => {
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], {
          mood: this.config.mood,
          delta,
          kickTimes: [],
          snareTimes: [],
          beatPhase: (this.time * this.config.tempo / 60) % 4
        });
        return sum + k * delta;
      }, 0);
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      return { ...branch, weight: newWeight, age: branch.age + 1 };
    });

    // 2. Смерть слабых ветвей
    this.branches = this.branches.filter(b => b.weight > 0.05);

    // 3. DLA: иногда добавляем ghost notes
    if (this.random.next() < 0.4 && this.epoch > 2) {
      const base = this.branches[0];
      if (base) {
        this.branches.push({
          id: `ghost_${Date.now()}`,
          events: [{ ...base.events[1], duration: 0.2, time: base.events[0].duration }],
          weight: 0.15,
          age: 0,
          technique: 'ghost'
        });
      }
    }

    // 4. Генерация басовых событий
    let barCurrentTime = 0;
    this.branches.forEach(branch => {
      branch.events.forEach(event => {
        output.push({
          ...event,
          time: barCurrentTime, // Use bar-local time
          weight: branch.weight,
          technique: branch.technique,
          dynamics: weightToDynamics(branch.weight),
          phrasing: branch.weight > 0.7 ? 'legato' : 'staccato'
        });
        barCurrentTime += event.duration * (60 / this.config.tempo);
      });
    });

    // 5. Добавляем ударные (1 такт за вызов)
    const drumEvents = this.generateDrumEvents(0, barDuration);
    output.push(...drumEvents.map(e => ({...e, time: e.time / barDuration * 4}))); // Normalize time

    this.time += barDuration;
    this.epoch++;
    
    console.log('[NFM Evolve] Generated Events:', output);
    return output;
  }

  private getDeltaProfile(): (t: number) => number {
    return (t: number) => {
      const phase = (t / 120) % 1;
      if (this.config.mood === 'melancholic') {
        if (phase < 0.4) return 0.3 + phase * 1.5;
        if (phase < 0.7) return 1.0;
        return 1.0 - (phase - 0.7) * 2.3;
      }
      return 0.5;
    };
  }
}
