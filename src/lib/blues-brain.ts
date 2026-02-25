import {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesGuitarRiff,
  BluesMelody,
  BluesCognitiveState
} from '@/types/music';
import { 
    DEGREE_TO_SEMITONE,
    decompressCompactPhrase,
    stretchToNarrativeLength
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
 * #ЗАЧЕМ: Блюзовый Мозг V149.0 — "Headroom Restoration".
 * #ЧТО: ПЛАН №640 — Снижен коэффициент "Тени" пианино до 0.3 для предотвращения клиппинга.
 */

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
}

export const DEFAULT_CONFIG: BluesBrainConfig = {
  tempo: 72,
  rootNote: 55, // G3
  emotion: { melancholy: 0.82, darkness: 0.25 }
};

export class BluesBrain {
  private config: BluesBrainConfig;
  private seed: number;
  private mood: Mood;
  private random: any;
  
  private currentMelodyAxiomObj: any | null = null;
  private currentAxiom: any[] = [];
  private currentBassAxiom: any[] = [];
  
  private currentLickId: string = '';
  private currentTrackName: string = 'Local';
  private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
  
  private currentGuitarRiff: BluesGuitarRiff | null = null;
  private currentGrandMelody: BluesMelody | null = null;

  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 

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
      recentGrandMelodies: string[]
  };
  private sfxPlayedInPart = false;
  private currentPartId = '';

  constructor(
      seed: number, 
      mood: Mood, 
      sessionLickHistory?: string[], 
      cloudAxioms?: any[], 
      selectedCompositionIds?: string[],
      activeAnchorId?: string | null
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

  public updateCloudAxioms(axioms: any[], selectedCompositionIds?: string[], activeAnchorId?: string | null) {
      this.config.cloudAxioms = axioms;
      this.config.selectedCompositionIds = selectedCompositionIds || [];
      if (activeAnchorId !== undefined) this.config.activeAnchorId = activeAnchorId;
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

    if (navInfo.currentPart.id !== this.currentPartId) {
        this.currentPartId = navInfo.currentPart.id;
        this.sfxPlayedInPart = false;
    }

    const isPhraseBoundary = epoch % 4 === 0;
    const isChorusBoundary = epoch % 12 === 0;

    if (isChorusBoundary) {
        this.selectGrandAxiom(tension);
    }

    if (this.currentAxiom.length === 0 || isPhraseBoundary || navInfo.isPartTransition) {
        this.refreshUnifiedMutation();
        this.selectNextAxiom(navInfo, dna, epoch);
    }

    const events: FractalEvent[] = [];
    this.evaluateTimbralDramaturgy(tension, hints, epoch);

    const melodyEvents = hints.melody ? this.renderMelodicSegment(epoch, currentChord, tension) : [];

    if (hints.drums) {
        events.push(...this.renderNarrativeDrums(epoch, tension, melodyEvents));
    }

    const bassEvents = hints.bass ? this.renderSymbioticBass(currentChord, epoch, tension, melodyEvents) : [];

    const unisonType = navInfo.currentPart.instrumentRules?.accompaniment?.unisonType || 'none';
    const accompanimentEvents: FractalEvent[] = [];
    
    if (hints.accompaniment && unisonType !== 'none') {
        accompanimentEvents.push(...this.renderUnisonAccompaniment(bassEvents, currentChord, unisonType, tension));
    } else if (hints.accompaniment) {
        accompanimentEvents.push(...this.renderDynamicAccompaniment(epoch, currentChord, tension));
    }

    events.push(...accompanimentEvents);
    events.push(...bassEvents);

    if (hints.pianoAccompaniment) {
        events.push(...this.renderShadowPiano(epoch, tension, melodyEvents, accompanimentEvents));
    }

    events.push(...melodyEvents);

    if (hints.melody && this.currentGuitarRiff) {
        events.push(...this.renderRhythmicTextureFromRiff(epoch, currentChord, tension));
    }
    
    if (hints.harmony) {
        events.push(...this.renderDerivativeHarmony(currentChord, epoch, tension));
    }

    const activeAxioms = {
        melody: this.currentLickId,
        melodyTrack: this.currentTrackName,
        ensemble: this.ensembleStatus,
        bass: this.currentBassAxiom.length > 0 ? 'Sibling' : (tension > 0.7 ? 'Walking' : 'Riff'),
        drums: epoch % 12 === 8 || epoch % 12 === 9 ? 'Stop-Time' : (epoch % 4 === 3 ? 'Fill' : 'Main Beat')
    };

    return { 
        events, 
        lickId: this.currentLickId, 
        mutationType: this.state.currentMutationType,
        activeAxioms,
        narrative: `Bar ${epoch % 12 + 1}/12. Ensemble status: ${this.ensembleStatus}`
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
      this.state.recentGrandMelodies.push(this.currentGuitarRiff.id);
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
      this.ensembleStatus = 'ADAPTIVE';

      if (this.config.cloudAxioms && this.config.cloudAxioms.length > 0) {
          const targetAnchor = this.config.activeAnchorId;

          const cloudPool = this.config.cloudAxioms.filter(ax => {
              const genreMatch = ax.genre === 'blues';
              const roleMatch = ax.role === 'melody';
              if (targetAnchor) return genreMatch && roleMatch && ax.compositionId === targetAnchor;
              const commonMoodFilter = ['epic', 'joyful', 'enthusiastic'].includes(this.mood) ? 'light' : 
                                       (['melancholic', 'dark', 'anxious', 'gloomy'].includes(this.mood) ? 'dark' : 'neutral');
              return genreMatch && roleMatch && (ax.mood === this.mood || ax.commonMood === commonMoodFilter);
          });

          if (cloudPool.length > 0) {
              let freshPool = cloudPool.filter(ax => !this.state.recentLicks.includes(ax.id));
              if (freshPool.length === 0) {
                  const cloudPoolIds = new Set(cloudPool.map(ax => ax.id));
                  this.state.recentLicks = this.state.recentLicks.filter(id => !cloudPoolIds.has(id));
                  freshPool = cloudPool;
              }

              const selected = freshPool[this.random.nextInt(freshPool.length)];
              this.currentLickId = selected.id;
              this.currentTrackName = selected.compositionId; 
              this.currentMelodyAxiomObj = selected;
              this.state.recentLicks.push(selected.id);
              if (this.state.recentLicks.length > 50) this.state.recentLicks.shift();
              
              const rawPhrase = decompressCompactPhrase(selected.phrase);
              this.currentAxiom = stretchToNarrativeLength(rawPhrase, 48, this.random);

              const sibling = this.config.cloudAxioms.find(ax => 
                  ax.role === 'bass' && 
                  ax.compositionId === selected.compositionId && 
                  ax.barOffset === selected.barOffset
              );
              if (sibling) {
                  const rawBass = decompressCompactPhrase(sibling.phrase);
                  this.currentBassAxiom = stretchToNarrativeLength(rawBass, 48, this.random);
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
          this.currentAxiom = stretchToNarrativeLength(phrase, 48, this.random);
          this.currentLickId = this.currentGrandMelody.id;
          return;
      }

      const allLickIds = Object.keys(BLUES_SOLO_LICKS);
      const nextId = allLickIds[this.random.nextInt(allLickIds.length)];
      this.currentLickId = nextId;
      const rawPhrase = decompressCompactPhrase(BLUES_SOLO_LICKS[nextId].phrase as any);
      this.currentAxiom = stretchToNarrativeLength(rawPhrase, 48, this.random);
  }

  private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, melodyEvents: FractalEvent[]): FractalEvent[] {
      if (this.currentBassAxiom.length > 0) {
          const barInPhrase = epoch % 4;
          const barOffset = barInPhrase * 12;
          const barNotes = this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + 12);
          return barNotes.map(n => ({
              type: 'bass',
              note: Math.max(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.BASS_FLOOR),
              time: (n.t % 12) / 3,
              duration: n.d / 3,
              weight: 0.85,
              technique: 'pluck',
              dynamics: 'p',
              phrasing: 'legato'
          }));
      }

      const melodyComplexity = this.currentMelodyAxiomObj?.vector?.e || 0.5;
      if (melodyComplexity > 0.75 && tension < 0.8) {
          return [{ type: 'bass', note: Math.max(chord.rootNote - 12, this.BASS_FLOOR), time: 0, duration: 3.5, weight: 0.7, technique: 'pluck', dynamics: 'p', phrasing: 'legato' }];
      }

      const baseBass = tension > 0.7 ? this.renderWalkingBass(chord, epoch, tension) : this.renderRiffBass(chord, epoch, tension);
      
      const gaps = this.findMelodyBreaths(melodyEvents);
      if (gaps.length > 0 && this.random.next() < 0.6) {
          const gap = gaps[0];
          baseBass.push({
              type: 'bass',
              note: Math.max(chord.rootNote - 13, this.BASS_FLOOR), 
              time: gap.start,
              duration: 0.5,
              weight: 0.6,
              technique: 'pluck',
              dynamics: 'p',
              phrasing: 'staccato'
          });
      }

      return baseBass;
  }

  private findMelodyBreaths(events: FractalEvent[]): { start: number, duration: number }[] {
      const sorted = [...events].sort((a, b) => a.time - b.time);
      const breaths = [];
      for (let i = 0; i < sorted.length - 1; i++) {
          const end = sorted[i].time + sorted[i].duration;
          const nextStart = sorted[i+1].time;
          if (nextStart - end > 0.66) { 
              breaths.push({ start: end, duration: nextStart - end });
          }
      }
      return breaths;
  }

  private renderUnisonAccompaniment(
      bassEvents: FractalEvent[], 
      chord: GhostChord, 
      type: 'strict' | 'octave' | 'harmonized' | 'none',
      tension: number
  ): FractalEvent[] {
      const events: FractalEvent[] = [];
      const isMin = chord.chordType === 'minor' || chord.chordType === 'diminished';
      const third = isMin ? 3 : 4;
      const fifth = 7;
      const seventh = 10;
      const inversionIdx = Math.floor(this.random.next() * 3); 

      bassEvents.forEach(bass => {
          if (bass.type !== 'bass') return;
          events.push({
              ...bass,
              type: 'accompaniment',
              note: type === 'strict' ? bass.note : bass.note + 12,
              weight: bass.weight * 0.65,
              technique: 'swell',
              phrasing: 'legato'
          });

          if (bass.time === 0 || bass.time === 2.0 || tension > 0.6) {
              const root = bass.note + 24;
              let pitches = [root + third, root + fifth];
              if (tension > 0.55) pitches.push(root + seventh); 
              if (tension > 0.75) pitches.push(root + 14);

              pitches.forEach((p, i) => {
                  let finalPitch = p;
                  if (inversionIdx === 1) finalPitch += 12;
                  if (inversionIdx === 2 && i === 0) finalPitch += 12;

                  events.push({
                      type: 'accompaniment',
                      note: finalPitch,
                      time: bass.time + (i * 0.02),
                      duration: bass.duration * 0.8,
                      weight: 0.45 - (i * 0.05),
                      technique: 'swell',
                      dynamics: 'p',
                      phrasing: 'legato'
                  });
              });
          }
      });
      return events;
  }

  private renderRhythmicTextureFromRiff(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
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
                              type: 'melody',
                              note: voicing[voicing.length - 1 - si],
                              time: t / 3,
                              duration: 0.5,
                              weight: 0.45,
                              technique: 'pluck',
                              dynamics: 'p',
                              phrasing: 'staccato'
                          });
                      });
                  });
              });
          }
      }
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const barInPhrase = epoch % 4;
    const barOffset = barInPhrase * 12;
    const barNotes = this.currentAxiom.filter(n => n.t >= barOffset && n.t < barOffset + 12);
    const events: FractalEvent[] = [];

    barNotes.forEach((n, i) => {
        const nextNote = barNotes[i+1];
        let duration = n.d / 3;
        if (nextNote && (nextNote.t - (n.t + n.d)) < 1) duration += 0.15; 
        duration = Math.min(duration, 2.5); 

        const phraseProgress = n.t / 48;
        const exhaleModifier = 1.0 - (phraseProgress * 0.3);

        events.push({
            type: 'melody',
            note: Math.min(chord.rootNote + 24 + (DEGREE_TO_SEMITONE[n.deg] || 0) + (n.octShift || 0), this.MELODY_CEILING),
            time: (n.t % 12) / 3,
            duration: duration,
            weight: 0.95 * exhaleModifier, 
            technique: n.tech || 'pick',
            dynamics: (tension > 0.65) ? 'mf' : 'p',
            phrasing: 'legato',
            params: { barCount: epoch }
        });
    });
    return events;
  }

  private renderRiffBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const barInRiff = epoch % 4;
    const riff = [ 
        [{ t: 0, n: root, w: 0.85 }, { t: 2.0, n: root + 7, w: 0.7 }], 
        [{ t: 0, n: root, w: 0.8 }, { t: 1.5, n: root, w: 0.7 }, { t: 2.5, n: root + 7, w: 0.75 }], 
        [{ t: 0, n: root, w: 0.85 }, { t: 2.0, n: root + 7, w: 0.7 }, { t: 3.5, n: root + 10, w: 0.65 }], 
        [{ t: 0, n: root + 7, w: 0.75 }, { t: 1.5, n: root + 5, w: 0.7 }, { t: 2.5, n: root, w: 0.9 }] 
    ];
    return riff[barInRiff].map(p => ({ type: 'bass', note: p.n, time: p.t, duration: 1.2, weight: (p.w + (tension * 0.1)) * (0.95 + this.random.next() * 0.1), technique: 'pluck', dynamics: p.t === 0 ? 'mf' : 'p', phrasing: 'legato' }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const barIn12 = epoch % 12;
    const nextRoot = getNextChordRoot(barIn12, chord.rootNote) - 12;
    const notes = [ root, root + 7, root + 10, nextRoot - 1 ];
    return notes.map((p, i) => ({ type: 'bass', note: p, time: i, duration: 0.9, weight: (i === 0 ? 0.85 : 0.5) + tension * 0.1, technique: 'pluck', dynamics: i === 0 ? 'mf' : 'p', phrasing: 'legato' }));
  }

  private renderNarrativeDrums(epoch: number, tension: number, melodyEvents: FractalEvent[]): FractalEvent[] {
      const barIn12 = epoch % 12;
      const breaths = this.findMelodyBreaths(melodyEvents);
      const isBreath = breaths.length > 0;

      if (isBreath && this.random.next() < 0.35) return [];

      if (barIn12 === 8 || barIn12 === 9) return this.renderDrumStabs(tension);
      
      if ((epoch + 1) % 4 === 0 && this.random.next() < 0.75) return this.renderDrumFill(tension);
      
      return this.renderBaseBluesBeat(epoch, tension);
  }

  private renderBaseBluesBeat(epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const kickTicks = tension > 0.6 ? [0, 6, 8] : [0, 6];
      
      kickTicks.forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t / 3, duration: 0.1, weight: 0.75 + (tension * 0.2), technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t / 3, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      
      [0, 2, 3, 5, 6, 8, 9, 11].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t / 3, duration: 0.1, weight: (t % 3 === 0 ? 0.5 : 0.3), technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      
      if (tension > 0.5 && this.random.next() < 0.4) {
          events.push({ type: 'drum_ride_wetter', note: 51, time: 2.0, duration: 1.5, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      }

      return events;
  }

  private renderDrumStabs(tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      [0, 2].forEach(beat => {
          events.push({ type: 'drum_kick_reso', note: 36, time: beat, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
          events.push({ type: 'drum_snare', note: 38, time: beat, duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
      });
      return events;
  }

  private renderDrumFill(tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
      
      const fillTicks = [6, 7.5, 9, 10.5];
      fillTicks.forEach((t, i) => {
          events.push({ 
              type: tomTypes[i % tomTypes.length] as any, 
              note: 45 + i, 
              time: t / 3, 
              duration: 0.5, 
              weight: 0.6 + (i * 0.05), 
              technique: 'hit', 
              dynamics: 'p', 
              phrasing: 'staccato' 
          });
      });

      if (tension > 0.7) {
          events.push({ type: 'drum_ride_wetter', note: 51, time: 3.5, duration: 2.0, weight: 0.5, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
      }

      return events;
  }

  private renderDynamicAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];
    return notes.map((p, i) => ({
        type: 'accompaniment', note: p, time: i * 0.5, duration: 3.0, weight: 0.35, technique: 'swell', dynamics: 'p', phrasing: 'legato'
    }));
  }

  /**
   * #ЗАЧЕМ: Shadow Piano Mode. Полная синхронность с ансамблем.
   * #ЧТО: Пианино дублирует мелодию или аккомпанемент, становясь их тенью.
   *       ПЛАН №640 — Снижен вес тени до 0.3 для защиты от клиппинга.
   */
  private renderShadowPiano(epoch: number, tension: number, melodyEvents: FractalEvent[], accompanimentEvents: FractalEvent[]): FractalEvent[] {
      if (tension < 0.3 && this.random.next() < 0.7) return [];

      if (melodyEvents.length > 0 && this.random.next() < 0.6) {
          return melodyEvents.map(me => ({
              ...me,
              type: 'pianoAccompaniment',
              weight: me.weight * 0.30, 
              technique: 'hit',
              phrasing: 'staccato',
              params: { ...me.params, shadow: 'melody' }
          }));
      }

      if (accompanimentEvents.length > 0) {
          return accompanimentEvents.map(ae => ({
              ...ae,
              type: 'pianoAccompaniment',
              weight: ae.weight * 0.25,
              technique: 'hit',
              phrasing: 'staccato',
              params: { ...ae.params, shadow: 'accompaniment' }
          }));
      }

      return [];
  }

  private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, tension: number): FractalEvent[] {
      const root = currentChord.rootNote;
      const isMin = currentChord.chordType === 'minor' || currentChord.chordType === 'diminished';
      const rootNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
      const name = rootNames[root % 12];
      const finalName = isMin ? `${name}m7` : `${name}7`;

      return [root + 12, root + 19, root + (isMin ? 15 : 16)].map((n, i) => ({ 
          type: 'harmony', 
          note: n + 12, 
          time: i * 0.1, 
          duration: 4.0, 
          weight: 0.45 + (tension * 0.15),
          technique: 'swell', 
          dynamics: 'p', 
          phrasing: 'legato', 
          chordName: finalName, 
          params: { barCount: epoch, filterCutoff: 3500 } 
      }));
  }

  private refreshUnifiedMutation() {
      const types: ('jitter' | 'inversion' | 'rhythm' | 'transposition')[] = ['jitter', 'inversion', 'rhythm', 'transposition'];
      this.state.currentMutationType = types[this.random.nextInt(types.length)];
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints, epoch: number) {
    if (hints.melody) (hints as any).melody = tension > 0.8 ? 'cs80' : (tension > 0.45 ? 'telecaster' : 'blackAcoustic');
    if (hints.accompaniment) (hints as any).accompaniment = tension > 0.75 ? 'ep_rhodes_warm' : 'organ_soft_jazz';
    
    if (hints.harmony) {
        let target = 'guitarChords';
        if (tension > 0.88 || tension < 0.15) {
            target = 'violin';
        }
        (hints as any).harmony = target;
    }
  }
}

function calculateMusiNum(step: number, base: number = 2, start: number = 0, modulo: number = 8): number {
    if (!isFinite(step) || modulo <= 0) return 0;
    let num = Math.abs(Math.floor(step + start));
    let sum = 0;
    while (num > 0) {
        sum += num % base;
        num = Math.floor(num / base);
    }
    return sum % modulo;
}
