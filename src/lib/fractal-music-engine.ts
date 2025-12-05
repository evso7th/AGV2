
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, MusicBlueprint, SectionName, SfxSynthParams } from '@/types/fractal';
import { isTonal, areSimultaneous, ElectronicK, TraditionalK, AmbientK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, mutateBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill as createBassFillFromTheory, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, SFX_GRAMMAR } from './music-theory';
import { AMBIENT_BLUEPRINTS } from './blueprints';


export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
  type: 'bass' | 'drums' | 'accompaniment' | 'melody'; // Added melody
  endTime: number; 
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
  lfoEnabled?: boolean;
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

function createSfxScenario(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const sfxPhrase: FractalEvent[] = [];
    const scale = getScaleForMood(mood);

    const sfxType = random.nextInt(3); 
    const numberOfEvents = 2 + random.nextInt(4); // 2-5 events per phrase
    let currentTime = random.next() * 2; // Start at a random time in the first half

    for (let i = 0; i < numberOfEvents; i++) {
        const duration = 0.5 + random.next();
        const startFreq = SFX_GRAMMAR.freqRanges.low.min + random.next() * (SFX_GRAMMAR.freqRanges.high.max - SFX_GRAMMAR.freqRanges.low.min);
        const endFreq = startFreq * (0.5 + random.next() * 1.5);
        
        sfxPhrase.push({
            type: 'sfx',
            note: 60, // Placeholder
            time: currentTime,
            duration: duration,
            weight: 0.3 + random.next() * 0.4,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: {
                duration,
                attack: { min: 0.1, max: 0.5 },
                decay: { min: 0.2, max: 0.6 },
                sustainLevel: 0.4,
                release: { min: 0.3, max: 1.0 },
                oscillators: [{ type: SFX_GRAMMAR.textures.ambient[random.nextInt(SFX_GRAMMAR.textures.ambient.length)], detune: random.nextInt(20) - 10 }],
                startFreq,
                endFreq,
                pan: random.next() * 2 - 1,
                distortion: random.next() * 0.1
            } as any
        });
        
        currentTime += duration * (0.5 + random.next() * 0.5);
    }
    
     // Normalize to fit within one bar
    const totalDuration = sfxPhrase.reduce((sum, e) => sum + e.duration, 0);
    if (totalDuration > 4) {
        const scaleFactor = 4.0 / totalDuration;
        let runningTime = 0;
        sfxPhrase.forEach(e => {
            e.duration *= scaleFactor;
            if (e.params) (e.params as SfxSynthParams).duration = e.duration;
            e.time = runningTime;
            runningTime += e.duration;
        });
    }
    
    return sfxPhrase;
}


// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig;
  private K: ResonanceMatrix;
  private time: number = 0;
  private random: { next: () => number; nextInt: (max: number) => number };
  
  // Suite structure
  private currentBlueprint: MusicBlueprint;
  private suiteStructure: { part: SectionName; bars: number }[];
  private totalSuiteBars: number;
  private currentSectionIndex: number = -1;
  private currentSection: { part: SectionName; bars: number } | null = null;
  private currentBarInSection: number = 0;

  // External event triggers
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: FractalEvent[] | null = null;
  private nextHarmonyEventEpoch: number = 0;
  
  // --- Evolution & Genetic Memory ---
  private successfulMutationsLibrary: FractalEvent[][] = [];
  private readonly qualityThreshold = 5.0; // Minimum score to be considered "good"
  private readonly libraryMaxSize = 200; // Max number of phrases to store


  // Phrase & Plan Management
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
  
  private melodyPhraseLibrary: FractalEvent[][] = [];
  private melodyPlayPlan: PlayPlanItem[] = [];
  private currentMelodyPlanIndex: number = 0;
  private currentMelodyRepetition: number = 0;
  private barsInCurrentMelodyPhrase: number = 0;

  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed ?? Date.now());
    this.nextWeatherEventEpoch = 0;
    
    this.currentBlueprint = AMBIENT_BLUEPRINTS[this.config.mood];
    this.suiteStructure = this.currentBlueprint.timing.partsDistribution;
    this.totalSuiteBars = this.suiteStructure.reduce((sum, part) => sum + part.bars, 0);

    this.setResonanceMatrix();
    this.initialize();
  }

  private setResonanceMatrix() {
    const electronicGenres: Genre[] = ['trance', 'house', 'progressive', 'rnb'];
    const traditionalGenres: Genre[] = ['rock', 'ballad', 'blues', 'reggae', 'celtic'];

    if (this.config.genre === 'ambient') {
        this.K = AmbientK;
    } else if (traditionalGenres.includes(this.config.genre)) {
        this.K = TraditionalK;
    } else {
        this.K = ElectronicK;
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
    
    this.currentBlueprint = AMBIENT_BLUEPRINTS[this.config.mood];
    this.suiteStructure = this.currentBlueprint.timing.partsDistribution;
    this.totalSuiteBars = this.suiteStructure.reduce((sum, part) => sum + part.bars, 0);
    console.log(`[Engine] Using Blueprint: ${this.currentBlueprint.name} for mood ${this.config.mood}`);


    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.nextHarmonyEventEpoch = this.random.nextInt(8) + 8; // 8-15
    
    this.createBassAxiomAndPlan();
    this.createAccompAxiomAndPlan();
    this.createMelodyAxiomAndPlan();

    this.needsBassReset = false;
    this.currentSectionIndex = -1;
    this.currentSection = null;
    this.currentBarInSection = 0;
    this.successfulMutationsLibrary = []; // Clear genetic memory on re-init
  }

  private createBassAxiomAndPlan() {
      this.bassPhraseLibrary = [];
      const numPhrases = 2 + this.random.nextInt(3); 
      const anchorPhrase = (this.random.next() < 0.5 && this.successfulMutationsLibrary.length > 5)
        ? this.successfulMutationsLibrary[this.random.nextInt(this.successfulMutationsLibrary.length)]
        : generateAmbientBassPhrase(this.config.mood, this.config.genre, this.random, this.config.tempo);
        
      this.bassPhraseLibrary.push(anchorPhrase);
      for (let i = 1; i < numPhrases; i++) {
          this.bassPhraseLibrary.push(mutateBassPhrase(anchorPhrase, this.config.mood, this.config.genre, this.random));
      }
      this.bassPlayPlan = [];
      const planLength = 3 + this.random.nextInt(2);
      for (let i = 0; i < planLength; i++) {
          this.bassPlayPlan.push({ phraseIndex: this.random.nextInt(numPhrases), repetitions: 1 + this.random.nextInt(3) });
      }
      this.currentBassPlanIndex = 0;
      this.currentBassRepetition = 0;
      this.barsInCurrentBassPhrase = 0;
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
          let instrument: AccompanimentInstrument = 'synth';
          if (this.config.genre === 'ambient') {
              instrument = this.chooseWeightedInstrument(AMBIENT_ACCOMPANIMENT_WEIGHTS[this.config.mood]);
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
  }

  private createMelodyAxiomAndPlan() {
    this.melodyPhraseLibrary = [];
    const numPhrases = 3 + this.random.nextInt(2);
    const bassNote = this.bassPhraseLibrary[0]?.[0]?.note ?? getScaleForMood(this.config.mood)[0];
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
  }

  public generateExternalImpulse() {
    console.log(`%c[WEATHER EVENT] at epoch ${this.time / this.config.tempo * 60 / 4}: Triggering musical scenario.`, "color: blue; font-weight: bold;");
    const sfxEvents = createSfxScenario(this.config.mood, this.config.genre, this.random);
    this.sfxFillForThisEpoch = sfxEvents;
    console.log(`%c  -> Created ONE-OFF SFX phrase for this epoch.`, "color: blue;");
  }

  /**
   * Evaluates the harmonic quality of a set of events.
   * Higher score is better.
   */
  private evaluateHarmonicQuality(events: FractalEvent[]): number {
      let score = 0;
      const tonalEvents = events.filter(isTonal);

      if (tonalEvents.length < 2) return 0;

      for (let i = 0; i < tonalEvents.length; i++) {
          for (let j = i + 1; j < tonalEvents.length; j++) {
              if (areSimultaneous(tonalEvents[i].time, tonalEvents[j].time, 0.1)) {
                  const quality = this.K(tonalEvents[i], tonalEvents[j], {
                      mood: this.config.mood,
                      tempo: this.config.tempo,
                      delta: this.config.density,
                      genre: this.config.genre
                  });
                  score += quality;
              }
          }
      }
      return score / (tonalEvents.length * (tonalEvents.length -1) / 2); // Normalize score
  }

  /**
   * Creates several mutations of a phrase and returns the one with the best harmonic quality.
   */
  private evolveAndSelect(basePhrase: FractalEvent[], contextEvents: FractalEvent[]): FractalEvent[] {
      const numMutations = 4;
      let bestPhrase = basePhrase;
      let bestScore = this.evaluateHarmonicQuality([...contextEvents, ...basePhrase]);
      
      for (let i = 0; i < numMutations; i++) {
          const mutatedPhrase = mutateBassPhrase(basePhrase, this.config.mood, this.config.genre, this.random);
          const score = this.evaluateHarmonicQuality([...contextEvents, ...mutatedPhrase]);
          
          if (score > bestScore) {
              bestScore = score;
              bestPhrase = mutatedPhrase;
          }
      }
      
      // Add to genetic memory if it's good enough
      if (bestScore > this.qualityThreshold && this.successfulMutationsLibrary.length < this.libraryMaxSize) {
          console.log(`%c[Genetics] Storing high-quality phrase (Score: ${bestScore.toFixed(2)})`, 'color: #90ee90');
          this.successfulMutationsLibrary.push(bestPhrase);
      }

      return bestPhrase;
  }


  private generateOneBar(barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    let instrumentHints: InstrumentHints = {};
    const output: FractalEvent[] = [];

    // --- 1. Определяем текущую секцию ---
    if (this.currentSection === null || this.currentBarInSection >= this.currentSection.bars) {
        this.currentSectionIndex = (this.currentSectionIndex + 1) % this.suiteStructure.length;
        this.currentSection = this.suiteStructure[this.currentSectionIndex];
        this.currentBarInSection = 0;
        console.log(`%c[Engine] Entering Section: ${this.currentSection.part}`, 'color: green; font-weight: bold;');
    }
    const sectionName = this.currentSection.part;
    const layerConfig = this.currentBlueprint.layers[sectionName] || {};

    // --- 2. Генерируем "Призрачную партию" баса ---
    const bassPlanItem = this.bassPlayPlan[this.currentBassPlanIndex];
    let bassPhraseForThisBar: FractalEvent[] = [];
    if (bassPlanItem && this.bassPhraseLibrary.length > 0) {
        bassPhraseForThisBar = this.bassPhraseLibrary[bassPlanItem.phraseIndex];
    }
    
    // --- 3. Генерируем остальные партии ---
    const technique = getAccompanimentTechnique(this.config.genre, this.config.mood, this.config.density, this.config.tempo, barCount, this.random);
    let candidatePhrase = this.generateAccompanimentForPhrase(bassPhraseForThisBar, technique);
    
    let harmonyPhraseForThisBar: FractalEvent[] = [];
    let accompPhraseForThisBar: FractalEvent[] = [];
    candidatePhrase.forEach(event => {
        if (event.type === 'harmony') {
            harmonyPhraseForThisBar.push(event);
        } else {
            accompPhraseForThisBar.push(event);
        }
    });

    // --- 4. Применяем правила `layers` и собираем итоговую партитуру ---
    instrumentHints.bass = layerConfig.bass ? (bassPlanItem?.instrument as BassInstrument || 'classicBass') : 'none';
    instrumentHints.accompaniment = layerConfig.accompaniment ? (this.accompPlayPlan[this.currentAccompPlanIndex]?.instrument as AccompanimentInstrument) : 'none';
    instrumentHints.melody = layerConfig.melody ? (this.melodyPlayPlan[this.currentMelodyPlanIndex]?.instrument as MelodyInstrument) : 'none';
    instrumentHints.harmony = layerConfig.harmony ? (this.config.genre === 'ambient' ? 'violin' : 'piano') : 'none';
    
    if (instrumentHints.bass !== 'none') output.push(...bassPhraseForThisBar);
    if (instrumentHints.accompaniment !== 'none') output.push(...accompPhraseForThisBar);
    if (instrumentHints.melody !== 'none') output.push(...this.generateMelodyForPhrase(bassPhraseForThisBar, 'arpeggio-slow')); // Placeholder
    if (instrumentHints.harmony !== 'none') output.push(...harmonyPhraseForThisBar);


    // --- 5. Ударные и SFX ---
    if (layerConfig.drums && this.config.drumSettings.enabled) {
        const { events: drumAxiom } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        output.push(...drumAxiom);
    }
    if (this.sfxFillForThisEpoch) {
      output.push(...this.sfxFillForThisEpoch);
      this.sfxFillForThisEpoch = null;
    }
    
    // --- 6. Эволюция и Продвижение планов (пост-генерация) ---
    const contextEvents = bassPhraseForThisBar; 
    
    // Эволюция аккомпанемента
    const accompPlanItem = this.accompPlayPlan[this.currentAccompPlanIndex];
    if (accompPlanItem) {
        let currentPhrase = this.accompPhraseLibrary[accompPlanItem.phraseIndex];
        let evolvedPhrase = this.evolveAndSelect(currentPhrase, contextEvents);
        this.accompPhraseLibrary[accompPlanItem.phraseIndex] = evolvedPhrase; // Update library
        // Продвигаем план
        this.barsInCurrentAccompPhrase++;
        const phraseDuration = Math.ceil(evolvedPhrase.reduce((max, e) => max + e.duration, 0) / 4);
        if (this.barsInCurrentAccompPhrase >= phraseDuration * accompPlanItem.repetitions) {
            this.currentAccompPlanIndex = (this.currentAccompPlanIndex + 1) % this.accompPlayPlan.length;
            this.barsInCurrentAccompPhrase = 0;
            console.log(`[Engine] Advancing accomp plan to index ${this.currentAccompPlanIndex}`);
        }
    }

    // Продвигаем план баса (без эволюции, т.к. он основа)
    if (bassPlanItem) {
        const phraseDurationInBeats = bassPhraseForThisBar.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
        const phraseDurationInBars = Math.ceil(phraseDurationInBeats / 4);
        this.barsInCurrentBassPhrase++;
        if (this.barsInCurrentBassPhrase >= phraseDurationInBars) {
            this.currentBassRepetition++;
            this.barsInCurrentBassPhrase = 0; 
            if (this.currentBassRepetition >= bassPlanItem.repetitions) {
                this.currentBassRepetition = 0;
                this.currentBassPlanIndex = (this.currentBassPlanIndex + 1) % this.bassPlayPlan.length;
            }
        }
    }


    this.currentBarInSection++;
    return { events: output, instrumentHints };
  }

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
        case 'long-chords': chordDegrees.forEach((degree, index) => { accompanimentPhrase.push({ type: 'harmony', note: 12 * (selectOctave() + 1) + degree, time: index * 0.1, duration: 4.0, weight: 0.6 - (index * 0.1), technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 1.8, release: 2.8 } }); }); break;
        case 'choral': 
            const baseOctave = 3; const melodyOctave = 4;
            const params = { attack: 1.5, release: 2.5, cutoff: 1200, resonance: 0.4, distortion: 0.0, portamento: 0.01 };
            if (fifthDegree !== null) {
                accompanimentPhrase.push({ type: 'harmony', note: 12 * (baseOctave + 1) + rootDegree, duration: 4.0, time: 0, weight: 0.65, phrasing: 'legato', technique: 'swell', dynamics: 'p', params });
                accompanimentPhrase.push({ type: 'harmony', note: 12 * (baseOctave + 1) + fifthDegree, duration: 4.0, time: 0.1, weight: 0.55, phrasing: 'legato', technique: 'swell', dynamics: 'p', params });
            }
            if (thirdDegree !== null && seventhDegree !== null) {
                accompanimentPhrase.push({ type: 'harmony', note: 12 * (melodyOctave + 1) + thirdDegree, duration: 3.0, time: 0.5, weight: 0.6, phrasing: 'legato', technique: 'swell', dynamics: 'p', params });
                accompanimentPhrase.push({ type: 'harmony', note: 12 * (melodyOctave + 1) + seventhDegree, duration: 2.5, time: 1.0, weight: 0.5, phrasing: 'legato', technique: 'swell', dynamics: 'p', params });
            }
            return accompanimentPhrase;
        case 'arpeggio-fast':
             for (let i = 0; i < 16; i++) {
                const degree = chordDegrees[i % chordDegrees.length];
                const note = 12 * (selectOctave() + 1) + degree;
                accompanimentPhrase.push({ type: 'accompaniment', note: note, time: i * 0.25, duration: 0.2, weight: 0.6 + this.random.next() * 0.1, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato', params: { attack: 0.01, release: 0.15 } });
            }
            break;
        default: return createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, bassPhrase[0].note, this.config.tempo);
      }
      return accompanimentPhrase;
  }
  
  private generateMelodyForPhrase( bassPhrase: FractalEvent[], technique: AccompanimentTechnique ): FractalEvent[] {
      const melodyPhrase = this.generateAccompanimentForPhrase(bassPhrase, technique);
      return melodyPhrase.map(event => {
          const newEvent = { ...event, type: 'melody' as const };
          if (this.random.next() > 0.5) newEvent.note += 12;
          newEvent.weight *= 0.85;
          return newEvent;
      });
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    if (this.needsBassReset) {
        this.createBassAxiomAndPlan();
        this.needsBassReset = false;
    }

    if (barCount >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch += this.random.nextInt(12) + 8;
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
    
    const { events, instrumentHints } = this.generateOneBar(barCount);

    this.time += barDuration;
    return { events, instrumentHints };
  }
}

    