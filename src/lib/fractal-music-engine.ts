

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

import { getScaleForMood, generateGhostHarmonyTrack, createDrumAxiom, createAmbientBassAxiom, createAccompanimentAxiom, createHarmonyAxiom, createMelodyMotif, mutateBassPhrase, createBassFill, createDrumFill, chooseHarmonyInstrument, DEGREE_TO_SEMITONE, mutateBluesAccompaniment, mutateBluesMelody } from './music-theory';


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

  private bluesChorusCache: { barStart: number, events: FractalEvent[], log: string } | null = null;

  private shuffledBassRiffIndices: number[] = [];
  private shuffledDrumRiffIndices: number[] = [];
  private shuffledMelodyIDs: string[] = [];
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

  private melodyHistory: string[] = []; // #РЕШЕНИЕ (ПЛАН 931)

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

    this.random = seededRandom(this.config.seed);
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
          return undefined;
      }
  
      const rules = navInfo.currentPart.instrumentation?.[part as keyof typeof navInfo.currentPart.instrumentation];
  
      if (!rules || rules.strategy !== 'weighted') {
          const fallback = part === 'melody' ? 'organ' : 'synth';
          return fallback;
      }
  
      const useV2 = this.config.useMelodyV2;
      const options = useV2 ? rules.v2Options : rules.v1Options;
  
      let potentialOptions = options;
  
      if (!potentialOptions || potentialOptions.length === 0) {
          potentialOptions = !useV2 ? rules.v2Options : rules.v1Options;
          if (!potentialOptions || potentialOptions.length === 0) {
              const ultimateFallback = part === 'melody' ? 'organ' : 'synth';
              return ultimateFallback;
          }
      }
  
      const chosenName = this.performWeightedChoice(potentialOptions);
      
      // #РЕШЕНИЕ (ПЛАН 936): Добавлена специальная обработка для гитарных сэмплеров.
      // #ЗАЧЕМ: Этот блок гарантирует, что если блюпринт запрашивает 'telecaster' или 'blackAcoustic',
      //         движок вернет именно этот "хинт", а не будет пытаться найти его среди
      //         синтезаторных V1/V2 пресетов.
      // #ЧТО: Проверяем, является ли выбранное имя одним из специальных сэмплерных инструментов.
      //      Если да - немедленно возвращаем его.
      // #СВЯЗИ: Позволяет `audio-engine-context` корректно маршрутизировать события
      //         в `TelecasterGuitarSampler` или `BlackGuitarSampler`.
      if (chosenName === 'telecaster' || chosenName === 'blackAcoustic') {
          return chosenName as MelodyInstrument;
      }
  
      return chosenName;
  }
  
  private performWeightedChoice(options: {name: any, weight: number}[]): any {
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
        if (!navInfo || !this.navigator) return [];
        
        const drumRules = navInfo.currentPart.instrumentRules?.drums;
        if (!navInfo.currentPart.layers.drums || (drumRules && drumRules.pattern === 'none')) {
            return [];
        }

        const genre = this.config.genre;
        const mood = this.config.mood;

        if (genre === 'blues') {
            const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
            if (allDrumRiffs.length === 0) return [];
            const riffTemplate = allDrumRiffs[this.currentDrumRiffIndex % allDrumRiffs.length];
            if (!riffTemplate) return [];
            
            const drumEvents: FractalEvent[] = [];
            const ticksPerBeat = 3;

            Object.entries(riffTemplate).forEach(([part, ticks]) => {
                let sampleName = '';
                if(part === 'K') sampleName = 'drum_kick';
                else if(part === 'SD') sampleName = 'drum_snare';
                else if(part === 'HH') sampleName = 'drum_hihat_closed';
                else if(part === 'OH') sampleName = 'drum_hihat_open';
                else if(part === 'R') sampleName = 'drum_ride';
                
                if (sampleName && Array.isArray(ticks)) {
                    ticks.forEach(tick => {
                        drumEvents.push({
                            type: sampleName as InstrumentType, note: 60, time: tick / ticksPerBeat,
                            duration: 0.25 / ticksPerBeat, weight: 0.8,
                            technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: {}
                        });
                    });
                }
            });
            return drumEvents;
        }

        const kitName = drumRules?.kitName || `${genre}_${mood}`.toLowerCase();
        
        let baseKit: DrumKit | undefined;
        if (DRUM_KITS[genre]) {
            baseKit = (DRUM_KITS[genre] as any)[kitName] || (DRUM_KITS[genre] as any)[mood] || DRUM_KITS[genre]?.intro;
        }
        if (!baseKit) {
            baseKit = DRUM_KITS.ambient!.intro!;
        }
        
        const finalKit: DrumKit = JSON.parse(JSON.stringify(baseKit));

        if (drumRules?.ride?.enabled === true) {
            finalKit.ride = [...new Set([...finalKit.ride, ...ALL_RIDES])];
        } else if (drumRules?.ride?.enabled === false) {
            finalKit.ride = [];
        }
        
        const axiomResult = createDrumAxiom(finalKit, genre, mood, this.config.tempo, this.random, drumRules);
        
        return axiomResult.events || [];
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
        registerHint?: 'low' | 'mid' | 'high',
        soloPlanName?: string
    ): { events: FractalEvent[], log: string } {

        const finalEvents: FractalEvent[] = [];
        const barDurationInBeats = 4.0;
        const ticksPerBeat = 3;
        let logMessage = "";

        if (isSoloSection && soloPlanName) {
            const soloPlan = BLUES_SOLO_PLANS[soloPlanName];

            if (!soloPlan || chorusIndex >= soloPlan.choruses.length) {
                logMessage = `[FME] Solo plan "${soloPlanName}" or chorus index ${chorusIndex} out of bounds.`;
                return { events: [], log: logMessage };
            }

            const currentChorusPlan = soloPlan.choruses[chorusIndex % soloPlan.choruses.length];
            logMessage = `[FME] Assembling solo chorus ${chorusIndex + 1} using plan "${soloPlanName}".`;

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
            // #РЕШЕНИЕ (ПЛАН 931): Логика выбора мелодии теперь учитывает настроение и историю.
            const moodMap: Record<string, Mood[]> = {
                light: ['joyful', 'epic', 'enthusiastic'],
                dark: ['dark', 'melancholic', 'gloomy', 'anxious'],
                neutral: ['calm', 'dreamy', 'contemplative']
            };

            const getMoodCategory = (m: Mood): keyof typeof moodMap | null => {
                for (const category in moodMap) {
                    if (moodMap[category as keyof typeof moodMap].includes(m)) return category as keyof typeof moodMap;
                }
                return null;
            };

            const targetCategory = getMoodCategory(mood);
            let suitableRiffs = BLUES_MELODY_RIFFS.filter(riff => 
                riff.moods.some(m => moodMap[targetCategory!]?.includes(m))
            );

            if (suitableRiffs.length === 0) suitableRiffs = BLUES_MELODY_RIFFS;

            // Исключаем недавно использованные мелодии
            let selectableRiffs = suitableRiffs.filter(riff => !this.melodyHistory.includes(riff.id));
            if (selectableRiffs.length === 0) { // Если все подходящие уже играли, сбрасываем историю для этой категории
                this.melodyHistory = [];
                selectableRiffs = suitableRiffs;
            }

            const selectedRiff = selectableRiffs[random.nextInt(selectableRiffs.length)];

            // Обновляем историю
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

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
      if (!this.navigator) {
          return { events: [], instrumentHints: {} };
      }

      this.epoch = barCount;

      if (this.epoch < this.config.introBars) {
          return { events: [], instrumentHints: {} };
      }

      if (this.epoch >= this.navigator.totalBars + 4) {
        return { events: [], instrumentHints: {} }; 
      }
      
      if (this.epoch >= this.navigator.totalBars) {
          const promenadeBar = this.epoch - this.navigator.totalBars;
          const promenadeEvents = this._generatePromenade(promenadeBar);
          return { events: promenadeEvents, instrumentHints: {} };
      }

      if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
      
      const v2MelodyHint = this._chooseInstrumentForPart('melody', this.navigator.tick(this.epoch));
      const navigationInfo = this.navigator.tick(this.epoch, v2MelodyHint);

      if (navigationInfo && navigationInfo.logMessage) {
        console.log(navigationInfo.logMessage);
      }
      
      if (!navigationInfo) {
        console.error(`[FME] Evolve failed to get navigation info for bar ${this.epoch}`);
        return { events: [], instrumentHints: {} };
      }
      
      const harmonyRules = navigationInfo?.currentPart.instrumentation?.harmony;
      const chosenHarmonyInstrument = harmonyRules ? chooseHarmonyInstrument(harmonyRules, this.random) : 'piano';

      const instrumentHints: InstrumentHints = {
          accompaniment: this._chooseInstrumentForPart('accompaniment', navigationInfo),
          melody: v2MelodyHint,
          harmony: chosenHarmonyInstrument,
      };
      
      const events = this.generateOneBar(barDuration, navigationInfo!, instrumentHints);
      
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
  public generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): FractalEvent[] {
    const effectiveBar = this.epoch;
    const currentChord = this.ghostHarmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return [];
    }
    
    let allEvents: FractalEvent[] = [];

    const isChorusBoundary = this.config.genre === 'blues' && this.epoch > 0 && this.epoch % 12 === 0;
    if (isChorusBoundary) {
        if (this.random.next() < 0.4) {
            this.currentBassRiffIndex = this.shuffledBassRiffIndices[this.random.nextInt(this.shuffledBassRiffIndices.length)];
            console.log(`%c[MUTATION @ Bar ${this.epoch}] Bass riff mutated to index: ${this.currentBassRiffIndex}`, 'color: #87CEEB');
        }
        if (this.random.next() < 0.3) {
            this.currentDrumRiffIndex = this.shuffledDrumRiffIndices[this.random.nextInt(this.shuffledDrumRiffIndices.length)];
            console.log(`%c[MUTATION @ Bar ${this.epoch}] Drum riff mutated to index: ${this.currentDrumRiffIndex}`, 'color: #FFD700');
        }
        if (this.random.next() < 0.5) { 
            this.currentGuitarRiffId = this.shuffledGuitarRiffIDs[this.random.nextInt(this.shuffledGuitarRiffIDs.length)];
            console.log(`%c[MUTATION @ Bar ${this.epoch}] Melody riff mutated to ID: ${this.currentGuitarRiffId}`, 'color: #DA70D6');
        }
    }
    
    const drumEvents = this.generateDrumEvents(navInfo) || [];

    let accompEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.accompaniment) {
        const registerHint = navInfo.currentPart.instrumentRules?.accompaniment?.register?.preferred;
        let axiom = createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint);
        
        if (this.config.genre === 'blues' && isChorusBoundary) {
             accompEvents = mutateBluesAccompaniment(axiom, currentChord, drumEvents, this.random);
        } else {
            accompEvents = axiom;
        }
    }
    
    if (navInfo.currentPart.accompanimentMelodyDouble?.enabled && accompEvents.length > 0) {
        const { instrument, octaveShift } = navInfo.currentPart.accompanimentMelodyDouble;
        const doubleEvents = accompEvents.map(e => ({
            ...JSON.parse(JSON.stringify(e)),
            type: 'melody' as InstrumentType,
            note: e.note + (12 * octaveShift),
        }));
        allEvents.push(...doubleEvents);
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
                    this.bluesChorusCache = this.generateBluesMelodyChorus(chorusChords, this.config.mood, this.random, isSoloSection, chorusIndex, melodyRules.register?.preferred, melodyRules.soloPlan);
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
                this.currentMelodyMotif = createMelodyMotif(currentChord, this.config.mood, this.random, shouldMutate ? this.currentMelodyMotif : undefined, registerHint, this.config.genre);
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
    
    allEvents.push(...(bassEvents || []), ...(drumEvents || []), ...(accompEvents || []), ...(melodyEvents || []), ...(harmonyEvents || []));
    
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
    
    return allEvents;
  }
}
