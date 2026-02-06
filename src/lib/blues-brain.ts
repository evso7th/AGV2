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
 * #ЗАЧЕМ: Блюзовый Мозг V8.1 — Full Generative Conversation with Transparency.
 * #ЧТО: Внедрена детальная диагностика "мыслей" ансамбля для контроля СОР Уровня 4.
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

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private thematicDegree: string;
  private lastAscendingBar: number = -10;

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    
    const anchorDegrees = ['R', 'b3', '5', 'b7'];
    this.thematicDegree = anchorDegrees[calculateMusiNum(seed, 3, seed, anchorDegrees.length)];

    console.log(`%c[BluesBrain] Semantic Assembly Engine Online. Thematic Anchor: ${this.thematicDegree}`, 'color: #00FF00; font-weight: bold;');
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
    
    // --- CONVERSATIONAL ANALYSIS (Resonance) ---
    const lastBarHadCall = lastEvents.some(e => e.type === 'melody' && e.harmonicContext === 'CALL');
    const lastBarHadScream = lastEvents.some(e => e.type === 'melody' && e.note > 74 && e.duration > 0.8);
    const melodyDensity = lastEvents.filter(e => e.type === 'melody').length;

    // Бюджет такта (Level 4)
    const barBudget = 100 + (tension * 100);
    let consumedEnergy = 0;

    // 1. SOLO (MELODY)
    let melodyEvents: FractalEvent[] = [];
    if (hints.melody) {
      melodyEvents = this.generateGenerativeMelody(epoch, currentChord, barIn12, tempo, tension);
      events.push(...this.applyAntiFuneralMarch(melodyEvents, epoch, tension));
      consumedEnergy += ENERGY_PRICES.solo;
    }

    const currentPhase = melodyEvents.length > 0 ? (melodyEvents[0].harmonicContext || 'SILENCE') : 'PAUSE';
    console.log(`%c[Bar ${epoch}] Narrative: ${currentPhase} | Tension: ${tension.toFixed(2)} | Budget: ${consumedEnergy.toFixed(0)}/${barBudget.toFixed(0)}`, 'color: #00BFFF');

    // 2. BASS - Conversational Mode
    if (hints.bass) {
      const isCrowded = tension > 0.8 && melodyDensity > 6;
      const shouldWalk = lastBarHadCall || tension > 0.6;
      
      const mode = isCrowded ? 'PEDAL' : (shouldWalk ? 'WALKING' : 'PEDAL');
      const reason = isCrowded ? 'High melody density' : (shouldWalk ? 'Responding to CALL' : 'Atmospheric pedal');
      
      console.log(`  %c[Resonance] Bass: ${mode} (Reason: ${reason})`, 'color: #4169E1');

      const cost = mode === 'WALKING' ? ENERGY_PRICES.bass_walking : ENERGY_PRICES.bass_pedal;
      
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateBass(epoch, currentChord, tempo, tension, mode === 'WALKING'));
        consumedEnergy += cost;
      }
    }

    // 3. DRUMS - Punctuation
    if (hints.drums) {
      const forceFill = lastBarHadScream && tension > 0.5;
      if (forceFill) {
          console.log(`  %c[Resonance] Drums: FILL (Reason: Scream detected!)`, 'color: #FFA500');
      }

      const cost = tension > 0.5 ? ENERGY_PRICES.drums_full : ENERGY_PRICES.drums_minimal;
      if (consumedEnergy + cost <= barBudget) {
        events.push(...this.generateDrums(epoch, tempo, tension, forceFill));
        consumedEnergy += cost;
      }
    }

    // 4. ACCOMPANIMENT & OTHERS
    if (hints.accompaniment && (consumedEnergy + ENERGY_PRICES.harmony <= barBudget)) {
        events.push(...this.generateHarmony(epoch, currentChord, tempo, tension));
        consumedEnergy += ENERGY_PRICES.harmony;
    }

    if (hints.pianoAccompaniment && !lastBarHadScream && (consumedEnergy + ENERGY_PRICES.piano <= barBudget)) {
        events.push(...this.generatePiano(epoch, currentChord, tempo, tension));
        consumedEnergy += ENERGY_PRICES.piano;
    }

    if (consumedEnergy + 10 <= barBudget && tension > 0.4) {
        events.push(...this.generateTextures(epoch, tempo, tension, hints));
    }

    return events;
  }

  private generateGenerativeMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    
    let phase: 'CALL' | 'RESPONSE' | 'CLIMAX' | 'TURNAROUND' = 'CALL';
    if (barIn12 < 4) phase = 'CALL';
    else if (barIn12 < 8) phase = 'RESPONSE';
    else if (barIn12 < 11) phase = (tension > 0.7) ? 'CLIMAX' : 'RESPONSE';
    else phase = 'TURNAROUND';

    const notes: { deg: string, t: number, d: number, tech: Technique }[] = [];
    
    if (phase === 'CALL') {
        notes.push({ deg: '5', t: 0, d: 3, tech: 'pick' });
        notes.push({ deg: '4', t: 3, d: 3, tech: 'slide' });
        notes.push({ deg: 'b3', t: 6, d: 6, tech: 'bend' });
    } else if (phase === 'RESPONSE') {
        notes.push({ deg: 'b3', t: 0, d: 2, tech: 'pick' });
        notes.push({ deg: '4', t: 3, d: 2, tech: 'pick' });
        notes.push({ deg: '5', t: 6, d: 2, tech: 'pick' });
        notes.push({ deg: 'R', t: 9, d: 3, tech: 'vibrato' });
    } else if (phase === 'CLIMAX') {
        notes.push({ deg: 'b7', t: 0, d: 6, tech: 'bend' });
        notes.push({ deg: '5', t: 6, d: 2, tech: 'pick' });
        notes.push({ deg: 'b5', t: 8, d: 2, tech: 'slide' });
        notes.push({ deg: '4', t: 10, d: 2, tech: 'pick' });
    } else {
        notes.push({ deg: '2', t: 0, d: 2, tech: 'pick' });
        notes.push({ deg: 'b3', t: 3, d: 2, tech: 'pick' });
        notes.push({ deg: '3', t: 6, d: 3, tech: 'pick' });
        notes.push({ deg: '4', t: 9, d: 3, tech: 'pick' });
    }

    const registerLift = tension > 0.7 ? 12 : 0;

    return notes.map(n => ({
        type: 'melody',
        note: chord.rootNote + 36 + registerLift + (DEGREE_TO_SEMITONE[n.deg] || 0),
        time: n.t * tickDur,
        duration: n.d * tickDur,
        weight: 0.8 + (tension * 0.2),
        technique: n.tech,
        dynamics: tension > 0.6 ? 'mf' : 'p',
        phrasing: 'legato',
        harmonicContext: phase
    }));
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
        weight: 0.4 + (tension * 0.2),
        technique: 'hit',
        dynamics: 'p',
        phrasing: 'staccato'
    }));
  }

  private generateTextures(epoch: number, tempo: number, tension: number, hints: InstrumentHints): FractalEvent[] {
    const events: FractalEvent[] = [];
    if (calculateMusiNum(epoch, 7, this.seed, 100) < 15) {
        events.push({
            type: 'sfx',
            note: 60,
            time: Math.random() * 2,
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
            time: Math.random() * 3,
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
