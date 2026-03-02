
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
  InstrumentPart
} from '@/types/music';
import { 
    DEGREE_TO_SEMITONE,
    decompressCompactPhrase,
    stretchToNarrativeLength,
    calculateMusiNum,
    normalizePhraseGroup
} from './music-theory';
import { 
    getNextChordRoot, 
    getChordNameForBar 
} from './blues-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';
import { BLUES_GUITAR_RIFFS, BLUES_GUITAR_VOICINGS } from './assets/blues-guitar-riffs';
import { BLUES_MELODY_RIFFS } from './assets/blues-melody-riffs';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V173.2 — "Melancholic Resonance".
 * #ОБНОВЛЕНО (ПЛАН №707): Реализован протокол Zero-Tick для мгновенного старта фраз.
 */

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
  genre: string;
}

export const DEFAULT_CONFIG: BluesBrainConfig = {
  tempo: 72,
  rootNote: 55, // G3
  emotion: { melancholy: 0.82, darkness: 0.25 },
  genre: 'blues'
};

export class BluesBrain {
  private config: BluesBrainConfig;
  private seed: number;
  private mood: Mood;
  private random: any;
  
  private currentMelodyAxiomObj: any | null = null;
  private currentAxiom: any[] = [];
  private currentBassAxiom: any[] = [];
  private currentAccompAxioms: { phrase: any[], role: string }[] = [];
  
  private currentLickId: string = '';
  private currentTrackName: string = 'Local';
  private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
  
  private currentGuitarRiff: BluesGuitarRiff | null = null;
  private currentGrandMelody: BluesMelody | null = null;

  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 
  private readonly BASS_CEILING = 47; 

  private soloistBusyUntilBar: number = -1;

  private state: BluesCognitiveState & { 
      introBassStyle: 'drone' | 'riff' | 'walking',
      lastPianoHash: string,
      lastMelodyHash: string,
      lastAccompHash: string,
      currentMutationType: string,
      lastTension: number,
      tensionMomentum: number,
      activeAccompTimbre: string,
      recentLicks: string[],
      recentGrandMelodies: string[],
      driftVector: { time: number, pitch: number }
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

    const introStyles: ('drone' | 'riff' | 'walking')[] = ['drone', 'riff', 'walking'];
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
      lastPianoHash: '',
      lastMelodyHash: '',
      lastAccompHash: '',
      blueNotePending: false,
      emotion: { ...this.config.emotion },
      stagnationStrikes: { micro: 0, meso: 0, macro: 0 },
      introBassStyle: introStyles[this.random.nextInt(introStyles.length)],
      currentMutationType: 'jitter',
      lastTension: 0.5,
      tensionMomentum: 0,
      activeAccompTimbre: 'organ_soft_jazz',
      recentLicks: [...(sessionLickHistory || [])],
      recentGrandMelodies: [],
      driftVector: { time: 0, pitch: 0 }
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
      return s.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  public updateCloudAxioms(axioms: any[], selectedCompositionIds?: string[], activeAnchorId?: string | null) {
      this.config.cloudAxioms = axioms;
      this.config.selectedCompositionIds = selectedCompositionIds || [];
      if (activeAnchorId !== undefined) this.config.activeAnchorId = activeAnchorId;
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
    hints: InstrumentHints,
    lastEvents: FractalEvent[] = []
  ): { events: FractalEvent[], lickId?: string, mutationType?: string, activeAxioms?: any, narrative?: string } {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    this.state.tensionMomentum = tension - this.state.lastTension;
    this.state.lastTension = tension;

    const isChorusBoundary = epoch % 12 === 0;
    if (isChorusBoundary) this.selectGrandAxiom(tension);

    if (epoch >= this.soloistBusyUntilBar || epoch % 4 === 0 || navInfo.isPartTransition) {
        this.selectNextAxiom(navInfo, dna, epoch);
    }

    const events: FractalEvent[] = [];
    this.evaluateTimbralDramaturgy(tension, hints);

    const melodyEvents = (hints.melody && epoch < this.soloistBusyUntilBar) ? this.renderMelodicSegment(epoch, currentChord) : [];

    if (hints.drums) events.push(...this.renderNarrativeDrums(epoch, tension, melodyEvents));

    const bassEvents = hints.bass ? this.renderSymbioticBass(currentChord, epoch, tension, melodyEvents) : [];

    const unisonType = navInfo.currentPart.instrumentRules?.accompaniment?.unisonType || 'none';
    const accompanimentEvents: FractalEvent[] = [];
    
    if (hints.accompaniment && unisonType !== 'none') {
        accompanimentEvents.push(...this.renderUnisonAccompaniment(bassEvents, currentChord, unisonType));
    } else if (hints.accompaniment && this.currentAccompAxioms.length > 0) {
        this.currentAccompAxioms.forEach((ax, idx) => {
            const role = ax.role.toLowerCase();
            let targetType: InstrumentPart = 'accompaniment';
            
            if (role.includes('piano')) targetType = 'pianoAccompaniment';
            else if (role.includes('strings') || role.includes('violin') || role.includes('guitar')) targetType = 'harmony';
            else if (idx === 1 && !this.currentAccompAxioms.some(a => a.role.includes('strings'))) targetType = 'harmony';
            else if (idx === 2) targetType = 'pianoAccompaniment';

            if ((navInfo.currentPart.layers as any)[targetType]) {
                accompanimentEvents.push(...this.renderHeritageAccompaniment(currentChord, epoch, ax.phrase, targetType));
            }
        });
    } else if (hints.accompaniment) {
        accompanimentEvents.push(...this.renderAdaptiveAccompaniment(epoch, currentChord));
    }

    events.push(...accompanimentEvents);
    events.push(...bassEvents);

    if (hints.pianoAccompaniment && this.currentAccompAxioms.filter(a => a.role.includes('piano')).length === 0) {
        events.push(...this.renderShadowPiano(epoch, melodyEvents, accompanimentEvents));
    }

    events.push(...melodyEvents);

    if (hints.melody && this.currentGuitarRiff && this.mood !== 'melancholic') {
        events.push(...this.renderRhythmicTextureFromRiff(epoch));
    }
    
    let harAxiom = 'none';
    if (hints.harmony && this.currentAccompAxioms.filter(a => a.role.includes('strings') || a.role.includes('violin')).length === 0) {
        const harEvents = this.renderDerivativeHarmony(currentChord, epoch);
        events.push(...harEvents);
        harAxiom = harEvents[0]?.chordName || 'Active';
    }

    return { 
        events, 
        lickId: this.currentLickId, 
        activeAxioms: {
            melody: this.currentLickId,
            melodyTrack: this.currentTrackName,
            ensemble: this.ensembleStatus,
            bass: this.currentBassAxiom.length > 0 ? 'Sibling' : (tension > 0.7 ? 'Walking' : 'Riff'),
            drums: epoch % 12 === 8 || epoch % 12 === 9 ? 'Stop-Time' : (epoch % 4 === 3 ? 'Fill' : 'Main Beat'),
            accompaniment: this.currentAccompAxioms.length > 0 ? `${this.currentAccompAxioms.length} layers` : 'Adaptive',
            harmony: harAxiom
        },
        narrative: `Bar ${epoch % 12 + 1}/12. Persistence active.`
    };
  }

  private selectGrandAxiom(tension: number) {
      const isMinor = this.mood === 'melancholic' || this.mood === 'dark' || this.mood === 'gloomy';
      const pool = BLUES_GUITAR_RIFFS.filter(r => 
          (r.moods.includes(this.mood) || (isMinor && r.type === 'minor') || (!isMinor && r.type === 'major')) &&
          !this.state.recentGrandMelodies.includes(r.id)
      );
      const finalPool = pool.length > 0 ? pool : BLUES_GUITAR_RIFFS;
      this.currentGuitarRiff = finalPool[this.random.nextInt(finalPool.length)];
      this.state.recentGrandMelodies.push(this.currentGuitarRiff!.id);
      if (this.state.recentGrandMelodies.length > 6) this.state.recentGrandMelodies.shift();

      const melodyPool = BLUES_MELODY_RIFFS.filter(m => 
          (m.moods.includes(this.mood) || (isMinor && m.type === 'minor')) &&
          !this.state.recentLicks.includes(m.id)
      );
      const finalMelodyPool = melodyPool.length > 0 ? melodyPool : BLUES_MELODY_RIFFS;
      this.currentGrandMelody = finalMelodyPool[this.random.nextInt(finalMelodyPool.length)];
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      this.currentBassAxiom = []; 
      this.currentAccompAxioms = [];
      this.ensembleStatus = 'ADAPTIVE';

      if (this.config.cloudAxioms && this.config.cloudAxioms.length > 0) {
          const targetAnchor = this.config.activeAnchorId ? this.normalize(this.config.activeAnchorId) : null;
          const basePool = this.config.cloudAxioms.filter(ax => {
              if (ax.role !== 'melody') return false;
              const genreArr = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
              return genreArr.includes(this.config.genre);
          });

          const anchorPool = targetAnchor 
              ? basePool.filter(ax => this.normalize(ax.compositionId || '') === targetAnchor)
              : basePool;

          if (anchorPool.length > 0) {
              const commonMoodFilter = MOOD_TO_COMMON[this.mood];
              const moodMatched = anchorPool.filter(ax => {
                  const moodArr = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                  const commonArr = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                  return (moodArr.includes(this.mood) || commonArr.includes(commonMoodFilter));
              });

              const finalPool = moodMatched.length > 0 ? moodMatched : anchorPool;
              let freshPool = finalPool.filter(ax => !this.state.recentLicks.includes(ax.id));
              if (freshPool.length === 0) {
                  const poolIds = new Set(finalPool.map(ax => ax.id));
                  this.state.recentLicks = this.state.recentLicks.filter(id => !poolIds.has(id));
                  freshPool = finalPool;
              }
              const selected = freshPool[this.random.nextInt(freshPool.length)];
              
              this.currentLickId = selected.id;
              this.currentTrackName = selected.compositionId; 
              this.currentMelodyAxiomObj = selected;
              this.state.recentLicks.push(selected.id);
              if (this.state.recentLicks.length > 50) this.state.recentLicks.shift();
              
              const rawPhrase = decompressCompactPhrase(selected.phrase);
              const phrasesToNormalize = [rawPhrase];

              const bassSibling = this.config.cloudAxioms.find(ax => 
                  ax.role === 'bass' && this.normalize(ax.compositionId || '') === this.normalize(selected.compositionId) && 
                  ax.barOffset === selected.barOffset
              );
              
              let rawBass: any[] | null = null;
              if (bassSibling) {
                  rawBass = decompressCompactPhrase(bassSibling.phrase);
                  phrasesToNormalize.push(rawBass);
              }

              const rawAccomps: any[][] = [];
              const accompSiblings = this.config.cloudAxioms.filter(ax => 
                  ax.role?.startsWith('accomp') && 
                  this.normalize(ax.compositionId || '') === this.normalize(selected.compositionId) && 
                  ax.barOffset === selected.barOffset
              ).slice(0, 3);

              accompSiblings.forEach(ax => {
                  const p = decompressCompactPhrase(ax.phrase);
                  rawAccomps.push(p);
                  phrasesToNormalize.push(p);
              });

              // #ЗАЧЕМ: Протокол Zero-Tick.
              normalizePhraseGroup(phrasesToNormalize);

              this.currentAxiom = stretchToNarrativeLength(rawPhrase, 48, this.random);
              
              const phraseBars = Math.ceil(Math.max(...rawPhrase.map(n => n.t + n.d), 0) / 12);
              this.soloistBusyUntilBar = epoch + phraseBars;

              if (rawBass) {
                  this.currentBassAxiom = stretchToNarrativeLength(rawBass, 48, this.random);
              }

              if (rawAccomps.length > 0) {
                  this.currentAccompAxioms = rawAccomps.map((p, idx) => ({
                      phrase: stretchToNarrativeLength(p, 48, this.random),
                      role: accompSiblings[idx].role
                  }));
              }

              if (bassSibling || accompSiblings.length > 0) {
                  this.ensembleStatus = 'SIBLING';
              }

              return;
          }
      }

      this.currentTrackName = 'Local Fallback';
      this.ensembleStatus = 'LOCAL';
      if (this.currentGrandMelody) {
          const barIn12 = epoch % 12;
          const chord = getChordNameForBar(barIn12);
          const isMinor = this.currentGrandMelody.type === 'minor';
          let phrase: any[] = [];
          if (barIn12 === 11) phrase = this.currentGrandMelody.phraseTurnaround || [];
          else if (isMinor) phrase = chord.startsWith('i') ? this.currentGrandMelody.phrasei! : this.currentGrandMelody.phraseiv!;
          else {
              if (chord.startsWith('i')) phrase = this.currentGrandMelody.phraseI!;
              else if (chord.startsWith('iv')) phrase = this.currentGrandMelody.phraseIV!;
              else phrase = this.currentGrandMelody.phraseV!;
          }
          
          const rawPhrase = [...phrase];
          normalizePhraseGroup([rawPhrase]);

          this.currentAxiom = stretchToNarrativeLength(rawPhrase, 48, this.random);
          this.currentLickId = this.currentGrandMelody.id;
          this.soloistBusyUntilBar = epoch + 1;
          return;
      }
      const allLickIds = Object.keys(BLUES_SOLO_LICKS);
      const nextId = allLickIds[this.random.nextInt(allLickIds.length)];
      this.currentLickId = nextId;
      
      const rawPhrase = decompressCompactPhrase(BLUES_SOLO_LICKS[nextId].phrase as any);
      normalizePhraseGroup([rawPhrase]);

      this.currentAxiom = stretchToNarrativeLength(rawPhrase, 48, this.random);
      this.soloistBusyUntilBar = epoch + 1;
  }

  private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, melodyEvents: FractalEvent[]): FractalEvent[] {
      if (this.currentBassAxiom.length > 0) {
          const barInPhrase = epoch % 4;
          const barOffset = barInPhrase * 12;
          const barNotes = this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + 12);
          return barNotes.map(n => ({
              type: 'bass',
              note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
              time: (n.t % 12) / 3,
              duration: 3.5, 
              weight: 0.85,
              technique: 'pluck',
              dynamics: 'p',
              phrasing: 'legato'
          }));
      }
      return tension > 0.7 ? this.renderWalkingBass(chord, epoch) : this.renderRiffBass(chord, epoch);
  }

  private renderUnisonAccompaniment(bassEvents: FractalEvent[], chord: GhostChord, type: string): FractalEvent[] {
      const events: FractalEvent[] = [];
      const third = chord.chordType === 'minor' ? 3 : 4;
      let count = 0;
      for (const bass of bassEvents) {
          if (bass.type !== 'bass' || count >= 2) continue;
          events.push({
              ...bass,
              type: 'accompaniment',
              note: type === 'strict' ? bass.note : bass.note + 12,
              weight: 0.55,
              technique: 'swell',
              phrasing: 'legato'
          });
          events.push({
              type: 'accompaniment',
              note: (bass.note || 0) + 24 + third,
              time: bass.time + 0.02,
              duration: bass.duration * 0.8,
              weight: 0.45,
              technique: 'swell',
              dynamics: 'p',
              phrasing: 'legato'
          });
          count++;
      }
      return events;
  }

  private renderRhythmicTextureFromRiff(epoch: number): FractalEvent[] {
      if (!this.currentGuitarRiff) return [];
      const events: FractalEvent[] = [];
      const fingerRule = this.currentGuitarRiff.fingerstyle?.find(f => this.random.next() < f.probability);
      if (fingerRule) {
          const pattern = GUITAR_PATTERNS[fingerRule.pattern];
          const voicing = BLUES_GUITAR_VOICINGS[fingerRule.voicingName] || BLUES_GUITAR_VOICINGS['E7_open'];
          if (pattern && voicing) {
              pattern.pattern.forEach(p => {
                  p.ticks.forEach(t => {
                      p.stringIndices.forEach(si => {
                          events.push({
                              type: 'melody', note: voicing[voicing.length - 1 - si],
                              time: t / 3, duration: 0.5, weight: 0.45, technique: 'pluck', dynamics: 'p', phrasing: 'staccato'
                          });
                      });
                  });
              });
          }
      }
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord): FractalEvent[] {
    const barInPhrase = epoch % 4;
    const barOffset = barInPhrase * 12;
    const barNotes = this.currentAxiom.filter(n => n.t >= barOffset && n.t < barOffset + 12);
    return barNotes.map(n => ({
        type: 'melody',
        note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + (n.octShift || 0), this.MELODY_CEILING),
        time: (n.t % 12) / 3,
        duration: n.d / 3,
        weight: 0.85,
        technique: n.tech || 'pick',
        dynamics: 'p',
        phrasing: 'legato',
        params: { barCount: epoch }
    }));
  }

  private renderRiffBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12;
    const barInRiff = epoch % 4;
    
    const riff = [ 
        [{ t: 0, n: root }, { t: 1.5, n: root }, { t: 2.5, n: root + 7 }], 
        [{ t: 0, n: root }, { t: 2.0, n: root + 7 }, { t: 3.5, n: root + 10 }], 
        [{ t: 0, n: root + 7 }, { t: 1.5, n: root + 5 }, { t: 2.5, n: root }],
        [{ t: 0, n: root }, { t: 1.5, n: root + 3 }, { t: 2.5, n: root + 4 }, { t: 3.5, n: root + 7 }] 
    ];
    return riff[barInRiff].map(p => ({ 
        type: 'bass', note: this.constrainBassOctave(p.n), time: p.t, duration: 1.2, 
        weight: 0.85, technique: 'pluck', dynamics: p.t === 0 ? 'mf' : 'p', phrasing: 'legato' 
    }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = chord.rootNote - 12;
    const nextBar = (epoch + 1) % 12;
    const nextRoot = (this.config.rootNote + BLUES_PROGRESSION_OFFSETS[nextBar]) - 12;
    
    return [root, root + 4, root + 7, nextRoot - 1].map((p, i) => ({ 
        type: 'bass', note: this.constrainBassOctave(p), time: i, duration: 0.9, 
        weight: 0.85, technique: 'pluck', dynamics: i === 0 ? 'mf' : 'p', phrasing: 'legato' 
    }));
  }

  private renderNarrativeDrums(epoch: number, tension: number, melodyEvents: FractalEvent[]): FractalEvent[] {
      const barIn12 = epoch % 12;
      if (barIn12 === 8 || barIn12 === 9) return this.renderDrumStabs();
      if ((epoch + 1) % 4 === 0 && this.random.next() < 0.75) return this.renderDrumFill();
      return this.renderBaseBluesBeat(tension);
  }

  private renderBaseBluesBeat(tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const kickTicks = [0, 6];
      kickTicks.forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t / 3, duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t / 3, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [0, 2, 3, 5, 6, 8, 9, 11].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t / 3, duration: 0.1, weight: (t % 3 === 0 ? 0.5 : 0.3), technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      return events;
  }

  private renderDrumStabs(): FractalEvent[] {
      const events: FractalEvent[] = [];
      [0, 2].forEach(beat => {
          events.push({ type: 'drum_kick_reso', note: 36, time: beat, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
          events.push({ type: 'drum_snare', note: 38, time: beat, duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
      });
      return events;
  }

  private renderDrumFill(): FractalEvent[] {
      const events: FractalEvent[] = [];
      const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
      [6, 7.5, 9, 10.5].forEach((t, i) => {
          events.push({ type: tomTypes[i % tomTypes.length] as any, note: 45 + i, time: t / 3, duration: 0.5, weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });
      return events;
  }

  private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart): FractalEvent[] {
      const barInPhrase = epoch % 4;
      const barOffset = barInPhrase * 12;
      const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);
      
      return barNotes.map(n => ({
          type: type,
          note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
          time: (n.t % 12) / 3,
          duration: n.d / 3,
          weight: 0.55,
          technique: 'swell',
          dynamics: 'p',
          phrasing: 'legato'
      }));
  }

  private renderAdaptiveAccompaniment(epoch: number, chord: GhostChord): FractalEvent[] {
    const root = chord.rootNote + 12;
    const third = root + (chord.chordType === 'minor' ? 3 : 4);
    return [root, third].map((p, i) => ({
        type: 'accompaniment', note: p, time: i * 2.0, duration: 1.8, weight: 0.45, technique: 'swell', dynamics: 'p', phrasing: 'legato'
    }));
  }

  private renderShadowPiano(epoch: number, melodyEvents: FractalEvent[], accompanimentEvents: FractalEvent[]): FractalEvent[] {
      if (melodyEvents.length > 0 && this.random.next() < 0.6) {
          return melodyEvents.slice(0, 2).map(me => ({ ...me, type: 'pianoAccompaniment', weight: 0.3, technique: 'hit', phrasing: 'staccato' }));
      }
      return accompanimentEvents.map(ae => ({ ...ae, type: 'pianoAccompaniment', weight: 0.25, technique: 'hit', phrasing: 'staccato' }));
  }

  private renderDerivativeHarmony(currentChord: GhostChord, epoch: number): FractalEvent[] {
      const root = currentChord.rootNote;
      const isMin = currentChord.chordType === 'minor';
      const rootNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
      const finalName = isMin ? `${rootNames[root % 12]}m7` : `${rootNames[root % 12]}7`;
      return [root + 12, root + (isMin ? 15 : 16)].map((n, i) => ({ 
          type: 'harmony', note: n + 12, time: i * 0.1, duration: 4.0, weight: 0.55,
          technique: 'swell', dynamics: 'p', phrasing: 'legato', chordName: finalName, params: { barCount: epoch, filterCutoff: 3500 } 
      }));
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.bass) (hints as any).bass = tension > 0.8 ? 'bass_808' : (this.mood === 'dark' || this.mood === 'gloomy' ? 'bass_ambient_dark' : 'bass_jazz_warm');
    
    if (hints.melody) {
        if (this.mood === 'melancholic') {
            (hints as any).melody = tension >= 0.7 ? 'guitar_shineOn' : 'cs80';
        } else {
            (hints as any).melody = tension > 0.8 ? 'cs80' : (tension > 0.45 ? 'telecaster' : 'blackAcoustic');
        }
    }
    
    if (hints.accompaniment) (hints as any).accompaniment = tension > 0.75 ? 'ep_rhodes_warm' : 'organ_soft_jazz';
    if (hints.harmony) (hints as any).harmony = (tension > 0.88 || tension < 0.15) ? 'violin' : 'guitarChords';
  }
}
