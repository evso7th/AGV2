import type { FractalEvent, Mood, Genre, InstrumentPart, InstrumentHints, GhostChord, SuiteDNA, NavigationInfo, MusicBlueprint, Technique } from '@/types/music';
import { BlueprintNavigator } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { BluesBrain } from './blues-brain';
import { AmbientBrain } from './ambient-brain';
import { generateSuiteDNA, createHarmonyAxiom, pickWeightedDeterministic } from './music-theory';
import { ElectronicK, AmbientK, MelancholicMinorK } from './resonance-matrices';

function seededRandom(seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
    return state / Math.pow(2, 32);
  };
  return {
      next,
      nextInt: (max: number) => Math.floor(next() * max),
      nextInRange: (min: number, max: number) => min + next() * (max - min),
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
  ancestor?: any;
  sessionLickHistory?: string[];
}

/**
 * #ЗАЧЕМ: Фрактальный Музыкальный Движок V18.1 — "Dynasty Memory Update".
 * #ЧТО: Внедрена поддержка межсессионной истории ликов для Dynasty Rotation.
 */
export class FractalMusicEngine {
  public config: EngineConfig;
  public blueprint: MusicBlueprint;
  public epoch = 0;
  public random: any;
  public suiteDNA: SuiteDNA | null = null; 
  public navigator: BlueprintNavigator | null = null;
  private isInitialized = false;

  private bluesBrain: BluesBrain | null = null;
  private ambientBrain: AmbientBrain | null = null;
  private previousChord: GhostChord | null = null;
  private lastEvents: FractalEvent[] = []; 

  private activatedParts: Set<InstrumentPart> = new Set();
  private hookLibrary: { events: FractalEvent[], root: number }[] = [];

  constructor(config: EngineConfig, blueprint: MusicBlueprint) {
    this.config = { ...config };
    this.blueprint = blueprint;
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

    this.activatedParts.clear(); 
    this.hookLibrary = [];

    // #ЗАЧЕМ: Передача истории сессии для исключения повторов при рождении.
    this.suiteDNA = generateSuiteDNA(
        this.blueprint.structure.totalDuration.preferredBars, 
        this.config.mood, 
        this.config.seed, 
        this.random, 
        this.config.genre, 
        this.blueprint.structure.parts,
        this.config.ancestor,
        this.config.sessionLickHistory
    );

    // #ЗАЧЕМ: Сообщаем UI о выбранном лике для пополнения истории.
    if (this.suiteDNA.seedLickId) {
        self.postMessage({ type: 'LICK_BORN', lickId: this.suiteDNA.seedLickId });
    }

    this.navigator = new BlueprintNavigator(this.blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.suiteDNA.soloPlanMap);
    
    if (this.config.genre === 'blues') {
        this.bluesBrain = new BluesBrain(this.config.seed, this.config.mood);
        this.ambientBrain = null;
    } else if (this.config.genre === 'ambient') {
        this.ambientBrain = new AmbientBrain(this.config.seed, this.config.mood);
        this.bluesBrain = null;
    } else {
        this.bluesBrain = null;
        this.ambientBrain = null;
    }

    this.config.tempo = this.suiteDNA.baseTempo;
    this.isInitialized = true;
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints, beautyScore: number, tension: number, navInfo?: NavigationInfo } {
    if (!this.navigator || !this.suiteDNA) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };
    this.epoch = barCount;

    if (this.epoch >= this.navigator.totalBars) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };

    if (this.config.genre === 'ambient' && this.ambientBrain) {
        const foundChord = this.suiteDNA.harmonyTrack.find(chord => this.epoch >= chord.bar && this.epoch < chord.bar + chord.durationBars);
        const currentChord = foundChord || this.suiteDNA.harmonyTrack[0];
        
        const ambientResult = this.ambientBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA);
        const beautyScore = this.calculateBeautyScore(ambientResult.events);
        const tension = this.suiteDNA.tensionMap[this.epoch % this.suiteDNA.tensionMap.length] || 0.5;

        return { 
            events: ambientResult.events, 
            instrumentHints: ambientResult.instrumentHints, 
            beautyScore, 
            tension, 
            navInfo 
        };
    }

    const instrumentHints: InstrumentHints = { summonProgress: {} };
    const stages = navInfo.currentPart.stagedInstrumentation;
    let tension = this.suiteDNA.tensionMap[this.epoch % this.suiteDNA.tensionMap.length] ?? 0.5;
    
    if (navInfo.currentPart.id.includes('MAIN')) tension = Math.max(0.4, tension);

    if (stages && stages.length > 0) {
        const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
        const progress = (this.epoch - navInfo.currentPartStartBar) / partBars;
        let currentStage = stages[stages.length - 1];
        let acc = 0;
        for (const s of stages) { 
            acc += s.duration.percent; 
            if (progress * 100 <= acc) { currentStage = s; break; } 
        }

        Object.entries(currentStage.instrumentation).forEach(([partStr, rule]: [any, any]) => {
            const part = partStr as InstrumentPart;
            if (!this.activatedParts.has(part)) {
                let effectiveChance = rule.activationChance;
                if (part === 'sfx' || part === 'sparkles') effectiveChance *= (1.0 - tension);
                if (this.random.next() < effectiveChance) this.activatedParts.add(part);
            }
            if (this.activatedParts.has(part)) {
                (instrumentHints as any)[part] = pickWeightedDeterministic(rule.instrumentOptions, this.config.seed, this.epoch, 500);
                instrumentHints.summonProgress![part] = 1.0; 
            }
        });
    }

    if (navInfo.currentPart.layers.pianoAccompaniment) instrumentHints.pianoAccompaniment = 'piano';

    const result = this.generateOneBar(barDuration, navInfo, instrumentHints);
    this.lastEvents = [...result.events];
    const beautyScore = this.calculateBeautyScore(result.events);

    return { ...result, instrumentHints, beautyScore, tension, navInfo };
  }

  private calculateBeautyScore(events: FractalEvent[]): number {
      if (events.length < 2) return 0.5;
      const matrix = this.config.genre === 'ambient' ? AmbientK : (this.config.mood === 'melancholic' ? MelancholicMinorK : ElectronicK);
      let totalResonance = 0;
      let pairCount = 0;
      for (let i = 0; i < events.length; i++) {
          for (let j = i + 1; j < Math.min(i + 5, events.length); j++) {
              totalResonance += matrix(events[i], events[j], { mood: this.config.mood, genre: this.config.genre, tempo: this.config.tempo, delta: 0.5 });
              pairCount++;
          }
      }
      return pairCount > 0 ? totalResonance / pairCount : 0.5;
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
        allEvents = createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.epoch);
    }

    return { events: allEvents };
  }

  public generateExternalImpulse() {}
}
