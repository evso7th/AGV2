/**
@fileOverview Trance Brain V27.0 — "The Absolute Cyber Clone".
#ЗАЧЕМ: 100% клонирование логики Cyber Blues для обеспечения стабильности Neuro Space.
#ЧТО: Полная репликация V1.5 CyberBluesBrain с адаптацией имен классов.
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
  Phrasing,
  Genre
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

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const HEAVY_BLUES_GENRES = ['blues', 'heavy_blues_rock', 'garage_blues', 'stoner_rock', 'blues_rock'];

export interface TranceBrainConfig {
  tempo: number;
  rootNote: number;
  emotion: {
    melancholy: number;
    darkness: number;
    aggression?: number;
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

export const DEFAULT_CONFIG: TranceBrainConfig = {
  tempo: 82,
  rootNote: 55,
  genre: 'heavy_blues_rock',
  useHeritage: true,
  isImprovising: false,
  emotion: {
    melancholy: 0.35,
    darkness: 0.85,
    aggression: 0.75
  }
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class TranceBrain {
  private config: TranceBrainConfig;
  private seed: number;
  private mood: Mood;
  private genre: Genre;
  private random: any;
  private currentAxiom: any[] = [];
  private currentAxiomMaxTick: number = 0;
  private currentTimeScale: number = 1;
  private currentNativeRoot: number | null = null;
  private currentPreferredInstrument: string | null = null;
  private currentBassAxiom: any[] = [];
  private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
  private currentLickId: string = '';
  private currentTrackName: string = 'Local';
  private sessionAnchorId: string | null = null;
  private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
  private soloistBusyUntilBar: number = -1;
  private soloistRestUntilBar: number = -1;
  private currentTransposition: number = 0;
  private microTransposition: number = 0;
  private lickHistory: string[] = [];
  private cloudAxioms: any[] = [];
  private activeAnchorId: string | null = null;
  private state: BluesCognitiveState & {
    lastMutationType: string,
    lastTension: number,
    recentLicks: string[],
    lastPlayedOffset: number
  };

  private readonly MELODY_CEILING = 71;

  constructor(
    seed: number,
    mood: Mood,
    genre: Genre,
    useHeritage: boolean = true
  ) {
    this.seed = seed;
    this.mood = mood;
    this.genre = genre;
    this.random = this.createSeededRandom(seed);
    this.config = {
      ...DEFAULT_CONFIG,
      sessionLickHistory: [],
      cloudAxioms: [],
      selectedCompositionIds: [],
      activeAnchorId: null,
      genre: genre || 'psybient',
      useHeritage: useHeritage,
      isImprovising: true,
      emotion: {
        melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.55 : 0.25,
        darkness: ['dark', 'gloomy'].includes(mood) ? 0.9 : 0.65,
        aggression: ['epic', 'enthusiastic', 'dark'].includes(mood) ? 0.85 : 0.55
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
      recentLicks: [],
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

  private wrapMelody(midi: number): number {
    let v = midi;
    if (!isFinite(v)) return 60;
    while (v > this.MELODY_CEILING) v -= 12;
    return v;
  }

  public updateCloudAxioms(
    axioms: any[],
    activeAnchorId?: string | null,
    useHeritage?: boolean,
    isImprovising?: boolean
  ) {
    this.cloudAxioms = axioms || [];
    this.config.cloudAxioms = axioms;
    if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
    if (useHeritage !== undefined) this.useHeritage = useHeritage;
    if (isImprovising !== undefined) this.isImprovising = isImprovising;
    if (this.config.cloudAxioms.length > 0 && this.useHeritage) {
      this.soloistBusyUntilBar = -1;
    }
  }

  private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
    if (totalBars <= 0) return 0;
    const startOffset = calculateMusiNum(this.seed, 13, 0, totalBars);
    if (this.isImprovising) {
      return calculateMusiNum(epoch + startOffset, 11, this.seed, totalBars);
    }
    const barsElapsed = epoch - startEpoch;
    return (barsElapsed + startOffset) % totalBars;
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
    this.currentNativeRoot = null;
    this.currentPreferredInstrument = null;
    this.ensembleStatus = 'ADAPTIVE';

    if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

    const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
    let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
    let filteredPool: any[] = [];

    if (effectiveAnchor) {
      filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
    } else {
      filteredPool = poolToUse.filter(ax => {
        const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
        const axMoods = (Array.isArray(ax.mood) ? ax.mood : [ax.mood]).filter((m: any) => m != null && m !== '');
        const isHeavyBlues = axGenres.some((g: string) => HEAVY_BLUES_GENRES.includes(g));
        return isHeavyBlues && (axMoods.length === 0 || axMoods.includes(this.mood));
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
    if (isSoloistFree && this.soloistRestUntilBar <= epoch) {
      if (this.random.next() < 0.08 || tension < 0.1) this.soloistRestUntilBar = epoch + 1;
    }
    const isSoloistResting = epoch < this.soloistRestUntilBar;

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
      instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', this.config.genre);
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
            if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, this.config.genre);
            events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord)));
            usedTargetLayers.add(target);
          }
        }
      });

      if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
        const adaptiveAcc = this.renderPowerChordAccompaniment(epoch, resChord, tension, melodyEvents);
        adaptiveAcc.forEach(e => e.pan = 0.1);
        events.push(...adaptiveAcc.flatMap(e => this.rippleLongNote(e, resChord)));
        usedTargetLayers.add('accompaniment');
      }
    }

    if (hints.harmony && !usedTargetLayers.has('harmony')) {
      const h = this.renderGenerativeHarmony(resChord, epoch, tension);
      if (h.length > 0) {
        events.push(...h.flatMap(e => this.rippleLongNote(e, resChord)));
        usedTargetLayers.add('harmony');
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

    events.push(...this.renderAtmosphericEvents(epoch, tension));

    events.forEach(e => { if (!e.params) e.params = {}; e.params.tension = tension; });
    return {
      events, tension, beautyScore: 0.5, trackName: this.currentTrackName, mutationType: this.state.lastMutationType, newBpm, instrumentOverrides,
      activeAxioms: {
        melody: isSoloistResting ? 'Breath' : this.currentLickId,
        ensemble: `${this.ensembleStatus}`,
        bass: this.currentBassAxiom.length > 0 ? 'Sibling DNA' : 'Heavy Riff'
      },
      narrative: `Heavy Rock-Blues: ${this.currentTrackName} [Mut: ${this.state.lastMutationType.toUpperCase()}]`
    };
  }

  private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = chord.rootNote + 12 + this.currentTransposition + this.microTransposition;
    const isMinor = chord.chordType === 'minor';
    const intervals = isMinor ? [0, 3, 7] : [0, 4, 7];
    const events: FractalEvent[] = [];
    const grid = [4.5, 10.5]; 
    const gate = 0.3 + (tension * 0.4); 
    grid.forEach(t => {
      if (this.random.next() < gate) {
        intervals.forEach(interval => {
          events.push({
            type: 'harmony',
            note: this.constrainAccompanimentOctave(root + interval),
            time: t * TICK_TO_BEAT,
            duration: 0.25 * TICK_TO_BEAT,
            weight: 0.65,
            technique: 'hit',
            dynamics: 'mf',
            phrasing: 'staccato',
            chordName: isMinor ? 'Am' : 'A'
          });
        });
      }
    });
    return events;
  }

  private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    if (this.random.next() < 0.15) {
      events.push({
        type: 'sfx',
        note: 60,
        time: this.random.next() * 3,
        duration: 4.0,
        weight: 0.7,
        technique: 'hit',
        dynamics: 'p',
        phrasing: 'legato',
        params: { 
          mood: this.mood, 
          genre: this.config.genre, 
          rules: { categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] } 
        }
      });
    }
    const sparkleChance = 0.3 + (tension * 0.4);
    if (this.random.next() < sparkleChance) {
      const count = tension > 0.6 ? this.random.nextInt(3) + 1 : 1;
      for (let i = 0; i < count; i++) {
        events.push({
          type: 'sparkle',
          note: 60 + this.random.nextInt(12),
          time: this.random.next() * 3.8,
          duration: 4.0,
          weight: 0.8 + (this.random.next() * 0.2),
          technique: 'hit',
          dynamics: 'p',
          phrasing: 'legato',
          params: { category: this.random.next() < 0.5 ? 'ORGANIC' : 'MELODIC' }
        });
      }
    }
    return events;
  }

  private renderPowerChordAccompaniment(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + this.currentTransposition + this.microTransposition;
    const intervals = [0, 7, 12];
    const isSoloistBusy = melodyEvents.length > 3;

    if (isSoloistBusy) {
      [0, 3, 6, 9].forEach(t => {
        intervals.forEach(interval => {
          events.push({
            type: 'accompaniment',
            note: this.constrainAccompanimentOctave(root + interval),
            time: t * TICK_TO_BEAT,
            duration: 2.6 * TICK_TO_BEAT,
            weight: 0.75 + (tension * 0.15),
            technique: 'hit',
            dynamics: 'f',
            phrasing: 'staccato',
            params: { attack: 0.005, release: 0.35, drive: 0.7 }
          });
        });
      });
    } else {
      [0, 6].forEach(t => {
        intervals.forEach(interval => {
          events.push({
            type: 'accompaniment',
            note: this.constrainAccompanimentOctave(root + interval),
            time: t * TICK_TO_BEAT,
            duration: 5.5 * TICK_TO_BEAT,
            weight: 0.6 + (tension * 0.2),
            technique: 'swell',
            dynamics: 'mf',
            phrasing: 'legato',
            params: { attack: 0.8, release: 2.0, drive: 0.55 }
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
      const tech: Technique = tension > 0.4 ? 'bn' : 'pick';
      events.push({
        type: 'melody',
        note: this.wrapMelody(rawNote),
        time: t * TICK_TO_BEAT,
        duration: 2.2 * TICK_TO_BEAT,
        weight: 0.75 + (tension * 0.15),
        technique: tech,
        dynamics: 'mf',
        phrasing: 'legato'
      });
    });
    return events;
  }

  private renderHybridDrums(epoch: number, tension: number, isSoloistResting: boolean): FractalEvent[] {
    const events: FractalEvent[] = [];
    events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 1.2, technique: 'hit', dynamics: 'ff', phrasing: 'staccato' });
    events.push({ type: 'drum_kick_reso', note: 36, time: 4.5 * TICK_TO_BEAT, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
    events.push({ type: 'drum_kick_reso', note: 36, time: 9 * TICK_TO_BEAT, duration: 0.1, weight: 1.1, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });

    [3, 9].forEach(t => events.push({
      type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1,
      weight: 1.1, technique: 'hit', dynamics: 'ff', phrasing: 'staccato'
    }));

    [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].forEach(t => {
      const isCrash = (t === 0 && (epoch % 4 === 0 || tension > 0.7));
      events.push({
        type: isCrash ? 'drum_crash2' : 'drum_25693__walter_odington__hackney-hat-1',
        note: isCrash ? 49 : 42,
        time: t * TICK_TO_BEAT,
        duration: isCrash ? 1.5 : 0.1,
        weight: isCrash ? 0.9 : 0.45,
        technique: 'hit'
      });
    });

    const isFourthBar = epoch % 4 === 3;
    if (isFourthBar || isSoloistResting) {
      const tomSequence = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
      [9, 10, 11].forEach((t, i) => events.push({
        type: tomSequence[i] as any, note: 40, time: t * TICK_TO_BEAT, duration: 0.5,
        weight: (0.8 + i * 0.1), technique: 'hit', pan: -0.8 + (i * 0.8)
      }));
    }

    return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
    const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
    const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
    const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
    const barOffset = mosaicBar * (TICKS_PER_BAR / timeScale);
    const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
    const goldenTicks = [0, 3, 6, 9];
    const useNarrativeFilter = barNotes.length > 3;

    return barNotes.map((n) => {
      const relativeTick = n.t - barOffset;
      const isGolden = goldenTicks.some(gt => Math.abs(relativeTick - gt) < 0.1);
      let weight = 0.85;
      let durationScale = 1.0;
      let tech: Technique = 'pick';
      if (n.tech === 'bn' || n.tech === 'vb') tech = 'bn';
      else if (n.tech === 'ds') tech = 'ds';
      else if (n.tech === 'sl') tech = 'sl';

      if (useNarrativeFilter) {
        if (isGolden) {
          weight = 1.0;
          durationScale = 2.5;
          tech = 'bn';
        } else {
          weight = 0.35;
          durationScale = 0.5;
          tech = 'pick';
        }
      } else {
        weight = isGolden ? 1.0 : 0.75;
        durationScale = isGolden ? 2.0 : 1.0;
        if (isGolden) tech = 'bn';
      }

      const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition;
      return {
        type: type as any,
        note: this.wrapMelody(rawNote),
        time: relativeTick * TICK_TO_BEAT * timeScale,
        duration: (n.d * TICK_TO_BEAT * timeScale) * durationScale,
        weight,
        technique: tech,
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
      if (notes.length > 0) {
        notes = this.applyMutationLogic(notes, tension, this.seed + epoch);
        return notes.map(n => ({
          type: 'bass',
          note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition),
          time: (n.t - barOffset) * TICK_TO_BEAT,
          duration: n.d * TICK_TO_BEAT,
          weight: 0.9,
          technique: 'pick',
          params: { drive: 0.6 }
        }));
      }
    }
    return this.renderHeavyRiffBass(chord, epoch, tension);
  }

  private renderHeavyRiffBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition;
    const barInRiff = epoch % 4;
    const riff = [
      [{ t: 0, n: root }, { t: 3, n: root }, { t: 6, n: root + 7 }, { t: 9, n: root }],
      [{ t: 0, n: root }, { t: 4.5, n: root + 7 }, { t: 6, n: root }, { t: 9, n: root + 3 }],
      [{ t: 0, n: root + 7 }, { t: 3, n: root + 5 }, { t: 6, n: root }, { t: 9, n: root + 10 }],
      [{ t: 0, n: root }, { t: 3, n: root }, { t: 6, n: root + 3 }, { t: 9, n: root + 4 }]
    ];
    return riff[barInRiff].map(p => ({
      type: 'bass',
      note: this.constrainBassOctave(p.n),
      time: p.t * TICK_TO_BEAT,
      duration: 2.5 * TICK_TO_BEAT,
      weight: 0.95,
      technique: 'pick',
      params: { drive: 0.65 }
    }));
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
        type: type,
        note: finalNote,
        time: (n.t - barOffset) * TICK_TO_BEAT,
        duration: Math.min(n.d, 6) * TICK_TO_BEAT,
        weight: 0.7,
        technique: 'hit',
        params: { attack: n.params?.attack, release: n.params?.release, drive: 0.5 }
      };
    });
  }

  private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
    const events: FractalEvent[] = [];
    if (melodyEvents.length > 0) {
      melodyEvents.forEach((m, i) => {
        if (i % 2 === 0) events.push({
          ...m,
          type: 'pianoAccompaniment',
          note: this.wrapMelody(m.note + (chord.chordType === 'minor' ? 3 : 4)),
          weight: 0.65,
          technique: 'hit'
        });
      });
      return { events, style: 'Shadow Support' };
    }
    return { events: [], style: 'none' };
  }

  private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + this.currentTransposition + this.microTransposition;
    const scale = [0, 2, 4, 5, 7, 9, 11];
    [0, 3, 6, 9].forEach((t, i) => events.push({
      type: 'bass',
      note: this.constrainBassOctave(root - 12 + scale[i % scale.length]),
      time: t * TICK_TO_BEAT,
      duration: 3.0 * TICK_TO_BEAT,
      weight: 0.7,
      technique: 'pick',
      params: { drive: 0.5 }
    }));
    events.push({
      type: 'accompaniment',
      note: this.constrainAccompanimentOctave(root + 12),
      time: 0,
      duration: 4.0,
      weight: 0.4,
      technique: 'hit',
      params: { drive: 0.6 }
    });
    return events;
  }

  private constrainBassOctave(note: number): number { 
      let n = note; 
      if(!isFinite(n)) return 36; 
      while (n > 47) n -= 12; 
      while (n < 28) n += 12; 
      return n; 
  }
  private constrainAccompanimentOctave(note: number): number { let n = note; if(!isFinite(n)) return 60; while (n > 71) n -= 12; while (n < 48) n += 12; return n; }
}
