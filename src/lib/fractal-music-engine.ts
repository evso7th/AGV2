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
  public random: { next: () => number; nextInt: (max: number) => number; shuffle: <T>(array: T[]) => T[]; };
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private lastAccompanimentEndTime: number = -Infinity;
  private nextAccompanimentDelay: number = 0;
  private hasBassBeenMutated = false;
  
  private suiteDNA: SuiteDNA | null = null; 
  
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

  private activatedInstruments: Set<InstrumentPart> = new Set();


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
        console.log(`%c[FME.updateConfig] New seed detected: ${this.config.seed}. Re-initializing random generator.`, 'color: #FFD700; font-weight:bold;');
        this.random = seededRandom(this.config.seed);
      }
      
      if(moodOrGenreChanged || introBarsChanged || seedChanged) {
          console.log(`[FME] Config changed requiring re-initialization. Mood: ${this.config.mood}, Intro: ${this.config.introBars}`);
          this.initialize(true);
      }
  }

  public initialize(force: boolean = false) {
    if (this.isInitialized && !force) {
        return;
    }

    console.log(`%c[FME.initialize] Using SEED: ${this.config.seed} to create random generator.`, 'color: #FFD700;');
    this.random = seededRandom(this.config.seed);

    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5;
    this.hasBassBeenMutated = false;
    this.activatedInstruments.clear(); 
    
    const allBassRiffs = BLUES_BASS_RIFFS[this.config.mood] ?? BLUES_BASS_RIFFS['contemplative'];
    if (!allBassRiffs || allBassRiffs.length === 0) return;
    
    this.shuffledBassRiffIndices = this.random.shuffle(Array.from({ length: allBassRiffs.length }, (_, i) => i));
    this.bassRiffConveyorIndex = 0;

    const allDrumRiffs = BLUES_DRUM_RIFFS[this.config.mood] ?? BLUES_DRUM_RIFFS['contemplative'] ?? [];
    if (allDrumRiffs.length === 0) return;
    this.shuffledDrumRiffIndices = this.random.shuffle(Array.from({ length: allDrumRiffs.length }, (_, i) => i));
    this.drumRiffConveyorIndex = 0;
    
    this.shuffledGuitarRiffIDs = this.random.shuffle(BLUES_GUITAR_RIFFS.map(r => r.id));
    this.guitarRiffConveyorIndex = 0;
    
    this.currentBassRiffIndex = this.shuffledBassRiffIndices[this.bassRiffConveyorIndex++] ?? 0;
    this.currentDrumRiffIndex = this.shuffledDrumRiffIndices[this.drumRiffConveyorIndex++] ?? 0;
    this.currentGuitarRiffId = this.shuffledGuitarRiffIDs[this.guitarRiffConveyorIndex++] ?? null;
    
    console.log(`%c[FME.initialize] New Suite Seeded! Base Riffs -> Bass: ${this.currentBassRiffIndex}, Drums: ${this.currentDrumRiffIndex}, Guitar: ${this.currentGuitarRiffId}`, 'color: cyan; font-weight: bold;');


    const blueprint = getBlueprint(this.config.genre, this.config.mood);
    
    this.suiteDNA = generateSuiteDNA(
        blueprint.structure.totalDuration.preferredBars,
        this.config.mood,
        this.config.seed,
        this.random,
        this.config.genre,
        blueprint.structure.parts
    );
    
    if (!this.suiteDNA || this.suiteDNA.harmonyTrack.length === 0) {
      throw new Error("[Engine] CRITICAL ERROR: Could not generate 'Suite DNA'. Music is not possible.");
    }
    
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.suiteDNA.soloPlanMap);
    
    this.config.tempo = this.suiteDNA.baseTempo;

    this.bassPhraseLibrary = [];
    this.currentBassPhraseIndex = 0;
    this.accompPhraseLibrary = [];
    this.currentAccompPhraseIndex = 0;
    
    this.introInstrumentOrder = [];

    const firstChord = this.suiteDNA.harmonyTrack[0];
    this.previousChord = firstChord;
    const initialNavInfo = this.navigator.tick(0);
    const initialBassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';

    if (this.config.genre === 'blues') {
        // Blues handled in generateOneBar
    } else {
        const newBassAxiom = createAmbientBassAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialBassTechnique);
        for (let i = 0; i < 4; i++) {
            this.bassPhraseLibrary.push(newBassAxiom);
            const registerHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
            const accompTechnique = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.techniques?.[0].value as AccompanimentTechnique || 'long-chords';
            this.accompPhraseLibrary.push(this.createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint, accompTechnique));
        }
        this.currentMelodyMotif = createAmbientMelodyMotif(firstChord, this.config.mood, this.random);
        this.lastMelodyPlayEpoch = -16;
    }
    
    this.needsBassReset = false;
    this.isInitialized = true;
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
        if (!navInfo || !this.suiteDNA) return [];
        const drumRules = navInfo.currentPart.instrumentRules?.drums;
        if (!navInfo.currentPart.layers.drums || (drumRules && drumRules.pattern === 'none')) {
            return [];
        }
        
        const kitName = drumRules?.kitName || `${this.config.genre}_${this.config.mood}`.toLowerCase();
        const overrides = drumRules?.kitOverrides;

        const baseKit = (DRUM_KITS[this.config.genre] as any)?.[kitName] ||
                        (DRUM_KITS[this.config.genre] as any)?.[this.config.mood] ||
                        DRUM_KITS.ambient!.intro!;
        
        if (!baseKit) {
            return [];
        }
    
        const finalKit: DrumKit = JSON.parse(JSON.stringify(baseKit));
        
        if (overrides) {
            if (overrides.add) {
                overrides.add.forEach(instrument => {
                    Object.keys(finalKit).forEach(part => {
                        const key = part as keyof DrumKit;
                        if (instrument.includes(key.slice(0, -1))) { 
                           if(finalKit[key] && !finalKit[key]!.includes(instrument)) {
                                finalKit[key]!.push(instrument);
                            }
                        }
                    });
                });
            }
            if (overrides.remove) {
                 overrides.remove.forEach(instrument => {
                    Object.keys(finalKit).forEach(part => {
                        const key = part as keyof DrumKit;
                         const typedKey = key as keyof DrumKit;
                        if (finalKit[typedKey]) {
                            const index = finalKit[typedKey]!.indexOf(instrument);
                            if (index > -1) {
                                finalKit[typedKey]!.splice(index, 1);
                            }
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
                         if (finalKit[key]) {
                            const index = finalKit[key]!.indexOf(fromInst);
                            if (index > -1) {
                                finalKit[key]![index] = toInst;
                            }
                        }
                    });
                });
            }
        }
        
        const axiomResult = createDrumAxiom(finalKit, this.config.genre, this.config.mood, this.suiteDNA.baseTempo, this.random, drumRules);
        
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

  public getGhostHarmony(): GhostChord[] {
      return this.suiteDNA?.harmonyTrack || [];
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

  private isActivated(part: InstrumentPart, navInfo: NavigationInfo): boolean {
      if (!navInfo.currentPart.layers[part]) return false;
      const stages = navInfo.currentPart.stagedInstrumentation;
      if (!stages || stages.length === 0) return true; 
      return this.activatedInstruments.has(part);
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

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {} };

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
            
            // #ЗАЧЕМ: Реализация временной (transient) активации инструментов.
            // #ЧТО: Если правило помечено как `transient`, инструмент не добавляется в `activatedInstruments`.
            //      Это заставляет его проверять шанс активации заново каждый такт.
            // #СВЯЗИ: Позволяет реализовать точные проценты присутствия (например, 10% мелодии) в блюпринте.
            if (rule.transient) {
                if (this.random.next() < rule.activationChance) {
                    // Временно считаем его активированным ТОЛЬКО для этого такта
                    const name = this.pickWeighted(rule.instrumentOptions);
                    (instrumentHints as any)[p] = name;
                }
            } else {
                if (!this.activatedInstruments.has(p)) {
                    if (this.random.next() < rule.activationChance) {
                        this.activatedInstruments.add(p);
                    }
                }
                if (this.activatedInstruments.has(p)) {
                    const name = this.pickWeighted(rule.instrumentOptions);
                    (instrumentHints as any)[p] = name;
                }
            }
        });

        // Гарантия "никакой тишины" для не-transient инструментов
        if (this.activatedInstruments.size === 0) {
            const possible = Object.keys(currentStage.instrumentation) as InstrumentPart[];
            const nonTransient = possible.filter(p => !currentStage.instrumentation[p]?.transient);
            if (nonTransient.length > 0) {
                const best = nonTransient.sort((a, b) => (currentStage.instrumentation[b]?.activationChance || 0) - (currentStage.instrumentation[a]?.activationChance || 0))[0];
                this.activatedInstruments.add(best);
                (instrumentHints as any)[best] = this.pickWeighted(currentStage.instrumentation[best]!.instrumentOptions);
            }
        }
    } else {
        instrumentHints.melody = this._chooseInstrumentForPart('melody', navInfo);
        instrumentHints.accompaniment = this._chooseInstrumentForPart('accompaniment', navInfo);
        instrumentHints.harmony = this._chooseInstrumentForPart('harmony', navInfo) as any;
        instrumentHints.bass = this._chooseInstrumentForPart('bass', navInfo) as any;
        instrumentHints.pianoAccompaniment = 'piano';
    }
    
    if (navInfo.logMessage) {
        const fullLog = this.navigator.formatLogMessage(navInfo, instrumentHints, this.epoch);
        if (fullLog) console.log(fullLog);
    }

    const { events } = this.generateOneBar(barDuration, navInfo, instrumentHints);
    
    return { events, instrumentHints };
}

 private _chooseInstrumentForPart(part: 'melody' | 'bass' | 'accompaniment' | 'harmony', navInfo: NavigationInfo | null): any {
    const rules = navInfo?.currentPart.instrumentation?.[part];
    if (!rules || !rules.strategy || rules.strategy !== 'weighted') {
        return 'none';
    }

    let options: any[] | undefined;
    if (part === 'harmony' && (rules as any).options) {
        options = (rules as any).options;
    } else {
        options = (this.config.useMelodyV2 && (rules as any).v2Options && (rules as any).v2Options.length > 0) ? (rules as any).v2Options : (rules as any).v1Options;
    }
    
    if (!options || options.length === 0) return 'none';
    return this.pickWeighted(options);
}

  private _generatePromenade(promenadeBar: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    if (promenadeBar === 0) {
        events.push({ type: 'bass', note: 36, duration: 8, time: 0, weight: 0.6, technique: 'drone', dynamics: 'p', phrasing: 'legato', params: { attack: 3.5, release: 4.5, cutoff: 120, resonance: 0.5, distortion: 0.1, portamento: 0 } });
        events.push({ type: 'accompaniment', note: 48, duration: 8, time: 0, weight: 0.4, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 4.0, release: 4.0 } });
        events.push({ type: 'perc-013', note: 60, time: 1.5, duration: 0.5, weight: 0.2, technique: 'hit', dynamics: 'pp', phrasing: 'staccato', params: {} });
    }
    if (promenadeBar === 2) {
         events.push({ type: 'sparkle', note: 72, time: 0.5, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre, category: 'promenade_blues'}});
         events.push({ type: 'sfx', note: 60, time: 2.5, duration: 2, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { mood: this.config.mood, genre: this.config.genre, category: 'promenade' } });
    }
    return events;
  }
  
  private generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): { events: FractalEvent[] } {
    const effectiveBar = this.epoch;
    
    if (!this.suiteDNA) return { events: [] };

    const foundChord = this.suiteDNA.harmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

    let currentChord: GhostChord = foundChord || this.previousChord || this.suiteDNA.harmonyTrack[0];
    this.previousChord = currentChord;
    
    const drumEvents = this.isActivated('drums', navInfo) ? (this.generateDrumEvents(navInfo) || []) : [];

    let melodyEvents: FractalEvent[] = [];
    const melodyRules = navInfo.currentPart.instrumentRules?.melody;

    // #ИСПРАВЛЕНО: Теперь проверяем наличие инструмента в хинтах или прямое наличие слоя.
    // #ЗАЧЕМ: Чтобы transient-мелодия работала корректно.
    if ((instrumentHints.melody || this.isActivated('melody', navInfo)) && !navInfo.currentPart.accompanimentMelodyDouble?.enabled && melodyRules) {
        if (melodyRules.source === 'blues_solo') {
            const { events: soloEvents } = generateBluesMelodyChorus(currentChord, this.random, navInfo.currentPart.id, this.epoch, melodyRules, this.suiteDNA, this.melodyHistory, this.cachedMelodyChorus);
            melodyEvents = soloEvents;
        } else if (melodyRules.source === 'motif') {
            this.currentMelodyMotif = createAmbientMelodyMotif(currentChord, this.config.mood, this.random, this.currentMelodyMotif, melodyRules.register?.preferred, this.config.genre);
            melodyEvents = this.currentMelodyMotif;
        }
    }

    // #ЗАЧЕМ: Принудительный октавный сдвиг для гитар в мелодии.
    // #ЧТО: Если инструмент мелодии — гитара, поднимаем ноты на 2 октавы.
    if (['telecaster', 'blackAcoustic', 'darkTelecaster', 'guitar_nightmare_solo', 'electricGuitar'].includes(instrumentHints.melody || '')) {
        melodyEvents.forEach(e => e.note += 24);
    }


    let accompEvents: FractalEvent[] = [];
    if (instrumentHints.accompaniment || this.isActivated('accompaniment', navInfo)) {
        const accompRules = navInfo.currentPart.instrumentRules?.accompaniment;
        const registerHint = accompRules?.register?.preferred;
        const technique = (this.config.genre === 'blues' && this.config.mood === 'dark')
            ? 'long-chords'
            : (accompRules?.techniques?.[0]?.value || 'long-chords') as AccompanimentTechnique;

        if (this.config.genre === 'blues' && this.config.mood === 'dark' && technique === 'long-chords') {
            const firstHalf = this.createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint, 'long-chords');
            const dominantChord: GhostChord = { ...currentChord, rootNote: currentChord.rootNote + 7, chordType: 'dominant' };
            const secondHalf = this.createAccompanimentAxiom(dominantChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint, 'long-chords');
            
            firstHalf.forEach(e => { e.duration = 2.0; e.time = e.time / 2; });
            secondHalf.forEach(e => { e.duration = 2.0; e.time = (e.time / 2) + 2.0; });
            accompEvents = [...firstHalf, ...secondHalf];
        } else {
            accompEvents = this.createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint, technique);
        }
    }
    
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
    if (instrumentHints.harmony || this.isActivated('harmony', navInfo)) {
        const harmonyAxiom = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random, effectiveBar);
        harmonyEvents.push(...harmonyAxiom);
    }
    
    let pianoEvents: FractalEvent[] = [];
    if (this.isActivated('pianoAccompaniment', navInfo) && this.epoch % 2 === 0) {
        const pianoAxiom = this.createPianoAccompaniment(currentChord, this.random);
        pianoEvents.push(...pianoAxiom);
    }

    let bassEvents: FractalEvent[] = [];
    if (instrumentHints.bass || this.isActivated('bass', navInfo)) {
        if (this.config.genre === 'blues') {
            bassEvents = createBluesBassAxiom(currentChord, 'riff', this.random, this.config.mood, this.epoch, this.suiteDNA, this.currentBassRiffIndex);
        } else {
            const technique = navInfo.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';
            bassEvents = createAmbientBassAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, technique);
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

    const allEvents = [...bassEvents, ...drumEvents, ...accompEvents, ...melodyEvents, ...harmonyEvents, ...pianoEvents];
    allEvents.forEach(e => { if (!e.params) e.params = {}; (e.params as any).barCount = effectiveBar; });
    
    const sfxRules = navInfo.currentPart.instrumentRules?.sfx as SfxRule | undefined;
    if (this.isActivated('sfx', navInfo) && sfxRules && this.random.next() < sfxRules.eventProbability) {
        allEvents.push({ 
            type: 'sfx', note: 60, time: this.random.next() * 4, duration: 2, weight: 0.6, 
            technique: 'swell', dynamics: 'mf', phrasing: 'legato', 
            params: { mood: this.config.mood, genre: this.config.genre, rules: sfxRules }
        });
    }

    const sparkleRules = navInfo.currentPart.instrumentRules?.sparkles;
    if (this.isActivated('sparkles', navInfo) && sparkleRules && this.random.next() < (sparkleRules.eventProbability || 0.1)) {
        allEvents.push({ type: 'sparkle', note: 60, time: this.random.next() * 4, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre}});
    }
    
    if (navInfo.currentBundle && navInfo.currentBundle.outroFill && this.epoch === navInfo.currentBundle.endBar) {
        const fillParams = navInfo.currentBundle.outroFill.parameters || {};
        const drumFill = createDrumFill(this.random, fillParams);
        const bassFill = createBassFill(currentChord, this.config.mood, this.config.genre, this.random);
        allEvents.push(...drumFill, ...bassFill.events);
    }
    
    return { events: allEvents };
  }

  private createAccompanimentAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number; }, tempo: number, registerHint: 'low' | 'mid' | 'high' = 'mid', technique: AccompanimentTechnique): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const rootNote = chord.rootNote;
    
    let chordNotes: number[] = [];
    if (chord.chordType === 'dominant') {
        chordNotes = [rootNote, rootNote + 4, rootNote + 7, rootNote + 10];
    } else {
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        chordNotes = [rootNote, rootNote + (isMinor ? 3 : 4), rootNote + 7];
    }
    
    if (chord.inversion) {
        if (chord.inversion === 1) chordNotes = [chordNotes[1], chordNotes[2], chordNotes[0] + 12];
        else if (chord.inversion === 2) chordNotes = [chordNotes[2], chordNotes[0] + 12, chordNotes[1] + 12];
    }
    
    let baseOctave = (registerHint === 'low') ? 2 : (registerHint === 'high' ? 4 : 3);

    switch (technique) {
        case 'alberti-bass':
             const albertPattern = [chordNotes[0], chordNotes[2], chordNotes[1], chordNotes[2], chordNotes[0], chordNotes[2], chordNotes[1], chordNotes[2]];
            albertPattern.forEach((note, i) => {
                axiom.push({ type: 'accompaniment', note: note + 12 * (baseOctave - 1), duration: 0.5, time: i * 0.5, weight: 0.55 + random.next() * 0.1, technique: 'pluck', dynamics: 'p', phrasing: 'staccato' });
            });
            break;
        case 'power-chords':
            [rootNote, rootNote + 7].forEach((note) => {
                axiom.push({ type: 'accompaniment', note: note + 12 * (baseOctave - 1), duration: 4.0, time: 0, weight: 0.8, technique: 'pluck', dynamics: 'f', phrasing: 'legato', params: { attack: 0.01, release: 1.0, distortion: 0.4 } });
            });
            break;
        case 'rhythmic-comp':
            [0.5, 1.5, 2.5, 3.5].forEach(time => {
                if (random.next() > 0.3) {
                    chordNotes.forEach((note, i) => {
                         axiom.push({ type: 'accompaniment', note: note + 12 * baseOctave, duration: 0.2, time: time + i * 0.02, weight: 0.65 + random.next() * 0.1, technique: 'staccato', dynamics: 'mf', phrasing: 'detached', params: { attack: 0.01, release: 0.2 } });
                    });
                }
            });
            break;
        default:
            chordNotes.slice(0, 3).forEach((note, i) => {
                axiom.push({ type: 'accompaniment', note: note + 12 * baseOctave, duration: 4.0, time: i * 0.05, weight: 0.6 - (i * 0.1), technique: 'choral', dynamics: 'mp', phrasing: 'legato', params: { attack: 0.8, release: 3.2 } });
            });
            break;
    }
    return axiom;
  }
  
  private createPianoAccompaniment(chord: GhostChord, random: { next: () => number; nextInt: (max: number) => number; }): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const rootNote = chord.rootNote;
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const octaveShift = 24;

    axiom.push({ type: 'pianoAccompaniment', note: rootNote - 12 + octaveShift, duration: 2.0, time: 0, weight: 0.6, technique: 'pluck', dynamics: 'p', phrasing: 'legato' });
    if (random.next() > 0.5) {
         axiom.push({ type: 'pianoAccompaniment', note: rootNote - 5 + octaveShift, duration: 2.0, time: 2.0, weight: 0.55, technique: 'pluck', dynamics: 'p', phrasing: 'legato' });
    }

    const chordNotes = [rootNote, rootNote + (isMinor ? 3 : 4), rootNote + 7, rootNote + 12];
    [1.0, 1.5, 2.0, 2.5, 3.0, 3.5].forEach(time => {
        if(random.next() < 0.6) {
            axiom.push({ type: 'pianoAccompaniment', note: chordNotes[random.nextInt(chordNotes.length)] + octaveShift, duration: 0.5, time: time, weight: 0.4 + random.next() * 0.2, technique: 'pluck', dynamics: 'p', phrasing: 'staccato' });
        }
    });
    return axiom;
  }
}
