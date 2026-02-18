import {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState
} from '@/types/music';
import { 
    getNextChordRoot, 
    getChordNameForBar,
    DEGREE_TO_SEMITONE
} from './blues-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V86.0 — "Maximum Diversity".
 * #ЧТО: 1. Внедрена строгая память использованных ликов (usedLicksInSuite).
 *       2. Реализован Non-Deterministic Pick для исключения "шарманки".
 *       3. Исправлен баг "2-х ликов на пьесу".
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private random: any;
  private currentAxiom: any[] = [];
  private currentLickId: string = '';
  
  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 

  private state: BluesCognitiveState;
  private sfxPlayedInBridge = false;
  private usedLicksInSuite: Set<string> = new Set();

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    this.random = this.createSeededRandom(seed);

    this.state = {
      phraseState: 'call',
      tensionLevel: 0.3,
      phraseHistory: [],
      pianoHistory: [],
      accompHistory: [],
      mesoHistory: [],
      macroHistory: [],
      lastPhraseHash: '',
      blueNotePending: false,
      emotion: { melancholy: 0.8, darkness: 0.3 },
      stagnationStrikes: { micro: 0, meso: 0, macro: 0 }
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
    hints: InstrumentHints
  ): FractalEvent[] {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    
    this.evaluateTimbralDramaturgy(tension, hints);
    
    // #ЗАЧЕМ: Исключение повторов. Смена лика на границах фраз.
    const isPhraseBoundary = epoch % 4 === 0;
    if (this.currentAxiom.length === 0 || navInfo.isPartTransition || isPhraseBoundary) {
        this.selectNextAxiom(navInfo, dna, epoch);
    }

    const events: FractalEvent[] = [];

    if (hints.melody) events.push(...this.renderMelodicSegment(epoch, currentChord, tension));
    if (hints.accompaniment) events.push(...this.renderPullChops(epoch, currentChord, tension));
    if (hints.bass) events.push(...this.renderIronBass(currentChord, epoch));
    if (hints.drums) events.push(...this.renderBluesBeat(epoch, tension, navInfo));
    if (hints.pianoAccompaniment) events.push(...this.renderLyricalPiano(epoch, currentChord, tension));

    if (hints.sfx && this.mood === 'melancholic') {
        const isBridge = navInfo.currentPart.id.includes('BRIDGE');
        if (isBridge && !this.sfxPlayedInBridge) {
            events.push(...this.renderCleanSfx(tension));
            this.sfxPlayedInBridge = true;
        } else if (!isBridge) {
            this.sfxPlayedInBridge = false;
        }
    }

    return events;
  }

  private mutateLick(phrase: any[], epoch: number): any[] {
      // #ЗАЧЕМ: Создание бесконечных вариаций на базе одной аксиомы.
      const mutationType = Math.floor(this.random.next() * 5); 
      let mutated = [...phrase];
      switch(mutationType) {
          case 1: // Inversion
              const pivot = phrase[0]?.deg || 'R';
              mutated = phrase.map(n => ({...n, deg: this.invertDegree(n.deg, pivot)}));
              break;
          case 2: // Rhythmic Jitter
              mutated = phrase.map(n => ({...n, t: n.t + (this.random.next() * 0.6 - 0.3)}));
              break;
          case 3: // Octave Shift
              mutated = phrase.map(n => ({...n, deg: n.deg === 'R' ? 'R+8' : n.deg }));
              break;
      }
      return mutated;
  }

  private invertDegree(deg: string, pivot: string): string {
      const s = DEGREE_TO_SEMITONE[deg] || 0;
      const p = DEGREE_TO_SEMITONE[pivot] || 0;
      const inv = p - (s - p);
      const entry = Object.entries(DEGREE_TO_SEMITONE).find(([k, v]) => v === (inv % 12));
      return entry ? entry[0] : deg;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      const dynasty = dna.dynasty || 'soul';
      
      // #ЗАЧЕМ: Умный подбор без повторов.
      // #ЧТО: Сначала пытаемся выбрать лик, который ЕЩЕ НЕ ИГРАЛ в этой пьесе.
      let pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
          BLUES_SOLO_LICKS[id].tags.includes(dynasty) && !this.usedLicksInSuite.has(id)
      );

      // Если пул исчерпан - сбрасываем память
      if (pool.length === 0) {
          console.info(`%c[Narrative] Pool depleted for dynasty "${dynasty}". Resetting memory.`, 'color: #888;');
          this.usedLicksInSuite.clear();
          pool = Object.keys(BLUES_SOLO_LICKS).filter(id => BLUES_SOLO_LICKS[id].tags.includes(dynasty));
      }

      // Выбираем абсолютно случайно, а не детерминированно
      const nextId = pool[this.random.nextInt(pool.length)] || 'L01';

      this.currentLickId = nextId;
      this.usedLicksInSuite.add(nextId);
      this.currentAxiom = this.mutateLick(BLUES_SOLO_LICKS[nextId].phrase, epoch);
      
      console.info(`%c[Narrative] Bar ${epoch} | Act: ${navInfo.currentPart.id} | New Theme: ${nextId} | Pool: ${pool.length}`, 'color: #4ade80; font-weight: bold;');
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.55) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.75) (hints as any).melody = 'cs80';
        else (hints as any).melody = 'guitar_shineOn';
    }
    if (hints.accompaniment) {
        (hints as any).accompaniment = tension > 0.75 ? 'ep_rhodes_warm' : 'organ_soft_jazz';
    }
  }

  private renderLyricalPiano(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 24;
      const noteChance = tension * 0.7;
      [0, 1.5, 3].forEach(beat => {
          if (this.random.next() < noteChance) {
              events.push({
                  type: 'pianoAccompaniment',
                  note: Math.min(root + [0,3,7,10][this.random.nextInt(4)], this.MELODY_CEILING),
                  time: beat, duration: 2.0, weight: 0.3 + tension * 0.2,
                  technique: 'hit', dynamics: 'p', phrasing: 'staccato'
              });
          }
      });
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const barInPhrase = epoch % 4;
    const barNotes = this.currentAxiom.filter(n => n.t >= barInPhrase * 12 && n.t < (barInPhrase + 1) * 12);
    return barNotes.map(n => ({
        type: 'melody',
        note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
        time: (n.t % 12) / 3,
        duration: n.d / 3,
        weight: 0.85, technique: n.tech || 'pick',
        dynamics: tension > 0.7 ? 'mf' : 'p', phrasing: 'legato'
    }));
  }

  private renderPullChops(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];
    
    if (tension > 0.7) { 
        [0, 1.5, 3].forEach(t => notes.forEach(p => events.push({
            type: 'accompaniment', note: p, time: t, duration: 0.5, weight: 0.3,
            technique: 'pluck', dynamics: 'mp', phrasing: 'staccato'
        })));
    } else if (tension > 0.5) { 
        notes.forEach((p, i) => events.push({
            type: 'accompaniment', note: p, time: i * 0.5, duration: 1.5, weight: 0.3,
            technique: 'arpeggio', dynamics: 'p', phrasing: 'legato'
        }));
    } else if (epoch % 2 === 0) { 
        notes.slice(0, 3).forEach((p, i) => events.push({
            type: 'accompaniment', note: p, time: 0.5 + i * 0.02, duration: 8.0, weight: 0.25,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }
    return events;
  }

  private renderIronBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const nextRoot = getNextChordRoot(epoch % 12, chord.rootNote) - 12;
    const notes = [root, root + 7, root + 10, nextRoot - 1];
    return notes.map((p, i) => ({
        type: 'bass', note: p, time: i, duration: 0.9, weight: i === 0 ? 0.8 : 0.45,
        technique: 'pluck', dynamics: 'p', phrasing: 'legato'
    }));
  }

  private renderBluesBeat(epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
      const events: FractalEvent[] = [];
      const isBreakdown = navInfo.currentPart.id.includes('MAIN_3') || tension < 0.45;
      const isPeak = tension > 0.75;
      
      const kickTimes = isPeak ? [0, 1, 2, 3] : (isBreakdown ? [0] : [0, 2.66]);
      kickTimes.forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t, duration: 0.1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));

      if (!isBreakdown) {
          [1, 3].forEach(t => events.push({ type: isPeak ? 'drum_snare' : 'drum_snare_ghost_note', note: 38, time: t, duration: 0.1, weight: isPeak ? 0.7 : 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      }

      [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66].forEach(t => {
          if (isBreakdown && t % 1 !== 0) return;
          events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t, duration: 0.1, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });

      return events;
  }

  private renderCleanSfx(tension: number): FractalEvent[] {
      return [{ type: 'sfx', note: 60, time: 1.0, duration: 4.0, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { mood: this.mood, genre: 'blues' } }];
  }
}
