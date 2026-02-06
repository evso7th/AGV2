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
} from '@/types/music';
import { calculateMusiNum, DEGREE_TO_SEMITONE, pickWeightedDeterministic } from './music-theory';
import { BLUES_SOLO_LICKS, BLUES_SOLO_PLANS } from './assets/blues_guitar_solo';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V7.0 — Semantic Assembly Engine.
 * #ЧТО: 
 *   1. Динамическая сборка соло: лики выбираются по смыслу такта (Call, Response, Climax).
 *   2. Тематический якорь: у каждой сюиты есть "любимая ступень", создающая единство темы.
 *   3. Напряженный синтаксис: сложность фраз напрямую следует за Tension Map.
 *   4. Иерархический бюджет: управление энергией ансамбля сохранено.
 * #ИНТЕГРАЦИЯ: Гитара Alvin Lee (ShineOn) теперь говорит на языке напряжений.
 */

const ENERGY_PRICES = {
    solo: 50,
    bass_walking: 20,
    bass_pedal: 5,
    drums_full: 25,
    drums_minimal: 10,
    harmony: 15,      // Гитара или синт аккордами
    piano: 20,        // Фортепиано
    sfx: 10,          // Шумовые эффекты
    sparkles: 5       // Колокольчики/вспышки
};

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private thematicDegree: string;
  private lastAscendingBar: number = -10;

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    
    // Выбираем тематический якорь для сюиты (R, b3, 5 или b7)
    const anchorDegrees = ['R', 'b3', '5', 'b7'];
    this.thematicDegree = anchorDegrees[calculateMusiNum(seed, 3, seed, anchorDegrees.length)];

    console.log(`%c[BluesBrain] SOP Level 3: Semantic Engine Online.`, 'color: #00FF00; font-weight: bold;');
    console.log(`Plan160 - blues-brain/dna: Thematic anchor set to degree ${this.thematicDegree}.`);
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
    const tension = dna.tensionMap ? (dna.tensionMap[epoch % dna.tensionMap.length] || 0.5) : 0.5;
    
    // --- ПРИНЦИП РЕЗОНАНСА (Слушание соседа) ---
    const isHighScream = lastEvents.some(e => e.type === 'melody' && e.note > 72 && e.duration > 1.0);
    const lastDrumFill = lastEvents.some(e => (e.type as string).includes('tom'));

    // Бюджет такта (Base 100 + Tension influence)
    const barBudget = 100 + (tension * 80);
    let consumedEnergy = 0;

    // --- ОЧЕРЕДЬ ПРИОРИТЕТОВ ---

    // 1. SOLO (MELODY) - ТЕПЕРЬ ДИНАМИЧЕСКИЙ СИНТАКСИС
    if (hints.melody) {
      const cost = ENERGY_PRICES.solo;
      if (consumedEnergy + cost <= barBudget) {
        const registerOffset = tension > 0.7 ? 12 : 0;
        const melodyEvents = this.generateMelody(epoch, currentChord, barIn12, tempo, tension, registerOffset, lastDrumFill);
        events.push(...this.applyAntiFuneralMarch(melodyEvents, epoch, tension));
        consumedEnergy += cost;
      }
    }

    // 2. BASS
    if (hints.bass) {
      const forceWalking = isHighScream || tension > 0.65;
      const cost = forceWalking ? ENERGY_PRICES.bass_walking : ENERGY_PRICES.bass_pedal;
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateBass(epoch, currentChord, tempo, tension, forceWalking));
        consumedEnergy += cost;
      }
    }

    // 3. DRUMS
    if (hints.drums) {
      const cost = tension > 0.5 ? ENERGY_PRICES.drums_full : ENERGY_PRICES.drums_minimal;
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateDrums(epoch, tempo, tension));
        consumedEnergy += cost;
      }
    }

    // 4. HARMONY (Neighbor Listening)
    if (hints.accompaniment || hints.harmony) {
      const cost = ENERGY_PRICES.harmony;
      const shouldPlayHarmony = !isHighScream && (consumedEnergy + cost <= barBudget);
      if (shouldPlayHarmony) {
        events.push(...this.generateHarmony(epoch, currentChord, tempo, tension));
        consumedEnergy += cost;
      }
    }

    // 5. PIANO
    if (hints.pianoAccompaniment) {
      const cost = ENERGY_PRICES.piano;
      if (consumedEnergy + cost <= barBudget && tension > 0.3) {
        events.push(...this.generatePiano(epoch, currentChord, tempo, tension));
        consumedEnergy += cost;
      }
    }

    // 6. TEXTURES
    if (consumedEnergy + ENERGY_PRICES.sfx <= barBudget && tension > 0.4) {
        events.push(...this.generateTextures(epoch, tempo, tension, hints));
        consumedEnergy += (ENERGY_PRICES.sfx + ENERGY_PRICES.sparkles);
    }

    return events;
  }

  /**
   * #ЗАЧЕМ: Динамический выбор лика на основе семантики такта.
   */
  private selectLick(epoch: number, barIn12: number, tension: number, chord: GhostChord): string {
    // 1. Определение семантической фазы
    let category = 'CALL';
    if (barIn12 < 4) category = 'CALL';
    else if (barIn12 < 8) category = 'RESPONSE';
    else if (barIn12 < 10) category = tension > 0.7 ? 'CLIMAX' : 'BRIDGE';
    else if (barIn12 === 10) category = 'RESOLUTION';
    else category = 'TURNAROUND';

    console.log(`Plan160 - blues-brain/narrative: Bar ${epoch} semantic role: ${category}.`);

    // 2. Фильтрация пула по тэгам и напряжению
    const allIds = Object.keys(BLUES_SOLO_LICKS);
    let pool = allIds.filter(id => {
        const lick = BLUES_SOLO_LICKS[id];
        const tags = lick.tags;

        // Категориальное соответствие
        const catMatch = 
            (category === 'CALL' && (tags.includes('pickup') || tags.includes('intro') || tags.includes('major') || tags.includes('minor'))) ||
            (category === 'RESPONSE' && (tags.includes('answer') || tags.includes('voicing') || tags.includes('elaboration'))) ||
            (category === 'CLIMAX' && (tags.includes('scream') || tags.includes('shred') || tags.includes('virtuoso') || tags.includes('climb') || tags.includes('active'))) ||
            (category === 'BRIDGE' && (tags.includes('run') || tags.includes('scale') || tags.includes('boogie'))) ||
            (category === 'RESOLUTION' && (tags.includes('resolution') || tags.includes('sigh') || tags.includes('cry') || tags.includes('response'))) ||
            (category === 'TURNAROUND' && tags.includes('turnaround'));

        if (!catMatch) return false;

        // Соответствие типу аккорда
        if (chord.chordType === 'minor' && tags.includes('major') && !tags.includes('minor')) return false;
        if (chord.chordType === 'major' && tags.includes('minor') && !tags.includes('major')) return false;

        // Соответствие бюджету энергии (плотности)
        if (tension < 0.3 && (tags.includes('fast') || tags.includes('shred') || tags.includes('active'))) return false;
        if (tension > 0.8 && (tags.includes('slow') || tags.includes('sparse'))) return false;

        return true;
    });

    if (pool.length === 0) pool = allIds; // Fallback

    // 3. Скоринг по Тематическому Якорю
    const scoredOptions = pool.map(id => {
        const lick = BLUES_SOLO_LICKS[id];
        let weight = 1;
        // Если лик содержит нашу "любимую ступень" сюиты - приоритет выше
        if (lick.phrase.some(n => n.deg === this.thematicDegree)) weight += 2;
        return { name: id, weight };
    });

    console.log(`Plan160 - blues-brain/syntax: Filtering licks by tension ${tension.toFixed(2)}. Found ${pool.length} matches.`);

    return pickWeightedDeterministic(scoredOptions, this.seed, epoch, 500);
  }

  private generateMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number, registerOffset: number, shouldAccent: boolean): FractalEvent[] {
    const lickId = this.selectLick(epoch, barIn12, tension, chord);
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

  private generateDrums(epoch: number, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch, 3, this.seed, kitPool.length)];
    if (!p) return [];

    const events: FractalEvent[] = [];
    if (tension > 0.3 && p.HH) p.HH.forEach(t => events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.4 * tension, 'p')));
    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.75, tension > 0.7 ? 'mf' : 'p')));
    if (tension > 0.5 && p.SD) p.SD.forEach(t => events.push(this.createDrumEvent('drum_snare', t * tickDur, 0.6 * tension, 'mf')));
    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number, tension: number, forceWalking: boolean): FractalEvent[] {
    const tickDur = (60 / tempo) / 3;
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    const riff = riffs[calculateMusiNum(epoch, 5, this.seed + 100, riffs.length)];
    const barIn12 = epoch % 12;
    let pattern = (tension < 0.25 && !forceWalking) ? [{ t: 0, d: 12, deg: 'R' as BluesRiffDegree }] : riff.I;
    
    if (barIn12 === 11) pattern = riff.turn;
    else if ([4, 5, 9].includes(barIn12)) pattern = riff.IV;
    else if ([8].includes(barIn12)) pattern = riff.V;

    return pattern.map(n => {
      let note = chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0);
      if (note < 24) note += 12; // Sub-bass protection
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

  private generateHarmony(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const pattern = GUITAR_PATTERNS['F_TRAVIS'];
    const voicing = BLUES_GUITAR_VOICINGS['E7_open'];
    const events: FractalEvent[] = [];
    
    const steps = tension > 0.6 ? pattern.pattern : [pattern.pattern[0], pattern.pattern[3]];

    steps.forEach(step => {
      step.ticks.forEach(t => {
        step.stringIndices.forEach(idx => {
          events.push({
            type: 'accompaniment' as const,
            note: chord.rootNote + (voicing[idx] - 40),
            time: t * tickDur,
            duration: beatDur * 1.5,
            weight: 0.2 * tension,
            technique: 'pluck' as const,
            dynamics: 'p' as const,
            phrasing: 'detached' as const,
            chordName: chord.chordType === 'minor' ? 'Am' : 'E'
          });
        });
      });
    });
    return events;
  }

  private generatePiano(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const notes = [chord.rootNote + 3, chord.rootNote + 10];
    return [2, 3].map(beat => ({
        type: 'pianoAccompaniment' as const,
        note: notes[beat % 2] + 12,
        time: beat * beatDur,
        duration: beatDur * 0.8,
        weight: 0.3 * tension,
        technique: 'hit' as const,
        dynamics: 'p' as const,
        phrasing: 'staccato' as const
    }));
  }

  private generateTextures(epoch: number, tempo: number, tension: number, hints: InstrumentHints): FractalEvent[] {
    const events: FractalEvent[] = [];
    
    if (calculateMusiNum(epoch, 7, this.seed, 100) < 15) {
        events.push({
            type: 'sfx',
            note: 60,
            time: this.randomVal() * 2,
            duration: 2.0,
            weight: 0.5,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'detached',
            params: { mood: this.mood, genre: 'blues' }
        });
    }

    if (calculateMusiNum(epoch, 11, this.seed + 50, 100) < 20) {
        events.push({
            type: 'sparkle',
            note: 84,
            time: this.randomVal() * 3,
            duration: 1.0,
            weight: 0.4,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { mood: this.mood, genre: 'blues' }
        });
    }
    return events;
  }

  private randomVal() {
      const x = Math.sin(this.seed + this.lastAscendingBar) * 10000;
      return x - Math.floor(x);
  }

  private createDrumEvent(type: any, time: number, weight: number, dynamics: Dynamics): any {
    return { type, time, duration: 0.1, weight, technique: 'hit', dynamics, phrasing: 'staccato' };
  }

  private applyAntiFuneralMarch(events: FractalEvent[], epoch: number, tension: number): FractalEvent[] {
    if (epoch - this.lastAscendingBar >= 6 && tension > 0.6) {
      const melodyEvents = events.filter(e => e.type === 'melody');
      if (melodyEvents.length > 0) {
        const last = melodyEvents[melodyEvents.length - 1];
        events.push({
          type: 'melody', note: last.note! + 5, time: last.time + last.duration + 0.3,
          duration: 1.2, weight: 0.95, technique: 'vibrato', dynamics: 'mf', phrasing: 'sostenuto', harmonicContext: 'i7'
        });
        this.lastAscendingBar = epoch;
      }
    }
    return events;
  }
}
