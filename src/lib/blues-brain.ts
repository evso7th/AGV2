import type {
  FractalEvent,
  Mood,
  GhostChord,
  SuiteDNA,
  NavigationInfo,
  InstrumentHints,
  Technique,
  Dynamics,
  Phrasing,
  BluesRiffDegree
} from '@/types/music';
import { calculateMusiNum, pickWeightedDeterministic, DEGREE_TO_SEMITONE } from './music-theory';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V4.0 — Structural Narrative Engine.
 * #ЧТО: Полный отказ от микро-генерации нот. Теперь музыка строится
 *       на уровне Фраз (Licks) и Планов (Solo Plans).
 *       1. Ритм: Истинный 12/8 Shuffle из оцифрованной библиотеки.
 *       2. Бас: Живые волкинг-линии из архива.
 *       3. Мелодия: Выполнение "Solo Plan" на 36 тактов.
 * #СВЯЗИ: Является единственным источником музыкальных решений в жанре 'blues'.
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private soloPlanId: string;

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    
    // Детерминированный выбор плана соло на всю сюиту
    const planIds = Object.keys(BLUES_SOLO_PLANS);
    const planIdx = calculateMusiNum(seed, 7, seed, planIds.length);
    this.soloPlanId = planIds[planIdx];
    console.log(`%c[BluesBrain] Selected Solo Plan: ${this.soloPlanId}`, 'color: #00FF00; font-weight: bold;');
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    const barDuration = 60 / (dna.baseTempo || 72);
    const beatDuration = barDuration / 4;
    
    // Определение позиции в 12-тактовом цикле
    const barIn12 = epoch % 12;
    const chorusIdx = Math.floor(epoch / 12) % 3; // Планы обычно на 3 хора

    // 1. УДАРНЫЕ — Блюзовый кач
    if (hints.drums) {
      events.push(...this.generateDrums(epoch, dna.baseTempo));
    }

    // 2. БАС — Профессиональные линии
    if (hints.bass) {
      events.push(...this.generateBass(epoch, currentChord, dna.baseTempo));
    }

    // 3. АККОМПАНЕМЕНТ — Трэвис-пикинг и страм
    if (hints.accompaniment) {
      events.push(...this.generateAccompaniment(epoch, currentChord, dna.baseTempo));
    }

    // 4. МЕЛОДИЯ — Исполнение плана соло
    if (hints.melody) {
      events.push(...this.generateMelody(epoch, currentChord, chorusIdx, barIn12, dna.baseTempo));
    }

    return events;
  }

  private generateDrums(epoch: number, tempo: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tpb = 12;
    const tickDur = beatDur / 3;
    
    // Выбор паттерна из библиотеки по настроению
    const kit = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const patternIdx = calculateMusiNum(epoch, 3, this.seed, kit.length);
    const p = kit[patternIdx];

    const events: FractalEvent[] = [];

    // Хэты (Shuffle)
    (p.HH || []).forEach(t => {
      events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.45, 'p'));
    });

    // Кик
    (p.K || []).forEach(t => {
      events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.8, 'mf'));
    });

    // Снейр
    (p.SD || []).forEach(t => {
      events.push(this.createDrumEvent('drum_snare', t * tickDur, 0.7, 'mf'));
    });

    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    const riffIdx = calculateMusiNum(epoch, 5, this.seed + 100, riffs.length);
    const riff = riffs[riffIdx];

    const barIn12 = epoch % 12;
    let pattern = riff.I;
    if (barIn12 === 11) pattern = riff.turn;
    else if ([4, 5, 9].includes(barIn12)) pattern = riff.IV;
    else if ([8, 11].includes(barIn12)) pattern = riff.V;

    return pattern.map(n => ({
      type: 'bass',
      note: chord.rootNote - 12 + this.degreeToSemitone(n.deg),
      time: n.t * tickDur,
      duration: (n.d || 2) * tickDur,
      weight: 0.8,
      technique: 'pluck',
      dynamics: 'mp',
      phrasing: 'legato'
    }));
  }

  private generateAccompaniment(epoch: number, chord: GhostChord, tempo: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    // Перебор на основе гитарного паттерна
    const pattern = GUITAR_PATTERNS['F_ROLL12'];
    const voicing = BLUES_GUITAR_VOICINGS['E7_open']; // Упрощенно для фона

    const events: FractalEvent[] = [];
    pattern.pattern.forEach(step => {
      step.ticks.forEach(t => {
        step.stringIndices.forEach(idx => {
          const note = chord.rootNote + (voicing[idx] - 40); // Транспозиция формы
          events.push({
            type: 'accompaniment',
            note,
            time: t * tickDur,
            duration: beatDur * 2,
            weight: 0.25,
            technique: 'pluck',
            dynamics: 'p',
            phrasing: 'detached'
          });
        });
      });
    });

    return events;
  }

  private generateMelody(epoch: number, chord: GhostChord, chorus: number, bar: number, tempo: number): FractalEvent[] {
    const plan = BLUES_SOLO_PLANS[this.soloPlanId];
    if (!plan) return [];

    const lickId = plan.choruses[chorus][bar];
    const lickData = BLUES_SOLO_LICKS[lickId];
    if (!lickData) return [];

    const tickDur = (60 / tempo) / 3;
    
    return lickData.phrase.map(n => ({
      type: 'melody',
      note: chord.rootNote + 12 + this.degreeToSemitone(n.deg),
      time: n.t * tickDur,
      duration: n.d * tickDur,
      weight: 0.85,
      technique: (n.tech as any) || 'pick',
      dynamics: 'mf',
      phrasing: 'legato'
    }));
  }

  private degreeToSemitone(deg: BluesRiffDegree): number {
    return DEGREE_TO_SEMITONE[deg] || 0;
  }

  private createDrumEvent(type: string, time: number, weight: number, dynamics: Dynamics): any {
    return { type, time, duration: 0.1, weight, technique: 'hit', dynamics, phrasing: 'staccato' };
  }
}