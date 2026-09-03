/**
 * @fileOverview Blues Brain V84.1 — "Velvet Standard".
 * #ЗАЧЕМ: Реализация октавного заслона (MIDI 71) для мягкого звучания.
 */

import {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState,
  CommonMood,
  InstrumentPart,
  Technique,
  Dynamics,
  Phrasing
} from '@/types/music';
import {
    DEGREE_TO_SEMITONE,
    decompressCompactPhrase,
    calculateMusiNum,
    normalizeStr,
    pickWeightedDeterministic,
    repairLegacyPhrase,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    mergeIdenticalNotes,
    keyToMidiRoot,
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT
} from './music-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface BluesBrainConfig {
  tempo: number;
  rootNote: number;
  emotion: {
    melancholy: number;
    darkness: number;
  };
  sessionLickHistory?: string[];
  cloudAxioms?: any[];
  selectedCompositionIds?: string[];
  activeAnchorId?: string | null;
  activeAnchorRoot?: number | null;
  genre: string;
  useHeritage: boolean;
  isImprovising: boolean;
}

export const DEFAULT_CONFIG: BluesBrainConfig = {
  tempo: 72,
  rootNote: 55,
  genre: 'blues',
  useHeritage: true,
  isImprovising: false,
  emotion: { melancholy: 0.82, darkness: 0.25 }
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class BluesBrain {
  private config: BluesBrainConfig;
  private seed: number;
  private mood: Mood;
  private random: any;

  private currentAxiom: any[] = [];
  private currentAxiomMaxTick: number = 0;
  private currentTimeScale: number = 1;
  private currentNativeRoot: number | null = null;
  private currentPreferredInstrument: string | null = null;

  private currentBassAxiom: any[] = [];
  private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
  private currentDrumAxioms: { phrase: any[], role: string }[] = [];

  private currentLickId: string = '';
  private currentTrackName: string = 'Local';
  private sessionAnchorId: string | null = null; 
  private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';

  private soloistBusyUntilBar: number = -1;
  private soloistRestUntilBar: number = -1;

  private currentTransposition: number = 0;
  private microTransposition: number = 0;

  private activeHarmonyInstrument: 'violin' | 'guitarChords' = 'guitarChords';
  private lickHistory: string[] = [];

  private state: BluesCognitiveState & {
      lastMutationType: string,
      lastTension: number,
      recentLicks: string[],
      lastPlayedOffset: number
  };

  // #ЗАЧЕМ: Вельветовый Стандарт. Ограничение 4-й октавой.
  private readonly MELODY_CEILING = 71;

  constructor(
      seed: number,
      mood: Mood,
      sessionLickHistory?: string[],
      cloudAxioms?: any[],
      selectedCompositionIds?: string[],
      activeAnchorId?: string | null,
      genre?: string,
      useHeritage: boolean = true
  ) {
    this.seed = seed;
    this.mood = mood;
    this.random = this.createSeededRandom(seed);

    this.config = {
      ...DEFAULT_CONFIG,
      sessionLickHistory: sessionLickHistory || [],
      cloudAxioms: cloudAxioms || [],
      selectedCompositionIds: selectedCompositionIds || [],
      activeAnchorId: activeAnchorId || null,
      genre: genre || 'blues',
      useHeritage: useHeritage,
      isImprovising: (selectedCompositionIds || []).length === 0,
      emotion: {
        melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4,
        darkness: ['dark', 'gloomy'].includes(mood) ? 0.35 : 0.2
      }
    };

    this.state = {
      phraseState: 'call',
      tensionLevel: 0.3,
      phraseHistory: [],
      pianoHistory: [],
      accompHistory: [],
      mesoHistory: [],
      macroHistory: [],
      lastPhraseHash: '',
      lastLickId: '',
      blueNotePending: false,
      emotion: { ...this.config.emotion },
      stagnationStrikes: { micro: 0, meso: 0, macro: 0 },
      lastMutationType: 'none',
      lastTension: 0.5,
      recentLicks: [...(sessionLickHistory || [])],
      lastPlayedOffset: -1
    };
  }

  private createSeededRandom(seed: number) {
    let state = seed;
    const next = () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
    return { next, nextInt: (max: number) => Math.floor(next() * max) };
  }

  // #ЗАЧЕМ: ПЛАН №1480. Октавный враппинг для мелодии.
  private wrapMelody(midi: number): number {
    let v = midi;
    while (v > this.MELODY_CEILING) v -= 12;
    return v;
  }

  public updateCloudAxioms(axioms: any[], selectedCompositionIds?: string[], activeAnchorId?: string | null, activeAnchorRoot?: number | null, useHeritage?: boolean, isImprovising?: boolean) {
      const wasEmpty = !this.config.cloudAxioms || this.config.cloudAxioms.length === 0;
      this.config.cloudAxioms = axioms;
      this.config.selectedCompositionIds = selectedCompositionIds || [];
      if (activeAnchorId !== undefined) this.config.activeAnchorId = activeAnchorId;
      if (activeAnchorRoot !== undefined) this.config.activeAnchorRoot = activeAnchorRoot;
      if (this.config.activeAnchorId === null) this.sessionAnchorId = null;
      if (useHeritage !== undefined) this.config.useHeritage = useHeritage;
      if (isImprovising !== undefined) this.config.isImprovising = isImprovising;

      if (wasEmpty && this.config.cloudAxioms.length > 0 && this.config.useHeritage) {
          this.soloistBusyUntilBar = -1;
      }
  }

  private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
      if (totalBars <= 0) return 0;
      const startOffset = calculateMusiNum(this.seed, 13, 0, totalBars);
      if (this.config.isImprovising) {
          return calculateMusiNum(epoch + startOffset, 11, this.seed, totalBars);
      }
      const barsElapsed = epoch - startEpoch;
      return (barsElapsed + startOffset) % totalBars;
  }

  private selectHarmonyInstrument(epoch: number, tension: number, hasHeritageStrings: boolean) {
      this.activeHarmonyInstrument = 'guitarChords';
  }

  private rippleLongNote(e: FractalEvent, chord: GhostChord): FractalEvent[] {
    if (e.duration < 3.5) return [e]; 

    const rippled: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const ripplePool = isMinor ? [0, 3, 7, 8, 10] : [0, 4, 7, 9, 11]; 
    
    const numChunks = Math.ceil(e.duration / 1.5); 
    const chunkDur = e.duration / numChunks;
    const baseOctaveMidi = Math.floor(e.note / 12) * 12;

    for (let i = 0; i < numChunks; i++) {
        let note: number;
        if (i === 0) {
            note = e.note;
        } else {
            const seedOffset = Math.floor(e.time * 12);
            const idx = calculateMusiNum(seedOffset + i, 13, this.seed, ripplePool.length);
            note = baseOctaveMidi + ripplePool[idx];
        }

        const rawType = Array.isArray(e.type) ? e.type[0] : e.type;
        let finalNote = note;
        
        if (rawType === 'bass') finalNote = this.constrainBassOctave(note);
        else if (rawType === 'melody' || rawType === 'pianoAccompaniment') finalNote = this.wrapMelody(note);
        else finalNote = this.constrainAccompanimentOctave(note);

        rippled.push({
            ...e,
            note: finalNote,
            time: e.time + (i * chunkDur),
            duration: chunkDur * 1.15,
            params: { 
                ...e.params, 
                attack: i === 0 ? (e.params?.attack || 0.5) : 0.8,
                release: 2.5 
            }
        });
    }
    return rippled;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
      this.currentAxiom = [];
      this.currentBassAxiom = [];
      this.currentAccompAxioms = [];
      this.currentDrumAxioms = [];
      this.currentNativeRoot = null;
      this.currentPreferredInstrument = null;
      this.ensembleStatus = 'ADAPTIVE';

      if (!this.config.useHeritage || !this.config.cloudAxioms || this.config.cloudAxioms.length === 0) return undefined;

      const poolToUse = this.config.cloudAxioms.filter(ax => ax.ignored !== true);
      let effectiveAnchor = this.config.activeAnchorId ? normalizeStr(this.config.activeAnchorId) : this.sessionAnchorId;
      
      let filteredPool: any[] = [];
      if (effectiveAnchor) {
          filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
      } else {
          filteredPool = poolToUse.filter(ax => {
              const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
              const axMoods = (Array.isArray(ax.mood) ? ax.mood : [ax.mood]).filter((m: any) => m != null && m !== '');
              return axGenres.includes('blues') && (axMoods.length === 0 || axMoods.includes(this.mood));
          });
      }

      if (filteredPool.length > 0) {
          let basePool = filteredPool.filter(ax => ax.role === 'melody');
          if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

          if (basePool.length > 0) {
              if (!effectiveAnchor) {
                  const firstChoice = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                  if (firstChoice) {
                      this.sessionAnchorId = normalizeStr(firstChoice.compositionId);
                      effectiveAnchor = this.sessionAnchorId;
                      filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                      basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                  }
              }

              if (basePool.length > 0) {
                  const maxDonorBars = Math.max(4, ...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                  const tension = dna.tensionMap?.[epoch] ?? 0.5;
                  const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                  
                  const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === targetOffset);
                  const freshLicks = sameOffsetPool.filter(ax => !this.lickHistory.includes(ax.id));

                  let selected = null;
                  if (freshLicks.length > 0) {
                      selected = freshLicks[this.random.nextInt(freshLicks.length)];
                  } else if (sameOffsetPool.length > 0) {
                      selected = sameOffsetPool[this.random.nextInt(sameOffsetPool.length)];
                  } else {
                      const anyFresh = basePool.filter(ax => !this.lickHistory.includes(ax.id));
                      selected = anyFresh.length > 0 ? anyFresh[this.random.nextInt(anyFresh.length)] : basePool[0];
                  }

                  if (selected) {
                      this.lickHistory.push(selected.id);
                      if (this.lickHistory.length > 50) this.lickHistory.shift();

                      this.currentTrackName = selected.compositionId;
                      this.currentLickId = selected.id || 'DNA-Lick';
                      this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                      this.currentPreferredInstrument = selected.preferredInstrument || null;
                      
                      let rawPhrase = decompressCompactPhrase(selected.phrase);
                      if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);

                      const cid = normalizeStr(selected.compositionId);
                      const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                      if (bassSibling) this.currentBassAxiom = decompressCompactPhrase(bassSibling.phrase);

                      const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                      this.currentAccompAxioms = accompSiblings.map(ax => ({
                          phrase: decompressCompactPhrase(ax.phrase),
                          role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument
                      }));

                      const baseBars = selected.bars || 4;
                      this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                      this.currentAxiom = rawPhrase;
                      this.soloistBusyUntilBar = epoch + baseBars;
                      this.ensembleStatus = 'SIBLING';
                      return selected.nativeBpm || undefined;
                  }
              }
          }
      }
      this.currentTrackName = 'Generative';
      this.soloistBusyUntilBar = epoch + 4;
      return undefined;
  }

  private applyMutationLogic(phrase: any[], tension: number, seed: number): any[] {
      let notes = [...phrase];
      if (this.state.lastMutationType === 'inversion') notes = invertPhrase(notes);
      else if (this.state.lastMutationType === 'retrograde') notes = retrogradePhrase(notes);
      else if (this.state.lastMutationType === 'jitter') notes = applyRhythmicJitter(notes, seed);
      
      if (this.state.lastMutationType === 'density_guard' && tension < 0.4) {
          notes = notes.filter((_, i) => i % 2 === 0);
      }

      if (this.state.lastMutationType === 'velocity_curve') {
          const total = notes.length;
          notes = notes.map((n, i) => {
              const p = i / (total || 1);
              return {
                  ...n,
                  params: {
                      ...n.params,
                      attack: 0.02 + (1 - p) * 0.15, 
                      release: 0.4 + p * 1.5        
                  },
                  phrasing: p < 0.5 ? 'legato' : 'staccato'
              };
          });
      }
      return notes;
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): any {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    this.state.lastTension = tension;
    const isBridge = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');

    this.currentTimeScale = navInfo.currentPart.instrumentRules?.melody?.timeScale || 1;

    if (navInfo.isPartTransition) {
        this.soloistBusyUntilBar = epoch;
        const shifts = [0, 2, -2, 5, 7, -5];
        this.currentTransposition = shifts[this.random.nextInt(shifts.length)];
        this.microTransposition = 0;
    }

    if (epoch % 4 === 0) {
        const mutationRand = this.random.next();
        const mutationThreshold = this.config.isImprovising ? 0.9 : 0.65;
        if (mutationRand < mutationThreshold * 0.2) {
            this.microTransposition = [-2, 0, 2, 5, -5][this.random.nextInt(5)];
            this.state.lastMutationType = 'transpose';
        }
        else if (mutationRand < mutationThreshold * 0.4) this.state.lastMutationType = 'inversion';
        else if (mutationRand < mutationThreshold * 0.6) this.state.lastMutationType = 'retrograde';
        else if (mutationRand < mutationThreshold * 0.75) this.state.lastMutationType = 'jitter';
        else if (mutationRand < mutationThreshold * 0.85) this.state.lastMutationType = 'density_guard';
        else if (mutationRand < mutationThreshold) this.state.lastMutationType = 'velocity_curve';
        else this.state.lastMutationType = 'none';
    }

    const isSoloistFree = epoch >= this.soloistBusyUntilBar;
    if (isSoloistFree && this.soloistRestingUntilBar <= epoch) {
        if (this.random.next() < 0.08 || tension < 0.1) this.soloistRestingUntilBar = epoch + 1; 
    }
    const isSoloistResting = epoch < this.soloistRestingUntilBar;

    let newBpm: number | undefined;
    if (isSoloistFree && !isSoloistResting && !isBridge) {
        newBpm = this.selectNextAxiom(navInfo, dna, epoch);
    }

    const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
    const resChord = { ...currentChord, rootNote: resRoot };
    const events: FractalEvent[] = [];

    if (isBridge) {
        const bridgeEvents = this.renderLiquidBridge(epoch, resChord, tension, hints);
        bridgeEvents.forEach(e => { if (!e.params) e.params = {}; e.params.tension = tension; });
        return { events: bridgeEvents, lickId: 'Liquid Bridge', trackName: this.currentTrackName, activeAxioms: { melody: 'Bridge Flow' } };
    }

    if (hints.drums) events.push(...this.renderHybridDrums(epoch, tension, isSoloistResting));

    const bassEvents = hints.bass ? this.renderSymbioticBass(resChord, epoch, tension, dna) : [];
    events.push(...bassEvents.flatMap(e => this.rippleLongNote(e, resChord)));

    const usedTargetLayers = new Set<string>();
    const instrumentOverrides: Partial<InstrumentHints> = {};

    if (this.currentPreferredInstrument && hints.melody && !isSoloistResting) {
        instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'blues');
    }

    let melodyEvents: FractalEvent[] = [];
    if (hints.melody && !isSoloistResting) {
        if (this.currentAxiom.length > 0 && epoch < this.soloistBusyUntilBar) {
            let activeAxiom = this.applyMutationLogic(this.currentAxiom, tension, this.seed + epoch);
            melodyEvents = this.renderMelodicSegment(epoch, resChord, dna, 'melody', activeAxiom, this.currentAxiomMaxTick, this.currentTimeScale, tension);
        }
        if (melodyEvents.length === 0) melodyEvents = this.renderGapFiller(epoch, resChord, tension);
        melodyEvents.forEach(e => e.pan = -0.15);
        events.push(...melodyEvents.flatMap(e => this.rippleLongNote(e, resChord)));
    }

    if (!isSoloistResting) {
        this.currentAccompAxioms.forEach((ax) => {
            const rawRole = ax.role.toLowerCase(); 
            let target: InstrumentPart | null = rawRole.includes('piano') ? 'pianoAccompaniment' : (rawRole.includes('accomp') ? 'accompaniment' : null);
            if (target && hints[target] && !usedTargetLayers.has(target)) {
                let p = this.applyMutationLogic(ax.phrase, tension, this.seed + epoch + 1);
                const rendered = this.renderHeritageAccompaniment(resChord, epoch, p, target, dna, tension);
                if (rendered.length > 0) {
                    if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'blues');
                    events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord)));
                    usedTargetLayers.add(target);
                }
            }
        });
        if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
            const adaptiveAcc = this.renderConversationalAccompaniment(epoch, resChord, tension, melodyEvents);
            adaptiveAcc.forEach(e => e.pan = 0.1);
            events.push(...adaptiveAcc.flatMap(e => this.rippleLongNote(e, resChord)));
            usedTargetLayers.add('accompaniment');
        }
    }

    if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
        const pResult = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
        if (pResult.events.length > 0) {
            pResult.events.forEach(e => e.pan = 0.2);
            events.push(...pResult.events.flatMap(e => this.rippleLongNote(e, resChord)));
            usedTargetLayers.add('pianoAccompaniment');
        }
    }

    if (hints.harmony && !usedTargetLayers.has('harmony')) {
        if (calculateMusiNum(epoch, 13, this.seed, 10) < 3) {
            this.selectHarmonyInstrument(epoch, tension, false);
            const harmonyEvents = this.renderDerivativeHarmony(resChord, epoch, this.activeHarmonyInstrument);
            harmonyEvents.forEach(e => e.pan = 0.35);
            events.push(...harmonyEvents.flatMap(e => this.rippleLongNote(e, resChord)));
            usedTargetLayers.add('harmony');
        }
    }

    events.forEach(e => { if (!e.params) e.params = {}; e.params.tension = tension; });

    return {
        events, tension, beautyScore: 0.5, trackName: this.currentTrackName, mutationType: this.state.lastMutationType, newBpm, instrumentOverrides,
        activeAxioms: { melody: isSoloistResting ? 'Breath' : this.currentLickId, ensemble: `${this.ensembleStatus}`, bass: this.currentBassAxiom.length > 0 ? 'Sibling DNA' : 'Algorithm' },
        narrative: `Blues Evolution: ${this.currentTrackName} [Mut: ${this.state.lastMutationType.toUpperCase()}]`
    };
  }

  private renderConversationalAccompaniment(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): FractalEvent[] {
      const isSoloistBusy = melodyEvents.length > 3;
      const root = chord.rootNote + 12 + this.currentTransposition + this.microTransposition;
      const isMinor = chord.chordType === 'minor';
      const intervals = isMinor ? [0, 3, 7, 10] : [0, 4, 7, 10]; 
      const events: FractalEvent[] = [];

      if (isSoloistBusy) {
          [1.5, 4.5, 7.5, 10.5].forEach(t => {
              if (calculateMusiNum(epoch + t, 11, this.seed, 10) < (4 + tension * 4)) {
                  intervals.forEach((interval) => {
                      events.push({
                          type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval),
                          time: t * TICK_TO_BEAT, duration: 0.3 * TICK_TO_BEAT, weight: 0.45 + (tension * 0.15),
                          technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { attack: 0.01, release: 0.6 }
                      });
                  });
              }
          });
      } else {
          const startTick = calculateMusiNum(epoch, 3, this.seed, 2) === 0 ? 0 : 3;
          [0, 7].forEach((shift, j) => { 
              intervals.forEach((interval) => {
                  events.push({
                      type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval + shift),
                      time: (startTick + j * 1.5) * TICK_TO_BEAT, duration: 3.0, weight: 0.5 + (tension * 0.2),
                      technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 1.0, release: 2.5 }
                  });
              });
          });
      }
      return events;
  }

  private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 12;
      const scale = [0, 3, 5, 6, 7, 10]; 
      const noteCount = calculateMusiNum(epoch, 3, this.seed, 3) + 1;
      const ticks = [0, 3, 6, 9].sort(() => this.random.next() - 0.5).slice(0, noteCount);
      ticks.forEach(t => {
          const degIdx = calculateMusiNum(epoch + t, 11, this.seed, scale.length);
          const rawNote = root + scale[degIdx] + this.currentTransposition + this.microTransposition;
          events.push({
              type: 'melody', note: this.wrapMelody(rawNote), time: t * TICK_TO_BEAT, duration: 1.8 * TICK_TO_BEAT,
              weight: 0.65 + (tension * 0.15), technique: tension > 0.4 ? 'vb' : 'pick', dynamics: 'p', phrasing: 'legato'
          });
      });
      return events;
  }

  private renderHybridDrums(epoch: number, tension: number, isSoloistResting: boolean): FractalEvent[] {
      const events: FractalEvent[] = [];
      events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 1.05, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
      if (tension > 0.6 || this.random.next() < 0.4) {
          events.push({ type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
      }
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' }));
      [1, 2, 4, 5, 7, 8, 10, 11].forEach(t => { if (this.random.next() < (tension > 0.7 ? 0.65 : 0.45)) events.push({ type: 'drum_snare_ghost_note', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.1 + (this.random.next() * 0.2), technique: 'ghost' }); });
      [0, 3, 6, 9].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.35, technique: 'hit' }));
      if (this.random.next() < 0.05) events.push({ type: 'drum_ride_wetter', note: 51, time: 0, duration: 4.0, weight: 0.4, technique: 'hit' });
      const isFourthBar = epoch % 4 === 3;
      if (isFourthBar || isSoloistResting) {
          const tomSequence = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
          [9, 10, 11].forEach((t, i) => events.push({ type: tomSequence[i] as any, note: 40, time: t * TICK_TO_BEAT, duration: 0.5, weight: (0.8 + i * 0.1), technique: 'hit', pan: -0.8 + (i * 0.8) }));
      }
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
    const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
    const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
    const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
    const barOffset = mosaicBar * (TICKS_PER_BAR / timeScale);
    const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
    
    // #ЗАЧЕМ: ПЛАН №2250. Золотая Нота (supremacy).
    const goldenTicks = [0, 3, 6, 9]; 
    const useNarrativeFilter = barNotes.length > 3;

    return barNotes.map((n) => {
        const relativeTick = n.t - barOffset;
        const isGolden = goldenTicks.some(gt => Math.abs(relativeTick - gt) < 0.1);
        
        let weight = 0.85;
        let durationScale = 1.0;
        let tech = (n.tech === 'vb' ? 'vb' : 'pick');

        if (useNarrativeFilter) {
            if (isGolden) {
                weight = 0.95;
                durationScale = 2.0; 
                tech = 'vb';
            } else {
                weight = 0.30; 
                durationScale = 0.4;
                tech = 'pick';
            }
        } else {
            weight = isGolden ? 0.95 : 0.75;
            durationScale = isGolden ? 1.5 : 1.0;
        }

        const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition;
        return {
            type: type as any, 
            note: this.wrapMelody(rawNote),
            time: relativeTick * TICK_TO_BEAT * timeScale, 
            duration: (n.d * TICK_TO_BEAT * timeScale) * durationScale,
            weight, 
            technique: tech as any, 
            phrasing: (useNarrativeFilter && !isGolden) ? 'staccato' : (n.phrasing || 'legato'),
            params: { attack: n.params?.attack, release: n.params?.release }
        };
    });
  }

  private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
      if (this.currentBassAxiom.length > 0) {
          const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
          const startEpoch = this.soloistBusyUntilBar - totalBars;
          const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
          const barOffset = mosaicBar * TICKS_PER_BAR;
          let notes = this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
          notes = this.applyMutationLogic(notes, tension, this.seed + epoch);
          return notes.map(n => ({ type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8, technique: 'pick' }));
      }
      return tension > 0.7 ? this.renderWalkingBass(chord, epoch) : this.renderRiffBass(chord, epoch);
  }

  private renderRiffBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition;
    const barInRiff = epoch % 4;
    const riff = [ [{ t: 0, n: root }, { t: 4, n: root }, { t: 8, n: root + 7 }], [{ t: 0, n: root }, { t: 6, n: root + 7 }, { t: 9, n: root + 10 }], [{ t: 0, n: root + 7 }, { t: 4, n: root + 5 }, { t: 8, n: root }], [{ t: 0, n: root }, { t: 4, n: root + 3 }, { t: 8, n: root + 4 }] ];
    return riff[barInRiff].map(p => ({ type: 'bass', note: this.constrainBassOctave(p.n), time: p.t * TICK_TO_BEAT, duration: 4 * TICK_TO_BEAT, weight: 0.8, technique: 'pick' }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition;
    return [root, root + 4, root + 7, root + 11].map((p, i) => ({ type: 'bass', note: this.constrainBassOctave(p), time: (i * 3) * TICK_TO_BEAT, duration: 3 * TICK_TO_BEAT, weight: 0.75, technique: 'pick' }));
  }

  private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
      const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
      const startEpoch = this.soloistBusyUntilBar - totalBars;
      const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
      const barOffset = mosaicBar * TICKS_PER_BAR;
      return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => {
          const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition;
          const finalNote = type === 'pianoAccompaniment' ? this.wrapMelody(rawNote) : this.constrainAccompanimentOctave(rawNote);
          return {
              type: type, note: finalNote,
              time: (n.t - barOffset) * TICK_TO_BEAT, duration: Math.min(n.d, 6) * TICK_TO_BEAT, weight: 0.6, technique: 'hit', 
              params: { attack: n.params?.attack, release: n.params?.release }
          };
      });
  }

  private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 12 + this.currentTransposition + this.microTransposition;
      if (melodyEvents.length > 0) {
          melodyEvents.forEach((m, i) => { if (i % 2 === 0) events.push({ ...m, type: 'pianoAccompaniment', note: this.wrapMelody(m.note + (chord.chordType === 'minor' ? 3 : 4)), weight: 0.65, technique: 'hit' }); });
          return { events, style: "Shadow Support" };
      }
      return { events: [], style: "none" };
  }

  private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
      const events: FractalEvent[] = []; 
      const root = chord.rootNote + this.currentTransposition + this.microTransposition; 
      const scale = [0, 2, 4, 5, 7, 9, 11];
      [0, 3, 6, 9].forEach((t, i) => events.push({ type: 'bass', note: this.constrainBassOctave(root - 12 + scale[i % scale.length]), time: t * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.7, technique: 'pick' }));
      events.push({ type: 'accompaniment', note: this.constrainAccompanimentOctave(root + 12), time: 0, duration: 4.0, weight: 0.4, technique: 'hit' });
      return events;
  }

  private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'violin' | 'guitarChords'): FractalEvent[] {
      const rootMidi = currentChord.rootNote + this.currentTransposition + this.microTransposition;
      const note = this.constrainAccompanimentOctave(rootMidi + 12);
      return [{ type: 'harmony', note: note, time: 0, duration: 4.0, weight: 0.35, technique: 'hit', chordName: MIDI_NOTE_NAMES[rootMidi % 12] + (currentChord.chordType === 'minor' ? 'm' : '') }];
  }

  private constrainBassOctave(note: number): number { let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n; }
  private constrainAccompanimentOctave(note: number): number { let n = note; while (n > 71) n -= 12; while (n < 48) n += 12; return n; }
}
