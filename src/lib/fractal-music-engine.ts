

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, BlueprintPart, InstrumentationRules } from '@/types/fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, mutateBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill as createBassFillFromTheory, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateAccompanimentPhrase } from './music-theory';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { MelancholicAmbientBlueprint, BLUEPRINT_LIBRARY, getBlueprint } from './blueprints';


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
  seed: number;
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
  private random: { next: () => number; nextInt: (max: number) => number }
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private lastAccompanimentEndTime: number = -Infinity;
  private nextAccompanimentDelay: number = 0;
  private hasBassBeenMutated = false;
  
  private branches: Branch[] = [];
  private harmonyBranches: Branch[] = [];

  public navigator: BlueprintNavigator;
  private isPromenadeActive: boolean = false;
  private promenadeBars: FractalEvent[] = [];


  private currentBassPhrase: FractalEvent[] = [];
  private bassPhraseLibrary: FractalEvent[][] = [];

  private currentAccompPhrase: FractalEvent[] = []; // NEW
  private accompPhraseLibrary: FractalEvent[][] = [];
  private accompPlayPlan: PlayPlanItem[] = [];
  private currentAccompPlanIndex: number = 0;
  private currentAccompRepetition: number = 0;
  private barsInCurrentAccompPhrase: number = 0;


  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.navigator = new BlueprintNavigator(getBlueprint(config.genre, config.mood), config.seed, config.genre, config.mood);
    this.random = seededRandom(config.seed);
    this.nextWeatherEventEpoch = 0;
    this.initialize();
  }

  public get tempo(): number { return this.config.tempo; }
  

  public updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      
      const oldSeed = this.config.seed;
      this.config = { ...this.config, ...newConfig };
      
      if (newConfig.seed !== undefined && newConfig.seed !== oldSeed) {
          this.random = seededRandom(newConfig.seed);
      }
      
      if(moodOrGenreChanged) {
          console.log(`[FME] Mood or Genre changed. Re-initializing with new blueprint for mood: ${this.config.mood}`);
          const blueprint = getBlueprint(this.config.genre, this.config.mood);
          this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood);
          this.initialize();
      }
  }

  private _generatePromenade() {
    const scale = getScaleForMood(this.config.mood);
    const root = scale[0];
    const fifth = scale.find(n => (n - root) % 12 === 7) || scale[4] || (root + 7);
    const fourth = scale.find(n => (n - root) % 12 === 5) || scale[3] || (root + 5);

    const promenade: FractalEvent[] = [];
    const notes = [root, fifth, fourth, root];
    for (let i = 0; i < 4; i++) {
        // Accompaniment part for this bar
        promenade.push({
            type: 'accompaniment',
            note: notes[i] + 12, // Play one octave higher
            duration: 4.0, // Whole note
            time: i * 4.0, // Each note starts a new bar, assuming 4 beats per bar
            weight: 0.6,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.5, release: 2.5 }
        });
        // Bass part for this bar
         promenade.push({
            type: 'bass',
            note: notes[i],
            duration: 4.0,
            time: i * 4.0,
            weight: 0.7,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.0, release: 3.0 }
        });
    }
    this.promenadeBars = promenade;
  }

  private initialize() {
    this.random = seededRandom(this.config.seed);
    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5; 
    this.hasBassBeenMutated = false;
    
    console.log(`[FractalMusicEngine] Initialized with blueprint "${this.navigator.blueprint.name}". Total duration: ${this.navigator.totalBars} bars.`);
    this._generatePromenade();


    if (this.config.drumSettings.enabled) {
        const { events: drumAxiom } = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random);
        this.branches.push({ id: "drum_axiom_0", events: drumAxiom, weight: 1, age: 0, technique: "hit", type: "drums", endTime: 0 });
    }

    // --- BASS INITIALIZATION ---
    this.bassPhraseLibrary = [];
    for (let i = 0; i < 5; i++) {
        const seedPhrase = generateAmbientBassPhrase(this.config.mood, this.config.genre, this.random, this.config.tempo);
        this.bassPhraseLibrary.push( i > 0 ? mutateBassPhrase(seedPhrase, this.config.mood, this.config.genre, this.random) : seedPhrase );
    }
    this.currentBassPhrase = this.bassPhraseLibrary[0] || [];
    console.log(`%c[BassAxiom] Created new bass library with ${this.bassPhraseLibrary.length} seed phrases.`, 'color: #FF7F50');


    // --- ACCOMPANIMENT INITIALIZATION & MUTATION ---
    const initialBassNote = this.currentBassPhrase[0]?.note ?? getScaleForMood(this.config.mood)[0] ?? 40;
    let initialAccompPhrase = createAccompanimentAxiom(this.config.mood, this.config.genre, this.random, initialBassNote, this.config.tempo);
    
    // Macro-mutation for accompaniment on init
    const mutationCount = this.random.nextInt(3) + 2; // 2 to 4 mutations
    for(let i = 0; i < mutationCount; i++) {
      initialAccompPhrase = mutateAccompanimentPhrase(initialAccompPhrase, this.config.mood, this.config.genre, this.random);
    }
    this.currentAccompPhrase = initialAccompPhrase;
    console.log(`%c[AccompAxiom] Created and mutated initial accompaniment phrase (${mutationCount} iterations).`, 'color: #87CEEB');

    if (this.currentAccompPhrase.length > 0) {
        const endTime = this.currentAccompPhrase.reduce((max, e) => Math.max(max, e.time + e.duration), 0);
        this.harmonyBranches.push({ id: `harmony_axiom_0`, events: this.currentAccompPhrase, weight: 1, age: 0, technique: 'swell', type: 'harmony', endTime });
    }
    
    this.needsBassReset = false;
  }
  
  private _chooseInstrumentForPart(part: 'melody' | 'accompaniment', currentPartInfo: BlueprintPart | null): MelodyInstrument | AccompanimentInstrument | undefined {
        if (!currentPartInfo || !currentPartInfo.instrumentation || !currentPartInfo.instrumentation[part]) {
            // Fallback logic if no rules are defined
            const moodWeights = TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD[this.config.mood] || TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD['calm'];
            const options = Object.entries(moodWeights).map(([name, weight]) => ({ name: name as MelodyInstrument, weight }));
            
            if (options.length === 0) return undefined;
            
            const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
            let rand = this.random.next() * totalWeight;

            for (const option of options) {
                rand -= option.weight;
                if (rand <= 0) {
                    return option.name;
                }
            }
            return options[0].name;
        }

        const rules = currentPartInfo.instrumentation[part] as InstrumentationRules<any>;
        if (rules && rules.strategy === 'weighted' && rules.options.length > 0) {
            const totalWeight = rules.options.reduce((sum, opt) => sum + opt.weight, 0);
            let rand = this.random.next() * totalWeight;

            for (const option of rules.options) {
                rand -= option.weight;
                if (rand <= 0) {
                    return option.name;
                }
            }
            return rules.options[0].name; // Fallback to first option
        }

        return undefined;
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
  
  private generateDrumEvents(navInfo: NavigationInfo | null): FractalEvent[] {
    if (!navInfo) return [];
    
    const partId = navInfo.currentPart.id;
    const baseAxiom = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random).events;

    switch (partId) {
      case 'INTRO_1':
      case 'OUTRO':
        return baseAxiom.filter(event => {
            const type = Array.isArray(event.type) ? event.type[0] : event.type;
            return type.startsWith('perc-') || type.includes('ride') || type.includes('cymbal');
        }).map(event => ({ ...event, weight: event.weight * 0.5 }));

      case 'INTRO_2':
      case 'INTRO_3':
      case 'BUILD_1':
      case 'BUILD_2':
        const buildEvents = [...baseAxiom];
        if (this.random.next() < 0.6) {
             buildEvents.push({ 
                type: 'drum_closed_hi_hat_ghost', 
                note: 42, 
                duration: 0.25, 
                time: 0.75 + Math.floor(this.random.next() * 3) * 1, 
                weight: 0.3,
                technique: 'ghost', dynamics: 'p', phrasing: 'staccato', params: {}
             });
        }
        return buildEvents;

      case 'MAIN_1':
      case 'MAIN_2':
        return baseAxiom;

      case 'RELEASE':
      case 'BRIDGE':
        return baseAxiom.filter(event => {
            const type = Array.isArray(event.type) ? event.type[0] : event.type;
            return type.startsWith('perc-') || type.includes('ride') || type === 'drum_snare_ghost_note';
        });
      
      default:
        return [];
    }
  }

  private _applyMicroMutations(phrase: FractalEvent[], epoch: number): FractalEvent[] {
    if (phrase.length === 0) return [];
    const newPhrase = JSON.parse(JSON.stringify(phrase));

    // 1. Ритмический Дрейф (Rhythmic Drift)
    if (this.random.next() < 0.5) { // 50% шанс на сдвиг
        console.log(`%c[MicroMutation @ Bar ${epoch}] Rhythmic Drift applied.`, 'color: cyan');
        const noteToShift = newPhrase[this.random.nextInt(newPhrase.length)];
        const shiftAmount = (this.random.next() - 0.5) * 0.1; // Сдвиг на ±5% от доли
        noteToShift.time = Math.max(0, noteToShift.time + shiftAmount);
    }

    // 2. Динамический Акцент (Velocity Accent)
    if (this.random.next() < 0.6) { // 60% шанс на акцент
        console.log(`%c[MicroMutation @ Bar ${epoch}] Velocity Accent applied.`, 'color: cyan');
        const noteToAccent = newPhrase[this.random.nextInt(newPhrase.length)];
        noteToAccent.weight *= (0.85 + this.random.next() * 0.3); // Изменение громкости на ±15%
        noteToAccent.weight = Math.max(0.1, Math.min(1.0, noteToAccent.weight));
    }
    
    // 3. Регистровый Дрейф (Register Drift)
    if (this.random.next() < 0.3) { // 30% шанс на сдвиг октавы
        console.log(`%c[MicroMutation @ Bar ${epoch}] Register Drift applied.`, 'color: cyan');
        const octaveShift = (this.random.next() > 0.5) ? 12 : -12;
        newPhrase.forEach(note => {
            const newNote = note.note + octaveShift;
            // Ограничиваем, чтобы не уходить в слишком неблагозвучные регистры
            if (newNote > 36 && newNote < 84) {
                 note.note = newNote;
            }
        });
    }

    // Пересчитываем время, чтобы избежать наложений после сдвига
    let currentTime = 0;
    newPhrase.sort((a,b) => a.time - b.time).forEach(e => {
        e.time = currentTime;
        currentTime += e.duration;
    });

    return newPhrase;
  }
  
 private generateOneBar(barDuration: number, navInfo: NavigationInfo | null): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    let instrumentHints: InstrumentHints = {};
    if (!navInfo) {
        console.log(`[FME Check @ Bar ${this.epoch}] No navigation info available.`);
        return { events: [], instrumentHints: {} };
    }

    const output: FractalEvent[] = [];
    instrumentHints.accompaniment = this._chooseInstrumentForPart('accompaniment', navInfo.currentPart);
    instrumentHints.melody = this._chooseInstrumentForPart('melody', navInfo.currentPart);

    if (navInfo.currentPart.layers.bass) {
        if (!this.hasBassBeenMutated && this.epoch > 0) {
            const mutationCount = this.random.nextInt(2) + 2;
            console.log(`%c[BassEvolution @ Bar ${this.epoch}] Delayed MACRO-MUTATION (${mutationCount} iterations).`, 'color: #FF4500;');
            for (let i = 0; i < mutationCount; i++) {
                this.currentBassPhrase = mutateBassPhrase(this.currentBassPhrase, this.config.mood, this.config.genre, this.random);
            }
            this.hasBassBeenMutated = true;
        } else if (navInfo.isBundleTransition) {
            this.currentBassPhrase = mutateBassPhrase(this.currentBassPhrase, this.config.mood, this.config.genre, this.random);
            console.log(`%c[BassEvolution @ Bar ${this.epoch}] MICRO-MUTATION. Evolving current phrase.`, 'color: #DA70D6;');
        }
        output.push(...this.currentBassPhrase);
    }
    
    if (navInfo.currentPart.layers.drums) {
        let drumEvents: FractalEvent[];
        if (navInfo.isPartTransition && this.epoch > 0) {
            drumEvents = createDrumFill(this.random);
            console.log(`%c[Fill @ Bar ${this.epoch}] Generated DRUM FILL for part transition.`, 'color: #20B2AA;');
        } else {
            drumEvents = this.generateDrumEvents(navInfo);
        }
        output.push(...drumEvents);
    }
    
    let accompanimentEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.accompaniment) {
        if (navInfo.isPartTransition && this.epoch > 0) {
            this.currentAccompPhrase = mutateAccompanimentPhrase(this.currentAccompPhrase, this.config.mood, this.config.genre, this.random);
        }
        const mutatedAccomp = this._applyMicroMutations(this.currentAccompPhrase, this.epoch);
        accompanimentEvents.push(...mutatedAccomp);
        output.push(...mutatedAccomp);
    }
    
    if (navInfo.currentPart.layers.harmony) {
        const harmonyEvents = accompanimentEvents.map(event => ({ ...event, type: 'harmony' as InstrumentType }));
        output.push(...harmonyEvents);
        instrumentHints.harmony = chooseHarmonyInstrument(this.config.mood, this.random);
    }

    if (navInfo.currentPart.layers.melody) {
        const topNotes = extractTopNotes(accompanimentEvents, 4);
        if(topNotes.length > 0) {
            const melodyEvents = topNotes.map(note => ({
                ...note,
                type: 'melody' as InstrumentType,
                weight: Math.min(1.0, note.weight * 1.2), 
            }));
            output.push(...melodyEvents);
        }
    }

    const sfxChance = this.config.density * 0.1;
    const sparkleChance = this.config.density * 0.15;

    if (navInfo.currentPart.layers.sfx && this.random.next() < sfxChance) {
        console.log(`%c[FME Generate] SFX event TRIGGERED for bar ${this.epoch}.`, 'color: #FFA500');
        output.push({
            type: 'sfx', note: 60, duration: 2, time: this.random.next() * 2, weight: 0.5,
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { mood: this.config.mood, genre: this.config.genre }
        });
    }
    if (navInfo.currentPart.layers.sparkles && this.random.next() < sparkleChance) {
        console.log(`%c[FME Generate] Sparkle event TRIGGERED for bar ${this.epoch}.`, 'color: #00FFFF');
         output.push({
            type: 'sparkle', note: 72, duration: 1, time: this.random.next() * 3.5, weight: 0.4,
            technique: 'hit', dynamics: 'p', phrasing: 'staccato',
            params: { mood: this.config.mood, genre: this.config.genre }
        });
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
    
    const navInfo = this.navigator.tick(this.epoch);

    if (this.epoch % 2 === 1) {
        if (navInfo?.currentPart.layers.bass && this.random.next() < this.config.density * 0.4 && this.branches.filter(b => b.type === 'bass').length < 4) {
            const parent = this.selectBranchForMutation('bass');
            if (parent) {
                const child = this.mutateBranch(parent);
                if (child) this.branches.push(child);
            }
        }
        if ((navInfo?.currentPart.layers.accompaniment || navInfo?.currentPart.layers.harmony) && this.random.next() < this.config.density * 0.3 && this.harmonyBranches.length < 4) {
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
        this.currentBassPhrase = generateAmbientBassPhrase(this.config.mood, this.config.genre, this.random, this.config.tempo);
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

  private _resetForNewSuite() {
      console.log(`%c[FME] Resetting for new suite.`, 'color: green; font-weight: bold;');
      this.epoch = 0;
      this.isPromenadeActive = false;
      this.branches = [];
      this.harmonyBranches = [];
      this.initialize(); // Re-initialize everything for a fresh start
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    this.epoch = barCount;

    // Check if it's time to start the promenade
    if (!this.isPromenadeActive && this.epoch >= this.navigator.totalBars && this.navigator.totalBars > 0) {
      console.log(`%c[FME] End of suite reached. Activating PROMENADE.`, 'color: #FFD700; font-weight: bold');
      this.isPromenadeActive = true;
      // Immediately return the full promenade score. The next tick will trigger the reset.
      return {
        events: this.promenadeBars,
        instrumentHints: { bass: 'glideBass', accompaniment: 'synth' }
      };
    }
    
    // Check if we need to reset after the promenade has conceptually "finished"
    if (this.isPromenadeActive) {
      this._resetForNewSuite();
      // After reset, we generate the first bar of the new suite
    }
    
    if (this.needsBassReset) {
        console.log(`%c[RESET] Bass reset flag is true. Resetting...`, 'color: red');
        this.currentBassPhrase = generateAmbientBassPhrase(this.config.mood, this.config.genre, this.random, this.config.tempo);
        this.needsBassReset = false;
    }

    if (this.epoch > 0 && this.epoch >= this.nextWeatherEventEpoch) {
        this.generateExternalImpulse();
        this.nextWeatherEventEpoch = this.epoch + this.random.nextInt(12) + 8;
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
    
    const navigationInfo = this.navigator.tick(this.epoch);
    
    const { events, instrumentHints } = this.generateOneBar(barDuration, navigationInfo);
    
    if (navigationInfo?.logMessage) {
        console.log(navigationInfo.logMessage, 'color: green; font-style: italic;');
    }
    
    this.evolveBranches();
    
    this.time += barDuration;
    
    return { events, instrumentHints };
  }
}
