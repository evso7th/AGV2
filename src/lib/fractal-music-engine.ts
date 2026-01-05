
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, InstrumentPart } from './fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateBassPhrase, createMelodyMotif, createDrumAxiom, generateGhostHarmonyTrack, mutateAccompanimentPhrase, createAmbientBassAxiom, createHarmonyAxiom } from './music-theory';
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
  public random: { next: () => number; nextInt: (max: number) => number }
  private nextWeatherEventEpoch: number;
  public needsBassReset: boolean = false;
  private sfxFillForThisEpoch: { drum: FractalEvent[], bass: FractalEvent[], accompaniment: FractalEvent[] } | null = null;
  private lastAccompanimentEndTime: number = -Infinity;
  private nextAccompanimentDelay: number = 0;
  private hasBassBeenMutated = false;
  
  private ghostHarmonyTrack: GhostChord[] = []; // The harmonic "skeleton"
  
  public navigator: BlueprintNavigator | null = null;

  public introInstrumentMap: Map<InstrumentPart, any> = new Map();


  private bassPhraseLibrary: FractalEvent[][] = [];
  private currentBassPhraseIndex = 0;

  private accompPhraseLibrary: FractalEvent[][] = [];
  private currentAccompPhraseIndex = 0;

  private currentMelodyMotif: FractalEvent[] = [];
  private lastMelodyPlayEpoch: number = -16; // Start with a delay, now 4 bars long

  private bluesChorusCache: { barStart: number, events: FractalEvent[], log: string } | null = null;

  private lastSelectedBluesMelodyId: string | null = null;
  private bluesDrumRiffIndex: number = 0;
  private bluesBassRiffIndex: number = 0;
  

  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed);
    this.nextWeatherEventEpoch = 0;
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
    
    this.bluesDrumRiffIndex = this.random.nextInt(BLUES_DRUM_RIFFS[this.config.mood]?.length ?? 1);
    this.bluesBassRiffIndex = this.random.nextInt(BLUES_BASS_RIFFS[this.config.mood]?.length ?? 1);
    
    this.lastSelectedBluesMelodyId = null;

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
    
    // --- ПЛАН 718: Логика выбора инструментов для интро ---
    this.introInstrumentMap.clear();
    const introPart = this.navigator.blueprint.structure.parts.find(p => p.id.startsWith('INTRO'));
    if (introPart?.introRules) {
        const melodyRules = introPart.instrumentation?.melody;
        if(melodyRules) {
            const melodyChoice = this._chooseInstrumentForPart('melody', initialNavInfo);
            if(melodyChoice) {
                this.introInstrumentMap.set('melody', melodyChoice);
                console.log(`[IntroSetup] Instrument 'melody' randomly assigned to '${melodyChoice}'.`);
            }
        }
        const accompRules = introPart.instrumentation?.accompaniment;
        if(accompRules) {
            const accompChoice = this._chooseInstrumentForPart('accompaniment', initialNavInfo);
            if(accompChoice) {
                this.introInstrumentMap.set('accompaniment', accompChoice);
                console.log(`[IntroSetup] Instrument 'accompaniment' randomly assigned to '${accompChoice}'.`);
            }
        }
    }


    if (this.config.genre === 'blues') {
        // For blues, we don't pre-generate a library, we generate riffs on the fly
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
          // console.log(`[FME @ Bar ${this.epoch}] No specific weighted rules for '${part}'. Using fallback: ${fallback}.`);
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
          // console.log(`[FME @ Bar ${this.epoch}] Selected instrument for '${part}': ${chosen} (from Fallback Engine ${fallbackEngineVersion})`);
          return chosen;
      }
  
      const chosenInstrument = this.performWeightedChoice(options);
      // console.log(`[FME @ Bar ${this.epoch}] Selected instrument for '${part}': ${chosenInstrument} (from Primary Engine ${engineVersion})`);
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

    // Fallback just in case, though it should not be reached with correct weights
    return options[options.length - 1].name;
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

        if (this.config.genre === 'blues') {
            const moodRiffs = BLUES_DRUM_RIFFS[this.config.mood] || BLUES_DRUM_RIFFS['contemplative'];
            if (!moodRiffs || moodRiffs.length === 0) {
                console.warn(`[BluesDrums] No drum riffs found for mood: ${this.config.mood}.`);
                return [];
            }
            
            const pattern = moodRiffs[this.bluesDrumRiffIndex];
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

            // Simple mutation for variety
            if (this.random.next() < 0.3) {
                const mutationType = this.random.nextInt(3);
                if (mutationType === 0 && events.length > 0) {
                    const noteType = this.random.next() > 0.5 ? 'drum_snare_ghost_note' : 'drum_tom_low';
                    events.push({ type: noteType, note: 60, time: (this.random.nextInt(4) * ticksPerBeat + 1) / ticksPerBeat, duration: 1/ticksPerBeat, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: {} });
                } else if (mutationType === 1 && events.length > 0) {
                    const kickEvent = events.find(e => e.type === 'drum_kick');
                    if (kickEvent) kickEvent.time += (this.random.next() - 0.5) * 0.1;
                } else if (mutationType === 2 && events.length > 0) {
                    const hatEvent = events.find(e => e.type === 'drum_hihat_closed');
                    if (hatEvent) hatEvent.weight = Math.min(1.0, hatEvent.weight * 1.2);
                }
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
        const DEGREE_TO_SEMITONE: Record<BluesRiffDegree, number> = { 'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7, 'b6': 8, '6': 9, 'b7': 10, '9': 14, '11': 17, 'R+8': 12 };

        const moodRiffs = BLUES_BASS_RIFFS[mood];
        if (!moodRiffs || moodRiffs.length === 0) {
            console.warn(`[BluesBass] No bass riffs found for mood: ${mood}.`);
            return [];
        }
        
        const riffTemplate = moodRiffs[this.bluesBassRiffIndex];

        // Определяем ступень аккорда
        const rootI = 0; // Simplified
        const step = (root - rootI + 12) % 12;
        const isTurnaround = false; // Simplified
        
        let pattern = riffTemplate.I; // Simplified to always use 'I' for now

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

    public generateBluesMelodyChorus(chorusChords: GhostChord[], mood: Mood, random: { next: () => number, nextInt: (max: number) => number }, registerHint?: 'low' | 'mid' | 'high'): { events: FractalEvent[], log: string } {
        const baseEvents: FractalEvent[] = [];
        
        let suitableMelodies = BLUES_MELODY_RIFFS.filter(m => m.moods.includes(mood) && m.id !== this.lastSelectedBluesMelodyId);
        
        if (suitableMelodies.length === 0) {
            suitableMelodies = BLUES_MELODY_RIFFS.filter(m => m.moods.includes(mood));
        }
        
        if (suitableMelodies.length === 0) {
            console.warn(`[BluesMelodyChorus] No suitable melodies found for mood: ${mood}. Falling back to all.`);
            suitableMelodies.push(...BLUES_MELODY_RIFFS.filter(m => m.id !== this.lastSelectedBluesMelodyId));
            if(suitableMelodies.length === 0) suitableMelodies.push(...BLUES_MELODY_RIFFS);
        }
        const selectedMelody = suitableMelodies[random.nextInt(suitableMelodies.length)] || BLUES_MELODY_RIFFS[0];
        this.lastSelectedBluesMelodyId = selectedMelody.id;
        
        const barDurationInBeats = 4;
        const ticksPerBeat = 3;
        
        let octaveShift = 12 * 2;
        if (registerHint === 'mid') octaveShift = 12 * 3;
        if (registerHint === 'high') octaveShift = 12 * 4;

        const DEGREE_TO_SEMITONE: Record<BluesRiffDegree, number> = { 'R': 0, 'b2': 1, '2': 2, 'b3': 3, '3': 4, '4': 5, '#4': 6, 'b5': 6, '5': 7, 'b6': 8, '6': 9, 'b7': 10, '9': 14, '11': 17, 'R+8': 12 };

        for (let barIndex = 0; barIndex < 12; barIndex++) {
            const absoluteBar = (chorusChords[0]?.bar ?? 0) + barIndex;
            const barChord = chorusChords.find(c => absoluteBar >= c.bar && absoluteBar < (c.bar + c.durationBars));

            if (!barChord) {
                console.warn(`[BluesMelodyChorus] No chord found for bar ${barIndex} (absolute: ${absoluteBar}).`);
                continue;
            };

            const chordRoot = barChord.rootNote;
            let phrase: BluesMelodyPhrase;

            const rootI = chorusChords.find(c=>c.bar % 12 === 0)?.rootNote || chordRoot;
            const step = (chordRoot - rootI + 12) % 12;
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
                baseEvents.push({
                    type: 'melody',
                    note: noteMidi,
                    time: (barIndex * barDurationInBeats) + (event.t / ticksPerBeat),
                    duration: event.d / ticksPerBeat,
                    weight: 0.85,
                    technique: 'pick', 
                    dynamics: 'f',
                    phrasing: 'legato',
                    params: {}
                });
            }
        }

        const shouldMutate = random.next() < 0.7; // Increased mutation chance
        let mutationLog = "None";
        let mutatedEvents = baseEvents; 

        if (shouldMutate && baseEvents.length > 0) {
            mutatedEvents = JSON.parse(JSON.stringify(baseEvents)); // Deep copy for mutation
            const mutationType = random.nextInt(3);
            if (mutationType === 0) {
                mutationLog = "Rhythmic Shift";
                mutatedEvents.forEach(e => { e.time += (random.next() - 0.5) * 0.25; });
            } else if (mutationType === 1) {
                mutationLog = "Register Shift";
                const eventOctaveShift = (random.next() > 0.5) ? 12 : -12;
                mutatedEvents.forEach(e => { e.note += eventOctaveShift; });
            } else { 
                mutationLog = "Note Removal";
                if(mutatedEvents.length > 5) {
                    const indexToRemove = random.nextInt(mutatedEvents.length);
                    mutatedEvents.splice(indexToRemove, 1);
                }
            }
        }

        const log = `Using riff: "${selectedMelody.id}". Mutation: "${mutationLog}". Register: ${registerHint || 'default'}`;
        
        return { events: mutatedEvents, log };
    }

  public getGhostHarmony(): GhostChord[] {
      return this.ghostHarmonyTrack;
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
            
            if (barInChorus === 0 || !this.bluesChorusCache || this.bluesChorusCache.barStart !== (this.epoch - barInChorus)) {
                const chorusBarStart = this.epoch - barInChorus;
                const chorusChords = this.ghostHarmonyTrack.filter(c => c.bar >= chorusBarStart && c.bar < chorusBarStart + 12);
                if (chorusChords.length > 0) {
                    this.bluesChorusCache = {
                        barStart: chorusBarStart,
                        ...this.generateBluesMelodyChorus(chorusChords, this.config.mood, this.random, registerHint)
                    };
                     console.log(`%c[BluesMelody] Generated new 12-bar chorus starting at bar ${chorusBarStart}. ${this.bluesChorusCache.log}`, 'color: #00BCD4');
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
      const harmonyRules = navInfo?.currentPart.instrumentation?.harmony;
      const chosenHarmonyInstrument = harmonyRules ? chooseHarmonyInstrument(harmonyRules, this.random) : 'piano';

      const instrumentHints: InstrumentHints = {
          accompaniment: this._chooseInstrumentForPart('accompaniment', this.navigator.tick(this.epoch)),
          melody: this._chooseInstrumentForPart('melody', this.navigator.tick(this.epoch)),
          harmony: chosenHarmonyInstrument,
      };
      
      const navigationInfo = this.navigator.tick(this.epoch, instrumentHints.melody);
      
      if (navigationInfo?.logMessage) {
        console.log(navigationInfo.logMessage, 'color: #DA70D6');
      }

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
