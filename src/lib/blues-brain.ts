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
 * #ЗАЧЕМ: Блюзовый Мозг V4.2 — Narrative Soloist (Strict Edition).
 * #ЧТО: Бескомпромиссная иерархия партий.
 *       1. Solo (Melody): 100% приоритет, вес 0.95.
 *       2. Accompaniment (Picking): Вероятность снижена до 20%, разрешено только в паузах соло.
 *       3. Интеграция: Детерминированность через MusiNum сохранена.
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
    console.log(`%c[BluesBrain] Narrative Solo Plan: ${this.soloPlanId}`, 'color: #00FF00; font-weight: bold;');
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
    
    const barIn12 = epoch % 12;
    const chorusIdx = Math.floor(epoch / 12) % 3;

    // 1. УДАРНЫЕ
    if (hints.drums) {
      events.push(...this.generateDrums(epoch, dna.baseTempo));
    }

    // 2. БАС
    if (hints.bass) {
      events.push(...this.generateBass(epoch, currentChord, dna.baseTempo));
    }

    // 3. АККОМПАНЕМЕНТ (СПЕЦИЯ)
    // #ЗАЧЕМ: Перебор не должен мешать соло.
    // #ЧТО: Снижение вероятности до 20% (val < 2 при modulo 10) + детерминированный "прыжок" через seed.
    const pickingTrigger = calculateMusiNum(epoch, 3, this.seed + 999, 10);
    const isPickingAllowed = pickingTrigger < 2;

    if (hints.accompaniment && isPickingAllowed) {
      events.push(...this.generateAccompaniment(epoch, currentChord, dna.baseTempo));
    }

    // 4. МЕЛОДИЯ (ОСНОВНОЕ БЛЮДО)
    if (hints.melody) {
      events.push(...this.generateMelody(epoch, currentChord, chorusIdx, barIn12, dna.baseTempo));
    }

    return events;
  }

  private generateDrums(epoch: number, tempo: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    const kit = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const patternIdx = calculateMusiNum(epoch, 3, this.seed, kit.length);
    const p = kit[patternIdx];

    const events: FractalEvent[] = [];

    (p.HH || []).forEach(t => {
      events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.45, 'p'));
    });
    (p.K || []).forEach(t => {
      events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.8, 'mf'));
    });
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
    // #ЗАЧЕМ: Создание редкого, но красивого гитарного фона.
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    const pattern = GUITAR_PATTERNS['F_ROLL12'];
    const voicing = BLUES_GUITAR_VOICINGS['E7_open'];

    const events: FractalEvent[] = [];
    pattern.pattern.forEach(step => {
      step.ticks.forEach(t => {
        step.stringIndices.forEach(idx => {
          const note = chord.rootNote + (voicing[idx] - 40);
          events.push({
            type: 'accompaniment',
            note,
            time: t * tickDur,
            duration: beatDur * 2,
            weight: 0.15, // #ИСПРАВЛЕНО: Еще тише, чтобы не мешать соло.
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
      note: chord.rootNote + 36 + this.degreeToSemitone(n.deg), // #ИСПРАВЛЕНО: Сохраняем высокий регистр.
      time: n.t * tickDur,
      duration: n.d * tickDur,
      weight: 0.95, // СОЛО — ОСНОВНОЕ БЛЮДО
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
