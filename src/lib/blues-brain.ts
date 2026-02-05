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
import { calculateMusiNum } from './music-theory';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V4.0 — "The Fractal Soul".
 * #ЧТО: Полностью детерминированный движок без Math.random.
 *       1. MusiNum Core: выбор нот через фрактальное развертывание числа.
 *       2. Markov 2nd Order: синтаксический фильтр связности мелодии.
 *       3. L-System Phrasing: структурное развитие тем (A -> A' -> B).
 *       4. Voss-McCartney 1/f Noise: фрактальное дыхание тайминга.
 *       5. Atmospheric Accompaniment: манеры "Sustained Bed" и "Soft Arpeggio".
 * #СВЯЗИ: Управляется BlueprintNavigator, исполняется V2 Samplers.
 */

// ============================================================================
// МАТЕМАТИЧЕСКИЕ КОНСТАНТЫ
// ============================================================================

const BLUES_SCALE = [0, 3, 5, 6, 7, 10]; // 1, b3, 4, b5, 5, b7
const MARKOV_PROBABILITIES: Record<string, Record<number, number>> = {
  'default': { 0: 0.2, 3: 0.3, 5: 0.2, 6: 0.1, 7: 0.2 },
  'after_jump': { 0: 0.4, 3: 0.4, 7: 0.2 } // тяготение к тонике после напряжения
};

// ============================================================================
// КЛАСС BLUES BRAIN
// ============================================================================

export class BluesBrain {
  private seed: number;
  private lastNotes: number[] = [0, 0]; // Память для Маркова 2-го порядка
  private pinkNoiseState: number[] = new Array(8).fill(0); // Аккумулятор для 1/f шума
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
    const barDuration = 60 / (navInfo.currentPart.musical?.bpm?.base || 72);
    
    // 1. УДАРНЫЕ (Фрактальный свинг)
    if (hints.drums) {
      events.push(...this.generateDeterministicDrums(epoch, barDuration));
    }

    // 2. БАС (Детерминированный волкинг)
    if (hints.bass) {
      events.push(...this.generateDeterministicBass(currentChord, epoch, barDuration));
    }

    // 3. АККОМПАНЕМЕНТ (Выбор манеры из блюпринта)
    if (hints.accompaniment) {
      const accompRules = navInfo.currentPart.instrumentRules.accompaniment;
      const mannerNum = calculateMusiNum(epoch, 3, this.seed, 100) / 100;
      
      // Ищем технику по весам
      let cumulative = 0;
      let selectedTechnique = 'long-chords';
      if (accompRules?.techniques) {
        for (const t of accompRules.techniques) {
          cumulative += t.weight;
          if (mannerNum <= cumulative) {
            selectedTechnique = t.value;
            break;
          }
        }
      }

      if (selectedTechnique === 'arpeggio-slow') {
        events.push(...this.generateSoftArpeggio(currentChord, epoch, barDuration));
      } else {
        events.push(...this.generateSustainedComping(currentChord, epoch, barDuration));
      }
    }

    // 4. МЕЛОДИЯ (L-System + Markov)
    if (hints.melody) {
      events.push(...this.generateFractalMelody(currentChord, epoch, barDuration));
    }

    return events;
  }

  // ───── ВНУТРЕННЯЯ ЛОГИКА ГЕНЕРАЦИИ ─────

  private generateDeterministicDrums(epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const fWeight = calculateMusiNum(epoch, 2, this.seed, 10) / 10;
    
    // Кик на 1 и 3 всегда (база)
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
      const swing = 0.66 + (calculateMusiNum(epoch + beat, 3, this.seed, 5) / 50); 
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
    const barIn12 = epoch % 12;
    
    // Правила волкинг-баса через MusiNum
    for (let i = 0; i < 4; i++) {
      const fIdx = calculateMusiNum(epoch * 4 + i, 3, this.seed, 4);
      let note = root;
      if (i === 1) note = root + (fIdx > 2 ? 2 : 1); // проходящая
      if (i === 2) note = root + 7; // квинта
      if (i === 3) note = root + (fIdx > 1 ? 10 : 11); // септима или ведущая

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

    // Один очень длинный аккорд на весь такт (Sustained Bed)
    notes.forEach((note, i) => {
      events.push({
        type: 'accompaniment',
        note: note + 12,
        time: i * 0.05, // крохотное "рассыпание" для естественности
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
    
    // Редкое, "стекающее" арпеджио (4 ноты за такт)
    notes.forEach((note, i) => {
      events.push({
        type: 'accompaniment',
        note: note + 12,
        time: i * (barDuration / 4),
        duration: (barDuration / 4) * 1.5, // перекрытие нот
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
    const barInCycle = epoch % 4; // 0,1=Call, 2=Response, 3=Fill/Turn

    // 1. Axiom Generation (Такт 0)
    if (barInCycle === 0) {
      this.lastAxiom = [];
      for (let i = 0; i < 4; i++) {
        const step = calculateMusiNum(epoch + i, 2, this.seed, BLUES_SCALE.length);
        this.lastAxiom.push(BLUES_SCALE[step]);
      }
    }

    // 2. L-System Mutation (A -> A')
    let currentPhrase = [...this.lastAxiom];
    if (barInCycle === 1) {
      currentPhrase = currentPhrase.map(deg => (deg + 2) % 12); // "Генетическая" мутация
    }

    // 3. Markov Syntax Filter & Render
    currentPhrase.forEach((deg, i) => {
      // Проверяем связность через Маркова (упрощенно: если прыжок > 5, сдвигаем)
      let finalDeg = deg;
      if (Math.abs(deg - this.lastNotes[1]) > 5) {
        finalDeg = (deg + this.lastNotes[1]) / 2;
      }

      const note = root + finalDeg;
      const isBlue = finalDeg === 6; // b5

      events.push({
        type: 'melody',
        note,
        time: i * (barDuration / 4) + this.getPinkNoiseOffset(epoch, i),
        duration: (barDuration / 4) * 0.8,
        weight: 0.85,
        technique: isBlue ? 'bend' : (i === 3 ? 'vibrato' : 'pick'),
        dynamics: 'p',
        phrasing: 'legato'
      });

      // Обновляем память
      this.lastNotes.shift();
      this.lastNotes.push(finalDeg);
    });

    return events;
  }

  // ───── ФРАКТАЛЬНЫЕ УТИЛИТЫ ─────

  private getPinkNoiseOffset(epoch: number, index: number): number {
    // Алгоритм Восса-Маккартни для генерации 1/f шума
    let sum = 0;
    const step = epoch * 4 + index;
    for (let i = 0; i < 8; i++) {
      if (step & (1 << i)) {
        this.pinkNoiseState[i] = (calculateMusiNum(step, i + 2, this.seed, 100) / 100) - 0.5;
      }
      sum += this.pinkNoiseState[i];
    }
    return (sum / 8) * 0.04; // ±20мс смещение
  }

  private getMidiNoteName(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${notes[midi % 12]}${Math.floor(midi / 12) - 1}`;
  }
}
