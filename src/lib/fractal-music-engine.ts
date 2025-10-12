
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


  // === ГЕНЕРАЦИЯ УДАРНЫХ (4/4 ПАТТЕРН) ===
  private generateDrumEvents(barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const beat = barDuration / 4;
    const { pattern, volume } = this.config.drumSettings;

    if (pattern === 'none') return [];

    const isClimax = this.epoch % 8 === 7;

    // Common properties for drum events
    const commonProps = {
      duration: 0.1,
      technique: 'hit' as Technique,
      phrasing: 'staccato' as const,
    };
    
    // Kick on 1 and 3
    events.push({
      ...commonProps,
      type: 'drum_kick',
      note: 36,
      time: 0,
      weight: 1.0 * volume,
      dynamics: 'f',
    });
    events.push({
      ...commonProps,
      type: 'drum_kick',
      note: 36,
      time: 2 * beat,
      weight: 0.8 * volume,
      dynamics: 'f',
    });

    // Snare on 2 and 4
    events.push({
      ...commonProps,
      type: 'drum_snare',
      note: 38,
      time: 1 * beat,
      weight: 0.9 * volume,
      dynamics: 'mf',
    });
    events.push({
      ...commonProps,
      type: 'drum_snare',
      note: 38,
      time: 3 * beat,
      weight: 0.9 * volume,
      dynamics: 'mf',
    });
    
    // Hi-hats
    for(let i = 0; i < 8; i++) {
        if(this.random.next() < this.config.density * 1.5) { // Denser hats
            events.push({
              ...commonProps,
              type: 'drum_hat',
              note: 42,
              time: i * (beat / 2),
              weight: (0.3 + this.random.next() * 0.3) * volume,
              dynamics: 'p'
            });
        }
    }
    
    if (isClimax) {
         events.push({ ...commonProps, type: 'drum_crash', note: 49, time: 0, weight: 1.0 * volume, dynamics: 'f' });
         for (let i = 0; i < 4; i++) {
             events.push({ ...commonProps, type: 'drum_ride', note: 51, time: i * beat, weight: 0.7 * volume, dynamics: 'mf'});
         }
         // Fill at the end of the bar
         const fillStart = 3 * beat;
         events.push({ ...commonProps, type: 'drum_tom_low', note: 41, time: fillStart, weight: 0.9 * volume, dynamics: 'mf'});
         events.push({ ...commonProps, type: 'drum_tom_mid', note: 45, time: fillStart + beat/4, weight: 0.9*volume, dynamics: 'mf'});
         events.push({ ...commonProps, type: 'drum_tom_high', note: 50, time: fillStart + beat/2, weight: 0.9*volume, dynamics: 'mf'});
         events.push({ ...commonProps, type: 'drum_snare', note: 38, time: fillStart + (3 * beat/4), weight: 1.0*volume, dynamics: 'f'});
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
    const delta = this.getDeltaProfile()(this.time);
    const output: FractalEvent[] = [];
    
    // 1. Generate drum events for this bar first to create rhythmic context
    const drumEvents = (this.config.drumSettings.enabled && this.config.drumSettings.pattern === 'composer')
        ? this.generateDrumEvents(barDuration)
        : [];
    
    const kickTimes = drumEvents.filter(e => e.type === 'drum_kick').map(e => e.time);
    const snareTimes = drumEvents.filter(e => e.type === 'drum_snare').map(e => e.time);

    // 2. Update weights of existing bass branches based on new context
    this.branches = this.branches.map(branch => {
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], {
          mood: this.config.mood,
          delta,
          kickTimes,
          snareTimes,
          beatPhase: (this.time * this.config.tempo / 60) % 4,
          barDuration,
        });
        return sum + k * delta;
      }, 0);
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      return { ...branch, weight: newWeight, age: branch.age + 1 };
    });
    
    // 3. Normalize weights
    this.normalizeWeights();

    // 4. Prune weak branches
    this.branches = this.branches.filter(b => b.weight > 0.05);

    // 5. Create new branches (DLA-like)
    if (this.random.next() < 0.3 && this.branches.length < MAX_BRANCHES && this.epoch > 2) {
      const base = this.branches[0];
      if (base) {
        this.branches.push({
          id: `ghost_${Date.now()}`,
          events: [{ ...base.events[this.random.nextInt(base.events.length)], duration: 0.2 }],
          weight: 0.15,
          age: 0,
          technique: 'ghost'
        });
      }
    }
    
    // 6. Generate final bass events for this bar
    let localTimeOffset = 0;
    this.branches.forEach(branch => {
      branch.events.forEach(event => {
        const eventStartTime = this.time + localTimeOffset;
        output.push({
          ...event,
          time: eventStartTime,
          weight: branch.weight,
          technique: branch.technique,
          dynamics: weightToDynamics(branch.weight),
          phrasing: branch.weight > 0.7 ? 'legato' : 'staccato'
        });
        localTimeOffset += event.duration * (60 / this.config.tempo);
      });
    });

    // 7. Add the generated drum events to the final output
    output.push(...drumEvents.map(e => ({...e, time: this.time + e.time})));

    // 8. Update global time and epoch
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
