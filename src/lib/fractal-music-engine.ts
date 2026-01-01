

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateBassPhrase, createMelodyMotif, createDrumAxiom, generateGhostHarmonyTrack, mutateAccompanimentPhrase, createHarmonyAxiom, generateBluesBassRiff } from './music-theory';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';


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
  
  public navigator: BlueprintNavigator | null = null;
  private isPromenadeActive: boolean = false;
  private promenadeBars: FractalEvent[] = [];


  private bassPhraseLibrary: FractalEvent[][] = [];
  private currentBassPhraseIndex = 0;

  private accompPhraseLibrary: FractalEvent[][] = [];
  private currentAccompPhraseIndex = 0;

  private currentMelodyMotif: FractalEvent[] = [];
  private lastMelodyPlayEpoch: number = -16; // Start with a delay, now 4 bars long


  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed);
    this.nextWeatherEventEpoch = 0;

    // #ИЗМЕНЕНО: Инициализация отложена до асинхронной загрузки блюпринта в updateConfig/initialize
  }

  public get tempo(): number { return this.config.tempo; }
  

  public async updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      const introBarsChanged = newConfig.introBars !== this.config.introBars;
      const seedChanged = newConfig.seed !== undefined && newConfig.seed !== this.config.seed;
      
      this.config = { ...this.config, ...newConfig };
      
      if(!this.navigator || moodOrGenreChanged || introBarsChanged || seedChanged) {
          console.log(`[FME] Config changed or initial setup. Re-initializing. New mood: ${this.config.mood}, New intro: ${this.config.introBars}`);
          if (seedChanged) {
            this.random = seededRandom(this.config.seed);
          }
          await this.initialize(true); // Force re-initialization
      }
  }

  private _generatePromenade() {
    const promenade: FractalEvent[] = [];
    const scale = getScaleForMood(this.config.mood);
    const root = scale[0];
    const durationInBeats = 16; // 4 bars * 4 beats
  
    promenade.push({
      type: 'bass',
      note: root - 12,
      duration: durationInBeats,
      time: 0,
      weight: 0.5,
      technique: 'drone',
      dynamics: 'p',
      phrasing: 'legato',
      params: { attack: 3.0, release: 5.0, cutoff: 200, resonance: 0.5, distortion: 0, portamento: 0.1 }
    });
    promenade.push({
        type: 'accompaniment',
        note: root,
        duration: durationInBeats,
        time: 0.5,
        weight: 0.4,
        technique: 'swell',
        dynamics: 'p',
        phrasing: 'legato',
        params: { attack: 4.0, release: 6.0 }
    });
  
    const percSamples: InstrumentType[] = ['perc-007', 'perc-011', 'perc-014', 'drum_a_ride2'];
    for (let i = 0; i < 8; i++) {
        promenade.push({
            type: percSamples[i % percSamples.length],
            note: 60,
            duration: 1.0,
            time: i * 2.0 + this.random.next() * 0.5,
            weight: 0.2 + this.random.next() * 0.1,
            technique: 'hit', dynamics: 'pp', phrasing: 'staccato', params: {}
        });
    }
  
    promenade.push({
      type: 'sfx',
      note: 60,
      time: 1.0,
      duration: durationInBeats - 2.0,
      weight: 0.35,
      technique: 'swell', dynamics: 'p', phrasing: 'legato',
      params: { mood: this.config.mood, genre: 'ambient', rules: { eventProbability: 1.0, categories: [{name: 'common', weight: 1.0}]} }
    });
  
    promenade.push({
      type: 'sparkle',
      note: 60,
      time: durationInBeats / 2,
      duration: 1,
      weight: 0.6,
      technique: 'hit', dynamics: 'mp', phrasing: 'legato',
      params: { mood: this.config.mood, genre: this.config.genre }
    });
  
    this.promenadeBars = promenade;
    console.log(`[FME] Generated enriched Promenade with ${this.promenadeBars.length} events.`);
  }

  public async initialize(force: boolean = false) {
    if (this.navigator && !force) return;

    this.random = seededRandom(this.config.seed);
    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5; 
    this.hasBassBeenMutated = false;

    // #ИЗМЕНЕНО: Асинхронная загрузка блюпринта
    const blueprint = await getBlueprint(this.config.genre, this.config.mood);
    console.log(`[FME] Blueprint now active: ${blueprint.name}`);
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars);
    
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
    
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    
    for (let i = 0; i < 4; i++) {
        // #ИЗМЕНЕНО: Вызываем generateAmbientBassPhrase с указанием техники, даже если для эмбиента она одна
        const bassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0]?.value as Technique || 'drone';
        this.bassPhraseLibrary.push(generateAmbientBassPhrase(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, bassTechnique));
        this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialRegisterHint));
    }
    
    this.currentMelodyMotif = createMelodyMotif(firstChord, this.config.mood, this.random);
    this.lastMelodyPlayEpoch = -16; // Motif is now 4 bars long, increased cooldown
    
    this.needsBassReset = false;
  }
  
  private _chooseInstrumentForPart(part: 'melody' | 'accompaniment', currentPartInfo: BlueprintPart | null): MelodyInstrument | AccompanimentInstrument | undefined {
        let selectedInstrument: MelodyInstrument | AccompanimentInstrument | undefined = undefined;
        const rules = currentPartInfo?.instrumentation?.[part];
        
        console.log(`%c[FME @ Bar ${this.epoch}] Choosing instrument for '${part}'. V2 Engine Active: ${this.config.useMelodyV2}`, 'color: #9370DB');
        
        let options: { name: any; weight: number; }[] | undefined;

        if (rules?.strategy === 'weighted') {
            if (this.config.useMelodyV2 && rules.v2Options && rules.v2Options.length > 0) {
                options = rules.v2Options;
                console.log(`[FME] Using V2 options for ${part}.`);
            } else if (!this.config.useMelodyV2 && rules.v1Options && rules.v1Options.length > 0) {
                options = rules.v1Options;
                console.log(`[FME] Using V1 options for ${part}.`);
            } else if (rules.options && rules.options.length > 0) {
                options = rules.options; // Fallback to generic options
                console.log(`[FME] Using generic options for ${part}.`);
            }
        }
        
        if (options && options.length > 0) {
             const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
             let rand = this.random.next() * totalWeight;

             for (const option of options) {
                 rand -= option.weight;
                 if (rand <= 0) {
                     selectedInstrument = option.name;
                     break;
                 }
             }
             if (!selectedInstrument) {
                 selectedInstrument = options[0].name;
             }
        } else {
             // Fallback logic if no rules are defined
             const moodWeights = TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD[this.config.mood] || TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD['calm'];
             const fallbackOptions = Object.entries(moodWeights).map(([name, weight]) => ({ name: name as MelodyInstrument, weight }));
             if (fallbackOptions.length > 0) {
                 const totalWeight = fallbackOptions.reduce((sum, opt) => sum + opt.weight, 0);
                 let rand = this.random.next() * totalWeight;
                 for (const option of fallbackOptions) {
                     rand -= option.weight;
                     if (rand <= 0) {
                         selectedInstrument = option.name;
                         break;
                     }
                 }
                 if (!selectedInstrument) {
                     selectedInstrument = fallbackOptions[0].name;
                 }
             }
        }

        // Final check to ensure the chosen instrument is compatible with the engine version
        if (this.config.useMelodyV2) {
            const v2PresetNames = Object.keys(V2_PRESETS);
            if (!selectedInstrument || !v2PresetNames.includes(selectedInstrument as string)) {
                console.log(`[FME] V2 Engine compatibility check: '${selectedInstrument}' is not V2. Choosing random V2 preset.`);
                selectedInstrument = v2PresetNames[this.random.nextInt(v2PresetNames.length)] as keyof typeof V2_PRESETS;
            }
        } else {
            const v1InstrumentList: string[] = ['synth', 'organ', 'mellotron', 'theremin', 'electricGuitar', 'ambientPad', 'acousticGuitar', 'E-Bells_melody', 'G-Drops', 'piano', 'violin', 'flute', 'acousticGuitarSolo', 'guitarChords'];
             if (selectedInstrument && !v1InstrumentList.includes(selectedInstrument)) {
                console.log(`[FME] V1 Engine compatibility check: '${selectedInstrument}' is not V1. Choosing random V1 preset.`);
                selectedInstrument = v1InstrumentList[this.random.nextInt(v1InstrumentList.length)] as MelodyInstrument;
             }
        }
        
        console.log(`%c[FME @ Bar ${this.epoch}] Selected instrument hint for '${part}': ${selectedInstrument}`, 'color: #9370DB');
        return selectedInstrument;
  }


  public generateExternalImpulse() {
    // This functionality is currently disabled to simplify the logic.
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
    if (!navInfo.currentPart.layers.drums || (drumRules && drumRules.pattern === 'none')) {
        return [];
    }
    
    const baseAxiom = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random, drumRules).events;
    
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
        const scale = getScaleForMood(this.config.mood);
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
    
    let drumEvents = this.generateDrumEvents(navInfo);
    
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
        accompEvents = this.accompPhraseLibrary[this.currentAccompPhraseIndex];
    }
    
    const canVary = !navInfo.currentPart.id.startsWith('INTRO') || navInfo.currentPart.id.includes('3');
    const PHRASE_VARIATION_INTERVAL = 4;
    
    if (canVary && this.epoch > 0 && this.epoch % PHRASE_VARIATION_INTERVAL === 0) {
        this.currentBassPhraseIndex = (this.currentBassPhraseIndex + 1) % this.bassPhraseLibrary.length;
        if (this.random.next() < 0.6) { // 60% chance to mutate
            this.bassPhraseLibrary[this.currentBassPhraseIndex] = mutateBassPhrase(this.bassPhraseLibrary[this.currentBassPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
        }
        this.currentAccompPhraseIndex = (this.currentAccompPhraseIndex + 1) % this.accompPhraseLibrary.length;
        if (this.random.next() < 0.6 && !navInfo.currentPart.id.startsWith('INTRO')) { 
            this.accompPhraseLibrary[this.currentAccompPhraseIndex] = mutateAccompanimentPhrase(this.accompPhraseLibrary[this.currentAccompPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
        }
    }

    // --- BASS GENERATION ---
    let bassEvents: FractalEvent[] = [];
    const bassRules = navInfo.currentPart.instrumentRules?.bass;
    const bassTechnique = bassRules?.techniques?.[0]?.value as Technique || 'drone';

    if (navInfo.currentPart.layers.bass) {
        // #ИЗМЕНЕНО: Новая логика для техники 'riff'
        if (bassTechnique === 'riff') {
            const isNewBundle = navInfo.isBundleTransition || this.epoch === 0;
            // Генерируем новый рифф (и мутируем его) только на границе бандла
            if (isNewBundle || this.bassPhraseLibrary[this.currentBassPhraseIndex]?.length === 0) {
                const newRiffAxiom = generateBluesBassRiff(currentChord, 'riff', this.random, this.config.mood);
                const mutatedRiff = this.epoch > 0 ? mutateBassPhrase(newRiffAxiom, currentChord, this.config.mood, this.config.genre, this.random) : newRiffAxiom; // Не мутируем самый первый рифф
                
                // Риффы могут быть многотактовыми, мы должны их "нарезать"
                // Для простоты, пока будем использовать только первый такт риффа, повторяя его
                const oneBarRiff = mutatedRiff.filter(e => e.time < 4.0);
                this.bassPhraseLibrary[this.currentBassPhraseIndex] = oneBarRiff;
                console.log(`%c[FME @ Bar ${this.epoch}] Generated and stored new mutated blues riff.`, 'color: #ADD8E6');
            }
            bassEvents = this.bassPhraseLibrary[this.currentBassPhraseIndex];

        } else if (this.config.genre === 'blues') { // Старая логика для других блюзовых техник
            bassEvents = generateBluesBassRiff(currentChord, bassTechnique, this.random, this.config.mood);
        } else { // Старая логика для эмбиента
            if (!this.bassPhraseLibrary[this.currentBassPhraseIndex] || this.bassPhraseLibrary[this.currentBassPhraseIndex].length === 0 || navInfo.isBundleTransition) {
               const newPhrase = generateAmbientBassPhrase(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, bassTechnique);
                if (this.bassPhraseLibrary.length <= this.currentBassPhraseIndex) {
                     this.bassPhraseLibrary.push(newPhrase);
                } else {
                    this.bassPhraseLibrary[this.currentBassPhraseIndex] = newPhrase;
                }
            }
            bassEvents = this.bassPhraseLibrary[this.currentBassPhraseIndex];
        }
    }
    
    if (navInfo.currentPart.bassAccompanimentDouble?.enabled) {
        const { instrument, octaveShift } = navInfo.currentPart.bassAccompanimentDouble;
        const bassDoubleEvents: FractalEvent[] = bassEvents.map(e => ({
            ...e,
            type: 'melody', // #ИЗМЕНЕНО: Тип изменен на 'melody', чтобы его играл мелодический менеджер
            note: e.note + (12 * octaveShift),
            weight: e.weight * 0.8,
        }));
        // Вместо добавления к аккомпанементу, мы добавляем это как события мелодии
        allEvents.push(...bassDoubleEvents);
        instrumentHints.melody = instrument; // Указываем, какой инструмент должен играть эту партию
    }
    
    let harmonyEvents: FractalEvent[] = [];
    let melodyEvents: FractalEvent[] = [];

    if (navInfo.currentPart.layers.harmony) {
        instrumentHints.harmony = chooseHarmonyInstrument(this.config.mood, this.random);
        harmonyEvents = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random);
    }
    
    // --- MELODY GENERATION (REFACTORED for 4-bar motifs) ---
    if (navInfo.currentPart.layers.melody && !navInfo.currentPart.bassAccompanimentDouble?.enabled) { // Не генерируем мелодию, если уже есть дублирование баса
        const melodyRules = navInfo.currentPart.instrumentRules?.melody;
        const melodyDensity = melodyRules?.density?.min ?? 0.25;
        const minInterval = 8; // Don't play motifs too close together
        const motifBarIndex = this.epoch - this.lastMelodyPlayEpoch;

        if (motifBarIndex >= 0 && motifBarIndex < 4 && this.currentMelodyMotif.length > 0) {
            // We are inside a 4-bar motif playback cycle
            const barStartBeat = motifBarIndex * 4.0;
            const barEndBeat = (motifBarIndex + 1) * 4.0;
            melodyEvents = this.currentMelodyMotif
                .filter(e => e.time >= barStartBeat && e.time < barEndBeat)
                .map(e => ({ ...e, time: e.time - barStartBeat })); // Make time relative to current bar
        } else if (this.epoch >= this.lastMelodyPlayEpoch + minInterval && this.random.next() < melodyDensity) {
            // Time to start a NEW 4-bar motif
            const shouldMutate = this.currentMelodyMotif.length > 0 && this.random.next() > 0.3;
            const registerHint = melodyRules?.register?.preferred;

            this.currentMelodyMotif = createMelodyMotif(currentChord, this.config.mood, this.random, shouldMutate ? this.currentMelodyMotif : undefined, registerHint, this.config.genre);
            
            // Play the FIRST bar of the new motif now
            melodyEvents = this.currentMelodyMotif
                .filter(e => e.time < 4.0)
                .map(e => ({ ...e, time: e.time }));
                
            this.lastMelodyPlayEpoch = this.epoch;
        }
    }
    
    allEvents.push(...bassEvents, ...drumEvents, ...accompEvents, ...harmonyEvents, ...melodyEvents);
    
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
    
    // --- FILL GENERATION ---
    const isLastBarOfBundle = navInfo.currentBundle && this.epoch === navInfo.currentBundle.endBar;
    // #ЗАЧЕМ: Этот блок кода проверяет, является ли текущий такт последним в бандле и есть ли в
    //         блюпринте инструкция `outroFill` для этого бандла.
    // #ЧТО: Если оба условия истинны, он вызывает функции `createDrumFill` и `createBassFill`,
    //       чтобы сгенерировать переходные сбивки, и добавляет их к событиям этого такта.
    // #СВЯЗИ: Этот механизм позволяет декларативно управлять филлами через блюпринты,
    //         не зашивая логику в код движка.
    if (navInfo.currentBundle && navInfo.currentBundle.outroFill && isLastBarOfBundle) {
        const fillParams = navInfo.currentBundle.outroFill.parameters || {};
        console.log(`%c[FME @ Bar ${this.epoch}] Generating outro fill for bundle: ${navInfo.currentBundle.id}`, 'color: #FF8C00');
        const drumFill = createDrumFill(this.random, fillParams);
        const bassFill = createBassFill(currentChord, this.config.mood, this.random);
        allEvents.push(...drumFill, ...bassFill);
    }
    
    return { events: allEvents, instrumentHints };
  }


  private _resetForNewSuite() {
    // This method is now obsolete. The worker will post a 'reset' message to itself.
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    if (!this.navigator) {
        console.warn("[FME] Evolve called but navigator is not ready. Waiting for initialization.");
        return { events: [], instrumentHints: {} };
    }

    this.epoch = barCount;

    if (!this.isPromenadeActive && this.epoch > 0 && this.epoch >= this.navigator.totalBars) {
      console.log(`%c[FME] End of suite reached at bar ${this.epoch}. Activating PROMENADE.`, 'color: #FFD700; font-weight: bold');
      this.isPromenadeActive = true;
      // Immediately start the promenade
      return {
        events: this.promenadeBars,
        instrumentHints: { bass: 'glideBass', accompaniment: 'synth' }
      };
    }
    
    if (this.isPromenadeActive) {
        const promenadeDuration = 4; // Promenade is 4 bars long
        const promenadeEndEpoch = this.navigator.totalBars + promenadeDuration;
        
        if (this.epoch >= promenadeEndEpoch) {
             console.log(`%c[FME] Promenade ended. Posting 'reset' command to self for full regeneration.`, 'color: #FF4500; font-weight: bold;');
             // Use the existing 'reset' command logic
             self.postMessage({ command: 'reset' });
             this.isPromenadeActive = false; // Reset state
             // Return empty for this tick, as the reset will handle the next state
             return { events: [], instrumentHints: {} };
        }
        // While promenade is playing, but before reset, return empty to let it finish.
        // The first tick of promenade already sent the events.
        return { events: [], instrumentHints: {} };
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
    
    const navigationInfo = this.navigator.tick(this.epoch);

    if (navigationInfo && navigationInfo.logMessage) {
        console.log(navigationInfo.logMessage);
    }
    
    const { events, instrumentHints } = this.generateOneBar(barDuration, navigationInfo);
    return { events, instrumentHints };
  }
}
