

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateBassPhrase, createMelodyMotif, createDrumAxiom, generateGhostHarmonyTrack, mutateAccompanimentPhrase } from './music-theory';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';


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

    // Инициализация отложена до асинхронной загрузки блюпринта в updateConfig/initialize
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

  public async initialize(force: boolean = false) {
    if (this.navigator && !force) return;

    this.random = seededRandom(this.config.seed);
    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5; 
    this.hasBassBeenMutated = false;

    const blueprint = await getBlueprint(this.config.genre, this.config.mood);
    console.log(`[FME] Blueprint now active: ${blueprint.name}`);
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars);
    
    const key = getScaleForMood(this.config.mood)[0];
    this.ghostHarmonyTrack = generateGhostHarmonyTrack(this.navigator.totalBars, this.config.mood, key, this.random);
    if (this.ghostHarmonyTrack.length === 0) {
      throw new Error("[Engine] CRITICAL ERROR: Could not generate 'Ghost Harmony'. Music is not possible.");
    }

    console.log(`[FractalMusicEngine] Initialized with blueprint "${this.navigator.blueprint.name}". Total duration: ${this.navigator.totalBars} bars.`);

    this.bassPhraseLibrary = [];
    this.currentBassPhraseIndex = 0;
    this.accompPhraseLibrary = [];
    this.currentAccompPhraseIndex = 0;

    const firstChord = this.ghostHarmonyTrack[0];
    
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    
    for (let i = 0; i < 4; i++) {
        const bassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0]?.value as Technique || 'drone';
        this.bassPhraseLibrary.push(generateAmbientBassPhrase(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, bassTechnique));
        this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialRegisterHint));
    }
    
    this.currentMelodyMotif = createMelodyMotif(firstChord, this.config.mood, this.random);
    this.lastMelodyPlayEpoch = -16; 
    
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
    if (!navInfo || !this.navigator) {
        return { events: [], instrumentHints: {} };
    }
    
    // #ИЗМЕНЕНО: Добавлен оператор % для зацикливания гармонии, предотвращая ошибку выхода за пределы массива.
    const effectiveBar = this.epoch % this.navigator.totalBars;
    const currentChord = this.ghostHarmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

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

    let bassEvents: FractalEvent[] = [];
    
    const bassRules = navInfo.currentPart.instrumentRules?.bass;
    const bassTechnique = bassRules?.techniques?.[0]?.value as Technique || 'drone';

    if (navInfo.currentPart.layers.bass) {
        if (bassTechnique === 'riff') {
            const isNewBundle = navInfo.isBundleTransition || this.epoch === 0;
            if (isNewBundle || this.bassPhraseLibrary[this.currentBassPhraseIndex]?.length === 0) {
                const newRiffAxiom = generateBluesBassRiff(currentChord, 'riff', this.random, this.config.mood);
                const mutatedRiff = this.epoch > 0 ? mutateBassPhrase(newRiffAxiom, currentChord, this.config.mood, this.config.genre, this.random) : newRiffAxiom;
                const oneBarRiff = mutatedRiff.filter(e => e.time < 4.0);
                this.bassPhraseLibrary[this.currentBassPhraseIndex] = oneBarRiff;
                console.log(`%c[FME @ Bar ${this.epoch}] Generated and stored new mutated blues riff.`, 'color: #ADD8E6');
            }
            bassEvents = this.bassPhraseLibrary[this.currentBassPhraseIndex];

        } else if (this.config.genre === 'blues') {
            bassEvents = generateBluesBassRiff(currentChord, bassTechnique, this.random, this.config.mood);
        } else {
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
            type: 'melody',
            note: e.note + (12 * octaveShift),
            weight: e.weight * 0.8,
        }));
        allEvents.push(...bassDoubleEvents);
        instrumentHints.melody = instrument;
    }
    
    let melodyEvents: FractalEvent[] = [];

    if (navInfo.currentPart.layers.melody && !navInfo.currentPart.bassAccompanimentDouble?.enabled) {
        const melodyRules = navInfo.currentPart.instrumentRules?.melody;
        const melodyDensity = melodyRules?.density?.min ?? 0.25;
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
            const registerHint = melodyRules?.register?.preferred;
            this.currentMelodyMotif = createMelodyMotif(currentChord, this.config.mood, this.random, shouldMutate ? this.currentMelodyMotif : undefined, registerHint, this.config.genre);
            melodyEvents = this.currentMelodyMotif
                .filter(e => e.time < 4.0)
                .map(e => ({ ...e, time: e.time }));
            this.lastMelodyPlayEpoch = this.epoch;
        }
    }
    
    allEvents.push(...bassEvents, ...drumEvents, ...accompEvents, ...melodyEvents);
    
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
        console.log(`%c[FME @ Bar ${this.epoch}] Generating outro fill for bundle: ${navInfo.currentBundle.id}`, 'color: #FF8C00');
        const drumFill = createDrumFill(this.random, fillParams);
        const bassFill = createBassFill(currentChord, this.config.mood, this.random);
        allEvents.push(...drumFill, ...bassFill);
    }
    
    return { events: allEvents, instrumentHints };
  }


  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    if (!this.navigator) {
        console.warn("[FME] Evolve called but navigator is not ready. Waiting for initialization.");
        return { events: [], instrumentHints: {} };
    }

    this.epoch = barCount;

    if (this.epoch >= this.navigator.totalBars) {
      console.log(`%c[FME @ Bar ${this.epoch}] End of suite detected. Posting SUITE_ENDED command.`, 'color: red; font-weight: bold;');
      // Вместо прямого вызова reset, отправляем сообщение в воркер
      self.postMessage({ command: 'SUITE_ENDED' });
      return { events: [], instrumentHints: {} }; // Возвращаем пустоту, пока воркер перезагружается
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
