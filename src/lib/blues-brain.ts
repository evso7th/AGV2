import type {
  FractalEvent,
  Mood,
  GhostChord,
  SuiteDNA,
  NavigationInfo,
  InstrumentHints,
  Technique,
  Dynamics,
  Phrasing
} from '@/types/music';
import { calculateMusiNum, pickWeightedDeterministic } from './music-theory';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V4.1 — "Integrated Fractal Engine".
 * #ЧТО: Полностью детерминированный движок, глубоко интегрированный с семенами и блюпринтами.
 *       1. MusiNum Core: Каждое музыкальное решение привязано к глобальному seed и текущему epoch.
 *       2. Blueprint-Driven: Выбор техник (long-chords, arpeggio-slow) берется из правил BlueprintPart.
 *       3. 2nd Order Markov: Семантический фильтр мелодии для обеспечения связности.
 *       4. 1/f Pink Noise: Фрактальное дыхание тайминга.
 * #СВЯЗИ: Управляется BlueprintNavigator, использует детерминированный MusiNum.
 */

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const BLUES_SCALE = [0, 3, 5, 6, 7, 10]; // 1, b3, 4, b5, 5, b7

export class BluesBrain {
  private seed: number;
  private lastNotes: number[] = [0, 0]; // Память для Маркова 2-го порядка
  private pinkNoiseState: number[] = new Array(8).fill(0);
  private lastAxiom: number[] = [];

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
  }

  // ───── ГЛАВНЫЙ МЕТОД ─────

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    // Темп берется СТРОГО из ДНК сюиты
    const barDuration = 60 / (dna.baseTempo || 72);
    
    // 1. УДАРНЫЕ (Фрактальный свинг)
    if (hints.drums) {
      events.push(...this.generateDeterministicDrums(epoch, barDuration));
    }

    // 2. БАС (Детерминированный волкинг)
    if (hints.bass) {
      events.push(...this.generateDeterministicBass(currentChord, epoch, barDuration));
    }

    // 3. АККОМПАНЕМЕНТ (Синхронизация с Блюпринтом)
    if (hints.accompaniment) {
      const accompRules = navInfo.currentPart.instrumentRules.accompaniment;
      
      // Детерминированный выбор техники на основе ВЕСОВ из Блюпринта
      let selectedTechnique: string = 'long-chords';
      if (accompRules?.techniques && accompRules.techniques.length > 0) {
          selectedTechnique = pickWeightedDeterministic(accompRules.techniques, this.seed, epoch, 100);
      }

      if (selectedTechnique === 'arpeggio-slow') {
        events.push(...this.generateSoftArpeggio(currentChord, epoch, barDuration));
      } else {
        events.push(...this.generateSustainedComping(currentChord, epoch, barDuration));
      }
    }

    // 4. МЕЛОДИЯ (L-System + Markov + Tension Gating)
    if (hints.melody) {
      events.push(...this.generateFractalMelody(currentChord, epoch, barDuration));
    }

    return events;
  }

  // ───── ВНУТРЕННЯЯ ЛОГИКА (ДЕТЕРМИНИРОВАННАЯ) ─────

  private generateDeterministicDrums(epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const fWeight = calculateMusiNum(epoch, 2, this.seed, 10) / 10;
    
    // Кик на 1 и 3
    [0, 2].forEach(beat => {
      events.push({
        type: 'drum_kick',
        note: 36,
        time: beat * (barDuration / 4) + this.getPinkNoiseOffset(epoch, beat),
        duration: 0.3,
        weight: 0.8 + fWeight * 0.1,
        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
      });
    });

    // Снейр на 2 и 4 с фрактальным свингом
    [1, 3].forEach(beat => {
      // Свинг вычисляется фрактально из семени
      const swingOffset = calculateMusiNum(epoch + beat, 3, this.seed, 10) / 100;
      const swing = 0.66 + swingOffset; 
      events.push({
        type: 'drum_snare',
        note: 38,
        time: beat * (barDuration / 4) * swing,
        duration: 0.2,
        weight: 0.7 + fWeight * 0.1,
        technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
      });
    });

    return events;
  }

  private generateDeterministicBass(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote - 12;
    
    for (let i = 0; i < 4; i++) {
      // Каждая доля баса вычисляется фрактально
      const fIdx = calculateMusiNum(epoch * 4 + i, 3, this.seed, 4);
      let note = root;
      if (i === 1) note = root + (fIdx > 2 ? 2 : 1); // детерминированная проходящая
      if (i === 2) note = root + 7; // квинта
      if (i === 3) note = root + (fIdx > 1 ? 10 : 11); // септима или лид

      events.push({
        type: 'bass',
        note,
        time: i * (barDuration / 4) + this.getPinkNoiseOffset(epoch, i),
        duration: (barDuration / 4) * 0.95,
        weight: 0.8 - i * 0.05,
        technique: 'pluck', dynamics: i === 0 ? 'mf' : 'mp', phrasing: 'legato'
      });
    }
    return events;
  }

  private generateSustainedComping(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const root = chord.rootNote;
    const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

    notes.forEach((note, i) => {
      events.push({
        type: 'accompaniment',
        note: note + 12,
        time: i * 0.05, 
        duration: barDuration * 0.98,
        weight: 0.35 - i * 0.05,
        technique: 'swell',
        dynamics: 'p',
        phrasing: 'legato'
      });
    });
    return events;
  }

  private generateSoftArpeggio(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const root = chord.rootNote;
    const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
    
    notes.forEach((note, i) => {
      events.push({
        type: 'accompaniment',
        note: note + 12,
        time: i * (barDuration / 4),
        duration: (barDuration / 4) * 1.5,
        weight: 0.3,
        technique: 'pluck',
        dynamics: 'p',
        phrasing: 'detached'
      });
    });
    return events;
  }

  private generateFractalMelody(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 24;
    const barInCycle = epoch % 4;

    // 1. Axiom Generation (Детерминированно из seed)
    if (barInCycle === 0) {
      this.lastAxiom = [];
      for (let i = 0; i < 4; i++) {
        const step = calculateMusiNum(epoch + i, 5, this.seed, BLUES_SCALE.length);
        this.lastAxiom.push(BLUES_SCALE[step]);
      }
    }

    // 2. L-System Mutation
    let currentPhrase = [...this.lastAxiom];
    if (barInCycle === 1) {
      currentPhrase = currentPhrase.map(deg => (deg + 2) % 12);
    }

    // 3. Markov Filter & Render
    currentPhrase.forEach((deg, i) => {
      let finalDeg = deg;
      // Марковский фильтр связности: если прыжок слишком велик, MusiNum выбирает компромисс
      if (Math.abs(deg - this.lastNotes[1]) > 5) {
          const shift = calculateMusiNum(epoch + i, 2, this.seed, 3) - 1; // -1, 0, 1
          finalDeg = (deg + this.lastNotes[1]) / 2 + shift;
      }

      const note = root + finalDeg;
      const tension = calculateMusiNum(epoch, 11, this.seed, 10) / 10;
      
      // Tension Gating: 5-я октава открывается только при высоком напряжении
      let finalNote = note;
      if (note > 71 && tension < 0.7) finalNote -= 12;

      events.push({
        type: 'melody',
        note: finalNote,
        time: i * (barDuration / 4) + this.getPinkNoiseOffset(epoch, i),
        duration: (barDuration / 4) * 0.8,
        weight: 0.85,
        technique: finalDeg === 6 ? 'bend' : (i === 3 ? 'vibrato' : 'pick'),
        dynamics: 'p',
        phrasing: 'legato'
      });

      this.lastNotes.shift();
      this.lastNotes.push(finalDeg);
    });

    return events;
  }

  private getPinkNoiseOffset(epoch: number, index: number): number {
    let sum = 0;
    const step = epoch * 4 + index;
    for (let i = 0; i < 8; i++) {
      if (step & (1 << i)) {
        this.pinkNoiseState[i] = (calculateMusiNum(step, i + 3, this.seed, 100) / 100) - 0.5;
      }
      sum += this.pinkNoiseState[i];
    }
    return (sum / 8) * 0.04;
  }
}
