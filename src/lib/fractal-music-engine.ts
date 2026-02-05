
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree, SuiteDNA, RhythmicFeel, BassStyle, DrumStyle, HarmonicCenter, NavigationInfo, Stage } from '@/types/music';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { BlueprintNavigator } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';

// --- МУЗЫКАЛЬНЫЕ АССЕТЫ (БАЗА ЗНАНИЙ) ---
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_GUITAR_RIFFS, BLUES_GUITAR_VOICINGS } from './assets/blues-guitar-riffs';
import { BLUES_MELODY_RIFFS } from './assets/blues-melody-riffs';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';

import { 
    getScaleForMood, 
    generateSuiteDNA, 
    createDrumAxiom, 
    createHarmonyAxiom, 
    createAmbientMelodyMotif, 
    mutateBassPhrase, 
    createBassFill, 
    createDrumFill, 
    chooseHarmonyInstrument, 
    mutateBluesAccompaniment, 
    mutateBluesMelody, 
    createBluesOrganLick, 
    generateIntroSequence, 
    createAmbientBassAxiom,
    createBluesBassAxiom,
    generateBluesMelodyChorus,
    transposeMelody,
    invertMelody,
    varyRhythm,
    addOrnaments,
    DEGREE_TO_SEMITONE
} from './music-theory';


export type Branch = {
  id: string;
  events: FractalEvent[];
  weight: number;
  age: number;
  technique: Technique;
  type: 'bass' | 'drums' | 'accompaniment' | 'harmony' | 'melody';
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
  seed: number;
  composerControlsInstruments?: boolean;
  useMelodyV2?: boolean;
  introBars: number;
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
      nextInt: (max: number) => Math.floor(self.next() * max),
       shuffle: <T>(array: T[]): T[] => {
        let currentIndex = array.length, randomIndex;
        const newArray = [...array];
        while (currentIndex !== 0) {
            randomIndex = Math.floor(self.next() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
        }
        return newArray;
    }
  };
  return self;
}

const isBass = (event: FractalEvent): boolean => event.type === 'bass';
const isAccompaniment = (event: FractalEvent): boolean => event.type === 'accompaniment';
const isHarmony = (event: FractalEvent): boolean => event.type === 'harmony';
const isMelody = (event: FractalEvent): boolean => event.type === 'melody';
const isRhythmic = (event: FractalEvent): boolean => (event.type as string).startsWith('drum_') || (event.type as string).startsWith('perc-');


// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig;
  private time: number = 0;
  public epoch = 0;
  public random: { next: () => number; nextInt: (max: number) => number; shuffle: <T>(array: T[]) => T[]; };
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private lastAccompanimentEndTime: number = -Infinity;
  private nextAccompanimentDelay: number = 0;
  private hasBassBeenMutated = false;
  
  public suiteDNA: SuiteDNA | null = null; 
  
  public navigator: BlueprintNavigator | null = null;

  public introInstrumentOrder: InstrumentPart[] = [];
  
  private isInitialized = false;

  private bassPhraseLibrary: FractalEvent[][] = [];
  private currentBassPhraseIndex = 0;

  private accompPhraseLibrary: FractalEvent[][] = [];
  private currentAccompPhraseIndex = 0;

  private currentMelodyMotif: FractalEvent[] = [];
  private lastMelodyPlayEpoch: number = -16;
  private wasMelodyPlayingLastBar: boolean = false;

  private shuffledBassRiffIndices: number[] = [];
  private shuffledDrumRiffIndices: number[] = [];
  private shuffledGuitarRiffIDs: string[] = [];

  private bassRiffConveyorIndex = 0;
  private drumRiffConveyorIndex = 0;
  private melodyConveyorIndex = 0;
  private guitarRiffConveyorIndex = 0;

  private currentDrumRiffIndex: number = 0;
  private currentBassRiffIndex: number = 0;
  private currentGuitarRiffId: string | null = null;

  private melodyHistory: string[] = [];
  private cachedMelodyChorus: { bar: number, events: FractalEvent[] } = { bar: -1, events: [] };
  
  private previousChord: GhostChord | null = null;

  // #ЗАЧЕМ: Память "Кумулятивного Ансамбля".
  // #ЧТО: Карта активированных инструментов и их тембров.
  private activatedInstruments: Map<InstrumentPart, string> = new Map();

  // #ЗАЧЕМ: Память "Тематических Крючков" (Thematic Memory).
  // #ЧТО: Хранит удачные музыкальные фразы для повторения в конце сюиты.
  private hookLibrary: { events: FractalEvent[], root: number }[] = [];


  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed);
    this.nextWeatherEventEpoch = 0; 
  }

  public get tempo(): number { return this.config.tempo; }
  
  public updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      const introBarsChanged = newConfig.introBars !== undefined && newConfig.introBars !== this.config.introBars;
      const seedChanged = newConfig.seed !== undefined && newConfig.seed !== this.config.seed;
      
      this.config = { ...this.config, ...newConfig };
      
      if (seedChanged) {
        this.random = seededRandom(this.config.seed);
      }
      
      if(moodOrGenreChanged || introBarsChanged || seedChanged) {
          this.initialize(true);
      }
  }

  /**
   * #ЗАЧЕМ: Инициализирует движок с уникальным состоянием.
   * #ЧТО: Генерирует ДНК, перемешивает индексы риффов, сбрасывает память.
   * #ОБНОВЛЕНО (ПЛАН 81): Добавлена принудительная встряска при старте для гарантии уникальности первого такта.
   */
  public initialize(force: boolean = false) {
    if (this.isInitialized && !force) {
        return;
    }

    this.random = seededRandom(this.config.seed);

    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5;
    this.hasBassBeenMutated = false;
    
    // Сброс памяти ансамбля, крючков и истории мелодии
    this.activatedInstruments.clear(); 
    this.hookLibrary = [];
    this.melodyHistory = [];
    this.cachedMelodyChorus = { bar: -1, events: [] };
    
    const allBassRiffs = BLUES_BASS_RIFFS[this.config.mood] ?? BLUES_BASS_RIFFS['contemplative'];
    if (allBassRiffs && allBassRiffs.length > 0) {
        this.shuffledBassRiffIndices = this.random.shuffle(Array.from({ length: allBassRiffs.length }, (_, i) => i));
        this.currentBassRiffIndex = this.shuffledBassRiffIndices[0] ?? 0;
    }

    const allDrumRiffs = BLUES_DRUM_RIFFS[this.config.mood] ?? BLUES_DRUM_RIFFS['contemplative'] ?? [];
    if (allDrumRiffs.length > 0) {
        this.shuffledDrumRiffIndices = this.random.shuffle(Array.from({ length: allDrumRiffs.length }, (_, i) => i));
        this.currentDrumRiffIndex = this.shuffledDrumRiffIndices[0] ?? 0;
    }
    
    this.shuffledGuitarRiffIDs = this.random.shuffle(BLUES_GUITAR_RIFFS.map(r => r.id));
    this.currentGuitarRiffId = this.shuffledGuitarRiffIDs[0] ?? null;
    
    const blueprint = getBlueprint(this.config.genre, this.config.mood);
    
    this.suiteDNA = generateSuiteDNA(
        blueprint.structure.totalDuration.preferredBars,
        this.config.mood,
        this.config.seed,
        this.random,
        this.config.genre,
        blueprint.structure.parts
    );
    
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.suiteDNA.soloPlanMap);
    
    this.config.tempo = this.suiteDNA.baseTempo;
    this.bassPhraseLibrary = [];
    this.accompPhraseLibrary = [];
    
    // #ЗАЧЕМ: "Встряска" для первого такта.
    // #ЧТО: Пропускаем несколько холостых циклов рандомайзера.
    for(let i=0; i < 5; i++) this.random.next();

    this.isInitialized = true;
    console.log(`%c[Engine] Initialized. Mood: ${this.config.mood}, Genre: ${this.config.genre}, Seed: ${this.config.seed}`, 'color: #32CD32; font-weight: bold;');
  }
  
    private generateDrumEvents(navInfo: NavigationInfo | null): FractalEvent[] {
        if (!navInfo || !this.suiteDNA) return [];
        const drumRules = navInfo.currentPart.instrumentRules?.drums;
        if (!navInfo.currentPart.layers.drums || (drumRules && drumRules.pattern === 'none')) {
            return [];
        }
        
        const kitName = drumRules?.kitName || `${this.config.genre}_${this.config.mood}`.toLowerCase();
        const baseKit = (DRUM_KITS[this.config.genre] as any)?.[kitName] ||
                        (DRUM_KITS[this.config.genre] as any)?.[this.config.mood] ||
                        DRUM_KITS.ambient!.intro!;
        
        if (!baseKit) return [];
    
        const axiomResult = createDrumAxiom(baseKit, this.config.genre, this.config.mood, this.suiteDNA.baseTempo, this.random, drumRules);
        return axiomResult.events;
    }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    if (!this.navigator) return { events: [], instrumentHints: {} };

    this.epoch = barCount;

    if (this.epoch >= this.navigator.totalBars + 4) return { events: [], instrumentHints: {} };

    if (this.epoch >= this.navigator.totalBars) {
        return { events: this._generatePromenade(this.epoch - this.navigator.totalBars), instrumentHints: {} };
    }

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {} };

    // #ЗАЧЕМ: Реализация принципа "Кумулятивного Ансамбля" (Sticky Ensemble).
    // #ЧТО: Мы перестали очищать память ансамбля на границах частей.
    //      Теперь инструменты вступают и остаются в оркестре, пока Блюпринт
    //      не даст явную команду на смену тембра или отключение.
    // REMOVED: if (navInfo.isPartTransition) { this.activatedInstruments.clear(); }

    const instrumentHints: InstrumentHints = {};
    const stages = navInfo.currentPart.stagedInstrumentation;

    if (stages && stages.length > 0) {
        const progress = (this.epoch - navInfo.currentPartStartBar) / (navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1);
        let accumulated = 0;
        let currentStage: Stage = stages[stages.length - 1];
        for (const stage of stages) {
            accumulated += stage.duration.percent;
            if (progress * 100 <= accumulated) {
                currentStage = stage;
                break;
            }
        }

        Object.entries(currentStage.instrumentation).forEach(([part, rule]) => {
            const p = part as InstrumentPart;
            
            if (rule.transient) {
                if (this.random.next() < rule.activationChance) {
                    const timbre = this.pickWeighted(rule.instrumentOptions);
                    (instrumentHints as any)[p] = timbre;
                }
            } else {
                if (!this.activatedInstruments.has(p)) {
                    if (this.random.next() < rule.activationChance) {
                        const chosenTimbre = this.pickWeighted(rule.instrumentOptions);
                        this.activatedInstruments.set(p, chosenTimbre);
                        console.log(`%c[Engine] Sticky Activation: Instrument '${p}' fixed with timbre '${chosenTimbre}'`, 'color: #00BFFF; font-weight: bold;');
                    }
                }
            }
        });

        if (this.activatedInstruments.size === 0) {
            const possible = Object.keys(currentStage.instrumentation) as InstrumentPart[];
            const nonTransient = possible.filter(p => !currentStage.instrumentation[p]?.transient);
            if (nonTransient.length > 0) {
                const best = nonTransient.sort((a, b) => (currentStage.instrumentation[b]?.activationChance || 0) - (currentStage.instrumentation[a]?.activationChance || 0))[0];
                const chosenTimbre = this.pickWeighted(currentStage.instrumentation[best]!.instrumentOptions);
                this.activatedInstruments.set(best, chosenTimbre);
            }
        }
    } else {
        // #ЗАЧЕМ: Поддержка логики "Если не определено - играет старое" для бесстадийных частей (MAIN, SOLO).
        const instrumentation = navInfo.currentPart.instrumentation;
        if (instrumentation) {
            Object.keys(instrumentation).forEach(partKey => {
                const p = partKey as InstrumentPart;
                // Обновляем тембр только если это начало части или инструмент еще не в составе
                if (navInfo.isPartTransition || !this.activatedInstruments.has(p)) {
                    const chosenTimbre = this._chooseInstrumentForPart(p as any, navInfo);
                    if (chosenTimbre && chosenTimbre !== 'none') {
                        this.activatedInstruments.set(p, chosenTimbre);
                    } else if (chosenTimbre === 'none') {
                        this.activatedInstruments.delete(p);
                    }
                }
            });
        }
        
        // Ударные - липкий кит
        if (navInfo.currentPart.layers.drums) {
            if (!this.activatedInstruments.has('drums') || navInfo.isPartTransition) {
                const kitName = navInfo.currentPart.instrumentRules?.drums?.kitName || 'default';
                this.activatedInstruments.set('drums', kitName);
            }
        } else {
            this.activatedInstruments.delete('drums');
        }
    }

    // #ЗАЧЕМ: Синхронизация hints с памятью ансамбля.
    // #ЧТО: Мы всегда заполняем hints из актуальной памяти activatedInstruments.
    this.activatedInstruments.forEach((timbre, part) => {
        (instrumentHints as any)[part] = timbre;
    });
    
    // Принудительные слои
    if (navInfo.currentPart.layers.pianoAccompaniment) {
        instrumentHints.pianoAccompaniment = 'piano';
    }

    if (navInfo.logMessage) {
        const log = this.navigator.formatLogMessage(navInfo, instrumentHints, this.epoch);
        if (log) {
            console.log(log, 'color: #32CD32; font-weight: bold; background: #1a1a1a;');
        }
    }
    
    return { ...this.generateOneBar(barDuration, navInfo, instrumentHints), instrumentHints };
}

 private _chooseInstrumentForPart(part: 'melody' | 'bass' | 'accompaniment' | 'harmony', navInfo: NavigationInfo | null): any {
    const rules = navInfo?.currentPart.instrumentation?.[part];
    if (!rules || !rules.strategy || rules.strategy !== 'weighted') return 'none';

    const options = (part === 'harmony') ? (rules as any).options : (this.config.useMelodyV2 && (rules as any).v2Options?.length > 0) ? (rules as any).v2Options : (rules as any).v1Options;
    if (!options || options.length === 0) return 'none';
    return this.pickWeighted(options);
}

  private _generatePromenade(promenadeBar: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    if (promenadeBar === 0) {
        events.push({ type: 'bass', note: 36, duration: 8, time: 0, weight: 0.6, technique: 'drone', dynamics: 'p', phrasing: 'legato', params: { attack: 3.5, release: 4.5, cutoff: 120, resonance: 0.5, distortion: 0.1, portamento: 0 } });
        events.push({ type: 'accompaniment', note: 48, duration: 8, time: 0, weight: 0.4, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 4.0, release: 4.0 } });
    }
    return events;
  }

  private pickWeighted<T>(options: { name: T, weight: number }[]): T {
      const total = options.reduce((sum, opt) => sum + opt.weight, 0);
      let rand = this.random.next() * total;
      for (const opt of options) {
          rand -= opt.weight;
          if (rand <= 0) return opt.name;
      }
      return options[options.length - 1].name;
  }
  
  private generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): { events: FractalEvent[] } {
    if (!this.suiteDNA) return { events: [] };
    const effectiveBar = this.epoch;
    
    const foundChord = this.suiteDNA.harmonyTrack.find(chord => effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars);
    let currentChord: GhostChord = foundChord || this.previousChord || this.suiteDNA.harmonyTrack[0];
    this.previousChord = currentChord;
    
    // 1. Drums
    const drumEvents = instrumentHints.drums ? (this.generateDrumEvents(navInfo) || []) : [];

    // 2. Melody
    let melodyEvents: FractalEvent[] = [];
    const melodyRules = navInfo.currentPart.instrumentRules?.melody;

    if (instrumentHints.melody && melodyRules) {
        const ratio = melodyRules.soloToPatternRatio ?? 0.7; // solo vs pattern lottery
        
        if (this.random.next() < ratio && melodyRules.source === 'blues_solo') {
            // PLAY SOLO
            const { events: soloEvents } = generateBluesMelodyChorus(currentChord, this.random, navInfo.currentPart.id, this.epoch, melodyRules, this.suiteDNA, this.melodyHistory, this.cachedMelodyChorus);
            melodyEvents = soloEvents;
        } else if (melodyRules.source === 'blues_solo') {
            // #ЗАЧЕМ: Реализация требования "30% фингерстайл".
            // #ЧТО: Если кубик выпал на паттерн, мы генерируем событие перебора (Travis Picking).
            // #СВЯЗИ: Гитарные сэмплеры отработают это как полноценный аккордовый рисунок.
            melodyEvents.push({
                type: 'melody', 
                note: currentChord.rootNote, 
                time: 0, 
                duration: 4.0, 
                weight: 0.8,
                technique: 'F_TRAVIS', // Triggers pattern in sampler
                dynamics: 'mf', 
                phrasing: 'legato',
                params: { barCount: effectiveBar, voicingName: 'Em7_open' }
            });
        } else {
            // Fallback for non-blues styles
            melodyEvents.push({
                type: 'melody', note: currentChord.rootNote, time: 0, duration: 4.0, weight: 0.8,
                technique: 'pluck', dynamics: 'mf', phrasing: 'legato',
                params: { barCount: effectiveBar, voicingName: 'Em7_open' }
            });
        }
    }

    // #ЗАЧЕМ: Реализация "Тематических Крючков" (Dynamic Hooks).
    // #ЧТО: Запоминает мелодию в начале и возвращает её во второй половине.
    // 1. Запись (Recording): Если мы в первой трети и есть мелодия
    if (this.epoch > 12 && this.epoch < 60 && melodyEvents.length > 0 && this.hookLibrary.length < 3) {
        if (this.random.next() < 0.15) {
            this.hookLibrary.push({ 
                events: JSON.parse(JSON.stringify(melodyEvents)), 
                root: currentChord.rootNote 
            });
            console.log(`%c[DNA] Hook Recorded at Bar ${this.epoch}`, 'color: #ADFF2F; font-weight: bold;');
        }
    }

    // 2. Реприза (Recall): Если мы во второй половине и есть крючки
    if (this.epoch > 72 && this.hookLibrary.length > 0 && melodyEvents.length > 0) {
        if (this.random.next() < 0.25) { // 25% шанс повторить тему
            const hook = this.hookLibrary[this.random.nextInt(this.hookLibrary.length)];
            // Умная транспозиция под текущий аккорд
            melodyEvents = hook.events.map(e => ({
                ...e,
                note: e.note - hook.root + currentChord.rootNote,
                weight: Math.min(1.0, e.weight + 0.05), // Чуть ярче при повторе
                params: { ...e.params, isHook: true, originalBar: (hook.events[0].params as any)?.barCount }
            }));
            console.log(`%c[DNA] Reprise! Hook Recalled at Bar ${this.epoch}`, 'color: #FFD700; font-weight: bold; background: #222;');
        }
    }

    if (['telecaster', 'blackAcoustic', 'darkTelecaster', 'electricGuitar', 'guitar_shineOn', 'guitar_muffLead', 'guitar_nightmare_solo'].includes(instrumentHints.melody || '')) {
        melodyEvents.forEach(e => e.note += 24);
    }

    // 3. Accompaniment
    let accompEvents: FractalEvent[] = [];
    if (instrumentHints.accompaniment) {
        const accompRules = navInfo.currentPart.instrumentRules?.accompaniment;
        const technique = (accompRules?.techniques?.[0]?.value || 'long-chords') as AccompanimentTechnique;
        accompEvents = this.createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, accompRules?.register?.preferred, technique);
    }

    // 4. Harmony
    let harmonyEvents: FractalEvent[] = [];
    if (instrumentHints.harmony) {
        harmonyEvents.push(...createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random, effectiveBar));
    }
    
    // 5. Piano Accompaniment
    let pianoEvents: FractalEvent[] = [];
    if (instrumentHints.pianoAccompaniment) {
        pianoEvents.push(...this.createPianoAccompaniment(currentChord, this.random));
    }

    // 6. Bass
    let bassEvents: FractalEvent[] = [];
    if (instrumentHints.bass) {
        if (this.config.genre === 'blues') {
            bassEvents = createBluesBassAxiom(currentChord, 'riff', this.random, this.config.mood, this.epoch, this.suiteDNA, this.currentBassRiffIndex);
        } else {
            bassEvents = createAmbientBassAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, navInfo.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone');
        }
    }

    const allEvents = [...bassEvents, ...drumEvents, ...accompEvents, ...melodyEvents, ...harmonyEvents, ...pianoEvents];
    
    // 7. SFX
    if (instrumentHints.sfx) {
        const sfxRules = navInfo.currentPart.instrumentRules?.sfx as SfxRule | undefined;
        if (sfxRules && this.random.next() < sfxRules.eventProbability) {
            allEvents.push({ type: 'sfx', note: 60, time: this.random.next() * 4, duration: 2, weight: 0.6, technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: { mood: this.config.mood, genre: this.config.genre, rules: sfxRules } } as any);
        }
    }

    // 8. Sparkles
    if (instrumentHints.sparkles) {
        const sparkleRules = navInfo.currentPart.instrumentRules?.sparkles;
        if (sparkleRules && this.random.next() < (sparkleRules.eventProbability || 0.1)) {
            allEvents.push({ type: 'sparkle', note: 60, time: this.random.next() * 4, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre}} as any);
        }
    }
    
    return { events: allEvents };
  }

  private createAccompanimentAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number; }, tempo: number, registerHint: 'low' | 'mid' | 'high' = 'mid', technique: AccompanimentTechnique): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const rootNote = chord.rootNote;
    const baseOctave = (registerHint === 'low') ? 2 : (registerHint === 'high' ? 4 : 3);
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const chordNotes = [rootNote, rootNote + (isMinor ? 3 : 4), rootNote + 7];

    // #ЗАЧЕМ: Реализация требования "побольше аккомпанемента без сверхдлинных звучаний" для блюза.
    // #ЧТО: Если жанр - блюз, мы генерируем два аккорда по 2 доли (половинные ноты) вместо одного на 4 доли.
    // #СВЯЗИ: Улучшает динамику в dark.ts и winter.ts.
    if (genre === 'blues') {
        const startTimes = [0, 2.0];
        const durations = [2.0, 2.0];

        startTimes.forEach((startTime, timeIdx) => {
            chordNotes.forEach((note, i) => {
                axiom.push({
                    type: 'accompaniment',
                    note: note + 12 * baseOctave,
                    duration: durations[timeIdx],
                    time: startTime + i * 0.05,
                    weight: 0.6 - (i * 0.1),
                    technique: technique,
                    dynamics: 'mp',
                    phrasing: 'legato',
                    params: { attack: 0.1, release: 1.5 }
                });
            });
        });
    } else {
        // Стандартная эмбиентная логика: одна целая нота (4 доли)
        chordNotes.forEach((note, i) => {
            axiom.push({
                type: 'accompaniment',
                note: note + 12 * baseOctave,
                duration: 4.0,
                time: i * 0.05,
                weight: 0.6 - (i * 0.1),
                technique: technique,
                dynamics: 'mp',
                phrasing: 'legato',
                params: { attack: 0.8, release: 3.2 }
            });
        });
    }
    return axiom;
  }
  
  private createPianoAccompaniment(chord: GhostChord, random: { next: () => number; nextInt: (max: number) => number; }): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const rootNote = chord.rootNote;
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const octaveShift = 24;
    axiom.push({ type: 'pianoAccompaniment', note: rootNote - 12 + octaveShift, duration: 2.0, time: 0, weight: 0.6, technique: 'pluck', dynamics: 'p', phrasing: 'legato' });
    const chordNotes = [rootNote, rootNote + (isMinor ? 3 : 4), rootNote + 7, rootNote + 12];
    [1.0, 2.0, 3.0].forEach(time => {
        if(random.next() < 0.6) {
            axiom.push({ type: 'pianoAccompaniment', note: chordNotes[random.nextInt(chordNotes.length)] + octaveShift, duration: 0.5, time: time, weight: 0.4 + random.next() * 0.2, technique: 'pluck', dynamics: 'p', phrasing: 'staccato' });
        }
    });
    return axiom;
  }
}
