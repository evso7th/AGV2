
import type { FractalEvent, Mood, Genre, Technique } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import type { DrumSettings } from '@/types/music';

// === ТИПЫ ===
export type Branch = {
  id: string;
  events: FractalEvent[]; // Может быть как басовой, так и барабанной фразой
  weight: number;
  age: number;
  type: 'bass' | 'drums'; // Тип ветви
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

const MAX_BRANCHES = 12; // Увеличиваем лимит для баса и барабанов

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

  private createDrumBranch(id: string, pattern: Partial<Record<FractalEvent['type'], number[]>>, weight: number): Branch {
    const beat = 60 / this.config.tempo;
    const events: FractalEvent[] = [];

    Object.entries(pattern).forEach(([type, times]) => {
        times.forEach(time => {
            events.push({
                type: type as FractalEvent['type'],
                note: 36, // Placeholder, drum machine uses type
                duration: 0.1,
                time: time * beat,
                weight: 1.0,
                technique: 'hit',
                dynamics: 'mf',
                phrasing: 'staccato',
            });
        });
    });

    return { id, events, weight, age: 0, type: 'drums' };
  }

  private initialize() {
    const scale = getScaleForMood(this.config.mood);
    const root = scale[this.random.nextInt(scale.length)];

    const bassAxiom: FractalEvent[] = [
      { type: 'bass', note: root, duration: 1.5, time: 0, weight: 1.0, technique: 'pluck', dynamics: 'f', phrasing: 'legato' },
      { type: 'bass', note: root + 7, duration: 0.5, time: 1.5, weight: 0.8, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato' },
    ];
    
    // Начальные барабанные ветви (аксоны)
    const drumAxiom1 = this.createDrumBranch('drum_axiom_1', {
      'drum_kick': [0, 2],
      'drum_snare': [1, 3],
      'drum_hihat_closed': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
    }, 1.0);

    const drumAxiom2 = this.createDrumBranch('drum_axiom_2', {
      'drum_kick': [0, 1.5, 2],
      'drum_snare': [1, 3],
      'drum_hihat_closed': [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
    }, 0.5);

    this.branches = [
        { id: 'bass_axon_1', events: bassAxiom, weight: 1.0, age: 0, type: 'bass' },
        drumAxiom1,
        drumAxiom2,
    ];

    this.normalizeWeights();
  }

  public updateConfig(newConfig: Partial<EngineConfig>) {
    const needsReinitialization = newConfig.mood && newConfig.mood !== this.config.mood;
    this.config = { ...this.config, ...newConfig };
    this.lambda = newConfig.lambda ?? this.lambda;
    if (needsReinitialization) {
      this.initialize();
    }
  }
  
  private normalizeWeights() {
    const totalWeight = this.branches.reduce((sum, branch) => sum + branch.weight, 0);
    if (totalWeight > 0 && isFinite(totalWeight)) {
        this.branches.forEach(branch => {
            branch.weight = isFinite(branch.weight) ? branch.weight / totalWeight : (1 / this.branches.length);
        });
    } else {
        this.branches.forEach(branch => branch.weight = 1 / this.branches.length);
    }
  }

  private mutateDrumBranch(baseBranch: Branch): Branch {
    const beat = 60 / this.config.tempo;
    const newEvents = baseBranch.events.map(e => ({...e}));

    // Mutation: Add a ghost note
    if (this.random.next() < 0.4) {
      const snareEvents = newEvents.filter(e => e.type === 'drum_snare');
      if (snareEvents.length > 0) {
        const randomSnare = snareEvents[this.random.nextInt(snareEvents.length)];
        newEvents.push({
          ...randomSnare,
          time: randomSnare.time + beat / 2,
          weight: 0.3,
          technique: 'ghost',
          dynamics: 'p'
        });
      }
    }

    // Mutation: Change a hi-hat to an open-hat
    if (this.random.next() < 0.2) {
      const hatEvents = newEvents.filter(e => e.type === 'drum_hihat_closed');
      if (hatEvents.length > 0) {
        const hatToChange = hatEvents[this.random.nextInt(hatEvents.length)];
        hatToChange.type = 'drum_hihat_open';
        hatToChange.duration = 0.2;
      }
    }
    
    return {
      ...baseBranch,
      id: `drum_mut_${Date.now()}_${this.random.nextInt(1000)}`,
      events: newEvents,
      weight: baseBranch.weight * 0.5, // Start with lower weight
      age: 0,
    };
  }

  public evolve(barDuration: number): FractalEvent[] {
    if (!isFinite(barDuration) || barDuration <= 0) return [];

    const delta = this.getDeltaProfile()(this.time);
    const output: FractalEvent[] = [];

    // --- 1. Генерация партитуры из текущих ветвей ---
    const activeBranches = this.branches.filter(b => b.weight > 0.1);
    
    // Определяем ритмическую сетку этого такта
    const kickTimes = activeBranches.filter(b => b.type === 'drums').flatMap(b => b.events.filter(e => e.type === 'drum_kick').map(e => e.time));
    const snareTimes = activeBranches.filter(b => b.type === 'drums').flatMap(b => b.events.filter(e => e.type === 'drum_snare').map(e => e.time));

    activeBranches.forEach(branch => {
      branch.events.forEach(event => {
        output.push({
          ...event,
          time: safeTime(event.time),
          duration: safeDuration(event.duration),
          weight: branch.weight,
          dynamics: weightToDynamics(branch.weight),
        });
      });
    });

    // --- 2. Эволюция: обновление весов, рождение и смерть ---
    const nextBranches: Branch[] = [];
    this.branches.forEach(branch => {
      let resonanceSum = 0;
      this.branches.forEach(other => {
        if (other.id === branch.id) return;
        const k = MelancholicMinorK(branch.events[0], other.events[0], {
          mood: this.config.mood, delta, kickTimes, snareTimes,
          beatPhase: (this.time * this.config.tempo / 60) % 4,
          barDuration
        });
        resonanceSum += k * delta * other.weight;
      });
      
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      nextBranches.push({ ...branch, weight: safeTime(newWeight, 0.01), age: branch.age + 1 });
    });
    
    this.branches = nextBranches;
    
    // --- 3. Мутации и рождение новых ветвей ---
    const canMutate = this.branches.length < MAX_BRANCHES && this.epoch > 4;

    if (canMutate && this.random.next() < 0.2 * this.config.organic) {
        const drumBranches = this.branches.filter(b => b.type === 'drums');
        if (drumBranches.length > 0) {
            const strongestDrumBranch = drumBranches.sort((a,b) => b.weight - a.weight)[0];
            this.branches.push(this.mutateDrumBranch(strongestDrumBranch));
        }
    }

    // --- 4. Смерть старых и слабых ветвей ---
    this.branches = this.branches.filter(b => b.weight > 0.01 && b.age < 50);

    // --- 5. Нормализация и подготовка к следующему такту ---
    this.normalizeWeights();
    
    // Если все ветви вымерли, реинициализируем
    if(this.branches.length === 0){
        this.initialize();
    }

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
