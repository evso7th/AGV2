

import type { FractalEvent, Mood, Genre, Technique, BassSynthParams, InstrumentType, MelodyInstrument, BassInstrument, AccompanimentInstrument, ResonanceMatrix, InstrumentHints, AccompanimentTechnique, GhostChord } from '@/types/fractal';
import { ElectronicK, TraditionalK, AmbientK, MelancholicMinorK } from './resonance-matrices';
import { getScaleForMood, STYLE_DRUM_PATTERNS, generateAmbientBassPhrase, mutateBassPhrase as originalMutateBassPhrase, createAccompanimentAxiom, PERCUSSION_SETS, TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD, getAccompanimentTechnique, createBassFill as createBassFillFromTheory, createDrumFill, AMBIENT_ACCOMPANIMENT_WEIGHTS, chooseHarmonyInstrument, mutateAccompanimentPhrase as originalMutateAccompPhrase, generateGhostHarmonyTrack, createMelodyMotif as originalCreateMelodyMotif } from './music-theory';
import { BlueprintNavigator, type NavigationInfo } from './blueprint-navigator';
import { MelancholicAmbientBlueprint, BLUEPRINT_LIBRARY, getBlueprint } from './blueprints';


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


// === АКСОМЫ И ТРАНСФОРМАЦИИ ===

// УСИЛЕННЫЕ ФУНКЦИИ МУТАЦИИ
function mutateBassPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    if (phrase.length === 0) return generateAmbientBassPhrase(chord, mood, genre, random);

    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    const mutationType = random.nextInt(4);

    switch (mutationType) {
        case 0: // Более заметное ритмическое изменение
            const noteToChange = newPhrase[random.nextInt(newPhrase.length)];
            noteToChange.duration *= (random.next() > 0.5 ? 1.5 : 0.66);
            if (newPhrase.length > 1) {
                const anotherNote = newPhrase[random.nextInt(newPhrase.length)];
                anotherNote.duration *= (random.next() > 0.5 ? 1.25 : 0.75);
            }
            break;

        case 1: // Инверсия высоты тона внутри фразы
             if (newPhrase.length > 1) {
                const firstNote = newPhrase[0].note;
                newPhrase.forEach(event => {
                    const interval = event.note - firstNote;
                    event.note = firstNote - interval;
                });
             }
            break;

        case 2: // Замена половины фразы на новый материал
            if (newPhrase.length > 2) {
                const half = Math.ceil(newPhrase.length / 2);
                const newHalf = generateAmbientBassPhrase(chord, mood, genre, random).slice(0, half);
                newPhrase.splice(0, half, ...newHalf);
            }
            break;

        case 3: // Добавление "проходящей" ноты
            if (newPhrase.length > 1) {
                const insertIndex = random.nextInt(newPhrase.length - 1) + 1;
                const prevNote = newPhrase[insertIndex-1];
                const scale = getScaleForMood(mood);
                const passingNoteMidi = scale[Math.floor(random.next() * scale.length)];
                
                const newNote: FractalEvent = {
                    ...prevNote,
                    note: passingNoteMidi,
                    duration: 0.5, // Короткая проходящая нота
                    time: prevNote.time + prevNote.duration / 2,
                    weight: prevNote.weight * 0.8
                };
                newPhrase.splice(insertIndex, 0, newNote);
            }
            break;
    }

    // Re-normalize timings after mutation
    let totalDuration = newPhrase.reduce((sum, e) => sum + e.duration, 0);
    if (totalDuration > 0) {
        const scaleFactor = 4.0 / totalDuration;
        let runningTime = 0;
        newPhrase.forEach(e => {
            e.duration *= scaleFactor;
            e.time = runningTime;
            runningTime += e.duration;
        });
    }

    return newPhrase;
}

function mutateAccompanimentPhrase(phrase: FractalEvent[], chord: GhostChord, mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): FractalEvent[] {
    const newPhrase: FractalEvent[] = JSON.parse(JSON.stringify(phrase));
    if (newPhrase.length === 0) return [];
    
    const mutationType = random.nextInt(4);
    switch (mutationType) {
        case 0: // Изменение ритма (арпеджио -> аккорд и наоборот)
            if (newPhrase.length > 1) {
                const totalDuration = newPhrase.reduce((sum, e) => sum + e.duration, 0);
                newPhrase.splice(1); // Оставляем только первую ноту
                newPhrase[0].duration = totalDuration;
                newPhrase[0].time = 0;
            }
            break;
        case 1: // Смена октавы
            const octaveShift = (random.next() > 0.5) ? 12 : -12;
            newPhrase.forEach(e => e.note += octaveShift);
            break;
        case 2: // Ретроград (обратное движение)
            const noteOrder = newPhrase.map(e => e.note).reverse();
            newPhrase.forEach((e, i) => e.note = noteOrder[i]);
            break;
        case 3: // Добавление гармонического тона
            if (newPhrase.length < 5) {
                const scale = getScaleForMood(mood);
                const newNoteMidi = scale[random.nextInt(scale.length)] + 12 * 4;
                const lastNote = newPhrase[newPhrase.length - 1];
                newPhrase.push({ ...lastNote, note: newNoteMidi, time: lastNote.time + 0.1 });
            }
            break;
    }

    return newPhrase;
}

function createMelodyMotif(chord: GhostChord, mood: Mood, random: { next: () => number; nextInt: (max: number) => number; }, previousMotif?: FractalEvent[]): FractalEvent[] {
    const motif: FractalEvent[] = [];
    const scale = getScaleForMood(mood);
    const rootOctave = 4;
    let baseNote = chord.rootNote;
    while (baseNote > 50) baseNote -= 12;
    baseNote += (12 * rootOctave);

    if (previousMotif && random.next() > 0.2) { // 80% шанс на мутацию
        const variationType = random.nextInt(4);
        const sourceNotes = previousMotif.map(e => e.note);
        const firstNote = sourceNotes[0] || baseNote;

        switch (variationType) {
            case 0: // Инверсия
                console.log('%c[MelodyEvolution] Mutation: Inversion', 'color: #20B2AA');
                previousMotif.forEach(event => {
                    const interval = event.note - firstNote;
                    motif.push({ ...event, note: firstNote - interval });
                });
                break;
            case 1: // Ретроград
                console.log('%c[MelodyEvolution] Mutation: Retrograde', 'color: #20B2AA');
                const reversedNotes = [...sourceNotes].reverse();
                previousMotif.forEach((event, i) => {
                    motif.push({ ...event, note: reversedNotes[i] });
                });
                break;
            case 2: // Сдвиг октавы
                 console.log('%c[MelodyEvolution] Mutation: Octave Shift', 'color: #20B2AA');
                const octaveShift = random.next() > 0.5 ? 12 : -12;
                previousMotif.forEach(event => {
                    motif.push({ ...event, note: event.note + octaveShift });
                });
                break;
            default: // Ритмическая вариация
                 console.log('%c[MelodyEvolution] Mutation: Rhythmic Variation', 'color: #20B2AA');
                 const totalDuration = previousMotif.reduce((sum, e) => sum + e.duration, 0);
                 let currentTime = 0;
                 previousMotif.forEach(event => {
                     const newDuration = event.duration * (0.5 + random.next());
                     motif.push({ ...event, duration: newDuration, time: currentTime });
                     currentTime += newDuration;
                 });
                 // Нормализация
                 if (currentTime > 0) {
                     const scaleFactor = totalDuration / currentTime;
                     let runningTime = 0;
                     motif.forEach(e => {
                         e.duration *= scaleFactor;
                         e.time = runningTime;
                         runningTime += e.duration;
                     });
                 }
                break;
        }
        return motif;
    }
    
    // Генерация нового мотива
    console.log('%c[MelodyEvolution] Generating new motif.', 'color: #20B2AA');
    const contour = [0, 2, 4, 2];
    contour.forEach((degree, i) => {
        const noteIndex = (scale.findIndex(n => n % 12 === baseNote % 12) + degree + scale.length) % scale.length;
        const note = scale[noteIndex] + (12 * rootOctave);
        motif.push({
            type: 'melody', note: note, duration: 1.0, time: i, weight: 0.7,
            technique: 'swell', dynamics: 'mf', phrasing: 'legato', params: {}
        });
    });
    return motif;
}


function createDrumAxiom(genre: Genre, mood: Mood, tempo: number, random: { next: () => number, nextInt: (max: number) => number }): { events: FractalEvent[], tags: string[] } {
    const hitParams = {}; // Params now come from events
    const grammar = STYLE_DRUM_PATTERNS[genre] || STYLE_DRUM_PATTERNS['ambient'];
    
    const loop = grammar.loops[random.nextInt(grammar.loops.length)];
    
    const axiomEvents: FractalEvent[] = [];

    if (!loop) return { events: [], tags: [] };

    // Этап 1: Генерация основного бита (Kick, Snare, Hi-hat)
    const allBaseEvents = [...(loop.kick || []), ...(loop.snare || []), ...(loop.hihat || [])];
    for (const baseEvent of allBaseEvents) {
        if (baseEvent.probability && random.next() > baseEvent.probability) {
            continue;
        }

        let instrumentType: InstrumentType;
        if (Array.isArray(baseEvent.type)) {
            const types = baseEvent.type as InstrumentType[];
            const probabilities = baseEvent.probabilities || [];
            let rand = random.next();
            let cumulativeProb = 0;
            
            let chosenType: InstrumentType | null = null;
            for (let i = 0; i < types.length; i++) {
                cumulativeProb += probabilities[i] || (1 / types.length);
                if (rand <= cumulativeProb) {
                    chosenType = types[i];
                    break;
                }
            }
            instrumentType = chosenType || types[types.length - 1];
        } else {
            instrumentType = baseEvent.type;
        }

        axiomEvents.push({
            ...baseEvent,
            type: instrumentType,
            note: 36, // Placeholder MIDI
            phrasing: 'staccato',
            dynamics: 'mf', // Placeholder
            params: hitParams,
        } as FractalEvent);
    }
    
    return { events: axiomEvents, tags: loop.tags };
}

function createSfxScenario(mood: Mood, genre: Genre, random: { next: () => number, nextInt: (max: number) => number }): { drumFill: FractalEvent[], bassFill: FractalEvent[], accompanimentFill: FractalEvent[] } {
    const drumFill: FractalEvent[] = [];
    const bassFill: FractalEvent[] = [];
    const accompanimentFill: FractalEvent[] = [];
    
    const scale = getScaleForMood(mood);
    const rootNote = scale[random.nextInt(Math.floor(scale.length / 2))]; // Select a root from the lower half of the scale
    const isMinor = mood === 'melancholic' || mood === 'dark';
    const third = rootNote + (isMinor ? 3 : 4);
    const fifth = rootNote + 7;
    const chord = [rootNote, third, fifth].filter(n => scale.some(sn => sn % 12 === n % 12));

    const fillParams = { cutoff: 1200, resonance: 0.6, distortion: 0.25, portamento: 0.0 };

    const fillDensity = random.nextInt(4) + 3; // 3 to 6 notes for the core rhythm
    let fillTime = 3.0; // Start the fill in the last beat

    for(let i = 0; i < fillDensity; i++) {
        const duration = (1.0 / fillDensity) * (0.8 + random.next() * 0.4); // slightly variable duration
        const currentTime = fillTime;
        
        const drumInstruments: InstrumentType[] = ['drum_tom_low', 'drum_tom_mid', 'drum_tom_high', 'drum_snare'];
        const drumInstrument = drumInstruments[random.nextInt(drumInstruments.length)];
        drumFill.push({ type: drumInstrument, note: 40 + i, duration, time: currentTime, weight: 0.7 + random.next() * 0.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', params: {} });

        if (random.next() > 0.3) {
             bassFill.push({ type: 'bass', note: chord[random.nextInt(chord.length)], duration: duration * 0.9, time: currentTime, weight: 0.8 + random.next() * 0.2, technique: 'fill', dynamics: 'mf', phrasing: 'staccato', params: fillParams });
        }
        
        fillTime += duration;
    }
    
    const climaxTime = Math.min(3.75, fillTime);
    drumFill.push({ type: 'drum_crash', note: 49, duration: 1, time: climaxTime, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'legato', params: {} });
    if (random.next() > 0.2) {
      bassFill.push({ type: 'bass', note: rootNote, duration: 0.5, time: climaxTime, weight: 1.0, technique: 'fill', dynamics: 'f', phrasing: 'staccato', params: fillParams });
    }

    return { drumFill, bassFill, accompanimentFill };
}

function extractTopNotes(events: FractalEvent[], maxNotes: number = 4): FractalEvent[] {
    if (events.length === 0) return [];
    
    const timeTolerance = 0.1; 
    const groupedByTime: Map<number, FractalEvent[]> = new Map();

    for (const event of events) {
        let foundGroup = false;
        for (const time of groupedByTime.keys()) {
            if (Math.abs(time - event.time) < timeTolerance) {
                groupedByTime.get(time)!.push(event);
                foundGroup = true;
                break;
            }
        }
        if (!foundGroup) {
            groupedByTime.set(event.time, [event]);
        }
    }

    const topNotes: FractalEvent[] = [];
    for (const group of groupedByTime.values()) {
        const topNote = group.reduce((max, current) => (current.note > max.note ? current : max));
        topNotes.push(topNote);
    }
    
    return topNotes
        .sort((a, b) => a.time - b.time)
        .slice(0, maxNotes);
}

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
  
  private branches: Branch[] = [];
  private harmonyBranches: Branch[] = [];

  public navigator: BlueprintNavigator;
  private isPromenadeActive: boolean = false;
  private promenadeBars: FractalEvent[] = [];


  private currentBassPhrase: FractalEvent[] = [];
  private bassPhraseLibrary: FractalEvent[][] = [];

  private currentAccompPhrase: FractalEvent[] = []; 
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
    const scale = getScaleForMood(this.config.mood);
    const root = scale[0];
    const fifth = scale.find(n => (n - root) % 12 === 7) || scale[4] || (root + 7);
    const fourth = scale.find(n => (n - root) % 12 === 5) || scale[3] || (root + 5);

    const promenade: FractalEvent[] = [];
    const notes = [root, fifth, fourth, root];
    for (let i = 0; i < 4; i++) {
        // Accompaniment part for this bar
        promenade.push({
            type: 'accompaniment',
            note: notes[i] + 12, // Play one octave higher
            duration: 4.0, // Whole note
            time: i * 4.0, // Each note starts a new bar, assuming 4 beats per bar
            weight: 0.6,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.5, release: 2.5 }
        });
        // Bass part for this bar
         promenade.push({
            type: 'bass',
            note: notes[i],
            duration: 4.0,
            time: i * 4.0,
            weight: 0.7,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.0, release: 3.0 }
        });
    }
    this.promenadeBars = promenade;
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
    console.log(`%c[Harmony] Ghost Harmony generated with ${this.ghostHarmonyTrack.length} chords.`, "color: violet;");


    console.log(`[FractalMusicEngine] Initialized with blueprint "${this.navigator.blueprint.name}". Total duration: ${this.navigator.totalBars} bars.`);
    this._generatePromenade();

    // --- BASS INITIALIZATION ---
    const firstChord = this.ghostHarmonyTrack[0];
    this.currentBassPhrase = generateAmbientBassPhrase(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo);
    console.log(`%c[BassAxiom] Created initial bass phrase based on first GhostChord.`, 'color: #FF7F50');

    // --- ACCOMPANIMENT INITIALIZATION ---
    this.currentAccompPhrase = createAccompanimentAxiom(firstChord, this.config.mood, this.config.genre, this.random, this.config.tempo);
    console.log(`%c[AccompAxiom] Created initial accompaniment phrase.`, 'color: #87CEEB');

    // --- MELODY INITIALIZATION ---
    this.currentMelodyMotif = createMelodyMotif(firstChord, this.config.mood, this.random);
    this.lastMelodyPlayEpoch = -4; // Ensure it can play early
    console.log(`%c[MelodyAxiom] Created initial melody motif.`, 'color: #32CD32');
    
    this.needsBassReset = false;
  }
  
  private _chooseInstrumentForPart(part: 'melody' | 'accompaniment', currentPartInfo: BlueprintPart | null): MelodyInstrument | AccompanimentInstrument | undefined {
        if (!currentPartInfo || !currentPartInfo.instrumentation || !currentPartInfo.instrumentation[part]) {
            // Fallback logic if no rules are defined
            const moodWeights = TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD[this.config.mood] || TEXTURE_INSTRUMENT_WEIGHTS_BY_MOOD['calm'];
            const options = Object.entries(moodWeights).map(([name, weight]) => ({ name: name as MelodyInstrument, weight }));
            
            if (options.length === 0) return undefined;
            
            const totalWeight = options.reduce((sum, opt) => sum + opt.weight, 0);
            let rand = this.random.next() * totalWeight;

            for (const option of options) {
                rand -= option.weight;
                if (rand <= 0) {
                    return option.name;
                }
            }
            return options[0].name;
        }

        const rules = currentPartInfo.instrumentation[part] as InstrumentationRules<any>;
        if (rules && rules.strategy === 'weighted' && rules.options.length > 0) {
            const totalWeight = rules.options.reduce((sum, opt) => sum + opt.weight, 0);
            let rand = this.random.next() * totalWeight;

            for (const option of rules.options) {
                rand -= option.weight;
                if (rand <= 0) {
                    return option.name;
                }
            }
            return rules.options[0].name; // Fallback to first option
        }

        return undefined;
    }


  public generateExternalImpulse() {
    console.log(`%c[WEATHER EVENT] at epoch ${this.epoch}: Triggering musical scenario.`, "color: blue; font-weight: bold;");
    
    const { drumFill, bassFill, accompanimentFill } = createSfxScenario(this.config.mood, this.config.genre, this.random);

    this.sfxFillForThisEpoch = {
        drum: drumFill,
        bass: bassFill,
        accompaniment: accompanimentFill
    };
    
    console.log(`%c  -> Created ONE-OFF musical scenario for this epoch.`, "color: blue;");
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
    
    const partId = navInfo.currentPart.id;
    const baseAxiom = createDrumAxiom(this.config.genre, this.config.mood, this.config.tempo, this.random).events;

    switch (partId) {
      case 'INTRO_1':
      case 'OUTRO':
        return baseAxiom.filter(event => {
            const type = Array.isArray(event.type) ? event.type[0] : event.type;
            return type.startsWith('perc-') || type.includes('ride') || type.includes('cymbal');
        }).map(event => ({ ...event, weight: event.weight * 0.5 }));

      case 'INTRO_2':
      case 'INTRO_3':
      case 'BUILD_1':
      case 'BUILD_2':
        const buildEvents = [...baseAxiom];
        if (this.random.next() < 0.6) {
             buildEvents.push({ 
                type: 'drum_closed_hi_hat_ghost', 
                note: 42, 
                duration: 0.25, 
                time: 0.75 + Math.floor(this.random.next() * 3) * 1, 
                weight: 0.3,
                technique: 'ghost', dynamics: 'p', phrasing: 'staccato', params: {}
             });
        }
        return buildEvents;

      case 'MAIN_1':
      case 'MAIN_2':
        return baseAxiom;

      case 'RELEASE':
      case 'BRIDGE':
        return baseAxiom.filter(event => {
            const type = Array.isArray(event.type) ? event.type[0] : event.type;
            return type.startsWith('perc-') || type.includes('ride') || type === 'drum_snare_ghost_note';
        });
      
      default:
        return [];
    }
  }

  private _applyMicroMutations(phrase: FractalEvent[], epoch: number): FractalEvent[] {
    if (phrase.length === 0) return [];
    const newPhrase = JSON.parse(JSON.stringify(phrase));

    // 1. Ритмический Дрейф (Rhythmic Drift)
    if (this.random.next() < 0.5) { // 50% шанс на сдвиг
        console.log(`%c[MicroMutation @ Bar ${epoch}] Rhythmic Drift applied.`, 'color: cyan');
        const noteToShift = newPhrase[this.random.nextInt(newPhrase.length)];
        const shiftAmount = (this.random.next() - 0.5) * 0.1; // Сдвиг на ±5% от доли
        noteToShift.time = Math.max(0, noteToShift.time + shiftAmount);
    }

    // 2. Динамический Акцент (Velocity Accent)
    if (this.random.next() < 0.6) { // 60% шанс на акцент
        console.log(`%c[MicroMutation @ Bar ${epoch}] Velocity Accent applied.`, 'color: cyan');
        const noteToAccent = newPhrase[this.random.nextInt(newPhrase.length)];
        noteToAccent.weight *= (0.85 + this.random.next() * 0.3); // Изменение громкости на ±15%
        noteToAccent.weight = Math.max(0.1, Math.min(1.0, noteToAccent.weight));
    }
    
    // 3. Регистровый Дрейф (Register Drift)
    if (this.random.next() < 0.3) { // 30% шанс на сдвиг октавы
        console.log(`%c[MicroMutation @ Bar ${epoch}] Register Drift applied.`, 'color: cyan');
        const octaveShift = (this.random.next() > 0.5) ? 12 : -12;
        newPhrase.forEach(note => {
            const newNote = note.note + octaveShift;
            // Ограничиваем, чтобы не уходить в слишком неблагозвучные регистры
            if (newNote > 36 && newNote < 84) {
                 note.note = newNote;
            }
        });
    }

    // Пересчитываем время, чтобы избежать наложений после сдвига
    let currentTime = 0;
    newPhrase.sort((a,b) => a.time - b.time).forEach(e => {
        e.time = currentTime;
        currentTime += e.duration;
    });

    return newPhrase;
  }
  
 private generateOneBar(barDuration: number, navInfo: NavigationInfo | null): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    let instrumentHints: InstrumentHints = {};
    if (!navInfo) {
        console.log(`[FME Check @ Bar ${this.epoch}] No navigation info available.`);
        return { events: [], instrumentHints: {} };
    }
    
    const currentChord = this.ghostHarmonyTrack.find(chord => this.epoch >= chord.bar && this.epoch < chord.bar + chord.durationBars);
    if (!currentChord) {
        console.error(`[Engine] CRITICAL ERROR in bar ${this.epoch}: Could not find chord in 'Ghost Harmony'.`);
        return { events: [], instrumentHints: {} };
    }
    console.log(`%c[Bar ${this.epoch}] Chord: ${currentChord.rootNote} ${currentChord.chordType}`, "color: violet;");

    const output: FractalEvent[] = [];
    instrumentHints.accompaniment = this._chooseInstrumentForPart('accompaniment', navInfo.currentPart);
    instrumentHints.melody = this._chooseInstrumentForPart('melody', navInfo.currentPart);

    if (navInfo.currentPart.layers.bass) {
        if (navInfo.isBundleTransition) {
            this.currentBassPhrase = mutateBassPhrase(this.currentBassPhrase, currentChord, this.config.mood, this.config.genre, this.random);
            console.log(`%c[BassEvolution @ Bar ${this.epoch}] Mutating bass phrase for new bundle.`, 'color: #DA70D6;');
        }
        output.push(...this.currentBassPhrase);
    }
    
    if (navInfo.currentPart.layers.drums) {
        output.push(...this.generateDrumEvents(navInfo));
    }
    
    if (navInfo.currentPart.layers.accompaniment) {
        if (navInfo.isBundleTransition) {
            this.currentAccompPhrase = mutateAccompanimentPhrase(this.currentAccompPhrase, currentChord, this.config.mood, this.config.genre, this.random);
            console.log(`%c[AccompEvolution @ Bar ${this.epoch}] Mutating accompaniment phrase for new bundle.`, 'color: #87CEEB;');
        }
        output.push(...this.currentAccompPhrase);
    }
    
    if (navInfo.currentPart.layers.melody) {
        const melodyPlayInterval = 4; // Play every 4 bars
        if (this.epoch >= this.lastMelodyPlayEpoch + melodyPlayInterval) {
            console.log(`%c[Melody @ Bar ${this.epoch}] Playing melody motif.`, 'color: #32CD32;');
            if (navInfo.isBundleTransition) {
                this.currentMelodyMotif = createMelodyMotif(currentChord, this.config.mood, this.random, this.currentMelodyMotif);
            }
            output.push(...this.currentMelodyMotif);
            this.lastMelodyPlayEpoch = this.epoch;
        }
    }


    const finalEvents = this.applyNaturalDecay(output, 4.0);
    return { events: finalEvents, instrumentHints };
  }


  private _resetForNewSuite() {
      console.log(`%c[FME] Resetting for new suite.`, 'color: green; font-weight: bold;');
      this.epoch = 0;
      this.isPromenadeActive = false;
      this.branches = [];
      this.harmonyBranches = [];
      this.initialize(); // Re-initialize everything for a fresh start
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    this.epoch = barCount;

    // Check if it's time to start the promenade
    if (!this.isPromenadeActive && this.epoch >= this.navigator.totalBars && this.navigator.totalBars > 0) {
      console.log(`%c[FME] End of suite reached. Activating PROMENADE.`, 'color: #FFD700; font-weight: bold');
      this.isPromenadeActive = true;
      // Immediately return the full promenade score. The next tick will trigger the reset.
      return {
        events: this.promenadeBars,
        instrumentHints: { bass: 'glideBass', accompaniment: 'synth' }
      };
    }
    
    // Check if we need to reset after the promenade has conceptually "finished"
    if (this.isPromenadeActive) {
      this._resetForNewSuite();
      // After reset, we generate the first bar of the new suite
    }
    
    if (!isFinite(barDuration)) return { events: [], instrumentHints: {} };
    
    const navigationInfo = this.navigator.tick(this.epoch);
    
    const { events, instrumentHints } = this.generateOneBar(barDuration, navigationInfo);
    
    if (navigationInfo?.logMessage) {
        console.log(navigationInfo.logMessage, 'color: green; font-style: italic;');
    }
    
    this.time += barDuration;
    
    return { events, instrumentHints };
  }
}

