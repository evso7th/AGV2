

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, IntroRules, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
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

import { getScaleForMood, generateGhostHarmonyTrack, createDrumAxiom, createAmbientBassAxiom, createAccompanimentAxiom, createHarmonyAxiom, createMelodyMotif as createAmbientMelodyMotif, mutateBassPhrase, createBassFill, createDrumFill, chooseHarmonyInstrument, DEGREE_TO_SEMITONE, mutateBluesAccompaniment, mutateBluesMelody, createBluesOrganLick, generateIntroSequence } from './music-theory';


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

  public introInstrumentOrder: InstrumentPart[] = [];


  private bassPhraseLibrary: FractalEvent[][] = [];
  private currentBassPhraseIndex = 0;

  private accompPhraseLibrary: FractalEvent[][] = [];
  private currentAccompPhraseIndex = 0;

  private currentMelodyMotif: FractalEvent[] = [];
  private lastMelodyPlayEpoch: number = -16;
  private wasMelodyPlayingLastBar: boolean = false; // #ПЛАН 972

  private bluesChorusCache: { barStart: number, events: FractalEvent[], log: string } | null = null;

  private shuffledBassRiffIndices: number[] = [];
  private shuffledDrumRiffIndices: number[] = [];
  private shuffledGuitarRiffIDs: string[] = [];

  private bassRiffConveyorIndex = 0;
  private drumRiffConveyorIndex = 0;
  private melodyConveyorIndex = 0;
  private guitarRiffConveyorIndex = 0;

  private baseDrumRiffIndex: number = 0;
  private baseBassRiffIndex: number = 0;
  private baseMelodyId: string | null = null;
  
  private currentDrumRiffIndex: number = 0;
  private currentBassRiffIndex: number = 0;
  private currentGuitarRiffId: string | null = null;

  private melodyHistory: string[] = [];
  private soloPlanHistory: string[] = []; // #ПЛАН 994: "Краткосрочная Память Гитариста"

  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed);
    this.nextWeatherEventEpoch = 0; 
  }

  public get tempo(): number { return this.config.tempo; }
  
  public async updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      const introBarsChanged = newConfig.introBars !== undefined && newConfig.introBars !== this.config.introBars;
      const seedChanged = newConfig.seed !== undefined && newConfig.seed !== this.config.seed;
      
      this.config = { ...this.config, ...newConfig };
      
      // #ИСПРАВЛЕНО (ПЛАН 1269): Инициализируем `this.random` НОВЫМ сидом, если он изменился.
      if (seedChanged) {
        console.log(`%c[FME.updateConfig] New seed detected: ${this.config.seed}. Re-initializing random generator.`, 'color: #FFD700; font-weight:bold;');
        this.random = seededRandom(this.config.seed);
      }
      
      if(!this.navigator || moodOrGenreChanged || introBarsChanged || seedChanged) {
          console.log(`[FME] Config changed or initial setup. Re-initializing. New mood: ${this.config.mood}, New intro: ${this.config.introBars}`);
          await this.initialize(true);
      }
  }

  public async initialize(force: boolean = false) {
    if (this.navigator && !force) return;

    // #ИСПРАВЛЕНО (ПЛАН 1269): Используем `this.random`, который был корректно обновлен в `updateConfig`.
    console.log(`%c[FME.initialize] Using SEED: ${this.config.seed} to create random generator.`, 'color: #FFD700;');

    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5;
    this.hasBassBeenMutated = false;
    this.bluesChorusCache = null;
    
    // #ЗАЧЕМ: Этот блок ("Конвейер Уникальности") гарантирует, что каждая новая сюита
    //         начинается с уникальной комбинации риффов.
    // #ЧТО: При каждой инициализации он "перетасовывает" все доступные риффы и берет
    //      следующий по порядку из этой случайной последовательности.
    // #СВЯЗИ: Является основой для вариативности между сессиями.
    const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
    if (!this.shuffledBassRiffIndices.length || this.bassRiffConveyorIndex >= this.shuffledBassRiffIndices.length) {
        this.shuffledBassRiffIndices = this.random.shuffle(Array.from({ length: allBassRiffs.length }, (_, i) => i));
        this.bassRiffConveyorIndex = 0;
    }
    this.baseBassRiffIndex = this.shuffledBassRiffIndices[this.bassRiffConveyorIndex++];

    const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
     if (!this.shuffledDrumRiffIndices.length || this.drumRiffConveyorIndex >= this.shuffledDrumRiffIndices.length) {
        this.shuffledDrumRiffIndices = this.random.shuffle(Array.from({ length: allDrumRiffs.length }, (_, i) => i));
        this.drumRiffConveyorIndex = 0;
    }
    this.baseDrumRiffIndex = this.shuffledDrumRiffIndices[this.drumRiffConveyorIndex++];
    
    if (!this.shuffledGuitarRiffIDs.length || this.guitarRiffConveyorIndex >= this.shuffledGuitarRiffIDs.length) {
        this.shuffledGuitarRiffIDs = this.random.shuffle(BLUES_GUITAR_RIFFS.map(r => r.id));
        this.guitarRiffConveyorIndex = 0;
    }
    this.currentGuitarRiffId = this.shuffledGuitarRiffIDs[this.guitarRiffConveyorIndex++];
    
    this.currentDrumRiffIndex = this.baseDrumRiffIndex;
    this.currentBassRiffIndex = this.baseBassRiffIndex;
    
    console.log(`%c[FME.initialize] New Suite Seeded! Base Riffs -> Bass: ${this.currentBassRiffIndex}, Drums: ${this.currentDrumRiffIndex}, Guitar: ${this.currentGuitarRiffId}`, 'color: cyan; font-weight: bold;');


    const blueprint = await getBlueprint(this.config.genre, this.config.mood);
    // #ИСПРАВЛЕНО (ПЛАН 1269): Передаем `this.random` в навигатор.
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.random);
    
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
    
    this.introInstrumentOrder = [];
    const introPart = this.navigator.blueprint.structure.parts.find(p => p.id.startsWith('INTRO'));
    if (introPart?.introRules) {
        this.introInstrumentOrder = this.random.shuffle([...introPart.introRules.instrumentPool]);
    }

    const firstChord = this.ghostHarmonyTrack[0];
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    const initialBassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';

    if (this.config.genre === 'blues') {
        // Blues-специфичная инициализация (может быть пустой, т.к. риффы берутся из библиотек)
    } else {
        const newBassAxiom = createAmbientBassAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialBassTechnique);
        for (let i = 0; i < 4; i++) {
            this.bassPhraseLibrary.push(newBassAxiom);
            this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialRegisterHint));
        }
        this.currentMelodyMotif = createAmbientMelodyMotif(firstChord, this.config.mood, this.random);
        this.lastMelodyPlayEpoch = -16;
    }
    
    this.needsBassReset = false;
  }
  
  private _chooseInstrumentForPart(
    part: 'melody' | 'accompaniment' | 'harmony',
    navInfo: NavigationInfo | null
  ): MelodyInstrument | AccompanimentInstrument | 'piano' | 'guitarChords' | 'flute' | 'violin' | undefined {
      const melodyLogPrefix = `MelodyInstrumentLog:`;
      
      const rules = navInfo?.currentPart.instrumentation?.[part as keyof typeof navInfo.currentPart.instrumentation];
      if (!rules) {
          console.log(`${melodyLogPrefix} [1x. Guard] No instrumentation rules found for part '${part}' in section '${navInfo?.currentPart.id}'. Returning undefined.`);
          return undefined;
      }
      
      console.log(melodyLogPrefix + ` [1a. _chooseInstrumentForPart] Entering choice logic. Part: ${part}, useV2: ${this.config.useMelodyV2}`);

      if (rules.strategy !== 'weighted') {
          return undefined;
      }
  
      let options;
      if (part === 'harmony') {
          options = (rules as InstrumentationRules<'piano' | 'guitarChords' | 'flute' | 'violin'>).options;
      } else {
          const useV2 = this.config.useMelodyV2;
          options = useV2 ? rules.v2Options : rules.v1Options;
      }
  
      console.log(melodyLogPrefix + "[1d. _chooseInstrumentForPart] Selected options array: ", options);
      
      if (options && options.length > 0) {
        return this.performWeightedChoice(options);
      }
      
      if (part !== 'harmony') {
          const useV2 = this.config.useMelodyV2;
          const fallbackOptions = !useV2 ? rules.v2Options : rules.v1Options;
          if (fallbackOptions && fallbackOptions.length > 0) {
              console.warn(`[FME] No options for current engine version (v2=${useV2}). Falling back to other version's options.`);
              return this.performWeightedChoice(fallbackOptions);
          }
      }

      return undefined;
  }
  
  private performWeightedChoice(options: {name: any, weight: number}[]): any {
    if (!options || options.length === 0) return undefined;
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    if (totalWeight <= 0) {
        return options[0]?.name;
    }

    let rand = this.random.next() * totalWeight;
    for (const option of options) {
        rand -= option.weight;
        if (rand <= 0) {
            return option.name;
        }
    }

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
        // #ЗАЧЕМ: Этот метод отвечает за сборку и генерацию партии ударных для одного такта.
        // #ЧТО: Он определяет, какой набор ударных (кит) использовать, применяет к нему
        //      модификации из блюпринта и передает финальный кит "исполнителю" (createDrumAxiom).
        // #СВЯЗИ: Является "дирижером" для ударной секции, вызывается из generateOneBar.
    
        if (!navInfo) return [];
        const drumRules = navInfo.currentPart.instrumentRules?.drums;
        if (!navInfo.currentPart.layers.drums || (drumRules && drumRules.pattern === 'none')) {
            return [];
        }
        
        console.log(`%c[DrumLogic] 1. Reading command from blueprint...`, 'color: #FFD700');
        const kitName = drumRules?.kitName || `${this.config.genre}_${this.config.mood}`.toLowerCase();
        const overrides = drumRules?.kitOverrides;
        console.log(`[DrumLogic]   - Kit Name: '${kitName}', Overrides:`, overrides ? JSON.parse(JSON.stringify(overrides)) : 'none');
        
        const baseKit = (DRUM_KITS[this.config.genre] as any)?.[kitName] ||
                        (DRUM_KITS[this.config.genre] as any)?.[this.config.mood] ||
                        DRUM_KITS.ambient!.intro!;
        
        console.log(`[DrumLogic] 2. Loading base kit: '${baseKit ? 'Found' : 'Not Found'}'`);
        if (!baseKit) return [];
    
        const finalKit: DrumKit = JSON.parse(JSON.stringify(baseKit));
        
        if (overrides) {
            console.log(`[DrumLogic] 3. Applying overrides...`);
            if (overrides.add) {
                overrides.add.forEach(instrument => {
                    Object.keys(finalKit).forEach(part => {
                        const key = part as keyof DrumKit;
                        // Check if the instrument belongs to this category based on its name prefix
                        if (instrument.includes(key.slice(0, -1))) { 
                           if(finalKit[key] && !finalKit[key].includes(instrument)) {
                                finalKit[key].push(instrument);
                                console.log(`%c[DrumLogic]   - ADDED: '${instrument}' to '${key}'`, 'color: lightblue');
                            }
                        }
                    });
                });
            }
            if (overrides.remove) {
                 overrides.remove.forEach(instrument => {
                    Object.keys(finalKit).forEach(part => {
                        const key = part as keyof DrumKit;
                        const index = finalKit[key].indexOf(instrument);
                        if (index > -1) {
                            finalKit[key].splice(index, 1);
                             console.log(`%c[DrumLogic]   - REMOVED: '${instrument}' from '${key}'`, 'color: lightcoral');
                        }
                    });
                });
            }
            if (overrides.substitute) {
                Object.entries(overrides.substitute).forEach(([from, to]) => {
                    const fromInst = from as InstrumentType;
                    const toInst = to as InstrumentType;
                    Object.keys(finalKit).forEach(part => {
                        const key = part as keyof DrumKit;
                        const index = finalKit[key].indexOf(fromInst);
                        if (index > -1) {
                            finalKit[key][index] = toInst;
                            console.log(`%c[DrumLogic]   - SUBSTITUTED: '${from}' with '${to}' in '${key}'`, 'color: violet');
                        }
                    });
                });
            }
        }
        
        // --- ПЛАН 1207: Удаляем дублирующую логику фильтрации ---
        // Старый ошибочный фильтр был здесь. Теперь его нет.
        // Метод просто передает собранный кит и правила в `createDrumAxiom`.
    
        const axiomResult = createDrumAxiom(finalKit, this.config.genre, this.config.mood, this.config.tempo, this.random, drumRules, overrides);
        return axiomResult.events;
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

        const barInChorus = this.epoch % 12;
        const rootOfChorus = this.ghostHarmonyTrack.find(c => c.bar === (this.epoch - barInChorus))?.rootNote ?? root;
        const step = (root - rootOfChorus + 12) % 12;
        
        let patternSource: 'I' | 'IV' | 'V' | 'turn' = 'I';
        if (barInChorus === 11) {
            patternSource = 'turn';
        } else if (step === 5 || step === 4) {
            patternSource = 'IV';
        } else if (step === 7) {
            patternSource = 'V';
        }

        const pattern = riffTemplate[patternSource];

        for (const riffNote of pattern) {
            phrase.push({
                type: 'bass',
                note: root + (DEGREE_TO_SEMITONE[riffNote.deg as BluesRiffDegree] || 0),
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
  
    private generateBluesMelodyChorus(
        chorusChords: GhostChord[],
        mood: Mood,
        random: { next: () => number; nextInt: (max: number) => number; },
        isSoloSection: boolean,
        chorusIndex: number,
        registerHint?: 'low' | 'mid' | 'high'
    ): { events: FractalEvent[], log: string } {

        const finalEvents: FractalEvent[] = [];
        const barDurationInBeats = 4.0;
        const ticksPerBeat = 3;
        let logMessage = "";
        let soloPlanName: string | null = null;

        if (isSoloSection) {
            const allPlanIds = Object.keys(BLUES_SOLO_PLANS);
            let selectablePlans = allPlanIds.filter(id => !this.soloPlanHistory.includes(id));
            
            if (selectablePlans.length === 0) {
                this.soloPlanHistory = []; // Reset history if all plans are used
                selectablePlans = allPlanIds;
            }

            soloPlanName = selectablePlans[random.nextInt(selectablePlans.length)];
            
            this.soloPlanHistory.unshift(soloPlanName);
            if (this.soloPlanHistory.length > 5) {
                this.soloPlanHistory.pop();
            }
            logMessage = `[FME] Solo section. Selected plan "${soloPlanName}". History: [${this.soloPlanHistory.join(', ')}]`;
            
            const soloPlan = BLUES_SOLO_PLANS[soloPlanName];

            if (!soloPlan || chorusIndex >= soloPlan.choruses.length) {
                logMessage += ` | Plan "${soloPlanName}" or chorus index ${chorusIndex} out of bounds.`;
                return { events: [], log: logMessage };
            }

            const currentChorusPlan = soloPlan.choruses[chorusIndex % soloPlan.choruses.length];
            logMessage += ` | Assembling solo chorus ${chorusIndex + 1}.`;

            for (let barIndex = 0; barIndex < 12; barIndex++) {
                const lickId = currentChorusPlan[barIndex];
                const lickTemplate = BLUES_SOLO_LICKS[lickId];
                const currentChord = chorusChords.find(c => c.bar % 12 === barIndex);

                if (!lickTemplate || !currentChord) continue;

                const chordRoot = currentChord.rootNote;
                let octaveShift = 12 * (registerHint === 'high' ? 4 : 3);

                for (const noteTemplate of lickTemplate) {
                    let finalMidiNote = chordRoot + (DEGREE_TO_SEMITONE[noteTemplate.deg as BluesRiffDegree] || 0) + octaveShift;
                    if (finalMidiNote > 84) finalMidiNote -= 12;
                    if (finalMidiNote < 52) finalMidiNote += 12;
                    
                    const event: FractalEvent = {
                        type: 'melody',
                        note: finalMidiNote,
                        time: (barIndex * barDurationInBeats) + (noteTemplate.t / ticksPerBeat),
                        duration: (noteTemplate.d / ticksPerBeat),
                        weight: 0.9,
                        technique: (noteTemplate.tech as Technique) || 'pick',
                        dynamics: 'f', phrasing: 'legato', params: {}
                    };
                    finalEvents.push(event);
                }
            }
        } else {
            const moodMap: Record<string, Mood[]> = {
                light: ['joyful', 'epic', 'enthusiastic'],
                dark: ['dark', 'melancholic', 'gloomy', 'anxious'],
                neutral: ['calm', 'dreamy', 'contemplative']
            };

            const getMoodCategory = (m: Mood): keyof typeof moodMap | null => {
                for (const category in moodMap) {
                    if ((moodMap[category as keyof typeof moodMap]).includes(m)) return category as keyof typeof moodMap;
                }
                return null;
            };

            const targetCategory = getMoodCategory(mood);
            let suitableRiffs = BLUES_MELODY_RIFFS.filter(riff => 
                riff.moods.some(m_mood => moodMap[targetCategory!]?.includes(m_mood))
            );

            if (suitableRiffs.length === 0) suitableRiffs = BLUES_MELODY_RIFFS;

            let selectableRiffs = suitableRiffs.filter(riff => !this.melodyHistory.includes(riff.id));
            if (selectableRiffs.length === 0) { 
                this.melodyHistory = [];
                selectableRiffs = suitableRiffs;
            }

            const selectedRiff = selectableRiffs[random.nextInt(selectableRiffs.length)];

            this.melodyHistory.unshift(selectedRiff.id);
            if (this.melodyHistory.length > 10) {
                this.melodyHistory.pop();
            }

            logMessage = `[FME] Generating main theme using melody riff "${selectedRiff.id}" for mood "${mood}". History: [${this.melodyHistory.join(', ')}]`;

            for (let barIndex = 0; barIndex < 12; barIndex++) {
                const currentChord = chorusChords.find(c => c.bar % 12 === barIndex);
                if (!currentChord) continue;
                
                const chordRoot = currentChord.rootNote;
                const rootOfChorus = chorusChords[0].rootNote;
                const step = (chordRoot - rootOfChorus + 12) % 12;
                
                let phraseSource;
                if (barIndex === 11) phraseSource = selectedRiff.phraseTurnaround;
                else if (step === 5 || step === 4) phraseSource = selectedRiff.phraseIV;
                else if (step === 7) phraseSource = selectedRiff.phraseV;
                else phraseSource = selectedRiff.phraseI;

                let octaveShift = 12 * (registerHint === 'high' ? 4 : 3);

                for (const noteTemplate of phraseSource) {
                     let finalMidiNote = chordRoot + (DEGREE_TO_SEMITONE[noteTemplate.deg as BluesRiffDegree] || 0) + octaveShift;
                     if (finalMidiNote > 84) finalMidiNote -= 12;
                     if (finalMidiNote < 52) finalMidiNote += 12;

                     const event: FractalEvent = {
                        type: 'melody',
                        note: finalMidiNote,
                        time: (barIndex * barDurationInBeats) + (noteTemplate.t / ticksPerBeat),
                        duration: (noteTemplate.d / ticksPerBeat),
                        weight: 0.8,
                        technique: 'pick', dynamics: 'mf', phrasing: 'legato', params: {}
                    };
                    finalEvents.push(event);
                }
            }
        }
        return { events: finalEvents, log: logMessage };
    }

    private generateBluesAccompanimentV2(chord: GhostChord, melodyEvents: FractalEvent[], drumEvents: FractalEvent[], random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
        const phrase: FractalEvent[] = [];
        const hasMelody = melodyEvents.length > 0;
    
        // "Зов и Ответ"
        if (this.wasMelodyPlayingLastBar && !hasMelody) {
            if (random.next() < 0.8) { 
                console.log(`%c[AccompJam] Responding to melody silence.`, 'color: #90EE90');
                return createBluesOrganLick(chord, random);
            }
        }
    
        // "Поддержка" или "Пауза"
        if (hasMelody) {
            if (random.next() < 0.7) { 
                console.log(`%c[AccompJam] Staying silent to listen to melody.`, 'color: #90EE90');
                return []; 
            } else { 
                console.log(`%c[AccompJam] Playing support chords under melody.`, 'color: #90EE90');
                 return createAccompanimentAxiom(chord, this.config.mood, this.config.genre, this.random, this.config.tempo, 'low');
            }
        }
    
        // "Провокация" или "Заполнение"
        if (!hasMelody) {
            if (random.next() < 0.15) { 
                 console.log(`%c[AccompJam] Playing provocative lick.`, 'color: #90EE90');
                return createBluesOrganLick(chord, random, true);
            } else { 
                 console.log(`%c[AccompJam] Playing standard chords while melody is silent.`, 'color: #90EE90');
                return createAccompanimentAxiom(chord, this.config.mood, this.config.genre, this.random, this.config.tempo, 'low');
            }
        }
        
        return phrase;
    }


  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
      if (!this.navigator) {
          console.error("FME evolve called before navigator was initialized.");
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
  
      if (!isFinite(barDuration)) {
          console.error(`[FME] Invalid barDuration: ${barDuration}`);
          return { events: [], instrumentHints: {} };
      }

      const v2MelodyHint = this._chooseInstrumentForPart('melody', this.navigator.tick(this.epoch, undefined));
      const navInfo = this.navigator.tick(this.epoch, v2MelodyHint);

      if (navInfo?.logMessage) {
        console.log(navInfo.logMessage);
      }
  
      const instrumentHints: InstrumentHints = {
          melody: v2MelodyHint,
          accompaniment: this._chooseInstrumentForPart('accompaniment', navInfo),
          harmony: this._chooseInstrumentForPart('harmony', navInfo) as any,
      };
      
      console.log(`MelodyInstrumentLog: [1. Composer] Generated hint for bar ${this.epoch}: ${instrumentHints.melody}`);
  
      const { events } = this.generateOneBar(barDuration, navInfo!, instrumentHints);
      
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
  
    private selectUniqueBluesGuitarRiff(mood: Mood, excludeId?: string): BluesGuitarRiff | null {
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

    let suitableRiffs = BLUES_GUITAR_RIFFS.filter(m => 
        m.moods.some(m_mood => moodMap[moodCategory!].includes(m_mood))
    );
    
    if (suitableRiffs.length === 0) {
        suitableRiffs = BLUES_GUITAR_RIFFS;
    }
    
    let selectableRiffs = suitableRiffs.filter(m => m.id !== excludeId);
    if (selectableRiffs.length === 0 && suitableRiffs.length > 0) {
        selectableRiffs = suitableRiffs;
    }

    if (selectableRiffs.length === 0) return null;

    return selectableRiffs[this.random.nextInt(selectableRiffs.length)];
  }

  // --- Основная функция генерации на один такт ---
  public generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    const effectiveBar = this.epoch;
    const currentChord = this.ghostHarmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return { events: [], instrumentHints: {} };
    }
    
    const drumEvents = this.generateDrumEvents(navInfo) || [];

    let melodyEvents: FractalEvent[] = [];
    const melodyRules = navInfo.currentPart.instrumentRules?.melody;

    if (navInfo.currentPart.layers.melody && !navInfo.currentPart.accompanimentMelodyDouble?.enabled && melodyRules) {
        if (this.config.genre === 'blues') {
            const barInChorus = this.epoch % 12;
            const chorusIndex = Math.floor((this.epoch % 36) / 12);
            const isSoloSection = navInfo.currentPart.id.includes('SOLO'); 

            if (barInChorus === 0 || !this.bluesChorusCache || this.bluesChorusCache.barStart !== (this.epoch - barInChorus)) {
                const chorusBarStart = this.epoch - barInChorus;
                const chorusChords = this.ghostHarmonyTrack.filter(c => c.bar >= chorusBarStart && c.bar < chorusBarStart + 12);
                if (chorusChords.length > 0) {
                    this.bluesChorusCache = this.generateBluesMelodyChorus(chorusChords, this.config.mood, this.random, isSoloSection, chorusIndex, melodyRules.register?.preferred);
                     console.log(`%c${this.bluesChorusCache.log}`, 'color: #E6E6FA');
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
            
            if (this.epoch >= this.lastMelodyPlayEpoch + minInterval && this.random.next() < melodyDensity) {
                const shouldMutate = this.currentMelodyMotif.length > 0 && this.random.next() > 0.5;
                const registerHint = melodyRules.register?.preferred;
                this.currentMelodyMotif = createAmbientMelodyMotif(currentChord, this.config.mood, this.random, shouldMutate ? this.currentMelodyMotif : undefined, registerHint, this.config.genre);
                this.lastMelodyPlayEpoch = this.epoch;
            }
            
            if (this.epoch >= this.lastMelodyPlayEpoch && this.epoch < this.lastMelodyPlayEpoch + 4 && this.currentMelodyMotif.length > 0) {
                const motifBarIndex = this.epoch - this.lastMelodyPlayEpoch;
                const barStartBeat = motifBarIndex * 4.0;
                const barEndBeat = (motifBarIndex + 1) * 4.0;
                melodyEvents = this.currentMelodyMotif
                    .filter(e => e.time >= barStartBeat && e.time < barEndBeat)
                    .map(e => ({ ...e, time: e.time - barStartBeat }));
            }
        }
    }


    let accompEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.accompaniment) {
        if (this.config.genre === 'blues') {
            accompEvents = this.generateBluesAccompanimentV2(currentChord, melodyEvents, drumEvents, this.random);
        } else {
            const registerHint = navInfo.currentPart.instrumentRules?.accompaniment?.register?.preferred;
            accompEvents = createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint);
        }
    }
    
    this.wasMelodyPlayingLastBar = melodyEvents.length > 0; // #ПЛАН 972: Обновляем состояние

    if (navInfo.currentPart.accompanimentMelodyDouble?.enabled && accompEvents.length > 0) {
        const { instrument, octaveShift } = navInfo.currentPart.accompanimentMelodyDouble;
        const doubleEvents = accompEvents.map(e => ({
            ...JSON.parse(JSON.stringify(e)),
            type: 'melody' as InstrumentType,
            note: e.note + (12 * octaveShift),
        }));
        melodyEvents.push(...doubleEvents);
        instrumentHints.melody = instrument; 
    }


    let harmonyEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.harmony) {
        const harmonyAxiom = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random);
        harmonyEvents.push(...harmonyAxiom);
    }

    let bassEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.bass) {
      if (this.config.genre === 'blues') {
          bassEvents = this.generateBluesBassRiff(currentChord, 'riff', this.random, this.config.mood);
      } else {
          if (this.epoch > 0 && this.epoch % 4 === 0) {
              this.currentBassPhraseIndex = (this.currentBassPhraseIndex + 1) % this.bassPhraseLibrary.length;
              if (this.random.next() < 0.6) {
                  this.bassPhraseLibrary[this.currentBassPhraseIndex] = mutateBassPhrase(this.bassPhraseLibrary[this.currentBassPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
              }
          }
          bassEvents = this.bassPhraseLibrary[this.currentBassPhraseIndex] || [];
      }
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

    const allEvents = [...(bassEvents || []), ...(drumEvents || []), ...(accompEvents || []), ...(melodyEvents || []), ...(harmonyEvents || [])];
    
    const sfxRules = navInfo.currentPart.instrumentRules?.sfx as SfxRule | undefined;
    if (navInfo.currentPart.layers.sfx && sfxRules && this.random.next() < sfxRules.eventProbability) {
        allEvents.push({ 
            type: 'sfx', note: 60, time: this.random.next() * 4, duration: 2, weight: 0.6, 
            technique: 'swell', dynamics: 'mf', phrasing: 'legato', 
            params: { mood: this.config.mood, genre: this.config.genre, rules: sfxRules }
        });
    }

    const sparkleRules = navInfo.currentPart.instrumentRules?.sparkles;
    if (navInfo.currentPart.layers.sparkles && sparkleRules && this.random.next() < (sparkleRules.eventProbability || 0.1)) {
        allEvents.push({ type: 'sparkle', note: 60, time: this.random.next() * 4, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre}});
    }
    
    const isLastBarOfBundle = navInfo.currentBundle && this.epoch === navInfo.currentBundle.endBar;
    if (navInfo.currentBundle && navInfo.currentBundle.outroFill && isLastBarOfBundle) {
        const fillParams = navInfo.currentBundle.outroFill.parameters || {};
        const drumFill = createDrumFill(this.random, fillParams);
        const bassFill = createBassFill(currentChord, this.config.mood, this.config.genre, this.random);
        allEvents.push(...drumFill, ...bassFill.events);
    }
    
    return { events: allEvents, instrumentHints };
  }
}



// #ЗАЧЕМ: Эта функция создает мелодический мотив на основе текущего аккорда и настроения.
// #ЧТО: Она выбирает ритмический паттерн, мелодический контур, а затем генерирует
//      последовательность нот, двигаясь по заданной гамме.
// #ИСПРАВЛЕНО (ПЛАН 1006): Удалена ошибочная логика "наследования" громкости.
//                       Теперь громкость устанавливается на фиксированное значение.
function createMelodyMotif(chord: GhostChord, mood: Mood, random: { next: () => number; nextInt: (max: number) => number; }, previousMotif?: FractalEvent[], registerHint?: 'low' | 'mid' | 'high', genre?: Genre): FractalEvent[] {
    const motif: FractalEvent[] = [];
    
    if (previousMotif && previousMotif.length > 0 && random.next() < 0.7) {
        // ... existing mutation logic ...
        return previousMotif; 
    }

    const scale = getScaleForMood(mood, genre);
    let baseOctave = 4;
    if (registerHint === 'high') baseOctave = 5;
    if (registerHint === 'low') baseOctave = 3;
    
    // #ИСПРАВЛЕНО (ПЛАН 1007): Переменная 'currentChord' переименована в 'chord'.
    const rootNote = chord.rootNote + 12 * baseOctave;

    const rhythmicPatterns = [[4, 4, 4, 4], [3, 1, 3, 1, 4, 4], [2, 2, 2, 2, 2, 2, 2, 2], [8, 8], [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1], [4, 2, 2, 4, 4]];
    const durations = rhythmicPatterns[random.nextInt(rhythmicPatterns.length)];
    const contours = [ [0, 2, 1, 3, 4, 1, 0], [0, 1, 2, 3, 4, 5, 6], [6, 5, 4, 3, 2, 1, 0], [0, 5, -2, 7, 3, 6, 1] ];
    const contour = contours[random.nextInt(contours.length)];
    
    let currentTime = 0;
    const baseNoteIndex = scale.findIndex(n => n % 12 === rootNote % 12);
    if (baseNoteIndex === -1) return [];

    for (let i = 0; i < durations.length; i++) {
        const contourIndex = i % contour.length;
        const noteIndex = (baseNoteIndex + (contour[contourIndex] || 0) + scale.length) % scale.length;
        const note = scale[noteIndex];
        
        motif.push({
            type: 'melody', note: note, duration: durations[i], time: currentTime,
            // #ИСПРАВЛЕНО (ПЛАН 1006): Установлен фиксированный weight.
            weight: 0.7, 
            technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
        });
        currentTime += durations[i];
    }
    return motif;
}
