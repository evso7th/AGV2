/**
@fileOverview Trance Brain V27.5 — "Soft Neuro Space".
#ЗАЧЕМ: 1. Мелодия работает точно как в Cyber Blues (Heritage + Golden Notes).
      2. Ритм и база — мягкий транс с киками из Foundry.
      3. Реализация Sidechain-пэдов и Rolling-баса для атмосферности.
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

const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const HEAVY_BLUES_GENRES = ['blues', 'heavy_blues_rock', 'garage_blues', 'stoner_rock', 'blues_rock', 'trance', 'foundry'];

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
  tempo: 124, // Стандарт мягкого транса
  rootNote: 55,
  genre: 'psybient',
  useHeritage: true,
  isImprovising: false,
  emotion: {
    melancholy: 0.35,
    darkness: 0.5,
    aggression: 0.2 // Низкая агрессия для мягкости
  }
};

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
        darkness: ['dark', 'gloomy'].includes(mood) ? 0.7 : 0.4,
        aggression: 0.2
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
    if (this.config.isImprovising) {
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
        // Фильтр для транса
        const isTranceMatch = axGenres.some(g => ['trance', 'psybient', 'ambient', 'foundry'].includes(g));
        return isTranceMatch && (axMoods.length === 0 || axMoods.includes(this.mood));
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
        if (mutationRand < 0.3) this.state.lastMutationType = 'none';
        else if (mutationRand < 0.5) this.state.lastMutationType = 'inversion';
        else if (mutationRand < 0.7) this.state.lastMutationType = 'retrograde';
        else this.state.lastMutationType = 'jitter';
    }

    const isSoloistFree = epoch >= this.soloistBusyUntilBar;
    if (isSoloistFree && this.soloistRestUntilBar <= epoch) {
      if (this.random.next() < 0.12 || tension < 0.1) this.soloistRestUntilBar = epoch + 1;
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
      const bridgeEvents = this.renderTranceBridge(epoch, resChord, tension, hints);
      return { events: bridgeEvents, lickId: 'Soft Bridge', trackName: this.currentTrackName };
    }

    if (hints.drums) events.push(...this.renderFoundryTranceDrums(epoch, tension));

    const bassEvents = hints.bass ? this.renderRollingBass(resChord, epoch, tension, dna) : [];
    events.push(...bassEvents.flatMap(e => this.rippleLongNote(e, resChord)));

    const usedTargetLayers = new Set<string>();
    const instrumentOverrides: Partial<InstrumentHints> = {};

    if (this.currentPreferredInstrument && hints.melody && !isSoloistResting) {
      instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'psybient');
    }

    let melodyEvents: FractalEvent[] = [];
    if (hints.melody && !isSoloistResting) {
      if (this.currentAxiom.length > 0 && epoch < this.soloistBusyUntilBar) {
        let activeAxiom = this.applyMutationLogic(this.currentAxiom, tension, this.seed + epoch);
        // МЕЛОДИЯ КАК В БЛЮЗЕ (Golden Note Protocol)
        melodyEvents = this.renderMelodicSegment(epoch, resChord, dna, 'melody', activeAxiom, this.currentAxiomMaxTick, this.currentTimeScale, tension);
      }
      if (melodyEvents.length === 0) melodyEvents = this.renderGapArp(epoch, resChord, tension);
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
            if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'psybient');
            events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord)));
            usedTargetLayers.add(target);
          }
        }
      });

      if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
        const softPads = this.renderSidechainedPad(epoch, resChord, tension);
        events.push(...softPads);
        usedTargetLayers.add('accompaniment');
      }
    }

    if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
        const pResult = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
        events.push(...pResult.events);
    }

    events.forEach(e => { if (!e.params) e.params = {}; e.params.tension = tension; });
    return {
      events, tension, beautyScore: 0.9, trackName: this.currentTrackName, mutationType: this.state.lastMutationType, newBpm, instrumentOverrides,
      activeAxioms: {
        melody: isSoloistResting ? 'Breath' : this.currentLickId,
        drums: 'Foundry Hybrid',
        bass: 'Rolling Sub'
      },
      narrative: `Soft Trance: ${this.currentTrackName} [Kicks: Foundry]`
    };
  }

  private renderFoundryTranceDrums(epoch: number, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    // ПРЯМАЯ БОЧКА ИЗ FOUNDRY (мягкий вес)
    [0, 3, 6, 9].forEach(t => events.push({ 
        type: 'drum_foundry_quality', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, 
        weight: 0.65, technique: 'hit', dynamics: 'f', phrasing: 'staccato' 
    }));

    // Мягкий малый на 2 и 4
    [3, 9].forEach(t => events.push({
      type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1,
      weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
    }));

    // Офф-бит хэты
    [1.5, 4.5, 7.5, 10.5].forEach(t => events.push({
      type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.05,
      weight: 0.45, technique: 'hit'
    }));

    return events;
  }

  private renderRollingBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
    const root = this.constrainBassOctave(chord.rootNote - 12);
    const events: FractalEvent[] = [];
    
    // Rolling pattern: 1/16 notes on offsets
    [1, 2, 4, 5, 7, 8, 10, 11].forEach(t => {
        events.push({
            type: 'bass',
            note: root,
            time: t * TICK_TO_BEAT,
            duration: 0.8 * TICK_TO_BEAT,
            weight: 0.5 + (tension * 0.1),
            technique: 'pulse',
            dynamics: 'mf',
            params: { drive: 0.2 } // Мягкий бас
        });
    });
    return events;
  }

  private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = chord.rootNote + 12;
    const isMinor = chord.chordType === 'minor';
    const intervals = isMinor ? [0, 3, 7, 10] : [0, 4, 7, 11];
    return intervals.map((interval, i) => ({
      type: 'accompaniment',
      note: this.constrainAccompanimentOctave(root + interval),
      time: 0,
      duration: 3.9,
      weight: 0.35 + (tension * 0.1),
      technique: 'swell',
      dynamics: 'p',
      params: { attack: 1.5, release: 2.0, sidechain: true }
    }));
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
      let weight = 0.65;
      let durationScale = 1.0;
      if (useNarrativeFilter) {
        if (isGolden) { weight = 0.8; durationScale = 1.5; }
        else { weight = 0.2; durationScale = 0.4; }
      }
      const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition;
      return {
        type: type as any,
        note: this.wrapMelody(rawNote),
        time: relativeTick * TICK_TO_BEAT * timeScale,
        duration: (n.d * TICK_TO_BEAT * timeScale) * durationScale,
        weight,
        technique: 'pick',
        phrasing: (useNarrativeFilter && !isGolden) ? 'staccato' : (n.phrasing || 'legato'),
        params: { attack: 0.1, release: 1.5 }
      };
    });
  }

  private renderGapArp(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = chord.rootNote + 12;
    const scale = [0, 3, 7, 10, 12];
    return [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].filter(() => this.random.next() < 0.4).map(t => ({
        type: 'melody',
        note: this.wrapMelody(root + scale[this.random.nextInt(scale.length)]),
        time: t * TICK_TO_BEAT,
        duration: 0.5 * TICK_TO_BEAT,
        weight: 0.4,
        technique: 'pick',
        dynamics: 'p'
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
        type: type, note: finalNote,
        time: (n.t - barOffset) * TICK_TO_BEAT, duration: Math.min(n.d, 6) * TICK_TO_BEAT, weight: 0.4, technique: 'hit'
      };
    });
  }

  private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
    const events: FractalEvent[] = [];
    if (this.random.next() < 0.3) {
        events.push({
            type: 'pianoAccompaniment',
            note: this.wrapMelody(chord.rootNote + 24 + (chord.chordType === 'minor' ? 3 : 4)),
            time: 10.5 * TICK_TO_BEAT,
            duration: 0.5 * TICK_TO_BEAT,
            weight: 0.4,
            technique: 'hit',
            dynamics: 'p'
        });
    }
    return { events, style: 'Trance Echoes' };
  }

  private renderTranceBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
    const root = chord.rootNote + this.currentTransposition;
    return [{
        type: 'accompaniment', note: this.constrainAccompanimentOctave(root + 12),
        time: 0, duration: 4.0, weight: 0.3, technique: 'swell'
    }];
  }

  private constrainBassOctave(note: number): number { let n = note; if(!isFinite(n)) return 36; while (n > 47) n -= 12; while (n < 28) n += 12; return n; }
  private constrainAccompanimentOctave(note: number): number { let n = note; if(!isFinite(n)) return 60; while (n > 71) n -= 12; while (n < 48) n += 12; return n; }
}
