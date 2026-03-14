
import {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesGuitarRiff,
  BluesMelody,
  BluesCognitiveState,
  CommonMood,
  InstrumentPart,
  Technique
} from '@/types/music';
import { 
    DEGREE_TO_SEMITONE,
    decompressCompactPhrase,
    calculateMusiNum,
    normalizePhraseGroup,
    normalizeStr,
    pickWeightedDeterministic,
    repairLegacyPhrase,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    keyToMidiRoot
} from './music-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';
import { BLUES_GUITAR_RIFFS } from './assets/blues-guitar-riffs';

/**
 * @fileOverview Blues Brain V223.0 — "Ensemble Transparency".
 * #ОБНОВЛЕНО (ПЛАН №814): Снят блок на генерацию пианиста в Heritage режиме.
 */

const TICKS_PER_BAR = 12;
const BEATS_PER_BAR = 4;
const TICK_TO_BEAT = BEATS_PER_BAR / TICKS_PER_BAR; 

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
}

export const DEFAULT_CONFIG: BluesBrainConfig = {
  tempo: 72,
  rootNote: 55, 
  genre: 'blues',
  useHeritage: true,
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
  
  private currentBassAxiom: any[] = [];
  private currentAccompAxioms: { phrase: any[], role: string, id?: string }[] = [];
  private currentDrumAxioms: { phrase: any[], role: string }[] = [];
  
  private currentLickId: string = '';
  private currentTrackName: string = 'Local';
  private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
  
  private readonly MELODY_CEILING = 72; 
  private readonly BASS_FLOOR = 31; 
  private readonly BASS_CEILING = 47; 

  private soloistBusyUntilBar: number = -1;
  private soloistRestingUntilBar: number = -1;
  private accompanimentRestingUntilBar: number = -1;
  
  private currentTransposition: number = 0;
  private microTransposition: number = 0;

  private state: BluesCognitiveState & { 
      lastMutationType: string,
      lastTension: number,
      recentLicks: string[],
      lastPlayedOffset: number
  };

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

  private normalize(s: string): string {
      return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  public updateCloudAxioms(axioms: any[], selectedCompositionIds?: string[], activeAnchorId?: string | null, activeAnchorRoot?: number | null, useHeritage?: boolean) {
      this.config.cloudAxioms = axioms;
      this.config.selectedCompositionIds = selectedCompositionIds || [];
      if (activeAnchorId !== undefined) this.config.activeAnchorId = activeAnchorId;
      if (activeAnchorRoot !== undefined) this.config.activeAnchorRoot = activeAnchorRoot;
      if (useHeritage !== undefined) this.config.useHeritage = useHeritage;
  }

  private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
      const barsElapsed = epoch - startEpoch;
      const linearIndex = barsElapsed % totalBars;
      const rand = calculateMusiNum(epoch, 13, this.seed, 100) / 100;
      if (tension > 0.75) {
          if (rand < 0.2) return Math.max(0, linearIndex - 1); 
          if (rand > 0.9) return (linearIndex + 1) % totalBars; 
      }
      return linearIndex;
  }

  private constrainBassOctave(note: number): number {
      let finalNote = note; while (finalNote > this.BASS_CEILING) finalNote -= 12; while (finalNote < this.BASS_FLOOR) finalNote += 12; return finalNote;
  }

  private constrainAccompanimentOctave(note: number): number {
      let finalNote = note; while (finalNote > 71) finalNote -= 12; while (finalNote < 48) finalNote += 12; return finalNote;
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): { events: FractalEvent[], lickId?: string, mutationType?: string, activeAxioms?: any, narrative?: string, newBpm?: number } {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    this.state.lastTension = tension;
    const isBridge = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');

    if (navInfo.isPartTransition) {
        this.soloistBusyUntilBar = epoch; 
        const shifts = [0, 2, -2, 5, 7, -5];
        this.currentTransposition = shifts[this.random.nextInt(shifts.length)];
        this.microTransposition = 0;
    }

    if (epoch % 4 === 0) {
        const mutationRand = this.random.next();
        if (mutationRand < 0.25) { this.microTransposition = [-2, 0, 2, 5, -5][this.random.nextInt(5)]; this.state.lastMutationType = 'transpose'; }
        else if (mutationRand < 0.4) this.state.lastMutationType = 'inversion';
        else if (mutationRand < 0.55) this.state.lastMutationType = 'retrograde';
        else if (mutationRand < 0.7) this.state.lastMutationType = 'jitter';
        else this.state.lastMutationType = 'none';
    }

    const isSoloistFree = epoch >= this.soloistBusyUntilBar;
    const isSoloistResting = epoch < this.soloistRestingUntilBar;

    let newBpm: number | undefined;
    if (isSoloistFree && !isSoloistResting && !isBridge) {
        newBpm = this.selectNextAxiom(navInfo, dna, epoch);
    }

    const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
    const resChord = { ...currentChord, rootNote: resRoot };
    const events: FractalEvent[] = [];

    if (isBridge) {
        events.push(...this.renderLiquidBridge(epoch, resChord, tension, hints));
        return { 
            events, lickId: 'Liquid Bridge', mutationType: 'none',
            activeAxioms: { melody: 'Bridge Flow', ensemble: 'UNISON', bass: 'Scalar Walk', drums: 'Soft Swells' },
            narrative: `Liquid Bridge: Smooth transition through ${navInfo.currentPart.name}`
        };
    }

    let activeAxiom = this.currentAxiom;
    if (this.state.lastMutationType === 'inversion') activeAxiom = invertPhrase(activeAxiom);
    else if (this.state.lastMutationType === 'retrograde') activeAxiom = retrogradePhrase(activeAxiom);
    else if (this.state.lastMutationType === 'jitter') activeAxiom = applyRhythmicJitter(activeAxiom, this.seed + epoch);

    let melodyEvents = (hints.melody && !isSoloistResting && epoch < this.soloistBusyUntilBar) 
        ? this.renderMelodicSegment(epoch, resChord, dna, 'melody', activeAxiom, this.currentAxiomMaxTick, this.currentTimeScale, tension) 
        : [];
    if (hints.melody && !isSoloistResting && melodyEvents.length === 0 && navInfo.currentPart.id === 'MAIN') {
        melodyEvents = this.renderAdaptiveMelody(epoch, resChord, tension);
    }
    
    // --- Drum Selection Logic ---
    if (hints.drums) {
        const heritageDrums = this.renderHeritageDrums(epoch, tension);
        if (heritageDrums.length > 0) {
            events.push(...heritageDrums);
        } else {
            events.push(...this.renderNarrativeDrums(epoch, tension, isSoloistResting));
        }
    }
    
    const bassEvents = hints.bass ? this.renderSymbioticBass(resChord, epoch, tension, dna) : [];
    events.push(...bassEvents);

    const accompanimentEvents: FractalEvent[] = [];
    const usedTargetLayers = new Set<string>();
    const isAccompResting = epoch < this.accompanimentRestingUntilBar;
    const unisonType = navInfo.currentPart.instrumentRules?.accompaniment?.unisonType || 'none';

    let accStatus = 'none';
    if (!isAccompResting) {
        if (hints.accompaniment && unisonType !== 'none') {
            accompanimentEvents.push(...this.renderUnisonAccompaniment(bassEvents, resChord, unisonType)); 
            usedTargetLayers.add('accompaniment');
            accStatus = 'Unison Texture';
        } else if (hints.accompaniment && this.currentAccompAxioms.length > 0) {
            this.currentAccompAxioms.forEach((ax, idx) => {
                const role = ax.role.toLowerCase();
                const targetType: InstrumentPart = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('strings') ? 'harmony' : 'accompaniment');
                if ((navInfo.currentPart.layers as any)[targetType] && !usedTargetLayers.has(targetType)) {
                    accompanimentEvents.push(...this.renderHeritageAccompaniment(resChord, epoch, ax.phrase, targetType, dna, tension));
                    usedTargetLayers.add(targetType);
                    if (targetType === 'accompaniment') accStatus = `Heritage (${ax.id || 'DNA'})`;
                }
            });
        } else if (hints.accompaniment) {
            accompanimentEvents.push(...this.renderAdaptiveAccompaniment(epoch, resChord, tension)); 
            usedTargetLayers.add('accompaniment');
            accStatus = 'Adaptive Pad';
        }
    }
    events.push(...accompanimentEvents);

    let pianoInfo = { style: 'none', count: 0 };
    // #ЗАЧЕМ: ПЛАН №814. Снимаем блок usedTargetLayers.has('pianoAccompaniment') для пианиста.
    // Если в ДНК есть пианино - оно сыграет выше. Но Virtuoso Piano должен иметь шанс всегда.
    if (hints.pianoAccompaniment) {
        const p = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
        events.push(...p.events); 
        pianoInfo = { style: p.style, count: p.events.length };
    }
    
    if (hints.harmony && !usedTargetLayers.has('harmony')) {
        const rand = this.random.next();
        if (tension > 0.85 || tension < 0.15 || rand < 0.25) events.push(...this.renderDerivativeHarmony(resChord, epoch, 'violin'));
        if (rand < 0.85) events.push(...this.renderDerivativeHarmony(resChord, epoch, 'guitarChords'));
    }

    events.push(...melodyEvents);

    return { 
        events, lickId: this.currentLickId, mutationType: this.state.lastMutationType, newBpm,
        activeAxioms: {
            melody: isSoloistResting ? 'Breath' : (melodyEvents.length > 0 ? this.currentLickId : 'Gap-Filler'),
            ensemble: this.ensembleStatus,
            bass: this.currentBassAxiom.length > 0 ? 'Sibling DNA' : 'Rhythmic Pattern',
            accompaniment: isAccompResting ? 'Breath' : accStatus,
            drums: this.currentDrumAxioms.length > 0 ? `Heritage (${this.currentDrumAxioms.length} layers)` : 'Narrative Beat',
            piano: pianoInfo.count > 0 ? `${pianoInfo.style} (${pianoInfo.count} events)` : 'none'
        },
        narrative: `Blues Evolution: ${this.currentTrackName} [${this.state.lastMutationType}] [Chronos Mode] [Mosaic Mode]`
    };
  }

  private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      if (this.currentDrumAxioms.length === 0) return [];
      const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
      const startEpoch = this.soloistBusyUntilBar - totalBars;
      const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
      const barOffset = mosaicBar * TICKS_PER_BAR;

      this.currentDrumAxioms.forEach(ax => {
          const barNotes = ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
          const sub = ax.role.split(' ')[1] || 'kick';
          let type: any = 'drum_kick_reso';
          if (sub === 'snare') type = 'drum_snare';
          else if (sub === 'hat') type = 'drum_25693__walter_odington__hackney-hat-1';
          else if (sub === 'tom') type = 'drum_Sonor_Classix_Low_Tom';
          else if (sub === 'ride') type = 'drum_ride_wetter';
          else if (sub === 'perc') type = 'drum_perc-001';

          barNotes.forEach(n => {
              events.push({ type, note: 36, time: (n.t - barOffset) * TICK_TO_BEAT, duration: 0.1, weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
          });
      });
      return events;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
      this.currentBassAxiom = []; this.currentAccompAxioms = []; this.currentDrumAxioms = []; this.currentNativeRoot = null; this.ensembleStatus = 'ADAPTIVE'; this.currentTimeScale = 1;
      if (this.config.useHeritage && this.config.cloudAxioms && this.config.cloudAxioms.length > 0) {
          const targetAnchor = this.config.activeAnchorId ? this.normalize(this.config.activeAnchorId) : null;
          let filteredPool: any[] = [];
          if (targetAnchor) filteredPool = this.config.cloudAxioms.filter(ax => this.normalize(ax.compositionId) === targetAnchor);
          else {
              const commonMoodFilter = MOOD_TO_COMMON[this.mood];
              filteredPool = this.config.cloudAxioms.filter(ax => {
                  const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                  const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                  return axGenres.includes(this.config.genre) && (axMoods.includes(this.mood) || Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter);
              });
          }
          if (filteredPool.length > 0) {
              let basePool = filteredPool.filter(ax => ax.role === 'melody');
              if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role?.startsWith('accomp'));
              if (basePool.length > 0) {
                  const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                  const suitePlayhead = epoch % (maxDonorBars || 144);
                  
                  // Logic from Plan 804: Shuffle variants with same offset
                  const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === (suitePlayhead % maxDonorBars));
                  let selected: any = null;
                  
                  if (sameOffsetPool.length > 0) {
                      const idx = calculateMusiNum(this.seed, 17, epoch, sameOffsetPool.length);
                      selected = sameOffsetPool[idx];
                  } else {
                      const candidates = basePool.filter(ax => !this.state.recentLicks.includes(ax.id)).sort((a, b) => Math.abs((a.barOffset || 0) - suitePlayhead) - Math.abs((b.barOffset || 0) - suitePlayhead));
                      selected = candidates.length > 0 ? candidates[0] : basePool[this.random.nextInt(basePool.length)];
                  }

                  if (selected) {
                      this.currentLickId = selected.id; this.currentTrackName = selected.compositionId; 
                      this.state.recentLicks.push(selected.id); if (this.state.recentLicks.length > 15) this.state.recentLicks.shift();
                      this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                      let rawPhrase = decompressCompactPhrase(selected.phrase); const phrasesToNormalize = [rawPhrase];
                      const cid = this.normalize(selected.compositionId);
                      const bassSibling = this.config.cloudAxioms.find(ax => ax.role === 'bass' && this.normalize(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                      if (bassSibling) { const rb = decompressCompactPhrase(bassSibling.phrase); phrasesToNormalize.push(rb); this.currentBassAxiom = rb; }
                      const accompSiblings = this.config.cloudAxioms.filter(ax => ax.role?.startsWith('accomp') && this.normalize(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                      accompSiblings.forEach(ax => { const p = decompressCompactPhrase(ax.phrase); phrasesToNormalize.push(p); this.currentAccompAxioms.push({ phrase: p, role: ax.role, id: ax.id }); });
                      const drumSiblings = this.config.cloudAxioms.filter(ax => ax.role?.startsWith('drums') && this.normalize(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                      drumSiblings.forEach(ax => { const p = decompressCompactPhrase(ax.phrase); this.currentDrumAxioms.push({ phrase: p, role: ax.role }); });
                      normalizePhraseGroup(phrasesToNormalize);
                      const baseBars = selected.bars || 4; this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                      this.currentAxiom = rawPhrase; this.soloistBusyUntilBar = epoch + baseBars; this.ensembleStatus = 'SIBLING'; return selected.nativeBpm || undefined;
                  }
              }
          }
      }
      this.ensembleStatus = 'LOCAL'; this.currentLickId = 'L01'; this.currentAxiom = decompressCompactPhrase(BLUES_SOLO_LICKS['L01'].phrase as any); this.currentAxiomMaxTick = 144; this.soloistBusyUntilBar = epoch + 12; return undefined;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
    const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
    const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
    const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
    const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
    const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
    return barNotes.map((n) => ({ type: type as any, note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING), time: (n.t - barOffset) * TICK_TO_BEAT * timeScale, duration: n.d * TICK_TO_BEAT * timeScale, weight: 0.8 + (this.random.next() * 0.1 - 0.05), technique: n.tech as any, dynamics: 'p', phrasing: 'legato' }));
  }

  private renderAdaptiveMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const scale = [0, 3, 5, 7, 10]; const degIdx = calculateMusiNum(epoch, 5, this.seed, scale.length);
      return [{ type: 'melody', note: chord.rootNote + 12 + scale[degIdx], time: 0, duration: 2.0, weight: 0.8, technique: 'swell', dynamics: 'p', phrasing: 'legato' }];
  }

  private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
      if (this.currentBassAxiom.length > 0) {
          const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
          const startEpoch = this.soloistBusyUntilBar - totalBars;
          const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
          const barOffset = mosaicBar * TICKS_PER_BAR;
          const barNotes = this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
          if (barNotes.length > 0) return barNotes.map(n => ({ type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.85, technique: 'pluck', dynamics: 'p', phrasing: 'legato' }));
      }
      return tension > 0.7 ? this.renderWalkingBass(chord, epoch) : this.renderRiffBass(chord, epoch);
  }

  private renderUnisonAccompaniment(bassEvents: FractalEvent[], chord: GhostChord, type: string): FractalEvent[] {
      const events: FractalEvent[] = []; const third = chord.chordType === 'minor' ? 3 : 4;
      bassEvents.slice(0, 2).forEach(bass => {
          events.push({ ...bass, type: 'accompaniment', note: this.constrainAccompanimentOctave(type === 'strict' ? bass.note : bass.note + 12), weight: 0.35, technique: 'hit', phrasing: 'staccato', duration: 0.4 * TICK_TO_BEAT });
          events.push({ type: 'accompaniment', note: this.constrainAccompanimentOctave((bass.note || 0) + 24 + third), time: bass.time + (1.5 * TICK_TO_BEAT), duration: 0.3 * TICK_TO_BEAT, weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });
      return events;
  }

  private renderRiffBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition; const barInRiff = epoch % 4;
    const riff = [ [{ t: 0, n: root }, { t: 4, n: root }, { t: 8, n: root + 7 }], [{ t: 0, n: root }, { t: 6, n: root + 7 }, { t: 9, n: root + 10 }], [{ t: 0, n: root + 7 }, { t: 4, n: root + 5 }, { t: 8, n: root }], [{ t: 0, n: root }, { t: 4, n: root + 3 }, { t: 8, n: root + 4 }] ];
    return riff[barInRiff].map(p => ({ type: 'bass', note: this.constrainBassOctave(p.n), time: p.t * TICK_TO_BEAT, duration: 4 * TICK_TO_BEAT, weight: 0.85, technique: 'pluck', dynamics: 'p', phrasing: 'legato' }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition;
    return [root, root + 4, root + 7, root + 11].map((p, i) => ({ type: 'bass', note: this.constrainBassOctave(p), time: (i * 3) * TICK_TO_BEAT, duration: 3 * TICK_TO_BEAT, weight: 0.85, technique: 'pluck', dynamics: 'p', phrasing: 'legato' }));
  }

  private renderNarrativeDrums(epoch: number, tension: number, isSoloistResting: boolean): FractalEvent[] {
      const events: FractalEvent[] = []; const isFourthBar = epoch % 4 === 3; const isEighthBar = epoch % 8 === 7;
      [0, 6].forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.75, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [0, 3, 6, 9].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      if (isFourthBar || isEighthBar || isSoloistResting) {
          const intensity = isEighthBar ? 1.0 : 0.7; const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
          [9, 10, 11].forEach((t, i) => { events.push({ type: tomTypes[i] as any, note: 40, time: t * TICK_TO_BEAT, duration: 0.5, weight: (0.6 + (i * 0.1)) * intensity, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }); });
      }
      return events;
  }

  private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
      const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
      const startEpoch = this.soloistBusyUntilBar - totalBars;
      const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
      const barOffset = mosaicBar * TICKS_PER_BAR;
      const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
      return barNotes.map(n => ({ type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition), time: (n.t - barOffset) * TICK_TO_BEAT, duration: Math.min(n.d, 6) * TICK_TO_BEAT, weight: 0.45 + (this.random.next() * 0.1 - 0.05), technique: tension > 0.7 ? 'hit' : 'swell', dynamics: 'p', phrasing: 'staccato', params: { filterCutoff: 1400 + (tension * 1000) } }));
  }

  private renderAdaptiveAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = this.constrainAccompanimentOctave(chord.rootNote + 12 + calculateMusiNum(epoch, 3, this.seed, 12) + this.currentTransposition + this.microTransposition);
    return [{ type: 'accompaniment', note: root, time: 0, duration: 4.0 * TICK_TO_BEAT, weight: 0.45, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }];
  }

  private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
      const events: FractalEvent[] = []; const isSoloistBusy = melodyEvents.length > 0;
      const root = chord.rootNote + 24 + this.currentTransposition + this.microTransposition; const scale = chord.chordType === 'minor' ? [0, 3, 7, 10, 12] : [0, 4, 7, 11, 12];
      let style = "none";
      if (!isSoloistBusy) {
          if (tension > 0.75) {
              style = "Passage"; const passage = [0, 2, 4, 7, 12, 14, 17].map((s, i) => ({ type: 'pianoAccompaniment' as any, note: this.constrainAccompanimentOctave(root + s), time: (i * 1.5) * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.15 + (this.random.next() * 0.05), technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { release: 2.0 } }));
              events.push(...passage);
          } else {
              style = "Arpeggio"; const pattern = [0, 2, 4, 1, 3, 0]; pattern.forEach((idx, i) => { events.push({ type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(root + scale[idx % scale.length]), time: (i * 2) * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.15 + (this.random.next() * 0.05), technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { release: 2.0 } }); });
          }
      } else {
          style = "Echo"; 
          // #ЗАЧЕМ: ПЛАН №814. Более активное эхо. 
          const sourceCount = Math.min(2, melodyEvents.length);
          for (let i = 0; i < sourceCount; i++) {
              const source = melodyEvents[this.random.nextInt(melodyEvents.length)];
              if (source) {
                  events.push({ type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(source.note - 12), time: (source.time + 1.5 * TICK_TO_BEAT) % BEATS_PER_BAR, duration: 0.5 * TICK_TO_BEAT, weight: 0.12, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { release: 2.5 } });
              }
          }
      }
      return { events, style };
  }

  private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
      const events: FractalEvent[] = []; const root = chord.rootNote + this.currentTransposition + this.microTransposition; const scale = [0, 2, 4, 5, 7, 9, 11]; 
      [0, 3, 6, 9].forEach((t, i) => { events.push({ type: 'bass', note: this.constrainBassOctave(root - 12 + scale[i % scale.length]), time: t * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.7, technique: 'pluck', dynamics: 'p', phrasing: 'legato' }); });
      events.push({ type: 'accompaniment', note: this.constrainAccompanimentOctave(root + 12), time: 0, duration: 4.0, weight: 0.35, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 1.5, release: 2.0 } });
      if (hints.melody) { events.push({ type: 'melody', note: root + 24, time: 0, duration: 4.0, weight: 0.45, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 2.0, release: 3.0 } }); }
      events.push({ type: 'drum_ride_wetter', note: 51, time: 0, duration: 4.0, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
      events.push({ type: 'drum_Sonor_Classix_Low_Tom', note: 40, time: 2.0, duration: 2.0, weight: 0.25, technique: 'swell', dynamics: 'p', phrasing: 'staccato' });
      return events;
  }

  private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'guitarChords' | 'violin'): FractalEvent[] {
      const rootMidi = currentChord.rootNote + this.currentTransposition + this.microTransposition; const rootName = MIDI_NOTE_NAMES[rootMidi % 12]; const chordName = rootName + (currentChord.chordType === 'minor' ? 'm' : ''); const note = this.constrainAccompanimentOctave(rootMidi + 12);
      if (timbre === 'guitarChords') { return [0, 6].map(t => ({ type: 'harmony', note: note, time: t * TICK_TO_BEAT, duration: 2.0 * TICK_TO_BEAT, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato', chordName: chordName })); }
      return [{ type: 'harmony', note: note + 12, time: 0, duration: 4.0 * TICK_TO_BEAT, weight: 0.35, technique: 'swell', dynamics: 'p', phrasing: 'legato' }];
  }

  private renderSparkle(chord: GhostChord, isPositive: boolean): FractalEvent {
      return { type: 'sparkle', note: chord.rootNote + 48, time: this.random.nextInt(12) * TICK_TO_BEAT, duration: 6.0, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: { mood: this.mood, genre: this.config.genre, category: isPositive ? 'light' : 'ambient_common' } };
  }

  private renderSfx(tension: number): FractalEvent[] {
      return [{ type: 'sfx', note: 60, time: this.random.nextInt(12) * TICK_TO_BEAT, duration: 4.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { mood: this.mood, genre: this.config.genre } }];
  }
}
