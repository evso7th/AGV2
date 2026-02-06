import type {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Dynamics,
  Phrasing,
  BluesRiffDegree,
  Mood,
  SuiteDNA,
  NavigationInfo
} from '@/types/fractal';
import { calculateMusiNum, DEGREE_TO_SEMITONE } from './music-theory';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V5.0 — Dramaturgy Aware (Plan 152).
 * #ЧТО: Плотность, регистр и состав ансамбля теперь зависят от глобальной Карты Напряжения сюиты.
 * #РЕЗОНАНС: Внедрен принцип "Ансамблевого вздоха" и "Скелетного сюжета".
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

    // --- DRAMATURGY ENGINE (Plan 152) ---
    const tension = dna.tensionMap[epoch % dna.tensionMap.length] || 0.5;
    const densityFactor = 0.4 + tension * 0.6; // Scale 0.4..1.0
    const registerOffset = tension > 0.75 ? 12 : 0; // Extra octave for climax
    
    console.log(`Plan152 - blues-brain/generateBar: Bar ${epoch} Tension: ${tension.toFixed(2)}. Scaling Density to ${densityFactor.toFixed(2)}. Register shift: ${registerOffset}`);

    // 1. УДАРНЫЕ (Энергия влияет на выбор инструментов внутри кита)
    if (hints.drums) {
      events.push(...this.generateDrums(epoch, dna.baseTempo, tension));
    }

    // 2. БАС (Фундамент: Низкое напряжение = педаль, Высокое = волкинг)
    if (hints.bass) {
      events.push(...this.generateBass(epoch, currentChord, dna.baseTempo, tension));
    }

    // 3. АККОМПАНЕМЕНТ (Специя с "Ансамблевым вздохом")
    // #ЗАЧЕМ: Устранение "стены звука". При низком напряжении инструмент берет паузу.
    const isPhraseStart = (epoch % 4 === 0);
    const narrativeBreath = tension < 0.25 && !isPhraseStart;
    
    if (hints.accompaniment && !narrativeBreath) {
      // Плотность перебора также зависит от напряжения
      const pickingLuck = calculateMusiNum(epoch % 48, 13, this.seed + 777, 100);
      const dynamicThreshold = 20 + tension * 40; // 20%..60% threshold
      
      if (isPhraseStart || (pickingLuck < dynamicThreshold)) {
        events.push(...this.generateAccompaniment(epoch, currentChord, dna.baseTempo, tension));
      }
    } else if (narrativeBreath) {
      console.log(`Plan152 - blues-brain/interaction: Energy below threshold (${tension.toFixed(2)}). Accompaniment is taking a narrative breath.`);
    }

    // 4. МЕЛОДИЯ (Основное блюдо: Энергия влияет на регистр и интенсивность)
    if (hints.melody) {
      const melodyEvents = this.generateMelody(epoch, currentChord, chorusIdx, barIn12, dna.baseTempo, tension, registerOffset);
      // Защита от похоронного марша
      const guardedEvents = this.applyAntiFuneralMarch(melodyEvents, epoch, tension);
      events.push(...guardedEvents);
    }

    return events;
  }

  private generateDrums(epoch: number, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    if (!kitPool || kitPool.length === 0) return [];

    const patternIdx = calculateMusiNum(epoch, 3, this.seed, kitPool.length);
    const p = kitPool[patternIdx];
    if (!p) return [];

    const events: FractalEvent[] = [];

    // При низком напряжении убираем тарелки
    if (tension > 0.2) {
        (p.HH || []).forEach(t => {
            events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.45 * tension, 'p'));
        });
    }
    
    (p.K || []).forEach(t => {
      events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.8, tension > 0.7 ? 'mf' : 'p'));
    });

    // Снейр вступает только при среднем напряжении
    if (tension > 0.4) {
        (p.SD || []).forEach(t => {
            events.push(this.createDrumEvent('drum_snare', t * tickDur, 0.7 * tension, 'mf'));
        });
    }

    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    if (!riffs || riffs.length === 0) return [];

    const riffIdx = calculateMusiNum(epoch, 5, this.seed + 100, riffs.length);
    const riff = riffs[riffIdx];

    const barIn12 = epoch % 12;
    let pattern = riff.I;
    
    // Принудительная ПЕДАЛЬ (длинные ноты) при низком напряжении
    if (tension < 0.3) {
        pattern = [{ t: 0, d: 12, deg: 'R' }];
    } else {
        if (barIn12 === 11) pattern = riff.turn;
        else if ([4, 5, 9].includes(barIn12)) pattern = riff.IV;
        else if ([8].includes(barIn12)) pattern = riff.V;
    }

    return pattern.map(n => ({
      type: 'bass' as const,
      note: chord.rootNote - 12 + this.degreeToSemitone(n.deg),
      time: n.t * tickDur,
      duration: (n.d || 2) * tickDur,
      weight: 0.6 + tension * 0.3,
      technique: 'pluck' as const,
      dynamics: tension > 0.6 ? 'mf' : 'p' as const,
      phrasing: 'legato' as const
    }));
  }

  private generateAccompaniment(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
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
            type: 'accompaniment' as const,
            note,
            time: t * tickDur,
            duration: beatDur * 2,
            weight: 0.1 * tension, // Громкость зависит от напряжения
            technique: 'pluck' as const,
            dynamics: 'p' as const,
            phrasing: 'detached' as const
          });
        });
      });
    });

    return events;
  }

  private generateMelody(epoch: number, chord: GhostChord, chorus: number, bar: number, tempo: number, tension: number, registerOffset: number): FractalEvent[] {
    // При сверх-низком напряжении Alvin Lee может вообще молчать (редко)
    if (tension < 0.15 && calculateMusiNum(epoch, 3, this.seed, 10) < 5) return [];

    const plan = BLUES_SOLO_PLANS[this.soloPlanId];
    if (!plan) return [];

    const lickId = plan.choruses[chorus][bar];
    const lickData = BLUES_SOLO_LICKS[lickId];
    if (!lickData) return [];

    const tickDur = (60 / tempo) / 3;
    
    return lickData.phrase.map(n => ({
      type: 'melody' as const,
      // #ЗАЧЕМ: Динамический регистр. При кульминации гитара лезет выше.
      note: chord.rootNote + 24 + registerOffset + this.degreeToSemitone(n.deg),
      time: n.t * tickDur,
      duration: n.d * tickDur,
      weight: 0.8 + tension * 0.2, // Увеличение экспрессии в пиках
      technique: (n.tech as any) || ('pick' as const),
      dynamics: tension > 0.7 ? 'mf' : 'p' as const,
      phrasing: 'legato' as const
    }));
  }

  private degreeToSemitone(deg: BluesRiffDegree): number {
    return DEGREE_TO_SEMITONE[deg] || 0;
  }

  private createDrumEvent(type: string, time: number, weight: number, dynamics: Dynamics): any {
    return { type, time, duration: 0.1, weight, technique: 'hit', dynamics, phrasing: 'staccato' };
  }

  private applyAntiFuneralMarch(events: FractalEvent[], epoch: number, tension: number): FractalEvent[] {
    if (epoch - this.lastAscendingBar >= 6 && tension > 0.6) {
      const melodyEvents = events.filter(e => e.type === 'melody');
      if (melodyEvents.length > 0) {
        const lastMelodyEvent = melodyEvents[melodyEvents.length - 1];
        
        const resolutionNote: FractalEvent = {
          type: 'melody',
          note: lastMelodyEvent.note! + 5,
          time: lastMelodyEvent.time + lastMelodyEvent.duration + 0.3,
          duration: 1.2,
          weight: 0.95,
          technique: 'vibrato' as const,
          dynamics: 'mf' as const,
          phrasing: 'sostenuto' as const,
          harmonicContext: 'i7'
        };
        
        events.push(resolutionNote);
        this.lastAscendingBar = epoch;
      }
    }
    
    return events;
  }
}
