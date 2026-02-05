
import type { FractalEvent, Mood, Genre, Technique, InstrumentPart, InstrumentHints, AccompanimentTechnique, GhostChord, SuiteDNA, NavigationInfo, Stage, BluesCognitiveState } from '@/types/music';
import { BlueprintNavigator } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { V2_PRESETS } from './presets-v2';

import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { DRUM_KITS } from './assets/drum-kits';

import { 
    generateSuiteDNA, 
    createDrumAxiom, 
    createHarmonyAxiom, 
    createAmbientBassAxiom,
    createBluesBassAxiom,
    generateBluesMelodyChorus,
    humanizeEvents
} from './music-theory';

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

export class FractalMusicEngine {
  public config: EngineConfig;
  public epoch = 0;
  public random: any;
  public suiteDNA: SuiteDNA | null = null; 
  public navigator: BlueprintNavigator | null = null;
  private isInitialized = false;

  private currentBassRiffIndex = 0;
  private currentDrumRiffIndex = 0;
  private melodyHistory: string[] = [];
  private previousChord: GhostChord | null = null;

  // #ЗАЧЕМ: Блюзовый Интеллект и Эмоциональное Состояние.
  private cognitiveState: BluesCognitiveState = {
      phraseState: 'call',
      tensionLevel: 0.1,
      phraseHistory: [],
      emotion: { melancholy: 0.7, darkness: 0.3 }
  };

  private activatedInstruments: Map<InstrumentPart, string> = new Map();
  private hookLibrary: { events: FractalEvent[], root: number }[] = [];

  constructor(config: EngineConfig) {
    this.config = { ...config };
    this.random = seededRandom(config.seed);
  }

  public updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      const seedChanged = newConfig.seed !== undefined && newConfig.seed !== this.config.seed;
      this.config = { ...this.config, ...newConfig };
      if (seedChanged) this.random = seededRandom(this.config.seed);
      if(moodOrGenreChanged || seedChanged) this.initialize(true);
  }

  public initialize(force: boolean = false) {
    if (this.isInitialized && !force) return;

    this.random = seededRandom(this.config.seed);
    this.activatedInstruments.clear(); 
    this.hookLibrary = [];
    this.melodyHistory = [];
    
    // Начальное эмоциональное состояние зависит от настроения
    this.cognitiveState = {
        phraseState: 'call',
        tensionLevel: 0.1,
        phraseHistory: [],
        emotion: { 
            melancholy: ['melancholic', 'dark', 'anxious'].includes(this.config.mood) ? 0.8 : 0.3,
            darkness: ['dark', 'gloomy'].includes(this.config.mood) ? 0.7 : 0.2
        }
    };

    const riffs = BLUES_BASS_RIFFS[this.config.mood] || BLUES_BASS_RIFFS['contemplative'];
    this.currentBassRiffIndex = this.random.nextInt(riffs.length);

    const drumRiffs = BLUES_DRUM_RIFFS[this.config.mood] || BLUES_DRUM_RIFFS['contemplative'] || [];
    this.currentDrumRiffIndex = this.random.nextInt(drumRiffs.length);
    
    const blueprint = getBlueprint(this.config.genre, this.config.mood);
    this.suiteDNA = generateSuiteDNA(blueprint.structure.totalDuration.preferredBars, this.config.mood, this.config.seed, this.random, this.config.genre, blueprint.structure.parts);
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.suiteDNA.soloPlanMap);
    
    this.config.tempo = this.suiteDNA.baseTempo;
    this.isInitialized = true;
  }

  /**
   * #ЗАЧЕМ: Плавная эволюция внутреннего состояния.
   */
  private evolveEmotion() {
      // Медленный дрейф (Brownian walk)
      this.cognitiveState.emotion.melancholy += (this.random.next() - 0.5) * 0.02;
      this.cognitiveState.emotion.darkness += (this.random.next() - 0.5) * 0.01;
      
      this.cognitiveState.emotion.melancholy = Math.max(0.1, Math.min(0.9, this.cognitiveState.emotion.melancholy));
      this.cognitiveState.emotion.darkness = Math.max(0.1, Math.min(0.9, this.cognitiveState.emotion.darkness));
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    if (!this.navigator) return { events: [], instrumentHints: {} };
    this.epoch = barCount;
    this.evolveEmotion();

    if (this.epoch >= this.navigator.totalBars) return { events: [], instrumentHints: {} };

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {} };

    const instrumentHints: InstrumentHints = {};
    const stages = navInfo.currentPart.stagedInstrumentation;

    if (stages && stages.length > 0) {
        const progress = (this.epoch - navInfo.currentPartStartBar) / (navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1);
        let currentStage = stages[stages.length - 1];
        let acc = 0;
        for (const s of stages) { acc += s.duration.percent; if (progress * 100 <= acc) { currentStage = s; break; } }

        Object.entries(currentStage.instrumentation).forEach(([part, rule]: [any, any]) => {
            if (rule.transient) {
                if (this.random.next() < rule.activationChance) (instrumentHints as any)[part] = this.pickWeighted(rule.instrumentOptions);
            } else if (!this.activatedInstruments.has(part)) {
                if (rule.activationChance > 0 && this.random.next() < rule.activationChance) this.activatedInstruments.set(part, this.pickWeighted(rule.instrumentOptions));
            } else if (rule.activationChance === 0) {
                this.activatedInstruments.delete(part);
            }
        });
    }

    this.activatedInstruments.forEach((timbre, part) => { (instrumentHints as any)[part] = timbre; });
    if (navInfo.currentPart.layers.pianoAccompaniment) instrumentHints.pianoAccompaniment = 'piano';

    return { ...this.generateOneBar(barDuration, navInfo, instrumentHints), instrumentHints };
  }

  private pickWeighted<T>(options: { name: T, weight: number }[]): T {
      const total = options.reduce((sum, opt) => sum + opt.weight, 0);
      let rand = this.random.next() * total;
      for (const opt of options) { rand -= opt.weight; if (rand <= 0) return opt.name; }
      return options[options.length - 1].name;
  }
  
  private generateOneBar(barDuration: number, navInfo: NavigationInfo, instrumentHints: InstrumentHints): { events: FractalEvent[] } {
    if (!this.suiteDNA) return { events: [] };
    const foundChord = this.suiteDNA.harmonyTrack.find(chord => this.epoch >= chord.bar && this.epoch < chord.bar + chord.durationBars);
    let currentChord: GhostChord = foundChord || this.previousChord || this.suiteDNA.harmonyTrack[0];
    this.previousChord = currentChord;
    
    // 1. Drums
    let drumEvents: FractalEvent[] = [];
    if (instrumentHints.drums) {
        const kitName = navInfo.currentPart.instrumentRules?.drums?.kitName || `${this.config.genre}_${this.config.mood}`.toLowerCase();
        const baseKit = (DRUM_KITS[this.config.genre] as any)?.[kitName] || DRUM_KITS.ambient!.intro!;
        drumEvents = createDrumAxiom(baseKit, this.config.genre, this.config.mood, this.config.tempo, this.random).events;
    }

    // 2. Melody (Main Logic)
    let melodyEvents: FractalEvent[] = [];
    if (instrumentHints.melody) {
        const rules = navInfo.currentPart.instrumentRules?.melody;
        if (rules?.source === 'blues_solo') {
            const soloRes = generateBluesMelodyChorus(currentChord, this.random, navInfo.currentPart.id, this.epoch, rules, this.suiteDNA, this.cognitiveState, {});
            melodyEvents = soloRes.events;
        }
    }

    // 3. Bass
    let bassEvents: FractalEvent[] = [];
    if (instrumentHints.bass) {
        if (this.config.genre === 'blues') {
            bassEvents = createBluesBassAxiom(currentChord, 'riff', this.random, this.config.mood, this.epoch, this.suiteDNA, this.currentBassRiffIndex);
        } else {
            bassEvents = createAmbientBassAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.config.tempo, 'drone');
        }
    }

    // 4. Accompaniment & Harmony
    let accompEvents: FractalEvent[] = [];
    if (instrumentHints.accompaniment) {
        accompEvents = this.createAccompanimentAxiom(currentChord, navInfo);
    }

    const allEvents = [...bassEvents, ...drumEvents, ...accompEvents, ...melodyEvents];
    return { events: allEvents };
  }

  private createAccompanimentAxiom(chord: GhostChord, navInfo: NavigationInfo): FractalEvent[] {
    const axiom: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const notes = [chord.rootNote, chord.rootNote + (isMinor ? 3 : 4), chord.rootNote + 7];
    const technique = (navInfo.currentPart.instrumentRules?.accompaniment?.techniques?.[0]?.value || 'long-chords') as AccompanimentTechnique;

    notes.forEach((note, i) => {
        axiom.push({
            type: 'accompaniment', note: note + 36, duration: 4.0, time: i * 0.05, weight: 0.5 - (i * 0.1),
            technique, dynamics: 'mp', phrasing: 'legato', 
            params: { 
                attack: 0.1 + (this.cognitiveState.emotion.melancholy * 0.5), 
                release: 1.5 + (this.cognitiveState.emotion.melancholy * 1.0) 
            }
        });
    });
    return axiom;
  }
}
