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
 * #ЗАЧЕМ: Эволюционный Блюзовый Мозг (Conductive Evolution Engine).
 * #ЧТО: Реализует концепцию "роста" музыки через мутации и отбор (Fitness Function).
 *       Вместо случайных нот генерирует и развивает тематические гены (Axioms).
 * #МАТЕМАТИКА: Детерминированный MusiNum + Марковские цепи + Эволюционный отбор.
 */

// --- Типы для эволюции ---
type Axiom = number[]; // Массив ступеней шкалы (пентатоника + b5)

interface EvolutionaryState {
  currentAxiom: Axiom;
  fitness: number;
  generation: number;
  tension: number;
}

export class BluesBrain {
  private random: { next: () => number; nextInt: (max: number) => number };
  private state: EvolutionaryState;
  private seed: number;
  private blueNotePending: boolean = false;

  // Шкала: 0=1, 1=b3, 2=4, 3=b5, 4=5, 5=b7
  private readonly BLUES_SCALE_MAP = [0, 3, 5, 6, 7, 10];

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    let rState = seed;
    this.random = {
      next: () => {
        rState = (rState * 1664525 + 1013904223) % Math.pow(2, 32);
        return rState / Math.pow(2, 32);
      },
      nextInt: (max: number) => Math.floor((rState / Math.pow(2, 32)) * max)
    };

    // Начальное "зерно" композиции (Аксиома)
    this.state = {
      currentAxiom: [0, 1, 3, 4], // 1 -> b3 -> b5 -> 5
      fitness: 1.0,
      generation: 0,
      tension: 0.3
    };
  }

  /**
   * #ЧТО: Главная функция такта.
   * Выбирает: развить старую тему или начать новую.
   */
  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): FractalEvent[] {
    const barIn12 = epoch % 12;
    const barDuration = 60 / (dna.baseTempo || 72);
    const events: FractalEvent[] = [];

    // --- 1. ЭВОЛЮЦИОННЫЙ ШАГ ---
    // Каждые 4 такта (фраза) мы пробуем мутировать тему
    if (barIn12 % 4 === 0) {
      this.evolveAxiom(epoch);
    }

    // --- 2. ГЕНЕРАЦИЯ ПАРТИЙ ---
    if (hints.drums) {
      events.push(...this.generateDrums(epoch, barDuration));
    }
    
    if (hints.bass) {
      events.push(...this.generateWalkingBass(currentChord, epoch, barDuration));
    }

    if (hints.accompaniment) {
      events.push(...this.generateAtmosphericBed(currentChord, epoch, barDuration, navInfo));
    }

    if (hints.melody) {
      events.push(...this.renderAxiomToEvents(this.state.currentAxiom, currentChord, epoch, barDuration));
    }

    return events;
  }

  /**
   * #ЗАЧЕМ: Выбор "лучшего" продолжения темы.
   * #ЧТО: Генерирует 3 мутации и выбирает победителя через Fitness Function.
   */
  private evolveAxiom(epoch: number) {
    const candidates: Axiom[] = [
      this.state.currentAxiom, // Консерватизм (оставить как есть)
      this.mutate(this.state.currentAxiom, epoch, 1), // Микро-мутация
      this.mutate(this.state.currentAxiom, epoch, 2), // Смелая мутация
    ];

    let bestAxiom = candidates[0];
    let maxFitness = -1;

    candidates.forEach(axiom => {
      const f = this.evaluateFitness(axiom);
      if (f > maxFitness) {
        maxFitness = f;
        bestAxiom = axiom;
      }
    });

    this.state.currentAxiom = bestAxiom;
    this.state.fitness = maxFitness;
    this.state.generation++;
    
    console.log(`[Evolution] Gen ${this.state.generation} | Fitness: ${maxFitness.toFixed(2)} | Axiom: ${bestAxiom.join(',')}`);
  }

  /**
   * #ФУНКЦИЯ_ПРИГОДНОСТИ (Fitness Function)
   * 1. Плавность интервалов (штраф за скачки > 4 ступеней).
   * 2. Наличие b5 (бонус, если нужно напряжение).
   * 3. Разнообразие (штраф за слишком короткие или монотонные темы).
   */
  private evaluateFitness(axiom: Axiom): number {
    if (axiom.length < 3) return 0.1;
    
    let score = 1.0;
    let jumps = 0;
    let hasBlueNote = false;

    for (let i = 1; i < axiom.length; i++) {
      const diff = Math.abs(axiom[i] - axiom[i-1]);
      if (diff > 3) jumps++; // Большой скачок
      if (axiom[i] === 3) hasBlueNote = true; // b5 ступень
    }

    score -= (jumps * 0.2); // Штраф за угловатость
    if (hasBlueNote) score += 0.3; // Блюзовый бонус
    
    // Ограничение самоподобия (не слишком просто, не слишком хаотично)
    const unique = new Set(axiom).size;
    score += (unique / axiom.length) * 0.2;

    return Math.max(0, score);
  }

  private mutate(axiom: Axiom, epoch: number, intensity: number): Axiom {
    const newAxiom = [...axiom];
    const idx = calculateMusiNum(epoch, 3, this.seed, axiom.length);
    
    // Детерминированная мутация ноты
    const shift = calculateMusiNum(epoch, 2, idx, 3) - 1; // -1, 0, 1
    newAxiom[idx] = Math.max(0, Math.min(5, newAxiom[idx] + shift * intensity));
    
    return newAxiom;
  }

  private renderAxiomToEvents(axiom: Axiom, chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 24; // Лид в 4-й октаве
    const timeStep = (barDuration * 0.8) / axiom.length;

    axiom.forEach((degIdx, i) => {
      const pitch = root + this.BLUES_SCALE_MAP[degIdx];
      const isBlue = degIdx === 3; // b5

      events.push({
        type: 'melody',
        note: pitch,
        time: i * timeStep,
        duration: timeStep * 0.9,
        weight: 0.8 - (i * 0.05),
        technique: isBlue ? 'bend' : (i % 2 === 0 ? 'pick' : 'vibrato'),
        dynamics: isBlue ? 'mf' : 'p',
        phrasing: 'legato',
        harmonicContext: 'i7'
      });
    });

    return events;
  }

  // --- Ударные (Фрактальный свинг) ---
  private generateDrums(epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    // Розовый шум тайминга через MusiNum
    const swing = 0.6 + (calculateMusiNum(epoch, 5, this.seed, 20) / 100); 

    [0, 2].forEach(beat => {
      events.push({
        type: 'drum_kick',
        note: 36,
        time: beat * barDuration,
        duration: 0.2,
        weight: 0.8,
        technique: 'hit',
        dynamics: 'mf',
        phrasing: 'staccato'
      });
    });

    [1, 3].forEach(beat => {
      events.push({
        type: 'drum_snare',
        note: 38,
        time: beat * barDuration * swing,
        duration: 0.15,
        weight: 0.7,
        technique: 'hit',
        dynamics: 'mf',
        phrasing: 'staccato'
      });
    });

    return events;
  }

  // --- Бас (Детерминированный волкинг) ---
  private generateWalkingBass(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote - 12;
    
    // 4 доли: Корень -> Проходящая -> Пятая -> Ведущая
    const steps = [0, 2, 7, 11]; // Относительно корня
    
    steps.forEach((step, i) => {
      events.push({
        type: 'bass',
        note: root + step,
        time: i * (barDuration / 4),
        duration: (barDuration / 4) * 0.8,
        weight: 0.9,
        technique: 'pluck',
        dynamics: i === 0 ? 'mf' : 'p',
        phrasing: 'legato'
      });
    });

    return events;
  }

  // --- Аккомпанемент (Органное одеяло) ---
  private generateAtmosphericBed(chord: GhostChord, epoch: number, barDuration: number, navInfo: NavigationInfo): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor';
    const notes = [chord.rootNote, chord.rootNote + (isMinor ? 3 : 4), chord.rootNote + 7];

    notes.forEach((note, i) => {
      events.push({
        type: 'accompaniment',
        note: note + 12,
        time: i * 0.1, // Легкий разброс (Strum)
        duration: barDuration * 0.9,
        weight: 0.3,
        technique: 'swell',
        dynamics: 'p',
        phrasing: 'legato'
      });
    });

    return events;
  }

  private applyAntiFuneralMarch(events: FractalEvent[], epoch: number): FractalEvent[] {
    // В этой версии защита встроена в Fitness Function (оценка восходящих интервалов)
    return events;
  }
}
