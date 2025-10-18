

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, STYLE_BASS_PATTERNS, type BassPatternDefinition, STYLE_PERCUSSION_RULES } from './music-theory';

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
  if (genre === 'ambient') {
     return { cutoff: 150, resonance: 1.1, distortion: 0.0, portamento: 0.1, attack: 0.8, release: 2.0 };
  }
  switch (technique) {
    case 'pluck':
      return { cutoff: 800, resonance: 0.3, distortion: 0.1, portamento: 0.01 };
    case 'ghost':
      return { cutoff: 450, resonance: 0.2, distortion: 0.0, portamento: 0.0 };
    case 'slap':
       return { cutoff: 1200, resonance: 0.5, distortion: 0.3, portamento: 0.0 };
    case 'fill':
       return { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };
    case 'swell':
       return { cutoff: 200, resonance: 1.1, distortion: 0.0, portamento: 0.1, attack: 0.8, release: 2.0 };
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

    const allBaseEvents = [...(loop.kick || []), ...(loop.snare || []), ...(loop.hihat || [])];
    for (const baseEvent of allBaseEvents) {
        if (baseEvent.probability && random.next() > baseEvent.probability) {
            continue;
        }

        let instrumentType: InstrumentType;
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
        
        // Bass and Drums jam together
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
    
    // Ambient fills are slower and more melodic
    const numNotes = genre === 'ambient' ? random.nextInt(2) + 3 : random.nextInt(4) + 7; // 3-4 for ambient, 7-10 for others
    const baseDuration = genre === 'ambient' ? 1.0 : 0.25;

    let currentTime = 0;

    const selectNote = (lastNote?: number): number => {
        const lastNoteIndex = lastNote !== undefined ? scale.indexOf(lastNote) : -1;
        const r = random.next();
        if (lastNoteIndex !== -1 && r < 0.6) {
            const step = random.next() > 0.5 ? 1 : -1;
            return scale[(lastNoteIndex + step + scale.length) % scale.length];
        } else if (r < 0.85) { 
            const chordToneIndices = [0, 2, 4, 6].filter(i => i < scale.length);
            return scale[chordToneIndices[random.nextInt(chordToneIndices.length)]];
        } else { 
             const step = random.next() > 0.5 ? (random.nextInt(3) + 2) : -(random.nextInt(3) + 2);
             const targetIndex = (lastNoteIndex !== -1 ? lastNoteIndex : 0) + step;
             return scale[ (targetIndex + scale.length) % scale.length ];
        }
    };

    let currentNote = selectNote();

    for (let i = 0; i < numNotes; i++) {
        let duration: number;
        const rhythmChoice = random.next();
        if (rhythmChoice < 0.5) duration = baseDuration;
        else if (rhythmChoice < 0.8) duration = baseDuration * 2;
        else if (rhythmChoice < 0.95) duration = baseDuration * 1.5;
        else duration = baseDuration / 2;

        if (currentTime + duration > 4.0) break;

        fill.push({
            type: 'bass', note: currentNote, duration, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams
        });
        
        currentTime += duration;
        currentNote = selectNote(currentNote);
    }
    
    if (currentTime > 4.0 && currentTime > 0) {
        const scaleFactor = 4.0 / currentTime;
        fill.forEach(e => {
            e.time *= scaleFactor;
            e.duration *= scaleFactor;
        });
    }
    
    const maxNote = Math.max(...scale);
    const highNoteThreshold = maxNote - 12;
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
  private bassShouldRespond: boolean = false;

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
    this.bassShouldRespond = false;
  }

  // Scenario 3: "Jam" - creates both drum and bass fills.
  // Also sets up Scenario 2: "Bass follows Drummer"
  public generateExternalImpulse() {
    console.log(`%c[WEATHER EVENT] at epoch ${this.epoch}: Triggering linked mutation.`, "color: blue; font-weight: bold;");
    
    const { drumFill, bassFill } = createRhythmSectionFill(this.config.mood, this.config.genre, this.random);

    this.drumFillForThisEpoch = drumFill;
    console.log(`%c  -> Created ONE-OFF DRUM fill for this epoch.`, "color: blue;");

    // Signal that the bass should respond on the next tick
    this.bassShouldRespond = true; 
    console.log(`%c  -> Bass response queued for next epoch.`, "color: blue;");
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
      const fillProbability = this.config.genre === 'ambient' ? 0.2 : 0.8;
      if (this.random.next() > fillProbability) return null;
        
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
        const mutationType = this.random.nextInt(5);
        let mutationApplied = false;

        switch(mutationType) {
            case 0: // Replace hi-hat with ride
                newEvents.forEach(e => {
                    if (e.type === 'drum_hihat_closed' && this.random.next() > 0.7) {
                        e.type = 'drum_ride';
                        mutationApplied = true;
                    }
                });
                if(mutationApplied) console.log(`[DrumMutation] Swapped hi-hat for ride.`);
                break;
            case 1: // Add ghost notes
                 let addedGhosts = 0;
                 parent.events.forEach(event => {
                    if (['drum_kick', 'drum_snare'].includes(event.type) && this.random.next() > 0.5) {
                        newEvents.push({ ...event, type: 'drum_snare_ghost_note', time: event.time - 0.125, duration: 0.1, weight: 0.2, technique: 'ghost', dynamics: 'p' } as FractalEvent);
                        addedGhosts++;
                    }
                 });
                 if (addedGhosts > 0) {
                     console.log(`[DrumMutation] Added ${addedGhosts} ghost notes.`);
                     mutationApplied = true;
                 }
                 break;
            case 2: // Rhythmic shift (syncopation)
                const snareIndex = newEvents.findIndex(e => e.type === 'drum_snare');
                if (snareIndex > -1 && this.random.next() > 0.5) { 
                    const shiftAmount = this.random.next() > 0.5 ? 0.25 : -0.25;
                    newEvents[snareIndex].time += shiftAmount;
                    newEvents[snareIndex].time = (newEvents[snareIndex].time + 4) % 4;
                    console.log(`[DrumMutation] Shifted snare by ${shiftAmount}.`);
                    mutationApplied = true;
                } else { 
                    const snareToReplace = newEvents.find(e => e.type === 'drum_snare');
                    if (snareToReplace) {
                        snareToReplace.type = 'drum_tom_mid';
                        console.log(`[DrumMutation] Replaced snare with mid tom.`);
                        mutationApplied = true;
                    }
                }
                break;
            case 3: // Double hi-hat time
                const hihats = newEvents.filter(e => e.type === 'drum_hihat_closed');
                if (hihats.length > 0 && this.random.next() > 0.5) {
                    const targetHat = hihats[this.random.nextInt(hihats.length)];
                    newEvents.push({...targetHat, time: targetHat.time + 0.25 });
                    console.log(`[DrumMutation] Doubled a hi-hat hit.`);
                    mutationApplied = true;
                }
                break;
            case 4: // Percussion Fill
                const percRule = STYLE_PERCUSSION_RULES[this.config.genre];
                if (percRule && percRule.types.length > 0) {
                    const occupiedTimes = new Set(newEvents.map(e => e.time));
                    let availableTimes = percRule.allowedTimes.filter(t => !occupiedTimes.has(t));
                    const fillLength = this.random.nextInt(3) + 5; 
                    
                    if (availableTimes.length >= fillLength) {
                        console.log(`[DrumMutation] Generating a ${fillLength}-hit percussion fill.`);
                        for (let i = 0; i < fillLength; i++) {
                            if (availableTimes.length === 0) break;
                            const timeIndex = this.random.nextInt(availableTimes.length);
                            const time = availableTimes.splice(timeIndex, 1)[0];
                            const type = percRule.types[this.random.nextInt(percRule.types.length)];
                            newEvents.push({ type, note: 36, duration: 0.25, time, weight: percRule.weight * 0.9, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: getParamsForTechnique('hit', this.config.mood, this.config.genre) } as FractalEvent);
                        }
                        mutationApplied = true;
                    }
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
    
    // Scenario 2: Bass responds to a previous drum fill
    if (this.bassShouldRespond) {
        const newFill = createBassFill.call(this, this.config.mood, this.config.genre, this.random);
        if (newFill.length > 0) {
            this.branches.push({
                id: `bass_response_${this.epoch}`,
                events: newFill,
                weight: 1.8, // High weight to ensure it plays
                age: 0,
                technique: 'fill',
                type: 'bass'
            });
            console.log(`%c[BASS RESPONSE] at epoch ${this.epoch}: Created bass fill branch.`, "color: purple;");
        }
        this.bassShouldRespond = false;
    }


    const bassBranches = this.branches.filter(b => b.type === 'bass');
    const drumBranches = this.branches.filter(b => b.type === 'drums');
    
    const winningBassBranch = bassBranches.length > 0
        ? bassBranches.reduce((max, b) => b.weight > max.weight ? b : max, bassBranches[0])
        : null;

    if (winningBassBranch) {
        winningBassBranch.events.forEach(event => {
            const newEvent: FractalEvent = { ...event };
            newEvent.phrasing = winningBassBranch.weight > 0.7 ? 'legato' : 'staccato';
            newEvent.params = getParamsForTechnique(newEvent.technique, this.config.mood, this.config.genre);
            output.push(newEvent);
        });
    }

    if (drumBranches.length > 0) {
        const winningDrumBranch = drumBranches.reduce((max, b) => b.weight > max.weight ? b : max, drumBranches[0]);
        let drumEvents = [...winningDrumBranch.events]; 
        
        if (this.drumFillForThisEpoch) {
            drumEvents = this.drumFillForThisEpoch;
            this.drumFillForThisEpoch = null;
        } else if (winningBassBranch?.technique === 'fill') { // Scenario 1: Drummer follows Bass
            console.log(`%c[DRUM RESPONSE] at epoch ${this.epoch}: Bass is playing a fill, generating drum response.`, "color: #007acc;");
            const { drumFill } = createRhythmSectionFill(this.config.mood, this.config.genre, this.random);
            const baseBeat = drumEvents.filter(e => e.time < 2.0);
            drumEvents = [...baseBeat, ...drumFill];
        } else {
            const percRule = STYLE_PERCUSSION_RULES[this.config.genre];
            if (percRule && this.config.drumSettings.enabled) {
                const dynamicProbability = percRule.probability * Math.max(0.2, Math.min(1.5, (120 / this.config.tempo)));
                
                if (this.random.next() < dynamicProbability) {
                    const occupiedTimes = new Set(drumEvents.map(e => e.time));
                    let availableTimes = percRule.allowedTimes.filter(t => !occupiedTimes.has(t));
                    const percPool = percRule.types;
                    
                    if (availableTimes.length > 0 && percPool.length > 0) {
                        // Generate a longer fill with a small probability
                        if (this.random.next() > 0.7) { 
                            const fillLength = this.random.nextInt(3) + 5; 
                            for (let i = 0; i < fillLength; i++) {
                                if (availableTimes.length === 0) break;
                                const timeIndex = this.random.nextInt(availableTimes.length);
                                const time = availableTimes.splice(timeIndex, 1)[0];
                                const type = percPool[this.random.nextInt(percPool.length)];
                                drumEvents.push({ type, time, duration: 0.25, weight: percRule.weight * 0.9, note: 36, phrasing: 'staccato', dynamics: 'p', params: getParamsForTechnique('hit', this.config.mood, this.config.genre) } as FractalEvent);
                            }
                        } else { 
                            const time = availableTimes[this.random.nextInt(availableTimes.length)];
                            const type = percPool[this.random.nextInt(percPool.length)];
                            drumEvents.push({ type, time, duration: 0.25, weight: percRule.weight, note: 36, phrasing: 'staccato', dynamics: 'p', params: getParamsForTechnique('hit', this.config.mood, this.config.genre) } as FractalEvent);
                        }
                    }
                }
            }
        }
        
        drumEvents.forEach(event => {
            output.push({ ...event, weight: event.weight ?? 1.0 });
        });
    }
    
    const shouldMutateBass = this.random.next() < (this.config.density * 0.4);
    const shouldMutateDrums = this.random.next() < (this.config.density * 0.4); 

    if (this.epoch > 0 && this.epoch % 2 === 0) { 
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
        switch (this.config.mood) {
          case 'joyful':
          case 'enthusiastic':
          case 'epic':
              if (phase < 0.3) return 0.6 + phase * 1.3;
              if (phase < 0.6) return 1.0;
              return 1.0 - (phase - 0.6) * 1.8;
          case 'melancholic':
          case 'calm':
          case 'dark':
          case 'anxious':
              if (phase < 0.4) return 0.3 + phase * 1.5;
              if (phase < 0.7) return 1.0;
              return 1.0 - (phase - 0.7) * 2.3;
          case 'dreamy':
          case 'contemplative':
          default:
              return 0.4 + Math.sin(phase * Math.PI) * 0.3; // Gentle sine wave
        }
    };
  }
}
