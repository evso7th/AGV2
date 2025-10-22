
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix } from '@/types/fractal';
import { ElectronicK, TraditionalK, AmbientK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, mutateBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS } from './music-theory';

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

type PlayPlanItem = {
    phraseIndex: number;
    repetitions: number;
    instrument: AccompanimentInstrument;
};

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
      } else { // 5% chance for 5th octave
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

const AMBIENT_INSTRUMENT_WEIGHTS: Record<AccompanimentInstrument, number> = {
    organ: 0.25,
    mellotron: 0.25,
    synth: 0.2,
    flute: 0.2,
    violin: 0.05,
    theremin: 0.05,
    piano: 0.0,
    guitarChords: 0.0,
    acousticGuitarSolo: 0.0,
    electricGuitar: 0.0,
    'E-Bells_melody': 0.0,
    'G-Drops': 0.0,
    'none': 0.0,
};

// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig;
  private resonanceMatrix: ResonanceMatrix;
  private time: number = 0;
  private epoch = 0;
  private random: { next: () => number; nextInt: (max: number) => number };
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private nextHarmonyEventEpoch: number = 0;

  // Композитор Фраз для Баса
  private bassPhraseLibrary: FractalEvent[][] = [];
  private bassPlayPlan: { phraseIndex: number, repetitions: number }[] = [];
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
    this.random = seededRandom(config.seed ?? Date.now());
    this.nextWeatherEventEpoch = 0;
    
    this.setResonanceMatrix();
    this.initialize();
  }

  public get tempo(): number { return this.config.tempo; }
  
  private setResonanceMatrix() {
    const electronicGenres: Genre[] = ['trance', 'house', 'progressive', 'rnb'];
    const traditionalGenres: Genre[] = ['rock', 'ballad', 'blues', 'reggae', 'celtic'];

    if (this.config.genre === 'ambient') {
        this.resonanceMatrix = AmbientK;
        console.log("[Engine] Using AmbientK resonance matrix.");
    } else if (traditionalGenres.includes(this.config.genre)) {
        this.resonanceMatrix = TraditionalK;
        console.log("[Engine] Using TraditionalK resonance matrix.");
    } else {
        this.resonanceMatrix = ElectronicK;
        console.log("[Engine] Using ElectronicK resonance matrix.");
    }
  }

  public updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      this.config = { ...this.config, ...newConfig };
      
      this.setResonanceMatrix();

      if(moodOrGenreChanged) {
          this.initialize();
      }
  }

  private initialize() {
    this.random = seededRandom(this.config.seed ?? Date.now());
    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.nextHarmonyEventEpoch = this.random.nextInt(8) + 8; // 8-15
    
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
  
  private chooseWeightedInstrument(weights: Record<AccompanimentInstrument, number>): AccompanimentInstrument {
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
      this.accompPhraseLibrary = [];
      const numPhrases = 4 + this.random.nextInt(2); // 4-5 фраз в бандле

      const bassNote = this.bassPhraseLibrary[0]?.[0]?.note ?? getScaleForMood(this.config.mood)[0];
      
      const anchorPhrase = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassNote, this.config.tempo);
      this.accompPhraseLibrary.push(anchorPhrase);
      
      for (let i = 1; i < numPhrases; i++) {
          this.accompPhraseLibrary.push(mutateBassPhrase(anchorPhrase, this.config.mood, this.config.genre, this.random)); 
      }

      this.accompPlayPlan = [];
      const planLength = 4 + this.random.nextInt(3);
      for (let i = 0; i < planLength; i++) {
          let instrument: AccompanimentInstrument = 'synth'; // Default
          if (this.config.genre === 'ambient') {
              instrument = this.chooseWeightedInstrument(AMBIENT_INSTRUMENT_WEIGHTS);
          } else {
              const ALL_ACCOMP_INSTRUMENTS: AccompanimentInstrument[] = ['piano', 'violin', 'flute', 'organ', 'mellotron', 'synth', 'theremin', 'guitarChords', 'acousticGuitarSolo'];
              instrument = ALL_ACCOMP_INSTRUMENTS[this.random.nextInt(ALL_ACCOMP_INSTRUMENTS.length)];
          }

          this.accompPlayPlan.push({
              phraseIndex: this.random.nextInt(numPhrases),
              repetitions: 1 + this.random.nextInt(2),
              instrument: instrument,
          });
      }
      
      this.currentAccompPlanIndex = 0;
      this.currentAccompRepetition = 0;
      this.barsInCurrentAccompPhrase = 0;
      console.log(`[AccompAxiom] Created new plan with ${numPhrases} phrases. Plan length: ${planLength}`);
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

  private applyNaturalDecay(events: FractalEvent[], barDuration: number): FractalEvent[] {
    const bassEvents = events.filter(isBass);
    if (bassEvents.length === 0) return events;

    const lastBassEvent = bassEvents.reduce((last, current) => (current.time > last.time ? current : last));

    if (lastBassEvent.time + lastBassEvent.duration >= barDuration - 0.1) {
        if (!lastBassEvent.params) {
            lastBassEvent.params = { cutoff: 300, resonance: 0.8, distortion: 0.02, portamento: 0.0, attack: 0.2 };
        }
        lastBassEvent.params.release = Math.min(lastBassEvent.duration * 0.8, 1.5);
    }
    return events;
  }


  private generateOneBar(barDuration: number): { events: FractalEvent[], instrumentHints: { harmony?: AccompanimentInstrument, accompaniment?: AccompanimentInstrument, bass?: BassInstrument } } {
    let instrumentHints: { harmony?: AccompanimentInstrument, accompaniment?: AccompanimentInstrument, bass?: BassInstrument } = {};
    const output: FractalEvent[] = [];

    if (this.sfxFillForThisEpoch) {
        output.push(...this.sfxFillForThisEpoch.drum, ...this.sfxFillForThisEpoch.bass, ...this.sfxFillForThisEpoch.accompaniment);
        this.sfxFillForThisEpoch = null;
    }
    
    if (this.config.drumSettings.enabled) {
        const { events: drumAxiom } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        output.push(...drumAxiom);
    }
    
    // --- BASS LOGIC ---
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

    // --- ACCOMPANIMENT LOGIC ---
    const accompPlanItem = this.accompPlayPlan[this.currentAccompPlanIndex];
    if (accompPlanItem && this.accompPhraseLibrary.length > 0) {
        const phrase = this.accompPhraseLibrary[accompPlanItem.phraseIndex];
        const phraseDurationInBeats = phrase.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
        const phraseDurationInBars = Math.ceil(phraseDurationInBeats / 4);

        if (this.barsInCurrentAccompPhrase === 0) {
            output.push(...phrase);
        }

        instrumentHints.accompaniment = accompPlanItem.instrument;

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

    // --- HARMONY LOGIC ---
    if (this.epoch >= this.nextHarmonyEventEpoch) {
        const bassNote = output.find(isBass)?.note ?? this.bassPhraseLibrary[0]?.[0]?.note ?? getScaleForMood(this.config.mood)[0];
        const harmonyPhrase = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassNote, this.config.tempo);
        
        harmonyPhrase.forEach(e => e.type = 'harmony');
        output.push(...harmonyPhrase);
        
        const rhythmicInstruments: ('piano' | 'guitarChords')[] = ['piano', 'guitarChords'];
        instrumentHints.harmony = rhythmicInstruments[this.random.nextInt(rhythmicInstruments.length)];
        this.nextHarmonyEventEpoch = this.epoch + 8 + this.random.nextInt(9); // 8-16 bars
    }
    
    const finalEvents = this.applyNaturalDecay(output, 4.0);
    return { events: finalEvents, instrumentHints };
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: Record<string, any> } {
    this.epoch = barCount;

    if (this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch += this.random.nextInt(12) + 8;
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
    
    const { events, instrumentHints } = this.generateOneBar(barDuration);

    this.time += barDuration;
    return { events, instrumentHints };
  }
}
