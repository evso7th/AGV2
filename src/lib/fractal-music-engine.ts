import type { FractalEvent, Mood, Genre, InstrumentPart, InstrumentHints, GhostChord, SuiteDNA, NavigationInfo, MusicBlueprint } from '@/types/music';
import { BlueprintNavigator } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { BluesBrain } from './blues-brain';
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
}

/**
 * #ЗАЧЕМ: Фрактальный Музыкальный Движок V16.0 — "Persistent Ensemble Hardening".
 * #ЧТО: 1. Внедрена память активации (activatedParts). Инструменты больше не исчезают.
 *       2. Сохранена динамика морфинга: пресеты выбираются заново каждый такт.
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
  private previousChord: GhostChord | null = null;
  private lastEvents: FractalEvent[] = []; 

  // #ЗАЧЕМ: Память ансамбля. Гарантирует, что музыкант не уйдет со сцены.
  private activatedParts: Set<InstrumentPart> = new Set();

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

    this.activatedParts.clear(); // Сброс состава при новой сюите

    this.suiteDNA = generateSuiteDNA(
        this.blueprint.structure.totalDuration.preferredBars, 
        this.config.mood, 
        this.config.seed, 
        this.random, 
        this.config.genre, 
        this.blueprint.structure.parts,
        this.config.ancestor
    );

    this.navigator = new BlueprintNavigator(this.blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.suiteDNA.soloPlanMap);
    
    if (this.config.genre === 'blues') {
        this.bluesBrain = new BluesBrain(this.config.seed, this.config.mood);
    } else {
        this.bluesBrain = null;
    }

    this.config.tempo = this.suiteDNA.baseTempo;
    this.isInitialized = true;
  }

  public evolve(barDuration: number, barCount: number): { events: FractalEvent[], instrumentHints: InstrumentHints, beautyScore: number, navInfo?: NavigationInfo } {
    if (!this.navigator) return { events: [], instrumentHints: {}, beautyScore: 0 };
    this.epoch = barCount;

    if (this.epoch >= this.navigator.totalBars) return { events: [], instrumentHints: {}, beautyScore: 0 };

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {}, beautyScore: 0 };

    const instrumentHints: InstrumentHints = { summonProgress: {} };
    const stages = navInfo.currentPart.stagedInstrumentation;

    if (stages && stages.length > 0) {
        const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
        const progress = (this.epoch - navInfo.currentPartStartBar) / partBars;
        const tension = this.suiteDNA?.tensionMap?.[this.epoch % (this.suiteDNA.tensionMap.length || 1)] ?? 0.5;

        let currentStage = stages[stages.length - 1];
        let acc = 0;
        for (const s of stages) { 
            acc += s.duration.percent; 
            if (progress * 100 <= acc) { 
                currentStage = s; 
                break; 
            } 
        }

        Object.entries(currentStage.instrumentation).forEach(([partStr, rule]: [any, any]) => {
            const part = partStr as InstrumentPart;
            
            // #ЗАЧЕМ: Протокол "Липкого Ансамбля" (Ensemble Persistence).
            // Если инструмент еще не активирован - бросаем кубик.
            if (!this.activatedParts.has(part)) {
                let effectiveChance = rule.activationChance;
                if (part === 'sfx' || part === 'sparkles') {
                    effectiveChance = rule.activationChance * (1.0 - tension);
                }

                if (this.random.next() < effectiveChance) {
                    this.activatedParts.add(part);
                }
            }

            // Если инструмент в списке активированных - он ОБЯЗАН играть.
            if (this.activatedParts.has(part)) {
                // Выбираем тембр (пресет) заново каждый такт для поддержки морфинга
                const timbre = pickWeightedDeterministic(rule.instrumentOptions, this.config.seed, this.epoch, 500);
                (instrumentHints as any)[part] = timbre;
                instrumentHints.summonProgress![part] = 1.0; 
                
                if (part === 'sparkles' && rule.instrumentOptions[0]?.category) {
                    (instrumentHints as any).sparkleCategory = rule.instrumentOptions[0].category;
                }
            }
        });
    }

    if (navInfo.currentPart.layers.pianoAccompaniment) instrumentHints.pianoAccompaniment = 'piano';

    const result = this.generateOneBar(barDuration, navInfo, instrumentHints);
    this.lastEvents = [...result.events];

    const beautyScore = this.calculateBeautyScore(result.events);

    return { ...result, instrumentHints, beautyScore, navInfo };
  }

  private calculateBeautyScore(events: FractalEvent[]): number {
      if (events.length < 2) return 0.5;
      const matrix = this.getResonanceMatrix();
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

  private getResonanceMatrix() {
      if (this.config.genre === 'ambient') return AmbientK;
      if (this.config.mood === 'melancholic') return MelancholicMinorK;
      return ElectronicK;
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