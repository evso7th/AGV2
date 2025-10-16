
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS } from './music-theory';

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
  density: number;
  lambda: number;
  organic: number;
  drumSettings: any;
  seed?: number;
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getParamsForTechnique(technique: Technique, mood: Mood, genre: Genre): BassSynthParams {
  switch (technique) {
    case 'pluck':
      return { cutoff: 800, resonance: 0.3, distortion: 0.1, portamento: 0.01 };
    case 'ghost':
      return { cutoff: 450, resonance: 0.2, distortion: 0.0, portamento: 0.0 }; // Raised cutoff slightly
    case 'slap':
       return { cutoff: 1200, resonance: 0.5, distortion: 0.3, portamento: 0.0 };
    case 'fill':
       return { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 }; // More aggressive
    default:
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

function safeTime(value: number, fallback: number = 0): number {
  return isFinite(value) ? value : fallback;
}

// === АКСОНЫ И ТРАНСФОРМАЦИИ ===
function createDrumAxiom(genre: Genre, mood: Mood): FractalEvent[] {
  const hitParams = getParamsForTechnique('hit', mood, genre);
  const pattern = STYLE_DRUM_PATTERNS[genre] || STYLE_DRUM_PATTERNS['ambient'];
  return pattern.map(baseEvent => ({
    note: 36, phrasing: 'staccato', dynamics: 'mf', ...baseEvent, params: hitParams
  })) as FractalEvent[];
}

function createBassAxiom(mood: Mood, genre: Genre, random: { nextInt: (max: number) => number }): FractalEvent[] {
  const scale = getScaleForMood(mood);
  const pluckParams = getParamsForTechnique('pluck', mood, genre);
  const createRandomNote = (time: number, duration: number): FractalEvent => ({
    type: 'bass', note: scale[random.nextInt(scale.length)], duration, time, weight: 1.0, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato', params: pluckParams
  });
  return [createRandomNote(0, 1.5), createRandomNote(1.5, 0.5), createRandomNote(2.0, 1.5), createRandomNote(3.5, 0.5)];
}

function createRhythmSectionFill(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { drumFill: FractalEvent[], bassFill: FractalEvent[] } {
    const hitParams = getParamsForTechnique('hit', mood, genre);
    const fillParams = getParamsForTechnique('fill', mood, genre);
    const drumFill: FractalEvent[] = [];
    const bassFill: FractalEvent[] = [];
    const scale = getScaleForMood(mood);

    // Определяем плотность сбивки
    const fillDensity = random.nextInt(3) + 2; // 2, 3, или 4
    let drumTime = 3.0;
    
    const drumInstruments: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_snare'];

    // Генерируем барабанную сбивку
    for(let i = 0; i < fillDensity; i++) {
        const instrument = drumInstruments[random.nextInt(drumInstruments.length)];
        const duration = 1 / fillDensity;
        // Громкость сбивки чуть выше средней, но не максимальная
        drumFill.push({ type: instrument, note: 41 + i, duration, time: drumTime, weight: 0.8, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams });
        
        // Бас отвечает на удар барабана с небольшим шансом
        if (random.next() > 0.4) {
             // Громкость басового филла тоже акцентирована, но не чрезмерно
             bassFill.push({ type: 'bass', note: scale[random.nextInt(scale.length)], duration: duration * 0.8, time: drumTime + 0.05, weight: 0.85, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
        }
        
        drumTime += duration;
    }

    // Финальный акцент
    drumFill.push({ type: 'drum_snare', note: 38, duration: 0.25, time: 3.75, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams });
    drumFill.push({ type: 'drum_crash', note: 49, duration: 0.25, time: 3.75, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams });
     // Бас тоже может сделать финальный акцент
    if (random.next() > 0.3) {
      bassFill.push({ type: 'bass', note: scale[0], duration: 0.25, time: 3.75, weight: 0.9, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
    }

    return { drumFill, bassFill };
}


// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig;
  private branches: Branch[] = [];
  private time: number = 0;
  private lambda: number;
  private epoch = 0;
  private random: { next: () => number; nextInt: (max: number) => number };
  private nextWeatherEventEpoch: number;
  private drumFillForThisEpoch: FractalEvent[] | null = null;

  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.lambda = config.lambda ?? 0.5;
    this.random = seededRandom(config.seed ?? Date.now());
    this.nextWeatherEventEpoch = 0;
    this.initialize();
  }

  public get tempo(): number { return this.config.tempo; }
  
  public updateConfig(newConfig: Partial<EngineConfig>) {
      this.config = { ...this.config, ...newConfig };
      if (newConfig.lambda) this.lambda = newConfig.lambda;
  }

  private initialize() {
    this.random = seededRandom(this.config.seed ?? Date.now());
    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.branches = [];

    const bassAxiom = createBassAxiom(this.config.mood, this.config.genre, this.random);
    this.branches.push({ id: 'bass_axon', events: bassAxiom, weight: 1.0, age: 0, technique: 'pluck', type: 'bass' });

    if (this.config.drumSettings.enabled) {
        const drumAxiom = createDrumAxiom(this.config.genre, this.config.mood);
        this.branches.push({ id: 'drum_axon', events: drumAxiom, weight: 1.0, age: 0, technique: 'hit', type: 'drums' });
    }
  }

  public generateExternalImpulse() {
    console.log(`%c[WEATHER EVENT] at epoch ${this.epoch}: Triggering linked mutation.`, "color: blue; font-weight: bold;");
    
    const { drumFill, bassFill } = createRhythmSectionFill(this.config.mood, this.config.genre, this.random);

    this.drumFillForThisEpoch = drumFill;
    console.log(`%c  -> Created ONE-OFF DRUM fill for this epoch.`, "color: blue;");

    if (bassFill.length > 0) {
        const bassFillBranch: Branch = {
            id: `bass_response_${this.epoch}`,
            events: bassFill,
            weight: 1.5, // Give it a high initial weight to ensure it plays
            age: 0,
            technique: 'fill',
            type: 'bass'
        };
        this.branches.push(bassFillBranch);
        console.log(`%c  -> Created BASS response branch: ${bassFillBranch.id}`, "color: blue;");
    }
  }
  
  private selectBranchForMutation(): Branch | null {
    const candidates = this.branches.filter(b => b.age > 1); // Don't mutate brand new branches
    if (candidates.length === 0) return null;
    const totalWeight = candidates.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight === 0) return candidates[0];
    
    let random = this.random.next() * totalWeight;
    for (const branch of candidates) {
      random -= branch.weight;
      if (random <= 0) return branch;
    }
    return candidates[candidates.length - 1];
  }

  private mutateBranch(parent: Branch): Branch | null {
    const mutationType = this.random.nextInt(3);
    const newEvents: FractalEvent[] = JSON.parse(JSON.stringify(parent.events));
    let newTechnique: Technique = parent.technique;

    if (parent.type !== 'bass') return null;

    switch(mutationType) {
        case 0: // Ghost Note
             const eventToGhost = newEvents[this.random.nextInt(newEvents.length)];
             eventToGhost.technique = 'ghost';
             eventToGhost.params = getParamsForTechnique('ghost', this.config.mood, this.config.genre);
             eventToGhost.duration *= 0.5;
             newTechnique = 'ghost';
             break;
        case 1: // Rhythmic shift
             newEvents.forEach(e => e.time = (e.time + 0.125) % 4);
             break;
        case 2: // Transpose
             const scale = getScaleForMood(this.config.mood);
             const shift = this.random.next() > 0.5 ? 2 : -2;
             newEvents.forEach(e => {
                 const currentIndex = scale.indexOf(e.note);
                 if (currentIndex !== -1) {
                     e.note = scale[(currentIndex + shift + scale.length) % scale.length];
                 }
             });
             break;
        default:
            return null;
    }
    
    return { id: `bass_mut_${this.epoch}`, events: newEvents, weight: parent.weight * 0.75, age: 0, technique: newTechnique, type: 'bass' };
  }

  private generateOneBar(): FractalEvent[] {
    const output: FractalEvent[] = [];
    
    // --- Natural Selection ---
    const bassBranches = this.branches.filter(b => b.type === 'bass');
    const drumBranches = this.branches.filter(b => b.type === 'drums');
    
    const winningBassBranch = bassBranches.reduce((max, b) => b.weight > max.weight ? b : max, bassBranches[0]);
    const winningDrumBranch = drumBranches.reduce((max, b) => b.weight > max.weight ? b : max, drumBranches[0]);

    if (winningBassBranch) {
        winningBassBranch.events.forEach(event => {
            const newEvent: FractalEvent = { ...event };
            newEvent.dynamics = event.dynamics;
            newEvent.weight = event.weight;
            newEvent.phrasing = winningBassBranch.weight > 0.7 ? 'legato' : 'staccato';
            newEvent.params = getParamsForTechnique(newEvent.technique, this.config.mood, this.config.genre);
            output.push(newEvent);
        });
    }

    if (winningDrumBranch) {
        let drumEvents = winningDrumBranch.events;
        // If there's a one-off fill for this epoch, use it instead of the main pattern
        if (this.drumFillForThisEpoch) {
            drumEvents = this.drumFillForThisEpoch;
            this.drumFillForThisEpoch = null; // Consume it
        }
        drumEvents.forEach(event => {
            // Use original event weight/dynamics for velocity
            output.push({ ...event, weight: event.weight ?? 1.0 });
        });
    }
    
    // --- DLA: Genetic mutation for Bass ---
    if (this.epoch % 2 === 1 && this.random.next() < this.config.density && this.branches.filter(b => b.type === 'bass').length < 5) {
        const parentBranch = this.selectBranchForMutation();
        if (parentBranch && parentBranch.type === 'bass') {
            const newBranch = this.mutateBranch(parentBranch);
            if (newBranch) {
                this.branches.push(newBranch);
            }
        }
    }
    
    return output;
  }

  public evolve(barDuration: number): FractalEvent[] {
    if (this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch += this.random.nextInt(12) + 8;
    }

    const delta = this.getDeltaProfile()(this.time);
    if (!isFinite(barDuration)) return [];

    // Update weights
    this.branches.forEach(branch => {
      const ageBonus = Math.max(0.5, 1 - (branch.age / 32)); // Bonus for younger branches, decays over 32 epochs
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id || other.type === branch.type) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], { mood: this.config.mood, tempo: this.config.tempo, delta });
        return sum + k * delta * other.weight;
      }, 0);
      const newWeight = ((1 - this.lambda) * branch.weight + resonanceSum) * ageBonus;
      branch.weight = isFinite(newWeight) ? Math.max(0, newWeight) : 0.01;
      branch.age++;
    });

    // Normalize weights within each type (bass, drums)
    ['bass', 'drums'].forEach(type => {
        const typeBranches = this.branches.filter(b => b.type === type);
        const totalWeight = typeBranches.reduce((sum, b) => sum + b.weight, 0);
        if (totalWeight > 0) {
            typeBranches.forEach(b => b.weight /= totalWeight);
        }
    });

    console.log('Weights after update:', this.branches.map(b => ({id: b.id, type: b.type, weight: b.weight.toFixed(3)})));

    // Kill weak branches (but keep axons)
    this.branches = this.branches.filter(b => b.id.includes('axon') || b.weight > 0.05);
    
    const events = this.generateOneBar();

    this.time += barDuration;
    this.epoch++;
    return events;
  }

  private getDeltaProfile(): (t: number) => number {
    return (t: number) => {
        const safeT = safeTime(t);
        const phase = (safeT / 120) % 1;
        if (this.config.mood === 'melancholic' || this.config.mood === 'dreamy' || this.config.mood === 'dark') {
          if (phase < 0.4) return 0.3 + phase * 1.5;
          if (phase < 0.7) return 1.0;
          return 1.0 - (phase - 0.7) * 2.3;
        } else { // epic
          if (phase < 0.3) return 0.5 + phase * 1.6;
          if (phase < 0.6) return 1.0;
          return 1.0 - (phase - 0.6) * 1.6;
        }
    };
  }
}
