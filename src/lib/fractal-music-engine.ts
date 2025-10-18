
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, STYLE_BASS_PATTERNS, type BassPatternDefinition } from './music-theory';

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
function createDrumAxiom(genre: Genre, mood: Mood, tempo: number, random: { next: () => number, nextInt: (max: number) => number }): { events: FractalEvent[], tags: string[] } {
    const hitParams = getParamsForTechnique('hit', mood, genre);
    const grammar = STYLE_DRUM_PATTERNS[genre] || STYLE_DRUM_PATTERNS['ambient'];
    
    const loop = grammar.loops[random.nextInt(grammar.loops.length)];
    
    const axiomEvents: FractalEvent[] = [];

    if (!loop) return { events: [], tags: [] };

    // Этап 1: Генерация основного бита (Kick, Snare, Hi-hat)
    const allBaseEvents = [...(loop.kick || []), ...(loop.snare || []), ...(loop.hihat || [])];
    for (const baseEvent of allBaseEvents) {
        if (baseEvent.probability && random.next() > baseEvent.probability) {
            continue;
        }

        let instrumentType: InstrumentType;
        // Если тип - массив, выбираем один на основе вероятностей
        if (Array.isArray(baseEvent.type)) {
            const types = baseEvent.type as InstrumentType[];
            const probabilities = baseEvent.probabilities || [];
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
            instrumentType = chosenType || types[types.length - 1];
        } else {
            instrumentType = baseEvent.type;
        }

        axiomEvents.push({
            ...baseEvent,
            type: instrumentType,
            note: 36, // Placeholder MIDI
            phrasing: 'staccato',
            dynamics: 'mf', // Placeholder
            params: hitParams,
        } as FractalEvent);
    }
    
    // Этап 2: Добавление перкуссии ("Приправа")
    if (grammar.percussion && grammar.percussion.types.length > 0) {
        const tempoModifier = 1.5 - (tempo / 120); 
        const dynamicProbability = grammar.percussion.probability * Math.max(0.2, Math.min(1.5, tempoModifier));
        
        if (random.next() < dynamicProbability) {
            const occupiedTimes = new Set(axiomEvents.map(e => e.time));
            const availableTimes = grammar.percussion.allowedTimes.filter(t => !occupiedTimes.has(t));
            
            if (availableTimes.length > 0) {
                const time = availableTimes[random.nextInt(availableTimes.length)];
                const percPool = grammar.percussion.types;
                const type = percPool[random.nextInt(percPool.length)];
                  
                axiomEvents.push({
                    type: type,
                    time: time,
                    duration: 0.25,
                    weight: grammar.percussion.weight,
                    note: 36, // Placeholder
                    phrasing: 'staccato',
                    dynamics: 'p',
                    params: hitParams
                } as FractalEvent);
            }
        }
    }

    return { events: axiomEvents, tags: loop.tags };
}


function createBassAxiom(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }, compatibleTags: string[] = []): FractalEvent[] {
  const scale = getScaleForMood(mood);
  const patternLibrary = STYLE_BASS_PATTERNS[genre] || STYLE_BASS_PATTERNS['ambient'];

  let compatiblePatterns = patternLibrary;
  if (compatibleTags.length > 0) {
      const filtered = patternLibrary.filter(p => p.tags.some(tag => compatibleTags.includes(tag)));
      if (filtered.length > 0) {
          compatiblePatterns = filtered;
      }
  }
  
  const chosenPatternDef = compatiblePatterns[random.nextInt(compatiblePatterns.length)];
  
  const selectNote = (): number => {
      const rand = random.next();
      if (rand < 0.6) { 
          const third = Math.floor(scale.length / 3);
          return scale[random.nextInt(third)];
      } else if (rand < 0.9) { 
          const third = Math.floor(scale.length / 3);
          return scale[third + random.nextInt(third)];
      } else { 
          const twoThirds = Math.floor(2 * scale.length / 3);
          return scale[twoThirds + random.nextInt(scale.length - twoThirds)];
      }
  };

  return chosenPatternDef.pattern.map(event => {
      const note = selectNote();
      const technique = event.technique || 'pluck';
      return {
        type: 'bass',
        note,
        duration: event.duration,
        time: event.time,
        weight: 1.0,
        technique,
        dynamics: 'mf',
        phrasing: 'staccato',
        params: getParamsForTechnique(technique, mood, genre)
      };
  });
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
        const currentDrumTime = drumTime;
        drumFill.push({ type: instrument, note: 41 + i, duration, time: currentDrumTime, weight: 0.7 + random.next() * 0.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams });
        
        // Басовый филл, ритмически совпадающий с ударными
        if (random.next() > 0.4) {
             const noteIndex = random.nextInt(scale.length);
             bassFill.push({ type: 'bass', note: scale[noteIndex], duration: duration * 0.8, time: currentDrumTime, weight: 0.7 + random.next() * 0.2, technique: 'fill', dynamics: 'mf', phrasing: 'staccato', params: fillParams });
        }
        
        drumTime += duration;
    }

    drumFill.push({ type: 'drum_snare', note: 38, duration: 0.25, time: 3.75, weight: 0.8 + random.next() * 0.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams });
    drumFill.push({ type: 'drum_crash', note: 49, duration: 0.25, time: 3.75, weight: 0.8 + random.next() * 0.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams });
    if (random.next() > 0.3) {
      bassFill.push({ type: 'bass', note: scale[0], duration: 0.25, time: 3.75, weight: 0.9, technique: 'fill', dynamics: 'mf', phrasing: 'staccato', params: fillParams });
    }

    return { drumFill, bassFill };
}

function createBassFill(this: FractalMusicEngine, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const fill: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const fillParams = getParamsForTechnique('fill', mood, genre);
    const numNotes = random.nextInt(4) + 5; // 5 to 8 notes for more musical fills
    let currentTime = 0;
    
    const selectNote = (lastNote?: number): number => {
        const lastNoteIndex = lastNote !== undefined ? scale.indexOf(lastNote) : -1;
        const r = random.next();
        if (lastNoteIndex !== -1 && r < 0.6) { // 60% chance for stepwise motion
            const step = random.next() > 0.5 ? 1 : -1;
            return scale[(lastNoteIndex + step + scale.length) % scale.length];
        } else if (r < 0.85) { // 25% chance for chord tones (root, 3rd, 5th, 7th)
            const chordToneIndices = [0, 2, 4, 6].filter(i => i < scale.length);
            return scale[chordToneIndices[random.nextInt(chordToneIndices.length)]];
        } else { // 15% chance for a larger jump
             const step = random.next() > 0.5 ? (random.nextInt(3) + 2) : -(random.nextInt(3) + 2); // Jump of 2, 3 or 4
             const targetIndex = (lastNoteIndex !== -1 ? lastNoteIndex : 0) + step;
             return scale[ (targetIndex + scale.length) % scale.length ];
        }
    };

    let currentNote = selectNote();

    for (let i = 0; i < numNotes; i++) {
        let duration: number;
        const rhythmChoice = random.next();
        if (rhythmChoice < 0.5) duration = 0.25;      // 50% 16th
        else if (rhythmChoice < 0.8) duration = 0.5; // 30% 8th
        else if (rhythmChoice < 0.95) duration = 0.75; // 15% dotted 8th
        else duration = 0.125;                       // 5% 32nd for flair

        if (currentTime + duration > 4.0) break;

        fill.push({
            type: 'bass', note: currentNote, duration, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams
        });
        
        currentTime += duration;
        currentNote = selectNote(currentNote);
    }
    
    const maxNoteInScale = Math.max(...scale);
    const highNoteThreshold = maxNoteInScale - 12; 
    const hasHighNotes = fill.some(n => n.note > highNoteThreshold);
    
    if (hasHighNotes) {
        console.warn(`[BassFillPenalty] High-register fill detected. Applying penalty.`);
        fill.forEach(e => e.weight *= 0.1); 
        this.needsBassReset = true;
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
  public needsBassReset: boolean = false;

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
    let drumTags: string[] = [];

    if (this.config.drumSettings.enabled) {
        const { events: drumAxiom, tags } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        this.branches.push({ id: 'drum_axon', events: drumAxiom, weight: 1.0, age: 0, technique: 'hit', type: 'drums' });
        drumTags = tags;
    }
    
    const bassAxiom = createBassAxiom(this.config.mood, this.config.genre, this.random, drumTags);
    this.branches.push({ id: 'bass_axon', events: bassAxiom, weight: 1.0, age: 0, technique: 'pluck', type: 'bass' });
    
    this.needsBassReset = false;
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
    if (candidates.length === 0) {
        const allTypeBranches = this.branches.filter(b => b.type === type);
        if (allTypeBranches.length === 0) return null;
        return allTypeBranches.reduce((oldest, b) => b.age > oldest.age ? b : oldest, allTypeBranches[0]);
    }
    
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
      const newFill = createBassFill.call(this, this.config.mood, this.config.genre, this.random);
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
                const grammar = STYLE_DRUM_PATTERNS[this.config.genre] || STYLE_DRUM_PATTERNS['ambient'];
                const percRule = grammar.percussion;
                if (percRule && percRule.types.length > 0) {
                    const timeSlots = percRule.allowedTimes;
                    const targetTime = timeSlots[this.random.nextInt(timeSlots.length)];
                    if (!newEvents.some(e => Math.abs(e.time - targetTime) < 0.1)) {
                        newEvents.push({
                            type: percRule.types[this.random.nextInt(percRule.types.length)], note: 36, duration: 0.1, time: targetTime, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: getParamsForTechnique('hit', this.config.mood, this.config.genre)
                        });
                        mutationApplied = true;
                    }
                }
                break;
            case 2: // Rhythmic shift (syncopation)
                const snareIndex = newEvents.findIndex(e => e.type === 'drum_snare');
                if (snareIndex > -1 && this.random.next() > 0.5) { 
                    newEvents[snareIndex].time += (this.random.next() > 0.5 ? 0.25 : -0.25);
                    newEvents[snareIndex].time = (newEvents[snareIndex].time + 4) % 4; // Wrap around bar
                    mutationApplied = true;
                } else { 
                    const snareToReplace = newEvents.find(e => e.type === 'drum_snare');
                    if (snareToReplace) {
                        snareToReplace.type = 'drum_tom_mid';
                        mutationApplied = true;
                    }
                }
                break;
            case 3: // Double hi-hat time
                const hihats = newEvents.filter(e => e.type === 'drum_hihat_closed');
                if (hihats.length > 0 && this.random.next() > 0.5) {
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
    if (this.needsBassReset) {
        console.log("%c[RESET] Bass branch reset triggered.", "color: red; font-weight: bold;");
        this.branches = this.branches.filter(b => b.type !== 'bass' || b.id.includes('axon'));
        const newAxiom = createBassAxiom(this.config.mood, this.config.genre, this.random, this.branches.find(b => b.type === 'drums')?.events.map(e => e.type.toString()) ?? []);
        this.branches.push({ id: `bass_axon_${this.epoch}`, events: newAxiom, weight: 1.2, age: 0, technique: 'pluck', type: 'bass' });
        this.needsBassReset = false;
    }

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

    // Update weights
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

    // Normalize weights within each type (bass, drums)
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
