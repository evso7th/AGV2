
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType } from '@/types/fractal';
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
      return { cutoff: 450, resonance: 0.2, distortion: 0.0, portamento: 0.0 };
    case 'slap':
       return { cutoff: 1200, resonance: 0.5, distortion: 0.3, portamento: 0.0 };
    case 'fill':
       return { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };
    default: // 'hit' or others
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
function createDrumAxiom(genre: Genre, mood: Mood, random: { next: () => number }): FractalEvent[] {
  const hitParams = getParamsForTechnique('hit', mood, genre);
  const basePattern = STYLE_DRUM_PATTERNS[genre] || STYLE_DRUM_PATTERNS['ambient'];
  
  const axiomEvents: FractalEvent[] = [];

  basePattern.forEach(patternEvent => {
    if (patternEvent.probability && random.next() > patternEvent.probability) {
      return;
    }

    let instrumentType: InstrumentType;

    if (Array.isArray(patternEvent.type)) {
        const types = patternEvent.type as InstrumentType[];
        const probabilities = patternEvent.probabilities || [];
        let rand = random.next();
        let cumulativeProb = 0;
        
        let chosenType: InstrumentType | null = null;
        for (let i = 0; i < types.length; i++) {
            cumulativeProb += probabilities[i] || (1 / types.length);
            if (rand <= cumulativeProb) {
                chosenType = types[i];
                break;
            }
        }
        instrumentType = chosenType || types[types.length-1];
    } else {
        instrumentType = patternEvent.type;
    }

    axiomEvents.push({
      ...patternEvent,
      type: instrumentType,
      note: 36, 
      phrasing: 'staccato',
      dynamics: 'mf',
      params: hitParams,
    } as FractalEvent);
  });

  return axiomEvents;
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

    const fillDensity = random.nextInt(3) + 2; 
    let drumTime = 3.0;
    
    const drumInstruments: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_snare'];

    for(let i = 0; i < fillDensity; i++) {
        const instrument = drumInstruments[random.nextInt(drumInstruments.length)];
        const duration = 1 / fillDensity;
        drumFill.push({ type: instrument, note: 41 + i, duration, time: drumTime, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams });
        
        if (random.next() > 0.4) {
             bassFill.push({ type: 'bass', note: scale[random.nextInt(scale.length)], duration: duration * 0.8, time: drumTime + 0.05, weight: 0.85, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
        }
        
        drumTime += duration;
    }

    drumFill.push({ type: 'drum_snare', note: 38, duration: 0.25, time: 3.75, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams });
    drumFill.push({ type: 'drum_crash', note: 49, duration: 0.25, time: 3.75, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato', params: hitParams });
    if (random.next() > 0.3) {
      bassFill.push({ type: 'bass', note: scale[0], duration: 0.25, time: 3.75, weight: 1.0, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
    }

    return { drumFill, bassFill };
}

function createBassFill(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const fill: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const fillParams = getParamsForTechnique('fill', mood, genre);
    const numNotes = random.nextInt(4) + 7; // 7 to 10 notes
    let currentTime = 0;
    let currentNoteIndex = random.nextInt(scale.length);

    const isFastGenre = genre === 'rock' || genre === 'trance' || genre === 'progressive';

    for (let i = 0; i < numNotes; i++) {
        const duration = (isFastGenre || random.next() > 0.5) ? 0.25 : 0.5;
        const step = random.next() > 0.7 ? (random.next() > 0.5 ? 2 : -2) : (random.next() > 0.5 ? 1 : -1);
        currentNoteIndex = (currentNoteIndex + step + scale.length) % scale.length;
        
        const note = (i === 0 || i === numNotes - 1) ? scale[0] : scale[currentNoteIndex];

        fill.push({
            type: 'bass', note: note, duration: duration, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams
        });
        currentTime += duration;
    }
    
    if (currentTime > 4.0) {
        const scaleFactor = 4.0 / currentTime;
        fill.forEach(e => {
            e.time *= scaleFactor;
            e.duration *= scaleFactor;
        });
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
        const drumAxiom = createDrumAxiom(this.config.genre, this.config.mood, this.random);
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
            weight: 1.5,
            age: 0,
            technique: 'fill',
            type: 'bass'
        };
        this.branches.push(bassFillBranch);
        console.log(`%c  -> Created BASS response branch: ${bassFillBranch.id}`, "color: blue;");
    }
  }
  
  private selectBranchForMutation(type: 'bass' | 'drums'): Branch | null {
    const candidates = this.branches.filter(b => b.type === type && b.age > 1);
    if (candidates.length === 0) return this.branches.find(b => b.type === type) || null;
    
    const totalWeight = candidates.reduce((sum, b) => sum + b.weight, 0);
    if (totalWeight === 0) return candidates[0] || null;
    
    let random = this.random.next() * totalWeight;
    for (const branch of candidates) {
      random -= branch.weight;
      if (random <= 0) return branch;
    }
    return candidates[candidates.length - 1];
  }

  private mutateBranch(parent: Branch): Branch | null {
    const newEvents: FractalEvent[] = JSON.parse(JSON.stringify(parent.events));
    let newTechnique: Technique = parent.technique;

    if (parent.type === 'bass') {
      const newFill = createBassFill(this.config.mood, this.config.genre, this.random);
      if (newFill.length === 0) return null;
      return { 
          id: `bass_mut_${this.epoch}`, 
          events: newFill, 
          weight: parent.weight * 0.8,
          age: 0, 
          technique: 'fill', 
          type: 'bass' 
      };
    } else if (parent.type === 'drums') {
        const mutationType = this.random.nextInt(4);
        let mutationApplied = false;

        switch(mutationType) {
            case 0: // Replace hi-hat with ride
                newEvents.forEach(e => {
                    if (e.type === 'drum_hihat_closed' && this.random.next() > 0.7) {
                        e.type = 'drum_ride';
                        mutationApplied = true;
                    }
                });
                break;
            case 1: // Add percussion
                const percOptions: InstrumentType[] = ['perc-001', 'perc-002', 'perc-003', 'perc-004', 'perc-005'];
                const timeSlots = [0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75];
                const targetTime = timeSlots[this.random.nextInt(timeSlots.length)];
                if (!newEvents.some(e => Math.abs(e.time - targetTime) < 0.1)) {
                    newEvents.push({
                        type: percOptions[this.random.nextInt(percOptions.length)], note: 36, duration: 0.1, time: targetTime, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: getParamsForTechnique('hit', this.config.mood, this.config.genre)
                    });
                    mutationApplied = true;
                }
                break;
            case 2: // Rhythmic shift (syncopation)
                const snareIndex = newEvents.findIndex(e => e.type === 'drum_snare');
                if (snareIndex > -1) {
                    newEvents[snareIndex].time += (this.random.next() > 0.5 ? 0.25 : -0.25);
                    newEvents[snareIndex].time = (newEvents[snareIndex].time + 4) % 4; // Wrap around bar
                    mutationApplied = true;
                }
                break;
            case 3: // Double hi-hat time
                const hihats = newEvents.filter(e => e.type === 'drum_hihat_closed');
                if (hihats.length > 0) {
                    const targetHat = hihats[this.random.nextInt(hihats.length)];
                    newEvents.push({...targetHat, time: targetHat.time + 0.25 });
                    mutationApplied = true;
                }
                break;
        }

        if (!mutationApplied) return null;
        return { id: `drum_mut_${this.epoch}`, events: newEvents, weight: parent.weight * 0.8, age: 0, technique: 'hit', type: 'drums' };
    }
    return null;
  }

  private generateOneBar(): FractalEvent[] {
    const output: FractalEvent[] = [];
    
    const bassBranches = this.branches.filter(b => b.type === 'bass');
    const drumBranches = this.branches.filter(b => b.type === 'drums');
    
    if (bassBranches.length > 0) {
        const winningBassBranch = bassBranches.reduce((max, b) => b.weight > max.weight ? b : max, bassBranches[0]);
        winningBassBranch.events.forEach(event => {
            const newEvent: FractalEvent = { ...event };
            newEvent.phrasing = winningBassBranch.weight > 0.7 ? 'legato' : 'staccato';
            newEvent.params = getParamsForTechnique(newEvent.technique, this.config.mood, this.config.genre);
            output.push(newEvent);
        });
    }

    if (drumBranches.length > 0) {
        const winningDrumBranch = drumBranches.reduce((max, b) => b.weight > max.weight ? b : max, drumBranches[0]);
        let drumEvents = winningDrumBranch.events;
        if (this.drumFillForThisEpoch) {
            drumEvents = this.drumFillForThisEpoch;
            this.drumFillForThisEpoch = null;
        }
        drumEvents.forEach(event => {
            output.push({ ...event, weight: event.weight ?? 1.0 });
        });
    }
    
    // --- DLA: Genetic mutation ---
    const shouldMutateBass = this.random.next() < (this.config.density * 0.5);
    const shouldMutateDrums = this.random.next() < (this.config.density * 0.5);

    if (this.epoch % 2 === 1) { // Mutate on odd epochs
        if (shouldMutateBass && this.branches.filter(b => b.type === 'bass').length < 5) {
            const parentBranch = this.selectBranchForMutation('bass');
            if (parentBranch) {
                const newBranch = this.mutateBranch(parentBranch);
                if (newBranch) {
                    this.branches.push(newBranch);
                    console.log(`%c[MUTATION] at epoch ${this.epoch}: Created new bass branch ${newBranch.id}.`, "color: green;");
                }
            }
        }
        if (shouldMutateDrums && this.branches.filter(b => b.type === 'drums').length < 5) {
            const parentBranch = this.selectBranchForMutation('drums');
            if (parentBranch) {
                const newBranch = this.mutateBranch(parentBranch);
                if (newBranch) {
                    this.branches.push(newBranch);
                     console.log(`%c[MUTATION] at epoch ${this.epoch}: Created new drum branch ${newBranch.id}.`, "color: darkorange;");
                }
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

    this.branches.forEach(branch => {
      const ageBonus = branch.age === 0 ? 1.5 : 1.0; 
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (other.id === branch.id || other.type === branch.type) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], { mood: this.config.mood, tempo: this.config.tempo, delta });
        return sum + k * delta * other.weight;
      }, 0);
      const newWeight = ((1 - this.lambda) * branch.weight + resonanceSum) * ageBonus;
      branch.weight = isFinite(newWeight) ? Math.max(0, newWeight) : 0.01;
      branch.age++;
    });

    ['bass', 'drums'].forEach(type => {
        const typeBranches = this.branches.filter(b => b.type === type);
        const totalWeight = typeBranches.reduce((sum, b) => sum + b.weight, 0);
        if (totalWeight > 0) {
            typeBranches.forEach(b => b.weight /= totalWeight);
        }
    });

    // Kill old and weak branches (but keep axons)
    this.branches = this.branches.filter(b => b.id.includes('axon') || b.weight > 0.05 || b.age < 8);
    
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

    