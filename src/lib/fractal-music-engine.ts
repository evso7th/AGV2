
import type { FractalEvent, Mood, Genre, Technique } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import type { DrumSettings } from '@/types/music';

// === ТИПЫ ===
export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: 'pluck' | 'ghost' | 'slap';
};

// === КОНФИГУРАЦИЯ ===
export interface EngineConfig {
  mood: Mood;
  genre: Genre;
  tempo: number;
  seed?: number;
  drumSettings: DrumSettings;
  density: number;
  lambda: number;
  organic: number;
}


const MAX_BRANCHES = 10;

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
    this.lambda = config.lambda;
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
        this.lambda = newConfig.lambda ?? this.lambda;
    }


  private generateOneBarDrums(startTime: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const beat = 60 / this.config.tempo;
    const { volume } = this.config.drumSettings;

    const commonProps = (type: FractalEvent['type'], note: number) => ({
      type,
      note,
      duration: 0.1,
      technique: 'hit' as Technique,
      phrasing: 'staccato' as const,
    });
    
    // Kick на 1 и 3
    events.push({ ...commonProps('drum_kick', 36), time: startTime, weight: 1.0 * volume, dynamics: 'f' });
    events.push({ ...commonProps('drum_kick', 36), time: startTime + 2 * beat, weight: 0.8 * volume, dynamics: 'f' });

    // Snare на 2 и 4
    events.push({ ...commonProps('drum_snare', 38), time: startTime + 1 * beat, weight: 0.9 * volume, dynamics: 'mf' });
    events.push({ ...commonProps('drum_snare', 38), time: startTime + 3 * beat, weight: 0.9 * volume, dynamics: 'mf' });

    // Hi-hat closed — 8 раз за такт (восьмые)
    for (let i = 0; i < 8; i++) {
        events.push({ 
            ...commonProps('drum_hat', 42),
            time: startTime + i * beat / 2,
            weight: (0.3 + this.random.next() * 0.3) * volume,
            dynamics: 'p'
        });
    }

    // Эволюция: Добавляем Ride, Crash и сбивки в кульминации
    const isClimax = this.epoch % 8 === 7;
    if (isClimax) {
        // Crash в начале такта
        events.push({ ...commonProps('drum_crash', 49), time: startTime, weight: 1.0 * volume, dynamics: 'f' });
        // Ride вместо Hi-hat
        for (let i = 0; i < 4; i++) {
            events.push({ ...commonProps('drum_ride', 51), time: startTime + i * beat, weight: 0.7 * volume, dynamics: 'mf'});
        }
        // Сбивка в конце такта
        const fillStart = startTime + 3 * beat;
        events.push({ ...commonProps('drum_tom_low', 41), time: fillStart, weight: 0.9 * volume, dynamics: 'mf'});
        events.push({ ...commonProps('drum_tom_mid', 45), time: fillStart + beat/4, weight: 0.9*volume, dynamics: 'mf'});
        events.push({ ...commonProps('drum_tom_high', 50), time: fillStart + beat/2, weight: 0.9*volume, dynamics: 'mf'});
        events.push({ ...commonProps('drum_snare', 38), time: fillStart + (3 * beat/4), weight: 1.0*volume, dynamics: 'f'});
    }

    return events;
}
  
  private normalizeWeights() {
    const totalWeight = this.branches.reduce((sum, branch) => sum + branch.weight, 0);
    if (totalWeight > 0) {
        this.branches.forEach(branch => {
            branch.weight /= totalWeight;
        });
    }
  }

  // === ОСНОВНОЙ МЕТОД ===
  public evolve(barDuration: number): FractalEvent[] {
    const output: FractalEvent[] = [];
    
    // 1. Генерация ударных (1 такт — обязательно!)
    if (this.config.drumSettings.enabled && this.config.drumSettings.pattern === 'composer') {
        const drumEvents = this.generateOneBarDrums(this.time);
        output.push(...drumEvents);
    }
    
    // 2. Генерация баса (1 такт)
    const delta = this.getDeltaProfile()(this.time);
    const kickTimes = output.filter(e => e.type === 'drum_kick').map(e => e.time - this.time);
    const snareTimes = output.filter(e => e.type === 'drum_snare').map(e => e.time - this.time);
    
    this.branches.forEach(branch => {
      branch.events.forEach(event => {
        const eventStartTime = this.time + event.time;
        output.push({
          ...event,
          time: eventStartTime,
          weight: branch.weight,
          technique: branch.technique,
          dynamics: weightToDynamics(branch.weight),
          phrasing: branch.weight > 0.7 ? 'legato' : 'staccato'
        });
      });
    });

    // 3. Эволюция басовых ветвей для СЛЕДУЮЩЕГО такта
    const nextBranches: Branch[] = [];
    this.branches.forEach(branch => {
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], {
          mood: this.config.mood, delta, kickTimes, snareTimes,
          beatPhase: (this.time * this.config.tempo / 60) % 4, barDuration
        });
        return sum + k * delta;
      }, 0);
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      nextBranches.push({ ...branch, weight: newWeight, age: branch.age + 1 });
    });
    
    this.branches = nextBranches;
    this.normalizeWeights();
    this.branches = this.branches.filter(b => b.weight > 0.05);

    if (this.random.next() < 0.3 && this.branches.length < MAX_BRANCHES && this.epoch > 2) {
      const base = this.branches[0];
      if (base) {
        this.branches.push({
          id: `ghost_${Date.now()}`,
          events: [{ ...base.events[this.random.nextInt(base.events.length)], duration: 0.2 }],
          weight: 0.15, age: 0, technique: 'ghost'
        });
      }
    }
    
    // 4. Продвигаем время на 1 такт
    this.time += barDuration;
    this.epoch++;
    
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
