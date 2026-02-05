
import type { FractalEvent, Mood, Genre, InstrumentPart, InstrumentHints, GhostChord, SuiteDNA, NavigationInfo } from '@/types/music';
import { BlueprintNavigator } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { BluesBrain } from './blues-brain';
import { generateSuiteDNA, createHarmonyAxiom } from './music-theory';

function seededRandom(seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
    return state / Math.pow(2, 32);
  };
  return {
      next,
      nextInt: (max: number) => Math.floor(next() * max),
       shuffle: <T>(array: T[]): T[] => {
        let currentIndex = array.length, randomIndex;
        const newArray = [...array];
        while (currentIndex !== 0) {
            randomIndex = Math.floor(next() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
        }
        return newArray;
    }
  };
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

  private bluesBrain: BluesBrain | null = null;
  private previousChord: GhostChord | null = null;
  private activatedInstruments: Map<InstrumentPart, string> = new Map();

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
    
    if (this.config.genre === 'blues') {
        this.bluesBrain = new BluesBrain(this.config.seed, this.config.mood);
    } else {
        this.bluesBrain = null;
    }

    const blueprint = getBlueprint(this.config.genre, this.config.mood);
    this.suiteDNA = generateSuiteDNA(blueprint.structure.totalDuration.preferredBars, this.config.mood, this.config.seed, this.random, this.config.genre, blueprint.structure.parts);
    this.navigator = new BlueprintNavigator(blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.suiteDNA.soloPlanMap);
    
    this.config.tempo = this.suiteDNA.baseTempo;
    this.isInitialized = true;
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints } {
    if (!this.navigator) return { events: [], instrumentHints: {} };
    this.epoch = barCount;

    if (this.epoch >= this.navigator.totalBars) return { events: [], instrumentHints: {} };

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {} };

    const instrumentHints: InstrumentHints = {};
    const stages = navInfo.currentPart.stagedInstrumentation;

    if (stages && stages.length > 0) {
        const progress = (this.epoch - navInfo.currentPartStartBar) / (navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1);
        let currentStage = stages[stages.length - 1];
        let acc = 0;
        for (const s of stages) { 
            acc += s.duration.percent; 
            if (progress * 100 <= acc) { 
                currentStage = s; 
                break; 
            } 
        }

        Object.entries(currentStage.instrumentation).forEach(([part, rule]: [any, any]) => {
            if (rule.transient) {
                if (this.random.next() < rule.activationChance) (instrumentHints as any)[part] = this.pickWeighted(rule.instrumentOptions);
            } else if (!this.activatedInstruments.has(part)) {
                if (rule.activationChance > 0 && this.random.next() < rule.activationChance) {
                    this.activatedInstruments.set(part, this.pickWeighted(rule.instrumentOptions));
                }
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
    
    let allEvents: FractalEvent[] = [];

    if (this.config.genre === 'blues' && this.bluesBrain) {
        allEvents = this.bluesBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints);
    } else {
        const harmonyEvents = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.epoch);
        allEvents.push(...harmonyEvents);
    }

    return { events: allEvents };
  }
}
