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
 * #ЗАЧЕМ: Блюзовый Мозг V125.0 — "The Acoustic Heritage Update".
 * #ЧТО: 1. Интегрирована 12-тактовая библиотека гитарных аранжировок.
 *       2. Реализована логика выбора техник (Fingerstyle/Strum/Solo) в реальном времени.
 *       3. Поддержка "плотных" минорных мелодий для меланхолии.
 * #ОБНОВЛЕНО (ПЛАН №568): Внедрена поддержка оцифрованной библиотеки из blues_guitar_melody.txt.
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private random: any;
  private currentAxiom: any[] = [];
  private currentLickId: string = '';
  
  // Дорожка активной аранжировки
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
      emotion: { melancholy: 0.8, darkness: 0.3 },
      stagnationStrikes: { micro: 0, meso: 0, macro: 0 },
      vaccineActive: { part: 'ensemble', type: 'jitter' },
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
  ): { events: FractalEvent[], lickId?: string, mutationType?: string } {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    
    this.state.tensionMomentum = tension - this.state.lastTension;
    this.state.lastTension = tension;

    if (navInfo.currentPart.id !== this.currentPartId) {
        this.currentPartId = navInfo.currentPart.id;
        this.sfxPlayedInPart = false;
    }

    // --- NARRATIVE SYNC: 12-BAR & 4-BAR CYCLE ---
    const isPhraseBoundary = epoch % 4 === 0;
    const isChorusBoundary = epoch % 12 === 0;

    if (isChorusBoundary) {
        this.selectGrandAxiom(tension);
    }

    if (this.currentAxiom.length === 0 || isPhraseBoundary) {
        this.refreshUnifiedMutation();
        this.selectNextAxiom(navInfo, dna, epoch);
    }

    const events: FractalEvent[] = [];

    // Оркестровка (выбор инструментов на основе напряжения)
    this.evaluateTimbralDramaturgy(tension, hints, epoch);

    // --- 1. MELODY (SOLO / ARRANGEMENT) ---
    if (hints.melody) {
        // Если есть полноценная аранжировка, используем её
        if (this.currentGuitarRiff) {
            events.push(...this.renderArrangedAcoustic(epoch, currentChord, tension));
        } else {
            const melodyEvents = this.renderMelodicSegment(epoch, currentChord, tension);
            events.push(...melodyEvents);
        }
    }

    // --- 2. ACCOMPANIMENT ---
    if (hints.accompaniment && !this.currentGuitarRiff) {
        const accompEvents = this.renderDynamicAccompaniment(epoch, currentChord, tension);
        events.push(...accompEvents);
    }

    // --- 3. PIANO ---
    if (hints.pianoAccompaniment) {
        events.push(...this.renderIntegratedPiano(epoch, currentChord, tension));
    }

    // --- 4. BASS ---
    if (hints.bass) events.push(...this.renderIronBass(currentChord, epoch, tension, navInfo));
    
    // --- 5. DRUMS ---
    if (hints.drums) events.push(...this.renderBluesBeat(epoch, tension, navInfo));
    
    // --- 6. HARMONY ---
    if (hints.harmony) {
        events.push(...this.renderDerivativeHarmony(currentChord, epoch, tension));
    }

    return { 
        events, 
        lickId: this.currentLickId, 
        mutationType: this.state.currentMutationType 
    };
  }

  /**
   * #ЗАЧЕМ: Выбор крупной 12-тактовой структуры.
   */
  private selectGrandAxiom(tension: number) {
      const isMinor = this.mood === 'melancholic' || this.mood === 'dark';
      
      // Выбираем из гитарных аранжировок
      const pool = BLUES_GUITAR_RIFFS.filter(r => 
          r.moods.includes(this.mood) || (isMinor && r.type === 'minor') || (!isMinor && r.type === 'major')
      );
      
      if (pool.length > 0) {
          this.currentGuitarRiff = pool[this.random.nextInt(pool.length)];
      }

      // Выбираем из плотных мелодий
      const melodyPool = BLUES_MELODY_RIFFS.filter(m => 
          m.moods.includes(this.mood) || (isMinor && m.type === 'minor')
      );
      if (melodyPool.length > 0) {
          this.currentGrandMelody = melodyPool[this.random.nextInt(melodyPool.length)];
      }
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      // Если мы в режиме "плотной мелодии", берем фразу оттуда
      if (this.currentGrandMelody) {
          const barIn12 = epoch % 12;
          const isTurn = barIn12 === 11;
          const isMinor = this.currentGrandMelody.type === 'minor';
          
          let phrase: any[] = [];
          if (isTurn) phrase = this.currentGrandMelody.phraseTurnaround || [];
          else if (isMinor) {
              const chord = getChordNameForBar(barIn12);
              phrase = chord.startsWith('i') ? this.currentGrandMelody.phrasei! : this.currentGrandMelody.phraseiv!;
          } else {
              const chord = getChordNameForBar(barIn12);
              if (chord.startsWith('i')) phrase = this.currentGrandMelody.phraseI!;
              else if (chord.startsWith('iv')) phrase = this.currentGrandMelody.phraseIV!;
              else phrase = this.currentGrandMelody.phraseV!;
          }
          
          this.currentAxiom = phrase;
          this.currentLickId = this.currentGrandMelody.id;
          return;
      }

      // Стандартный выбор лика
      const allLickIds = Object.keys(BLUES_SOLO_LICKS);
      const pool = allLickIds.filter(id => !this.state.recentLicks.includes(id));
      const nextId = pool[this.random.nextInt(pool.length)] || allLickIds[0];

      this.currentLickId = nextId;
      this.state.recentLicks.push(nextId);
      if (this.state.recentLicks.length > 5) this.state.recentLicks.shift();
      
      const lickData = BLUES_SOLO_LICKS[nextId];
      const rawPhrase = Array.isArray(lickData.phrase) ? lickData.phrase : decompressCompactPhrase(lickData.phrase as any);
      const stretched = stretchToNarrativeLength(rawPhrase, 48, this.random);
      
      this.currentAxiom = this.mutateLick(stretched);
  }

  /**
   * #ЗАЧЕМ: Исполнение гитарной аранжировки (Fingerstyle / Strum / Solo).
   */
  private renderArrangedAcoustic(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      if (!this.currentGuitarRiff) return [];
      const events: FractalEvent[] = [];
      const barIn12 = epoch % 12;
      const beatDuration = 60 / this.config.tempo;

      // 1. SOLO LAYER
      const chordName = getChordNameForBar(barIn12);
      let soloPhrase: any[] = [];
      if (barIn12 === 11) soloPhrase = this.currentGuitarRiff.solo.Turnaround;
      else if (chordName.startsWith('i')) soloPhrase = this.currentGuitarRiff.solo.I;
      else if (chordName.startsWith('iv')) soloPhrase = this.currentGuitarRiff.solo.IV;
      else soloPhrase = this.currentGuitarRiff.solo.V;

      soloPhrase.forEach(n => {
          events.push({
              type: 'melody',
              note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
              time: n.t / 3,
              duration: n.d / 3,
              weight: 0.85 * (tension + 0.2),
              technique: n.tech || 'pick',
              dynamics: 'p',
              phrasing: 'legato'
          });
      });

      // 2. FINGERSTYLE / STRUM LAYER (Зависит от напряжения)
      if (tension < 0.6 && this.currentGuitarRiff.fingerstyle) {
          const fs = this.currentGuitarRiff.fingerstyle[0];
          events.push(...this.renderGuitarPattern(fs.pattern, fs.voicingName, tension));
      } else if (this.currentGuitarRiff.strum) {
          const st = this.currentGuitarRiff.strum[0];
          events.push(...this.renderGuitarPattern(st.pattern, st.voicingName, tension));
      }

      return events;
  }

  private renderGuitarPattern(patternName: string, voicingName: string, tension: number): FractalEvent[] {
      const voicing = BLUES_GUITAR_VOICINGS[voicingName] || BLUES_GUITAR_VOICINGS['E7_open'];
      // Имитация Трэвис-пикинга или Страма через события аккомпанемента
      return voicing.map((note, i) => ({
          type: 'accompaniment',
          note: note + 12,
          time: i * 0.1,
          duration: 1.0,
          weight: 0.3 * (1 - tension * 0.5),
          technique: 'pluck',
          dynamics: 'p',
          phrasing: 'detached'
      }));
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const barInPhrase = epoch % 4;
    const barOffset = barInPhrase * 12;
    const barNotes = this.currentAxiom.filter(n => n.t >= barOffset && n.t < barOffset + 12);
    
    const events: FractalEvent[] = [];
    const momentum = this.state.tensionMomentum;

    barNotes.forEach((n, i) => {
        const nextNote = barNotes[i+1];
        let duration = n.d / 3;
        
        if (nextNote && (nextNote.t - (n.t + n.d)) < 1) {
            duration += 0.15; 
        }

        const phraseProgress = n.t / 48;
        const exhaleModifier = 1.0 - (phraseProgress * 0.35);

        const isAccent = n.t % 6 === 0;
        const baseWeight = isAccent ? 0.95 : 0.85; 
        const finalWeight = (baseWeight + Math.max(0, momentum * 3)) * exhaleModifier * (0.95 + this.random.next() * 0.1);

        events.push({
            type: 'melody',
            note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0) + (n.octShift || 0), this.MELODY_CEILING),
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

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints, epoch: number) {
    if (epoch % 4 !== 0 && epoch !== 0) return;

    if (hints.melody) {
        if (tension <= 0.45) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = 'telecaster';
        else (hints as any).melody = 'guitar_shineOn';
    }
    if (hints.accompaniment) {
        this.state.activeAccompTimbre = tension > 0.75 ? 'ep_rhodes_warm' : 'organ_soft_jazz';
        (hints as any).accompaniment = this.state.activeAccompTimbre;
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
          default:
              return phrase;
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

  private renderDynamicAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const momentum = this.state.tensionMomentum;
    const effectiveTension = tension + momentum * 5;
    if (effectiveTension < 0.4) return this.renderSoftPillows(epoch, chord, tension);
    else if (effectiveTension <= 0.7) return this.renderArpPad(epoch, chord, tension);
    else return this.renderPowerChords(epoch, chord, tension);
  }

  private renderSoftPillows(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    if (epoch % 2 !== 0) return [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7];
    return notes.map((p, i) => ({
        type: 'accompaniment', note: p, time: 0.5 + i * 0.05, duration: 2.0, weight: 0.22, technique: 'swell', dynamics: 'p', phrasing: 'legato'
    }));
  }

  private renderArpPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];
    events.push({ type: 'accompaniment', note: root, time: 0, duration: 4.0, weight: 0.28, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
    notes.forEach((p, i) => { if (this.random.next() < 0.7) events.push({ type: 'accompaniment', note: p + 12, time: 1.0 + i * 0.5, duration: 1.2, weight: 0.35, technique: 'pluck', dynamics: 'p', phrasing: 'detached' }); });
    return events;
  }

  private renderPowerChords(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];
    [0, 2.0].forEach(t => { notes.forEach((p, i) => { events.push({ type: 'accompaniment', note: p, time: t + i * 0.03, duration: 1.5, weight: 0.38, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato' }); }); });
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
    const riff = [ [{ t: 0, n: root, w: 0.85 }, { t: 2.0, n: root + 7, w: 0.7 }], [{ t: 0, n: root, w: 0.8 }, { t: 1.5, n: root, w: 0.7 }, { t: 2.5, n: root + 7, w: 0.75 }], [{ t: 0, n: root, w: 0.85 }, { t: 2.0, n: root + 7, w: 0.7 }, { t: 3.5, n: root + 10, w: 0.65 }], [{ t: 0, n: root + 7, w: 0.75 }, { t: 1.5, n: root + 5, w: 0.7 }, { t: 2.5, n: root, w: 0.9 }] ];
    return riff[barInRiff].map(p => ({ type: 'bass', note: p.n, time: p.t, duration: 1.2, weight: (p.w + (tension * 0.1)) * (0.95 + this.random.next() * 0.1), technique: 'pluck', dynamics: p.t === 0 ? 'mf' : 'p', phrasing: 'legato', params: { attack: 0.1, release: 0.8, filterCutoff: 450 } }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const nextRoot = getNextChordRoot(epoch % 12, chord.rootNote) - 12;
    const notes = [ root, root + 7, root + 10, nextRoot - 1 ];
    return notes.map((p, i) => ({ type: 'bass', note: p, time: i, duration: 0.9, weight: (i === 0 ? 0.85 : 0.5) + tension * 0.1, technique: 'pluck', dynamics: i === 0 ? 'mf' : 'p', phrasing: 'legato' }));
  }

  private renderBluesBeat(epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
      const events: FractalEvent[] = [];
      const kickTimes = tension > 0.7 ? [0, 1, 2, 3] : [0, 2.66];
      kickTimes.forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t, duration: 0.1, weight: 0.5 + (tension * 0.2), technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      if (tension > 0.45) [1, 3].forEach(t => events.push({ type: 'drum_snare_ghost_note', note: 38, time: t, duration: 0.1, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66].forEach(t => events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t, duration: 0.1, weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      return events;
  }

  private renderIntegratedPiano(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 24;
      const isMin = chord.chordType === 'minor';
      const degrees = [0, isMin ? 3 : 4, 7, 10, 14];
      [1.5, 3.5].forEach(beat => { if (this.random.next() < (0.15 + tension * 0.2)) events.push({ type: 'pianoAccompaniment', note: Math.min(root + degrees[this.random.nextInt(degrees.length)], this.MELODY_CEILING), time: beat, duration: 4.0, weight: 0.25 + tension * 0.1, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { barCount: epoch } }); });
      return events;
  }

  private renderDerivativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      if (this.random.next() > 0.3) return [];
      [chord.rootNote + 12, chord.rootNote + 19].forEach((n, i) => events.push({ type: 'harmony', note: n + 12, time: i * 0.1, duration: 4.0, weight: 0.12, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { barCount: epoch, filterCutoff: 3000 } }));
      return events;
  }

  private refreshUnifiedMutation() {
      const types: ('jitter' | 'inversion' | 'rhythm' | 'transposition')[] = ['jitter', 'inversion', 'rhythm', 'transposition'];
      this.state.currentMutationType = types[this.random.nextInt(types.length)];
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

  private createSeededRandom(seed: number) {
    let state = seed;
    const next = () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
    return { next, nextInt: (max: number) => Math.floor(next() * max) };
  }
}
