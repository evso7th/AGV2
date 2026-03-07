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
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    getWalkingDegree
} from './music-theory';
import { 
    getChordNameForBar 
} from './blues-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';
import { BLUES_GUITAR_RIFFS, BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { BLUES_MELODY_RIFFS } from './assets/blues-melody-riffs';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * @fileOverview Blues Brain V200.0 — "The Comping Singularity".
 * #ОБНОВЛЕНО (ПЛАН №754): 
 * 1. Искоренено наслоение нескольких "аккомпаниаторов" в слое A.
 * 2. Внедрен "Ритмический Затвор" (Gating) — ноты больше не сливаются.
 * 3. Строгий лимит на 1 аксиому на 1 инструментальный слой.
 */

const TICKS_PER_BAR = 12;
const BEATS_PER_BAR = 4;
const TICK_TO_BEAT = BEATS_PER_BAR / TICKS_PER_BAR; // 1/3

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const BLUES_PROGRESSION_OFFSETS = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];

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
  rootNote: 55, // G3
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
  
  private secondaryAxiom: any[] = [];
  private secondaryAxiomMaxTick: number = 0;

  private currentBassAxiom: any[] = [];
  private currentAccompAxioms: { phrase: any[], role: string }[] = [];
  
  private currentLickId: string = '';
  private currentTrackName: string = 'Local';
  private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
  
  private currentGuitarRiff: BluesGuitarRiff | null = null;
  private currentGrandMelody: BluesMelody | null = null;

  private readonly MELODY_CEILING = 72; 
  private readonly BASS_FLOOR = 31; 
  private readonly BASS_CEILING = 47; 

  private soloistBusyUntilBar: number = -1;
  private soloistRestingUntilBar: number = -1;
  private accompanimentRestingUntilBar: number = -1;

  private state: BluesCognitiveState & { 
      introBassStyle: 'drone' | 'riff' | 'walking',
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
      introBassStyle: 'walking',
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
      if (this.config.activeAnchorRoot !== undefined) this.config.activeAnchorRoot = activeAnchorRoot;
  }

  private constrainBassOctave(note: number): number {
      let finalNote = note;
      while (finalNote > this.BASS_CEILING) finalNote -= 12;
      while (finalNote < this.BASS_FLOOR) finalNote += 12;
      return finalNote;
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): { events: FractalEvent[], lickId?: string, mutationType?: string, activeAxioms?: any, narrative?: string } {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    this.state.lastTension = tension;

    const isChorusBoundary = epoch % 12 === 0;
    if (isChorusBoundary) {
        this.selectGrandAxiom(tension);
        if (!this.config.activeAnchorId) {
            const mutPool = ['none', 'inversion', 'retrograde', 'jitter'];
            this.state.lastMutationType = mutPool[this.random.nextInt(mutPool.length)];
        } else {
            this.state.lastMutationType = 'none';
        }
    }

    const isSoloistFree = epoch >= this.soloistBusyUntilBar;
    const isSoloistResting = epoch < this.soloistRestingUntilBar;

    if (isSoloistFree && !isSoloistResting) {
        if (this.random.next() < 0.45) { 
            this.soloistRestingUntilBar = epoch + 1;
        } else {
            this.selectNextAxiom(navInfo, dna, epoch);
        }
    }

    const events: FractalEvent[] = [];

    // --- 1. MELODY ---
    const melodyScale = navInfo.currentPart.instrumentRules?.melody?.timeScale || 1;
    const melodyEvents = (hints.melody && !isSoloistResting && epoch < this.soloistBusyUntilBar) 
        ? this.renderMelodicSegment(epoch, currentChord, dna, 'melody', this.currentAxiom, this.currentAxiomMaxTick, melodyScale) 
        : [];
    
    // --- 2. DRUMS & BASS ---
    if (hints.drums) events.push(...this.renderNarrativeDrums(epoch, tension));
    const bassEvents = hints.bass ? this.renderSymbioticBass(currentChord, epoch, tension, dna) : [];
    events.push(...bassEvents);

    // --- 3. ACCOMPANIMENT & HARMONY (The Singularity Fix) ---
    const accompanimentEvents: FractalEvent[] = [];
    const usedTargetLayers = new Set<string>(); // #ЗАЧЕМ: Предотвращение наслоения в одну партию.

    const isAccompResting = epoch < this.accompanimentRestingUntilBar;
    const unisonType = navInfo.currentPart.instrumentRules?.accompaniment?.unisonType || 'none';

    if (!isAccompResting) {
        if (hints.accompaniment && unisonType !== 'none') {
            accompanimentEvents.push(...this.renderUnisonAccompaniment(bassEvents, currentChord, unisonType));
            usedTargetLayers.add('accompaniment');
        } else if (hints.accompaniment && this.currentAccompAxioms.length > 0) {
            // #ЗАЧЕМ: Мы проходим по аксиомам, но заполняем каждый слой СТРОГО один раз.
            this.currentAccompAxioms.forEach((ax) => {
                const role = ax.role.toLowerCase();
                let targetType: InstrumentPart = 'accompaniment';
                
                if (role.includes('piano')) targetType = 'pianoAccompaniment';
                else if (role.includes('strings') || role.includes('violin') || role.includes('guitar')) targetType = 'harmony';
                
                // Если основной слой 'A' еще не занят, отдаем его этой аксиоме
                if (targetType === 'accompaniment' && usedTargetLayers.has('accompaniment')) {
                    // Если слой 'A' уже занят другим "аккомпаниатором", пробуем перекинуть в Гармонию
                    if (!usedTargetLayers.has('harmony')) targetType = 'harmony';
                    else return; // Иначе игнорируем, чтобы не было "двух музыкантов"
                }

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

    // --- 4. PIANO & HARMONY FALLBACKS ---
    if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
        events.push(...this.renderShadowPiano(epoch, melodyEvents, accompanimentEvents));
    }
    
    if (hints.harmony && !usedTargetLayers.has('harmony')) {
        events.push(...this.renderDerivativeHarmony(currentChord, epoch));
    }

    events.push(...melodyEvents);

    return { 
        events, 
        lickId: this.currentLickId, 
        mutationType: this.state.lastMutationType,
        activeAxioms: {
            melody: isSoloistResting ? 'Breath' : this.currentLickId,
            ensemble: this.ensembleStatus,
            bass: this.currentBassAxiom.length > 0 ? 'Sibling' : 'Rhythmic',
            accompaniment: isAccompResting ? 'Breath' : (usedTargetLayers.has('accompaniment') ? 'Active' : 'none')
        },
        narrative: `Blues Narrative: ${this.currentTrackName}`
    };
  }

  private selectGrandAxiom(tension: number) {
      const isMinor = this.mood === 'melancholic' || this.mood === 'dark' || this.mood === 'gloomy';
      const pool = BLUES_GUITAR_RIFFS.filter(r => 
          (r.moods.includes(this.mood) || (isMinor && r.type === 'minor')) &&
          !this.state.recentGrandMelodies.includes(r.id)
      );
      this.currentGuitarRiff = (pool.length > 0 ? pool : BLUES_GUITAR_RIFFS)[this.random.nextInt(Math.max(1, pool.length))];
      if (this.currentGuitarRiff) {
          this.state.recentGrandMelodies.push(this.currentGuitarRiff.id);
          if (this.state.recentGrandMelodies.length > 6) this.state.recentGrandMelodies.shift();
      }
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      this.currentBassAxiom = []; 
      this.currentAccompAxioms = [];
      this.secondaryAxiom = [];
      this.ensembleStatus = 'ADAPTIVE';

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
                  const commons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                  return (moodArr.includes(this.mood) || commonArr.includes(commonMoodFilter));
              });

              const finalPool = moodMatched.length > 0 ? moodMatched : basePool;
              const selected = finalPool[this.random.nextInt(finalPool.length)];
              if (!selected) return;

              this.currentLickId = selected.id;
              this.currentTrackName = selected.compositionId; 
              this.state.recentLicks.push(selected.id);
              
              let rawPhrase = decompressCompactPhrase(selected.phrase);
              const phrasesToNormalize = [rawPhrase];

              const cid = this.normalize(selected.compositionId);
              const bassSibling = this.config.cloudAxioms.find(ax => 
                  ax.role === 'bass' && this.normalize(ax.compositionId) === cid && ax.barOffset === selected.barOffset
              );
              
              if (bassSibling) {
                  const rb = decompressCompactPhrase(bassSibling.phrase);
                  phrasesToNormalize.push(rb);
                  this.currentBassAxiom = rb;
              }

              const accompSiblings = this.config.cloudAxioms.filter(ax => 
                  ax.role?.startsWith('accomp') && this.normalize(ax.compositionId) === cid && ax.barOffset === selected.barOffset
              ).slice(0, 3);

              accompSiblings.forEach(ax => {
                  const p = decompressCompactPhrase(ax.phrase);
                  phrasesToNormalize.push(p);
                  this.currentAccompAxioms.push({ phrase: p, role: ax.role });
              });

              normalizePhraseGroup(phrasesToNormalize);

              const phraseBars = selected.bars || 4;
              this.currentAxiomMaxTick = phraseBars * TICKS_PER_BAR;
              this.currentAxiom = rawPhrase; 
              this.soloistBusyUntilBar = epoch + phraseBars;
              this.ensembleStatus = 'SIBLING';
              return;
          }
      }

      this.ensembleStatus = 'LOCAL';
      const allLickIds = Object.keys(BLUES_SOLO_LICKS);
      const nextId = allLickIds[this.random.nextInt(allLickIds.length)];
      this.currentLickId = nextId;
      this.currentAxiom = decompressCompactPhrase(BLUES_SOLO_LICKS[nextId].phrase as any);
      this.currentAxiomMaxTick = 48;
      this.soloistBusyUntilBar = epoch + 4;
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
              weight: 0.85,
              technique: 'pluck', dynamics: 'p', phrasing: 'legato'
          }));
      }
      return tension > 0.7 ? this.renderWalkingBass(chord, epoch) : this.renderRiffBass(chord, epoch);
  }

  private renderUnisonAccompaniment(bassEvents: FractalEvent[], chord: GhostChord, type: string): FractalEvent[] {
      const events: FractalEvent[] = [];
      const third = chord.chordType === 'minor' ? 3 : 4;
      bassEvents.slice(0, 2).forEach(bass => {
          events.push({
              ...bass, type: 'accompaniment', note: type === 'strict' ? bass.note : bass.note + 12,
              weight: 0.5, technique: 'hit', phrasing: 'staccato', duration: 0.5 * TICK_TO_BEAT
          });
          events.push({
              type: 'accompaniment', note: (bass.note || 0) + 24 + third,
              time: bass.time + (1 * TICK_TO_BEAT), duration: 0.3 * TICK_TO_BEAT,
              weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
          });
      });
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number): FractalEvent[] {
    const barCountInPhrase = Math.ceil(maxTick / TICKS_PER_BAR);
    const startEpoch = this.soloistBusyUntilBar - barCountInPhrase;
    const barInCycle = (epoch - startEpoch) % barCountInPhrase;
    const barOffset = barInCycle * TICKS_PER_BAR;
    const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
    const effectiveRoot = (dna.activeAnchorRoot && this.config.activeAnchorId) ? dna.activeAnchorRoot : chord.rootNote;

    return barNotes.map(n => ({
        type: type,
        note: Math.min(effectiveRoot + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
        time: (n.t - barOffset) * TICK_TO_BEAT,
        duration: n.d * TICK_TO_BEAT,
        weight: 0.85, technique: n.tech || 'pick', dynamics: 'p', phrasing: 'legato'
    }));
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

  private renderNarrativeDrums(epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      [0, 6].forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.75, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [0, 2, 3, 5, 6, 8, 9, 11].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
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
          // #ЗАЧЕМ: ПЛАН №754 — Тотальный ритмический затвор.
          // #ЧТО: Даже короткие ноты теперь принудительно ограничиваются до 0.5 доли.
          const isLong = n.d >= 4; 
          
          if (isLong && (type === 'accompaniment' || type === 'harmony')) {
              [0, 4, 8].forEach((p, idx) => {
                  const tickInBar = (n.t - barOffset) + p;
                  if (tickInBar < TICKS_PER_BAR) {
                      const walker = idx === 1 ? 7 : 0; 
                      events.push({
                          type: type,
                          note: Math.min(effectiveRoot + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + walker, 64),
                          time: tickInBar * TICK_TO_BEAT,
                          duration: 0.5 * TICK_TO_BEAT, // #ЧТО: Жесткий короткий импульс
                          weight: 0.5, 
                          technique: 'hit',
                          dynamics: 'p',
                          phrasing: 'staccato',
                          params: { filterCutoff: 1200 + (tension * 1000) }
                      });
                  }
              });
          } else {
              events.push({
                  type: type,
                  note: Math.min(effectiveRoot + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), 64),
                  time: (n.t - barOffset) * TICK_TO_BEAT,
                  duration: 0.5 * TICK_TO_BEAT, // #ЧТО: Никаких длинных хвостов в партитуре
                  weight: 0.5,
                  technique: 'hit',
                  dynamics: 'p',
                  phrasing: 'staccato'
              });
          }
      });
      return events;
  }

  private renderAdaptiveAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = chord.rootNote + 12 + getWalkingDegree(epoch, this.seed);
    return [0, 4, 8].map(t => ({
        type: 'accompaniment', note: root, time: t * TICK_TO_BEAT, duration: 0.4 * TICK_TO_BEAT, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
    }));
  }

  private renderShadowPiano(epoch: number, melodyEvents: FractalEvent[], accompanimentEvents: FractalEvent[]): FractalEvent[] {
      const root = accompanimentEvents[0]?.note || (melodyEvents[0]?.note - 12);
      const shift = getWalkingDegree(epoch, this.seed + 100);
      return [{
          type: 'pianoAccompaniment', note: Math.min(root + shift, 72),
          time: (this.random.nextInt(4) * 3) * TICK_TO_BEAT, duration: 0.5 * TICK_TO_BEAT, 
          weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
      }];
  }

  private renderDerivativeHarmony(currentChord: GhostChord, epoch: number): FractalEvent[] {
      const root = currentChord.rootNote + 12 + getWalkingDegree(epoch, this.seed + 50);
      return [0, 6].map(t => ({ 
          type: 'harmony', note: Math.min(root, 64), 
          time: t * TICK_TO_BEAT, duration: 0.5 * TICK_TO_BEAT, 
          weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
      }));
  }
}
