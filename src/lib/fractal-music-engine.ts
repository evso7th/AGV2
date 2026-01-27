

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, IntroRules, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree, SuiteDNA, RhythmicFeel, BassStyle, DrumStyle } from './fractal';
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

import { getScaleForMood, generateSuiteDNA, createDrumAxiom, createAmbientBassAxiom, createAccompanimentAxiom, createHarmonyAxiom, createMelodyMotif as createAmbientMelodyMotif, mutateBassPhrase, createBassFill, createDrumFill, chooseHarmonyInstrument, DEGREE_TO_SEMITONE, mutateBluesAccompaniment, mutateBluesMelody, createBluesOrganLick, generateIntroSequence } from './music-theory';


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
  
  private suiteDNA: SuiteDNA | null = null; // The harmonic "skeleton"
  
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

  private bluesChorusCache: { barStart: number, events: FractalEvent[], log: string } | null = null;

  // "Конвейеры" для уникальности
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
  private soloPlanHistory: Map<string, string> = new Map();

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
      
      if(moodOrGenreChanged || introBarsChanged || seedChanged) {
          console.log(`[FME] Config changed requiring re-initialization. Mood: ${this.config.mood}, Intro: ${this.config.introBars}`);
          await this.initialize(true);
      }
  }

  public async initialize(force: boolean = false) {
    if (this.isInitialized && !force) {
        return;
    }

    console.log(`%c[FME.initialize] Using SEED: ${this.config.seed} to create random generator.`, 'color: #FFD700;');
    this.random = seededRandom(this.config.seed);

    this.nextWeatherEventEpoch = this.random.nextInt(12) + 8;
    this.lastAccompanimentEndTime = -Infinity;
    this.nextAccompanimentDelay = this.random.next() * 7 + 5;
    this.hasBassBeenMutated = false;
    this.bluesChorusCache = null;
    
    // #ЗАЧЕМ: Гарантирует уникальность риффов для каждой новой сюиты.
    // #ЧТО: При каждой инициализации создаются новые "перетасованные" плейлисты риффов.
    const allBassRiffs = Object.values(BLUES_BASS_RIFFS).flat();
    this.shuffledBassRiffIndices = this.random.shuffle(Array.from({ length: allBassRiffs.length }, (_, i) => i));
    this.bassRiffConveyorIndex = 0;

    const allDrumRiffs = Object.values(BLUES_DRUM_RIFFS).flat();
    this.shuffledDrumRiffIndices = this.random.shuffle(Array.from({ length: allDrumRiffs.length }, (_, i) => i));
    this.drumRiffConveyorIndex = 0;
    
    this.shuffledGuitarRiffIDs = this.random.shuffle(BLUES_GUITAR_RIFFS.map(r => r.id));
    this.guitarRiffConveyorIndex = 0;
    
    // Установка стартовых риффов
    this.currentBassRiffIndex = this.shuffledBassRiffIndices[this.bassRiffConveyorIndex++] ?? 0;
    this.currentDrumRiffIndex = this.shuffledDrumRiffIndices[this.drumRiffConveyorIndex++] ?? 0;
    this.currentGuitarRiffId = this.shuffledGuitarRiffIDs[this.guitarRiffConveyorIndex++] ?? null;
    
    console.log(`%c[FME.initialize] New Suite Seeded! Base Riffs -> Bass: ${this.currentBassRiffIndex}, Drums: ${this.currentDrumRiffIndex}, Guitar: ${this.currentGuitarRiffId}`, 'color: cyan; font-weight: bold;');


    const blueprint = await getBlueprint(this.config.genre, this.config.mood);
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars);
    
    this.suiteDNA = generateSuiteDNA(
        this.navigator.totalBars,
        this.config.mood,
        this.config.seed,
        this.random,
        this.config.genre,
        this.navigator.blueprint.structure.parts // Передаем части для создания карты соло
    );
    
    if (!this.suiteDNA || this.suiteDNA.harmonyTrack.length === 0) {
      throw new Error("[Engine] CRITICAL ERROR: Could not generate 'Suite DNA'. Music is not possible.");
    }
    
    this.config.tempo = this.suiteDNA.baseTempo;

    this.bassPhraseLibrary = [];
    this.currentBassPhraseIndex = 0;
    this.accompPhraseLibrary = [];
    this.currentAccompPhraseIndex = 0;
    
    this.introInstrumentOrder = [];
    const introPart = this.navigator.blueprint.structure.parts.find(p => p.id.startsWith('prolog'));
    if (introPart?.introRules) {
        this.introInstrumentOrder = this.random.shuffle([...introPart.introRules.instrumentPool]);
    }

    const firstChord = this.suiteDNA.harmonyTrack[0];
    const initialNavInfo = this.navigator.tick(0);
    const initialRegisterHint = initialNavInfo?.currentPart.instrumentRules?.accompaniment?.register?.preferred;
    const initialBassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';

    if (this.config.genre === 'blues') {
        // Blues logic will be handled within generateOneBar
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
    this.isInitialized = true;
  }
  
  private _chooseInstrumentForPart(
    part: InstrumentPart,
    navInfo: NavigationInfo | null
  ): MelodyInstrument | AccompanimentInstrument | 'piano' | 'guitarChords' | 'flute' | 'violin' | undefined {
    const rules = navInfo?.currentPart.instrumentation?.[part as keyof typeof navInfo.currentPart.instrumentation];
    if (!rules || rules.strategy !== 'weighted') {
        return undefined;
    }

    let options: any[] | undefined;

    if (part === 'bass') {
        const useV2 = this.config.useMelodyV2;
        options = useV2 ? (rules as InstrumentationRules<BassInstrument>).v2Options : (rules as InstrumentationRules<BassInstrument>).v1Options;
        
        if (!options || options.length === 0) {
             console.warn(`[FME] No ${useV2 ? 'v2' : 'v1'}Options for bass, falling back to other version.`);
             options = useV2 ? (rules as InstrumentationRules<BassInstrument>).v1Options : (rules as InstrumentationRules<BassInstrument>).v2Options;
        }
    } 
    else if (part === 'melody' || part === 'accompaniment') {
        const useV2 = this.config.useMelodyV2;
        options = useV2 ? rules.v2Options : rules.v1Options;

        if (!options || options.length === 0) {
            console.warn(`[FME] No ${useV2 ? 'v2' : 'v1'}Options for ${part}, falling back to other version.`);
            options = useV2 ? rules.v1Options : rules.v2Options;
        }
    } 
    else if (part === 'harmony') {
        options = (rules as InstrumentationRules<'piano' | 'guitarChords' | 'flute' | 'violin'>).options;
    }

    if (!options || options.length === 0) {
        return undefined;
    }
    
    return this._performWeightedChoice(options);
  }
  
  private _performWeightedChoice(options: {name: any, weight: number}[]): any {
    if (!options || options.length === 0) return undefined;
    const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
    if (totalWeight <= 0) return options[0]?.name;

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
        
        if (!baseKit) return [];
    
        const finalKit: DrumKit = JSON.parse(JSON.stringify(baseKit));
        
        if (overrides) {
            if (overrides.add) {
                overrides.add.forEach(instrument => {
                    Object.keys(finalKit).forEach(part => {
                        const key = part as keyof DrumKit;
                        if (instrument.includes(key.slice(0, -1))) { 
                           if(finalKit[key] && !finalKit[key].includes(instrument)) {
                                finalKit[key].push(instrument);
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

    private generateBluesBassRiff(chord: GhostChord, technique: Technique, random: { next: () => number, nextInt: (max: number) => number }, mood: Mood): FractalEvent[] {
        const phrase: FractalEvent[] = [];
        const root = chord.rootNote;
        const barDurationInBeats = 4.0;
        const ticksPerBeat = 3;
        
        const allBassRiffs = BLUES_BASS_RIFFS[mood] ?? BLUES_BASS_RIFFS['contemplative'];
        if (!allBassRiffs || allBassRiffs.length === 0) return [];
        
        const riffTemplate = allBassRiffs[this.currentBassRiffIndex % allBassRiffs.length];

        const barInChorus = this.epoch % 12;
        const rootOfChorus = this.suiteDNA!.harmonyTrack.find(c => c.bar === (this.epoch - barInChorus))?.rootNote ?? root;
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
      return this.suiteDNA?.harmonyTrack || [];
  }
  
    private generateBluesMelodyChorus(
        chorusChords: GhostChord[],
        mood: Mood,
        random: { next: () => number; nextInt: (max: number) => number; },
        isSoloSection: boolean,
        chorusIndex: number,
        partId: string,
        registerHint?: 'low' | 'mid' | 'high'
    ): { events: FractalEvent[], log: string } {

        const finalEvents: FractalEvent[] = [];
        const barDurationInBeats = 4.0;
        const ticksPerBeat = 3;
        let logMessage = "";
        
        let soloPlanName = this.suiteDNA?.soloPlanMap.get(partId);

        if (!soloPlanName) {
            console.error(`[FME] No solo plan found in DNA for partId: ${partId}. Returning empty.`);
            return { events: [], log: `No solo plan for partId ${partId}`};
        }

        logMessage = `[FME] Solo section ${partId}. Using plan "${soloPlanName}".`;
        const soloPlan = BLUES_SOLO_PLANS[soloPlanName];

        if (!soloPlan || chorusIndex >= soloPlan.choruses.length) {
            logMessage += ` | Plan "${soloPlanName}" or chorus index ${chorusIndex} out of bounds.`;
            console.warn(logMessage);
            return { events: [], log: logMessage };
        }

        const currentChorusPlan = soloPlan.choruses[chorusIndex % soloPlan.choruses.length];
        logMessage += ` | Assembling solo chorus ${chorusIndex + 1}.`;

        for (let barIndex = 0; barIndex < 12; barIndex++) {
            const lickIdWithModifiers = currentChorusPlan[barIndex];
            const [lickId, ...modifiers] = lickIdWithModifiers.split('+');

            const lickTemplate = BLUES_SOLO_LICKS[lickId];
            const currentChord = chorusChords.find(c => c.bar % 12 === barIndex);

            if (!lickTemplate || !currentChord) continue;

            let phraseEvents: BluesSoloPhrase = JSON.parse(JSON.stringify(lickTemplate));

            let octaveShift = 12 * (registerHint === 'high' ? 4 : 3);
            if (modifiers.includes('oct') || modifiers.includes('hi')) {
                octaveShift += 12;
            }

            if (modifiers.includes('long')) {
                const lastNote = phraseEvents[phraseEvents.length - 1];
                if (lastNote) {
                    lastNote.d = (lastNote.d || 2) * 1.5;
                }
            }

            if (modifiers.includes('var') && phraseEvents.length > 1) {
                const i = random.nextInt(phraseEvents.length - 1);
                const tempTime = phraseEvents[i].t;
                phraseEvents[i].t = phraseEvents[i + 1].t;
                phraseEvents[i + 1].t = tempTime;
                phraseEvents.sort((a, b) => a.t - b.t);
            }

            for (const noteTemplate of phraseEvents) {
                let finalMidiNote = currentChord.rootNote + (DEGREE_TO_SEMITONE[noteTemplate.deg as BluesRiffDegree] || 0) + octaveShift;
                if (finalMidiNote > 84) finalMidiNote -= 12;
                if (finalMidiNote < 52) finalMidiNote += 12;
                
                const event: FractalEvent = {
                    type: 'melody',
                    note: finalMidiNote,
                    time: (barIndex * barDurationInBeats) + (noteTemplate.t / ticksPerBeat),
                    duration: ((noteTemplate.d || 2) / ticksPerBeat),
                    weight: 0.9,
                    technique: (noteTemplate.tech as Technique) || 'pick',
                    dynamics: 'f', phrasing: 'legato', params: {}
                };
                finalEvents.push(event);
            }
        }
        
        return { events: finalEvents, log: logMessage };
    }

    private generateBluesAccompanimentV2(chord: GhostChord, melodyEvents: FractalEvent[], drumEvents: FractalEvent[], random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
        // #ИСПРАВЛЕНО (ПЛАН 1562): Логика "джема" полностью удалена.
        // #ЗАЧЕМ: Предыдущая реализация была нестабильной и создавала хаос.
        // #ЧТО: Теперь аккомпанемент просто играет поддерживающие аккорды, обеспечивая
        //       надежную и предсказуемую гармоническую основу.
        return createAccompanimentAxiom(chord, this.config.mood, this.config.genre, this.random, this.config.tempo, 'low');
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

      const navigationInfo = this.navigator.tick(this.epoch);

      if (!navigationInfo) {
          console.warn(`[FME] Navigator returned null for bar ${this.epoch}. Returning empty events.`);
          return { events: [], instrumentHints: {} };
      }

      const instrumentHints: InstrumentHints = {
          melody: this._chooseInstrumentForPart('melody', navigationInfo),
          accompaniment: this._chooseInstrumentForPart('accompaniment', navigationInfo),
          harmony: this._chooseInstrumentForPart('harmony', navigationInfo) as any,
          bass: this._chooseInstrumentForPart('bass', navigationInfo) as any,
      };

      console.log(`InstrumentLog: [1. Composer] Generated hints for bar ${this.epoch}: Melody=${instrumentHints.melody}, Bass=${instrumentHints.bass}`);

      const { events } = this.generateOneBar(barDuration, navigationInfo, instrumentHints);
      
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
         events.push({ type: 'sparkle', note: 72, time: 0.5, duration: 1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: {mood: this.config.mood, genre: this.config.genre, category: 'promenade'}});
         events.push({ type: 'sfx', note: 60, time: 2.5, duration: 2, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { mood: this.config.mood, genre: this.config.genre, category: 'promenade' } });
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
    
    if (!this.suiteDNA) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: SuiteDNA is not initialized.`);
        return { events: [], instrumentHints: {} };
    }

    const currentChord = this.suiteDNA.harmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return { events: [], instrumentHints };
    }
    
    // #ЗАЧЕМ: Реализует "Конвейер Грува".
    // #ЧТО: Каждые 12 тактов для блюза выбирается СЛЕДУЮЩИЙ рифф из "перетасованного" списка.
    if (this.config.genre === 'blues' && this.epoch > 0 && this.epoch % 12 === 0) {
        this.drumRiffConveyorIndex = (this.drumRiffConveyorIndex + 1) % this.shuffledDrumRiffIndices.length;
        this.currentDrumRiffIndex = this.shuffledDrumRiffIndices[this.drumRiffConveyorIndex];
        console.log(`%c[FME Blues] New 12-bar chorus. Switched to Drum Riff index: ${this.currentDrumRiffIndex}`, 'color: #00FFFF');

        this.bassRiffConveyorIndex = (this.bassRiffConveyorIndex + 1) % this.shuffledBassRiffIndices.length;
        this.currentBassRiffIndex = this.shuffledBassRiffIndices[this.bassRiffConveyorIndex];
        console.log(`%c[FME Blues] New 12-bar chorus. Switched to Bass Riff index: ${this.currentBassRiffIndex}`, 'color: #00FFFF');
    }


    const drumEvents = this.generateDrumEvents(navInfo) || [];

    let melodyEvents: FractalEvent[] = [];
    const melodyRules = navInfo.currentPart.instrumentRules?.melody;

    if (navInfo.currentPart.layers.melody && !navInfo.currentPart.accompanimentMelodyDouble?.enabled && melodyRules) {
        if (this.config.genre === 'blues') {
            const barInChorus = this.epoch % 12;
            const chorusIndex = Math.floor((this.epoch % 36) / 12);
            const partId = navInfo.currentPart.id;

            if (barInChorus === 0 || !this.bluesChorusCache || this.bluesChorusCache.barStart !== (this.epoch - barInChorus)) {
                const chorusBarStart = this.epoch - barInChorus;
                const chorusChords = this.suiteDNA.harmonyTrack.filter(c => c.bar >= chorusBarStart && c.bar < chorusBarStart + 12);
                if (chorusChords.length > 0) {
                    this.bluesChorusCache = this.generateBluesMelodyChorus(chorusChords, this.config.mood, this.random, partId.includes('SOLO'), chorusIndex, partId, melodyRules.register?.preferred);
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
            // #ИСПРАВЛЕНО (ПЛАН 1562): Мелодия генерируется КАЖДЫЙ такт.
            this.currentMelodyMotif = createAmbientMelodyMotif(currentChord, this.config.mood, this.random, this.currentMelodyMotif, melodyRules.register?.preferred, this.config.genre);
            melodyEvents = this.currentMelodyMotif;
        }
    }


    let accompEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.accompaniment) {
        // #ЗАЧЕМ: Упрощение. Удалена сложная логика "джема".
        // #ЧТО: Аккомпанемент теперь всегда генерирует базовую гармоническую поддержку.
        const registerHint = navInfo.currentPart.instrumentRules?.accompaniment?.register?.preferred;
        accompEvents = createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint);
    }
    
    this.wasMelodyPlayingLastBar = melodyEvents.length > 0;

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
function createMelodyMotif(chord: GhostChord, mood: Mood, random: { next: () => number; nextInt: (max: number) => number; }, previousMotif?: FractalEvent[], registerHint?: 'low' | 'mid' | 'high', genre?: Genre): FractalEvent[] {
    const motif: FractalEvent[] = [];
    
    // #ИСПРАВЛЕНО (ПЛАН 1562): Убрана логика "переиспользования" мотива.
    // #ЗАЧЕМ: Это заставляет движок генерировать новую мелодию каждый такт, устраняя монотонность.
    
    const scale = getScaleForMood(mood, genre);
    let baseOctave = 4;
    if (registerHint === 'high') baseOctave = 5;
    if (registerHint === 'low') baseOctave = 3;
    
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
            weight: 0.7, 
            technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
        });
        currentTime += durations[i];
    }
    return motif;
}
