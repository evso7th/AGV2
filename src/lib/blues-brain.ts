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
    repairLegacyPhrase
} from './music-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';
import { BLUES_GUITAR_RIFFS } from './assets/blues-guitar-riffs';

/**
 * @fileOverview Blues Brain V207.0 — "Groove Recovery".
 * #ОБНОВЛЕНО (ПЛАН №766): 
 * 1. Tom Fills: Барабанщик снова делает "пробежки" по томам каждые 4 такта.
 * 2. Ghost Groove: Добавлены призрачные ноты для малого барабана.
 * 3. Restraint Update: Усилена связь между паузами солиста и активностью ударных.
 */

const TICKS_PER_BAR = 12;
const BEATS_PER_BAR = 4;
const TICK_TO_BEAT = BEATS_PER_BAR / TICKS_PER_BAR; // 1/3

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

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
}

export const DEFAULT_CONFIG: BluesBrainConfig = {
  tempo: 72,
  rootNote: 55, 
  emotion: { melancholy: 0.82, darkness: 0.25 },
  genre: 'blues'
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
  
  private currentBassAxiom: any[] = [];
  private currentAccompAxioms: { phrase: any[], role: string }[] = [];
  
  private currentLickId: string = '';
  private currentTrackName: string = 'Local';
  private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
  
  private readonly MELODY_CEILING = 72; 
  private readonly BASS_FLOOR = 31; 
  private readonly BASS_CEILING = 47; 

  private soloistBusyUntilBar: number = -1;
  private soloistRestingUntilBar: number = -1;
  private accompanimentRestingUntilBar: number = -1;
  
  private lastPhraseComplexity: number = 0;

  private state: BluesCognitiveState & { 
      lastMutationType: string,
      lastTension: number,
      recentLicks: string[],
      recentGrandMelodies: string[]
  };

  constructor(
      seed: number, 
      mood: Mood, 
      sessionLickHistory?: string[], 
      cloudAxioms?: any[], 
      selectedCompositionIds?: string[],
      activeAnchorId?: string | null,
      genre?: string
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
      recentGrandMelodies: []
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

  public updateCloudAxioms(axioms: any[], selectedCompositionIds?: string[], activeAnchorId?: string | null, activeAnchorRoot?: number | null) {
      this.config.cloudAxioms = axioms;
      this.config.selectedCompositionIds = selectedCompositionIds || [];
      if (activeAnchorId !== undefined) this.config.activeAnchorId = activeAnchorId;
      if (activeAnchorRoot !== undefined) this.config.activeAnchorRoot = activeAnchorRoot;
  }

  private constrainBassOctave(note: number): number {
      let finalNote = note;
      while (finalNote > this.BASS_CEILING) finalNote -= 12;
      while (finalNote < this.BASS_FLOOR) finalNote += 12;
      return finalNote;
  }

  private constrainAccompanimentOctave(note: number): number {
      let finalNote = note;
      while (finalNote > 71) finalNote -= 12;
      while (finalNote < 48) finalNote += 12;
      return finalNote;
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

    if (epoch % 12 === 0) {
        this.state.lastMutationType = this.config.activeAnchorId ? 'none' : ['none', 'inversion', 'retrograde', 'jitter'][this.random.nextInt(4)];
    }

    const isSoloistFree = epoch >= this.soloistBusyUntilBar;
    const isSoloistResting = epoch < this.soloistRestingUntilBar;

    let newBpm: number | undefined;
    if (isSoloistFree && !isSoloistResting) {
        const complexityThreshold = 0.6;
        if (this.lastPhraseComplexity > complexityThreshold && this.random.next() < 0.7) {
            this.soloistRestingUntilBar = epoch + 3 + this.random.nextInt(2);
            this.lastPhraseComplexity = 0; 
        } else if (this.random.next() < 0.3) {
            this.soloistRestingUntilBar = epoch + 1;
        } else {
            newBpm = this.selectNextAxiom(navInfo, dna, epoch);
        }
    }

    const events: FractalEvent[] = [];

    // --- 1. MELODY ---
    const melodyEvents = (hints.melody && !isSoloistResting && epoch < this.soloistBusyUntilBar) 
        ? this.renderMelodicSegment(epoch, currentChord, dna, 'melody', this.currentAxiom, this.currentAxiomMaxTick, this.currentTimeScale) 
        : [];
    
    // --- 2. DRUMS & BASS ---
    if (hints.drums) events.push(...this.renderNarrativeDrums(epoch, tension, isSoloistResting));
    const bassEvents = hints.bass ? this.renderSymbioticBass(currentChord, epoch, tension, dna) : [];
    events.push(...bassEvents);

    // --- 3. ACCOMPANIMENT & HARMONY ---
    const accompanimentEvents: FractalEvent[] = [];
    const usedTargetLayers = new Set<string>();
    const isAccompResting = epoch < this.accompanimentRestingUntilBar;
    const unisonType = navInfo.currentPart.instrumentRules?.accompaniment?.unisonType || 'none';

    if (!isAccompResting) {
        if (hints.accompaniment && unisonType !== 'none') {
            accompanimentEvents.push(...this.renderUnisonAccompaniment(bassEvents, currentChord, unisonType));
            usedTargetLayers.add('accompaniment');
        } else if (hints.accompaniment && this.currentAccompAxioms.length > 0) {
            const primaryAccomp = this.currentAccompAxioms[0];
            accompanimentEvents.push(...this.renderHeritageAccompaniment(currentChord, epoch, primaryAccomp.phrase, 'accompaniment', dna, tension));
            usedTargetLayers.add('accompaniment');

            this.currentAccompAxioms.slice(1).forEach((ax) => {
                const role = ax.role.toLowerCase();
                let targetType: InstrumentPart = role.includes('piano') ? 'pianoAccompaniment' : 'harmony';
                if ((navInfo.currentPart.layers as any)[targetType] && !usedTargetLayers.has(targetType)) {
                    accompanimentEvents.push(...this.renderHeritageAccompaniment(currentChord, epoch, ax.phrase, targetType, dna, tension));
                    usedTargetLayers.add(targetType);
                }
            });
        } else if (hints.accompaniment) {
            accompanimentEvents.push(...this.renderAdaptiveAccompaniment(epoch, currentChord, tension));
            usedTargetLayers.add('accompaniment');
        }
    }

    events.push(...accompanimentEvents);

    if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
        events.push(...this.renderShadowPiano(epoch, melodyEvents, accompanimentEvents));
    }
    
    if (hints.harmony && !usedTargetLayers.has('harmony')) {
        const useViolin = tension > 0.88 || tension < 0.15;
        events.push(...this.renderDerivativeHarmony(currentChord, epoch, useViolin ? 'violin' : 'guitarChords'));
    }

    events.push(...melodyEvents);

    return { 
        events, 
        lickId: this.currentLickId, 
        mutationType: this.state.lastMutationType,
        newBpm,
        activeAxioms: {
            melody: isSoloistResting ? 'Breath' : this.currentLickId,
            ensemble: this.ensembleStatus,
            bass: this.currentBassAxiom.length > 0 ? 'Sibling' : 'Rhythmic',
            accompaniment: isAccompResting ? 'Breath' : (usedTargetLayers.has('accompaniment') ? 'Active' : 'none')
        },
        narrative: `Blues Narrative: ${this.currentTrackName}`
    };
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
      this.currentBassAxiom = []; 
      this.currentAccompAxioms = [];
      this.ensembleStatus = 'ADAPTIVE';
      this.currentTimeScale = 1;

      if (this.config.cloudAxioms && this.config.cloudAxioms.length > 0) {
          const targetAnchor = this.config.activeAnchorId ? this.normalize(this.config.activeAnchorId) : null;
          let basePool = this.config.cloudAxioms.filter(ax => ax.role === 'melody');
          if (targetAnchor) {
              const anchorPool = this.config.cloudAxioms.filter(ax => this.normalize(ax.compositionId) === targetAnchor);
              basePool = anchorPool.filter(ax => ax.role === 'melody');
              if (basePool.length === 0) basePool = anchorPool.filter(ax => ax.role?.startsWith('accomp'));
          }

          if (basePool.length > 0) {
              const commonMoodFilter = MOOD_TO_COMMON[this.mood];
              const moodMatched = basePool.filter(ax => {
                  const moods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                  const commonArr = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                  return (moods.includes(this.mood) || commonArr.includes(commonMoodFilter));
              });

              const finalPool = moodMatched.length > 0 ? moodMatched : basePool;
              const selected = finalPool[this.random.nextInt(finalPool.length)];
              if (!selected) return undefined;

              this.currentLickId = selected.id;
              this.currentTrackName = selected.compositionId; 
              this.state.recentLicks.push(selected.id);
              
              let rawPhrase = decompressCompactPhrase(selected.phrase);
              const shortNotes = rawPhrase.filter(n => n.d < 3).length;
              this.lastPhraseComplexity = shortNotes / Math.max(1, rawPhrase.length);
              
              if (this.lastPhraseComplexity > 0.4 && this.config.tempo > 85) {
                  this.currentTimeScale = 2;
              }

              const phrasesToNormalize = [rawPhrase];
              const cid = this.normalize(selected.compositionId);
              const bassSibling = this.config.cloudAxioms.find(ax => ax.role === 'bass' && this.normalize(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
              
              if (bassSibling) {
                  const rb = decompressCompactPhrase(bassSibling.phrase);
                  phrasesToNormalize.push(rb);
                  this.currentBassAxiom = rb;
              }

              const accompSiblings = this.config.cloudAxioms.filter(ax => ax.role?.startsWith('accomp') && this.normalize(ax.compositionId) === cid && ax.barOffset === selected.barOffset).slice(0, 3);
              accompSiblings.forEach(ax => {
                  const p = decompressCompactPhrase(ax.phrase);
                  phrasesToNormalize.push(p);
                  this.currentAccompAxioms.push({ phrase: p, role: ax.role });
              });

              normalizePhraseGroup(phrasesToNormalize);
              const baseBars = selected.bars || 4;
              this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
              this.currentAxiom = rawPhrase; 
              this.soloistBusyUntilBar = epoch + (baseBars * this.currentTimeScale);
              this.ensembleStatus = 'SIBLING';
              return selected.nativeBpm || undefined;
          }
      }

      this.ensembleStatus = 'LOCAL';
      const allLickIds = Object.keys(BLUES_SOLO_LICKS);
      const nextId = allLickIds[this.random.nextInt(allLickIds.length)];
      this.currentLickId = nextId;
      this.currentAxiom = decompressCompactPhrase(BLUES_SOLO_LICKS[nextId].phrase as any);
      this.currentAxiomMaxTick = 48;
      this.soloistBusyUntilBar = epoch + 4;
      this.lastPhraseComplexity = 0.5;
      return undefined;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number): FractalEvent[] {
    const barCountInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
    const startEpoch = this.soloistBusyUntilBar - barCountInPhrase;
    const barInCycle = (epoch - startEpoch) % barCountInPhrase;
    
    const barOffset = (barInCycle * TICKS_PER_BAR) / timeScale;
    const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
    
    const effectiveRoot = (dna.activeAnchorRoot && this.config.activeAnchorId) ? dna.activeAnchorRoot : chord.rootNote;

    return barNotes.map((n, idx) => {
        let tech = n.tech || 'pick';
        const nextNote = barNotes[idx + 1];
        if (nextNote) {
            const interval = Math.abs(DEGREE_TO_SEMITONE[n.deg] - DEGREE_TO_SEMITONE[nextNote.deg]);
            if (interval > 0 && interval <= 2) tech = 'sl';
        }
        if (n.d >= 6 && (tech === 'pick' || tech === '0')) tech = 'vb';
        if ((n.deg === 'b5' || n.deg === 'b3') && n.d >= 4) tech = 'bn';

        const isEndOfShred = idx === barNotes.length - 1 && n.d < 3;
        const weight = isEndOfShred ? 0.95 : 0.85;

        return {
            type: type,
            note: Math.min(effectiveRoot + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT * timeScale,
            duration: n.d * TICK_TO_BEAT * timeScale,
            weight: weight, 
            technique: tech as any, 
            dynamics: 'p', 
            phrasing: 'legato'
        };
    });
  }

  private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
      if (this.currentBassAxiom.length > 0) {
          const barCountInPhrase = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
          const startEpoch = this.soloistBusyUntilBar - barCountInPhrase;
          const barInAxiom = (epoch - startEpoch) % barCountInPhrase;
          const barOffset = barInAxiom * TICKS_PER_BAR;
          const barNotes = this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
          const effectiveRoot = (dna.activeAnchorRoot && this.config.activeAnchorId) ? dna.activeAnchorRoot : chord.rootNote;

          return barNotes.map(n => ({
              type: 'bass',
              note: this.constrainBassOctave(effectiveRoot - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
              time: (n.t - barOffset) * TICK_TO_BEAT, 
              duration: n.d * TICK_TO_BEAT, 
              weight: 0.85, technique: 'pluck', dynamics: 'p', phrasing: 'legato'
          }));
      }
      return tension > 0.7 ? this.renderWalkingBass(chord, epoch) : this.renderRiffBass(chord, epoch);
  }

  private renderUnisonAccompaniment(bassEvents: FractalEvent[], chord: GhostChord, type: string): FractalEvent[] {
      const events: FractalEvent[] = [];
      const third = chord.chordType === 'minor' ? 3 : 4;
      bassEvents.slice(0, 2).forEach(bass => {
          events.push({
              ...bass, type: 'accompaniment', 
              note: this.constrainAccompanimentOctave(type === 'strict' ? bass.note : bass.note + 12),
              weight: 0.35, technique: 'hit', phrasing: 'staccato', duration: 0.4 * TICK_TO_BEAT
          });
          events.push({
              type: 'accompaniment', 
              note: this.constrainAccompanimentOctave((bass.note || 0) + 24 + third),
              time: bass.time + (1.5 * TICK_TO_BEAT), duration: 0.3 * TICK_TO_BEAT,
              weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
          });
      });
      return events;
  }

  private renderRiffBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12;
    const barInRiff = epoch % 4;
    const riff = [ 
        [{ t: 0, n: root }, { t: 4, n: root }, { t: 8, n: root + 7 }], 
        [{ t: 0, n: root }, { t: 6, n: root + 7 }, { t: 9, n: root + 10 }], 
        [{ t: 0, n: root + 7 }, { t: 4, n: root + 5 }, { t: 8, n: root }],
        [{ t: 0, n: root }, { t: 4, n: root + 3 }, { t: 8, n: root + 4 }] 
    ];
    return riff[barInRiff].map(p => ({ 
        type: 'bass', note: this.constrainBassOctave(p.n), time: p.t * TICK_TO_BEAT, duration: 4 * TICK_TO_BEAT, 
        weight: 0.85, technique: 'pluck', dynamics: 'p', phrasing: 'legato' 
    }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12;
    return [root, root + 4, root + 7, root + 11].map((p, i) => ({ 
        type: 'bass', note: this.constrainBassOctave(p), time: (i * 3) * TICK_TO_BEAT, duration: 3 * TICK_TO_BEAT, 
        weight: 0.85, technique: 'pluck', dynamics: 'p', phrasing: 'legato' 
    }));
  }

  /**
   * #ЗАЧЕМ: Нарративные ударные с поддержкой филлов по томам (ПЛАН №766).
   */
  private renderNarrativeDrums(epoch: number, tension: number, isSoloistResting: boolean): FractalEvent[] {
      const events: FractalEvent[] = [];
      const isFourthBar = epoch % 4 === 3;
      
      // Basic Groove
      [0, 6].forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.75, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      
      // Ghost Snare for more flow
      if (this.random.next() < 0.4) {
          events.push({ type: 'drum_snare_ghost_note', note: 38, time: 4.5 * TICK_TO_BEAT, duration: 0.1, weight: 0.25, technique: 'ghost', dynamics: 'p', phrasing: 'staccato' });
          events.push({ type: 'drum_snare_ghost_note', note: 38, time: 10.5 * TICK_TO_BEAT, duration: 0.1, weight: 0.2, technique: 'ghost', dynamics: 'p', phrasing: 'staccato' });
      }

      [0, 3, 6, 9].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));

      // #ЗАЧЕМ: Возвращение "пробежек" по томам (ПЛАН №766).
      // Филлы происходят на 4-й такт или когда солист молчит.
      if (isFourthBar || (isSoloistResting && this.random.next() < 0.5)) {
          const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
          const fillTicks = [9, 10, 11];
          fillTicks.forEach((t, i) => {
              events.push({
                  type: tomTypes[i] as any,
                  note: 40,
                  time: t * TICK_TO_BEAT,
                  duration: 0.5,
                  weight: 0.6 + (i * 0.1),
                  technique: 'hit',
                  dynamics: 'p',
                  phrasing: 'staccato'
              });
          });
          // Crash on the transition to next bar if it's very tense
          if (tension > 0.8) {
              events.push({ type: 'drum_ride_wetter', note: 51, time: 11.5 * TICK_TO_BEAT, duration: 4.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'legato' });
          }
      }

      return events;
  }

  private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
      const barCountInPhrase = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
      const startEpoch = this.soloistBusyUntilBar - barCountInPhrase;
      const barInAxiom = (epoch - startEpoch) % barCountInPhrase;
      const barOffset = barInAxiom * TICKS_PER_BAR;
      const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
      const effectiveRoot = (dna.activeAnchorRoot && this.config.activeAnchorId) ? dna.activeAnchorRoot : chord.rootNote;
      const events: FractalEvent[] = [];

      barNotes.forEach(n => {
          events.push({
              type: type,
              note: this.constrainAccompanimentOctave(effectiveRoot + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
              time: (n.t - barOffset) * TICK_TO_BEAT,
              duration: Math.min(n.d, 6) * TICK_TO_BEAT, 
              weight: 0.25, 
              technique: 'hit',
              dynamics: 'p',
              phrasing: 'staccato'
          });
      });
      return events;
  }

  private renderAdaptiveAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = this.constrainAccompanimentOctave(chord.rootNote + 12 + calculateMusiNum(epoch, 3, this.seed, 12));
    return [{
        type: 'accompaniment', note: root, time: 0, duration: 4.0 * TICK_TO_BEAT, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
    }];
  }

  private renderShadowPiano(epoch: number, melodyEvents: FractalEvent[], accompanimentEvents: FractalEvent[]): FractalEvent[] {
      const root = this.constrainAccompanimentOctave(accompanimentEvents[0]?.note || (melodyEvents[0]?.note - 12) || 60);
      const degrees = [14, 17, 21, 12, 14, 0];
      const shift = degrees[calculateMusiNum(epoch, 5, this.seed + 100, degrees.length)];
      return [{
          type: 'pianoAccompaniment', 
          note: this.constrainAccompanimentOctave(root + shift),
          time: (this.random.nextInt(2) * 6) * TICK_TO_BEAT, duration: 0.4 * TICK_TO_BEAT, 
          weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
      }];
  }

  private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'guitarChords' | 'violin'): FractalEvent[] {
      const root = this.constrainAccompanimentOctave(currentChord.rootNote + 12 + calculateMusiNum(epoch, 3, this.seed + 50, 12));
      
      if (timbre === 'guitarChords') {
          return [{ 
              type: 'harmony', 
              note: this.constrainAccompanimentOctave(root), 
              time: 0, 
              duration: 0.5 * TICK_TO_BEAT, 
              weight: 0.25, 
              technique: 'hit', 
              dynamics: 'p', 
              phrasing: 'staccato',
              chordName: currentChord.chordType === 'minor' ? 'Am' : 'A'
          }];
      }

      return [{
          type: 'harmony',
          note: this.constrainAccompanimentOctave(root + 12),
          time: 0,
          duration: 4.0 * TICK_TO_BEAT, 
          weight: 0.3,
          technique: 'swell',
          dynamics: 'p',
          phrasing: 'legato'
      }];
  }
}
