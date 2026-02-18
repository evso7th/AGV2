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
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V62.0 — "Narrative Flow & Fractal Sentinel".
 * #ЧТО: 1. Полноценный 3-х уровневый аудит стагнации (1-2-4 такта).
 *       2. Автоматическая смена лика на границах фраз (каждые 4-8 тактов).
 *       3. Усиление эффекта "The Pull" через перекрытие аккордов (8.0 beats).
 *       4. Исправлена "шарманка" путем отделения выбора лика от смены части.
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private random: any;
  private currentAxiom: any[] = [];
  private currentLickId: string = '';
  
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
    
    // --- NARRATIVE SELECTION (Phrase Boundary Logic) ---
    const phraseTicks = Math.max(...(this.currentAxiom.map(n => n.t + n.d) || [12]), 12);
    const phraseBars = Math.ceil(phraseTicks / 12);
    const isPhraseBoundary = epoch % Math.max(4, phraseBars) === 0;

    if (this.currentAxiom.length === 0 || navInfo.isPartTransition || isPhraseBoundary) {
        this.selectNextAxiom(navInfo, dna, epoch);
    }

    const events: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];

    // --- 1. MELODY (Horizontal Segment Rendering) ---
    if (hints.melody) {
      const mEvents = this.renderMelodicSegment(epoch, currentChord, tension);
      melodyEvents.push(...mEvents);
      events.push(...mEvents);
    }

    // --- 2. ACCOMPANIMENT (The Imperial Pull) ---
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

    // --- SOR AUDIT ---
    this.auditStagnationV4(melodyEvents, currentChord, epoch, dna);

    return events;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      // Пул ликов текущей Династии
      const lickIdFromDNA = dna.partLickMap?.get(navInfo.currentPart.id) || dna.seedLickId || 'L01';
      const dynastyTags = BLUES_SOLO_LICKS[lickIdFromDNA]?.tags || ['minor'];
      
      const pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
          BLUES_SOLO_LICKS[id].tags.some(t => dynastyTags.includes(t)) && id !== this.currentLickId
      );

      const nextId = pool[calculateMusiNum(epoch, 7, this.seed, pool.length)];
      this.currentLickId = nextId;
      this.currentAxiom = BLUES_SOLO_LICKS[nextId].phrase;
      
      console.info(`%c[Narrative] New Master Axiom Loaded: ${nextId} (Dynasty: ${dynastyTags[0]})`, 'color: #DA70D6; font-weight: bold;');
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.60) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = 'cs80'; 
        else (hints as any).melody = 'guitar_shineOn'; 
    }
  }

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

  private renderPullChops(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const notes = [chord.rootNote + 12, chord.rootNote + 12 + (isMinor ? 3 : 4), chord.rootNote + 12 + 7];
    
    // Играем тягучие аккорды каждые 2 такта
    if (epoch % 2 === 0 || tension > 0.65) {
        const startTime = 0.5; 
        notes.forEach((p, i) => {
            events.push({
                type: 'accompaniment',
                note: p,
                time: startTime + (i * 0.02), 
                duration: 8.0, // УСИЛЕНИЕ: Перекрытие на 2 такта
                weight: 0.22,
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
    if (p.K) p.K.forEach(t => events.push({ type: 'drum_kick_reso', time: t/3, duration: 0.1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
    if (p.SD) p.SD.forEach(t => events.push({ type: 'drum_snare_ghost_note', time: t/3, duration: 0.1, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
    return events;
  }

  private auditStagnationV4(melody: FractalEvent[], chord: GhostChord, epoch: number, dna: SuiteDNA) {
      if (melody.length === 0) return;
      const hash = melody.map(e => (e.note - chord.rootNote) % 12).join(',');

      // 1. MICRO AUDIT (1 bar)
      if (hash === this.state.phraseHistory[this.state.phraseHistory.length - 1]) {
          this.state.stagnationStrikes.micro++;
      } else this.state.stagnationStrikes.micro = 0;

      this.state.phraseHistory.push(hash);
      if (this.state.phraseHistory.length > this.MAX_HISTORY_DEPTH) this.state.phraseHistory.shift();

      // 2. MESO AUDIT (2 bars)
      if (this.state.phraseHistory.length >= 4) {
          const last2 = this.state.phraseHistory.slice(-2).join('|');
          const prev2 = this.state.phraseHistory.slice(-4, -2).join('|');
          if (last2 === prev2) this.state.stagnationStrikes.meso++;
          else this.state.stagnationStrikes.meso = 0;
      }

      // 3. MACRO AUDIT (4 bars)
      if (this.state.phraseHistory.length >= 8) {
          const last4 = this.state.phraseHistory.slice(-4).join('|');
          const prev4 = this.state.phraseHistory.slice(-8, -4).join('|');
          if (last4 === prev4) this.state.stagnationStrikes.macro++;
          else this.state.stagnationStrikes.macro = 0;
      }

      // LOGGING & VACCINATION
      if (this.state.stagnationStrikes.micro >= 3) console.warn(`%c[SOR] MICRO STRIKE 3/3 detected at bar ${epoch}.`, 'color: #FFA500');
      if (this.state.stagnationStrikes.meso >= 2) console.warn(`%c[SOR] MESO STRIKE 2/3 (2-bar loop) detected at bar ${epoch}.`, 'color: #FF8C00');
      if (this.state.stagnationStrikes.macro >= 1) console.warn(`%c[SOR] MACRO STRIKE (4-bar loop) detected at bar ${epoch}.`, 'color: #FF4500; font-weight: bold;');

      if (this.state.stagnationStrikes.macro >= 1 || this.state.stagnationStrikes.meso >= 3 || this.state.stagnationStrikes.micro >= 4) {
          console.info(`%c[SOR] VACCINE INJECTED: Forcing Master Axiom change.`, 'color: #4ade80; font-weight: bold;');
          this.selectNextAxiom({ currentPart: { id: 'MAIN' } } as any, dna, epoch);
          this.state.stagnationStrikes = { micro: 0, meso: 0, macro: 0 };
      }
  }
}
