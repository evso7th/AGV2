
import type { FractalEvent, Mood, Genre, InstrumentPart, InstrumentHints, GhostChord, SuiteDNA, NavigationInfo, MusicBlueprint, Technique } from '@/types/music';
import { BlueprintNavigator } from './blueprint-navigator';
import { getBlueprint } from './blueprints';
import { BluesBrain } from './blues-brain';
import { AmbientBrain } from './ambient-brain';
import { TranceBrain } from './trance-brain';
import { ReggaeBrain } from './reggae-brain';
import { DarkFoundryBrain } from './dark-foundry-brain';
import { generateSuiteDNA, createHarmonyAxiom, pickWeightedDeterministic, resolveSemanticTimbre } from './music-theory';
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
  activeAnchorRoot?: number | null;
  masterpieces?: any[];
  isImprovising?: boolean;
}

/**
 * @fileOverview Fractal Music Engine V45.0 — "Foundry Hardware Link".
 * #ЗАЧЕМ: Явное использование DarkFoundryBrain для жанра foundry.
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
  private tranceBrain: TranceBrain | null = null;
  private reggaeBrain: ReggaeBrain | null = null;
  private foundryBrain: DarkFoundryBrain | null = null;
  private previousChord: GhostChord | null = null;
  private lastEvents: FractalEvent[] = [];

  private activatedParts: Set<InstrumentPart> = new Set();
  private activeTimbres: Partial<Record<InstrumentPart, string>> = {};
  private lotterySchedule: Map<InstrumentPart, number> = new Map();

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
          const impro = (this.config.selectedCompositionIds || []).length === 0;
          this.config.isImprovising = impro;

          const axioms = this.config.cloudAxioms || [];
          const anchor = this.config.activeAnchorId;
          const useH = this.config.useHeritage;

          if (this.bluesBrain) this.bluesBrain.updateCloudAxioms(axioms, this.config.selectedCompositionIds, anchor, null, useH, impro);
          if (this.ambientBrain) this.ambientBrain.updateCloudAxioms(axioms, anchor, useH, impro);
          if (this.tranceBrain) this.tranceBrain.updateCloudAxioms(axioms, anchor, useH, impro);
          if (this.reggaeBrain) this.reggaeBrain.updateCloudAxioms(axioms, anchor, useH, impro);
          if (this.foundryBrain) this.foundryBrain.updateCloudAxioms(axioms, anchor, useH, impro);
      }

      if(moodOrGenreChanged || seedChanged || heritageChanged) this.initialize(true);
  }

  public initialize(force: boolean = false) {
    if (this.isInitialized && !force) return;

    this.activatedParts.clear();
    this.activeTimbres = {};
    this.lotterySchedule.clear();

    const pool: InstrumentPart[] = ['bass', 'melody', 'accompaniment', 'drums', 'harmony', 'sparkles', 'sfx', 'pianoAccompaniment'];
    const shuffled = this.random.shuffle(pool);

    if (this.config.genre === 'reggae' || this.config.genre === 'foundry') {
        for (let i = 0; i < shuffled.length; i++) {
            this.lotterySchedule.set(shuffled[i], Math.floor(i / 2));
        }
    } else {
        this.lotterySchedule.set(shuffled[0], 0);
        this.lotterySchedule.set(shuffled[1], 0);
        this.lotterySchedule.set(shuffled[2], 3);
        this.lotterySchedule.set(shuffled[3], 3);
        for (let i = 4; i < shuffled.length; i++) {
            this.lotterySchedule.set(shuffled[i], 6);
        }
    }

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

    const impro = (this.config.selectedCompositionIds || []).length === 0;
    this.config.isImprovising = impro;

    const axioms = this.config.cloudAxioms || [];
    const anchor = this.config.activeAnchorId;
    const useH = this.config.useHeritage;

    if (this.config.genre === 'blues') {
        this.bluesBrain = new BluesBrain(this.config.seed, this.config.mood, this.config.sessionLickHistory, axioms, this.config.selectedCompositionIds, anchor, this.config.genre, useH);
        this.ambientBrain = null; this.tranceBrain = null; this.reggaeBrain = null; this.foundryBrain = null;
    } else if (this.config.genre === 'psybient') {
        this.tranceBrain = new TranceBrain(this.config.seed, this.config.mood, this.config.genre, useH);
        this.tranceBrain.updateCloudAxioms(axioms, anchor, useH, impro);
        this.bluesBrain = null; this.ambientBrain = null; this.reggaeBrain = null; this.foundryBrain = null;
    } else if (this.config.genre === 'reggae') {
        this.reggaeBrain = new ReggaeBrain(this.config.seed, this.config.mood, this.config.genre, useH);
        this.reggaeBrain.updateCloudAxioms(axioms, anchor, useH, impro);
        this.bluesBrain = null; this.ambientBrain = null; this.tranceBrain = null; this.foundryBrain = null;
    } else if (this.config.genre === 'foundry') {
        this.foundryBrain = new DarkFoundryBrain(this.config.seed, this.config.mood, this.config.genre, useH);
        this.foundryBrain.updateCloudAxioms(axioms, anchor, useH, impro);
        this.bluesBrain = null; this.ambientBrain = null; this.tranceBrain = null; this.reggaeBrain = null;
    } else {
        this.ambientBrain = new AmbientBrain(this.config.seed, this.config.mood, this.config.genre, useH);
        this.ambientBrain.updateCloudAxioms(axioms, anchor, useH, impro);
        this.bluesBrain = null; this.tranceBrain = null; this.reggaeBrain = null; this.foundryBrain = null;
    }

    this.config.tempo = this.suiteDNA.baseTempo;
    this.isInitialized = true;
  }

  private calculateBeautyScore(events: FractalEvent[]): number {
      if (events.length < 2) return 0.5;
      let totalResonance = 0;
      let comparisons = 0;
      const tonalEvents = events.filter(e => ['melody', 'bass', 'accompaniment'].includes(e.type as string));
      if (tonalEvents.length < 2) return 0.6;
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
      trackName?: string,
      dynasty?: string,
      newBpm?: number,
      totalBars?: number
  } {
    if (!this.navigator || !this.suiteDNA) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };
    this.epoch = barCount;

    if (this.epoch >= this.navigator.totalBars) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };

    const navInfo = this.navigator.tick(this.epoch);
    if (!navInfo) return { events: [], instrumentHints: {}, beautyScore: 0, tension: 0.5 };

    const instrumentHints: InstrumentHints = { };
    let tension = this.suiteDNA.tensionMap[this.epoch % this.suiteDNA.tensionMap.length] ?? 0.5;

    let currentInstructions: any | undefined;
    const stages = navInfo.currentPart.stagedInstrumentation;

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
    const isIntro = navInfo.currentPart.id === 'INTRO' || navInfo.currentPart.id === 'PROLOGUE';

    Object.keys(activeLayers).forEach(layer => {
        const part = layer as InstrumentPart;
        if (activeLayers[part] && !this.activatedParts.has(part)) {
            let shouldActivate = false;

            if (isIntro && this.lotterySchedule.has(part)) {
                if (this.epoch >= this.lotterySchedule.get(part)!) {
                    shouldActivate = true;
                }
            } else if (!isIntro) {
                const rule = currentInstructions ? currentInstructions[part] : null;
                if (this.random.next() < (rule ? (rule.activationChance ?? 1.0) : 1.0)) {
                    shouldActivate = true;
                }
            }

            if (shouldActivate) {
                this.activatedParts.add(part);
                const rule = currentInstructions ? currentInstructions[part] : null;
                const options = rule ? (rule.instrumentOptions || rule.v2Options || rule.options || []) : [];

                let defaultInst = 'synth';
                if (part === 'bass') {
                    if (this.config.genre === 'psybient' || this.config.genre === 'foundry') defaultInst = 'bass_house';
                    else if (this.config.genre === 'reggae') defaultInst = 'bass_jazz_warm';
                    else defaultInst = 'bass_jazz_warm';
                }
                else if (part === 'melody') {
                    if (this.config.genre === 'psybient' || this.config.genre === 'foundry') defaultInst = 'synth';
                    else if (this.config.genre === 'reggae') defaultInst = 'telecaster';
                    else defaultInst = 'organ_soft_jazz';
                }
                else if (part === 'accompaniment') {
                    if (this.config.genre === 'reggae') defaultInst = 'organ_prog';
                    else defaultInst = 'synth_ambient_pad_lush';
                }
                else if (part === 'harmony') {
                    if (this.config.genre === 'reggae' || this.config.genre === 'foundry') defaultInst = 'guitarChords';
                    else if (this.config.genre === 'blues') defaultInst = 'guitarChords';
                    else defaultInst = 'guitarChords';
                }
                else if (part === 'pianoAccompaniment') {
                    defaultInst = 'ep_rhodes_warm';
                }

                const rawTimbre = pickWeightedDeterministic(options, this.config.seed, this.epoch, 500) || defaultInst;
                this.activeTimbres[part] = resolveSemanticTimbre(rawTimbre, tension, part, this.config.genre);
            }
        }
    });

    this.activatedParts.forEach(part => {
        const isTransition = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');
        if ((navInfo.currentPart.layers as any)[part] || isTransition) {
            instrumentHints[part] = this.activeTimbres[part] || 'synth';
        }
    });

    const foundChord = this.suiteDNA.harmonyTrack.find(chord => this.epoch >= chord.bar && this.epoch < chord.bar + chord.durationBars);
    let currentChord: GhostChord = foundChord || this.previousChord || this.suiteDNA.harmonyTrack[0];
    this.previousChord = currentChord;

    let result: any;
    if (this.config.genre === 'psybient' && this.tranceBrain) {
        result = this.tranceBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints);
    } else if (this.config.genre === 'reggae' && this.reggaeBrain) {
        result = this.reggaeBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints);
    } else if (this.config.genre === 'foundry' && this.foundryBrain) {
        result = this.foundryBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints);
    } else if (this.config.genre === 'blues' && this.bluesBrain) {
        result = this.bluesBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints);
    } else {
        result = this.ambientBrain ? this.ambientBrain.generateBar(this.epoch, currentChord, navInfo, this.suiteDNA, instrumentHints) : { events: [] };
    }

    if (result.instrumentOverrides) {
        Object.assign(instrumentHints, result.instrumentOverrides);
    }

    this.lastEvents = [...result.events];
    const barBeauty = this.calculateBeautyScore(result.events);

    return {
        ...result,
        instrumentHints,
        beautyScore: barBeauty,
        tension,
        navInfo,
        trackName: result.trackName, 
        dynasty: this.suiteDNA.dynasty,
        lickId: result.lickId,
        mutationType: result.mutationType,
        activeAxioms: result.activeAxioms,
        narrative: result.narrative,
        newBpm: result.newBpm,
        totalBars: this.navigator.totalBars
    };
  }

  public generateExternalImpulse() {}
}
