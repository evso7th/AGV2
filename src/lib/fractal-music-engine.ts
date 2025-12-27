

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument } from '@/types/fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill as createBassFillFromTheory, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateBassPhrase, createMelodyMotif, createDrumAxiom, generateGhostHarmonyTrack, mutateAccompanimentPhrase, createHarmonyAxiom } from './music-theory';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { MelancholicAmbientBlueprint, BLUEPRINT_LIBRARY, getBlueprint } from './blueprints';
import { prettyPresets } from './presets-v2';


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
    const promenade: FractalEvent[] = [];
    const scale = getScaleForMood(this.config.mood);
    const root = scale[0];
    const durationInBeats = 16; // 4 bars * 4 beats
  
    // 1. Sustained Bass/Pad Drone (Foundation)
    promenade.push({
      type: 'bass',
      note: root - 12, // Sub-bass
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
        note: root, // Mid-range
        duration: durationInBeats,
        time: 0.5, // Slightly offset
        weight: 0.4,
        technique: 'swell',
        dynamics: 'p',
        phrasing: 'legato',
        params: { attack: 4.0, release: 6.0 }
    });
  
    // 2. Textural Percussion (Using `perc-*` samples)
    const percSamples: InstrumentType[] = ['perc-007', 'perc-011', 'perc-014', 'drum_a_ride2'];
    for (let i = 0; i < 8; i++) {
        promenade.push({
            type: percSamples[i % percSamples.length],
            note: 60, // Dummy note
            duration: 1.0,
            time: i * 2.0 + this.random.next() * 0.5, // Every 2 beats, with jitter
            weight: 0.2 + this.random.next() * 0.1, // Very quiet
            technique: 'hit', dynamics: 'pp', phrasing: 'staccato', params: {}
        });
    }
  
    // 3. Atmospheric SFX
    promenade.push({
      type: 'sfx',
      note: 60,
      time: 1.0,
      duration: durationInBeats - 2.0,
      weight: 0.35,
      technique: 'swell', dynamics: 'p', phrasing: 'legato',
      params: { mood: this.config.mood, genre: 'ambient', rules: { eventProbability: 1.0, categories: [{name: 'common', weight: 1.0}]} }
    });
  
    // 4. Melodic "Sparkle"
    promenade.push({
      type: 'sparkle',
      note: 60,
      time: durationInBeats / 2, // Right in the middle
      duration: 1,
      weight: 0.6,
      technique: 'hit', dynamics: 'mp', phrasing: 'legato',
      params: { mood: this.config.mood, genre: this.config.genre }
    });
  
    this.promenadeBars = promenade;
    console.log(`[FME] Generated enriched Promenade with ${this.promenadeBars.length} events.`);
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
    
    // #ЗАЧЕМ: Этот блок кода отвечает за создание НАЧАЛЬНОЙ библиотеки фраз для аккомпанемента.
    // #ЧТО: Он считывает информацию о навигации для самого первого такта (bar 0), чтобы получить
    //      правила для интро. Затем он извлекает из этих правил `registerHint` (указание на регистр)
    //      и передает его в `createAccompanimentAxiom` при создании фраз.
    // #СВЯЗИ: Решает проблему "инициализации вслепую", когда начальные фразы создавались
    //         без учета правил блюпринта, что приводило к неправильному регистру в интро.
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    
    for (let i = 0; i < 4; i++) {
        this.bassPhraseLibrary.push(generateAmbientBassPhrase(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo));
        this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialRegisterHint));
    }
    
    this.currentMelodyMotif = createMelodyMotif(firstChord, this.config.mood, this.random);
    this.lastMelodyPlayEpoch = -4;
    
    this.needsBassReset = false;
  }
  
  private _chooseInstrumentForPart(part: 'melody' | 'accompaniment', currentPartInfo: BlueprintPart | null): MelodyInstrument | AccompanimentInstrument | undefined {
        let selectedInstrument: MelodyInstrument | AccompanimentInstrument | undefined = undefined;
        let rules: InstrumentationRules<any> | undefined;

        if (currentPartInfo?.instrumentation?.[part]) {
            rules = currentPartInfo.instrumentation[part];
        }

        if (rules && rules.strategy === 'weighted' && rules.options.length > 0) {
            const totalWeight = rules.options.reduce((sum, opt) => sum + opt.weight, 0);
            let rand = this.random.next() * totalWeight;

            for (const option of rules.options) {
                rand -= option.weight;
                if (rand <= 0) {
                    selectedInstrument = option.name;
                    break;
                }
            }
             if (!selectedInstrument) {
                selectedInstrument = rules.options[0].name;
            }
        } else {
            // Fallback logic
            const moodWeights = TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD[this.config.mood] || TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD['calm'];
            const options = Object.entries(moodWeights).map(([name, weight]) => ({ name: name as MelodyInstrument, weight }));
            if (options.length > 0) {
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
            }
        }
        
        if (part === 'melody' && this.config.useMelodyV2) {
            const v2PresetNames = Object.keys(prettyPresets);
            if (!selectedInstrument || !v2PresetNames.includes(selectedInstrument as string)) {
                console.log(`[FME Hint Correction] V2 Engine is active. Hint '${selectedInstrument}' is not a V2 preset. Choosing a random V2 preset.`);
                selectedInstrument = v2PresetNames[this.random.nextInt(v2PresetNames.length)] as keyof typeof prettyPresets;
            }
        }

        return selectedInstrument;
    }


  public generateExternalImpulse() {
    // This functionality is currently disabled to simplify the logic.
    // We can re-enable it once the core composition is stable.
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
                note: note + 12 * 2, // Play in a mid-low register
                duration: 4.0, // Long duration for overlapping
                time: startTime + (index * 0.06), // Very fast succession
                weight: 0.6 - (index * 0.05), // Slightly decreasing volume
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
        if (this.accompPhraseLibrary[this.currentAccompPhraseIndex].length === 0 || this.epoch % 4 === 0) {
            this.accompPhraseLibrary[this.currentAccompPhraseIndex] = createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint);
        }
        accompEvents = this.accompPhraseLibrary[this.currentAccompPhraseIndex];
    }
    
    const canVary = !navInfo.currentPart.id.startsWith('INTRO') || navInfo.currentPart.id.includes('3');
    const PHRASE_VARIATION_INTERVAL = 4;
    
    if (canVary && this.epoch > 0 && this.epoch % PHRASE_VARIATION_INTERVAL === 0) {
        this.currentBassPhraseIndex = (this.currentBassPhraseIndex + 1) % this.bassPhraseLibrary.length;
        if (this.random.next() < 0.6) {
            this.bassPhraseLibrary[this.currentBassPhraseIndex] = mutateBassPhrase(this.bassPhraseLibrary[this.currentBassPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
        }
        this.currentAccompPhraseIndex = (this.currentAccompPhraseIndex + 1) % this.accompPhraseLibrary.length;
        if (this.random.next() < 0.6 && !navInfo.currentPart.id.startsWith('INTRO')) { 
            this.accompPhraseLibrary[this.currentAccompPhraseIndex] = mutateAccompanimentPhrase(this.accompPhraseLibrary[this.currentAccompPhraseIndex], currentChord, this.config.mood, this.config.genre, this.random);
        }
    }

    let bassEvents = navInfo.currentPart.layers.bass ? this.bassPhraseLibrary[this.currentBassPhraseIndex] : [];
    
    if (navInfo.currentPart.bassAccompanimentDouble?.enabled) {
        const { instrument, octaveShift } = navInfo.currentPart.bassAccompanimentDouble;
        const bassDoubleEvents: FractalEvent[] = bassEvents.map(e => ({
            ...e,
            type: 'accompaniment',
            note: e.note + (12 * octaveShift),
            weight: e.weight * 0.8, // Slightly lower volume
        }));
        accompEvents.push(...bassDoubleEvents);
        instrumentHints.accompaniment = instrument;
    }
    
    let harmonyEvents: FractalEvent[] = [];
    let melodyEvents: FractalEvent[] = [];

    if (navInfo.currentPart.layers.harmony) {
        instrumentHints.harmony = chooseHarmonyInstrument(this.config.mood, this.random);
        harmonyEvents = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random);
    }
    
    if (navInfo.currentPart.layers.melody) {
        // #ЗАЧЕМ: Этот блок реализует декларативное управление генерацией мелодии.
        // #ЧТО: Он считывает `melodySource` из блюпринта. Если `harmony_top_note`, он извлекает
        //      верхние ноты аккомпанемента. В противном случае, он использует стандартную логику мотивов.
        // #СВЯЗИ: Заменяет жестко закодированную проверку на `genre === 'ambient'`.
        const melodyRules = navInfo.currentPart.instrumentRules?.melody;
        if (melodyRules?.source === 'harmony_top_note') {
            const topNotes = accompEvents.sort((a, b) => b.note - a.note).slice(0, 2);
            melodyEvents = topNotes.map(noteEvent => ({
                ...noteEvent,
                type: 'melody',
                note: noteEvent.note + 7, // Играем на квинту выше
                weight: noteEvent.weight * 0.7,
            }));
        } else {
            // Стандартная логика с мотивом
            const melodyDensity = melodyRules?.density?.min ?? 0.25;
            const minInterval = 2; // Кулдаун

            if (this.epoch >= this.lastMelodyPlayEpoch + minInterval && this.random.next() < melodyDensity) {
                if (this.epoch > 0 && this.currentMelodyMotif.length > 0) {
                    this.currentMelodyMotif = createMelodyMotif(currentChord, this.config.mood, this.random, this.currentMelodyMotif);
                }
                melodyEvents = this.currentMelodyMotif.slice(0, 4); // Возвращаемся к надежному варианту
                this.lastMelodyPlayEpoch = this.epoch;
            }
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

    if (navigationInfo && navigationInfo.logMessage) {
        console.log(navigationInfo.logMessage);
    }
    
    const { events, instrumentHints } = this.generateOneBar(barDuration, navigationInfo);
    return { events, instrumentHints };
  }
}

    