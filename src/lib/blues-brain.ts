import type {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Dynamics,
  Phrasing,
  BluesRiffDegree,
  Mood,
  SuiteDNA,
  NavigationInfo,
  InstrumentPart
} from '@/types/fractal';
import { calculateMusiNum, DEGREE_TO_SEMITONE } from './music-theory';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V6.2 — Narrative Vitality & Bass Floor.
 * #ЧТО: 
 *   1. Бюджет поднят до 60 (соло теперь играет в интро).
 *   2. Исключены OUTRO планы из основного повествования.
 *   3. Защита баса от инфразвука (порог MIDI 24).
 * #ИСПРАВЛЕНО (ПЛАН 156): Устранены "мертвые зоны" тишины в начале сюиты.
 */

// Стоимость инструментов в очках энергии (Plan 154)
const ENERGY_PRICES = {
    solo: 50,
    bass_walking: 30,
    bass_pedal: 10,
    picking: 20,
    harmony: 10,
    drums_full: 30,
    drums_minimal: 15
};

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private soloPlanId: string;

  // Защита от артефактов
  private lastAscendingBar: number = -10;

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    
    // #ИСПРАВЛЕНО (ПЛАН 156): Исключаем технические планы (Outro) из основного пула.
    const planIds = Object.keys(BLUES_SOLO_PLANS).filter(id => !id.includes('OUTRO'));
    const planIdx = calculateMusiNum(seed, 7, seed, planIds.length);
    this.soloPlanId = planIds[planIdx];
    console.log(`%c[BluesBrain] Narrative Solo Plan: ${this.soloPlanId}`, 'color: #00FF00; font-weight: bold;');
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints,
    lastEvents: FractalEvent[]
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    const tempo = dna.baseTempo || 72;
    const barIn12 = epoch % 12;

    // --- DRAMATURGY ENGINE ---
    const tension = dna.tensionMap ? (dna.tensionMap[epoch % dna.tensionMap.length] || 0.5) : 0.5;
    
    // --- Plan 154: Resonance Analysis (Слушание соседа) ---
    const isTom = (t: any) => typeof t === 'string' && t.startsWith('drum_tom');
    const isHeavySnare = (e: FractalEvent) => (e.type === 'drum_snare' || (Array.isArray(e.type) && e.type.includes('drum_snare'))) && e.weight > 0.8;
    
    const lastDrumFill = lastEvents.some(e => {
        if (Array.isArray(e.type)) return e.type.some(t => isTom(t));
        return isTom(e.type) || isHeavySnare(e);
    });
    
    const lastGuitarScream = lastEvents.some(e => 
        e.type === 'melody' && e.note > 72 && (e.technique as string).includes('vb')
    );
    
    if (lastDrumFill) console.log(`Plan154 - blues-brain/resonance: Reacting to Drum Fill. Priming Solo for accent.`);
    if (lastGuitarScream) console.log(`Plan154 - blues-brain/resonance: Reacting to Guitar Scream. Forcing Bass Walking.`);

    // --- Plan 156: Energy Budget (Реформа базового уровня) ---
    // Базовый бюджет теперь 60, чтобы соло (50) могло играть даже при минимальном напряжении.
    const barBudget = 60 + (tension * 40);
    let consumedEnergy = 0;

    // ПРИОРИТЕТ 1: БАС (Фундамент)
    if (hints.bass) {
      const forceWalking = lastGuitarScream || tension > 0.7;
      const cost = forceWalking ? ENERGY_PRICES.bass_walking : ENERGY_PRICES.bass_pedal;
      
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateBass(epoch, currentChord, tempo, tension, forceWalking));
        consumedEnergy += cost;
      }
    }

    // ПРИОРИТЕТ 2: УДАРНЫЕ
    if (hints.drums) {
      const cost = tension > 0.5 ? ENERGY_PRICES.drums_full : ENERGY_PRICES.drums_minimal;
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateDrums(epoch, tempo, tension));
        consumedEnergy += cost;
      }
    }

    // ПРИОРИТЕТ 3: МЕЛОДИЯ (Соло)
    if (hints.melody) {
      const cost = ENERGY_PRICES.solo;
      if (consumedEnergy + cost <= barBudget) {
        const registerOffset = tension > 0.75 ? 12 : 0;
        const melodyEvents = this.generateMelody(epoch, currentChord, barIn12, tempo, tension, registerOffset, lastDrumFill);
        const guardedEvents = this.applyAntiFuneralMarch(melodyEvents, epoch, tension);
        events.push(...guardedEvents);
        consumedEnergy += cost;
      }
    }

    // ПРИОРИТЕТ 4: АККОМПАНЕМЕНТ (Специя)
    if (hints.accompaniment) {
      const cost = ENERGY_PRICES.picking;
      const isPhraseStart = (epoch % 4 === 0);
      const canPick = isPhraseStart && (calculateMusiNum(epoch % 48, 13, this.seed, 100) < 30);
      
      if (canPick && (consumedEnergy + cost <= barBudget)) {
        events.push(...this.generateAccompaniment(epoch, currentChord, tempo, tension));
        consumedEnergy += cost;
      }
    }

    console.log(`Plan156 - blues-brain/generateBar: Bar ${epoch} Tension: ${tension.toFixed(2)}. Budget Used: ${consumedEnergy}/${barBudget.toFixed(0)}`);

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

    if (tension > 0.2 && p.HH) {
        p.HH.forEach(t => {
            events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.45 * tension, 'p'));
        });
    }
    
    if (p.K) {
        p.K.forEach(t => {
          events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.8, tension > 0.7 ? 'mf' : 'p'));
        });
    }

    if (tension > 0.4 && p.SD) {
        p.SD.forEach(t => {
            events.push(this.createDrumEvent('drum_snare', t * tickDur, 0.7 * tension, 'mf'));
        });
    }

    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number, tension: number, forceWalking: boolean = false): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    if (!riffs || riffs.length === 0) return [];

    const riffIdx = calculateMusiNum(epoch, 5, this.seed + 100, riffs.length);
    const riff = riffs[riffIdx];

    const barIn12 = epoch % 12;
    let pattern = riff.I;
    
    if (tension < 0.3 && !forceWalking) {
        pattern = [{ t: 0, d: 12, deg: 'R' }];
    } else {
        if (barIn12 === 11) pattern = riff.turn;
        else if ([4, 5, 9].includes(barIn12)) pattern = riff.IV;
        else if ([8].includes(barIn12)) pattern = riff.V;
    }

    return pattern.map(n => {
      // #ИСПРАВЛЕНО (ПЛАН 156): Защита от инфразвука. Поднимаем ноту, если она ниже MIDI 24.
      let note = chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0);
      if (note < 24) {
          console.log(`Plan156 - blues-brain/generateBass: Sub-bass protection triggered for note ${note}. Lifting.`);
          note += 12;
      }
      
      return {
        type: 'bass' as const,
        note,
        time: n.t * tickDur,
        duration: (n.d || 2) * tickDur,
        weight: 0.6 + tension * 0.3,
        technique: 'pluck' as const,
        dynamics: (forceWalking || tension > 0.6) ? 'mf' : 'p' as const,
        phrasing: 'legato' as const
      };
    });
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
            weight: 0.1 * tension,
            technique: 'pluck' as const,
            dynamics: 'p' as const,
            phrasing: 'detached' as const
          });
        });
      });
    });

    return events;
  }

  private generateMelody(
    epoch: number, 
    chord: GhostChord, 
    barIn12: number, 
    tempo: number, 
    tension: number, 
    registerOffset: number,
    shouldAccent: boolean = false
  ): FractalEvent[] {
    if (tension < 0.15 && calculateMusiNum(epoch, 3, this.seed, 10) < 5) return [];

    const plan = BLUES_SOLO_PLANS[this.soloPlanId];
    if (!plan || !plan.choruses) return [];

    const chorusIdx = Math.floor(epoch / 12) % plan.choruses.length;
    const chorus = plan.choruses[chorusIdx];
    if (!chorus) return [];

    const lickId = chorus[barIn12];
    const lickData = BLUES_SOLO_LICKS[lickId];
    if (!lickData) return [];

    const tickDur = (60 / tempo) / 3;
    
    return lickData.phrase.map((n, idx) => ({
      type: 'melody' as const,
      note: chord.rootNote + 36 + registerOffset + (DEGREE_TO_SEMITONE[n.deg] || 0),
      time: n.t * tickDur,
      duration: n.d * tickDur,
      weight: 0.8 + tension * 0.2, 
      technique: (n.tech as any) || ('pick' as const),
      dynamics: (idx === 0 && shouldAccent) ? 'mf' : (tension > 0.7 ? 'mf' : 'p' as const),
      phrasing: 'legato' as const
    }));
  }

  private createDrumEvent(type: any, time: number, weight: number, dynamics: Dynamics): any {
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
