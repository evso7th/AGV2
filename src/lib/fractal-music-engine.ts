

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateBassPhrase, createMelodyMotif, createDrumAxiom, generateGhostHarmonyTrack, mutateAccompanimentPhrase, generateBluesBassRiff, createAmbientBassAxiom, generateBluesMelodyChorus } from './music-theory';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';
import { PARANOID_STYLE_RIFF } from './assets/rock-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { NEUTRAL_BLUES_BASS_RIFFS } from './assets/neutral-blues-riffs';
import { BLUES_MELODY_RIFFS, type BluesRiffDegree, type BluesRiffEvent, type BluesMelodyPhrase, type BluesMelody } from './assets/blues-melody-riffs';
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

  private bluesChorusCache: { barStart: number, events: FractalEvent[], log: string } | null = null;


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
    this.bluesChorusCache = null;

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

    const firstChord = this.ghostHarmonyTrack[0];
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    const initialBassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';
    
    // --- ИСПРАВЛЕНИЕ: Логика инициализации разделена для блюза и других жанров ---
    if (this.config.genre === 'blues') {
        // Для блюза сразу генерируем блюзовые фразы
        for (let i = 0; i < 4; i++) {
            this.bassPhraseLibrary.push(generateBluesBassRiff(firstChord, initialBassTechnique, this.random, this.config.mood));
            this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialRegisterHint));
        }
        
        // Генерируем полный 12-тактовый хорус для мелодии
        const chorusChords = this.ghostHarmonyTrack.filter(c => c.bar >= 0 && c.bar < 12);
        this.bluesChorusCache = {
            barStart: 0,
            ...generateBluesMelodyChorus(chorusChords, this.config.mood, this.random, initialRegisterHint)
        };
        console.log(`%c[FME @ Bar 0] Initializing Blues: ${this.bluesChorusCache.log}`, 'color: #00BCD4; font-weight: bold');
        this.lastMelodyPlayEpoch = -12; // Устанавливаем длительность "мотива" в 12 тактов
    } else {
        // Стандартная логика для эмбиента и других жанров
        const newBassAxiom = createAmbientBassAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialBassTechnique);
        for (let i = 0; i < 4; i++) {
            this.bassPhraseLibrary.push(newBassAxiom);
            this.accompPhraseLibrary.push(createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo, initialRegisterHint));
        }
        this.currentMelodyMotif = createMelodyMotif(firstChord, this.config.mood, this.random);
        this.lastMelodyPlayEpoch = -16; // Стандартный 4-тактовый мотив
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
          console.log(`[FME @ Bar ${this.epoch}] No specific weighted rules for '${part}'. Using fallback: ${fallback}.`);
          return fallback;
      }
  
      const useV2 = this.config.useMelodyV2;
      const engineVersion = useV2 ? 'V2' : 'V1';
      const options = useV2 ? rules.v2Options : rules.v1Options;
  
      if (!options || options.length === 0) {
          const fallbackOptions = !useV2 ? rules.v2Options : rules.v1Options;
          const fallbackEngineVersion = !useV2 ? 'V2' : 'V1';
          if (!fallbackOptions || fallbackOptions.length === 0) {
              const ultimateFallback = part === 'melody' ? 'organ' : 'synth';
              console.log(`[FME @ Bar ${this.epoch}] No ${engineVersion} or fallback options for '${part}'. Using ultimate fallback: ${ultimateFallback}.`);
              return ultimateFallback;
          }
          const chosen = this.performWeightedChoice(fallbackOptions);
          console.log(`[FME @ Bar ${this.epoch}] Selected instrument for '${part}': ${chosen} (from Fallback Engine ${fallbackEngineVersion})`);
          return chosen;
      }
  
      const chosenInstrument = this.performWeightedChoice(options);
      console.log(`[FME @ Bar ${this.epoch}] Selected instrument for '${part}': ${chosenInstrument} (from Primary Engine ${engineVersion})`);
      return chosenInstrument;
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

    return options[options.length - 1].name; // Fallback to the last item
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
    if (!navInfo || !this.navigator) return [];
    
    const drumRules = navInfo.currentPart.instrumentRules?.drums;
    if (!navInfo.currentPart.layers.drums || (drumRules && drumRules.pattern === 'none')) {
        return [];
    }

    // --- NEW BLUES LOGIC ---
    if (this.config.genre === 'blues') {
        const moodRiffs = BLUES_DRUM_RIFFS[this.config.mood] || BLUES_DRUM_RIFFS['contemplative'];
        if (!moodRiffs || moodRiffs.length === 0) return [];
        
        const pattern = moodRiffs[this.random.nextInt(moodRiffs.length)];
        let events: FractalEvent[] = [];
        const ticksPerBeat = 3; // 12/8 time

        const addEvents = (ticks: number[] | undefined, type: InstrumentType) => {
            if (ticks) {
                ticks.forEach(tick => {
                    events.push({
                        type, note: 60, time: tick / ticksPerBeat, duration: 1 / ticksPerBeat,
                        weight: 0.8 + (this.random.next() * 0.2), technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: {}
                    });
                });
            }
        };

        addEvents(pattern.K, 'drum_kick');
        addEvents(pattern.SD, 'drum_snare');
        addEvents(pattern.ghostSD, 'drum_snare_ghost_note');
        addEvents(pattern.HH, 'drum_hihat_closed');
        addEvents(pattern.OH, 'drum_hihat_open');
        addEvents(pattern.R, 'drum_ride');
        addEvents(pattern.T, 'drum_tom_mid');

        // Apply mutations
        if (this.random.next() < 0.3) { // 30% chance to mutate
            const mutationType = this.random.nextInt(3);
            if (mutationType === 0 && events.length > 0) { // Add ghost note
                const noteType = this.random.next() > 0.5 ? 'drum_snare_ghost_note' : 'drum_tom_low';
                events.push({ type: noteType, note: 60, time: (this.random.nextInt(4) * ticksPerBeat + 1) / ticksPerBeat, duration: 1/ticksPerBeat, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: {} });
            } else if (mutationType === 1 && events.length > 0) { // Displace a kick
                const kickEvent = events.find(e => e.type === 'drum_kick');
                if (kickEvent) kickEvent.time += (this.random.next() - 0.5) * 0.1;
            } else if (mutationType === 2 && events.length > 0) { // Accent a hi-hat
                const hatEvent = events.find(e => e.type === 'drum_hihat_closed');
                if (hatEvent) hatEvent.weight = Math.min(1.0, hatEvent.weight * 1.2);
            }
        }
        return events;
    }
    // --- END NEW BLUES LOGIC ---
    
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

    private _generateBassPhrase(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }, tempo: number, technique: Technique): FractalEvent[] {
        if (genre === 'blues') {
            return generateBluesBassRiff(chord, technique, random, mood);
        }
        return createAmbientBassAxiom(chord, mood, genre, random, tempo, technique);
    }

  private generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): FractalEvent[] {
    const effectiveBar = this.epoch % this.navigator.totalBars;
    const currentChord = this.ghostHarmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return [];
    }
    
    let allEvents: FractalEvent[] = [];
    
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
        if (this.bassPhraseLibrary.length <= this.currentBassPhraseIndex || !this.bassPhraseLibrary[this.currentBassPhraseIndex] || navInfo.isBundleTransition) {
           const newPhrase = this._generateBassPhrase(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, bassTechnique);
            if (this.bassPhraseLibrary.length <= this.currentBassPhraseIndex) {
                 this.bassPhraseLibrary.push(newPhrase);
            } else {
                this.bassPhraseLibrary[this.currentBassPhraseIndex] = newPhrase;
            }
        }
        bassEvents = this.bassPhraseLibrary[this.currentBassPhraseIndex] || [];
    }

    // --- ИСПРАВЛЕННАЯ ЛОГИКА: ПРИМЕНЕНИЕ СДВИГА ОКТАВЫ ДЛЯ БАСА ---
    const octaveShift = navInfo.currentPart.instrumentRules?.bass?.presetModifiers?.octaveShift;
    if (octaveShift && bassEvents.length > 0) {
        const TARGET_BASS_OCTAVE_MIN_MIDI = 36; // C2

        console.log(`%c[FME @ Bar ${this.epoch}] Applying intelligent octave shift of ${octaveShift} to bass part.`, 'color: #FFD700');
        
        bassEvents.forEach(event => {
            // Поднимаем ноту, только если она находится ниже целевой октавы
            if (event.note < TARGET_BASS_OCTAVE_MIN_MIDI) {
                event.note += 12 * octaveShift;
            }
        });
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
    
    if (this.config.genre === 'blues') {
        const melodyRules = navInfo.currentPart.instrumentRules?.melody;
        if (navInfo.currentPart.layers.melody && !navInfo.currentPart.bassAccompanimentDouble?.enabled && melodyRules?.source === 'motif') {
            const barInChorus = this.epoch % 12;
            const registerHint = melodyRules?.register?.preferred;
            
            if (barInChorus === 0 || this.bluesChorusCache === null) {
                const chorusBarStart = this.epoch - barInChorus;
                const chorusChords = this.ghostHarmonyTrack.filter(c => c.bar >= chorusBarStart && c.bar < chorusBarStart + 12);
                if (chorusChords.length > 0) {
                    const chorusResult = generateBluesMelodyChorus(chorusChords, this.config.mood, this.random, registerHint);
                    this.bluesChorusCache = {
                        barStart: chorusBarStart,
                        ...chorusResult
                    };
                    // *** ВОТ НОВЫЙ ЛОГ ***
                    console.log(`%c[FME @ Bar ${this.epoch}] Generating NEW 12-bar blues chorus. ${this.bluesChorusCache.log}`, 'color: #00BCD4; font-weight: bold');
                }
            }
            
            if (this.bluesChorusCache) {
                const barStartBeat = ((this.epoch - this.bluesChorusCache.barStart) % 12) * 4.0;
                const barEndBeat = barStartBeat + 4.0;
                melodyEvents = this.bluesChorusCache.events
                    .filter(e => e.time >= barStartBeat && e.time < barEndBeat)
                    .map(e => ({ ...e, time: e.time - barStartBeat }));
            }
        }
    } else { // Логика для эмбиента и других жанров
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
    }
    
    
    const melodyRules = navInfo.currentPart.instrumentRules?.melody;
    if (melodyRules?.presetModifiers?.octaveShift && melodyEvents.length > 0) {
        const shift = melodyRules.presetModifiers.octaveShift;
        melodyEvents.forEach(e => e.note += 12 * shift);
        console.log(`%c[FME @ Bar ${this.epoch}] Applied octave shift of ${shift} to melody.`, 'color: #FFD700');
    }

    allEvents.push(...(bassEvents || []), ...(drumEvents || []), ...(accompEvents || []), ...(melodyEvents || []));
    
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
    
    return allEvents;
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
      if (!this.navigator) {
          console.warn("[FME] Evolve called but navigator is not ready. Waiting for initialization.");
          return { events: [], instrumentHints: {} };
      }

      this.epoch = barCount;

      if (this.epoch >= this.navigator.totalBars + 4) {
        console.log(`%c[FME @ Bar ${this.epoch}] End of suite detected. Posting SUITE_ENDED command.`, 'color: red; font-weight: bold;');
        self.postMessage({ command: 'SUITE_ENDED' });
        return { events: [], instrumentHints: {} }; 
      }
      
      if (this.epoch >= this.navigator.totalBars) {
          const promenadeBar = this.epoch - this.navigator.totalBars;
          const promenadeEvents = this._generatePromenade(promenadeBar);
          return { events: promenadeEvents, instrumentHints: {} };
      }

      if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
      
      // Сначала получаем navInfo
      const navigationInfo = this.navigator.tick(this.epoch);

      // Затем, на основе navInfo, выбираем инструменты
      const instrumentHints: InstrumentHints = {
          accompaniment: this._chooseInstrumentForPart('accompaniment', navigationInfo),
          melody: this._chooseInstrumentForPart('melody', navigationInfo),
      };

      // И только потом генерируем такт
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
         events.push({ type: 'sparkle', note: 72, time: 0.5, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: { mood: this.config.mood, genre: this.config.genre }});
         events.push({ type: 'sfx', note: 60, time: 2.5, duration: 2, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { mood: this.config.mood, genre: this.config.genre } });
    }
    return events;
  }

}




    