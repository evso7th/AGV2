
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, STYLE_BASS_PATTERNS, type BassPatternDefinition, PERCUSSION_SETS, generateAmbientBassPhrase, mutateBassPhrase, createAccompanimentAxiom } from './music-theory';

export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
  type: 'bass' | 'drums' | 'accompaniment';
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
    case 'swell':
       return { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: 0.5, release: 1.5 };
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

const isBass = (event: FractalEvent): boolean => event.type === 'bass';


// === АКСОМЫ И ТРАНСФОРМАЦИИ ===
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

    const hitParams = getParamsForTechnique('hit', mood, genre);
    const fillParams = getParamsForTechnique('fill', mood, genre);

    const fillDensity = random.nextInt(4) + 3; // 3 to 6 notes for the core rhythm
    let fillTime = 3.0; // Start the fill in the last beat

    for(let i = 0; i < fillDensity; i++) {
        const duration = (1.0 / fillDensity) * (0.8 + random.next() * 0.4); // slightly variable duration
        const currentTime = fillTime;
        
        // --- DRUMS ---
        const drumInstruments: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_snare'];
        const drumInstrument = drumInstruments[random.nextInt(drumInstruments.length)];
        drumFill.push({ type: drumInstrument, note: 40 + i, duration, time: currentTime, weight: 0.7 + random.next() * 0.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: hitParams });

        // --- BASS (synchronized with drums) ---
        if (random.next() > 0.3) {
             bassFill.push({ type: 'bass', note: chord[random.nextInt(chord.length)], duration: duration * 0.9, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'mf', phrasing: 'staccato', params: fillParams });
        }

        // --- ACCOMPANIMENT (chord stabs or short arps) ---
        if (random.next() > 0.6) {
            const accompNote = chord[random.nextInt(chord.length)] + 12; // One octave higher
            accompanimentFill.push({ type: 'accompaniment', note: accompNote, duration: duration, time: currentTime, weight: 0.6 + random.next() * 0.2, technique: 'swell', dynamics: 'p', phrasing: 'staccato', params: getParamsForTechnique('swell', mood, genre) });
        }
        
        fillTime += duration;
    }
    
    // --- CLIMAX ---
    const climaxTime = Math.min(3.75, fillTime);
    drumFill.push({ type: 'drum_crash', note: 49, duration: 1, time: climaxTime, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'legato', params: hitParams });
    if (random.next() > 0.2) {
      bassFill.push({ type: 'bass', note: rootNote, duration: 0.5, time: climaxTime, weight: 1.0, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
    }

    return { drumFill, bassFill, accompanimentFill };
}


function createBassFill(this: FractalMusicEngine, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const fill: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const fillParams = getParamsForTechnique('fill', mood, genre);
    const numNotes = random.nextInt(4) + 7; // 7 to 10 notes
    let currentTime = 0;
    
    // Predominantly low, infrequently mid, rarely high
    const selectNote = (): number => {
      const rand = random.next();
      if (rand < 0.7) { // 70% chance low register
          const third = Math.floor(scale.length / 3);
          return scale[random.nextInt(third)];
      } else if (rand < 0.95) { // 25% chance mid register
          const third = Math.floor(scale.length / 3);
          return scale[third + random.nextInt(third)];
      } else { // 5% chance high register
          const twoThirds = Math.floor(2 * scale.length / 3);
          return scale[twoThirds + random.nextInt(scale.length - twoThirds)];
      }
    };

    let currentNote = selectNote();
    let lastNote = -1;
    let secondLastNote = -1;

    for (let i = 0; i < numNotes; i++) {
        const duration = (genre === 'rock' || genre === 'trance' || genre === 'progressive') ? 0.25 : 0.5;
        
        let noteIndex = scale.indexOf(currentNote);
        let step;
        let attempts = 0;

        // "Запрет на монотонность"
        do {
            step = random.next() > 0.7 ? (random.next() > 0.5 ? 2 : -2) : (random.next() > 0.5 ? 1 : -1);
            let newNoteIndex = (noteIndex + step + scale.length) % scale.length;
            if (Math.abs(scale[newNoteIndex] - currentNote) > 12) {
                 newNoteIndex = (noteIndex - step + scale.length) % scale.length;
            }
            currentNote = scale[newNoteIndex];
            noteIndex = newNoteIndex;
            attempts++;
        } while(currentNote === lastNote && currentNote === secondLastNote && attempts < 10);
        

        fill.push({
            type: 'bass', note: currentNote, duration: duration, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams
        });
        currentTime += duration;
        secondLastNote = lastNote;
        lastNote = currentNote;
    }
    
    if (currentTime > 4.0) {
        const scaleFactor = 4.0 / currentTime;
        fill.forEach(e => {
            e.time *= scaleFactor;
            e.duration *= scaleFactor;
        });
    }
    
    const highNoteThreshold = 52; // E3
    const hasHighNotes = fill.some(n => n.note > highNoteThreshold);
    
    if (hasHighNotes) {
        console.warn(`[BassFillPenalty] High-register fill detected. Applying penalty.`);
        fill.forEach(e => e.weight *= 0.2); 
        this.needsBassReset = true; 
    }


    return fill;
}

type PlayPlanItem = {
    phraseIndex: number;
    repetitions: number;
};


// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig;
  private branches: Branch[] = [];
  private time: number = 0;
  private lambda: number;
  private epoch = 0;
  private random: { next: () => number; nextInt: (max: number) => number };
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private nextAccompPlanRegenEpoch: number = 0;
  private nextHarmonyEventEpoch: number = 0;

  // Композитор Фраз для Баса
  private bassPhraseLibrary: FractalEvent[][] = [];
  private bassPlayPlan: PlayPlanItem[] = [];
  private currentBassPlanIndex: number = 0;
  private currentBassRepetition: number = 0;
  private barsInCurrentBassPhrase: number = 0;

  // Композитор Фраз для Аккомпанемента (Текстурный слой)
  private accompPhraseLibrary: FractalEvent[][] = [];
  private accompPlayPlan: PlayPlanItem[] = [];
  private currentAccompPlanIndex: number = 0;
  private currentAccompRepetition: number = 0;
  private barsInCurrentAccompPhrase: number = 0;


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
    this.nextHarmonyEventEpoch = this.random.nextInt(8) + 8; // 8-15
    this.branches = [];
    
    if (this.config.drumSettings.enabled) {
        const { events: drumAxiom } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        this.branches.push({ id: 'drum_axon', events: drumAxiom, weight: 1.0, age: 0, technique: 'hit', type: 'drums', endTime: 0 });
    }
    
    this.createBassAxiomAndPlan();
    this.createAccompAxiomAndPlan();

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

  private createAccompAxiomAndPlan() {
      this.accompPhraseLibrary = [];
      const numPhrases = 4 + this.random.nextInt(2); // 4-5 фраз в бандле

      // Находим текущую или первую басовую ноту для гармонической привязки
      const bassNote = this.bassPhraseLibrary[0]?.[0]?.note ?? getScaleForMood(this.config.mood)[0];
      
      const anchorPhrase = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassNote, this.config.tempo);
      this.accompPhraseLibrary.push(anchorPhrase);
      
      for (let i = 1; i < numPhrases; i++) {
          // Мутации для аккомпанемента могут быть более смелыми
          this.accompPhraseLibrary.push(mutateBassPhrase(anchorPhrase, this.config.mood, this.config.genre, this.random)); 
      }

      this.accompPlayPlan = [];
      const planLength = 4 + this.random.nextInt(3);
      for (let i = 0; i < planLength; i++) {
          this.accompPlayPlan.push({
              phraseIndex: this.random.nextInt(numPhrases),
              repetitions: 1 + this.random.nextInt(2) // не повторять одну фразу более 3 раз (1 + 2)
          });
      }
      
      this.currentAccompPlanIndex = 0;
      this.currentAccompRepetition = 0;
      this.barsInCurrentAccompPhrase = 0;
      this.nextAccompPlanRegenEpoch = this.epoch + 10 + this.random.nextInt(3); // 10-12 тактов
      console.log(`[AccompAxiom] Created new plan with ${numPhrases} phrases. Plan length: ${planLength}. Next regen at epoch ${this.nextAccompPlanRegenEpoch}.`);
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
  
  private selectBranchForMutation(type: 'bass' | 'drums' | 'accompaniment'): Branch | null {
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
    let endTime = 0;

    if (parent.type === 'bass') {
      const newFill = createBassFill.call(this, this.config.mood, this.config.genre, this.random);
      if (newFill.length === 0) return null;
      endTime = newFill.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
      return { 
          id: `bass_mut_${this.epoch}`, 
          events: newFill, 
          weight: parent.weight * 0.2, // Увеличен штраф
          age: 0, 
          technique: 'fill', 
          type: 'bass',
          endTime
      };
    } else if (parent.type === 'drums') {
        const mutationType = this.random.nextInt(4);
        let mutationApplied = false;

        switch(mutationType) {
            case 0:
                newEvents.forEach(e => {
                    if (e.type === 'drum_hihat_closed' && this.random.next() > 0.7) {
                        e.type = 'drum_ride';
                        mutationApplied = true;
                    }
                });
                break;
            case 1:
                const percPool = PERCUSSION_SETS.NEUTRAL;
                const timeSlots = [0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75];
                const targetTime = timeSlots[this.random.nextInt(timeSlots.length)];
                if (!newEvents.some(e => Math.abs(e.time - targetTime) < 0.1)) {
                    newEvents.push({
                        type: percPool[this.random.nextInt(percPool.length)], note: 36, duration: 0.1, time: targetTime, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: getParamsForTechnique('hit', this.config.mood, this.config.genre)
                    });
                    mutationApplied = true;
                }
                break;
            case 2:
                const snareIndex = newEvents.findIndex(e => e.type === 'drum_snare');
                if (snareIndex > -1 && this.random.next() > 0.5) { 
                    newEvents[snareIndex].time += (this.random.next() > 0.5 ? 0.25 : -0.25);
                    newEvents[snareIndex].time = (newEvents[snareIndex].time + 4) % 4;
                    mutationApplied = true;
                } else { 
                    const snareToReplace = newEvents.find(e => e.type === 'drum_snare');
                    if (snareToReplace) {
                        snareToReplace.type = 'drum_tom_mid';
                        mutationApplied = true;
                    }
                }
                break;
            case 3:
                const hihats = newEvents.filter(e => e.type === 'drum_hihat_closed');
                if (hihats.length > 0 && this.random.next() > 0.5) {
                    const targetHat = hihats[this.random.nextInt(hihats.length)];
                    newEvents.push({...targetHat, time: targetHat.time + 0.25 });
                    mutationApplied = true;
                }
                break;
        }

        if (!mutationApplied) return null;
        endTime = newEvents.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
        return { id: `drum_mut_${this.epoch}`, events: newEvents, weight: parent.weight * 0.8, age: 0, technique: 'hit', type: 'drums', endTime };
    }
    return null;
  }

  private applyNaturalDecay(events: FractalEvent[], barDuration: number): FractalEvent[] {
    const bassEvents = events.filter(isBass);
    if (bassEvents.length === 0) return events;

    const lastBassEvent = bassEvents.reduce((last, current) => (current.time > last.time ? current : last));

    // Ensure the last note has a defined release that fits within its duration
    if (lastBassEvent.time + lastBassEvent.duration >= barDuration - 0.1) {
        if (!lastBassEvent.params) {
            lastBassEvent.params = { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: 0.2 };
        }
        // Release should be within the note's own duration to avoid overlapping the next phrase
        lastBassEvent.params.release = Math.min(lastBassEvent.duration * 0.8, 1.5);
    }
    return events;
  }


  private generateOneBar(barDuration: number): { events: FractalEvent[], instrumentHints: { harmony?: AccompanimentInstrument, accompaniment?: AccompanimentInstrument, bass?: BassInstrument } } {
    let instrumentHints: { harmony?: AccompanimentInstrument, accompaniment?: AccompanimentInstrument, bass?: BassInstrument } = {};
    const output: FractalEvent[] = [];

    // --- SFX FILL LOGIC ---
    if (this.sfxFillForThisEpoch) {
        output.push(...this.sfxFillForThisEpoch.drum, ...this.sfxFillForThisEpoch.bass, ...this.sfxFillForThisEpoch.accompaniment);
        this.sfxFillForThisEpoch = null; // Consume the one-off fill
    } else {
        // --- BASS LOGIC (Universal Phrase Composer) ---
        const bassPlanItem = this.bassPlayPlan[this.currentBassPlanIndex];
        if (bassPlanItem && this.bassPhraseLibrary.length > 0) {
            const phrase = this.bassPhraseLibrary[bassPlanItem.phraseIndex];
            const phraseDurationInBeats = phrase.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
            const phraseDurationInBars = Math.ceil(phraseDurationInBeats / 4);

            if (this.barsInCurrentBassPhrase === 0) {
                output.push(...phrase);
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
                        console.log(`%c[BASS PLAN] Loop finished. Regenerating phrase library and plan.`, 'color: #FF7F50');
                    }
                }
            }
        } else {
            this.createBassAxiomAndPlan();
        }

        // --- DRUMS LOGIC ---
        const drumBranches = this.branches.filter(b => b.type === 'drums');
        if (drumBranches.length > 0) {
            const winningDrumBranch = drumBranches.reduce((max, b) => b.weight > max.weight ? b : max, drumBranches[0]);
            output.push(...winningDrumBranch.events.map(event => ({ ...event, weight: event.weight ?? 1.0 })));
        }
    }
    
    // --- TEXTURAL ACCOMPANIMENT LOGIC ---
    if (this.epoch >= this.nextAccompPlanRegenEpoch) {
         this.createAccompAxiomAndPlan();
    }
    const accompPlanItem = this.accompPlayPlan[this.currentAccompPlanIndex];
    if (accompPlanItem && this.accompPhraseLibrary.length > 0) {
        const phrase = this.accompPhraseLibrary[accompPlanItem.phraseIndex];
        const phraseDurationInBeats = phrase.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
        const phraseDurationInBars = Math.ceil(phraseDurationInBeats / 4);

        if (this.barsInCurrentAccompPhrase === 0) {
             const textureInstruments: AccompanimentInstrument[] = ['violin', 'flute', 'organ', 'mellotron', 'synth', 'theremin'];
             instrumentHints.accompaniment = textureInstruments[this.random.nextInt(textureInstruments.length)];
             output.push(...phrase);
        }

        this.barsInCurrentAccompPhrase++;

        if (this.barsInCurrentAccompPhrase >= phraseDurationInBars) {
            this.currentAccompRepetition++;
            this.barsInCurrentAccompPhrase = 0;
            if (this.currentAccompRepetition >= accompPlanItem.repetitions) {
                this.currentAccompRepetition = 0;
                this.currentAccompPlanIndex++;
                if (this.currentAccompPlanIndex >= this.accompPlayPlan.length) {
                    this.currentAccompPlanIndex = 0; // Loop the plan
                }
            }
        }
    }

    // --- RHYTHMIC HARMONY (Piano/Guitar) LOGIC ---
    if (this.epoch >= this.nextHarmonyEventEpoch) {
        console.log(`%c[HARMONY EVENT] at epoch ${this.epoch}: Triggering rhythmic harmony layer.`, "color: green;");
        const bassNote = output.find(isBass)?.note ?? this.bassPhraseLibrary[0]?.[0]?.note ?? getScaleForMood(this.config.mood)[0];
        const harmonyPhrase = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassNote, this.config.tempo);
        
        // Change type to 'harmony'
        harmonyPhrase.forEach(e => e.type = 'harmony');
        output.push(...harmonyPhrase);
        
        const rhythmicInstruments: ('piano' | 'guitarChords')[] = ['piano', 'guitarChords'];
        instrumentHints.harmony = rhythmicInstruments[this.random.nextInt(rhythmicInstruments.length)];
        
        this.nextHarmonyEventEpoch = this.epoch + 8 + this.random.nextInt(9); // 8-16 bars
    }
    
    // --- BRANCH MUTATION & PRUNING ---
    this.evolveBranches();
    
    const finalEvents = this.applyNaturalDecay(output, 4.0);
    return { events: finalEvents, instrumentHints };
  }

  private evolveBranches() {
    const shouldMutateDrums = this.random.next() < (this.config.density * 0.5);
     
     if (this.epoch % 4 === 1) { // Slower mutation for drums
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
  }


  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: Record<string, any> } {
    this.epoch = barCount;

    if (this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch += this.random.nextInt(12) + 8;
    }

    const delta = this.getDeltaProfile()(this.time);
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };

    // Update weights of drum branches
    this.branches.filter(b => b.type === 'drums').forEach(branch => {
      const ageBonus = branch.age === 0 ? 1.5 : 1.0; 
      const resonanceSum = 0; // Simplified for now
      let newWeight = ((1 - this.lambda) * branch.weight + resonanceSum) * ageBonus;
      branch.weight = isFinite(newWeight) ? Math.max(0, newWeight) : 0.01;
      branch.age++;
    });

    // Normalize weights and prune branches for drums
    const drumBranches = this.branches.filter(b => b.type === 'drums');
    const totalDrumWeight = drumBranches.reduce((sum, b) => sum + b.weight, 0);
    if (totalDrumWeight > 0) {
        drumBranches.forEach(b => b.weight /= totalDrumWeight);
    }

    this.branches = this.branches.filter(b => {
        if (b.type !== 'drums') return true; // Keep non-drum branches for now
        return b.weight > 0.01 || b.age < 8; // Pruning condition for drums
    });
    
    const { events, instrumentHints } = this.generateOneBar(barDuration);

    this.time += barDuration;
    return { events, instrumentHints };
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
