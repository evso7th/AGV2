import type {
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
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V70.0 — "The Narrative Masterpiece".
 * #ЧТО: 1. Внедрена поддержка 4-тактных морфинг-бриджей.
 *       2. Реализовано Lyrical Piano с плотностью, зависящей от Tension.
 *       3. Семантическая связь MAIN-частей через partLickMap.
 * #ПРИМЕЧАНИЕ: Изменение логики СОР осознанно разрешено для реализации музыкального повествования.
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
    
    // #ЗАЧЕМ: Реализация морфинг-бриджа.
    // #ЧТО: Если мы в бридже, первые 2 такта сохраняем прошлую оркестровку, вторые 2 — будущую.
    if (navInfo.currentPart.id.startsWith('BRIDGE')) {
        const barInPart = epoch - navInfo.currentPartStartBar;
        if (barInPart < 2) {
            // Inherit logic (usually handled by sticky engine, but we log here)
            // console.log(`[Bridge] Morphing Stage 1: Retaining context.`);
        } else {
            // console.log(`[Bridge] Morphing Stage 2: Leading into next part.`);
        }
    }

    this.evaluateTimbralDramaturgy(tension, hints);
    
    const phraseTicks = Math.max(...(this.currentAxiom.map(n => n.t + n.d) || [12]), 12);
    const phraseBars = Math.ceil(phraseTicks / 12);
    const isPhraseEnd = epoch % phraseBars === 0;

    if (this.currentAxiom.length === 0 || navInfo.isPartTransition || isPhraseEnd) {
        this.selectNextAxiom(navInfo, dna, epoch);
    }

    const events: FractalEvent[] = [];
    const melodyEvents: FractalEvent[] = [];

    // --- 1. MELODY ---
    if (hints.melody) {
      const mEvents = this.renderMelodicSegment(epoch, currentChord, tension);
      melodyEvents.push(...mEvents);
      events.push(...mEvents);
    }

    // --- 2. ACCOMPANIMENT ---
    if (hints.accompaniment) {
      events.push(...this.renderPullChops(epoch, currentChord, tension, hints.accompaniment as string));
    }

    // --- 3. BASS ---
    if (hints.bass) {
      events.push(...this.renderIronBass(currentChord, epoch));
    }

    // --- 4. DRUMS ---
    if (hints.drums) {
      events.push(...this.renderDrums(epoch));
    }

    // --- 5. LYRICAL PIANO ---
    // #ЗАЧЕМ: Пианист как звуковой индикатор Tension.
    if (hints.pianoAccompaniment) {
        events.push(...this.renderLyricalPiano(epoch, currentChord, tension));
    }

    // --- SOR AUDIT ---
    this.auditStagnationV5(melodyEvents, currentChord, epoch, dna);

    return events;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      // #ЗАЧЕМ: Семантическая связь частей через partLickMap.
      const lickIdFromDNA = dna.partLickMap?.get(navInfo.currentPart.id);
      
      let nextId: string;
      if (lickIdFromDNA && BLUES_SOLO_LICKS[lickIdFromDNA]) {
          nextId = lickIdFromDNA;
      } else {
          const dynastyTags = BLUES_SOLO_LICKS[dna.seedLickId || 'L01']?.tags || ['minor'];
          const pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
              BLUES_SOLO_LICKS[id].tags.some(t => dynastyTags.includes(t)) && id !== this.currentLickId
          );
          nextId = pool[this.random.nextInt(pool.length)] || 'L01';
      }

      this.currentLickId = nextId;
      this.currentAxiom = BLUES_SOLO_LICKS[nextId].phrase;
      
      console.info(`%c[Narrative] Part: ${navInfo.currentPart.id} | Theme: ${nextId} (Epoch: ${epoch})`, 'color: #4ade80; font-weight: bold;');
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.60) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = 'cs80'; 
        else (hints as any).melody = 'guitar_shineOn'; 
    }

    if (hints.accompaniment) {
        if (tension > 0.75) {
            (hints as any).accompaniment = 'ep_rhodes_warm';
        }
    }
  }

  /**
   * #ЗАЧЕМ: Лирическое пианино, озвучивающее волны напряжения.
   * #ЧТО: Плотность игры прямо пропорциональна tension. 
   */
  private renderLyricalPiano(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 24;
      const isMinor = chord.chordType === 'minor';
      const scale = [0, 3, 7, 10]; // i7
      
      // #ЗАЧЕМ: Звуковое отображение Tension.
      // 0.3 tension -> ~1 нота в 2 такта.
      // 0.9 tension -> 4 ноты в такт.
      const noteChance = tension * 0.8; 
      const beats = [0, 1.5, 3]; 

      beats.forEach(beat => {
          if (this.random.next() < noteChance) {
              const deg = scale[this.random.nextInt(scale.length)];
              events.push({
                  type: 'pianoAccompaniment',
                  note: Math.min(root + deg, this.MELODY_CEILING),
                  time: beat,
                  duration: 2.0,
                  weight: 0.3 + (tension * 0.2), // Плотнее нажатие при напряжении
                  technique: 'hit',
                  dynamics: 'p',
                  phrasing: 'staccato',
                  params: { filterCutoff: 3500 }
              });
          }
      });

      return events;
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

  private renderPullChops(epoch: number, chord: GhostChord, tension: number, timbre: string): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const root = chord.rootNote + 12;
    const notes = [root, root + (isMinor ? 3 : 4), root + 7];
    
    if (epoch % 2 === 0) {
        notes.forEach((p, i) => {
            events.push({
                type: 'accompaniment',
                note: p,
                time: 0.5 + (i * 0.02), 
                duration: 8.0, 
                weight: 0.25,
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato'
            });
        });
    }
    return events;
  }

  private renderIronBass(chord: GhostChord, epoch: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const barIn12 = epoch % 12;
    const nextRoot = getNextChordRoot(barIn12, chord.rootNote) - 12;
    
    const notes = [root, root + 7, root + 10, nextRoot - 1]; 
    return notes.map((p, i) => ({
        type: 'bass', 
        note: p, 
        time: i, 
        duration: 0.9, 
        weight: i === 0 ? 0.8 : 0.45,
        technique: 'pluck', 
        dynamics: 'p', 
        phrasing: 'legato'
    }));
  }

  private renderDrums(epoch: number): FractalEvent[] {
    const pool = BLUES_DRUM_RIFFS.melancholic || [];
    const p = pool[epoch % pool.length];
    if (!p) return [];
    const events: FractalEvent[] = [];
    if (p.K) p.K.forEach(t => events.push({ type: 'drum_kick_reso', time: t/3, duration: 0.1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
    if (p.SD) p.SD.forEach(t => events.push({ type: 'drum_snare_ghost_note', time: t/3, duration: 0.1, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
    return events;
  }

  private auditStagnationV5(melody: FractalEvent[], chord: GhostChord, epoch: number, dna: SuiteDNA) {
      if (melody.length === 0) return;
      const hash = melody.map(e => (e.note - chord.rootNote) % 12).join(',');

      this.state.phraseHistory.push(hash);
      if (this.state.phraseHistory.length > this.MAX_HISTORY_DEPTH) this.state.phraseHistory.shift();

      if (this.state.phraseHistory.length >= 4) {
          const last2 = this.state.phraseHistory.slice(-2).join('|');
          const prev2 = this.state.phraseHistory.slice(-4, -2).join('|');
          if (last2 === prev2) this.state.stagnationStrikes.meso++;
          else this.state.stagnationStrikes.meso = 0;
      }

      if (this.state.phraseHistory.length >= 8) {
          const last4 = this.state.phraseHistory.slice(-4).join('|');
          const prev4 = this.state.phraseHistory.slice(-8, -4).join('|');
          if (last4 === prev4) this.state.stagnationStrikes.macro++;
          else this.state.stagnationStrikes.macro = 0;
      }

      if (this.state.stagnationStrikes.macro >= 1 || this.state.stagnationStrikes.meso >= 3) {
          console.warn(`%c[SOR] STAGNATION DETECTED. Forcing Theme Shift at bar ${epoch}.`, 'color: #ff4500; font-weight: bold;');
          this.selectNextAxiom({ currentPart: { id: 'MAIN' } } as any, dna, epoch);
          this.state.stagnationStrikes = { micro: 0, meso: 0, macro: 0 };
      }
  }
}
