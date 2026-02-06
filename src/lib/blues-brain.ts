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
import { calculateMusiNum, DEGREE_TO_SEMITONE, pickWeightedDeterministic } from './music-theory';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V10.1 — Timbral Dramaturgy Engine (Updated).
 * #ЧТО: Инструменты меняют свои тембры (пресеты) в зависимости от напряжения (Tension).
 *       #ИСПРАВЛЕНО (ПЛАН 167): Гитара ShineOn полностью удалена из соло.
 *       Оставлены только Telecaster (Low Tension) и Black Acoustic (High Tension).
 */

const ENERGY_PRICES = {
    solo: 50,
    bass_walking: 20,
    bass_pedal: 5,
    drums_full: 25,
    drums_minimal: 10,
    harmony: 15,      
    piano: 20,        
    sfx: 10,          
    sparkles: 5       
};

type MelodicAxiomNote = { deg: string, t: number, d: number, tech: Technique };

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private thematicDegree: string;
  private lastAscendingBar: number = -10;
  
  // Plan 164: Melodic Memory & L-System
  private currentAxiom: MelodicAxiomNote[] = [];
  private axiomAge: number = 0;

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    
    const anchorDegrees = ['R', 'b3', '5', 'b7'];
    this.thematicDegree = anchorDegrees[calculateMusiNum(seed, 3, seed, anchorDegrees.length)];

    console.log(`%cPlan160 - [BluesBrain] Semantic Assembly Engine Online. Thematic Anchor: ${this.thematicDegree}`, 'color: #00FF00; font-weight: bold;');
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
    
    // --- Plan 165/167: TIMBRAL DRAMATURGY ---
    // Управление "голосами" актеров на основе напряжения
    this.evaluateTimbralDramaturgy(tension, hints);

    // --- CONVERSATIONAL ANALYSIS ---
    const lastBarHadCall = lastEvents.some(e => e.type === 'melody' && e.harmonicContext === 'CALL');
    const lastBarHadScream = lastEvents.some(e => e.type === 'melody' && e.note > 74 && e.duration > 0.8);
    const melodyDensity = lastEvents.filter(e => e.type === 'melody').length;

    // Бюджет такта (Базовый 100)
    const barBudget = 100 + (tension * 100);
    let consumedEnergy = 0;

    // 1. SOLO (MELODY) - P1
    let melodyEvents: FractalEvent[] = [];
    if (hints.melody) {
      melodyEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension);
      events.push(...this.applyAntiFuneralMarch(melodyEvents, epoch, tension));
      consumedEnergy += ENERGY_PRICES.solo;
    }

    const currentPhase = melodyEvents.length > 0 ? (melodyEvents[0].harmonicContext || 'SILENCE') : 'PAUSE';
    console.log(`%cPlan160 - [Bar ${epoch}] Narrative: ${currentPhase} | Tension: ${tension.toFixed(2)} | Budget: ${consumedEnergy.toFixed(0)}/${barBudget.toFixed(0)}`, 'color: #00BFFF');

    // 2. BASS & DRUMS - P2
    if (hints.bass) {
      const isCrowded = tension > 0.8 && melodyDensity > 6;
      const shouldWalk = lastBarHadCall || tension > 0.6;
      const mode = isCrowded ? 'PEDAL' : (shouldWalk ? 'WALKING' : 'PEDAL');
      
      const cost = mode === 'WALKING' ? ENERGY_PRICES.bass_walking : ENERGY_PRICES.bass_pedal;
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateBass(epoch, currentChord, tempo, tension, mode === 'WALKING'));
        consumedEnergy += cost;
      }
    }

    if (hints.drums) {
      const forceFill = lastBarHadScream && tension > 0.5;
      const cost = tension > 0.5 ? ENERGY_PRICES.drums_full : ENERGY_PRICES.drums_minimal;
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateDrums(epoch, tempo, tension, forceFill));
        consumedEnergy += cost;
      }
    }

    // 3. HARMONY (Weight Floor 0.35) - P3
    if (hints.accompaniment && (consumedEnergy + ENERGY_PRICES.harmony <= barBudget)) {
        events.push(...this.generateHarmony(epoch, currentChord, tempo, tension));
        consumedEnergy += ENERGY_PRICES.harmony;
    }

    if (hints.pianoAccompaniment && !lastBarHadScream && (consumedEnergy + ENERGY_PRICES.piano <= barBudget)) {
        events.push(...this.generatePiano(epoch, currentChord, tempo, tension));
        consumedEnergy += ENERGY_PRICES.piano;
    }

    // 4. TEXTURES - P4
    if (tension > 0.4) {
        if (hints.sfx && (consumedEnergy + ENERGY_PRICES.sfx <= barBudget)) {
            // SFX trigger logic here if needed
            consumedEnergy += ENERGY_PRICES.sfx;
        }
    }

    return events;
  }

  /**
   * #ЗАЧЕМ: Управление тембрами в зависимости от напряжения сюжета.
   * #ИСПРАВЛЕНО (ПЛАН 167): ShineOn удален из семантического выбора.
   */
  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    // 1. Мелодия (Гитара)
    if (hints.melody) {
        const oldMelody = hints.melody;
        // #ИСПРАВЛЕНО (ПЛАН 167): Только Telecaster и Black Acoustic.
        if (tension < 0.5) hints.melody = 'telecaster' as any;
        else hints.melody = 'blackAcoustic' as any;
        
        if (oldMelody !== hints.melody) {
            console.log(`%cPlan167 - [Dramaturgy] Melody morphing to ${hints.melody} (Tension: ${tension.toFixed(2)})`, 'color: #FFA500');
        }
    }

    // 2. Аккомпанемент (Орган/EP)
    if (hints.accompaniment) {
        const oldAcc = hints.accompaniment;
        if (tension < 0.4) hints.accompaniment = 'ep_rhodes_warm' as any;
        else if (tension < 0.7) hints.accompaniment = 'organ_soft_jazz' as any;
        else hints.accompaniment = 'organ_jimmy_smith' as any;

        if (oldAcc !== hints.accompaniment) {
            console.log(`%cPlan165 - [Dramaturgy] Accompaniment morphing to ${hints.accompaniment} (Tension: ${tension.toFixed(2)})`, 'color: #FFA500');
        }
    }
  }

  private generateLSystemMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    const phaseInSentence = epoch % 4; 
    let phaseName: 'CALL' | 'RESPONSE' | 'CLIMAX' | 'TURNAROUND' = 'CALL';
    
    if (barIn12 === 11) phaseName = 'TURNAROUND';
    else if (phaseInSentence === 0 || phaseInSentence === 1) phaseName = 'CALL';
    else if (phaseInSentence === 2) phaseName = 'RESPONSE';
    else phaseName = (tension > 0.7) ? 'CLIMAX' : 'RESPONSE';

    if (phaseInSentence === 0 || this.currentAxiom.length === 0) {
        this.currentAxiom = this.generateInitialAxiom(tension);
        this.axiomAge = 0;
        console.log(`  %cPlan164 - [L-System] NEW AXIOM created for Bar ${epoch}`, 'color: #DA70D6');
    } else {
        this.currentAxiom = this.evolveAxiom(this.currentAxiom, tension, phaseName);
        this.axiomAge++;
        console.log(`  %cPlan164 - [L-System] Axiom EVOLVED (Iteration ${this.axiomAge}) for ${phaseName}`, 'color: #DA70D6');
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

  private generateInitialAxiom(tension: number): MelodicAxiomNote[] {
    const axiom: MelodicAxiomNote[] = [];
    const pool = ['R', 'b3', '4', '5', 'b7', this.thematicDegree];
    
    const count = tension > 0.6 ? 3 : 2;
    for (let i = 0; i < count; i++) {
        axiom.push({
            deg: pool[calculateMusiNum(this.seed + i, 3, i, pool.length)],
            t: i * 3,
            d: 3,
            tech: 'pick'
        });
    }
    return axiom;
  }

  private evolveAxiom(axiom: MelodicAxiomNote[], tension: number, phase: string): MelodicAxiomNote[] {
    const evolved = axiom.flatMap((note, i) => {
        if (phase === 'RESPONSE' && i === axiom.length - 1) {
            return [{ ...note, deg: (tension > 0.5 ? this.thematicDegree : 'R'), tech: 'vibrato' as Technique }];
        }
        
        if (phase === 'CLIMAX' && tension > 0.8) {
            return [
                note,
                { ...note, deg: 'R+8', t: (note.t + 1) % 12, d: 1, tech: 'bend' as Technique }
            ];
        }
        return [{ ...note, t: (note.t + 1) % 12 }];
    });
    return evolved.slice(0, 6);
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
    const riff = riffs[calculateMusiNum(epoch, 5, this.seed + 100, riffs.length)];
    const barIn12 = epoch % 12;
    
    let pattern = (!isWalking) ? [{ t: 0, d: 12, deg: 'R' as BluesRiffDegree }] : riff.I;
    
    if (barIn12 === 11) pattern = riff.turn;
    else if ([4, 5, 9].includes(barIn12)) pattern = riff.IV;
    else if ([8].includes(barIn12)) pattern = riff.V;

    return pattern.map(n => {
      let note = chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0);
      if (note < 24) note += 12; 
      return {
        type: 'bass',
        note,
        time: n.t * tickDur,
        duration: (n.d || 2) * tickDur,
        weight: 0.7 + tension * 0.2,
        technique: 'pluck',
        dynamics: (isWalking || tension > 0.6) ? 'mf' : 'p',
        phrasing: 'legato'
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
            type: 'accompaniment',
            note: chord.rootNote + (voicing[idx] - 40),
            time: t * tickDur,
            duration: beatDur * 2.0,
            weight: 0.35 + (tension * 0.2),
            technique: 'pluck',
            dynamics: 'p',
            phrasing: 'detached'
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
        type: 'pianoAccompaniment',
        note: notes[beat % 2] + 12,
        time: beat * beatDur,
        duration: beatDur * 0.8,
        weight: 0.35 + (tension * 0.3),
        technique: 'hit',
        dynamics: 'p',
        phrasing: 'staccato'
    }));
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
          duration: 1.2, weight: 0.95, technique: 'vibrato', dynamics: 'mf', phrasing: 'sostenuto', harmonicContext: 'RESOLUTION'
        });
        this.lastAscendingBar = epoch;
      }
    }
    return events;
  }
}
