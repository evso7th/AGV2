
import type { FractalEvent, Mood, Genre, InstrumentPart, InstrumentHints, GhostChord, SuiteDNA, NavigationInfo, MusicBlueprint, Technique } from '@/types/music';
import { BlueprintNavigator } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { BluesBrain } from './blues-brain';
import { AmbientBrain } from './ambient-brain';
import { generateSuiteDNA, createHarmonyAxiom, pickWeightedDeterministic } from './music-theory';
import { MelancholicMinorK } from './resonance-matrices';

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
  useHeritage: boolean;
  introBars: number;
  ancestor?: any;
  sessionLickHistory?: string[];
  cloudAxioms?: any[]; 
  selectedCompositionIds?: string[];
  activeAnchorId?: string | null; 
  masterpieces?: any[]; 
}

/**
 * #ЗАЧЕМ: Фрактальный Музыкальный Движок V32.0 — "Active Arbiter Unleashed".
 * #ЧТО: ПЛАН №816 — Внедрен реальный расчет beautyScore для авто-лайков.
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
  private activeTimbres: Partial<Record<InstrumentPart, string>> = {};
  
  constructor(config: EngineConfig, blueprint: MusicBlueprint) {
    this.config = { ...config };
    this.blueprint = blueprint;
    this.random = seededRandom(config.seed);
  }

  public updateConfig(newConfig: Partial<EngineConfig>) {
      const moodOrGenreChanged = newConfig.mood !== this.config.mood || newConfig.genre !== this.config.genre;
      const seedChanged = newConfig.seed !== undefined && newConfig.seed !== this.config.seed;
      const heritageChanged = newConfig.useHeritage !== undefined && newConfig.useHeritage !== this.config.useHeritage;
      
      this.config = { ...this.config, ...newConfig };
      
      if (seedChanged) this.random = seededRandom(this.config.seed);
      
      if (newConfig.cloudAxioms || newConfig.selectedCompositionIds || newConfig.activeAnchorId !== undefined || heritageChanged) {
          if (this.bluesBrain) (this.bluesBrain as any).updateCloudAxioms(
              this.config.cloudAxioms, 
              this.config.selectedCompositionIds,
              this.config.activeAnchorId,
              null,
              this.config.useHeritage
          );
          
          if (this.ambientBrain) (this.ambientBrain as any).updateCloudAxioms(
              this.config.cloudAxioms,
              this.config.activeAnchorId,
              this.config.useHeritage
          );
      }

      if(moodOrGenreChanged || seedChanged || heritageChanged) this.initialize(true);
  }

  public initialize(force: boolean = false) {
    if (this.isInitialized && !force) return;

    this.activatedParts.clear(); 
    this.activeTimbres = {};

    this.suiteDNA = generateSuiteDNA(
        this.blueprint.structure.totalDuration.preferredBars, 
        this.config.mood, 
        this.config.seed, 
        this.random, 
        this.config.genre, 
        this.blueprint.structure.parts,
        this.config.ancestor,
        this.config.sessionLickHistory,
        this.blueprint.musical.bpm,
        this.config.masterpieces,
        this.config.cloudAxioms,
        this.config.activeAnchorId
    );

    this.navigator = new BlueprintNavigator(this.blueprint, this.config.seed, this.config.genre, this.config.mood, this.config.introBars, this.suiteDNA.soloPlanMap);
    
    if (this.config.genre === 'blues') {
        this.bluesBrain = new BluesBrain(
            this.config.seed, 
            this.config.mood, 
            this.config.sessionLickHistory, 
            this.config.cloudAxioms, 
            this.config.selectedCompositionIds,
            this.config.activeAnchorId,
            this.config.genre,
            this.config.useHeritage
        );
        this.ambientBrain = null;
    } else {
        this.ambientBrain = new AmbientBrain(this.config.seed, this.config.mood, this.config.genre, this.config.useHeritage);
        this.ambientBrain.updateCloudAxioms(this.config.cloudAxioms || [], this.config.activeAnchorId, this.config.useHeritage);
        this.bluesBrain = null;
    }

    this.config.tempo = this.suiteDNA.baseTempo;
    this.isInitialized = true;
  }

  /**
   * #ЗАЧЕМ: Расчет индекса красоты для Арбитра.
   * #ЧТО: Анализ резонанса между событиями текущего такта.
   */
  private calculateBeautyScore(events: FractalEvent[]): number {
      if (events.length < 2) return 0.5;
      
      let totalResonance = 0;
      let comparisons = 0;
      
      // Сравниваем только тональные пары (мелодия/бас/аккомп)
      const tonalEvents = events.filter(e => ['melody', 'bass', 'accompaniment'].includes(e.type as string));
      if (tonalEvents.length < 2) return 0.6; // Одинокое соло — это тоже неплохо

      for (let i = 0; i < tonalEvents.length; i++) {
          for (let j = i + 1; j < tonalEvents.length; j++) {
              const res = MelancholicMinorK(tonalEvents[i], tonalEvents[j], {
                  mood: this.config.mood,
                  tempo: this.config.tempo,
                  delta: 1.0,
                  genre: this.config.genre
              });
              totalResonance += res;
              comparisons++;
          }
      }
      
      return comparisons > 0 ? (totalResonance / comparisons) : 0.5;
  }

  public evolve(barDuration: number, barCount: number): { 
      events: FractalEvent[], 
      instrumentHints: InstrumentHints, 
      beautyScore: number, 
      tension: number, 
      navInfo?: NavigationInfo,
      lickId?: string,
      mutationType?: string,
      activeAxioms?: any,
      narrative?: string,
      dynasty?: string,
      newBpm?: number 
  } {
    if (!this.navigator || !this.suiteDNA) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };
    this.epoch = barCount;

    if (this.epoch >= this.navigator.totalBars) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };

    const instrumentHints: InstrumentHints = { summonProgress: {} };
    let tension = this.suiteDNA.tensionMap[this.epoch % this.suiteDNA.tensionMap.length] ?? 0.5;
    
    let currentInstructions: any | undefined;
    const stages = navInfo.currentPart.stagedInstrumentation;

    const forceActivation = this.epoch >= 8 && navInfo.currentPart.id === 'INTRO';

    if (stages && stages.length > 0) {
        const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
        const progress = (this.epoch - navInfo.currentPartStartBar) / (partBars || 1);
        let acc = 0;
        for (const s of stages) { 
            acc += s.duration.percent; 
            if (progress * 100 <= acc) { currentInstructions = s.instrumentation; break; } 
        }
    } else {
        currentInstructions = navInfo.currentPart.instrumentation;
    }

    const activeLayers = navInfo.currentPart.layers || {};
    Object.keys(activeLayers).forEach(layer => {
        const part = layer as InstrumentPart;
        if (activeLayers[part] && !this.activatedParts.has(part)) {
            const rule = currentInstructions ? currentInstructions[part] : null;
            let effectiveChance = forceActivation ? 1.0 : (rule ? (rule.activationChance ?? 1.0) : 1.0);
            
            if (this.random.next() < effectiveChance) {
                this.activatedParts.add(part);
                const options = rule ? (rule.instrumentOptions || rule.v2Options || rule.options || []) : [];
                
                let defaultInst = 'synth';
                if (part === 'bass') defaultInst = 'bass_jazz_warm';
                else if (part === 'melody') defaultInst = 'organ_soft_jazz';
                else if (part === 'accompaniment') defaultInst = 'synth_ambient_pad_lush';
                else if (part === 'harmony') defaultInst = (this.config.genre === 'blues' ? 'guitarChords' : 'violin');

                this.activeTimbres[part] = pickWeightedDeterministic(options, this.config.seed, this.epoch, 500) || defaultInst;
            }
        }
    });

    // Populate hints for active musicians
    const isTransition = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');
    
    this.activatedParts.forEach(part => {
        if ((navInfo.currentPart.layers as any)[part] || isTransition) {
            (instrumentHints as any)[part] = this.activeTimbres[part] || 'synth';
            instrumentHints.summonProgress![part] = 1.0; 
        }
    });
    
    if (navInfo.currentPart.layers.pianoAccompaniment || isTransition) instrumentHints.pianoAccompaniment = 'piano';

    const foundChord = this.suiteDNA.harmonyTrack.find(chord => this.epoch >= chord.bar && this.epoch < chord.bar + chord.durationBars);
    let currentChord: GhostChord = foundChord || this.previousChord || this.suiteDNA.harmonyTrack[0];
    this.previousChord = currentChord;

    let result: any;
    if (this.config.genre !== 'blues' && this.ambientBrain) {
        result = this.ambientBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints);
    } else if (this.bluesBrain) {
        result = this.bluesBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints);
    } else {
        result = { events: createHarmonyAxiom(currentChord, this.config.mood, this.config.genre, this.random, this.epoch) };
    }

    this.lastEvents = [...result.events];
    
    // #ЗАЧЕМ: Реальный расчет оценки красоты для Арбитра.
    const barBeauty = this.calculateBeautyScore(result.events);
    
    return { 
        ...result, 
        instrumentHints, 
        beautyScore: barBeauty, 
        tension, 
        navInfo,
        dynasty: this.suiteDNA.dynasty,
        lickId: result.lickId,
        mutationType: result.mutationType,
        activeAxioms: result.activeAxioms,
        narrative: result.narrative,
        newBpm: result.newBpm
    };
  }
  
  public generateExternalImpulse() {}
}
