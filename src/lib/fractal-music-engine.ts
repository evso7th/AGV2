
import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord, SfxRule, V1MelodyInstrument, V2MelodyInstrument, BlueprintPart, InstrumentationRules, InstrumentBehaviorRules, BluesMelody, InstrumentPart, DrumKit, BluesGuitarRiff, BluesSoloPhrase, BluesRiffDegree, SuiteDNA, RhythmicFeel, BassStyle, DrumStyle, HarmonicCenter } from './fractal';
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

import { getScaleForMood, generateSuiteDNA, createDrumAxiom, createHarmonyAxiom, createAmbientMelodyMotif, mutateBassPhrase, createBassFill, createDrumFill, chooseHarmonyInstrument, DEGREE_TO_SEMITONE, mutateBluesAccompaniment, mutateBluesMelody, createBluesOrganLick, generateIntroSequence, createAmbientBassAxiom } from './music-theory';


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
  public random: { next: () => number; nextInt: (max: number) => number; shuffle: <T>(array: T[]) => T[]; };
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
  private cachedMelodyChorus: { bar: number, events: FractalEvent[] } = { bar: -1, events: [] };


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
    const initialNavInfo = this.navigator.tick(0);
    const initialBassTechnique = initialNavInfo?.currentPart.instrumentRules?.bass?.techniques?.[0].value as Technique || 'drone';

    if (this.config.genre === 'blues') {
        // Blues logic will be handled within generateOneBar
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
    
    private generateBluesMelodyChorus(
        currentChord: GhostChord,
        random: { next: () => number; nextInt: (max: number) => number; },
        partId: string,
        epoch: number,
        registerHint?: 'low' | 'mid' | 'high'
    ): { events: FractalEvent[], log: string } {
        const events: FractalEvent[] = [];
        let log: string[] = [];

        const barInChorus = epoch % 12;
        if (barInChorus === 0 || this.cachedMelodyChorus.bar === -1) {
            this.cachedMelodyChorus.events = [];
            this.cachedMelodyChorus.bar = epoch;
            let fullChorusLog = "[BluesComposer] New 12-bar chorus: ";

            for (let bar = 0; bar < 12; bar++) {
                const chordForThisBar = this.suiteDNA!.harmonyTrack.find(c => (epoch + bar) >= c.bar && (epoch + bar) < c.bar + c.durationBars) || currentChord;
                
                const isMinorChord = chordForThisBar.chordType.includes('minor');
                
                const availableLicks = Object.keys(BLUES_SOLO_LICKS).filter(id => {
                    const tags = BLUES_SOLO_LICKS[id].tags;
                    if (this.melodyHistory.slice(-5).includes(id)) return false;
                    
                    if (!isMinorChord) {
                        return tags.includes('major') || tags.includes('classic') || tags.includes('boogie');
                    } else {
                        return tags.includes('minor') || tags.includes('classic') || tags.includes('chromatic') || tags.includes('cry');
                    }
                });

                const lickId = availableLicks.length > 0 ? availableLicks[random.nextInt(availableLicks.length)] : Object.keys(BLUES_SOLO_LICKS)[0];
                
                if (lickId) {
                    this.melodyHistory.push(lickId);
                    if(this.melodyHistory.length > 6) this.melodyHistory.shift();

                    const lickTemplate = BLUES_SOLO_LICKS[lickId].phrase;
                    
                    let octaveShift = 12 * (registerHint === 'high' ? 4 : (registerHint === 'low' ? 2 : 3));
                    for (const noteTemplate of lickTemplate) {
                        let finalMidiNote = chordForThisBar.rootNote + (DEGREE_TO_SEMITONE[noteTemplate.deg as BluesRiffDegree] || 0) + octaveShift;
                        if (finalMidiNote > 88) finalMidiNote -= 12;
                        if (finalMidiNote < 55) finalMidiNote += 12;

                        const baseEvent: Omit<FractalEvent, 'time' | 'duration'> = {
                            type: 'melody',
                            note: finalMidiNote,
                            weight: 0.9 + (random.next() * 0.1),
                            technique: (noteTemplate.tech || 'pick') as Technique,
                            dynamics: 'mf', phrasing: 'legato', params: {}
                        };

                        if (random.next() < 0.4) {
                            const shouldShiftTime = random.next() > 0.5;
                            if (shouldShiftTime && noteTemplate.d && noteTemplate.d > 1) {
                                const shift = (random.next() - 0.5) * 0.5;
                                this.cachedMelodyChorus.events.push({
                                    ...baseEvent,
                                    time: bar * 4 + (noteTemplate.t / 3) + (shift / 3),
                                    duration: ((noteTemplate.d || 2) / 3),
                                });
                            } else {
                                const graceNote: FractalEvent = {
                                    ...baseEvent,
                                    note: finalMidiNote - 1,
                                    time: bar * 4 + (noteTemplate.t / 3) - (0.5 / 3),
                                    duration: 0.1,
                                    weight: baseEvent.weight * 0.7,
                                    technique: 'gr'
                                };
                                this.cachedMelodyChorus.events.push(graceNote);
                                this.cachedMelodyChorus.events.push({
                                    ...baseEvent,
                                    time: bar * 4 + (noteTemplate.t / 3),
                                    duration: ((noteTemplate.d || 2) / 3),
                                });
                            }
                        } else {
                            this.cachedMelodyChorus.events.push({
                                ...baseEvent,
                                time: bar * 4 + (noteTemplate.t / 3),
                                duration: ((noteTemplate.d || 2) / 3),
                            });
                        }
                    }
                    fullChorusLog += `${lickId}, `;
                }
            }
            console.log(fullChorusLog);
        }

        const barStartTimeInBeats = barInChorus * 4;
        const barEndTimeInBeats = barStartTimeInBeats + 4;
        
        const currentBarEvents = this.cachedMelodyChorus.events.filter(e => {
            const eventTimeInChorus = e.time - ((this.cachedMelodyChorus.bar % 12) * 4);
            return eventTimeInChorus >= barStartTimeInBeats && eventTimeInChorus < barEndTimeInBeats;
        }).map(e => ({
            ...e,
            time: e.time - barStartTimeInBeats 
        }));

        log.push(`[BluesMelody] Bar ${barInChorus}, Lick from cache. Events: ${currentBarEvents.length}`);

        return { events: currentBarEvents, log: log.join(' ') };
    }


  public getGhostHarmony(): GhostChord[] {
      return this.suiteDNA?.harmonyTrack || [];
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
    
    const navInfo = this.navigator.tick(this.epoch);

    if (!navInfo) {
        console.warn(`[FME] Navigator returned null for bar ${this.epoch}. Returning empty events.`);
        return { events: [], instrumentHints: {} };
    }

    const instrumentHints: InstrumentHints = {
        melody: this._chooseInstrumentForPart('melody', navInfo),
        accompaniment: this._chooseInstrumentForPart('accompaniment', navInfo),
        harmony: this._chooseInstrumentForPart('harmony', navInfo) as any,
        bass: this._chooseInstrumentForPart('bass', navInfo) as any,
        pianoAccompaniment: 'piano'
    };
    
    if (navInfo.logMessage) {
        const fullLog = this.navigator.formatLogMessage(navInfo, instrumentHints, this.epoch);
        if (fullLog) {
            console.log(fullLog);
        }
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
    
    if (!options || options.length === 0) {
        const fallbackOptions = (rules as any).v1Options || (rules as any).options;
        if(!fallbackOptions || fallbackOptions.length === 0) return 'none';
        
        const totalFallbackWeight = fallbackOptions.reduce((sum: number, item: any) => sum + item.weight, 0);
        if (totalFallbackWeight <= 0 && fallbackOptions.length > 0) return fallbackOptions[0].name;
        if (totalFallbackWeight <= 0) return 'none';

        let randFallback = this.random.next() * totalFallbackWeight;
        for (const item of fallbackOptions) {
            randFallback -= item.weight;
            if (randFallback <= 0) return item.name;
        }
        return fallbackOptions[fallbackOptions.length - 1].name;
    }

    const totalWeight = options.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0 && options.length > 0) return options[0].name;
    if (totalWeight <= 0) return 'none';

    let rand = this.random.next() * totalWeight;
    for (const item of options) {
        rand -= item.weight;
        if (rand <= 0) return item.name;
    }

    return options[options.length - 1].name;
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
  
  // --- Основная функция генерации на один такт ---
  private generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): { events: FractalEvent[] } {
    const effectiveBar = this.epoch;
    
    if (!this.suiteDNA) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: SuiteDNA is not initialized.`);
        return { events: [] };
    }

    const currentChord = this.suiteDNA.harmonyTrack.find(chord => 
        effectiveBar >= chord.bar && effectiveBar < chord.bar + chord.durationBars
    );

    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return { events: [] };
    }
    
    if (this.config.genre === 'blues' && this.epoch > 0 && this.epoch % 12 === 0) {
        this.drumRiffConveyorIndex = (this.drumRiffConveyorIndex + 1) % this.shuffledDrumRiffIndices.length;
        this.currentDrumRiffIndex = this.shuffledDrumRiffIndices[this.drumRiffConveyorIndex];

        this.bassRiffConveyorIndex = (this.bassRiffConveyorIndex + 1) % this.shuffledBassRiffIndices.length;
        this.currentBassRiffIndex = this.shuffledBassRiffIndices[this.bassRiffConveyorIndex];
    }


    const drumEvents = this.generateDrumEvents(navInfo) || [];

    let melodyEvents: FractalEvent[] = [];
    const melodyRules = navInfo.currentPart.instrumentRules?.melody;

    if (navInfo.currentPart.layers.melody && !navInfo.currentPart.accompanimentMelodyDouble?.enabled && melodyRules) {
        if (melodyRules.source === 'blues_solo') {
            const { events: soloEvents } = this.generateBluesMelodyChorus(currentChord, this.random, navInfo.currentPart.id, this.epoch, melodyRules.register?.preferred);
            melodyEvents = soloEvents;
        } else if (melodyRules.source === 'motif') {
            this.currentMelodyMotif = createAmbientMelodyMotif(currentChord, this.config.mood, this.random, this.currentMelodyMotif, melodyRules.register?.preferred, this.config.genre);
            melodyEvents = this.currentMelodyMotif;
        }
    }


    let accompEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.accompaniment) {
        const accompRules = navInfo.currentPart.instrumentRules?.accompaniment;
        const registerHint = accompRules?.register?.preferred;
        const technique = (accompRules?.techniques?.[0]?.value || 'long-chords') as AccompanimentTechnique;
        accompEvents = this.createAccompanimentAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, registerHint, technique);
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
        const harmonyAxiom = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random, effectiveBar);
        harmonyEvents.push(...harmonyAxiom);
    }
    
    let pianoEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.pianoAccompaniment) {
        const pianoAxiom = this.createPianoAccompaniment(currentChord, this.random);
        pianoEvents.push(...pianoAxiom);
    }

    let bassEvents: FractalEvent[] = [];
    if (navInfo.currentPart.layers.bass) {
      if (this.config.genre === 'blues') {
          bassEvents = this.generateBluesBassRiff(currentChord, 'riff', this.random, this.config.mood);
      } else {
          if (this.epoch > 0 && this.epoch % 4 === 0) {
              this.currentBassPhraseIndex = (this.currentBassPhraseIndex + 1) % this.bassPhraseLibrary.length;
              if (this.random.next() < 0.6) {
                  this.bassPhraseLibrary[this.currentBassPhraseIndex] = mutateBassPhrase(this.bassPhraseLibrary[this.currentBassPhraseIndex]!, currentChord, this.config.mood, this.config.genre, this.random);
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

    const allEvents = [...(bassEvents || []), ...(drumEvents || []), ...(accompEvents || []), ...(melodyEvents || []), ...(harmonyEvents || []), ...(pianoEvents || [])];
    allEvents.forEach(e => {
        if (!e.params) e.params = {};
        (e.params as any).barCount = effectiveBar;
    });
    
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
    
    return { events: allEvents };
  }

  private createAccompanimentAxiom(chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number; nextInt: (max: number) => number; }, tempo: number, registerHint: 'low' | 'mid' | 'high' = 'mid', technique: AccompanimentTechnique): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const rootMidi = chord.rootNote;
    
    let chordNotes: number[] = [];
    if (chord.chordType === 'dominant') {
        chordNotes = [rootMidi, rootMidi + 4, rootMidi + 7, rootMidi + 10];
    } else {
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        chordNotes = [rootMidi, rootMidi + (isMinor ? 3 : 4), rootMidi + 7];
    }
    
    let baseOctave = 3;
    if (registerHint === 'low') baseOctave = 2;
    if (registerHint === 'high') baseOctave = 4;

    switch (technique) {
        case 'rhythmic-comp':
            const times = [0, 1.5, 2.5, 3.5]; // Example rhythmic stabs
            times.forEach(time => {
                if (random.next() < 0.6) {
                    axiom.push({
                        type: 'accompaniment',
                        note: chordNotes[random.nextInt(chordNotes.length)] + 12 * baseOctave,
                        duration: 0.4,
                        time: time,
                        weight: 0.5 + random.next() * 0.2,
                        technique: 'staccato', dynamics: 'mf', phrasing: 'detached',
                        params: {}
                    });
                }
            });
            break;
        
        case 'arpeggio-slow':
            const arpNotes = [chordNotes[0], chordNotes[1], chordNotes[2], chordNotes[1] + 12];
            arpNotes.forEach((note, i) => {
                axiom.push({
                    type: 'accompaniment',
                    note: note + 12 * baseOctave,
                    duration: 1.5,
                    time: i * 1.0,
                    weight: 0.5,
                    technique: 'arpeggio-slow', dynamics: 'p', phrasing: 'legato',
                    params: { attack: 0.1, release: 1.4 }
                });
            });
            break;
            
        case 'long-chords':
        default:
            chordNotes.slice(0, 3).forEach((note, i) => {
                axiom.push({
                    type: 'accompaniment',
                    note: note + 12 * baseOctave,
                    duration: 4.0,
                    time: i * 0.05, // Slight "strum"
                    weight: 0.6 - (i * 0.1),
                    technique: 'choral', dynamics: 'mp', phrasing: 'legato',
                    params: { attack: 0.8, release: 3.2 }
                });
            });
            break;
    }

    return axiom;
  }
  
  private createPianoAccompaniment(chord: GhostChord, random: { next: () => number; nextInt: (max: number) => number; }): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const rootNote = chord.rootNote;
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const octaveShift = 24; // +2 octaves

    // Left hand - bass note
    axiom.push({
        type: 'pianoAccompaniment',
        note: rootNote - 12 + octaveShift,
        duration: 2.0, // Half note
        time: 0,
        weight: 0.6,
        technique: 'pluck', dynamics: 'p', phrasing: 'legato',
        params: {}
    });

    if (random.next() > 0.5) {
         axiom.push({
            type: 'pianoAccompaniment',
            note: rootNote - 5 + octaveShift,
            duration: 2.0, // Half note
            time: 2.0,
            weight: 0.55,
            technique: 'pluck', dynamics: 'p', phrasing: 'legato',
            params: {}
        });
    }

    // Right hand - arpeggio
    const chordNotes = [
        rootNote,
        rootNote + (isMinor ? 3 : 4),
        rootNote + 7,
        rootNote + 12
    ];
    
    const arpTimes = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
    arpTimes.forEach(time => {
        if(random.next() < 0.6) {
            axiom.push({
                type: 'pianoAccompaniment',
                note: chordNotes[random.nextInt(chordNotes.length)] + octaveShift,
                duration: 0.5,
                time: time,
                weight: 0.4 + random.next() * 0.2,
                technique: 'pluck', dynamics: 'p', phrasing: 'staccato',
                params: {}
            });
        }
    });

    return axiom;
  }
}
