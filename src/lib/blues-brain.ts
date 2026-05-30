/**
 * @fileOverview Blues Brain V88.0 — "The Velvet Register".
 * #ЗАЧЕМ: Исправление "писклявого" звука.
 * #ЧТО: ПЛАН №22800 — Мелодия опускается на 1 октаву (с +12 до +0).
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
    repairLegacyPhrase,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    transposePhraseDegrees,
    mergeIdenticalNotes,
    keyToMidiRoot,
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    generateStitchPhrase,
    getScaleForMood,
    applyDynamicArticulation,
    applyMicroChronos
} from './music-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

export interface BluesBrainConfig {
  tempo: number;
  rootNote: number;
  emotion: { melancholy: number; darkness: number; };
  cloudAxioms?: any[];
  selectedCompositionIds?: string[];
  activeAnchorId?: string | null;
  activeAnchorRoot?: number | null;
  genre: string;
  useHeritage: boolean;
  isImprovising: boolean;
}

export const DEFAULT_CONFIG: BluesBrainConfig = {
  tempo: 72, rootNote: 55, genre: 'blues', useHeritage: true, isImprovising: false,
  emotion: { melancholy: 0.82, darkness: 0.25 }
};

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

  private currentBassAxiom: { phrase: any[], id: string } | null = null;
  private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
  private currentDrumAxioms: { phrase: any[], role: string, id: string }[] = [];

  private currentLickId: string = '';
  private currentTrackName: string = 'Algorithmic';
  private sessionAnchorId: string | null = null; 
  private soloistBusyUntilBar: number = -1;
  private soloistRestingUntilBar: number = -1;
  private bridgeUntilBar: number = -1;
  private lastMelodyNote: number = 60;

  private currentTransposition: number = 0;
  private microTransposition: number = 0;
  private degreeTransposition: number = 0;
  private currentMutationType: string = 'none';

  private readonly MELODY_CEILING = 84;

  constructor(
      seed: number, mood: Mood, sessionLickHistory?: string[], cloudAxioms?: any[], 
      selectedCompositionIds?: string[], activeAnchorId?: string | null, genre?: string, useHeritage: boolean = true
  ) {
    this.seed = seed; this.mood = mood; this.random = this.createSeededRandom(seed);
    this.config = {
      ...DEFAULT_CONFIG, cloudAxioms: cloudAxioms || [], selectedCompositionIds: selectedCompositionIds || [],
      activeAnchorId: activeAnchorId || null, genre: genre || 'blues', useHeritage: useHeritage,
      isImprovising: (selectedCompositionIds || []).length === 0,
      emotion: { melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4, darkness: ['dark', 'gloomy'].includes(mood) ? 0.35 : 0.2 }
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

  public updateCloudAxioms(axioms: any[], selectedCompositionIds?: string[], activeAnchorId?: string | null, activeAnchorRoot?: number | null, useHeritage?: boolean, isImprovising?: boolean) {
      this.config.cloudAxioms = axioms;
      this.config.selectedCompositionIds = selectedCompositionIds || [];
      if (activeAnchorId !== undefined) this.config.activeAnchorId = activeAnchorId;
      if (activeAnchorRoot !== undefined) this.config.activeAnchorRoot = activeAnchorRoot;
      if (useHeritage !== undefined) this.config.useHeritage = useHeritage;
      if (isImprovising !== undefined) this.config.isImprovising = isImprovising;
  }

  private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number): number {
      if (totalBars <= 0) return 0;
      if (this.config.isImprovising) return calculateMusiNum(epoch, 7, this.seed, totalBars);
      return (epoch - startEpoch) % totalBars;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
      this.currentAxiom = []; this.currentBassAxiom = null; this.currentAccompAxioms = []; this.currentDrumAxioms = [];
      this.currentNativeRoot = null; this.currentPreferredInstrument = null;

      if (!this.config.useHeritage || !this.config.cloudAxioms || this.config.cloudAxioms.length === 0) return undefined;

      const poolToUse = this.config.cloudAxioms.filter(ax => ax.ignored !== true);
      let effectiveAnchor = this.config.activeAnchorId ? normalizeStr(this.config.activeAnchorId) : this.sessionAnchorId;
      
      let filteredPool: any[] = [];
      if (effectiveAnchor) {
          for (let i = 0; i < poolToUse.length; i++) {
              if (normalizeStr(poolToUse[i].compositionId) === effectiveAnchor) filteredPool.push(poolToUse[i]);
          }
      } else {
          const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
          for (let i = 0; i < poolToUse.length; i++) {
              const ax = poolToUse[i];
              const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
              const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
              const axCommons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
              if (axGenres.includes('blues') && axCommons.includes(commonMoodFilter)) filteredPool.push(ax);
          }
      }

      if (filteredPool.length > 0) {
          let basePool: any[] = [];
          for (let i = 0; i < filteredPool.length; i++) if (filteredPool[i].role === 'melody') basePool.push(filteredPool[i]);
          if (basePool.length === 0) {
              for (let i = 0; i < filteredPool.length; i++) if (filteredPool[i].role.toLowerCase().includes('accomp')) basePool.push(filteredPool[i]);
          }

          if (basePool.length > 0) {
              if (!effectiveAnchor) {
                  const firstChoice = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                  this.sessionAnchorId = normalizeStr(firstChoice.compositionId);
                  effectiveAnchor = this.sessionAnchorId;
                  filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                  basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
              }

              let maxDonorBars = 0;
              for (let i = 0; i < basePool.length; i++) {
                  const total = (basePool[i].barOffset || 0) + (basePool[i].bars || 4);
                  if (total > maxDonorBars) maxDonorBars = total;
              }
              const suitePlayhead = epoch % (maxDonorBars || 144);
              
              let selected: any = null;
              if (this.config.isImprovising) selected = basePool[calculateMusiNum(this.seed, 17, epoch, basePool.length)];
              else {
                  for (let i = 0; i < basePool.length; i++) {
                      if ((basePool[i].barOffset || 0) === (suitePlayhead % (maxDonorBars || 1))) { selected = basePool[i]; break; }
                  }
                  if (!selected) selected = basePool[0];
              }

              if (selected) {
                  this.currentTrackName = selected.compositionId;
                  this.currentLickId = selected.id || 'DNA';
                  this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                  this.currentPreferredInstrument = selected.preferredInstrument || null;
                  
                  let rawPhrase = decompressCompactPhrase(selected.phrase);
                  if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);

                  const cid = normalizeStr(selected.compositionId);
                  for (let i = 0; i < poolToUse.length; i++) {
                      const ax = poolToUse[i];
                      if (normalizeStr(ax.compositionId) !== cid || ax.barOffset !== selected.barOffset) continue;
                      const role = ax.role.toLowerCase();
                      if (role === 'bass') this.currentBassAxiom = { phrase: decompressCompactPhrase(ax.phrase), id: ax.id };
                      else if (role.includes('accomp') || role.includes('piano')) this.currentAccompAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument });
                      else if (role.includes('drum')) this.currentDrumAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id });
                  }
                  const baseBars = selected.bars || 4;
                  this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                  this.currentAxiom = rawPhrase;
                  this.soloistBusyUntilBar = epoch + baseBars;
                  return selected.nativeBpm || undefined;
              }
          }
      }
      this.currentTrackName = 'Algo'; this.soloistBusyUntilBar = epoch + 4;
      return undefined;
  }

  private constrainBassOctave(note: number): number { let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n; }
  private constrainAccompanimentOctave(note: number): number { let n = note; while (n > 71) n -= 12; while (n < 48) n += 12; return n; }

  private rippleLongNote(e: FractalEvent, chord: GhostChord): FractalEvent[] {
      if (e.duration < 3.9) return [e]; 
      const rippled: FractalEvent[] = [];
      const isMinor = chord.chordType === 'minor';
      const ripplePool = isMinor ? [3, 7, 8, 10] : [4, 7, 9, 11]; 
      const numChunks = Math.ceil(e.duration / 2.6); 
      const chunkDur = e.duration / numChunks;
      const baseOctaveMidi = Math.floor(e.note / 12) * 12;
      for (let i = 0; i < numChunks; i++) {
          let note = (i === 0) ? e.note : baseOctaveMidi + ripplePool[calculateMusiNum(Math.floor(e.time * 12) + i, 13, this.seed, ripplePool.length)];
          rippled.push({ ...e, note: Math.min(note, this.MELODY_CEILING), time: e.time + (i * chunkDur), duration: chunkDur, params: { ...e.params, attack: i === 0 ? 1.5 : 0.8, release: 2.5 } });
      }
      return rippled;
  }

  public generateBar(
    epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints
  ): { events: FractalEvent[], lickId?: string, mutationType?: string, activeAxioms?: any, narrative?: string, trackName?: string, newBpm?: number, instrumentOverrides?: Partial<InstrumentHints> } {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    const isBridge = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');

    if (navInfo.isPartTransition) {
        this.soloistBusyUntilBar = epoch;
        const shifts = [0, 2, -2, 5, 7, -5];
        this.currentTransposition = shifts[this.random.nextInt(shifts.length)];
        this.microTransposition = 0;
    }

    if (epoch % 8 === 0 && epoch >= 4) {
        const mutationRand = this.random.next();
        const mutationThreshold = this.config.isImprovising ? 0.9 : 0.5;
        if (mutationRand < mutationThreshold * 0.25) {
            this.degreeTransposition = [-1, 1, 2, -2][this.random.nextInt(4)];
            this.currentMutationType = 'transpose_deg';
        }
        else if (mutationRand < mutationThreshold * 0.5) this.currentMutationType = 'inversion';
        else if (mutationRand < mutationThreshold * 0.75) this.currentMutationType = 'retrograde';
        else if (mutationRand < mutationThreshold) this.currentMutationType = 'jitter';
        else this.currentMutationType = 'none';
    } else if (epoch < 4) this.currentMutationType = 'none';

    const isSoloistFree = epoch >= this.soloistBusyUntilBar;
    if (isSoloistFree && this.soloistRestingUntilBar <= epoch) {
        if (this.random.next() < 0.08 || tension < 0.1) this.soloistRestingUntilBar = epoch + 1; 
    }
    const isSoloistResting = epoch < this.soloistRestingUntilBar;
    const isBridging = epoch === this.bridgeUntilBar;

    let newBpm: number | undefined;
    let melodyStatus = 'Waiting';

    if (isSoloistFree && !isSoloistResting && !isBridging && !isBridge) {
        if (this.currentAxiom.length > 0 && this.config.useHeritage) this.bridgeUntilBar = epoch;
        else newBpm = this.selectNextAxiom(navInfo, dna, epoch);
    }

    const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
    const resChord = { ...currentChord, rootNote: resRoot };
    const events: FractalEvent[] = [];

    if (isBridge) {
        events.push(...this.renderLiquidBridge(epoch, resChord, tension, hints));
        return {
            events, lickId: 'Bridge', mutationType: 'none', trackName: this.currentTrackName,
            activeAxioms: { melody: 'Bridge', bass: 'Scale', drums: 'Soft', accompaniment: 'Flow' },
            narrative: `Liquid Bridge`
        };
    }

    if (isBridging) {
        const scale = getScaleForMood(this.mood);
        const stitch = generateStitchPhrase(this.lastMelodyNote, resChord.rootNote + 12, scale);
        let finalStitch = stitch;
        if (epoch >= 4) {
            finalStitch = applyDynamicArticulation(stitch, tension, this.seed + epoch);
            finalStitch = applyMicroChronos(finalStitch, this.seed, tension);
        }
        events.push(...this.renderMelodicSegment(epoch, resChord, dna, 'melody', finalStitch, TICKS_PER_BAR, 1.0, tension));
        melodyStatus = 'STITCH'; this.bridgeUntilBar = -1; this.soloistBusyUntilBar = epoch + 1;
    }

    let dStatus = 'Pulse';
    if (hints.drums) {
        const hDrums = this.renderHeritageDrums(epoch, tension);
        if (hDrums.length > 0) { events.push(...hDrums); dStatus = this.currentDrumAxioms[0].id; }
        else events.push(...this.renderHybridDrums(epoch, tension));
    }

    let bassStatus = 'none';
    const bassEvents = hints.bass ? this.renderSymbioticBass(resChord, epoch, tension, dna) : [];
    if (bassEvents.length > 0) {
        events.push(...bassEvents);
        bassStatus = this.currentBassAxiom ? this.currentBassAxiom.id : 'Algo';
    }

    const instrumentOverrides: Partial<InstrumentHints> = {};
    if (this.currentPreferredInstrument && hints.melody && !isSoloistResting) {
        instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'blues');
    }

    let accStatus = 'none'; let pStatus = 'none';
    if (!isSoloistResting && !isBridging) {
        for (let i = 0; i < this.currentAccompAxioms.length; i++) {
            const ax = this.currentAccompAxioms[i];
            const role = ax.role.toLowerCase(); 
            let target: InstrumentPart | null = null;
            if (role.includes('piano')) target = 'pianoAccompaniment';
            else if (role.includes('accomp')) target = 'accompaniment';
            if (target && hints[target]) {
                let activePhrase = ax.phrase;
                if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);

                activePhrase = applyDynamicArticulation(activePhrase, tension, this.seed + epoch + 100);
                activePhrase = applyMicroChronos(activePhrase, this.seed + 150, tension);

                const rendered = this.renderHeritageLayer(resChord, epoch, activePhrase, target, dna, tension);
                if (rendered.length > 0) {
                    events.push(...rendered);
                    if (target === 'accompaniment') accStatus = ax.id;
                    if (target === 'pianoAccompaniment') pStatus = ax.id;
                    if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'blues');
                }
            }
        }
        if (hints.accompaniment && accStatus === 'none') {
            events.push(...this.renderAdaptiveAccompaniment(epoch, resChord, tension));
            accStatus = 'Adaptive';
        }
    }

    let melodyEvents: FractalEvent[] = [];
    if (hints.melody && !isSoloistResting && !isBridging) {
        if (this.currentAxiom.length > 0 && epoch < this.soloistBusyUntilBar) {
            let activeAxiom = this.currentAxiom;
            if (this.currentMutationType === 'inversion') activeAxiom = invertPhrase(activeAxiom);
            else if (this.currentMutationType === 'retrograde') activeAxiom = retrogradePhrase(activeAxiom);
            else if (this.currentMutationType === 'jitter') activeAxiom = applyRhythmicJitter(activeAxiom, this.seed + epoch);
            else if (this.currentMutationType === 'transpose_deg') activeAxiom = transposePhraseDegrees(activeAxiom, this.degreeTransposition);
            
            activeAxiom = applyDynamicArticulation(activeAxiom, tension, this.seed + epoch);
            activeAxiom = applyMicroChronos(activeAxiom, this.seed, tension);
            // #ЗАЧЕМ: ПЛАН №22800. Опускаем на 1 октаву (с +12 до +0).
            melodyEvents = this.renderMelodicSegment(epoch, resChord, dna, 'melody', activeAxiom, this.currentAxiomMaxTick, this.currentTimeScale, tension);
            melodyStatus = this.currentLickId;
        }
        if (melodyEvents.length === 0) { events.push(...this.renderGapFiller(epoch, resChord, tension)); melodyStatus = 'Gap'; }
        else events.push(...melodyEvents);
        if (events.length > 0) {
            for (let i = events.length - 1; i >= 0; i--) { if (events[i].type === 'melody') { this.lastMelodyNote = events[i].note; break; } }
        }
    }

    if (hints.pianoAccompaniment && pStatus === 'none') {
        const pResult = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
        if (pResult.events.length > 0) { events.push(...pResult.events); pStatus = pResult.style; }
    }

    const modeStr = this.config.isImprovising ? 'IMPRO' : 'RESTO';
    return {
        events, lickId: melodyStatus, tension, beautyScore: 0.5,
        mutationType: this.currentMutationType, newBpm, instrumentOverrides, trackName: this.currentTrackName,
        activeAxioms: { melody: isSoloistResting ? 'Breath' : melodyStatus, bass: bassStatus, drums: dStatus, accompaniment: accStatus, piano: pStatus },
        narrative: `Blues ${modeStr}: ${melodyStatus}`
    };
  }

  private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
      if (this.currentDrumAxioms.length === 0) return [];
      const events: FractalEvent[] = [];
      const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
      const startEpoch = this.soloistBusyUntilBar - totalBars;
      const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
      const barOffset = mosaicBar * TICKS_PER_BAR;
      for (let i = 0; i < this.currentDrumAxioms.length; i++) {
          const ax = this.currentDrumAxioms[i];
          for (let j = 0; j < ax.phrase.length; j++) {
              const n = ax.phrase[j];
              if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                  events.push({ type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: 0.1, weight: 0.35, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
              }
          }
      }
      return events;
  }

  private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote; // #ЗАЧЕМ: ПЛАН №22800. Удален +12.
      const scale = [0, 3, 5, 6, 7, 10]; 
      const noteCount = calculateMusiNum(epoch, 3, this.seed, 3) + 1;
      const ticks = [0, 3, 6, 9].sort(() => this.random.next() - 0.5).slice(0, noteCount);
      ticks.forEach(t => {
          const degIdx = calculateMusiNum(epoch + t, 11, this.seed, scale.length);
          events.push({ type: 'melody', note: Math.min(root + scale[degIdx] + this.currentTransposition + this.microTransposition, this.MELODY_CEILING), time: t * TICK_TO_BEAT, duration: (1.5 * TICK_TO_BEAT) * 1.25, weight: 0.65 + (tension * 0.15), technique: tension > 0.4 ? 'vb' : 'pick', dynamics: 'p', phrasing: 'legato' });
      });
      return events;
  }

  private renderHybridDrums(epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 1.05, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
      if (tension > 0.6 || this.random.next() < 0.4) events.push({ type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' }));
      [0, 3, 6, 9].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.2 }));
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
    const totalBars = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
    const startEpoch = this.soloistBusyUntilBar - totalBars;
    const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
    const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
    const results: FractalEvent[] = [];
    for (let i = 0; i < phrase.length; i++) {
        const n = phrase[i];
        if (n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale)) {
            // #ЗАЧЕМ: ПЛАН №22800. Опускаем на 12 полутонов.
            const e: FractalEvent = {
                type: type as any, note: Math.min(chord.rootNote + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
                time: (n.t - barOffset) * TICK_TO_BEAT * timeScale, duration: (n.d * TICK_TO_BEAT * timeScale) * 1.25, weight: 0.75,
                technique: n.tech as Technique, dynamics: 'p', phrasing: 'legato'
            };
            results.push(...this.rippleLongNote(e, chord));
        }
    }
    return results;
  }

  private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
      if (this.currentBassAxiom) {
          const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
          const startEpoch = this.soloistBusyUntilBar - totalBars;
          const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
          const barOffset = mosaicBar * TICKS_PER_BAR;
          let activeBassAxiom = this.currentBassAxiom.phrase;
          if (this.currentMutationType === 'retrograde') activeBassAxiom = retrogradePhrase(activeBassAxiom);
          if (epoch >= 4) activeBassAxiom = applyMicroChronos(activeBassAxiom, this.seed + 250, tension);
          
          for (let i = 0; i < activeBassAxiom.length; i++) {
              const n = activeBassAxiom[i];
              if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                  const e: FractalEvent = { type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8, technique: n.tech as Technique, dynamics: 'p', phrasing: 'legato' };
                  return this.rippleLongNote(e, chord);
              }
          }
      }
      return this.renderRiffBass(chord, epoch);
  }

  private renderRiffBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition;
    const barInRiff = epoch % 4;
    const riff = [ [{ t: 0, n: root }, { t: 4, n: root }, { t: 8, n: root + 7 }], [{ t: 0, n: root }, { t: 6, n: root + 7 }, { t: 9, n: root + 10 }], [{ t: 0, n: root + 7 }, { t: 4, n: root + 5 }, { t: 8, n: root }], [{ t: 0, n: root }, { t: 4, n: root + 3 }, { t: 8, n: root + 4 }] ];
    const results: FractalEvent[] = [];
    riff[barInRiff].forEach(p => {
        const e: FractalEvent = { type: 'bass', note: this.constrainBassOctave(p.n), time: p.t * TICK_TO_BEAT, duration: 4 * TICK_TO_BEAT, weight: 0.8, technique: 'pick', dynamics: 'p', phrasing: 'legato' };
        results.push(...this.rippleLongNote(e, chord));
    });
    return results;
  }

  private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
      const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
      const startEpoch = this.soloistBusyUntilBar - totalBars;
      const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
      const barOffset = mosaicBar * TICKS_PER_BAR;
      const results: FractalEvent[] = [];
      for (let i = 0; i < phrase.length; i++) {
          const n = phrase[i];
          if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
              const e: FractalEvent = {
                  type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition),
                  time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6, technique: n.tech as Technique, dynamics: 'p', phrasing: 'staccato'
              };
              results.push(...this.rippleLongNote(e, chord));
          }
      }
      return results;
  }

  private renderAdaptiveAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = this.constrainAccompanimentOctave(chord.rootNote + 12 + calculateMusiNum(epoch, 3, this.seed, 12) + this.currentTransposition + this.microTransposition);
    return this.rippleLongNote({ type: 'accompaniment', note: root, time: 0, duration: 4.0, weight: 0.85, technique: 'swell', dynamics: 'p', phrasing: 'legato' }, chord);
  }

  private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
      const events: FractalEvent[] = [];
      if (melodyEvents.length === 0) return { events: [], style: 'Waiting' };
      for (let i = 0; i < melodyEvents.length; i++) {
          if (i % 2 === 0) {
              const m = melodyEvents[i];
              events.push({ ...m, type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(m.note + (chord.chordType === 'minor' ? 3 : 4)), weight: 0.3, technique: 'hit', phrasing: 'staccato', params: { ...m.params, release: 2.5 } });
          }
      }
      return { events, style: "Shadow" };
  }

  private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
      const events: FractalEvent[] = []; 
      const root = chord.rootNote + this.currentTransposition + this.microTransposition; 
      for (let i = 0; i < 4; i++) {
          events.push({ type: 'bass', note: this.constrainBassOctave(root - 12 + [0, 2, 4, 7][i % 4]), time: (i * 3) * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.7, technique: 'pick', dynamics: 'p', phrasing: 'legato' });
      }
      return events;
  }

  private constrainBassOctave(note: number): number { let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n; }
  private constrainAccompanimentOctave(note: number): number { let n = note; while (n > 71) n -= 12; while (n < 48) n += 12; return n; }
}
