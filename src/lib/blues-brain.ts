
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
  InstrumentPart,
  Technique
} from '@/types/music';
import { calculateMusiNum, DEGREE_TO_SEMITONE } from './music-theory';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V12.8 — "The Mindful Pianist".
 * #ЧТО: Пианино переведено в режим "деликатного фона" с мотивной структурой.
 *       Реализован механизм "Dramatic Gravity" для плавного вступления инструментов.
 */

const ENERGY_PRICES = {
    solo: 50,
    bass_walking: 20,
    bass_pedal: 5,
    drums_full: 25,
    drums_minimal: 10,
    harmony: 15,      
    piano: 15, // Снижена цена для частого, но легкого участия
    sfx: 10,          
    sparkles: 5       
};

type MelodicAxiomNote = { deg: string, t: number, d: number, tech: Technique };

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private thematicDegree: string;
  private lastAscendingBar: number = -10;
  private currentAxiom: MelodicAxiomNote[] = [];
  private lastBarHadClimax = false;
  
  // Pattern Rotation State
  private readonly patternOptions: string[] = ['F_TRAVIS', 'F_ROLL12', 'S_SWING'];

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    const anchorDegrees = ['R', 'b3', '5', 'b7'];
    this.thematicDegree = anchorDegrees[calculateMusiNum(seed, 3, seed, anchorDegrees.length)];
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
    
    this.evaluateTimbralDramaturgy(tension, hints);
    
    const melodyStyle = tension > 0.65 ? 'solo' : 'fingerstyle';
    const lastBarHadScream = lastEvents.some(e => e.type === 'melody' && e.note > 74 && e.duration > 0.8);
    const melodyDensity = lastEvents.filter(e => e.type === 'melody').length;

    const patternCycleIndex = Math.floor(epoch / 8);
    const patternIdx = calculateMusiNum(patternCycleIndex, 3, this.seed, this.patternOptions.length);
    const currentPattern = this.patternOptions[patternIdx];

    const barBudget = 100 + (tension * 100);
    let consumedEnergy = 0;

    // 1. MELODY
    if (hints.melody) {
      const prog = hints.summonProgress?.melody ?? 1.0;
      let melodyEvents: FractalEvent[] = [];

      if (melodyStyle === 'solo') {
          melodyEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna);
      } else {
          melodyEvents = this.generateFingerstyleMelody(epoch, currentChord, tempo, tension);
      }

      melodyEvents.forEach(e => { e.weight *= prog; });
      events.push(...this.applyAntiFuneralMarch(melodyEvents, epoch, tension));
      consumedEnergy += ENERGY_PRICES.solo;
    }

    // 2. BASS & DRUMS
    if (hints.bass) {
      const isWalking = (tension > 0.6) && melodyDensity < 12;
      const cost = isWalking ? ENERGY_PRICES.bass_walking : ENERGY_PRICES.bass_pedal;
      if (consumedEnergy + cost <= barBudget) {
        const bassEvents = this.generateBass(epoch, currentChord, tempo, tension, isWalking);
        const prog = hints.summonProgress?.bass ?? 1.0;
        bassEvents.forEach(e => { e.weight *= prog; });
        events.push(...bassEvents);
        consumedEnergy += cost;
      }
    }

    if (hints.drums) {
      const forceFill = lastBarHadScream && tension > 0.5;
      const cost = tension > 0.5 ? ENERGY_PRICES.drums_full : ENERGY_PRICES.drums_minimal;
      if (consumedEnergy + cost <= barBudget) {
        const drumEvents = this.generateDrums(epoch, tempo, tension, forceFill);
        const prog = hints.summonProgress?.drums ?? 1.0;
        drumEvents.forEach(e => { e.weight *= prog; });
        events.push(...drumEvents);
        consumedEnergy += cost;
      }
    }

    // 3. PIANO (Mindful Background)
    // #ЗАЧЕМ: Пианино теперь играет деликатно, не вылезая на передний план.
    // #ЧТО: Генерируется мягкий мотив (broken chord) с низким весом.
    if (hints.pianoAccompaniment && (consumedEnergy + ENERGY_PRICES.piano <= barBudget)) {
        const pianoEvents = this.generatePianoMotif(epoch, currentChord, tempo, tension);
        const prog = hints.summonProgress?.pianoAccompaniment ?? 1.0;
        pianoEvents.forEach(e => { e.weight *= (0.4 * prog); }); // Фиксированное снижение веса для "фона"
        events.push(...pianoEvents);
        consumedEnergy += ENERGY_PRICES.piano;
    }

    // 4. HARMONY (Guitar/Flute)
    if (hints.harmony && (consumedEnergy + ENERGY_PRICES.harmony <= barBudget)) {
        const prog = hints.summonProgress?.harmony ?? 1.0;
        const harmEvents = this.generateHarmonyEvents(epoch, currentChord, tempo, tension, hints.harmony);
        harmEvents.forEach(e => { e.weight *= prog; });
        events.push(...harmEvents);
        consumedEnergy += ENERGY_PRICES.harmony;
    }

    if (hints.accompaniment && (consumedEnergy + ENERGY_PRICES.harmony <= barBudget)) {
        const accEvents = this.generateAccompaniment(epoch, currentChord, tempo, tension, currentPattern);
        const prog = hints.summonProgress?.accompaniment ?? 1.0;
        accEvents.forEach(e => { e.weight *= prog; });
        events.push(...accEvents);
        consumedEnergy += ENERGY_PRICES.harmony;
    }

    return events;
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody && typeof hints.melody !== 'string') {
        if (tension < 0.5) hints.melody = 'telecaster' as any;
        else hints.melody = 'blackAcoustic' as any;
    }
    if (hints.accompaniment && typeof hints.accompaniment !== 'string') {
        if (tension < 0.4) hints.accompaniment = 'ep_rhodes_warm' as any;
        else if (tension < 0.7) hints.accompaniment = 'organ_soft_jazz' as any;
        else hints.accompaniment = 'organ_jimmy_smith' as any;
    }
  }

  private generateLSystemMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number, dna: SuiteDNA): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const phaseInSentence = epoch % 4; 
    let phaseName: 'CALL' | 'RESPONSE' | 'CLIMAX' | 'TURNAROUND' | 'call_var' = 'CALL';
    
    if (barIn12 === 11) phaseName = 'TURNAROUND';
    else if (phaseInSentence < 2) phaseName = 'CALL';
    else if (phaseInSentence === 2) phaseName = 'RESPONSE';
    else phaseName = (tension > 0.7) ? 'CLIMAX' : 'RESPONSE';

    if (phaseInSentence === 0 || this.currentAxiom.length === 0) {
        this.currentAxiom = this.generateInitialAxiom(tension);
    } else {
        this.currentAxiom = this.evolveAxiom(this.currentAxiom, tension, phaseName, dna, epoch);
    }

    const registerLift = (tension > 0.7 || phaseName === 'CLIMAX') ? 12 : 0;

    return this.currentAxiom.map(n => ({
        type: 'melody',
        note: chord.rootNote + 36 + registerLift + (DEGREE_TO_SEMITONE[n.deg] || 0),
        time: n.t * tickDur,
        duration: n.d * tickDur,
        weight: 0.8 + (tension * 0.2),
        technique: n.tech,
        dynamics: tension > 0.6 ? 'mf' : 'p',
        phrasing: 'legato',
        harmonicContext: phaseName
    }));
  }

  private generateFingerstyleMelody(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
      const beatDur = 60 / tempo;
      const root = chord.rootNote + 36;
      const isMinor = chord.chordType === 'minor';
      const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
      const events: FractalEvent[] = [];
      const density = 0.3 + (tension * 0.3);
      
      [0, 1, 2, 3].forEach(beat => {
          if (calculateMusiNum(epoch + beat, 3, this.seed, 10) / 10 < density) {
              const noteIdx = calculateMusiNum(epoch + beat, 5, this.seed, 4);
              events.push({
                  type: 'melody',
                  note: notes[noteIdx],
                  time: beat * beatDur,
                  duration: beatDur * 0.8,
                  weight: 0.5 + (tension * 0.3),
                  technique: 'pick',
                  dynamics: 'p',
                  phrasing: 'detached'
              });
          }
      });
      return events;
  }

  private generateInitialAxiom(tension: number): MelodicAxiomNote[] {
    const axiom: MelodicAxiomNote[] = [];
    const pool = ['R', 'b3', '4', '5', 'b7', this.thematicDegree];
    const count = tension > 0.6 ? 3 : 2;
    for (let i = 0; i < count; i++) {
        const stepSeed = this.seed + i + Math.floor(Math.random() * 100);
        axiom.push({ 
            deg: pool[calculateMusiNum(stepSeed, 3, i, pool.length)], 
            t: i * 3, 
            d: 3, 
            tech: 'pick' 
        });
    }
    return axiom;
  }

  private evolveAxiom(axiom: MelodicAxiomNote[], tension: number, phase: string, dna: SuiteDNA, epoch: number): MelodicAxiomNote[] {
    return axiom.map((note, i) => {
        let newDeg = note.deg;
        let newTech = note.tech;

        if (tension > 0.65 && phase === 'CLIMAX' && calculateMusiNum(epoch, 7, this.seed, 10) > 6) {
            const highPool = ['5', 'b7', 'R+8', '9'];
            newDeg = highPool[calculateMusiNum(epoch + i, 3, this.seed, highPool.length)];
            newTech = 'bend';
        } else if (phase === 'RESPONSE' && i === axiom.length - 1) {
            newDeg = (dna.thematicAnchors?.[0] as any) || 'R';
            newTech = 'vibrato';
        }

        return { ...note, deg: newDeg, tech: newTech, t: (note.t + 1) % 12 };
    }).slice(0, 6);
  }

  private generateDrums(epoch: number, tempo: number, tension: number, forceFill: boolean): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch, 3, this.seed, kitPool.length)];
    if (!p) return [];
    const events: FractalEvent[] = [];
    
    if (forceFill) {
        [9, 10, 11].forEach(t => events.push(this.createDrumEvent('drum_tom_mid', t * tickDur, 0.8, 'mf')));
    }
    
    if (tension > 0.3 && p.HH) p.HH.forEach(t => events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.4 + (tension * 0.2), 'p')));
    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.8, tension > 0.7 ? 'mf' : 'p')));
    if (tension > 0.5 && p.SD) p.SD.forEach(t => events.push(this.createDrumEvent('drum_snare', t * tickDur, 0.5 + (tension * 0.3), 'mf')));
    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number, tension: number, isWalking: boolean): FractalEvent[] {
    const tickDur = (60 / tempo) / 3;
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    const riffCycleIndex = Math.floor(epoch / 4);
    const riff = riffs[calculateMusiNum(riffCycleIndex, 5, this.seed + 100, riffs.length)];
    const barIn12 = epoch % 12;
    let pattern = (!isWalking) ? [{ t: 0, d: 12, deg: 'R' as BluesRiffDegree }] : riff.I;
    if (barIn12 === 11) pattern = riff.turn;
    else if ([4, 5, 9, 10].includes(barIn12)) pattern = riff.IV;
    else if ([8].includes(barIn12)) pattern = riff.V;

    return pattern.map(n => {
      let note = chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0);
      if (note < 24) note += 12; 
      return { type: 'bass', note, time: n.t * tickDur, duration: (n.d || 2) * tickDur, weight: 0.7 + tension * 0.2, technique: 'pluck', dynamics: (isWalking || tension > 0.6) ? 'mf' : 'p', phrasing: 'legato' };
    });
  }

  /**
   * #ЗАЧЕМ: Пианино больше не "солирует", а создает мягкий гармонический фон.
   */
  private generatePianoMotif(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const root = chord.rootNote + 36;
    const isMinor = chord.chordType === 'minor';
    const notes = [root + 7, root + 10, root + (isMinor ? 15 : 16)]; // 5, b7, 9/8
    
    const events: FractalEvent[] = [];
    const density = 0.25 + (tension * 0.2); // Сниженная плотность
    
    [1, 2, 3].forEach(beat => {
        if (calculateMusiNum(epoch + beat, 7, this.seed + 50, 10) / 10 < density) {
            events.push({
                type: 'pianoAccompaniment',
                note: notes[calculateMusiNum(epoch + beat, 3, this.seed, 3)],
                time: beat * beatDur + (this.random.next() * 0.1), // Смещение для "человечности"
                duration: beatDur * 1.5,
                weight: 0.35 + (tension * 0.25),
                technique: 'hit',
                dynamics: 'p',
                phrasing: 'staccato'
            });
        }
    });
    return events;
  }

  private generateHarmonyEvents(epoch: number, chord: GhostChord, tempo: number, tension: number, instrument: any): FractalEvent[] {
      const beatDur = 60 / tempo;
      const isMinor = chord.chordType === 'minor';
      const root = chord.rootNote;
      const events: FractalEvent[] = [];

      if (instrument === 'guitarChords') {
          const chordName = isMinor ? 'Am7' : 'E7'; // Simplified naming for sampler
          events.push({
              type: 'harmony',
              note: root + 24,
              time: 0,
              duration: 4.0,
              weight: 0.3 + (tension * 0.2),
              technique: 'swell',
              dynamics: 'p',
              phrasing: 'legato',
              chordName: chordName,
              params: { barCount: epoch }
          });
      } else if (instrument === 'flute') {
          // Деликатная флейта: одна длинная нота на квинту или тонику
          const degree = (epoch % 8 < 4) ? 7 : 0;
          events.push({
              type: 'harmony',
              note: root + 48 + degree,
              time: 0.5,
              duration: 3.0,
              weight: 0.25 + (tension * 0.2),
              technique: 'swell',
              dynamics: 'p',
              phrasing: 'legato'
          });
      }
      return events;
  }

  private generateAccompaniment(epoch: number, chord: GhostChord, tempo: number, tension: number, patternName: string): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const pattern = GUITAR_PATTERNS[patternName] || GUITAR_PATTERNS['F_TRAVIS'];
    const voicing = BLUES_GUITAR_VOICINGS['E7_open'];
    const events: FractalEvent[] = [];
    const steps = (tension > 0.6 || patternName.startsWith('S_')) ? pattern.pattern : [pattern.pattern[0]];
    
    steps.forEach(step => {
      step.ticks.forEach(t => {
        step.stringIndices.forEach(idx => {
          events.push({ type: 'accompaniment', note: chord.rootNote + (voicing[idx] - 40), time: t * tickDur, duration: beatDur * 2.0, weight: 0.3 + (tension * 0.2), technique: 'pluck', dynamics: 'p', phrasing: 'detached' });
        });
      });
    });
    return events;
  }

  private createDrumEvent(type: any, time: number, weight: number, dynamics: Dynamics): any {
    return { type, time, duration: 0.1, weight, technique: 'hit', dynamics, phrasing: 'staccato' };
  }

  private applyAntiFuneralMarch(events: FractalEvent[], epoch: number, tension: number): FractalEvent[] {
    if (epoch - this.lastAscendingBar >= 6 && tension > 0.6) {
      const melodyEvents = events.filter(e => e.type === 'melody');
      if (melodyEvents.length > 0) {
        const last = melodyEvents[melodyEvents.length - 1];
        events.push({ type: 'melody', note: last.note! + 5, time: last.time + last.duration + 0.3, duration: 1.2, weight: 0.95, technique: 'vibrato', dynamics: 'mf', phrasing: 'sostenuto', harmonicContext: 'RESOLUTION' });
        this.lastAscendingBar = epoch;
      }
    }
    return events;
  }
}
