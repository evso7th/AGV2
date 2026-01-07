
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, IntroRules, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_GUITAR_RIFFS, BLUES_GUITAR_VOICINGS } from './assets/blues-guitar-riffs';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';
import { getScaleForMood, generateGhostHarmonyTrack, createDrumAxiom, createAmbientBassAxiom, createAccompanimentAxiom, createHarmonyAxiom, createMelodyMotif, mutateBassPhrase, createBassFill, createDrumFill, chooseHarmonyInstrument, DEGREE_TO_SEMITONE } from './music-theory';


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

  private bassRiffConveyorIndex = 0;
  private drumRiffConveyorIndex = 0;
  private melodyConveyorIndex = 0;

  private baseDrumRiffIndex: number = 0;
  private baseBassRiffIndex: number = 0;
  private baseMelodyId: string | null = null;
  
  private currentDrumRiffIndex: number = 0;
  private currentBassRiffIndex: number = 0;
  private currentGuitarRiffId: string | null = null;


  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed);
    this.nextWeatherEventEpoch = 0;

    const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
    this.shuffledBassRiffIndices = this.random.shuffle(Array.from({ length: allBassRiffs.length }, (_, i) => i));

    const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
    this.shuffledDrumRiffIndices = this.random.shuffle(Array.from({ length: allDrumRiffs.length }, (_, i) => i));

    this.shuffledMelodyIDs = this.random.shuffle(BLUES_GUITAR_RIFFS.map(m => m.id)); // ИЗМЕНЕНО: Используем новую библиотеку
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
    
    const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
    this.baseBassRiffIndex = this.shuffledBassRiffIndices[this.bassRiffConveyorIndex % this.shuffledBassRiffIndices.length];
    this.bassRiffConveyorIndex++;

    const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
    this.baseDrumRiffIndex = this.shuffledDrumRiffIndices[this.drumRiffConveyorIndex % this.shuffledDrumRiffIndices.length];
    this.drumRiffConveyorIndex++;
    
    this.baseMelodyId = this.shuffledMelodyIDs[this.melodyConveyorIndex % this.shuffledMelodyIDs.length];
    this.melodyConveyorIndex++;

    this.currentDrumRiffIndex = this.baseDrumRiffIndex;
    this.currentBassRiffIndex = this.baseBassRiffIndex;
    this.currentGuitarRiffId = this.baseMelodyId; // ИЗМЕНЕНО: Используем новое свойство


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
    
    this.introInstrumentOrder = [];
    const introPart = this.navigator.blueprint.structure.parts.find(p => p.id.startsWith('INTRO'));
    if (introPart?.introRules) {
        this.introInstrumentOrder = this.random.shuffle([...introPart.introRules.instrumentPool]);
        console.log(`[IntroSetup] Unique instrument entry order created: [${this.introInstrumentOrder.join(', ')}]`);
    }

    const firstChord = this.ghostHarmonyTrack[0];
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    const initialBassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';

    if (this.config.genre === 'blues') {
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

        const genre = this.config.genre;
        const mood = this.config.mood;

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
            finalKit.ride = [...new Set([...finalKit.ride, ...DRUM_KITS.ambient!.intro!.ride!])];
        } else if (drumRules?.ride?.enabled === false) {
            finalKit.ride = [];
        }

        console.log(`%c[FME.generateDrums @ Bar ${this.epoch}] Using Kit: ${kitName}. Ride enabled: ${finalKit.ride.length > 0}`, 'color: #FFD700;');

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

    if (navInfo.isPartTransition) {
        const isSoloSection = navInfo.currentPart.id.includes('SOLO');
        const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
        const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
        
        if (isSoloSection) {
            this.currentDrumRiffIndex = this.random.nextInt(allDrumRiffs.length);
            this.currentBassRiffIndex = this.random.nextInt(allBassRiffs.length);
            const soloMelody = this.selectUniqueBluesGuitarRiff(this.config.mood, this.baseMelodyId ?? undefined);
            this.currentGuitarRiffId = soloMelody?.id ?? this.baseMelodyId;
        } else {
            this.currentDrumRiffIndex = this.baseDrumRiffIndex;
            this.currentBassRiffIndex = this.baseBassRiffIndex;
            this.currentGuitarRiffId = this.baseMelodyId;
        }
        
        const logDrumRiffId = `index_${this.currentDrumRiffIndex}`;
        const logBassRiffId = `index_${this.currentBassRiffIndex}`;
        const logMelodyId = this.currentGuitarRiffId || 'N/A';
        console.log(
            `%c[FME Part Info] Active DNA for part ${navInfo.currentPart.name}:\n  - Drum Riff ID: ${logDrumRiffId}\n  - Bass Riff ID: ${logBassRiffId}\n  - Guitar Riff ID: ${logMelodyId}`,
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
              if (this.random.next() < 0.6) {
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

      // --- РЕЖИМ МОЛЧАНИЯ КОМПОЗИТОРА (ПЛАН 895) ---
      // #ЗАЧЕМ: Запрещает основному движку генерировать музыку в течение интро.
      // #ЧТО: Если текущий такт меньше, чем длительность интро, движок возвращает пустую партитуру,
      //      но продолжает свою внутреннюю работу (например, развитие состояний, если они есть),
      //      чтобы быть готовым плавно вступить после интро.
      // #СВЯЗИ: Является ключевым элементом для работы изолированного генератора интро.
      if (this.epoch < this.config.introBars) {
          // Движок "прогревается" в тишине.
          // В будущем здесь можно оставить минимальную логику эволюции состояний, если потребуется.
          console.log(`[FME.evolve @ Bar ${this.epoch}] In intro period. Returning empty score.`);
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

  private generateBluesMelodyChorus(chorusChords: GhostChord[], mood: Mood, random: { next: () => number; nextInt: (max: number) => number }, registerHint?: 'low' | 'mid' | 'high', isSolo: boolean = false): { events: FractalEvent[], log: string } {
    const chorusEvents: FractalEvent[] = [];
    
    const selectedGuitarRiff = this.selectUniqueBluesGuitarRiff(mood, isSolo ? this.baseMelodyId : undefined) ?? BLUES_GUITAR_RIFFS[0];

    if (!selectedGuitarRiff) {
        console.warn(`[BluesGuitarChorus] No guitar riff could be selected for mood: ${mood}.`);
        return { events: [], log: "No riff selected." };
    }
    
    this.currentGuitarRiffId = selectedGuitarRiff.id;

    const barDurationInBeats = 4;
    const ticksPerBeat = 3;
    
    let octaveShift = 12 * 3;
    if (registerHint === 'high') octaveShift = 12 * 4;
    if (registerHint === 'low') octaveShift = 12 * 3;
    
    for (let barIndex = 0; barIndex < 12; barIndex++) {
        const absoluteBar = (chorusChords[0]?.bar ?? 0) + barIndex;
        const barChord = chorusChords.find(c => absoluteBar >= c.bar && absoluteBar < (c.bar + c.durationBars));

        if (!barChord) continue;

        const chordRoot = barChord.rootNote;
        
        const strumPattern = selectedGuitarRiff.strum.find(s => s.bars.includes(barIndex + 1));
        const fingerstylePattern = selectedGuitarRiff.fingerstyle.find(f => f.bars.includes(barIndex + 1));
        
        const techniqueChoice = random.next();
        
        if (techniqueChoice < 0.2 && strumPattern) {
            const voicing = BLUES_GUITAR_VOICINGS[strumPattern.voicingName];
            if(voicing) {
                const strumDelay = 0.02 + random.next() * 0.01;
                voicing.forEach((noteMidi, i) => {
                    let finalNote = noteMidi;
                    if (finalNote > 84) finalNote -= 12; 
                    if (finalNote < 52) finalNote += 12;
                    chorusEvents.push({
                        type: 'melody', note: finalNote,
                        time: (barIndex * barDurationInBeats) + (i * strumDelay),
                        duration: 1.5,
                        weight: 0.8 + (random.next() * 0.1),
                        technique: 'pick', dynamics: 'f', phrasing: 'staccato', params: {}
                    });
                });
            }
        } 
        else if (techniqueChoice < 0.4 && fingerstylePattern) {
            const voicing = BLUES_GUITAR_VOICINGS[fingerstylePattern.voicingName];
             if(voicing) {
                const arpeggioDelay = 0.12 + random.next() * 0.05;
                 voicing.slice(0, 5).forEach((noteMidi, i) => {
                    let finalNote = noteMidi;
                    if (finalNote > 84) finalNote -= 12;
                    if (finalNote < 52) finalNote += 12;
                    chorusEvents.push({
                        type: 'melody', note: finalNote,
                        time: (barIndex * barDurationInBeats) + (i * arpeggioDelay),
                        duration: 1.0,
                        weight: 0.75 + (random.next() * 0.1),
                        technique: 'pluck', dynamics: 'mf', phrasing: 'legato', params: {}
                    });
                });
            }
        }
        else {
             let phrase: BluesSoloPhrase | undefined;
            const rootOfChorus = this.ghostHarmonyTrack.find(c => c.bar === (this.epoch - (this.epoch % 12)))?.rootNote ?? chordRoot;
            const step = (chordRoot - rootOfChorus + 12) % 12;
            
            if (barIndex === 11) phrase = selectedGuitarRiff.solo.Turnaround;
            else if (step === 5) phrase = selectedGuitarRiff.solo.IV;
            else if (step === 7) phrase = selectedGuitarRiff.solo.V;
            else phrase = selectedGuitarRiff.solo.I;

            if (phrase) {
                for (const event of phrase) {
                    let noteMidi = chordRoot + DEGREE_TO_SEMITONE[event.deg] + octaveShift;
                    if (noteMidi > 84) noteMidi -= 12;
                    if (noteMidi < 52) noteMidi += 12;

                    const duration = isSolo ? (((event.d || 2) / ticksPerBeat) * 2.5) : ((event.d || 2) / ticksPerBeat);

                    chorusEvents.push({
                        type: 'melody', note: noteMidi,
                        time: (barIndex * barDurationInBeats) + (event.t / ticksPerBeat),
                        duration: duration,
                        weight: 0.9,
                        technique: 'pick', dynamics: 'f', phrasing: 'legato', params: {}
                    });
                }
            }
        }
    }
    
    const log = `RiffID: ${selectedGuitarRiff.id}.`;
    return { events: chorusEvents, log };
}


}

    