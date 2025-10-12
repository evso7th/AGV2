
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

function safeTime(value: number, fallback: number = 0): number {
  return isFinite(value) ? value : fallback;
}

function safeDuration(duration: number): number {
  return isFinite(duration) && duration > 0 ? Math.max(0.01, duration) : 0.1;
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
    this.config = {
      ...config,
      tempo: Math.max(20, Math.min(300, config.tempo || 75))
    };
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

    private generateOneBarDrums(startTime: number, delta: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const beat = 60 / this.config.tempo;
        const { volume, kickVolume, enabled } = this.config.drumSettings;
        const { density } = this.config;
    
        if (!isFinite(beat) || !isFinite(startTime) || !enabled) {
            return [];
        }
        
        const addEvent = (type: FractalEvent['type'], note: number, offset: number, weight: number, dynamics: 'p'|'mf'|'f', duration: number = 0.1) => {
            const time = safeTime(startTime + offset);
            if (isFinite(time)) {
                events.push({
                    type, note,
                    duration: safeDuration(duration),
                    time,
                    weight: weight * volume, // Use the overall drum volume
                    technique: 'hit', dynamics, phrasing: 'staccato'
                });
            }
        };
    
        // 1. Kick Drum: всегда на 1, на 3 - с вероятностью, зависящей от плотности.
        addEvent('drum_kick', 36, 0, kickVolume, 'f');
        if (this.random.next() < (density * 0.8 + 0.2)) {
            addEvent('drum_kick', 36, 2 * beat, kickVolume * 0.8, 'f');
        }
    
        // 2. Snare Drum: всегда на 2 и 4, но с вариативной громкостью.
        addEvent('drum_snare', 38, 1 * beat, 0.8 + this.random.next() * 0.2, 'mf');
        addEvent('drum_snare', 38, 3 * beat, 0.8 + this.random.next() * 0.2, 'mf');
    
        // 3. Hi-Hats: сложность зависит от плотности
        if (density < 0.4) { // Четверти
            for (let i = 0; i < 4; i++) {
                if (this.random.next() < 0.9) {
                    addEvent('drum_hat', 42, i * beat, 0.4 + this.random.next() * 0.2, 'p', 0.05);
                }
            }
        } else { // Восьмые с пропусками
            for (let i = 0; i < 8; i++) {
                // Пропускаем на сильных долях с некоторой вероятностью
                if (i % 2 === 0 && this.random.next() < 0.1) continue;
                addEvent('drum_hat', 42, i * beat / 2, (i % 2 === 0 ? 0.6 : 0.3) + this.random.next() * 0.2, 'p', 0.05);
            }
            // Открытый хэт на слабой доле в конце такта при высокой плотности
            if (density > 0.7 && this.random.next() < 0.4) {
                 addEvent('drum_open_hat', 44, 3.5 * beat, 0.7, 'mf', 0.2);
            }
        }
    
        // 4. Cymbals & Fills: зависят от энергии (delta) и номера такта (epoch)
        const isClimaxBar = this.epoch % 8 === 7;
        const isSubClimaxBar = this.epoch % 4 === 3;
    
        // Crash в кульминации
        if (isClimaxBar && delta > 0.8) {
            addEvent('drum_crash', 49, 0, 0.9, 'f', 0.4);
        }
        
        // Ride для поддержания энергии при высокой плотности
        if (density > 0.65) {
             for (let i = 0; i < 4; i++) {
                addEvent('drum_ride', 51, i * beat, 0.5, 'p', 0.1);
            }
        }
    
        // Сбивка (Fill) в конце 4-го такта, если плотность высокая
        if (isSubClimaxBar && this.random.next() < density) {
            const fillStart = 3 * beat;
            const fillPatterns = [
                () => { addEvent('drum_tom_mid', 45, fillStart + beat / 2, 0.8, 'mf'); addEvent('drum_tom_low', 41, fillStart + beat * 3/4, 0.85, 'mf'); },
                () => { addEvent('drum_snare', 38, fillStart, 0.7, 'p'); addEvent('drum_snare', 38, fillStart + beat/4, 0.7, 'p'); addEvent('drum_tom_high', 50, fillStart + beat/2, 0.9, 'mf'); },
            ];
            fillPatterns[this.random.nextInt(fillPatterns.length)]();
        }
    
        return events;
    }
  
  private normalizeWeights() {
    const totalWeight = this.branches.reduce((sum, branch) => sum + branch.weight, 0);
    if (totalWeight > 0 && isFinite(totalWeight)) {
        this.branches.forEach(branch => {
            branch.weight = isFinite(branch.weight) ? branch.weight / totalWeight : 0.01;
        });
    } else {
        // Fallback in case totalWeight is 0 or NaN
        this.branches.forEach(branch => branch.weight = 1 / this.branches.length);
    }
  }

  // === ОСНОВНОЙ МЕТОД ===
  public evolve(barDuration: number): FractalEvent[] {
    if (!isFinite(barDuration) || barDuration <= 0) {
        return [];
    }
    const output: FractalEvent[] = [];
    
    // 2. Генерация баса и барабанов (1 такт)
    const delta = this.getDeltaProfile()(this.time);
    
    // Генерация ударных (1 такт — обязательно!)
    if (this.config.drumSettings.enabled && this.config.drumSettings.pattern === 'composer') {
        const drumEvents = this.generateOneBarDrums(0, delta);
        output.push(...drumEvents);
    }

    const kickTimes = output.filter(e => e.type === 'drum_kick').map(e => e.time);
    const snareTimes = output.filter(e => e.type === 'drum_snare').map(e => e.time);
    
    this.branches.forEach(branch => {
      branch.events.forEach(event => {
        output.push({
          ...event,
          time: safeTime(event.time),
          duration: safeDuration(event.duration),
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
          beatPhase: (this.time * this.config.tempo / 60) % 4,
          barDuration: barDuration,
        });
        return sum + k * delta;
      }, 0);
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      nextBranches.push({ ...branch, weight: safeTime(newWeight, 0.01), age: branch.age + 1 });
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
