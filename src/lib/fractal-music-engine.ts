
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique } from '@/types/fractal';
import { ElectronicK, TraditionalK, AmbientK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, mutateBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill as createBassFillFromTheory, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS } from './music-theory';

export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
  type: 'bass' | 'drums' | 'accompaniment' | 'melody'; // Added melody
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
    instrument: AccompanimentInstrument | MelodyInstrument; // Can be for either
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

  // Композитор Фраз для Аккомпанемента/Мелодии
  private accompPhraseLibrary: FractalEvent[][] = [];
  private accompPlayPlan: PlayPlanItem[] = [];
  private currentAccompPlanIndex: number = 0;
  private currentAccompRepetition: number = 0;
  private barsInCurrentAccompPhrase: number = 0;
  
  private melodyPhraseLibrary: FractalEvent[][] = [];
  private melodyPlayPlan: PlayPlanItem[] = [];
  private currentMelodyPlanIndex: number = 0;
  private currentMelodyRepetition: number = 0;
  private barsInCurrentMelodyPhrase: number = 0;


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
    this.createMelodyAxiomAndPlan();

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
          let instrument: AccompanimentInstrument;
          if (this.config.genre === 'ambient') {
              instrument = this.chooseWeightedInstrument(AMBIENT_ACCOMPANIMENT_WEIGHTS[this.config.mood]);
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

  private createMelodyAxiomAndPlan() {
    this.melodyPhraseLibrary = [];
    const numPhrases = 3 + this.random.nextInt(2);
    const bassNote = this.bassPhraseLibrary[0]?.[0]?.note ?? getScaleForMood(this.config.mood)[0];
    
    // Create a sparser, more melodic anchor phrase
    const anchorPhrase = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassNote, this.config.tempo).map(e => ({...e, type: 'melody' as const, weight: e.weight * 0.8, duration: e.duration * 1.2 }));
    this.melodyPhraseLibrary.push(anchorPhrase);

    for (let i = 1; i < numPhrases; i++) {
      const mutatedPhrase = mutateBassPhrase(anchorPhrase, this.config.mood, this.config.genre, this.random);
      this.melodyPhraseLibrary.push(mutatedPhrase.map(e => ({...e, type: 'melody' as const})));
    }

    this.melodyPlayPlan = [];
    const planLength = 4 + this.random.nextInt(2);
    for (let i = 0; i < planLength; i++) {
        const ALL_MELODY_INSTRUMENTS: MelodyInstrument[] = ['synth', 'organ', 'mellotron', 'theremin', 'electricGuitar', 'ambientPad'];
        const instrument = ALL_MELODY_INSTRUMENTS[this.random.nextInt(ALL_MELODY_INSTRUMENTS.length)];
        this.melodyPlayPlan.push({
            phraseIndex: this.random.nextInt(numPhrases),
            repetitions: 1, // Melodies are less repetitive
            instrument: instrument,
        });
    }
    this.currentMelodyPlanIndex = 0;
    this.currentMelodyRepetition = 0;
    this.barsInCurrentMelodyPhrase = 0;
    console.log(`[MelodyAxiom] Created new melody plan with ${numPhrases} phrases.`);
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

  /**
   * Generates accompaniment events based on a bass phrase and a chosen technique.
   */
  private generateAccompanimentForPhrase(
      bassPhrase: FractalEvent[], 
      technique: AccompanimentTechnique
  ): FractalEvent[] {
      const accompanimentPhrase: FractalEvent[] = [];
      const scale = getScaleForMood(this.config.mood);

      if (!bassPhrase || bassPhrase.length === 0) return [];
      
      const rootNote = bassPhrase[0].note;
      const rootDegree = rootNote % 12;
      const isMinor = this.config.mood === 'melancholic' || this.config.mood === 'dark' || this.config.mood === 'anxious';

      const findScaleDegree = (interval: number): number | null => {
        const targetDegree = (rootDegree + interval + 12) % 12;
        const matchingNote = scale.find(n => (n % 12) === targetDegree);
        return matchingNote !== undefined ? (matchingNote % 12) : null;
      };
      
      const thirdDegree = findScaleDegree(isMinor ? 3 : 4);
      const fifthDegree = findScaleDegree(7);
      const seventhDegree = findScaleDegree(isMinor ? 10 : 11);
      
      const chordDegrees = [rootDegree, thirdDegree, fifthDegree].filter(d => d !== null) as number[];
      if (chordDegrees.length < 2) return []; 

      const selectOctave = (): number => (this.random.next() > 0.6 ? 4 : 3);
      
      switch (technique) {
          case 'long-chords':
              chordDegrees.forEach((degree, index) => {
                  accompanimentPhrase.push({
                      type: 'harmony',
                      note: 12 * (selectOctave() + 1) + degree,
                      time: index * 0.1, // Slight stagger
                      duration: 4.0,
                      weight: 0.6 - (index * 0.1),
                      technique: 'swell', dynamics: 'p', phrasing: 'legato',
                      params: { attack: 1.8, release: 2.8 }
                  });
              });
              break;

          case 'paired-notes':
              accompanimentPhrase.push({
                  type: 'harmony', note: 12 * (selectOctave() + 1) + chordDegrees[0],
                  time: 0.0, duration: 2.0, weight: 0.7,
                  technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 0.8, release: 1.2 }
              });
              if (chordDegrees[1]) {
                  accompanimentPhrase.push({
                      type: 'harmony', note: 12 * (selectOctave() + 1) + chordDegrees[1],
                      time: 2.0, duration: 2.0, weight: 0.65,
                      technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 0.8, release: 1.2 }
                  });
              }
              break;

          case 'choral':
              const baseOctave = 3; 
              const melodyOctave = 4;
              const params = { attack: 1.5, release: 2.5, cutoff: 1200, resonance: 0.4, distortion: 0.0, portamento: 0.01 };
              
              if (fifthDegree !== null) {
                  accompanimentPhrase.push({
                      type: 'harmony', note: 12 * (baseOctave + 1) + rootDegree,
                      duration: 4.0, time: 0, weight: 0.65,
                      phrasing: 'legato', technique: 'swell', dynamics: 'p', params
                  });
                  accompanimentPhrase.push({
                      type: 'harmony', note: 12 * (baseOctave + 1) + fifthDegree,
                      duration: 4.0, time: 0.1, weight: 0.55,
                      phrasing: 'legato', technique: 'swell', dynamics: 'p', params
                  });
              }

              if (thirdDegree !== null && seventhDegree !== null) {
                  accompanimentPhrase.push({
                      type: 'harmony', note: 12 * (melodyOctave + 1) + thirdDegree,
                      duration: 3.0, time: 0.5, weight: 0.6,
                      phrasing: 'legato', technique: 'swell', dynamics: 'p', params
                  });
                  accompanimentPhrase.push({
                      type: 'harmony', note: 12 * (melodyOctave + 1) + seventhDegree,
                      duration: 2.5, time: 1.0, weight: 0.5,
                      phrasing: 'legato', technique: 'swell', dynamics: 'p', params
                  });
              }
              return accompanimentPhrase;

          case 'arpeggio-fast':
              for (let i = 0; i < 16; i++) {
                  const degree = chordDegrees[i % chordDegrees.length];
                  const note = 12 * (selectOctave() + 1) + degree;
                  accompanimentPhrase.push({
                      type: 'accompaniment', note: note, time: i * 0.25,
                      duration: 0.2, weight: 0.6 + this.random.next() * 0.1,
                      technique: 'pluck', dynamics: 'mf', phrasing: 'staccato',
                      params: { attack: 0.01, release: 0.15 }
                  });
              }
              break;

          case 'chord-pulsation':
               for (let i = 0; i < 8; i++) {
                    const time = i * 0.5;
                    const onBeat = i % 2 === 0;
                    chordDegrees.forEach(degree => {
                        accompanimentPhrase.push({
                            type: 'accompaniment',
                            note: 12 * selectOctave() + degree,
                            time, duration: 0.3, weight: onBeat ? 0.7 : 0.5,
                            technique: 'pluck', dynamics: 'mf', phrasing: 'staccato',
                            params: { attack: 0.02, release: 0.2 }
                        });
                   });
               }
               break;
               
          case 'alternating-bass-chord':
          default:
              return createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassPhrase[0].note, this.config.tempo);
      }
      return accompanimentPhrase;
  }
  
  private generateMelodyForPhrase(
      bassPhrase: FractalEvent[],
      technique: AccompanimentTechnique // Using same techniques for simplicity
  ): FractalEvent[] {
      const melodyPhrase = this.generateAccompanimentForPhrase(bassPhrase, technique);
      // Mark as 'melody' and potentially shift octave up
      return melodyPhrase.map(event => {
          const newEvent = { ...event, type: 'melody' as const };
          if (this.random.next() > 0.5) {
              newEvent.note += 12; // Shift octave up
          }
          newEvent.weight *= 0.85; // Make melody slightly quieter than harmony
          return newEvent;
      });
  }


  private generateOneBar(barDuration: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    let instrumentHints: InstrumentHints = {};
    const output: FractalEvent[] = [];
    let drumEvents: FractalEvent[] = [];
    let isFillBar = false;

    // --- BASS ---
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

                // **EVENT**: End of a bass bundle -> chance for a fill
                if (this.random.next() < 0.4) { // 40% chance
                    console.log(`%c[EVENT] Bass plan transition. Generating fill...`, 'color: orange');
                    const { events: bassFillEvents, penalty } = createBassFillFromTheory(this.config.mood, this.config.genre, this.random);
                    const drumFillEvents = createDrumFill(this.random);

                    bassPhraseForThisBar = bassFillEvents;
                    drumEvents = drumFillEvents; // Replace drum part with a fill
                    isFillBar = true;

                    if (penalty > 0) this.needsBassReset = true; // Mark for reset after fill
                }
                
                if (this.currentBassPlanIndex >= this.bassPlayPlan.length) {
                    this.createBassAxiomAndPlan(); 
                    console.log(`%c[BASS PLAN] Loop finished. Regenerating phrase library and plan.`, 'color: #FF7F50');
                }
            }
        }
    } else {
        this.createBassAxiomAndPlan();
    }

    // --- DRUMS (if not a fill bar) ---
    if (!isFillBar && this.config.drumSettings.enabled) {
        const { events: drumAxiom } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        drumEvents.push(...drumAxiom);
    }
    
    // --- DRUM FILL REACTION ---
    const hasDrumFill = drumEvents.some(e => e.technique === 'fill' || (e.type as string).includes('tom'));
    if(hasDrumFill && this.random.next() < 0.6) { // 60% chance to react
        console.log(`%c[EVENT] Bass reacting to drum fill...`, 'color: cyan');
        const { events: fillEvents, penalty } = createBassFillFromTheory(this.config.mood, this.config.genre, this.random);
        bassPhraseForThisBar.push(...fillEvents); // Add to existing events
        if (penalty > 0) this.needsBassReset = true;
    }


    output.push(...bassPhraseForThisBar);
    output.push(...drumEvents);
    
    // --- ACCOMPANIMENT, HARMONY & MELODY (Reacts to Bass) ---
    const accompPlanItem = this.accompPlayPlan[this.currentAccompPlanIndex];
    const melodyPlanItem = this.melodyPlayPlan[this.currentMelodyPlanIndex];
    
    // Decide whether to play melody or accompaniment this bar
    const playMelody = this.random.next() < (this.config.density * 0.5); // More likely with higher density
    const playAccompaniment = !playMelody;

    if (playMelody && melodyPlanItem) {
        const technique = getAccompanimentTechnique(this.config.genre, this.config.mood, this.config.density, this.config.tempo, this.epoch, this.random);
        const melodyPhrase = this.generateMelodyForPhrase(bassPhraseForThisBar, technique);
        output.push(...melodyPhrase);
        instrumentHints.melody = melodyPlanItem.instrument as MelodyInstrument;
        
        // Advance melody plan
        this.currentMelodyRepetition++;
        if(this.currentMelodyRepetition >= melodyPlanItem.repetitions) {
            this.currentMelodyRepetition = 0;
            this.currentMelodyPlanIndex = (this.currentMelodyPlanIndex + 1) % this.melodyPlayPlan.length;
        }
    }
    
    if (playAccompaniment && accompPlanItem) {
        const technique = getAccompanimentTechnique(this.config.genre, this.config.mood, this.config.density, this.config.tempo, this.epoch, this.random);
        const accompPhrase = this.generateAccompanimentForPhrase(bassPhraseForThisBar, technique);
        output.push(...accompPhrase);

        // Distribute hints based on technique
        if (['choral', 'long-chords', 'paired-notes'].includes(technique)) {
            instrumentHints.harmony = this.config.genre === 'ambient' ? 'violin' : 'piano';
        } else {
            instrumentHints.accompaniment = accompPlanItem.instrument as AccompanimentInstrument;
        }

        // Advance accompaniment plan
        this.currentAccompRepetition++;
        if(this.currentAccompRepetition >= accompPlanItem.repetitions) {
            this.currentAccompRepetition = 0;
            this.currentAccompPlanIndex = (this.currentAccompPlanIndex + 1) % this.accompPlayPlan.length;
        }
    }

    const finalEvents = this.applyNaturalDecay(output, 4.0);
    return { events: finalEvents, instrumentHints };
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    this.epoch = barCount;
    
    if (this.needsBassReset) {
        console.log(`%c[RESET] High-register bass fill penalty triggered. Resetting bass plan.`, 'color: red');
        this.createBassAxiomAndPlan();
        this.needsBassReset = false;
    }

    if (this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch += this.random.nextInt(12) + 8;
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
    
    const { events, instrumentHints } = this.generateOneBar(barDuration);

    // Filter SFX events if it's too early
    const finalEvents = this.epoch < 2 
        ? events.filter(e => e.type !== 'sfx') 
        : events;

    this.time += barDuration;
    return { events: finalEvents, instrumentHints };
  }
}
