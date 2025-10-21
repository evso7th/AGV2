
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument } from '@/types/fractal';
import { MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, STYLE_BASS_PATTERNS, type BassPatternDefinition, PERCUSSION_SETS, generateAmbientBassPhrase, mutateBassPhrase } from './music-theory';

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

function createAccompanimentAxiom(mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number }, bassNote: number): FractalEvent[] {
    const scale = getScaleForMood(mood);
    const swellParams = getParamsForTechnique('swell', mood, genre);
    const arpeggio: FractalEvent[] = [];
    
    const rootMidi = bassNote;
    const rootDegree = rootMidi % 12;

    const findNoteInScale = (degree: number) => scale.find(n => (n % 12) === (degree + 12) % 12);
    
    const thirdDegree = findNoteInScale(rootDegree + (mood === 'melancholic' || mood === 'dark' ? 3 : 4));
    const fifthDegree = findNoteInScale(rootDegree + 7);

    const chord = [rootMidi, thirdDegree, fifthDegree].filter(n => n !== undefined) as number[];

    if (chord.length < 2) return []; 

    const pattern = [0, 1, 2, 1, 0, 2, 1, 0, 2, 1, 0, 2, 1, 2, 0, 1]; // Classic arpeggio pattern
    const duration = 0.25; // 16th notes

    for (let i = 0; i < pattern.length; i++) {
        const time = i * duration;
        const noteMidi = chord[pattern[i] % chord.length];

        if (noteMidi) {
            arpeggio.push({
                type: 'accompaniment',
                note: noteMidi,
                duration: duration,
                time: time,
                weight: 0.6 + random.next() * 0.1,
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato',
                params: swellParams
            });
        }
    }

    return arpeggio;
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
  private drumFillForThisEpoch: FractalEvent[] | null = null;
  public needsBassReset: boolean = false;
  private lastAccompanimentEndTime: number = -Infinity;
  private nextAccompanimentDelay: number = 0;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;


  // Новые свойства для Композитора Фраз
  private bassPhraseLibrary: FractalEvent[][] = [];
  private bassPlayPlan: PlayPlanItem[] = [];
  private currentPlanIndex: number = 0;
  private currentRepetition: number = 0;
  private barsInCurrentPhrase: number = 0;


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
    
    if (this.config.drumSettings.enabled) {
        const { events: drumAxiom } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        this.branches.push({ id: 'drum_axon', events: drumAxiom, weight: 1.0, age: 0, technique: 'hit', type: 'drums', endTime: 0 });
    }
    
    this.createBassAxiom();

    this.needsBassReset = false;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = (this.random.next() * 7) + 5; // 5-12 seconds
  }

  private createBassAxiom() {
      this.bassPhraseLibrary = [];
      const numPhrases = 2 + this.random.nextInt(3); 
      
      const anchorPhrase = generateAmbientBassPhrase(this.config.mood, this.config.genre, this.random);
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
      
      this.currentPlanIndex = 0;
      this.currentRepetition = 0;
      this.barsInCurrentPhrase = 0;
      console.log(`[BassAxiom] Created new bass plan with ${numPhrases} related phrases. Plan length: ${planLength}`);
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
    let newTechnique: Technique = parent.technique;
    let endTime = 0;
    let newBranchType: 'bass' | 'drums' | 'accompaniment' = parent.type;

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
    } else if (parent.type === 'accompaniment') {
        const bassBranches = this.branches.filter(isBass);
        const currentBassNote = bassBranches.length > 0 ? bassBranches[0].events[0]?.note ?? 40 : 40;
        const newAxiom = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, currentBassNote);
        if (newAxiom.length === 0) return null;
        endTime = newAxiom.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
        return {
            id: `accomp_mut_${this.epoch}`,
            events: newAxiom,
            weight: 1.2, // New accompaniment phrases start with strong weight to ensure they play
            age: 0,
            technique: 'swell',
            type: 'accompaniment',
            endTime
        };
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


  private generateOneBar(barDuration: number): { events: FractalEvent[], instrumentHints: { accompaniment?: MelodyInstrument, bass?: BassInstrument } } {
    let instrumentHints: { accompaniment?: MelodyInstrument, bass?: BassInstrument } = {};
    let shouldPlayAccompaniment = false;
    
    if (this.time >= this.lastAccompanimentEndTime + this.nextAccompanimentDelay) {
        shouldPlayAccompaniment = true;
    }
    
    if (this.config.composerControlsInstruments && shouldPlayAccompaniment) {
        const possibleInstruments: MelodyInstrument[] = ['violin', 'flute', 'synth', 'organ', 'mellotron', 'theremin', 'E-Bells_melody', 'G-Drops'];
        instrumentHints.accompaniment = possibleInstruments[this.random.nextInt(possibleInstruments.length)];
    }
    const output: FractalEvent[] = [];

    // --- SFX FILL LOGIC ---
    if (this.sfxFillForThisEpoch) {
        output.push(...this.sfxFillForThisEpoch.drum, ...this.sfxFillForThisEpoch.bass, ...this.sfxFillForThisEpoch.accompaniment);
        this.sfxFillForThisEpoch = null; // Consume the one-off fill
    } else {
        // --- BASS LOGIC (Universal Phrase Composer) ---
        const planItem = this.bassPlayPlan[this.currentPlanIndex];
        if (planItem && this.bassPhraseLibrary.length > 0) {
            const phrase = this.bassPhraseLibrary[planItem.phraseIndex];
            const phraseDurationInBeats = phrase.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
            const phraseDurationInBars = Math.ceil(phraseDurationInBeats / 4);

            if (this.barsInCurrentPhrase === 0) {
                output.push(...phrase);
            }

            this.barsInCurrentPhrase++;

            if (this.barsInCurrentPhrase >= phraseDurationInBars) {
                this.currentRepetition++;
                this.barsInCurrentPhrase = 0; 
                
                if (this.currentRepetition >= planItem.repetitions) {
                    this.currentRepetition = 0;
                    this.currentPlanIndex++;
                    
                    if (this.currentPlanIndex >= this.bassPlayPlan.length) {
                        this.createBassAxiom(); 
                        console.log(`%c[BASS PLAN] Loop finished. Regenerating phrase library and plan.`, 'color: #FF7F50');
                    }
                }
            }
        } else {
            this.createBassAxiom();
        }

        // --- DRUMS LOGIC ---
        const drumBranches = this.branches.filter(b => b.type === 'drums');
        if (drumBranches.length > 0) {
            const winningDrumBranch = drumBranches.reduce((max, b) => b.weight > max.weight ? b : max, drumBranches[0]);
            output.push(...winningDrumBranch.events.map(event => ({ ...event, weight: event.weight ?? 1.0 })));
        }
    }
    
    // --- ACCOMPANIMENT EVENT GENERATION ---
    const accompBranches = this.branches.filter(b => b.type === 'accompaniment');
    if (shouldPlayAccompaniment && accompBranches.length > 0) {
        const winningAccompBranch = accompBranches.reduce((max, b) => b.weight > max.weight ? b : max, accompBranches[0]);
        output.push(...winningAccompBranch.events);
        const beatDuration = 60 / this.config.tempo;
        this.lastAccompanimentEndTime = this.time + (winningAccompBranch.endTime * beatDuration);
        this.nextAccompanimentDelay = (this.random.next() * 7) + 5; // 5-12 seconds
        console.log(`%c[ACCOMPANIMENT] at epoch ${this.epoch}: Playing phrase. Next in ~${this.nextAccompanimentDelay.toFixed(1)}s.`, "color: magenta;");
    }
    
    // --- BRANCH MUTATION & PRUNING ---
    this.evolveBranches();
    
    const finalEvents = this.applyNaturalDecay(output, 4.0);
    return { events: finalEvents, instrumentHints };
  }

  private evolveBranches() {
    const shouldMutateBass = this.random.next() < (this.config.density * 0.5);
    const shouldMutateDrums = this.random.next() < (this.config.density * 0.5);
    const shouldMutateAccomp = this.random.next() < (this.config.density * 0.3); // Accompaniment mutates less often


    if (this.epoch % 2 === 1 && this.branches.filter(b => b.type === 'bass').length < 5) {
        if (shouldMutateBass) {
            const parentBranch = this.selectBranchForMutation('bass');
            if (parentBranch) {
                const newBranch = this.mutateBranch(parentBranch);
                if (newBranch) this.branches.push(newBranch);
            }
        }
    }
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
     
     if (this.epoch % 5 === 1) { // Even slower for accompaniment
         if (shouldMutateAccomp && this.branches.filter(b => b.type === 'accompaniment').length < 3) {
             const parentBranch = this.selectBranchForMutation('accompaniment');
             if (parentBranch) {
                 const newBranch = this.mutateBranch(parentBranch);
                 if (newBranch) this.branches.push(newBranch);
             } else {
                 // If no parent, create a new axiom
                 const bassBranches = this.branches.filter(isBass);
                 const currentBassNote = bassBranches.length > 0 ? bassBranches[0].events[0]?.note ?? 40 : 40;
                 const newAxiom = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, currentBassNote);
                 if (newAxiom.length > 0) {
                     const endTime = newAxiom.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
                     this.branches.push({ id: `accomp_axiom_${this.epoch}`, events: newAxiom, weight: 1.0, age: 0, technique: 'swell', type: 'accompaniment', endTime });
                 }
             }
         }
     }
  }


  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: { accompaniment?: MelodyInstrument, bass?: BassInstrument } } {
    this.epoch = barCount;

    if (this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch += this.random.nextInt(12) + 8;
    }

    const delta = this.getDeltaProfile()(this.time);
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };

    // Update weights and apply penalties
    this.branches.forEach(branch => {
      const ageBonus = branch.age === 0 ? 1.5 : 1.0; 
      const resonanceSum = this.branches.reduce((sum, other) => {
        if (!branch.events[0] || !other.events[0] || other.id === branch.id || other.type === branch.type) return sum;
        const k = MelancholicMinorK(branch.events[0], other.events[0], { mood: this.config.mood, tempo: this.config.tempo, delta, genre: this.config.genre });
        return sum + k * delta * other.weight;
      }, 0);
      let newWeight = ((1 - this.lambda) * branch.weight + resonanceSum) * ageBonus;
      
      if (branch.type === 'bass' && branch.events.some(e => e.note > 52)) {
          newWeight *= 0.2;
      }
      
      branch.weight = isFinite(newWeight) ? Math.max(0, newWeight) : 0.01;
      branch.age++;
    });

    // Check for bass revival
    const bassBranches = this.branches.filter(b => b.type === 'bass');
    if (bassBranches.length === 0 || bassBranches.every(b => b.weight < 0.3)) {
        console.log(`%c[BASS REVIVAL] All bass branches are weak. Creating new axiom.`, "color: #4169E1;");
        this.createBassAxiom();
    }

    // Normalize weights and prune branches
    ['bass', 'drums', 'accompaniment'].forEach(type => {
        const typeBranches = this.branches.filter(b => b.type === type);
        const totalWeight = typeBranches.reduce((sum, b) => sum + b.weight, 0);
        if (totalWeight > 0) {
            typeBranches.forEach(b => b.weight /= totalWeight);
        }
    });

    this.branches = this.branches.filter(b => {
        if (b.type === 'accompaniment') return b.age < 2;
        return b.weight > 0.05 || b.age < 8;
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
