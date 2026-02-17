import type {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState
} from '@/types/music';
import { calculateMusiNum, DEGREE_TO_SEMITONE, transformLick } from './music-theory';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_SOLO_LICKS } from './assets/blues-guitar-solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V61.0 — "Narrative Flow".
 * #ЧТО: 1. Мелодия теперь рендерится как сегмент длинной аксиомы (4-12 тактов).
 *       2. Аккомпанемент "The Pull" (тягучие аккорды, исключение "цыганочки").
 *       3. Бас: Монументальный "Iron Pillar".
 *       4. Устранение заикания через циклическую память фраз.
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private random: any;
  private lastAscendingBar: number = -10;
  private currentAxiom: any[] = [];
  
  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 
  private readonly MAX_HISTORY_DEPTH = 32;

  private state: BluesCognitiveState;

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
      emotion: {
        melancholy: 0.8,
        darkness: 0.3
      },
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
    hints: InstrumentHints,
    lastEvents: FractalEvent[]
  ): FractalEvent[] {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    
    this.evaluateTimbralDramaturgy(tension, hints);
    
    // --- NARRATIVE SELECTION ---
    if (this.currentAxiom.length === 0 || navInfo.isPartTransition) {
        const lickId = dna.partLickMap?.get(navInfo.currentPart.id) || dna.seedLickId || 'L01';
        this.currentAxiom = BLUES_SOLO_LICKS[lickId].phrase;
        console.info(`%c[Narrative] New Master Axiom Loaded: ${lickId}`, 'color: #DA70D6; font-weight: bold;');
    }

    const events: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];

    // --- 1. MELODY (Horizontal Segment Rendering) ---
    if (hints.melody) {
      const mEvents = this.renderMelodicSegment(epoch, currentChord, tension);
      melodyEvents.push(...mEvents);
      events.push(...mEvents);
    }

    // --- 2. ACCOMPANIMENT (The Pull Chops) ---
    if (hints.accompaniment) {
      events.push(...this.renderPullChops(epoch, currentChord, tension));
    }

    // --- 3. BASS (Iron Pillar) ---
    if (hints.bass) {
      events.push(...this.renderIronBass(currentChord));
    }

    // --- 4. DRUMS ---
    if (hints.drums) {
      events.push(...this.renderDrums(epoch));
    }

    this.auditStagnationV4(melodyEvents, currentChord, epoch);

    return events;
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.60) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = 'cs80'; 
        else (hints as any).melody = 'guitar_shineOn'; 
    }
  }

  /**
   * #ЗАЧЕМ: Рендеринг сегмента длинной фразы.
   * #ЧТО: Вычисляет смещение такта внутри аксиомы и возвращает только нужные ноты.
   */
  private renderMelodicSegment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const phraseTicks = Math.max(...this.currentAxiom.map(n => n.t + n.d), 12);
    const phraseBars = Math.ceil(phraseTicks / 12);
    
    const barInPhrase = epoch % phraseBars;
    const tickOffset = barInPhrase * 12;
    
    const barNotes = this.currentAxiom.filter(n => n.t >= tickOffset && n.t < tickOffset + 12);

    return barNotes.map(n => ({
        type: 'melody',
        note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
        time: (n.t - tickOffset) / 3,
        duration: n.d / 3,
        weight: 0.85,
        technique: n.tech || 'pick',
        dynamics: tension > 0.7 ? 'mf' : 'p',
        phrasing: 'legato'
    }));
  }

  /**
   * #ЗАЧЕМ: "Тянущий" аккомпанемент вместо суетливой "цыганочки".
   * #ЧТО: Длинные сустейны, вступление на слабые доли, отсутствие переборов.
   */
  private renderPullChops(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const notes = [chord.rootNote + 12, chord.rootNote + 12 + (isMinor ? 3 : 4), chord.rootNote + 12 + 7];
    
    // Играем только в четные такты или при высоком напряжении
    if (epoch % 2 === 0 || tension > 0.6) {
        const startTime = 0.5; // На "и" первой доли
        notes.forEach((p, i) => {
            events.push({
                type: 'accompaniment',
                note: p,
                time: startTime + (i * 0.02), // Микро-ролл
                duration: 3.5, // Тянем до конца такта
                weight: 0.25,
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato'
            });
        });
    }
    return events;
  }

  private renderIronBass(chord: GhostChord): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    // Строгая опора: Root - 5 - 7 - Root
    const notes = [root, root + 7, root + 10, root];
    return notes.map((p, i) => ({
        type: 'bass', note: p, time: i, duration: 0.9, weight: i === 0 ? 0.8 : 0.4,
        technique: 'pluck', dynamics: 'p', phrasing: 'legato'
    }));
  }

  private renderDrums(epoch: number): FractalEvent[] {
    const pool = BLUES_DRUM_RIFFS.melancholic || [];
    const p = pool[epoch % pool.length];
    if (!p) return [];
    const events: FractalEvent[] = [];
    if (p.K) p.K.forEach(t => events.push({ type: 'drum_kick', time: t/3, duration: 0.1, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
    if (p.SD) p.SD.forEach(t => events.push({ type: 'drum_snare', time: t/3, duration: 0.1, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
    return events;
  }

  private auditStagnationV4(melody: FractalEvent[], chord: GhostChord, epoch: number) {
      if (melody.length === 0) return;
      const hash = melody.map(e => (e.note - chord.rootNote) % 12).join(',');

      // Memory check
      if (hash === this.state.phraseHistory[this.state.phraseHistory.length - 1]) {
          this.state.stagnationStrikes.micro++;
      } else this.state.stagnationStrikes.micro = 0;

      this.state.phraseHistory.push(hash);
      if (this.state.phraseHistory.length > this.MAX_HISTORY_DEPTH) this.state.phraseHistory.shift();

      if (this.state.stagnationStrikes.micro >= 3) {
          console.info(`%c[SOR] Long-phrase stagnation detected. Injecting Variation.`, 'color: #4ade80; font-weight: bold;');
          this.currentAxiom = transformLick(this.currentAxiom, this.seed, epoch, 'jitter');
          this.state.stagnationStrikes.micro = 0;
      }
  }
}
