
import type { 
  FractalEvent, 
  Branch, 
  ResonanceMatrix, 
  Mood, 
  Genre, 
  EngineConfig,
  Technique,
  Phrasing,
  Dynamics
} from '@/types/fractal';

// === 1. КОНФИГУРАЦИЯ ===
// (Moved to types/fractal.ts)


// === 2. АКСОН: БАЗОВЫЙ МОТИВ ===
function generateAxiom(seed: number, mood: Mood): FractalEvent[] {
  const random = seededRandom(seed);
  const scale = getScaleForMood(mood);
  const rootNote = scale[random.nextInt(scale.length)];
  
  // Простой, но выразительный мотив: нисходящий контур
  return [
    { type: 'bass', note: rootNote, duration: 1.5, time: 0, technique: 'pluck', dynamics: 'mf', phrasing: 'legato', weight: 1.0 },
    { type: 'bass', note: rootNote + 3, duration: 0.5, time: 1.5, technique: 'pluck', dynamics: 'p', phrasing: 'staccato', weight: 0.8 },
    { type: 'bass', note: rootNote + 2, duration: 1.5, time: 2, technique: 'pluck', dynamics: 'mf', phrasing: 'legato', weight: 0.9 },
    { type: 'bass', note: rootNote, duration: 0.5, time: 3.5, technique: 'pluck', dynamics: 'p', phrasing: 'staccato', weight: 1.0 }
  ];
}

// === 3. ТРАНСФОРМАЦИИ (ШЁНБЕРГ) ===
function transformMotif(events: FractalEvent[], type: 'inversion' | 'retrograde'): FractalEvent[] {
  const notes = events.map(e => e.note);
  const durations = events.map(e => e.duration);
  const pivot = notes[0];
  
  let newNotes: number[];
  if (type === 'inversion') {
    newNotes = notes.map(n => pivot - (n - pivot));
  } else { // retrograde
    newNotes = [...notes].reverse();
    // Reverse durations as well to match the reversed notes
    const newDurations = [...durations].reverse();
    let currentTime = 0;
    return newNotes.map((note, i) => {
        const event = { ...events[events.length - 1 - i], note, time: currentTime };
        currentTime += newDurations[i];
        return event;
    });
  }
  
  return newNotes.map((note, i) => ({
    ...events[i],
    note,
  }));
}

// === 4. L-СИСТЕМА (IFS-РЕЖИМ) ===
function applyLSystem(axiom: string, rules: Record<string, string>, iterations: number): string {
  let s = axiom;
  for (let i = 0; i < iterations; i++) {
    s = s.split('').map(char => rules[char] || char).join('');
  }
  return s;
}

// === 5. ДРАМАТУРГИЧЕСКАЯ ДУГА δ(t) (ЛОГИНОВА) ===
function getDeltaProfile(mood: Mood): (t: number) => number {
  return (t: number) => {
    const phase = (t / 120) % 1; // цикл каждые 2 минуты
    if (mood === 'melancholic') {
      if (phase < 0.4) return 0.3 + phase * 1.5;     // медленное нарастание
      if (phase < 0.7) return 1.0;                   // кульминация
      return 1.0 - (phase - 0.7) * 2.3;              // затухание
    }
    // другие настроения...
    return 0.5;
  };
}

// === 6. ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  private config: EngineConfig;
  private branches: Branch[] = [];
  private time = 0;
  private lambda: number;
  private resonanceMatrix: ResonanceMatrix;
  private epoch = 0;

  constructor(config: EngineConfig) {
    this.config = config;
    this.lambda = config.mood === 'melancholic' ? 0.25 : 0.15;
    this.resonanceMatrix = loadResonanceMatrix(config.mood);
    this.initialize();
  }

  private initialize() {
    const seed = this.config.seed ?? Date.now();
    const axiomEvents = generateAxiom(seed, this.config.mood);
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
  }


  // === ОСНОВНОЙ ЦИКЛ ГЕНЕРАЦИИ ===
  public evolve(duration: number): FractalEvent[] {
    const delta = getDeltaProfile(this.config.mood)(this.time);
    const output: FractalEvent[] = [];
    const beatDuration = 60 / this.config.tempo;

    // 1. Обновление весов по формуле
    this.branches = this.branches.map(branch => {
      let resonanceSum = 0;
      for (const other of this.branches) {
        if (other.id === branch.id) continue;
        const k = this.resonanceMatrix(branch.events[0].id, other.events[0].id); // Assuming events have unique IDs
        resonanceSum += k * delta;
      }
      
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      return { ...branch, weight: newWeight, age: branch.age + 1 };
    });

    // 2. Смерть слабых ветвей
    this.branches = this.branches.filter(b => b.weight > 0.05);
    if(this.branches.length === 0) this.initialize(); // Re-initialize if all branches die

    // 3. IFS: L-система каждые 2 эпохи
    if (this.epoch % 2 === 0 && this.epoch > 0) {
      const lString = applyLSystem('A', { A: 'AB[+A]C', B: 'BC', C: 'A' }, 1);
      // Генерация новых ветвей по L-строке...
    }

    // 4. DLA: стохастическое исследование
    if (Math.random() < 0.3 * delta && this.branches.length < 5) {
      const base = this.branches[Math.floor(Math.random() * this.branches.length)];
      if (base) {
          const newEvents = transformMotif(base.events, 'inversion');
          this.branches.push({
            id: `dla_${Date.now()}`,
            events: newEvents.map(e => ({...e, weight: 0.2, technique: Math.random() > 0.7 ? 'slap' : 'ghost'})),
            weight: 0.2,
            age: 0,
            technique: Math.random() > 0.7 ? 'slap' : 'ghost'
          });
      }
    }

    // 5. Генерация событий для вывода
    const currentBarTime = this.epoch * (beatDuration * 4);
    this.branches.forEach(branch => {
      branch.events.forEach(event => {
        output.push({
          ...event,
          id: `${event.type}_${event.note}_${this.time}`, // Add ID to event
          time: currentBarTime + event.time * beatDuration,
          weight: branch.weight,
          technique: branch.technique,
          dynamics: this.weightToDynamics(branch.weight),
          phrasing: branch.weight > 0.7 ? 'legato' : 'staccato'
        });
      });
    });

    this.time += beatDuration * 4;
    this.epoch++;

    const bassEvents = output.filter(e => e.type === 'bass');
    const drumEvents = output.filter(e => e.type.startsWith('drum_'));
    console.log('[NFM Evolve] Generated Events. Bass:', bassEvents, 'Drums:', drumEvents);
    
    return output;
  }

  private weightToDynamics(weight: number): Dynamics {
    if (weight < 0.3) return 'p';
    if (weight < 0.7) return 'mf';
    return 'f';
  }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===
function seededRandom(seed: number) {
  let state = seed;
  const next = () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
  };
  return {
    next: next,
    nextInt: (max: number) => Math.floor(next() * max)
  };
}

function getScaleForMood(mood: Mood): number[] {
  const E = 64; // E4
  if (mood === 'melancholic') return [E, E+2, E+3, E+5, E+7, E+9, E+10]; // E Dorian
  return [E, E+2, E+4, E+5, E+7, E+9, E+11]; // E Major
}

function loadResonanceMatrix(mood: Mood): ResonanceMatrix {
  // Currently returns a placeholder. Should load from `resonance-matrices.ts` in a real scenario.
  return (eventA: string, eventB: string) => 0.5; 
}
