

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord } from '@/types/fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill as createBassFillFromTheory, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateAccompanimentPhrase as originalMutateAccompPhrase, generateGhostHarmonyTrack, createHarmonyAxiom, mutateBassPhrase, createMelodyMotif } from './music-theory';
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
const isMelody = (event: FractalEvent): boolean => event.type === 'melody';
const isKick = (event: FractalEvent): boolean => event.type === 'drum_kick';
const isSnare = (event: FractalEvent): boolean => event.type === 'drum_snare';
const isRhythmic = (event: FractalEvent): boolean => (event.type as string).startsWith('drum_') || (event.type as string).startsWith('perc-');


// === АКСОМЫ И ТРАНСФОРМАЦИИ ===

function mutateAccompanimentPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    if (newPhrase.length === 0) return [];
    
    const mutationType = random.nextInt(4);
    switch (mutationType) {
        case 0: // Изменение ритма (арпеджио -> аккорд и наоборот)
            if (newPhrase.length > 1) {
                const totalDuration = newPhrase.reduce((sum, e) => sum + e.duration, 0);
                newPhrase.splice(1); // Оставляем только первую ноту
                newPhrase[0].duration = totalDuration;
                newPhrase[0].time = 0;
            }
            break;
        case 1: // Смена октавы
            const octaveShift = (random.next() > 0.5) ? 12 : -12;
            newPhrase.forEach(e => e.note += octaveShift);
            break;
        case 2: // Ретроград (обратное движение)
            const noteOrder = newPhrase.map(e => e.note).reverse();
            newPhrase.forEach((e, i) => e.note = noteOrder[i]);
            break;
        case 3: // Добавление гармонического тона
            if (newPhrase.length < 5) {
                const scale = getScaleForMood(mood);
                const newNoteMidi = scale[random.nextInt(scale.length)] + 12 * 4;
                const lastNote = newPhrase[newPhrase.length - 1];
                newPhrase.push({ ...lastNote, note: newNoteMidi, time: lastNote.time + 0.1 });
            }
            break;
    }

    return newPhrase;
}



const VOICE_LIMITS = {
    accompaniment: 6,
    melody: 3,
};


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
  
  private ghostHarmonyTrack: GhostChord[] = []; // The harmonic "skeleton"
  
  public navigator: BlueprintNavigator;
  private isPromenadeActive: boolean = false;
  private promenadeBars: FractalEvent[] = [];


  private bassPhraseLibrary: FractalEvent[][] = [];
  private currentBassPhraseIndex = 0;

  private accompPhraseLibrary: FractalEvent[][] = [];
  private currentAccompPhraseIndex = 0;

  private currentMelodyMotif: FractalEvent[] = [];
  private lastMelodyPlayEpoch: number = -4; // Start with a delay


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
    
    // --- GHOST HARMONY INITIALIZATION ---
    const key = getScaleForMood(this.config.mood)[0];
    this.ghostHarmonyTrack = generateGhostHarmonyTrack(this.navigator.totalBars, this.config.mood, key, this.random);
    if (this.ghostHarmonyTrack.length === 0) {
      throw new Error("[Engine] CRITICAL ERROR: Could not generate 'Ghost Harmony'. Music is not possible.");
    }

    console.log(`[FractalMusicEngine] Initialized with blueprint "${this.navigator.blueprint.name}". Total duration: ${this.navigator.totalBars} bars.`);
    this._generatePromenade();

    this.bassPhraseLibrary = [];
    this.currentBassPhraseIndex = 0;
    this.accompPhraseLibrary = [];
    this.currentAccompPhraseIndex = 0;

    const firstChord = this.ghostHarmonyTrack[0];
    for (let i = 0; i < 4; i++) {
        this.bassPhraseLibrary.push(generateAmbientBassPhrase(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo));
        this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo));
    }
    
    this.currentMelodyMotif = createMelodyMotif(firstChord, this.config.mood, this.random);
    this.lastMelodyPlayEpoch = -4;
    
    this.needsBassReset = false;
  }
  
  private _chooseInstrumentForPart(part: 'melody' | 'accompaniment', currentPartInfo: BlueprintPart | null): MelodyInstrument | AccompanimentInstrument | undefined {
        if (!currentPartInfo || !currentPartInfo.instrumentation || !currentPartInfo.instrumentation[part]) {
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
    const { drumFill, bassFill, accompanimentFill } = createSfxScenario(this.config.mood, this.config.genre, this.random);

    this.sfxFillForThisEpoch = {
        drum: drumFill,
        bass: bassFill,
        accompaniment: accompanimentFill
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
    
    const drumRules = navInfo.currentPart.instrumentRules?.drums;
    if (drumRules && drumRules.pattern === 'none') {
        return [];
    }
    
    const baseAxiom = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random).events;
    
    if (navInfo.currentPart.id.includes('INTRO') || navInfo.currentPart.id.includes('RELEASE')) {
        if (!drumRules?.ride?.enabled) {
            return baseAxiom.filter(e => !(e.type as string).includes('ride'));
        }
    }
    
    return baseAxiom;
  }

  private _applyMicroMutations(phrase: FractalEvent[], epoch: number): FractalEvent[] {
    if (phrase.length === 0) return [];
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));

    if (this.random.next() < 0.5) { 
        const noteToShift = newPhrase[this.random.nextInt(newPhrase.length)];
        const shiftAmount = (this.random.next() - 0.5) * 0.1;
        noteToShift.time = Math.max(0, noteToShift.time + shiftAmount);
    }

    if (this.random.next() < 0.6) {
        const noteToAccent = newPhrase[this.random.nextInt(newPhrase.length)];
        noteToAccent.weight *= (0.85 + this.random.next() * 0.3);
        noteToAccent.weight = Math.max(0.1, Math.min(1.0, noteToAccent.weight));
    }
    
    if (epoch % 4 === 0 && this.random.next() < 0.3) {
        const octaveShift = (this.random.next() > 0.5) ? 12 : -12;
        newPhrase.forEach(note => {
            const newNote = note.note + octaveShift;
            if (newNote > 36 && newNote < 84) {
                 note.note = newNote;
            }
        });
    }

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
        return { events: [], instrumentHints: {} };
    }
    
    const currentChord = this.ghostHarmonyTrack.find(chord => this.epoch >= chord.bar && this.epoch < chord.bar + chord.durationBars);
    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return { events: [], instrumentHints: {} };
    }
    
    let allEvents: FractalEvent[] = [];
    instrumentHints.accompaniment = this._chooseInstrumentForPart('accompaniment', navInfo.currentPart);
    instrumentHints.melody = this._chooseInstrumentForPart('melody', navInfo.currentPart);
    
    const isIntro = navInfo.currentPart.id.startsWith('INTRO');
    const canVary = !isIntro || navInfo.currentPart.id.includes('3');
    const PHRASE_VARIATION_INTERVAL = 4;
    
    if (canVary && this.epoch > 0 && this.epoch % PHRASE_VARIATION_INTERVAL === 0) {
        this.currentBassPhraseIndex = (this.currentBassPhraseIndex + 1) % this.bassPhraseLibrary.length;
        if (this.random.next() < 0.6) {
            this.bassPhraseLibrary[this.currentBassPhraseIndex] = mutateBassPhrase(this.bassPhraseLibrary[this.currentBassPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
        }
        this.currentAccompPhraseIndex = (this.currentAccompPhraseIndex + 1) % this.accompPhraseLibrary.length;
        if (this.random.next() < 0.6) {
            this.accompPhraseLibrary[this.currentAccompPhraseIndex] = mutateAccompanimentPhrase(this.accompPhraseLibrary[this.currentAccompPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
        }
    }

    let bassEvents = navInfo.currentPart.layers.bass ? this.bassPhraseLibrary[this.currentBassPhraseIndex] : [];
    let drumEvents = navInfo.currentPart.layers.drums ? this.generateDrumEvents(navInfo) : [];
    let accompEvents = navInfo.currentPart.layers.accompaniment ? this.accompPhraseLibrary[this.currentAccompPhraseIndex] : [];
    let harmonyEvents: FractalEvent[] = [];
    let melodyEvents: FractalEvent[] = [];

    // #ЗАЧЕМ: Этот блок отвечает за создание фонового гармонического слоя.
    // #ЧТО: Он определяет инструмент для гармонии и создает для него музыкальную фразу, используя createHarmonyAxiom.
    // #СВЯЗИ: Зависит от `currentChord` и блюпринта (`navInfo`).
    if (navInfo.currentPart.layers.harmony) {
        instrumentHints.harmony = chooseHarmonyInstrument(this.config.mood, this.random);
        harmonyEvents = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random);
    }
    
    // #ЗАЧЕМ: Этот блок создает основную мелодическую линию.
    // #ЧТО: Он проверяет, пора ли играть мелодию, и генерирует/мутирует мелодический мотив.
    // #СВЯЗИ: Зависит от `currentChord` и `this.currentMelodyMotif` для эволюции.
    if (navInfo.currentPart.layers.melody) {
        const melodyPlayInterval = 4;
        if (this.epoch >= this.lastMelodyPlayEpoch + melodyPlayInterval) {
             if (this.epoch > 0) {
                 this.currentMelodyMotif = createMelodyMotif(currentChord, this.config.mood, this.random, this.currentMelodyMotif);
             }
            melodyEvents = this.currentMelodyMotif;
            this.lastMelodyPlayEpoch = this.epoch;
        }
    }
    
    // Применение "Бюджета Голосов"
    if (accompEvents.length > VOICE_LIMITS.accompaniment) {
        accompEvents = accompEvents.slice(0, VOICE_LIMITS.accompaniment);
    }
    if (melodyEvents.length > VOICE_LIMITS.melody) {
        melodyEvents = melodyEvents.slice(0, VOICE_LIMITS.melody);
    }

    allEvents.push(...bassEvents, ...drumEvents, ...accompEvents, ...harmonyEvents, ...melodyEvents);
    
    if (navInfo.currentPart.layers.sparkles && this.random.next() < 0.1) {
        allEvents.push({ type: 'sparkle', note: 60, time: this.random.next() * 4, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre}});
    }
    if (navInfo.currentPart.layers.sfx && this.random.next() < 0.08) {
        allEvents.push({ type: 'sfx', note: 60, time: this.random.next() * 4, duration: 2, weight: 0.6, technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre}});
    }

    // Финальное логирование перед отправкой
    console.log(`[FME.generateOneBar] Generated Events: Total=${allEvents.length}, Harmony=${harmonyEvents.length}, Melody=${melodyEvents.length}, Accomp=${accompEvents.length}, Bass=${bassEvents.length}, Drums=${drumEvents.length}`);

    return { events: allEvents, instrumentHints };
  }


  private _resetForNewSuite() {
      console.log(`%c[FME] Resetting for new suite.`, 'color: green; font-weight: bold;');
      this.epoch = 0;
      this.isPromenadeActive = false;
      this.initialize(); // Re-initialize everything for a fresh start
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    this.epoch = barCount;

    if (!this.isPromenadeActive && this.epoch >= this.navigator.totalBars && this.navigator.totalBars > 0) {
      console.log(`%c[FME] End of suite reached. Activating PROMENADE.`, 'color: #FFD700; font-weight: bold');
      this.isPromenadeActive = true;
      return {
        events: this.promenadeBars,
        instrumentHints: { bass: 'glideBass', accompaniment: 'synth' }
      };
    }
    
    if (this.isPromenadeActive) {
      this._resetForNewSuite();
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
    
    const navigationInfo = this.navigator.tick(this.epoch);

    // #ЗАЧЕМ: Этот блок обеспечивает вывод отладочной информации от Навигатора.
    // #ЧТО: Он проверяет, было ли сгенерировано сообщение в `navigationInfo`, и если да, выводит его.
    // #СВЯЗИ: Восстанавливает утерянное логирование, критически важное для понимания смены частей и бандлов.
    if (navigationInfo && navigationInfo.logMessage) {
        console.log(navigationInfo.logMessage);
    }
    
    const { events, instrumentHints } = this.generateOneBar(barDuration, navigationInfo);
    
    
    this.time += barDuration;
    
    return { events, instrumentHints };
  }
}
