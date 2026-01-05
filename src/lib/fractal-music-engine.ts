

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, IntroRules, InstrumentPart } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateBassPhrase, createMelodyMotif, createDrumAxiom, generateGhostHarmonyTrack, mutateAccompanimentPhrase, createAmbientBassAxiom, createHarmonyAxiom, generateIntroSequence, DEGREE_TO_SEMITONE } from './music-theory';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_MELODY_RIFFS, type BluesRiffDegree, type BluesRiffEvent, type BluesMelodyPhrase } from './assets/blues-melody-riffs';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';


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


// === ОСНОВНОЙ КЛАСС ===
export class FractalMusicEngine {
  public config: EngineConfig;
  private time: number = 0;
  private epoch = 0;
  public random: { next: () => number; nextInt: (max: number) => number; shuffle: <T>(array: T[]) => T[] };
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private lastAccompanimentEndTime: number = -Infinity;
  private nextAccompanimentDelay: number = 0;
  private hasBassBeenMutated = false;
  
  private ghostHarmonyTrack: GhostChord[] = []; // The harmonic "skeleton"
  
  public navigator: BlueprintNavigator | null = null;

  public introInstrumentMap: Map<InstrumentPart, any> = new Map();
  public introInstrumentOrder: InstrumentPart[] = [];


  private bassPhraseLibrary: FractalEvent[][] = [];
  private currentBassPhraseIndex = 0;

  private accompPhraseLibrary: FractalEvent[][] = [];
  private currentAccompPhraseIndex = 0;

  private currentMelodyMotif: FractalEvent[] = [];
  private lastMelodyPlayEpoch: number = -16; // Start with a delay, now 4 bars long

  private bluesChorusCache: { barStart: number, events: FractalEvent[], log: string } | null = null;

  // --- "КОНВЕЙЕР УНИКАЛЬНОСТИ" (ПЛАН 742) ---
  // #ЗАЧЕМ: Эти массивы создаются один раз и содержат ПЕРЕМЕШАННУЮ
  //          последовательность ВСЕХ доступных риффов и мелодий.
  private shuffledBassRiffIndices: number[] = [];
  private shuffledDrumRiffIndices: number[] = [];
  private shuffledMelodyIDs: string[] = [];

  // #ЗАЧЕМ: Эти счетчики отслеживают, какой рифф из "конвейера" мы используем следующим.
  private bassRiffConveyorIndex = 0;
  private drumRiffConveyorIndex = 0;
  private melodyConveyorIndex = 0;

  // --- "ДНК СЮИТЫ" (ПЛАН 741) ---
  // #ЗАЧЕМ: Эти свойства хранят "якоря" — базовые риффы и мелодию для ТЕКУЩЕЙ сюиты.
  private baseDrumRiffIndex: number = 0;
  private baseBassRiffIndex: number = 0;
  private baseMelodyId: string | null = null;
  
  private currentDrumRiffIndex: number = 0;
  private currentBassRiffIndex: number = 0;
  private currentMelodyId: string | null = null;
  

  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed);
    this.nextWeatherEventEpoch = 0;

    // --- ЗАПОЛНЕНИЕ "КОНВЕЙЕРОВ" (ПЛАН 742) ---
    // #ЧТО: Мы создаем массивы индексов/ID для всех риффов и мелодий, а затем
    //      один раз их перемешиваем. Это гарантирует уникальную последовательность на всю сессию.
    const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
    this.shuffledBassRiffIndices = this.random.shuffle(Array.from({ length: allBassRiffs.length }, (_, i) => i));

    const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
    this.shuffledDrumRiffIndices = this.random.shuffle(Array.from({ length: allDrumRiffs.length }, (_, i) => i));

    this.shuffledMelodyIDs = this.random.shuffle(BLUES_MELODY_RIFFS.map(m => m.id));
  }

  public get tempo(): number { return this.config.tempo; }
  
  public async updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      const introBarsChanged = newConfig.introBars !== this.config.introBars;
      const seedChanged = newConfig.seed !== undefined && newConfig.seed !== this.config.seed;
      
      this.config = { ...this.config, ...newConfig };
      
      // --- ИСПРАВЛЕНИЕ (ПЛАН 736): "Истинная Случайность" ---
      // #ЗАЧЕМ: Гарантирует, что при каждой регенерации (которая вызывает updateConfig с новым seed)
      //         мы создаем НОВЫЙ генератор случайных чисел.
      // #ЧТО: Если пришел новый seed, пересоздаем `this.random`.
      if (seedChanged) {
        console.log(`%c[FME.updateConfig] New seed detected: ${this.config.seed}. Re-initializing random generator.`, 'color: #FFD700; font-weight:bold;');
        this.random = seededRandom(this.config.seed);
      }
      
      if(!this.navigator || moodOrGenreChanged || introBarsChanged || seedChanged) {
          console.log(`[FME] Config changed or initial setup. Re-initializing. New mood: ${this.config.mood}, New intro: ${this.config.introBars}`);
          await this.initialize(true); // Force re-initialization
      }
  }

  public async initialize(force: boolean = false) {
    if (this.navigator && !force) return;

    // --- ИСПРАВЛЕНИЕ (ПЛАН 736): "Истинная Случайность" ---
    // #ЗАЧЕМ: Двойная гарантия, что даже при принудительной инициализации (`force=true`)
    //         мы всегда будем начинать с уникального "семени", а не переиспользовать старое.
    this.random = seededRandom(this.config.seed);
    console.log(`%c[FME.initialize] Using SEED: ${this.config.seed} to create random generator.`, 'color: #FFD700;');

    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5;
    this.hasBassBeenMutated = false;
    this.bluesChorusCache = null;
    
    // --- ИСПОЛЬЗОВАНИЕ "КОНВЕЙЕРА" (ПЛАН 742) ---
    // #ЗАЧЕМ: Выбор "ДНК" для НОВОЙ сюиты.
    // #ЧТО: Мы берем СЛЕДУЮЩИЙ по порядку рифф/мелодию из перемешанных "конвейеров".
    //       Счетчик увеличивается, гарантируя уникальность для следующей сюиты.

    const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
    this.baseBassRiffIndex = this.shuffledBassRiffIndices[this.bassRiffConveyorIndex % this.shuffledBassRiffIndices.length];
    this.bassRiffConveyorIndex++;

    const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
    this.baseDrumRiffIndex = this.shuffledDrumRiffIndices[this.drumRiffConveyorIndex % this.shuffledDrumRiffIndices.length];
    this.drumRiffConveyorIndex++;
    
    this.baseMelodyId = this.shuffledMelodyIDs[this.melodyConveyorIndex % this.shuffledMelodyIDs.length];
    this.melodyConveyorIndex++;

    // Сразу устанавливаем текущие риффы равными базовым
    this.currentDrumRiffIndex = this.baseDrumRiffIndex;
    this.currentBassRiffIndex = this.baseBassRiffIndex;
    this.currentMelodyId = this.baseMelodyId;


    const blueprint = await getBlueprint(this.config.genre, this.config.mood);
    console.log(`[FME] Blueprint now active: ${blueprint.name}`);
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars);
    
    const key = getScaleForMood(this.config.mood, this.config.genre)[0];
    this.ghostHarmonyTrack = generateGhostHarmonyTrack(this.navigator.totalBars, this.config.mood, key, this.random, this.config.genre);
    if (this.ghostHarmonyTrack.length === 0) {
      throw new Error("[Engine] CRITICAL ERROR: Could not generate 'Ghost Harmony'. Music is not possible.");
    }

    console.log(`[FractalMusicEngine] Initialized with blueprint "${this.navigator.blueprint.name}". Total duration: ${this.navigator.totalBars} bars.`);

    this.bassPhraseLibrary = [];
    this.currentBassPhraseIndex = 0;
    this.accompPhraseLibrary = [];
    this.currentAccompPhraseIndex = 0;
    
    this.introInstrumentMap.clear();
    this.introInstrumentOrder = [];
    const introPart = this.navigator.blueprint.structure.parts.find(p => p.id.startsWith('INTRO'));
    if (introPart?.introRules) {
        this.introInstrumentOrder = [...introPart.introRules.allowedInstruments];
        for (let i = this.introInstrumentOrder.length - 1; i > 0; i--) {
            const j = this.random.nextInt(i + 1);
            [this.introInstrumentOrder[i], this.introInstrumentOrder[j]] = [this.introInstrumentOrder[j], this.introInstrumentOrder[i]];
        }
        console.log(`[IntroSetup] Unique instrument entry order created: [${this.introInstrumentOrder.join(', ')}]`);

        this.introInstrumentOrder.forEach(part => {
             const instrumentChoice = this._chooseInstrumentForPart(part as any, this.navigator?.tick(0));
             if (instrumentChoice) {
                 this.introInstrumentMap.set(part, instrumentChoice);
                 console.log(`[IntroSetup] Instrument '${part}' randomly assigned to '${instrumentChoice}'.`);
             }
        });
    }

    const firstChord = this.ghostHarmonyTrack[0];
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    const initialBassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';

    if (this.config.genre === 'blues') {
        // Initialization is now handled by the DNA logic above
    } else {
        const newBassAxiom = createAmbientBassAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialBassTechnique);
        for (let i = 0; i < 4; i++) {
            this.bassPhraseLibrary.push(newBassAxiom);
            this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialRegisterHint));
        }
        this.currentMelodyMotif = createMelodyMotif(firstChord, this.config.mood, this.random);
        this.lastMelodyPlayEpoch = -16;
    }
    
    this.needsBassReset = false;
  }
  
    private _chooseInstrumentForPart(
      part: 'melody' | 'accompaniment',
      navInfo: NavigationInfo | null
  ): MelodyInstrument | AccompanimentInstrument | undefined {
      if (!navInfo) {
          console.warn(`[FME] _chooseInstrumentForPart called with no navInfo.`);
          return undefined;
      }
  
      const rules = navInfo.currentPart.instrumentation?.[part as keyof typeof navInfo.currentPart.instrumentation];
  
      if (!rules || rules.strategy !== 'weighted') {
          const fallback = part === 'melody' ? 'organ' : 'synth';
          return fallback;
      }
  
      const useV2 = this.config.useMelodyV2;
      const engineVersion = useV2 ? 'V2' : 'V1';
      const options = useV2 ? rules.v2Options : rules.v1Options;
  
      if (!options || options.length === 0) {
          const fallbackOptions = !useV2 ? rules.v2Options : rules.v1Options;
          if (!fallbackOptions || fallbackOptions.length === 0) {
              const ultimateFallback = part === 'melody' ? 'organ' : 'synth';
              return ultimateFallback;
          }
          return this.performWeightedChoice(fallbackOptions);
      }
  
      return this.performWeightedChoice(options);
  }
  
  private performWeightedChoice(options: {name: any, weight: number}[]): any {
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    if (totalWeight <= 0) {
        console.warn(`[FME] Total weight for options is zero. Returning first option.`);
        return options[0]?.name;
    }

    let rand = this.random.next() * totalWeight;
    for (const option of options) {
        rand -= option.weight;
        if (rand <= 0) {
            return option.name;
        }
    }

    // Fallback just in case, though it should not be reached with correct weights
    return options[options.length - 1].name;
  }


  public generateExternalImpulse() {
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
        if (!navInfo || !this.navigator) return [];
        
        const drumRules = navInfo.currentPart.instrumentRules?.drums;
        if (!navInfo.currentPart.layers.drums || (drumRules && drumRules.pattern === 'none')) {
            return [];
        }

        if (this.config.genre === 'blues') {
            const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
            if (allDrumRiffs.length === 0) return [];

            const pattern = allDrumRiffs[this.currentDrumRiffIndex % allDrumRiffs.length];
            let events: FractalEvent[] = [];
            const ticksPerBeat = 3;

            const addEvents = (ticks: number[] | undefined, type: InstrumentType, weight: number = 0.8) => {
                if (ticks) {
                    ticks.forEach(tick => {
                        events.push({
                            type, note: 60, time: tick / ticksPerBeat, duration: 1 / ticksPerBeat,
                            weight: weight + (this.random.next() * 0.1), technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: {}
                        });
                    });
                }
            };

            addEvents(pattern.K, 'drum_kick');
            addEvents(pattern.SD, 'drum_snare');
            addEvents(pattern.ghostSD, 'drum_snare_ghost_note', 0.4);
            addEvents(pattern.HH, 'drum_hihat_closed', 0.6);
            addEvents(pattern.OH, 'drum_hihat_open', 0.7);
            addEvents(pattern.R, 'drum_ride', 0.7);
            addEvents(pattern.T, 'drum_tom_mid', 0.75);

            // --- КОНТЕКСТНЫЕ МУТАЦИИ ---
            const barInChorus = this.epoch % 12;
            let mutationLog: string | null = null;
            
            if (barInChorus === 11 && this.random.next() < 0.8) {
                mutationLog = "Turnaround Fill";
                events = createDrumFill(this.random, { instrument: 'tom', density: 0.6 });
            } 
            else if (this.random.next() < 0.3) {
                 mutationLog = "Ghost Snare";
                 addEvents([2, 8], 'drum_snare_ghost_note', 0.35);
            }
            else if (this.random.next() < 0.25) {
                mutationLog = "Open-Hat";
                addEvents([11], 'drum_hihat_open', 0.6);
            }

            if (mutationLog) {
                console.log(`%c[DrumMutation @ Bar ${this.epoch}] ${mutationLog}`, 'color: #FFC0CB');
            }

            return events;
        }
        
        const axiomResult = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random, drumRules);
        const baseAxiom = axiomResult.events || [];
        
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
  
    private _createArpeggiatedChordSwell(startTime: number, chord: GhostChord): FractalEvent[] {
        const arpeggio: FractalEvent[] = [];
        const scale = getScaleForMood(this.config.mood, this.config.genre);
        const rootMidi = chord.rootNote;
        
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const third = rootMidi + (isMinor ? 3 : 4);
        const fifth = rootMidi + 7;
        const octave = rootMidi + 12;

        let chordNotes = [rootMidi, third, fifth, octave].filter(n => scale.some(sn => sn % 12 === n % 12));
        if (chordNotes.length < 3) chordNotes = [rootMidi, rootMidi + 5, rootMidi + 7, rootMidi + 12];
        
        if (this.random.next() > 0.5) {
            chordNotes.reverse();
        }

        chordNotes.forEach((note, index) => {
            arpeggio.push({
                type: 'accompaniment',
                note: note + 12 * 2,
                duration: 4.0,
                time: startTime + (index * 0.06),
                weight: 0.6 - (index * 0.05),
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato',
                params: { attack: 0.8, release: 3.5 }
            });
        });

        return arpeggio;
    }

    private generateBluesBassRiff(chord: GhostChord, technique: Technique, random: { next: () => number, nextInt: (max: number) => number }, mood: Mood): FractalEvent[] {
        const phrase: FractalEvent[] = [];
        const root = chord.rootNote;
        const barDurationInBeats = 4.0;
        const ticksPerBeat = 3;
        
        const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
        if (allBassRiffs.length === 0) return [];
        
        const riffTemplate = allBassRiffs[this.currentBassRiffIndex % allBassRiffs.length];

        // Определяем ступень аккорда
        const barInChorus = this.epoch % 12;
        const rootOfChorus = this.ghostHarmonyTrack.find(c => c.bar === (this.epoch - barInChorus))?.rootNote ?? root;
        const step = (root - rootOfChorus + 12) % 12;
        
        let patternSource: 'I' | 'IV' | 'V' | 'turn' = 'I';
        if (barInChorus === 11) {
            patternSource = 'turn';
        } else if (step === 5) {
            patternSource = 'IV';
        } else if (step === 7) {
            patternSource = 'V';
        }

        const pattern = riffTemplate[patternSource];

        for (const riffNote of pattern) {
            phrase.push({
                type: 'bass',
                note: root + DEGREE_TO_SEMITONE[riffNote.deg],
                time: riffNote.t / ticksPerBeat,
                duration: (riffNote.d || 2) / ticksPerBeat,
                weight: 0.85 + random.next() * 0.1,
                technique: 'pluck',
                dynamics: 'mf',
                phrasing: 'legato',
                params: { cutoff: 800, resonance: 0.7, distortion: 0.15, portamento: 0.0 }
            });
        }
        return phrase;
    }

  public getGhostHarmony(): GhostChord[] {
      return this.ghostHarmonyTrack;
  }

  public generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): FractalEvent[] {
    const effectiveBar = this.epoch % this.navigator.totalBars;
    const currentChord = this.ghostHarmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return [];
    }
    
    let allEvents: FractalEvent[] = [];

    // --- ЛОГИКА СМЕНЫ "ДНК" (ПЛАН 741, 742) ---
    // #ЗАЧЕМ: При смене части композиции (куплет, соло, и т.д.) мы решаем,
    //          какие риффы и мелодии будут звучать.
    if (navInfo.isPartTransition) {
        const isSoloSection = navInfo.currentPart.id.includes('SOLO');
        const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
        const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
        
        if (isSoloSection) {
            // "B" в структуре A-B-A: для соло выбираем СЛУЧАЙНЫЙ контрастный набор.
            this.currentDrumRiffIndex = this.random.nextInt(allDrumRiffs.length);
            this.currentBassRiffIndex = this.random.nextInt(allBassRiffs.length);
            const soloMelody = this.selectUniqueBluesMelody(this.config.mood, this.baseMelodyId ?? undefined);
            this.currentMelodyId = soloMelody?.id ?? this.baseMelodyId;
        } else {
            // "A" в структуре A-B-A: возвращаемся к базовой теме сюиты.
            this.currentDrumRiffIndex = this.baseDrumRiffIndex;
            this.currentBassRiffIndex = this.baseBassRiffIndex;
            this.currentMelodyId = this.baseMelodyId;
        }
        
        const logDrumRiffId = `index_${this.currentDrumRiffIndex}`;
        const logBassRiffId = `index_${this.currentBassRiffIndex}`;
        const logMelodyId = this.currentMelodyId || 'N/A';
        console.log(
            `%c[FME Part Info] Active DNA for part ${navInfo.currentPart.name}:\n  - Drum Riff ID: ${logDrumRiffId}\n  - Bass Riff ID: ${logBassRiffId}\n  - Melody ID: ${logMelodyId}`,
            'color: cyan; font-weight: bold;'
        );
    }
    
    const drumEvents = this.generateDrumEvents(navInfo) || [];

    let accompEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.accompaniment) {
        const registerHint = navInfo.currentPart.instrumentRules?.accompaniment?.register?.preferred;
        if (this.accompPhraseLibrary.length === 0 || this.currentAccompPhraseIndex >= this.accompPhraseLibrary.length || this.accompPhraseLibrary[this.currentAccompPhraseIndex].length === 0 || this.epoch % 4 === 0) {
            const newAxiom = createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint);
            if (this.accompPhraseLibrary.length === 0) {
                this.accompPhraseLibrary.push(newAxiom);
            } else {
                this.accompPhraseLibrary[this.currentAccompPhraseIndex] = newAxiom;
            }
        }
        accompEvents = this.accompPhraseLibrary[this.currentAccompPhraseIndex] || [];
    }

    let harmonyEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.harmony) {
        const harmonyAxiom = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random);
        harmonyEvents.push(...harmonyAxiom);
    }

    let bassEvents: FractalEvent[] = [];
    const bassRules = navInfo.currentPart.instrumentRules?.bass;
    const bassTechnique = bassRules?.techniques?.[0].value as Technique || 'drone';

    if (navInfo.currentPart.layers.bass) {
      if (this.config.genre === 'blues') {
          bassEvents = this.generateBluesBassRiff(currentChord, 'riff', this.random, this.config.mood);
      } else {
          const PHRASE_VARIATION_INTERVAL = 4;
          if (this.epoch > 0 && this.epoch % PHRASE_VARIATION_INTERVAL === 0) {
              this.currentBassPhraseIndex = (this.currentBassPhraseIndex + 1) % this.bassPhraseLibrary.length;
              if (this.random.next() < 0.6) { // 60% chance to mutate
                  this.bassPhraseLibrary[this.currentBassPhraseIndex] = mutateBassPhrase(this.bassPhraseLibrary[this.currentBassPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
              }
          }
          bassEvents = this.bassPhraseLibrary[this.currentBassPhraseIndex] || [];
      }
    }
    
    if (navInfo.currentPart.bassAccompanimentDouble?.enabled && bassEvents.length > 0) {
        const { instrument, octaveShift } = navInfo.currentPart.bassAccompanimentDouble;
        const bassDoubleEvents: FractalEvent[] = bassEvents.map(e => ({
            ...JSON.parse(JSON.stringify(e)),
            type: 'melody',
            note: e.note + (12 * octaveShift),
            weight: e.weight * 0.8,
        }));
        allEvents.push(...bassDoubleEvents);
        instrumentHints.melody = instrument; 
    }
    
    const bassOctaveShift = navInfo.currentPart.instrumentRules?.bass?.presetModifiers?.octaveShift;
    if (bassOctaveShift && bassEvents.length > 0) {
        const TARGET_BASS_OCTAVE_MIN_MIDI = 36;
        bassEvents.forEach(event => {
            if (event.note < TARGET_BASS_OCTAVE_MIN_MIDI) {
                event.note += 12 * bassOctaveShift;
            }
        });
    }

    let melodyEvents: FractalEvent[] = [];
    const melodyRules = navInfo.currentPart.instrumentRules?.melody;

    if (navInfo.currentPart.layers.melody && !navInfo.currentPart.bassAccompanimentDouble?.enabled && melodyRules) {
        if (this.config.genre === 'blues' && melodyRules.source === 'motif') {
            const barInChorus = this.epoch % 12;
            const registerHint = melodyRules.register?.preferred;
            const isSoloSection = navInfo.currentPart.id.includes('SOLO');
            
            // --- ИСПРАВЛЕНИЕ (ПЛАН 741): Генерация соло теперь зависит от isSoloSection ---
            if (barInChorus === 0 || !this.bluesChorusCache || this.bluesChorusCache.barStart !== (this.epoch - barInChorus)) {
                const chorusBarStart = this.epoch - barInChorus;
                const chorusChords = this.ghostHarmonyTrack.filter(c => c.bar >= chorusBarStart && c.bar < chorusBarStart + 12);
                if (chorusChords.length > 0) {
                    this.bluesChorusCache = this.generateBluesMelodyChorus(chorusChords, this.config.mood, this.random, registerHint, isSoloSection);
                }
            }
            
            if (this.bluesChorusCache) {
                const barStartBeat = barInChorus * 4.0;
                const barEndBeat = barStartBeat + 4.0;
                melodyEvents = this.bluesChorusCache.events
                    .filter(e => e.time >= barStartBeat && e.time < barEndBeat)
                    .map(e => ({ ...e, time: e.time - barStartBeat }));
            }
        } else if (melodyRules.source === 'motif') {
            const melodyDensity = melodyRules.density?.min ?? 0.25;
            const minInterval = 8;
            const motifBarIndex = this.epoch - this.lastMelodyPlayEpoch;

            if (motifBarIndex >= 0 && motifBarIndex < 4 && this.currentMelodyMotif.length > 0) {
                const barStartBeat = motifBarIndex * 4.0;
                const barEndBeat = (motifBarIndex + 1) * 4.0;
                melodyEvents = this.currentMelodyMotif
                    .filter(e => e.time >= barStartBeat && e.time < barEndBeat)
                    .map(e => ({ ...e, time: e.time - barStartBeat }));
            } else if (this.epoch >= this.lastMelodyPlayEpoch + minInterval && this.random.next() < melodyDensity) {
                const shouldMutate = this.currentMelodyMotif.length > 0 && this.random.next() > 0.3;
                const registerHint = melodyRules.register?.preferred;
                this.currentMelodyMotif = createMelodyMotif(currentChord, this.config.mood, this.random, shouldMutate ? this.currentMelodyMotif : undefined, registerHint, this.config.genre);
                melodyEvents = this.currentMelodyMotif
                    .filter(e => e.time < 4.0)
                    .map(e => ({ ...e, time: e.time }));
                this.lastMelodyPlayEpoch = this.epoch;
            }
        }
    }
    
    allEvents.push(...(bassEvents || []), ...(drumEvents || []), ...(accompEvents || []), ...(melodyEvents || []), ...(harmonyEvents || []));
    
    const sfxRules = navInfo.currentPart.instrumentRules?.sfx as SfxRule | undefined;
    const sfxChance = sfxRules?.eventProbability ?? 0.08;

    if (navInfo.currentPart.layers.sfx && this.random.next() < sfxChance) {
        allEvents.push({ 
            type: 'sfx', note: 60, time: this.random.next() * 4, duration: 2, weight: 0.6, 
            technique: 'swell', dynamics: 'mf', phrasing: 'legato', 
            params: { mood: this.config.mood, genre: this.config.genre, rules: sfxRules }
        });
    }

    if (navInfo.currentPart.layers.sparkles && this.random.next() < 0.1) {
        allEvents.push({ type: 'sparkle', note: 60, time: this.random.next() * 4, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre}});
    }
    
    const isLastBarOfBundle = navInfo.currentBundle && this.epoch === navInfo.currentBundle.endBar;
    if (navInfo.currentBundle && navInfo.currentBundle.outroFill && isLastBarOfBundle) {
        const fillParams = navInfo.currentBundle.outroFill.parameters || {};
        const drumFill = createDrumFill(this.random, fillParams);
        const bassFill = createBassFill(currentChord, this.config.mood, this.config.genre, this.random);
        allEvents.push(...drumFill, ...bassFill.events);
    }
    
    return allEvents;
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
      if (!this.navigator) {
          console.warn("[FME] Evolve called but navigator is not ready. Waiting for initialization.");
          return { events: [], instrumentHints: {} };
      }

      this.epoch = barCount;

      if (this.epoch >= this.navigator.totalBars + 4) {
        return { events: [], instrumentHints: {} }; 
      }
      
      if (this.epoch >= this.navigator.totalBars) {
          const promenadeBar = this.epoch - this.navigator.totalBars;
          const promenadeEvents = this._generatePromenade(promenadeBar);
          return { events: promenadeEvents, instrumentHints: {} };
      }

      if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
      
      const navInfo = this.navigator.tick(this.epoch);
      if (!navInfo) {
        console.error(`[FME] Evolve failed to get navigation info for bar ${this.epoch}`);
        return { events: [], instrumentHints: {} };
      }
      
      const harmonyRules = navInfo?.currentPart.instrumentation?.harmony;
      const chosenHarmonyInstrument = harmonyRules ? chooseHarmonyInstrument(harmonyRules, this.random) : 'piano';

      const instrumentHints: InstrumentHints = {
          accompaniment: this._chooseInstrumentForPart('accompaniment', navInfo),
          melody: this._chooseInstrumentForPart('melody', navInfo),
          harmony: chosenHarmonyInstrument,
      };
      
      if (navInfo?.logMessage) {
        console.log(navInfo.logMessage, 'color: #DA70D6');
      }


      const events = this.generateOneBar(barDuration, navInfo!, instrumentHints);
      
      return { events, instrumentHints };
  }


  private _generatePromenade(promenadeBar: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    if (promenadeBar === 0) {
        events.push({ type: 'bass', note: 36, duration: 8, time: 0, weight: 0.6, technique: 'drone', dynamics: 'p', phrasing: 'legato', params: { attack: 3.5, release: 4.5, cutoff: 120, resonance: 0.5, distortion: 0.1, portamento: 0 } });
        events.push({ type: 'accompaniment', note: 48, duration: 8, time: 0, weight: 0.4, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 4.0, release: 4.0 } });
        events.push({ type: 'perc-013', note: 60, time: 1.5, duration: 0.5, weight: 0.2, technique: 'hit', dynamics: 'pp', phrasing: 'staccato', params: {} });
    }
    if (promenadeBar === 2) {
         events.push({ type: 'sparkle', note: 72, time: 0.5, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre}});
         events.push({ type: 'sfx', note: 60, time: 2.5, duration: 2, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { mood: this.config.mood, genre: this.config.genre } });
    }
    return events;
  }
  
  private selectUniqueBluesMelody(mood: Mood, excludeId?: string): BluesMelody | null {
    const moodMap = {
        light: ['joyful', 'epic', 'enthusiastic'],
        dark: ['dark', 'melancholic', 'gloomy', 'anxious'],
        neutral: ['calm', 'dreamy', 'contemplative']
    };

    let moodCategory: keyof typeof moodMap | null = null;
    for (const category in moodMap) {
        if ((moodMap[category as keyof typeof moodMap]).includes(mood)) {
            moodCategory = category as keyof typeof moodMap;
            break;
        }
    }

    if (!moodCategory) return null;

    let suitableMelodies = BLUES_MELODY_RIFFS.filter(m => 
        m.moods.some(m_mood => moodMap[moodCategory!].includes(m_mood))
    );
    
    if (suitableMelodies.length === 0) {
        console.warn(`[BluesMelody] No suitable melodies found for mood category: ${moodCategory}. Falling back to all.`);
        suitableMelodies = BLUES_MELODY_RIFFS;
    }
    
    let selectableMelodies = suitableMelodies.filter(m => m.id !== excludeId);
    if (selectableMelodies.length === 0 && suitableMelodies.length > 0) {
        selectableMelodies = suitableMelodies; // Allow reuse if no other options
    }

    if (selectableMelodies.length === 0) return null;

    const selectedMelody = selectableMelodies[this.random.nextInt(selectableMelodies.length)];
    return selectedMelody;
  }

  private generateBluesMelodyChorus(chorusChords: GhostChord[], mood: Mood, random: { next: () => number; nextInt: (max: number) => number }, registerHint?: 'low' | 'mid' | 'high', isSolo: boolean = false): { events: FractalEvent[], log: string } {
    const chorusEvents: FractalEvent[] = [];
    
    // --- ИСПРАВЛЕНИЕ (ПЛАН 741): Логика выбора мелодии теперь зависит от isSolo ---
    let selectedMelodyId = this.currentMelodyId;
    if (isSolo) {
        // Для соло выбираем НОВУЮ мелодию, исключая базовую
        const soloMelody = this.selectUniqueBluesMelody(mood, this.baseMelodyId ?? undefined);
        selectedMelodyId = soloMelody?.id ?? this.baseMelodyId; // Фолбэк на базовую, если ничего не найдено
    }
    
    const selectedMelody = BLUES_MELODY_RIFFS.find(m => m.id === selectedMelodyId);

    if (!selectedMelody) {
        console.warn(`[BluesMelodyChorus] No melody could be selected or found for ID: ${selectedMelodyId}.`);
        return { events: [], log: "No melody selected." };
    }


    const barDurationInBeats = 4;
    const ticksPerBeat = 3;
    
    let octaveShift = 12 * 2; // Default to 2 octaves above root
    if (registerHint === 'mid') octaveShift = 12 * 3;
    if (registerHint === 'high') octaveShift = 12 * 4;

    for (let barIndex = 0; barIndex < 12; barIndex++) {
        const absoluteBar = (chorusChords[0]?.bar ?? 0) + barIndex;
        const barChord = chorusChords.find(c => absoluteBar >= c.bar && absoluteBar < (c.bar + c.durationBars));

        if (!barChord) {
            console.warn(`[BluesMelodyChorus] No chord found for bar ${barIndex} (absolute: ${absoluteBar}).`);
            continue;
        };

        const chordRoot = barChord.rootNote;
        let phrase: BluesMelodyPhrase;

        // Simplified step detection for I, IV, V
        const rootOfChorus = this.ghostHarmonyTrack.find(c => c.bar === (this.epoch - (this.epoch % 12)))?.rootNote ?? chordRoot;
        const step = (chordRoot - rootOfChorus + 12) % 12;
        const IV_STEP = 5;
        const V_STEP = 7;
        
        if (barIndex === 11) {
            phrase = selectedMelody.phraseTurnaround;
        } else if (step === IV_STEP) {
            phrase = selectedMelody.phraseIV;
        } else if (step === V_STEP) {
            phrase = selectedMelody.phraseV;
        } else {
            phrase = selectedMelody.phraseI;
        }

        for (const event of phrase) {
            const noteMidi = chordRoot + DEGREE_TO_SEMITONE[event.deg] + octaveShift;
            chorusEvents.push({
                type: 'melody',
                note: noteMidi,
                time: (barIndex * barDurationInBeats) + (event.t / ticksPerBeat),
                duration: (event.d || 2) / ticksPerBeat,
                weight: 0.85,
                technique: 'pick',
                dynamics: 'f',
                phrasing: 'legato',
                params: {}
            });
        }
    }
    
    const shouldMutate = random.next() < 0.4;
    let mutationLog = "None";
    if (shouldMutate && chorusEvents.length > 0) {
        const mutationType = random.nextInt(3);
        const targetBar = this.epoch + Math.floor(random.next() * 12);
        switch (mutationType) {
            case 0:
                mutationLog = `Rhythmic Shift on bar ${targetBar}`;
                chorusEvents.filter(e => Math.floor(e.time / barDurationInBeats) * 12 === (targetBar % 12) * barDurationInBeats).forEach(e => { e.time += (random.next() - 0.5) * 0.25; });
                break;
            case 1:
                mutationLog = `Register Shift on bar ${targetBar}`;
                const octaveShiftMutation = (random.next() > 0.5) ? 12 : -12;
                chorusEvents.filter(e => Math.floor(e.time / barDurationInBeats) * 12 === (targetBar % 12) * barDurationInBeats).forEach(e => { e.note += octaveShiftMutation; });
                break;
            case 2:
                mutationLog = `Note Removal on bar ${targetBar}`;
                const eventsInBar = chorusEvents.filter(e => Math.floor(e.time / barDurationInBeats) * 12 === (targetBar % 12) * barDurationInBeats);
                if (eventsInBar.length > 0) {
                    const indexToRemove = chorusEvents.indexOf(eventsInBar[random.nextInt(eventsInBar.length)]);
                    if (indexToRemove > -1) {
                        chorusEvents.splice(indexToRemove, 1);
                    }
                }
                break;
        }
        console.log(`%c[MelodyMutation] Applied: ${mutationLog}`, 'color: #9ACD32');
    }

    const log = `ID: ${selectedMelody.id}. Mutation: ${mutationLog}.`;
    
    return { events: chorusEvents, log };
}


}



