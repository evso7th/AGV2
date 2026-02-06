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
 * #ЗАЧЕМ: Эволюционный Блюзовый Мозг V2 (Dramatic Phrase Engine).
 * #ЧТО: Реализует структуру Call-Response (Зов-Ответ) вместо монотонных тактов.
 *       Аккомпанемент превращен из переборов в "дышащие" пласты (swells).
 *       Внедрена "Стратегическая Пауза" для имитации человеческого дыхания.
 */

type PhraseRole = 'call' | 'response' | 'turnaround';

interface MotifGen {
  intervals: number[];
  rhythm: number[];
}

export class BluesBrain {
  private random: { next: () => number; nextInt: (max: number) => number };
  private seed: number;
  private currentMotif: MotifGen;
  private lastPhraseRole: PhraseRole = 'call';

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

    // Стартовый ген мелодии
    this.currentMotif = {
      intervals: [4, 2, 1, 0], // 5 -> 4 -> b3 -> 1 (нисходящий вопрос)
      rhythm: [0, 0.5, 1.0, 1.5]
    };
  }

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

    // --- 1. ОПРЕДЕЛЕНИЕ РОЛИ ТАКТА (Драматургия) ---
    let role: PhraseRole = 'call';
    if (barIn12 >= 8 && barIn12 <= 9) role = 'response';
    else if (barIn12 >= 10) role = 'turnaround';

    // Эволюция мотива при смене фазы
    if (role !== this.lastPhraseRole) {
      this.evolveMotif(role, epoch);
      this.lastPhraseRole = role;
    }

    // --- 2. ГЕНЕРАЦИЯ СОБЫТИЙ ---
    
    // УДАРНЫЕ (Свинг)
    if (hints.drums) {
      events.push(...this.generateBluesDrums(epoch, barDuration));
    }
    
    // БАС (Волкинг)
    if (hints.bass) {
      events.push(...this.generateTrueWalkingBass(currentChord, epoch, barDuration));
    }

    // АККОМПАНЕМЕНТ (Hammond Bed - БЕЗ ПЕРЕБОРОВ)
    if (hints.accompaniment) {
      events.push(...this.generateSustainedBed(currentChord, epoch, barDuration));
    }

    // МЕЛОДИЯ (Фразировка Alvin Lee)
    if (hints.melody) {
      // Имитируем паузы: гитарист не играет в каждом такте
      const shouldPlay = calculateMusiNum(epoch, 3, this.seed, 10) > 2; 
      if (shouldPlay) {
        events.push(...this.renderMotif(this.currentMotif, currentChord, epoch, barDuration, role));
      }
    }

    return events;
  }

  /**
   * #ЧТО: Превращает аккомпанемент в широкие "дышащие" пласты.
   * Убирает раздражающие нисходящие переборы.
   */
  private generateSustainedBed(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
    const root = chord.rootNote;
    
    // Играем полный аккорд ОДНИМ событием (или очень плотным кластером)
    const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

    notes.forEach((note, i) => {
      events.push({
        type: 'accompaniment',
        note: note + 12, 
        time: 0, // Все ноты одновременно - НИКАКИХ ПЕРЕБОРОВ
        duration: barDuration * 0.95,
        weight: 0.25,
        technique: 'swell', // Мягкая атака
        dynamics: 'p',
        phrasing: 'legato',
        params: { barCount: epoch }
      });
    });

    return events;
  }

  private evolveMotif(role: PhraseRole, epoch: number) {
    const newIntervals = [...this.currentMotif.intervals];
    
    if (role === 'call') {
      // Нисходящий вопрос (High -> Low)
      this.currentMotif.intervals = [5, 4, 2, 1, 0].sort(() => 0.5 - this.random.next()).slice(0, 4);
    } else if (role === 'response') {
      // Восходящий ответ (Low -> High)
      this.currentMotif.intervals = [0, 1, 2, 4, 5].sort(() => 0.5 - this.random.next()).slice(0, 3);
    } else {
      // Турнараунд (Хроматика)
      this.currentMotif.intervals = [4, 3, 2, 1, 0];
    }
  }

  private renderMotif(motif: MotifGen, chord: GhostChord, epoch: number, barDuration: number, role: PhraseRole): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 24;
    const timeStep = (barDuration * 0.7) / motif.intervals.length;

    motif.intervals.forEach((degIdx, i) => {
      const pitch = root + this.BLUES_SCALE_MAP[degIdx];
      const isLast = i === motif.intervals.length - 1;

      events.push({
        type: 'melody',
        note: pitch,
        time: i * timeStep,
        duration: isLast ? timeStep * 2 : timeStep * 0.8,
        weight: 0.85,
        technique: isLast && role === 'call' ? 'bend' : (isLast ? 'vibrato' : 'pick'),
        dynamics: isLast ? 'mf' : 'p',
        phrasing: 'legato'
      });
    });

    return events;
  }

  private generateBluesDrums(epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const swing = 0.66; // Фиксированный триольный свинг

    [0, 2].forEach(beat => {
      events.push({
        type: 'drum_kick', note: 36, time: beat * (barDuration / 4), 
        duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
      });
    });

    [1, 3].forEach(beat => {
      events.push({
        type: 'drum_snare', note: 38, time: beat * (barDuration / 4) * (1 + (1-swing)), 
        duration: 0.1, weight: 0.7, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
      });
    });

    return events;
  }

  private generateTrueWalkingBass(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote - 12;
    const steps = [0, 3, 5, 6]; // 1 -> b3 -> 4 -> b5

    steps.forEach((step, i) => {
      events.push({
        type: 'bass',
        note: root + step,
        time: i * (barDuration / 4),
        duration: (barDuration / 4) * 0.9,
        weight: 0.8,
        technique: 'pluck',
        dynamics: 'mp',
        phrasing: 'legato'
      });
    });

    return events;
  }

  private applyAntiFuneralMarch(events: FractalEvent[], epoch: number): FractalEvent[] {
    return events;
  }
}
