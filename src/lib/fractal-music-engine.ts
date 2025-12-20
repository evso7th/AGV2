

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique } from '@/types/fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, mutateBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill as createBassFillFromTheory, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument } from './music-theory';

export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
  type: 'bass' | 'drums' | 'accompaniment' | 'harmony' | 'melody';
  endTime: number; // Абсолютное время окончания последнего события в ветке
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
  composerControlsInstruments?: boolean;
}

type PlayPlanItem = {
    phraseIndex: number;
    repetitions: number;
    instrument: AccompanimentInstrument;
};

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

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

const isBass = (event: FractalEvent): boolean => event.type === 'bass';
const isAccompaniment = (event: FractalEvent): boolean => event.type === 'accompaniment';
const isHarmony = (event: FractalEvent): boolean => event.type === 'harmony';


// === АКСОМЫ И ТРАНСФОРМАЦИИ ===
function createDrumAxiom(genre: Genre, mood: Mood, tempo: number, random: { next: () => number, nextInt: (max: number) => number }): { events: FractalEvent[], tags: string[] } {
    const hitParams = {}; // Params now come from events
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

function createSfxScenario(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { drumFill: FractalEvent[], bassFill: FractalEvent[], accompanimentFill: FractalEvent[] } {
    const drumFill: FractalEvent[] = [];
    const bassFill: FractalEvent[] = [];
    const accompanimentFill: FractalEvent[] = [];
    
    const scale = getScaleForMood(mood);
    const rootNote = scale[random.nextInt(Math.floor(scale.length / 2))]; // Select a root from the lower half of the scale
    const isMinor = mood === 'melancholic' || mood === 'dark';
    const third = rootNote + (isMinor ? 3 : 4);
    const fifth = rootNote + 7;
    const chord = [rootNote, third, fifth].filter(n => scale.some(sn => sn % 12 === n % 12));

    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };

    const fillDensity = random.nextInt(4) + 3; // 3 to 6 notes for the core rhythm
    let fillTime = 3.0; // Start the fill in the last beat

    for(let i = 0; i < fillDensity; i++) {
        const duration = (1.0 / fillDensity) * (0.8 + random.next() * 0.4); // slightly variable duration
        const currentTime = fillTime;
        
        const drumInstruments: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_snare'];
        const drumInstrument = drumInstruments[random.nextInt(drumInstruments.length)];
        drumFill.push({ type: drumInstrument, note: 40 + i, duration, time: currentTime, weight: 0.7 + random.next() * 0.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: {} });

        if (random.next() > 0.3) {
             bassFill.push({ type: 'bass', note: chord[random.nextInt(chord.length)], duration: duration * 0.9, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'mf', phrasing: 'staccato', params: fillParams });
        }
        
        fillTime += duration;
    }
    
    const climaxTime = Math.min(3.75, fillTime);
    drumFill.push({ type: 'drum_crash', note: 49, duration: 1, time: climaxTime, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'legato', params: {} });
    if (random.next() > 0.2) {
      bassFill.push({ type: 'bass', note: rootNote, duration: 0.5, time: climaxTime, weight: 1.0, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
    }

    return { drumFill, bassFill, accompanimentFill };
}

function extractTopNotes(events: FractalEvent[], maxNotes: number = 4): FractalEvent[] {
    if (events.length === 0) return [];
    
    const timeTolerance = 0.1; 
    const groupedByTime: Map<number, FractalEvent[]> = new Map();

    for (const event of events) {
        let foundGroup = false;
        for (const time of groupedByTime.keys()) {
            if (Math.abs(time - event.time) < timeTolerance) {
                groupedByTime.get(time)!.push(event);
                foundGroup = true;
                break;
            }
        }
        if (!foundGroup) {
            groupedByTime.set(event.time, [event]);
        }
    }

    const topNotes: FractalEvent[] = [];
    for (const group of groupedByTime.values()) {
        const topNote = group.reduce((max, current) => (current.note > max.note ? current : max));
        topNotes.push(topNote);
    }
    
    return topNotes
        .sort((a, b) => a.time - b.time)
        .slice(0, maxNotes);
}


// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig;
  private time: number = 0;
  private epoch = 0;
  private random: { next: () => number; nextInt: (max: number) => number };
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private lastAccompanimentEndTime: number = -Infinity;
  private nextAccompanimentDelay: number = 0;
  
  private branches: Branch[] = [];
  private harmonyBranches: Branch[] = [];


  private bassPhraseLibrary: FractalEvent[][] = [];
  private bassPlayPlan: { phraseIndex: number, repetitions: number }[] = [];
  private currentBassPlanIndex: number = 0;
  private currentBassRepetition: number = 0;
  private barsInCurrentBassPhrase: number = 0;

  private accompPhraseLibrary: FractalEvent[][] = [];
  private accompPlayPlan: PlayPlanItem[] = [];
  private currentAccompPlanIndex: number = 0;
  private currentAccompRepetition: number = 0;
  private barsInCurrentAccompPhrase: number = 0;


  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed ?? Date.now());
    this.nextWeatherEventEpoch = 0;
    
    this.initialize();
  }

  public get tempo(): number { return this.config.tempo; }
  

  public updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      this.config = { ...this.config, ...newConfig };

      if(moodOrGenreChanged) {
          this.initialize();
      }
  }

  private initialize() {
    this.random = seededRandom(this.config.seed ?? Date.now());
    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5; 
    this.branches = [];
    this.harmonyBranches = [];
    
    if (this.config.drumSettings.enabled) {
        const { events: drumAxiom } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        this.branches.push({ id: "drum_axiom_0", events: drumAxiom, weight: 1, age: 0, technique: "hit", type: "drums", endTime: 0 });
    }

    this.createBassAxiomAndPlan();
    
    const initialBassNote = this.bassPhraseLibrary[0]?.[0]?.note ?? getScaleForMood(this.config.mood)[0] ?? 40;
    const harmonyAxiom = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, initialBassNote, this.config.tempo);
    if (harmonyAxiom.length > 0) {
        const endTime = harmonyAxiom.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
        this.harmonyBranches.push({ id: `harmony_axiom_0`, events: harmonyAxiom, weight: 1, age: 0, technique: 'swell', type: 'harmony', endTime });
    }
    
    this.needsBassReset = false;
  }

  private createBassAxiomAndPlan() {
      this.bassPhraseLibrary = [];
      const numPhrases = 2 + this.random.nextInt(3); 
      
      const anchorPhrase = generateAmbientBassPhrase(this.config.mood, this.config.genre, this.random, this.config.tempo);
      this.bassPhraseLibrary.push(anchorPhrase);

      for (let i = 1; i < numPhrases; i++) {
          this.bassPhraseLibrary.push(mutateBassPhrase(anchorPhrase, this.config.mood, this.config.genre, this.random));
      }

      this.bassPlayPlan = [];
      const planLength = 3 + this.random.nextInt(2);
      for (let i = 0; i < planLength; i++) {
          this.bassPlayPlan.push({
              phraseIndex: this.random.nextInt(numPhrases),
              repetitions: 1 + this.random.nextInt(3)
          });
      }
      
      this.currentBassPlanIndex = 0;
      this.currentBassRepetition = 0;
      this.barsInCurrentBassPhrase = 0;
      console.log(`[BassAxiom] Created new bass plan with ${numPhrases} related phrases. Plan length: ${planLength}`);
  }
  
  private chooseWeightedInstrument(weights: Record<string, number>): AccompanimentInstrument {
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      let rand = this.random.next() * totalWeight;

      for (const [instrument, weight] of Object.entries(weights)) {
          rand -= weight;
          if (rand <= 0) {
              return instrument as AccompanimentInstrument;
          }
      }
      return 'synth'; // Fallback
  }

  private createAccompAxiomAndPlan() {
      // This is now handled within the harmony branch logic
  }

  public generateExternalImpulse() {
    console.log(`%c[WEATHER EVENT] at epoch ${this.epoch}: Triggering musical scenario.`, "color: blue; font-weight: bold;");
    
    const { drumFill, bassFill, accompanimentFill } = createSfxScenario(this.config.mood, this.config.genre, this.random);

    this.sfxFillForThisEpoch = {
        drum: drumFill,
        bass: bassFill,
        accompaniment: accompanimentFill
    };
    
    console.log(`%c  -> Created ONE-OFF musical scenario for this epoch.`, "color: blue;");
  }

  private selectBranchForMutation(type: Branch['type']): Branch | null {
      const candidates = (type === 'accompaniment' || type === 'harmony' || type === 'melody') ? this.harmonyBranches : this.branches.filter(b => b.type === type);
      if (candidates.length === 0) return null;
      return candidates.reduce((a, b) => a.weight > b.weight ? a : b);
  }

  private mutateBranch(parent: Branch): Branch | null {
      if (!parent) return null;
      let newEvents;

      if (parent.type === 'bass') {
          const { events, penalty } = createBassFillFromTheory(this.config.mood, this.config.genre, this.random);
          if (penalty > 0) this.needsBassReset = true;
          newEvents = events;
      } else if (parent.type === 'harmony' || parent.type === 'accompaniment' || parent.type === 'melody') {
          const bassNote = this.branches.find(isBass)?.events[0]?.note ?? getScaleForMood(this.config.mood)[0] ?? 40;
          newEvents = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassNote, this.config.tempo);
      } else { // drums
           const { events } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
           newEvents = events;
      }
      
      if (newEvents.length === 0) return null;

      const endTime = newEvents.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
      return {
          id: `${parent.type}_mut_${this.epoch}`,
          events: newEvents,
          weight: 1.0,
          age: 0,
          technique: parent.technique,
          type: parent.type,
          endTime,
      };
  }

  private applyNaturalDecay(events: FractalEvent[], barDuration: number): FractalEvent[] {
    const bassEvents = events.filter(isBass);
    if (bassEvents.length === 0) return events;

    const lastBassEvent = bassEvents.reduce((last, current) => (current.time > last.time ? current : last));

    if (lastBassEvent.time + lastBassEvent.duration >= barDuration - 0.1) {
        if (!lastBassEvent.params) {
            lastBassEvent.params = { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: 0.2 };
        }
        (lastBassEvent.params as BassSynthParams).release = Math.min(lastBassEvent.duration * 0.8, 1.5);
    }
    return events;
  }
  
 private generateOneBar(barDuration: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    let instrumentHints: InstrumentHints = {};
    const output: FractalEvent[] = [];

    const bassPlanItem = this.bassPlayPlan[this.currentBassPlanIndex];
    let bassPhraseForThisBar: FractalEvent[] = [];
    if (bassPlanItem && this.bassPhraseLibrary.length > 0) {
        const phrase = this.bassPhraseLibrary[bassPlanItem.phraseIndex];
        const phraseDurationInBars = Math.ceil(phrase.reduce((max, e) => Math.max(max, e.time + e.duration), 0) / 4);

        if (this.barsInCurrentBassPhrase === 0) {
            bassPhraseForThisBar = phrase;
        }

        this.barsInCurrentBassPhrase++;

        if (this.barsInCurrentBassPhrase >= phraseDurationInBars) {
            this.currentBassRepetition++;
            this.barsInCurrentBassPhrase = 0; 
            
            if (this.currentBassRepetition >= bassPlanItem.repetitions) {
                this.currentBassRepetition = 0;
                this.currentBassPlanIndex++;
                
                if (this.currentBassPlanIndex >= this.bassPlayPlan.length) {
                    this.createBassAxiomAndPlan(); 
                    console.log(`%c[BASS PLAN] Loop finished. Regenerating.`, 'color: #FF7F50');
                }
            }
        }
    } else {
        this.createBassAxiomAndPlan();
    }

    let drumEvents: FractalEvent[] = [];
    if (this.config.drumSettings.enabled) {
        const drumBranches = this.branches.filter(b => b.type === 'drums');
        if (drumBranches.length > 0) {
            const winningDrumBranch = drumBranches.reduce((max, b) => b.weight > max.weight ? b : max, drumBranches[0]);
            drumEvents.push(...winningDrumBranch.events.map(event => ({ ...event, weight: 1 })));
        }
    }
    
    if (this.sfxFillForThisEpoch?.drum) {
        drumEvents = this.sfxFillForThisEpoch.drum;
    }
    if (this.sfxFillForThisEpoch?.bass) {
        bassPhraseForThisBar = this.sfxFillForThisEpoch.bass;
    }


    output.push(...bassPhraseForThisBar);
    output.push(...drumEvents);
    
    const accompBranches = this.harmonyBranches.filter(b => b.type === 'harmony' || b.type === 'accompaniment');
    let accompanimentEvents: FractalEvent[] = [];
    if (accompBranches.length > 0) {
        const winningAccompBranch = accompBranches.reduce((max, b) => b.weight > max.weight ? b : max, accompBranches[0]);
        accompanimentEvents.push(...winningAccompBranch.events);
        
        const harmonyEvents = accompanimentEvents.map(event => ({
            ...event,
            type: 'harmony' as InstrumentType,
        }));
        
        console.log(`[harmony] Composer generated ${harmonyEvents.length} events for harmony.`);
        
        output.push(...accompanimentEvents);
        output.push(...harmonyEvents);
        
        instrumentHints.harmony = chooseHarmonyInstrument(this.config.mood, this.random);
        instrumentHints.accompaniment = 'synth';
        if (this.config.composerControlsInstruments){
            const possibleInstruments: MelodyInstrument[] = ["violin", "flute", "synth", "organ", "mellotron", "theremin"];
            instrumentHints.accompaniment = possibleInstruments[this.random.nextInt(possibleInstruments.length)];
        }
    }

    const topNotes = extractTopNotes(accompanimentEvents, 4);
    if(topNotes.length > 0) {
        const melodyEvents = topNotes.map(note => ({
            ...note,
            type: 'melody' as InstrumentType,
            weight: Math.min(1.0, note.weight * 1.2), 
        }));
        output.push(...melodyEvents);
    }


    if (this.sfxFillForThisEpoch) {
        this.sfxFillForThisEpoch = null;
    }

    const finalEvents = this.applyNaturalDecay(output, 4.0);
    return { events: finalEvents, instrumentHints };
  }


  private evolveBranches() {
    const lambda = this.config.lambda;
    const delta = 1.0; 
    
    const getResonance = (branch: Branch, allBranches: Branch[]) => {
      return allBranches.reduce((sum, other) => {
        if (!branch.events[0] || !other.events[0] || other.id === branch.id || other.type === branch.type) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], { mood: this.config.mood, tempo: this.config.tempo, delta, genre: this.config.genre });
        return sum + k * delta * other.weight;
      }, 0);
    };

    const allBranches = [...this.branches, ...this.harmonyBranches];
    
    this.branches.forEach(branch => {
      const resonanceSum = getResonance(branch, allBranches);
      branch.weight = ((1 - lambda) * branch.weight) + resonanceSum;
      branch.age++;
    });

    this.harmonyBranches.forEach(branch => {
      const resonanceSum = getResonance(branch, allBranches);
      branch.weight = ((1 - lambda) * branch.weight) + resonanceSum;
      branch.age++;
    });

    if (this.epoch % 2 === 1) {
        if (this.random.next() < this.config.density * 0.4 && this.branches.filter(b => b.type === 'bass').length < 4) {
            const parent = this.selectBranchForMutation('bass');
            if (parent) {
                const child = this.mutateBranch(parent);
                if (child) this.branches.push(child);
            }
        }
        if (this.random.next() < this.config.density * 0.3 && this.harmonyBranches.length < 4) {
             const parent = this.selectBranchForMutation('harmony');
             if (parent) {
                 const child = this.mutateBranch(parent);
                 if (child) this.harmonyBranches.push(child);
             }
        }
    }
    
    this.branches = this.branches.filter(b => b.weight > 0.05 || b.age < 8);
    this.harmonyBranches = this.harmonyBranches.filter(b => b.weight > 0.05 || b.age < 5);

    ['bass', 'drums'].forEach(type => {
      const typeBranches = this.branches.filter(b => b.type === type);
      const totalWeight = typeBranches.reduce((sum, b) => sum + b.weight, 0);
      if (totalWeight > 0) typeBranches.forEach(b => b.weight /= totalWeight);
    });
    
    const harmonyTotalWeight = this.harmonyBranches.reduce((sum, b) => sum + b.weight, 0);
    if(harmonyTotalWeight > 0) {
        this.harmonyBranches.forEach(b => b.weight /= harmonyTotalWeight);
    }
    
    if (this.branches.filter(b => b.type === 'bass').length === 0) {
        console.log(`%c[BASS REVIVAL] Creating new bass axiom.`, "color: #4169E1;");
        this.createBassAxiomAndPlan();
    }
     if (this.harmonyBranches.length === 0 && this.epoch > 2) {
        console.log(`%c[HARMONY REVIVAL] Creating new harmony axiom.`, "color: #DA70D6;");
        const bassNote = this.branches.find(isBass)?.events[0]?.note ?? getScaleForMood(this.config.mood)[0] ?? 40;
        const harmonyAxiom = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassNote, this.config.tempo);
        if (harmonyAxiom.length > 0) {
            const endTime = harmonyAxiom.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
            this.harmonyBranches.push({ id: `harmony_axiom_${this.epoch}`, events: harmonyAxiom, weight: 1, age: 0, technique: 'swell', type: 'harmony', endTime });
        }
    }
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    this.epoch = barCount;
    
    if (this.needsBassReset) {
        console.log(`%c[RESET] Bass reset flag is true. Resetting...`, 'color: red');
        this.createBassAxiomAndPlan();
        this.needsBassReset = false;
    }

    if (this.epoch > 0 && this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch = this.epoch + this.random.nextInt(12) + 8;
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };

    this.evolveBranches();
    
    const { events, instrumentHints } = this.generateOneBar(barDuration);
    
    this.time += barDuration;
    return { events, instrumentHints };
  }
}
