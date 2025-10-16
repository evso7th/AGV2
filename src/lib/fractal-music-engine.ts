
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
      return { cutoff: 350, resonance: 0.2, distortion: 0.0, portamento: 0.0 };
    case 'slap':
       return { cutoff: 1200, resonance: 0.5, distortion: 0.3, portamento: 0.0 };
    case 'fill':
       return { cutoff: 1000, resonance: 0.5, distortion: 0.2, portamento: 0.0 };
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

function weightToDynamics(weight: number): 'p' | 'mf' | 'f' {
  if (weight < 0.3) return 'p';
  if (weight < 0.7) return 'mf';
  return 'f';
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

function createTomFill(mood: Mood, genre: Genre): FractalEvent[] {
  const hitParams = getParamsForTechnique('hit', mood, genre);
  return [
    { type: 'drum_tom_low', note: 41, duration: 0.25, time: 3.0, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_tom_mid', note: 45, duration: 0.25, time: 3.25, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_tom_high', note: 50, duration: 0.25, time: 3.5, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 3.75, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams },
    { type: 'drum_crash', note: 49, duration: 0.25, time: 3.75, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams },
  ];
}

function createBassFill(mood: Mood, genre: Genre, random: { nextInt: (max: number) => number }): FractalEvent[] {
  const scale = getScaleForMood(mood);
  const fillParams = getParamsForTechnique('fill', mood, genre);
  const fill: FractalEvent[] = [];
  let currentTime = 3.0;
  const noteCount = 5 + random.nextInt(3);
  for (let i = 0; i < noteCount; i++) {
    fill.push({ type: 'bass', note: scale[random.nextInt(scale.length)], duration: 0.25, time: currentTime, weight: 0.8, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
    currentTime += 0.25;
  }
  return fill;
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

  private generateExternalImpulse() {
    console.log(`%c[WEATHER EVENT] at epoch ${this.epoch}: Triggering linked mutation.`, "color: blue; font-weight: bold;");
    
    // Drum fills are now handled as one-off events, not persistent branches
    this.drumFillForThisEpoch = createTomFill(this.config.mood, this.config.genre);
    console.log(`%c  -> Created ONE-OFF DRUM fill for this epoch.`, "color: blue;");

    const bassParent = this.branches.find(b => b.type === 'bass');
    if (bassParent) {
         const bassFillBranch: Branch = {
            id: `bass_response_${this.epoch}`,
            events: createBassFill(this.config.mood, this.config.genre, this.random),
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
            // Decouple loudness from weight. Use original dynamics.
            newEvent.weight = event.dynamics === 'p' ? 0.3 : event.dynamics === 'mf' ? 0.7 : 1.0;
            newEvent.phrasing = winningBassBranch.weight > 0.7 ? 'legato' : 'staccato';
            newEvent.params = getParamsForTechnique(newEvent.technique, this.config.mood, this.config.genre);
            output.push(newEvent);
        });
    }

    if (winningDrumBranch) {
        let drumEvents = winningDrumBranch.events;
        if (this.drumFillForThisEpoch) {
            drumEvents = this.drumFillForThisEpoch;
            this.drumFillForThisEpoch = null;
        }
        drumEvents.forEach(event => {
            // Decouple loudness from weight. Use original event weight or a default.
            const velocity = event.weight ?? (event.dynamics === 'f' ? 1.0 : 0.7);
            output.push({ ...event, weight: velocity });
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
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id || other.type === branch.type) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], { mood: this.config.mood, tempo: this.config.tempo, delta });
        return sum + k * delta * other.weight;
      }, 0);
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
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

    // Kill old and weak branches (but keep axons)
    this.branches = this.branches.filter(b => b.id.includes('axon') || (b.age < 16 && b.weight > 0.05));
    
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

    