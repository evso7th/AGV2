import type {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Dynamics,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState
} from '@/types/music';
import { calculateMusiNum, DEGREE_TO_SEMITONE, transformLick } from './music-theory';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_SOLO_LICKS } from './assets/blues-guitar-solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V60.0 — "Masterpiece Alignment".
 * #ЧТО: 1. Внедрена система Fractal Sentinel V3 (1-2-4 такта).
 *       2. Реализован Sabbath Riff L212 (оцифровка).
 *       3. Аккомпанемент: "The Pull Chops" (длинный сустейн, задержка).
 *       4. Бас: "Iron Walker" (строго 4/4).
 *       5. Тембральные пороги: blackAcoustic(0.60), cs80(0.85), shineOn(Peak).
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
    const tempo = dna.baseTempo || 72;
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    
    this.evaluateTimbralDramaturgy(tension, hints);
    
    if (navInfo.isPartTransition && dna.partLickMap?.has(navInfo.currentPart.id)) {
        const nextLickId = dna.partLickMap.get(navInfo.currentPart.id)!;
        this.currentAxiom = BLUES_SOLO_LICKS[nextLickId].phrase;
        console.info(`%c[SOR] Part Transition: New Lick Loaded: ${nextLickId}`, 'color: #4ade80; font-weight: bold;');
    }

    const events: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];

    // --- 1. MELODY (The Voice) ---
    if (hints.melody) {
      const mEvents = this.renderMelody(epoch, currentChord, tension, dna);
      melodyEvents.push(...mEvents);
      events.push(...mEvents);
    }

    // --- 2. ACCOMPANIMENT (Pull Chops) ---
    if (hints.accompaniment) {
      events.push(...this.renderChops(epoch, currentChord, tension));
    }

    // --- 3. BASS (Iron Walker) ---
    if (hints.bass) {
      events.push(...this.renderIronBass(currentChord));
    }

    // --- 4. DRUMS ---
    if (hints.drums) {
      events.push(...this.renderDrums(epoch));
    }

    // --- STAGNATION AUDIT ---
    this.auditStagnation(melodyEvents, currentChord, epoch, tension);

    return events;
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.60) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = 'cs80'; 
        else (hints as any).melody = 'guitar_shineOn'; 
    }
  }

  private renderMelody(epoch: number, chord: GhostChord, tension: number, dna: SuiteDNA): FractalEvent[] {
    if (this.currentAxiom.length === 0) this.currentAxiom = dna.seedLickNotes || [];
    
    return this.currentAxiom.map(n => ({
        type: 'melody',
        note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
        time: n.t / 3,
        duration: n.d / 3,
        weight: 0.85,
        technique: n.tech || 'pick',
        dynamics: tension > 0.7 ? 'mf' : 'p',
        phrasing: 'legato'
    }));
  }

  private renderChops(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const notes = [chord.rootNote + 12 + (isMinor ? 3 : 4), chord.rootNote + 12 + 10]; // 3 and 7
    
    [1.5, 3.5].forEach(t => {
        if (this.random.next() < 0.7) {
            notes.forEach(p => {
                events.push({
                    type: 'accompaniment', note: p, time: t + 0.02, // Slit delay
                    duration: 2.0, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato'
                });
            });
        }
    });
    return events;
  }

  private renderIronBass(chord: GhostChord): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const notes = [root, root + 4, root + 7, root + 10];
    return notes.map((p, i) => ({
        type: 'bass', note: p, time: i, duration: 0.9, weight: i === 0 ? 0.8 : 0.5,
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

  private auditStagnation(melody: FractalEvent[], chord: GhostChord, epoch: number, tension: number) {
      if (melody.length === 0) return;
      const hash = melody.map(e => (e.note - chord.rootNote) % 12).join(',');

      // 1. MICRO (1 Bar)
      if (hash === this.state.phraseHistory[this.state.phraseHistory.length - 1]) {
          this.state.stagnationStrikes.micro++;
          console.warn(`%c[SOR] MICRO STRIKE ${this.state.stagnationStrikes.micro}/3`, 'color: orange;');
      } else this.state.stagnationStrikes.micro = 0;

      this.state.phraseHistory.push(hash);
      if (this.state.phraseHistory.length > this.MAX_HISTORY_DEPTH) this.state.phraseHistory.shift();

      // 2. MESO (2 Bars)
      if (epoch % 2 === 1 && this.state.phraseHistory.length >= 4) {
          const current = this.state.phraseHistory.slice(-2).join('|');
          const last = this.state.phraseHistory.slice(-4, -2).join('|');
          if (current === last) {
              this.state.stagnationStrikes.meso++;
              console.warn(`%c[SOR] MESO STRIKE ${this.state.stagnationStrikes.meso}/3`, 'color: red; font-weight: bold;');
          } else this.state.stagnationStrikes.meso = 0;
      }

      // 3. MACRO (4 Bars)
      if (epoch % 4 === 3 && this.state.phraseHistory.length >= 8) {
          const current = this.state.phraseHistory.slice(-4).join('|');
          const last = this.state.phraseHistory.slice(-8, -4).join('|');
          if (current === last) {
              this.state.stagnationStrikes.macro++;
              console.warn(`%c[SOR] MACRO STRIKE ${this.state.stagnationStrikes.macro}/3`, 'color: darkred; background: yellow;');
          } else this.state.stagnationStrikes.macro = 0;
      }

      // VACCINATION
      if (this.state.stagnationStrikes.micro >= 3) { this.inject('micro'); this.state.stagnationStrikes.micro = 0; }
      if (this.state.stagnationStrikes.meso >= 3) { this.inject('meso'); this.state.stagnationStrikes.meso = 0; }
      if (this.state.stagnationStrikes.macro >= 3) { this.inject('macro'); this.state.stagnationStrikes.macro = 0; }
  }

  private inject(scale: 'micro' | 'meso' | 'macro') {
      console.info(`%c[SOR] VACCINE INJECTED: Scale=${scale.toUpperCase()}`, 'color: #4ade80; font-weight: bold;');
      if (scale === 'micro') this.currentAxiom = transformLick(this.currentAxiom, this.seed, 0, 'jitter');
      else if (scale === 'meso') this.currentAxiom = transformLick(this.currentAxiom, this.seed, 0, 'inversion');
      else this.currentAxiom = transformLick(this.currentAxiom, this.seed, 0, 'transposition');
  }
}
