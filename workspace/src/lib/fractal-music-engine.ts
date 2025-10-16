
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
  density: number; // Added density
  lambda: number; // Added lambda
  organic: number; // Added organic
  drumSettings: any; // Added drumSettings
  seed?: number;
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getParamsForTechnique(technique: Technique, mood: Mood, genre: Genre): BassSynthParams {
    // В будущем здесь можно будет добавить логику, зависящую от жанра
  switch (technique) {
    case 'pluck':
      return { cutoff: 800, resonance: 0.3, distortion: 0.1, portamento: 0.01 };
    case 'ghost':
      return { cutoff: 250, resonance: 0.1, distortion: 0.0, portamento: 0.0 };
    case 'slap':
       return { cutoff: 1200, resonance: 0.5, distortion: 0.3, portamento: 0.0 };
    case 'fill':
       return { cutoff: 900, resonance: 0.4, distortion: 0.15, portamento: 0.0 };
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
function createDrumAxiom(genre: Genre, mood: Mood): FractalEvent[] {
  const hitParams = getParamsForTechnique('hit', mood, genre);
  const pattern = STYLE_DRUM_PATTERNS[genre] || STYLE_DRUM_PATTERNS['ambient']; // Фоллбэк на ambient

  return pattern.map(baseEvent => ({
    note: 36, // Note будет перезаписана, если есть в baseEvent
    phrasing: 'staccato',
    dynamics: 'mf',
    ...baseEvent,
    params: hitParams
  })) as FractalEvent[];
}


// === БАСОВЫЙ АКСОН (duration в ДОЛЯХ ТАКТА!) ===
function createBassAxiom(mood: Mood, genre: Genre, random: { nextInt: (max: number) => number }): FractalEvent[] {
  const scale = getScaleForMood(mood);
  const pluckParams = getParamsForTechnique('pluck', mood, genre);
  
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

// === ТРАНСФОРМАЦИИ ===
function createTomFill(mood: Mood, genre: Genre): FractalEvent[] {
  const hitParams = getParamsForTechnique('hit', mood, genre);
  return [
    { type: 'drum_tom_low', note: 41, duration: 0.25, time: 3.0, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_tom_mid', note: 45, duration: 0.25, time: 3.25, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_tom_high', note: 50, duration: 0.25, time: 3.5, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams },
    { type: 'drum_snare', note: 38, duration: 0.25, time: 3.75, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams }
  ];
}

function createBassFill(mood: Mood, genre: Genre, random: { nextInt: (max: number) => number }): FractalEvent[] {
    const scale = getScaleForMood(mood);
    const fillParams = getParamsForTechnique('fill', mood, genre);
    const fill: FractalEvent[] = [];
    let currentTime = 3.0;
    const noteCount = 5 + random.nextInt(3); // 5-7 нот
    
    for (let i = 0; i < noteCount; i++) {
        const note = scale[random.nextInt(scale.length)];
        const duration = 0.25; // 16-е ноты
        fill.push({
            type: 'bass',
            note,
            duration,
            time: currentTime,
            weight: 0.8,
            technique: 'fill',
            dynamics: 'f',
            phrasing: 'staccato',
            params: fillParams,
        });
        currentTime += duration;
    }
    return fill;
}

// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig; // Made public
  private branches: Branch[] = [];
  private time: number = 0;
  private lambda: number;
  private epoch = 0;
  private random: { next: () => number; nextInt: (max: number) => number };
  private climaxImminent: boolean = false;
  private currentMood: Mood;
  private nextWeatherEventEpoch: number;

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
    this.currentMood = config.mood;
    this.random = seededRandom(config.seed ?? Date.now());
    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8; // Schedule first event
    this.initialize();
  }

  public get tempo(): number {
    return this.config.tempo;
  }
  
  public updateConfig(newConfig: Partial<EngineConfig>) {
      this.config = { ...this.config, ...newConfig };
      if (newConfig.lambda) this.lambda = newConfig.lambda;
      if (newConfig.mood) this.currentMood = newConfig.mood;
  }

  private initialize() {
    // БАСОВЫЙ АКСОН
    const bassAxiom = createBassAxiom(this.config.mood, this.config.genre, this.random);
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
        const drumAxiom = createDrumAxiom(this.config.genre, this.config.mood);
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

 public generateExternalImpulse() {
    console.log(`%c[WEATHER EVENT] at epoch ${this.epoch}: Triggering linked mutation.`, "color: blue; font-weight: bold;");

    const drumParent = this.branches.find(b => b.type === 'drums' && b.id.includes('axon'));
    const bassParent = this.branches.find(b => b.type === 'bass' && b.id.includes('axon'));

    if (drumParent) {
        const drumFillBranch: Branch = { 
            id: `drum_fill_${this.epoch}`, 
            events: createTomFill(this.currentMood, this.config.genre), 
            weight: 0.9, // High initial weight to ensure it's heard
            age: 0, 
            technique: 'hit', 
            type: 'drums'
        };
        this.branches.push(drumFillBranch);
        console.log(`%c  -> Created DRUM fill branch: ${drumFillBranch.id}`, "color: blue;");
    }

    if (bassParent) {
         const bassFillBranch: Branch = {
            id: `bass_response_${this.epoch}`,
            events: createBassFill(this.currentMood, this.config.genre, this.random),
            weight: 0.85, // High initial weight
            age: 0,
            technique: 'fill',
            type: 'bass'
        };
        this.branches.push(bassFillBranch);
        console.log(`%c  -> Created BASS response branch: ${bassFillBranch.id}`, "color: blue;");
    }
}
  
  private selectBranchForMutation(): Branch | null {
    const totalWeight = this.branches.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight === 0) return this.branches.length > 0 ? this.branches[0] : null;
    let random = this.random.next() * totalWeight;
    for (const branch of this.branches) {
      random -= branch.weight;
      if (random <= 0) return branch;
    }
    return this.branches.length > 0 ? this.branches[this.branches.length - 1] : null;
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
             eventToGhost.params = getParamsForTechnique('ghost', this.currentMood, this.config.genre);
             eventToGhost.duration *= 0.5;
             newTechnique = 'ghost';
             break;
        case 1: // Rhythmic shift
             newEvents.forEach(e => e.time = (e.time + 0.125) % 4);
             break;
        case 2: // Transpose
             if (parent.type !== 'bass') return null;
             const scale = getScaleForMood(this.currentMood);
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
             return { id: `drum_fill_${this.epoch}`, events: createTomFill(this.currentMood, this.config.genre), weight: parent.weight / 2, age: 0, technique: 'hit', type: 'drums' };
    }
    
    return { id: `${parent.type}_mut_${this.epoch}`, events: newEvents, weight: parent.weight / 2, age: 0, technique: newTechnique, type: parent.type };
  }

  private generateOneBar(): FractalEvent[] {
    const output: FractalEvent[] = [];
    
    if (this.climaxImminent && this.random.next() < 0.7) {
        const base = this.branches.find(b => b.type === 'bass');
        if(base) {
            const ghostParams = getParamsForTechnique('ghost', this.currentMood, this.config.genre);
            const ghostEvents = base.events.map(e => ({ ...e, technique: 'ghost' as Technique, params: ghostParams }));
            this.branches.push({
                id: `bass_tension_${this.epoch}`,
                events: ghostEvents,
                weight: 0.7,
                age: 0,
                technique: 'ghost',
                type: 'bass'
            });
        }
        this.climaxImminent = false; 
    }

    this.branches.forEach(branch => {
      branch.events.forEach(originalEvent => {
        const newEvent: FractalEvent = { ...originalEvent };
        newEvent.dynamics = weightToDynamics(branch.weight);
        newEvent.phrasing = branch.weight > 0.7 ? 'legato' : 'staccato';
        newEvent.weight = branch.weight; 
        newEvent.params = getParamsForTechnique(newEvent.technique, this.currentMood, this.config.genre);
        output.push(newEvent);
      });
    });

    // DLA: Genetic mutation
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

    // "Weather" event: check if it's time to trigger
    if (this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        // Schedule the next weather event
        this.nextWeatherEventEpoch += this.random.nextInt(12) + 8; // Schedule next event in 8-20 epochs
    }


    // Обновление весов
    this.branches.forEach(branch => {
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id) return sum;
        const k = MelancholicMinorK(
          branch.events[0],
          other.events[0],
          { mood: this.currentMood, tempo: this.config.tempo, delta }
        );
        return sum + k * delta;
      }, 0);
      const newWeight = (1 - this.lambda) * branch.weight + resonanceSum;
      branch.weight = isFinite(newWeight) ? newWeight : 0.01;
      branch.age++;
    });

    // Нормализация
    const totalWeight = this.branches.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight > 0 && isFinite(totalWeight)) {
      this.branches.forEach(b => b.weight = isFinite(b.weight) ? b.weight / totalWeight : 0.01);
    }
    console.log('Weights after update:', this.branches.map(b => ({id: b.id, type: b.type, weight: b.weight.toFixed(3)})));


    // Смерть слабых ветвей (но главные аксоны бессмертны)
    this.branches = this.branches.filter(b => b.id.includes('axon') || b.weight > 0.02);
    
    // Генерация событий
    const events = this.generateOneBar();

    this.time += barDuration;
    this.epoch++;
    return events;
  }

  private getDeltaProfile(): (t: number) => number {
    return (t: number) => {
        const safeT = safeTime(t);
        const epoch = Math.floor(safeT / 120); 
        const phase = (safeT % 120) / 120;

        this.currentMood = epoch % 2 === 0 ? this.config.mood : 'epic';

        this.climaxImminent = phase > 0.65 && phase < 0.7;

        if (this.currentMood === 'melancholic' || this.currentMood === 'dreamy' || this.currentMood === 'dark') {
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
