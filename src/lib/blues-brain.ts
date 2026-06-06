
/**
 * @fileOverview Blues Brain V78.0 — "Rhythmic Cohesion Update".
 * #ЗАЧЕМ: Избавление от статичных 1-нотных гудений в аккомпанементе.
 * #ЧТО: ПЛАН №85 — Удаление техники swell и лимитирование длительности нот.
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
  private pianistMode: 'rhodes' | 'acoustic' = 'rhodes';

  private readonly MELODY_CEILING = 72;
  private readonly BASS_FLOOR = 31;
  private readonly BASS_CEILING = 47;

  private soloistBusyUntilBar: number = -1;
  private soloistRestingUntilBar: number = -1;
  private accompanimentRestingUntilBar: number = -1;

  private currentTransposition: number = 0;
  private microTransposition: number = 0;

  private activeHarmonyInstrument: 'violin' | 'guitarChords' = 'guitarChords';
  private lastHarmonySwitchBar: number = -1;

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

  public updateCloudAxioms(axioms: any[], selectedCompositionIds?: string[], activeAnchorId?: string | null, activeAnchorRoot?: number | null, useHeritage?: boolean, isImprovising?: boolean) {
      const wasEmpty = !this.config.cloudAxioms || this.config.cloudAxioms.length === 0;
      this.config.cloudAxioms = axioms;
      this.config.selectedCompositionIds = selectedCompositionIds || [];
      if (activeAnchorId !== undefined) this.config.activeAnchorId = activeAnchorId;
      if (activeAnchorRoot !== undefined) this.config.activeAnchorRoot = activeAnchorRoot;
      if (useHeritage !== undefined) this.config.useHeritage = useHeritage;
      if (isImprovising !== undefined) this.config.isImprovising = isImprovising;

      if (wasEmpty && this.config.cloudAxioms.length > 0 && this.config.useHeritage) {
          this.soloistBusyUntilBar = -1;
      }
  }

  private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
      if (totalBars <= 0) return 0;
      if (this.config.isImprovising) {
          return calculateMusiNum(epoch, 7, this.seed, totalBars);
      }
      return (epoch - startEpoch) % totalBars;
  }

  private selectHarmonyInstrument(epoch: number, tension: number, hasHeritageStrings: boolean) {
      if (epoch % 4 === 0 && epoch !== this.lastHarmonySwitchBar) {
          this.lastHarmonySwitchBar = epoch;
          const rand = this.random.next();
          if (hasHeritageStrings) {
              this.activeHarmonyInstrument = rand < 0.7 ? 'violin' : 'guitarChords';
          } else {
              this.activeHarmonyInstrument = (tension > 0.85 || tension < 0.15) ? 'violin' : 'guitarChords';
          }
      }
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
        else if (rawType === 'melody') finalNote = Math.min(note, this.MELODY_CEILING);
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
          const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
          filteredPool = poolToUse.filter(ax => {
              const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
              const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
              return axGenres.includes('blues') && (axMoods.includes(this.mood) || (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter));
          });
      }

      if (filteredPool.length > 0) {
          let basePool = filteredPool.filter(ax => ax.role === 'melody');
          if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

          if (basePool.length > 0) {
              if (!effectiveAnchor) {
                  const firstChoice = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                  this.sessionAnchorId = normalizeStr(firstChoice.compositionId);
                  effectiveAnchor = this.sessionAnchorId;
                  filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                  basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
              }

              const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
              const suitePlayhead = epoch % (maxDonorBars || 144);
              
              let selected: any = null;
              if (this.config.isImprovising) {
                  selected = basePool[calculateMusiNum(this.seed, 17, epoch, basePool.length)];
              } else {
                  const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === (suitePlayhead % (maxDonorBars || 1)));
                  selected = sameOffsetPool.length > 0 ? sameOffsetPool[0] : basePool[0];
              }

              if (selected) {
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

                  const drumSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('drum') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                  this.currentDrumAxioms = drumSiblings.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role }));

                  const baseBars = selected.bars || 4;
                  this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                  this.currentAxiom = rawPhrase;
                  this.soloistBusyUntilBar = epoch + baseBars;
                  this.ensembleStatus = 'SIBLING';
                  return selected.nativeBpm || undefined;
              }
          }
      }
      this.currentTrackName = 'Generative';
      this.soloistBusyUntilBar = epoch + 4;
      return undefined;
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): { events: FractalEvent[], lickId?: string, mutationType?: string, activeAxioms?: any, narrative?: string, trackName?: string, newBpm?: number, instrumentOverrides?: Partial<InstrumentHints> } {
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
        const mutationThreshold = this.config.isImprovising ? 0.9 : 0.45;
        if (mutationRand < mutationThreshold * 0.25) {
            this.microTransposition = [-2, 0, 2, 5, -5][this.random.nextInt(5)];
            this.state.lastMutationType = 'transpose';
        }
        else if (mutationRand < mutationThreshold * 0.5) this.state.lastMutationType = 'inversion';
        else if (mutationRand < mutationThreshold * 0.75) this.state.lastMutationType = 'retrograde';
        else if (mutationRand < mutationThreshold) this.state.lastMutationType = 'jitter';
        else this.state.lastMutationType = 'none';
    }

    const isSoloistFree = epoch >= this.soloistBusyUntilBar;
    
    if (isSoloistFree && this.soloistRestingUntilBar <= epoch) {
        const restRoll = this.random.next();
        if (restRoll < 0.08 || tension < 0.1) {
            this.soloistRestingUntilBar = epoch + 1; 
        }
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
        events.push(...this.renderLiquidBridge(epoch, resChord, tension, hints));
        return {
            events, lickId: 'Liquid Bridge', mutationType: 'none',
            trackName: this.currentTrackName,
            activeAxioms: { melody: 'Bridge Flow', ensemble: 'ORCHESTRA', bass: 'Scale Walk', drums: 'Soft Groove' },
            narrative: `Liquid Bridge: Full ensemble transition through ${navInfo.currentPart.name}`
        };
    }

    if (hints.drums) {
        events.push(...this.renderHybridDrums(epoch, tension, isSoloistResting));
    }

    let bassStatus = 'none';
    const bassEvents = hints.bass ? this.renderSymbioticBass(resChord, epoch, tension, dna) : [];
    if (bassEvents.length > 0) {
        bassStatus = this.currentBassAxiom.length > 0 ? 'Sibling DNA' : (tension > 0.7 ? 'Walking Bass' : 'Riff Bass');
    }
    events.push(...bassEvents.flatMap(e => this.rippleLongNote(e, resChord)));

    const usedTargetLayers = new Set<string>();
    const instrumentOverrides: Partial<InstrumentHints> = {};

    if (this.currentPreferredInstrument && hints.melody && !isSoloistResting) {
        instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'blues');
    }

    if (!isSoloistResting) {
        this.currentAccompAxioms.forEach((ax) => {
            const rawRole = ax.role.toLowerCase(); 
            let target: InstrumentPart | null = null;
            if (rawRole.includes('piano')) target = 'pianoAccompaniment';
            else if (rawRole.includes('accomp')) target = 'accompaniment';
            
            if (target && hints[target] && !usedTargetLayers.has(target)) {
                const rendered = this.renderHeritageAccompaniment(resChord, epoch, ax.phrase, target, dna, tension);
                if (rendered.length > 0) {
                    if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'blues');
                    events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord)));
                    usedTargetLayers.add(target);
                }
            }
        });
        
        if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
            const adaptiveAcc = this.renderAdaptiveAccompaniment(epoch, resChord, tension);
            adaptiveAcc.forEach(e => e.pan = 0.1);
            events.push(...adaptiveAcc.flatMap(e => this.rippleLongNote(e, resChord)));
            usedTargetLayers.add('accompaniment');
        }
    }

    let melodyEvents: FractalEvent[] = [];
    let currentLickDisplayId = this.currentLickId;

    if (hints.melody && !isSoloistResting) {
        if (this.currentAxiom.length > 0 && epoch < this.soloistBusyUntilBar) {
            let activeAxiom = this.currentAxiom;
            if (this.state.lastMutationType === 'inversion') activeAxiom = invertPhrase(activeAxiom);
            else if (this.state.lastMutationType === 'retrograde') activeAxiom = retrogradePhrase(activeAxiom);
            else if (this.state.lastMutationType === 'jitter') activeAxiom = applyRhythmicJitter(activeAxiom, this.seed + epoch);
            
            melodyEvents = this.renderMelodicSegment(epoch, resChord, dna, 'melody', activeAxiom, this.currentAxiomMaxTick, this.currentTimeScale, tension);
        }
        
        if (melodyEvents.length === 0) {
            melodyEvents = this.renderGapFiller(epoch, resChord, tension);
            currentLickDisplayId = 'Gap-Filler';
        }

        melodyEvents.forEach(e => e.pan = -0.15);
        events.push(...melodyEvents.flatMap(e => this.rippleLongNote(e, resChord)));
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
        this.selectHarmonyInstrument(epoch, tension, false);
        const harmonyEvents = this.renderDerivativeHarmony(resChord, epoch, this.activeHarmonyInstrument);
        harmonyEvents.forEach(e => e.pan = 0.35);
        events.push(...harmonyEvents.flatMap(e => this.rippleLongNote(e, resChord)));
    }

    const modeStr = this.config.isImprovising ? 'IMPROVISATION' : 'RESTORATION';

    return {
        events, lickId: currentLickDisplayId, mutationType: this.state.lastMutationType, newBpm,
        instrumentOverrides, trackName: this.currentTrackName,
        activeAxioms: {
            melody: isSoloistResting ? 'Breath' : currentLickDisplayId,
            ensemble: `${this.ensembleStatus} [${modeStr}]`,
            bass: bassStatus,
            drums: isSoloistResting ? 'SOLO FILL' : 'Imperial Pulse'
        },
        narrative: `Blues ${modeStr}: ${this.currentTrackName} [Status: ${isSoloistResting ? 'BREATHING' : 'PLAYING'}]`
    };
  }

  private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 12;
      const scale = [0, 3, 5, 6, 7, 10]; 
      
      const noteCount = calculateMusiNum(epoch, 3, this.seed, 3) + 1;
      const ticks = [0, 3, 6, 9].sort(() => this.random.next() - 0.5).slice(0, noteCount);
      
      ticks.forEach(t => {
          const degIdx = calculateMusiNum(epoch + t, 11, this.seed, scale.length);
          const note = root + scale[degIdx] + this.currentTransposition + this.microTransposition;
          
          events.push({
              type: 'melody',
              note: Math.min(note, this.MELODY_CEILING),
              time: t * TICK_TO_BEAT,
              duration: (1.5 * TICK_TO_BEAT) * 1.25,
              weight: 0.65 + (tension * 0.15),
              technique: tension > 0.4 ? 'vb' : 'pick',
              dynamics: 'p',
              phrasing: 'legato'
          });
      });

      return events;
  }

  private renderHybridDrums(epoch: number, tension: number, isSoloistResting: boolean): FractalEvent[] {
      const events: FractalEvent[] = [];
      
      events.push({ 
          type: 'drum_kick_reso', note: 36, time: 0, 
          duration: 0.1, weight: 1.05, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' 
      });
      
      if (tension > 0.6 || this.random.next() < 0.4) {
          events.push({ 
              type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, 
              duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' 
          });
      }

      [3, 9].forEach(t => {
          events.push({ 
              type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, 
              duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' 
          });
      });

      [1, 2, 4, 5, 7, 8, 10, 11].forEach(t => {
          if (this.random.next() < 0.45) {
              events.push({ 
                  type: 'drum_snare_ghost_note', note: 38, time: t * TICK_TO_BEAT, 
                  duration: 0.1, weight: 0.15 + (this.random.next() * 0.2), 
                  technique: 'ghost', dynamics: 'p', phrasing: 'staccato' 
              });
          }
      });

      if (this.random.next() < 0.15) {
          events.push({
              type: 'drum_ride_wetter', note: 51, 
              time: (this.random.nextInt(12)) * TICK_TO_BEAT, 
              duration: 4.0, weight: 0.45, technique: 'hit', dynamics: 'p', phrasing: 'legato', pan: 0.4
          });
      }

      [0, 3, 6, 9].forEach(t => {
          events.push({ 
              type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, 
              time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.35, 
              technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.2
          });
      });

      const isFourthBar = epoch % 4 === 3;
      const isEighthBar = epoch % 8 === 7;
      
      if (isFourthBar || isEighthBar || isSoloistResting) {
          const intensity = isEighthBar ? 1.2 : 0.95;
          const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
          const pans = [-0.8, 0.0, 0.8]; 
          
          [9, 10, 11].forEach((t, i) => {
              const rollRoll = this.random.next();
              if (rollRoll < 0.9) { 
                  events.push({ 
                      type: tomTypes[i] as any, note: 40, time: t * TICK_TO_BEAT, 
                      duration: 0.5, weight: (0.75 + i * 0.1) * intensity, 
                      technique: 'hit', dynamics: 'f', phrasing: 'staccato', pan: pans[i] 
                  });
              }
          });
      }

      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
    const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
    const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
    const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
    const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
    return phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale)).map((n) => {
        const useVibrato = (tension > 0.4 && n.d >= 3) || n.tech === 'vb' || n.tech === 'bn';
        
        return {
            type: type as any,
            note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT * timeScale,
            duration: (n.d * TICK_TO_BEAT * timeScale) * 1.25,
            weight: 0.75, 
            technique: useVibrato ? 'vb' as Technique : (n.tech as any || 'pick'), 
            dynamics: 'p', 
            phrasing: 'legato'
        };
    });
  }

  private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
      if (this.currentBassAxiom.length > 0) {
          const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
          const startEpoch = this.soloistBusyUntilBar - totalBars;
          const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
          const barOffset = mosaicBar * TICKS_PER_BAR;
          const barNotes = this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
          if (barNotes.length > 0) return barNotes.map(n => ({ type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8, technique: 'pick', dynamics: 'p', phrasing: 'legato' }));
      }
      return tension > 0.7 ? this.renderWalkingBass(chord, epoch) : this.renderRiffBass(chord, epoch);
  }

  private renderRiffBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition;
    const barInRiff = epoch % 4;
    const riff = [ [{ t: 0, n: root }, { t: 4, n: root }, { t: 8, n: root + 7 }], [{ t: 0, n: root }, { t: 6, n: root + 7 }, { t: 9, n: root + 10 }], [{ t: 0, n: root + 7 }, { t: 4, n: root + 5 }, { t: 8, n: root }], [{ t: 0, n: root }, { t: 4, n: root + 3 }, { t: 8, n: root + 4 }] ];
    return riff[barInRiff].map(p => ({ type: 'bass', note: this.constrainBassOctave(p.n), time: p.t * TICK_TO_BEAT, duration: 4 * TICK_TO_BEAT, weight: 0.8, technique: 'pick', dynamics: 'p', phrasing: 'legato' }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12 + this.currentTransposition + this.microTransposition;
    return [root, root + 4, root + 7, root + 11].map((p, i) => ({ type: 'bass', note: this.constrainBassOctave(p), time: (i * 3) * TICK_TO_BEAT, duration: 3 * TICK_TO_BEAT, weight: 0.75, technique: 'pick', dynamics: 'p', phrasing: 'legato' }));
  }

  private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
      const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
      const startEpoch = this.soloistBusyUntilBar - totalBars;
      const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
      const barOffset = mosaicBar * TICKS_PER_BAR;
      return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
          type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition),
          time: (n.t - barOffset) * TICK_TO_BEAT, 
          // #ЗАЧЕМ: ПЛАН №85. Лимитирование длительности для предотвращения гудения.
          duration: Math.min(n.d, 6) * TICK_TO_BEAT, 
          weight: 0.6, 
          technique: 'hit', // #ЗАЧЕМ: Отмена swell в блюзе.
          dynamics: 'p', 
          phrasing: 'staccato'
      }));
  }

  /**
   * #ЗАЧЕМ: ПЛАН №60. Реформа блюзового аккомпанемента.
   * #ЧТО: Замена статичного гудения на ритмические "Organ Chops".
   */
  private renderAdaptiveAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = chord.rootNote + 12 + this.currentTransposition + this.microTransposition;
    const isMinor = chord.chordType === 'minor';
    const intervals = isMinor ? [0, 3, 7, 10] : [0, 4, 7, 10]; 
    const events: FractalEvent[] = [];

    // Shuffle comping pattern (backbeats + syncopated pushes)
    const pattern = [3, 9];
    if (calculateMusiNum(epoch, 5, this.seed, 100) < 30) pattern.push(10.5); 

    pattern.forEach(t => {
        intervals.forEach((interval, i) => {
            events.push({
                type: 'accompaniment',
                note: this.constrainAccompanimentOctave(root + interval),
                time: t * TICK_TO_BEAT,
                duration: 0.75 * TICK_TO_BEAT, 
                weight: 0.45 + (tension * 0.1),
                technique: 'hit',
                dynamics: 'p',
                phrasing: 'staccato',
                params: { attack: 0.015, release: 1.2 }
            });
        });
    });
    return events;
  }

  /**
   * #ЗАЧЕМ: ПЛАН №60. Интеллектуальный пианист.
   * #ЧТО: Переход от дубляжа к "Jazz Echoes" (ответным фразам).
   */
  private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 12 + this.currentTransposition + this.microTransposition;
      const scale = [0, 2, 3, 4, 7, 9, 10]; 

      if (melodyEvents.length > 0) {
          // Shadow mode: Follow melody with thirds/fifths but more audible weight
          const thirdInterval = chord.chordType === 'minor' ? 3 : 4;
          melodyEvents.forEach((m, i) => {
              if (i % 2 === 0) {
                  events.push({ 
                      ...m, type: 'pianoAccompaniment', 
                      note: this.constrainAccompanimentOctave(m.note + thirdInterval), 
                      weight: 0.65, // Increased weight for audibility
                      technique: 'hit', dynamics: 'p', phrasing: 'staccato', 
                      params: { ...m.params, release: 2.5 } 
                  });
              }
          });
          return { events, style: "Shadow Support" };
      } else {
          // Fill mode: Play subtle jazz responses in melody gaps
          [1.5, 4.5, 7.5, 10.5].forEach((t, i) => {
              if (calculateMusiNum(epoch + i, 7, this.seed, 100) < 40) {
                  const degIdx = calculateMusiNum(epoch + i, 11, this.seed, scale.length);
                  events.push({
                      type: 'pianoAccompaniment',
                      note: this.constrainAccompanimentOctave(root + scale[degIdx]),
                      time: t * TICK_TO_BEAT,
                      duration: 0.5 * TICK_TO_BEAT,
                      weight: 0.58,
                      technique: 'hit',
                      dynamics: 'p',
                      phrasing: 'staccato',
                      params: { attack: 0.01, release: 3.0 }
                  });
              }
          });
          return { events, style: "Jazz Echoes" };
      }
  }

  private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
      const events: FractalEvent[] = []; 
      const root = chord.rootNote + this.currentTransposition + this.microTransposition; 
      const scale = [0, 2, 4, 5, 7, 9, 11];
      [0, 3, 6, 9].forEach((t, i) => { 
          events.push({ type: 'bass', note: this.constrainBassOctave(root - 12 + scale[i % scale.length]), time: t * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.7, technique: 'pick', dynamics: 'p', phrasing: 'legato' }); 
      });
      events.push({ type: 'accompaniment', note: this.constrainAccompanimentOctave(root + 12), time: 0, duration: 4.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'legato' });
      if (hints.melody) events.push({ type: 'melody', note: root + 24, time: 1.5, duration: 2.5, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'legato' });
      events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      events.push({ type: 'drum_snare', note: 38, time: 9 * TICK_TO_BEAT, duration: 0.1, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      return events;
  }

  private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'violin' | 'guitarChords'): FractalEvent[] {
      const rootMidi = currentChord.rootNote + this.currentTransposition + this.microTransposition;
      const rootName = MIDI_NOTE_NAMES[rootMidi % 12] || 'C';
      const chordName = rootName + (currentChord.chordType === 'minor' ? 'm' : '');
      const note = this.constrainAccompanimentOctave(rootMidi + 12);
      if (timbre === 'guitarChords') return [{ type: 'harmony', note: note, time: 0, duration: 4.0, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato', chordName: chordName }];
      return [{ type: 'harmony', note: note + 12, time: 0, duration: 4.0, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'legato' }];
  }

  private constrainBassOctave(note: number): number {
      let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n;
  }

  private constrainAccompanimentOctave(note: number): number {
      let n = note; while (n > 71) n -= 12; while (n < 48) n += 12; return n;
  }
}
