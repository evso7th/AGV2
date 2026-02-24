
import {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState,
  BluesGuitarRiff,
  BluesMelody
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

/**
 * #ЗАЧЕМ: Блюзовый Мозг V131.0 — "Harmonic Integrity & Piano Expressivity".
 * #ЧТО: 1. Пианино переведено на вариативные ритмические капли (drops).
 *       2. Исправлен баг chordName: "undefined" для гитарных аккордов.
 *       3. Жесткая отсечка длительности гитары (max 1 bar).
 */

export interface BluesBrainConfig {
  tempo: number;
  rootNote: number;
  emotion: {
    melancholy: number;
    darkness: number;
  };
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
  private currentAxiom: any[] = [];
  private currentLickId: string = '';
  
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
      recentLicks: string[]
  };
  private sfxPlayedInPart = false;
  private currentPartId = '';

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    this.random = this.createSeededRandom(seed);

    this.config = {
      ...DEFAULT_CONFIG,
      emotion: {
        melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4,
        darkness: ['dark', 'gloomy'].includes(mood) ? 0.35 : 0.2
      }
    };

    const introStyles: ('drone' | 'riff' | 'walking')[] = ['drone', 'riff', 'walking'];
    const selectedIntroStyle = introStyles[this.random.nextInt(introStyles.length)];

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
      introBassStyle: selectedIntroStyle,
      currentMutationType: 'jitter',
      lastTension: 0.5,
      tensionMomentum: 0,
      activeAccompTimbre: 'organ_soft_jazz',
      recentLicks: []
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

    // --- DRUMS ---
    if (hints.drums) {
        events.push(...this.renderNarrativeDrums(epoch, tension));
    }

    // --- BASS ---
    const bassEvents = hints.bass ? this.renderIronBass(currentChord, epoch, tension, navInfo) : [];

    // --- ACCOMPANIMENT ---
    const unisonType = navInfo.currentPart.instrumentRules?.accompaniment?.unisonType || 'none';
    
    if (hints.accompaniment && unisonType !== 'none') {
        events.push(...this.renderUnisonAccompaniment(bassEvents, currentChord, unisonType, tension));
    } else if (hints.accompaniment && !this.currentGuitarRiff) {
        events.push(...this.renderDynamicAccompaniment(epoch, currentChord, tension));
    }

    events.push(...bassEvents);

    // --- MELODY ---
    if (hints.melody) {
        if (this.currentGuitarRiff) {
            events.push(...this.renderArrangedAcoustic(epoch, currentChord, tension));
        } else {
            events.push(...this.renderMelodicSegment(epoch, currentChord, tension));
        }
    }

    // --- PIANO (Meaningful Drops) ---
    if (hints.pianoAccompaniment) {
        events.push(...this.renderIntegratedPiano(epoch, currentChord, tension));
    }
    
    // --- HARMONY (Chord Names Fixed) ---
    if (hints.harmony) {
        events.push(...this.renderDerivativeHarmony(currentChord, epoch, tension));
    }

    const activeAxioms = {
        melody: this.currentLickId,
        bass: tension > 0.7 ? 'Walking' : 'Riff',
        drums: epoch % 12 === 8 || epoch % 12 === 9 ? 'Stop-Time' : (epoch % 4 === 3 ? 'Fill' : 'Main Beat')
    };

    return { 
        events, 
        lickId: this.currentLickId, 
        mutationType: this.state.currentMutationType,
        activeAxioms,
        narrative: `Bar ${epoch % 12 + 1}/12. Legato flow active.`
    };
  }

  private renderUnisonAccompaniment(
      bassEvents: FractalEvent[], 
      chord: GhostChord, 
      type: 'strict' | 'octave' | 'harmonized',
      tension: number
  ): FractalEvent[] {
      const events: FractalEvent[] = [];
      const isMin = chord.chordType === 'minor' || chord.chordType === 'diminished';
      const third = isMin ? 3 : 4;
      const fifth = 7;

      bassEvents.forEach(bass => {
          if (bass.type !== 'bass') return;
          let shadowPitch = bass.note + 12; 
          if (type === 'strict') shadowPitch = bass.note; 

          events.push({
              ...bass,
              type: 'accompaniment',
              note: shadowPitch,
              weight: bass.weight * 0.6, 
              technique: 'swell',
              phrasing: 'legato'
          });

          if (type !== 'none' && (bass.time === 0 || bass.time === 2.0 || tension > 0.7)) {
              const root = bass.note + 24; 
              const upperNotes = [root + third, root + fifth];
              upperNotes.forEach((p, i) => {
                  events.push({
                      type: 'accompaniment',
                      note: p,
                      time: bass.time + (i * 0.02), 
                      duration: bass.duration,
                      weight: 0.25 * (1 - (i * 0.05)),
                      technique: 'swell',
                      dynamics: 'p',
                      phrasing: 'legato'
                  });
              });
          }
      });
      return events;
  }

  private renderNarrativeDrums(epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const barIn12 = epoch % 12;
      if (barIn12 === 8 || barIn12 === 9) {
          if (tension > 0.5) return this.renderDrumStabs(tension);
      }
      if ((epoch + 1) % 4 === 0 && this.random.next() < 0.7) {
          return this.renderDrumFill(tension);
      }
      return this.renderBaseBluesBeat(epoch, tension);
  }

  private renderBaseBluesBeat(epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const kickTicks = [0, 6]; 
      if (tension > 0.6 || this.random.next() < 0.3) kickTicks.push(8); 
      
      kickTicks.forEach(t => {
          events.push({
              type: 'drum_kick_reso', note: 36, time: t / 3, duration: 0.1, weight: 0.75 + (tension * 0.2),
              technique: 'hit', dynamics: 'p', phrasing: 'staccato'
          });
      });

      [3, 9].forEach(t => {
          events.push({
              type: 'drum_snare', note: 38, time: t / 3, duration: 0.1, weight: 0.8 + (tension * 0.1),
              technique: 'hit', dynamics: 'p', phrasing: 'staccato'
          });
      });

      const hatTicks = [0, 2, 3, 5, 6, 8, 9, 11]; 
      hatTicks.forEach(t => {
          const isRideTick = tension > 0.65 && (t % 3 === 0);
          events.push({
              type: isRideTick ? 'drum_ride_wetter' : 'drum_25693__walter_odington__hackney-hat-1',
              note: 42, time: t / 3, duration: 0.1,
              weight: (t % 3 === 0 ? 0.5 : 0.35) * (1.0 - this.state.emotion.melancholy * 0.3),
              technique: 'hit', dynamics: 'p', phrasing: 'staccato'
          });
      });
      return events;
  }

  private renderDrumStabs(tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      [0, 2].forEach(beat => {
          events.push({ type: 'drum_kick_reso', note: 36, time: beat, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
          events.push({ type: 'drum_snare', note: 38, time: beat, duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
          events.push({ type: 'drum_cymbal_bell1', note: 51, time: beat, duration: 2.0, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });
      return events;
  }

  private renderDrumFill(tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const tomTicks = tension > 0.7 ? [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5] : [6, 7.5, 9, 10.5];
      const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
      tomTicks.forEach((t, i) => {
          events.push({ type: tomTypes[i % tomTypes.length] as any, note: 45 + i, time: (t / 3), duration: 0.5, weight: 0.6 + (i * 0.05), technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });
      events.push({ type: 'drum_snare', note: 38, time: 3.66, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
      return events;
  }

  private selectGrandAxiom(tension: number) {
      const isMinor = this.mood === 'melancholic' || this.mood === 'dark';
      const pool = BLUES_GUITAR_RIFFS.filter(r => r.moods.includes(this.mood) || (isMinor && r.type === 'minor') || (!isMinor && r.type === 'major'));
      if (pool.length > 0) this.currentGuitarRiff = pool[this.random.nextInt(pool.length)];
      const melodyPool = BLUES_MELODY_RIFFS.filter(m => m.moods.includes(this.mood) || (isMinor && m.type === 'minor'));
      if (melodyPool.length > 0) this.currentGrandMelody = melodyPool[this.random.nextInt(melodyPool.length)];
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      if (this.currentGrandMelody) {
          const barIn12 = epoch % 12;
          const isTurn = barIn12 === 11;
          const isMinor = this.currentGrandMelody.type === 'minor';
          let phrase: any[] = [];
          if (isTurn) phrase = this.currentGrandMelody.phraseTurnaround || [];
          else {
              const chord = getChordNameForBar(barIn12);
              if (isMinor) phrase = chord.startsWith('i') ? this.currentGrandMelody.phrasei! : this.currentGrandMelody.phraseiv!;
              else {
                  if (chord.startsWith('i')) phrase = this.currentGrandMelody.phraseI!;
                  else if (chord.startsWith('iv')) phrase = this.currentGrandMelody.phraseIV!;
                  else phrase = this.currentGrandMelody.phraseV!;
              }
          }
          this.currentAxiom = phrase;
          this.currentLickId = this.currentGrandMelody.id;
          return;
      }

      const allLickIds = Object.keys(BLUES_SOLO_LICKS);
      const pool = allLickIds.filter(id => !this.state.recentLicks.includes(id));
      const nextId = pool[this.random.nextInt(pool.length)] || allLickIds[0];
      this.currentLickId = nextId;
      this.state.recentLicks.push(nextId);
      if (this.state.recentLicks.length > 5) this.state.recentLicks.shift();
      const rawPhrase = decompressCompactPhrase(BLUES_SOLO_LICKS[nextId].phrase as any);
      const stretched = stretchToNarrativeLength(rawPhrase, 48, this.random);
      this.currentAxiom = this.mutateLick(stretched);
  }

  private renderArrangedAcoustic(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      if (!this.currentGuitarRiff) return [];
      const events: FractalEvent[] = [];
      const barIn12 = epoch % 12;
      const chordName = getChordNameForBar(barIn12);
      let soloPhrase: any[] = [];
      if (barIn12 === 11) soloPhrase = this.currentGuitarRiff.solo.Turnaround;
      else if (chordName.startsWith('i')) soloPhrase = this.currentGuitarRiff.solo.I;
      else if (chordName.startsWith('iv')) soloPhrase = this.currentGuitarRiff.solo.IV;
      else soloPhrase = this.currentGuitarRiff.solo.V;

      soloPhrase.forEach(n => {
          events.push({
              type: 'melody',
              note: Math.min(chord.rootNote + 24 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
              time: n.t / 3,
              // #ЗАЧЕМ: Жесткое ограничение длительности.
              duration: Math.min(n.d / 3, 4.0), 
              weight: 0.85 * (tension + 0.2),
              technique: n.tech || 'pick',
              dynamics: 'p',
              phrasing: 'legato'
          });
      });
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
        // #ЗАЧЕМ: Жесткая отсечка "бесконечности".
        duration = Math.min(duration, 4.0); 

        const phraseProgress = n.t / 48;
        const exhaleModifier = 1.0 - (phraseProgress * 0.3);
        const isAccent = n.t % 6 === 0;
        const finalWeight = (isAccent ? 0.95 : 0.85) * exhaleModifier * (0.95 + this.random.next() * 0.1);

        events.push({
            type: 'melody',
            note: Math.min(chord.rootNote + 24 + (DEGREE_TO_SEMITONE[n.deg] || 0) + (n.octShift || 0), this.MELODY_CEILING),
            time: (n.t % 12) / 3,
            duration: duration,
            weight: finalWeight,
            technique: n.tech || 'pick',
            dynamics: (tension > 0.65) ? 'mf' : 'p',
            phrasing: 'legato',
            params: { barCount: epoch }
        });
    });
    return events;
  }

  private renderDynamicAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    if (tension < 0.45) return this.renderSoftPillows(epoch, chord, tension);
    else if (tension <= 0.75) return this.renderBeautifulPassages(epoch, chord, tension);
    else return this.renderPowerChords(epoch, chord, tension);
  }

  private renderSoftPillows(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    if (epoch % 2 !== 0) return [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7];
    return notes.map((p, i) => ({
        type: 'accompaniment', note: p, time: 0.5 + i * 0.05, duration: 2.5, weight: 0.22, technique: 'swell', dynamics: 'p', phrasing: 'legato'
    }));
  }

  private renderBeautifulPassages(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const third = isMin ? 3 : 4;
    const notes = [root, root + third, root + 7, root + 10, root + 14];
    
    events.push({ type: 'accompaniment', note: root, time: 0, duration: 4.0, weight: 0.28, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
    
    const passage = [
        { t: 1.0, n: notes[1] + 12 }, 
        { t: 2.5, n: notes[2] + 12 }, 
        { t: 3.5, n: notes[3] + 12 }
    ];

    passage.forEach(p => {
        if (this.random.next() < (0.55 + tension * 0.25)) {
            events.push({
                type: 'accompaniment', note: p.n, time: p.t, duration: 1.5, weight: 0.32, technique: 'pluck', dynamics: 'p', phrasing: 'detached'
            });
        }
    });
    return events;
  }

  private renderPowerChords(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];
    [0, 2.0].forEach(t => { 
        notes.forEach((p, i) => { 
            events.push({ type: 'accompaniment', note: p, time: t + i * 0.03, duration: 1.5, weight: 0.38, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato' }); 
        }); 
    });
    return events;
  }

  private renderIronBass(chord: GhostChord, epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
    if (tension < 0.4) return [{ type: 'bass', note: Math.max(chord.rootNote - 12, this.BASS_FLOOR), time: 0, duration: 3.5, weight: 0.65, technique: 'pluck', dynamics: 'p', phrasing: 'legato', params: { attack: 0.5, release: 2.0, filterCutoff: 300 } }];
    else if (tension <= 0.7) return this.renderRiffBass(chord, epoch, tension);
    else return this.renderWalkingBass(chord, epoch, tension);
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
    return riff[barInRiff].map(p => ({ type: 'bass', note: p.n, time: p.t, duration: 1.2, weight: (p.w + (tension * 0.1)) * (0.95 + this.random.next() * 0.1), technique: 'pluck', dynamics: p.t === 0 ? 'mf' : 'p', phrasing: 'legato', params: { attack: 0.1, release: 0.8, filterCutoff: 450 } }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const nextRoot = getNextChordRoot(epoch % 12, chord.rootNote) - 12;
    const notes = [ root, root + 7, root + 10, nextRoot - 1 ];
    return notes.map((p, i) => ({ type: 'bass', note: p, time: i, duration: 0.9, weight: (i === 0 ? 0.85 : 0.5) + tension * 0.1, technique: 'pluck', dynamics: i === 0 ? 'mf' : 'p', phrasing: 'legato' }));
  }

  private renderIntegratedPiano(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 24;
      const isMin = chord.chordType === 'minor';
      
      // #ЗАЧЕМ: Устранение "эффекта дятла".
      // #ЧТО: Пианино теперь играет ритмические капли (drops) с вариацией по ступеням.
      const degrees = [0, isMin ? 3 : 4, 7, 10, 14];
      const patterns = [
          [1.5, 3.5],
          [0.5, 2.0, 3.75],
          [1.25, 2.5, 3.5]
      ];
      const activePattern = patterns[epoch % patterns.length];

      activePattern.forEach(beat => { 
          if (this.random.next() < (0.25 + tension * 0.3)) { 
              events.push({ 
                  type: 'pianoAccompaniment', 
                  note: Math.min(root + degrees[this.random.nextInt(degrees.length)], this.MELODY_CEILING), 
                  time: beat, 
                  duration: 1.5 + (this.random.next() * 2.0), 
                  weight: 0.25 + tension * 0.1, 
                  technique: 'hit', 
                  dynamics: 'p', 
                  phrasing: 'staccato', 
                  params: { barCount: epoch } 
              }); 
          } 
      });
      return events;
  }

  private renderDerivativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote;
      
      // #ЗАЧЕМ: Устранение chordName: "undefined".
      // #ЧТО: Явное вычисление имени аккорда для сэмплеров.
      const chordMap: Record<number, string> = { 
          0: 'C', 1: 'Db', 2: 'D', 3: 'Eb', 4: 'E', 5: 'F', 6: 'Gb', 7: 'G', 8: 'Ab', 9: 'A', 10: 'Bb', 11: 'B' 
      };
      const rootName = chordMap[root % 12] || 'C';
      const isMin = chord.chordType === 'minor' || chord.chordType === 'diminished';
      const finalChordName = isMin ? `${rootName}m` : rootName;

      // Шанс появления гармонического слоя
      if (this.random.next() > 0.4 && tension < 0.7) return [];

      [root + 12, root + 19].forEach((n, i) => {
          events.push({ 
              type: 'harmony', 
              note: n + 12, 
              time: i * 0.1, 
              duration: 4.0, 
              weight: 0.15 + (tension * 0.1), 
              technique: 'swell', 
              dynamics: 'p', 
              phrasing: 'legato', 
              chordName: finalChordName, // ТЕПЕРЬ ОПРЕДЕЛЕНО
              params: { barCount: epoch, filterCutoff: 3000 } 
          }); 
      });
      return events;
  }

  private refreshUnifiedMutation() {
      const types: ('jitter' | 'inversion' | 'rhythm' | 'transposition')[] = ['jitter', 'inversion', 'rhythm', 'transposition'];
      this.state.currentMutationType = types[this.random.nextInt(types.length)];
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints, epoch: number) {
    if (epoch % 4 !== 0 && epoch !== 0) return;
    if (hints.melody) {
        if (tension <= 0.45) (hints as any).melody = (hints as any).melody || 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = (hints as any).melody || 'telecaster';
        else (hints as any).melody = (hints as any).melody || 'guitar_shineOn';
    }
    if (hints.accompaniment) {
        this.state.activeAccompTimbre = tension > 0.75 ? 'ep_rhodes_warm' : 'organ_soft_jazz';
        (hints as any).accompaniment = this.state.activeAccompTimbre;
    }
    
    // #ЗАЧЕМ: Управление слоем гармонии по напряжению.
    if (hints.harmony) {
        (hints as any).harmony = tension > 0.7 ? 'violin' : 'guitarChords';
    }
  }

  private mutateLick(phrase: any[]): any[] {
      const type = this.state.currentMutationType;
      switch(type) {
          case 'inversion':
              const pivot = phrase[0]?.deg || 'R';
              return phrase.map((n: any) => ({...n, deg: this.invertDegree(n.deg, pivot)}));
          case 'jitter':
              return phrase.map((n: any) => ({...n, t: Math.max(0, n.t + (this.random.next() * 0.2 - 0.1))}));
          case 'rhythm':
              return phrase.map((n: any) => ({...n, d: n.d * (0.9 + this.random.next() * 0.2)}));
          default: return phrase;
      }
  }

  private invertDegree(deg: string, pivot: string): string {
      const s = DEGREE_TO_SEMITONE[deg] || 0;
      const p = DEGREE_TO_SEMITONE[pivot] || 0;
      const inv = (p - (s - p)) % 12;
      const finalS = inv < 0 ? inv + 12 : inv;
      const entry = Object.entries(DEGREE_TO_SEMITONE).find(([k, v]) => v === finalS);
      return entry ? entry[0] : deg;
  }

  private evolveEmotion(epoch: number): void {
    this.state.emotion.melancholy += (this.random.next() - 0.5) * 0.06;
    this.state.emotion.darkness += (this.random.next() - 0.5) * 0.04;
    this.state.emotion.melancholy = Math.max(0.65, Math.min(0.95, this.state.emotion.melancholy));
    this.state.emotion.darkness = Math.max(0.15, Math.min(0.45, this.state.emotion.darkness));
  }

  private updatePhrasePhase(barIn12: number): void {
    if (barIn12 < 4) this.state.phraseState = 'call';
    else if (barIn12 < 8) this.state.phraseState = 'call_var';
    else this.state.phraseState = 'response';
  }
}
