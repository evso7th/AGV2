
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams } from '@/types/fractal';
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
  density: number; // Added density
  lambda: number; // Added lambda
  organic: number; // Added organic
  drumSettings: any; // Added drumSettings
  seed?: number;
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getParamsForTechnique(technique: Technique, mood: Mood): BassSynthParams {
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
function createDrumAxiom(mood: Mood): FractalEvent[] {
  const hitParams = getParamsForTechnique('hit', mood);
  return [
    { type: 'drum_kick', note: 36, duration: 0.25, time: 0, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 1.0, weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_kick', note: 36, duration: 0.25, time: 2.0, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 3.0, weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    // Hi-hat closed — 8 раз за такт (восьмые = 0.5 доли)
    ...Array.from({ length: 8 }, (_, i) => ({
      type: 'drum_hihat_closed' as const,
      note: 42,
      duration: 0.5, // восьмая нота = 0.5 доли такта
      time: i * 0.5,
      weight: 0.8,
      technique: 'hit' as Technique,
      dynamics: 'p' as const,
      phrasing: 'staccato' as const,
      params: hitParams
    }))
  ];
}

// === БАСОВЫЙ АКСОН (duration в ДОЛЯХ ТАКТА!) ===
function createBassAxiom(mood: Mood, random: { nextInt: (max: number) => number }): FractalEvent[] {
  const scale = getScaleForMood(mood);
  const pluckParams = getParamsForTechnique('pluck', mood);
  
  const createRandomNote = (time: number, duration: number): FractalEvent => {
    const note = scale[random.nextInt(scale.length)];
    return { 
        type: 'bass', 
        note: note, 
        duration, 
        time, 
        weight: 1.0, 
        technique: 'pluck', 
        dynamics: 'mf', 
        phrasing: 'staccato', 
        params: pluckParams 
    };
  };
  
  return [
    createRandomNote(0, 1.5),
    createRandomNote(1.5, 0.5),
    createRandomNote(2.0, 1.5),
    createRandomNote(3.5, 0.5)
  ];
}

// === ТРАНСФОРМАЦИИ УДАРНЫХ (duration в ДОЛЯХ ТАКТА!) ===
function createTomFill(mood: Mood): FractalEvent[] {
  const hitParams = getParamsForTechnique('hit', mood);
  return [
    { type: 'drum_tom_low', note: 41, duration: 0.25, time: 3.0, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_tom_mid', note: 45, duration: 0.25, time: 3.25, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_tom_high', note: 50, duration: 0.25, time: 3.5, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 3.75, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams }
  ];
}

// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig; // Made public
  private branches: Branch[] = [];
  private time: number = 0;
  private lambda: number;
  private epoch = 0;
  private random: { next: () => number; nextInt: (max: number) => number };

  constructor(config: EngineConfig) {
    if (!config || config.tempo <= 0 || !isFinite(config.tempo)) {
      console.warn('[FractalEngine] Invalid config, using defaults.');
      config = { 
          mood: 'melancholic', 
          genre: 'ambient', 
          tempo: 120, 
          density: 0.5,
          lambda: 0.5,
          organic: 0.5,
          drumSettings: { enabled: true }
      };
    }
    this.config = {
      ...config,
      tempo: Math.max(20, Math.min(300, config.tempo))
    };
    this.lambda = config.lambda ?? 0.5;
    this.random = seededRandom(config.seed ?? Date.now());
    this.initialize();
  }

  public get tempo(): number {
    return this.config.tempo;
  }
  
  public updateConfig(newConfig: Partial<EngineConfig>) {
      this.config = { ...this.config, ...newConfig };
      if (newConfig.lambda) this.lambda = newConfig.lambda;
  }

  private initialize() {
    // БАСОВЫЙ АКСОН
    const bassAxiom = createBassAxiom(this.config.mood, this.random);
    this.branches.push({
      id: 'bass_axon',
      events: bassAxiom,
      weight: 0.9,
      age: 0,
      technique: 'pluck',
      type: 'bass'
    });

    // УДАРНЫЙ АКСОН
    if (this.config.drumSettings.enabled) {
        const drumAxiom = createDrumAxiom(this.config.mood);
        this.branches.push({
          id: 'drum_axon',
          events: drumAxiom,
          weight: 0.8,
          age: 0,
          technique: 'hit',
          type: 'drums'
        });
    }
  }
  
  private selectBranchForMutation(): Branch | null {
    const totalWeight = this.branches.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight === 0) return null;
    let random = this.random.next() * totalWeight;
    for (const branch of this.branches) {
      random -= branch.weight;
      if (random <= 0) return branch;
    }
    return null;
  }

  private mutateBranch(parent: Branch): Branch | null {
    const mutationType = this.random.nextInt(4);
    const newEvents: FractalEvent[] = JSON.parse(JSON.stringify(parent.events));
    let newTechnique: Technique = parent.technique;

    switch(mutationType) {
        case 0: // Ghost Note
             if (parent.type !== 'bass') return null;
             const eventToGhost = newEvents[this.random.nextInt(newEvents.length)];
             eventToGhost.technique = 'ghost';
             eventToGhost.params = getParamsForTechnique('ghost', this.config.mood);
             eventToGhost.duration *= 0.5;
             newTechnique = 'ghost';
             break;
        case 1: // Rhythmic shift
             newEvents.forEach(e => e.time = (e.time + 0.125) % 4);
             break;
        case 2: // Transpose
             if (parent.type !== 'bass') return null;
             const scale = getScaleForMood(this.config.mood);
             const shift = this.random.next() > 0.5 ? 2 : -2;
             newEvents.forEach(e => {
                 const currentIndex = scale.indexOf(e.note);
                 if (currentIndex !== -1) {
                     e.note = scale[(currentIndex + shift + scale.length) % scale.length];
                 }
             });
             break;
        case 3: // Drum Fill (if parent is drums)
             if (parent.type !== 'drums') return null;
             return { id: `drum_fill_${this.epoch}`, events: createTomFill(this.config.mood), weight: 0.2, age: 0, technique: 'hit', type: 'drums' };
    }
    
    return { id: `${parent.type}_mut_${this.epoch}`, events: newEvents, weight: parent.weight * 0.5, age: 0, technique: newTechnique, type: parent.type };
  }

  private generateOneBar(): FractalEvent[] {
    const output: FractalEvent[] = [];
    
    this.branches.forEach(branch => {
      branch.events.forEach(originalEvent => {
        const newEvent: FractalEvent = { ...originalEvent };
        newEvent.dynamics = weightToDynamics(branch.weight);
        newEvent.phrasing = branch.weight > 0.7 ? 'legato' : 'staccato';
        newEvent.weight = branch.weight; 
        newEvent.params = getParamsForTechnique(newEvent.technique, this.config.mood);
        output.push(newEvent);
      });
    });

    // DLA: новые ветви
    if (this.epoch % 2 === 1 && this.random.next() < this.config.density && this.branches.length < 8) {
        const parentBranch = this.selectBranchForMutation();
        if (parentBranch) {
            const newBranch = this.mutateBranch(parentBranch);
            if (newBranch) {
                this.branches.push(newBranch);
            }
        }
    }
    
    return output;
  }

  public evolve(barDuration: number): FractalEvent[] {
    const delta = this.getDeltaProfile()(this.time);
    if (!isFinite(barDuration)) return [];

    // Обновление весов
    this.branches = this.branches.map(branch => {
      let resonanceSum = 0;
      for (const other of this.branches) {
        if (other.id === branch.id) continue;
        for (const eventA of branch.events) {
          for (const eventB of other.events) {
            const k = MelancholicMinorK(
              eventA,
              eventB,
              { mood: this.config.mood, tempo: this.config.tempo, delta }
            );
            // Увеличиваем влияние резонанса, чтобы изменения были заметнее
            resonanceSum += k * delta * 2.0; 
          }
        }
      }
      
      const averageResonance = resonanceSum / (branch.events.length * (this.branches.length -1) || 1);
      const newWeight = (1 - this.lambda) * branch.weight + averageResonance;
      return { ...branch, weight: isFinite(newWeight) ? Math.max(0, newWeight) : 0.01, age: branch.age + 1 };
    });

    // Нормализация
    const totalWeight = this.branches.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight > 0 && isFinite(totalWeight)) {
      this.branches.forEach(b => b.weight = isFinite(b.weight) ? b.weight / totalWeight : 0.01);
    } else {
      // Если все веса умерли, реинициализируем, чтобы избежать тишины
      this.initialize();
    }

    // Смерть слабых и старых ветвей
    this.branches = this.branches.filter(b => b.weight > 0.02 && b.age < 64);
    if (this.branches.length === 0) {
        this.initialize(); // Экстренная реинициализация
    }


    // Генерация событий
    const events = this.generateOneBar();

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
