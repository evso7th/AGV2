
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

/**
 * #ЗАЧЕМ: Фрактальный Музыкальный Движок V12.0 — "Drama Engine".
 * #ЧТО: Реализует систему "Dramatic Gravity" — вероятностное вступление инструментов
 *       с нарастающей громкостью и сохранением состояния (Persistence).
 */
export class FractalMusicEngine {
  public config: EngineConfig;
  public epoch = 0;
  public random: any;
  public suiteDNA: SuiteDNA | null = null; 
  public navigator: BlueprintNavigator | null = null;
  private isInitialized = false;

  private bluesBrain: BluesBrain | null = null;
  private previousChord: GhostChord | null = null;
  
  /** 
   * #ЗАЧЕМ: Память ансамбля. Хранит активированные инструменты и такт их рождения.
   */
  private activatedInstruments: Map<InstrumentPart, { timbre: string, startBar: number }> = new Map();
  
  private lastEvents: FractalEvent[] = []; 

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
    this.lastEvents = [];
    
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

    const instrumentHints: InstrumentHints = { summonProgress: {} };
    const stages = navInfo.currentPart.stagedInstrumentation;

    // --- DRAMATIC GRAVITY: Instrument Activation Logic ---
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

        let atLeastOneActive = false;
        
        Object.entries(currentStage.instrumentation).forEach(([partStr, rule]: [any, any]) => {
            const part = partStr as InstrumentPart;
            
            if (rule.transient) {
                if (this.random.next() < rule.activationChance) {
                    (instrumentHints as any)[part] = this.pickWeighted(rule.instrumentOptions);
                    instrumentHints.summonProgress![part] = 1.0;
                    atLeastOneActive = true;
                }
            } else {
                // Persistent summoning logic
                if (!this.activatedInstruments.has(part)) {
                    if (rule.activationChance > 0 && this.random.next() < rule.activationChance) {
                        this.activatedInstruments.set(part, { 
                            timbre: this.pickWeighted(rule.instrumentOptions), 
                            startBar: this.epoch 
                        });
                        console.log(`Plan171 - [Summon] Instrument ${part} materializing at Bar ${this.epoch}`);
                    }
                }
                
                if (this.activatedInstruments.has(part)) {
                    const data = this.activatedInstruments.get(part)!;
                    (instrumentHints as any)[part] = data.timbre;
                    
                    // Progress: 0.33 -> 0.66 -> 1.0 over 3 bars
                    const age = this.epoch - data.startBar;
                    const progress = Math.min(1, (age + 1) / 3);
                    instrumentHints.summonProgress![part] = progress;
                    atLeastOneActive = true;
                }
            }
        });

        // RULE: No Silence (Anti-Dead-Air)
        if (!atLeastOneActive && this.epoch > 0) {
            const candidates = Object.entries(currentStage.instrumentation)
                .sort((a, b) => (b[1] as any).activationChance - (a[1] as any).activationChance);
            if (candidates.length > 0) {
                const [bestPart, bestRule] = candidates[0];
                this.activatedInstruments.set(bestPart as InstrumentPart, {
                    timbre: this.pickWeighted((bestRule as any).instrumentOptions),
                    startBar: this.epoch
                });
                console.warn(`Plan171 - [Guard] Anti-Silence triggered. Forced summoning of ${bestPart}`);
            }
        }
    }

    if (navInfo.currentPart.layers.pianoAccompaniment) instrumentHints.pianoAccompaniment = 'piano';

    const result = this.generateOneBar(barDuration, navInfo, instrumentHints);
    this.lastEvents = [...result.events];

    return { ...result, instrumentHints };
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
        allEvents = this.bluesBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints, this.lastEvents);
    } else {
        const harmonyEvents = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.epoch);
        allEvents.push(...harmonyEvents);
    }

    return { events: allEvents };
  }
}
