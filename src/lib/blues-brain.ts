
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
import { calculateMusiNum, DEGREE_TO_SEMITONE, transformLick } from './music-theory';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V21.0 — "Iron Ensemble Persistence".
 * #ЧТО: 1. Базовый бюджет увеличен до 150 очков.
 *       2. Реализована "Инерция Ансамбля": играющие инструменты получают скидку 30% на энергию.
 *       3. Сцены Anxious Blues переработаны для устранения "дыр" в середине пьесы.
 */

const ENERGY_PRICES = {
    solo: 50,
    bass_walking: 20,
    bass_pedal: 5,
    drums_full: 25,
    drums_minimal: 10,
    harmony: 15,      
    piano: 15, 
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
  private random: any;
  
  private readonly MELODY_CEILING = 79;
  private phrasePauseTimer = 0; 
  private readonly patternOptions: string[] = ['F_TRAVIS', 'F_ROLL12', 'S_SWING'];

  private phraseHistory: string[] = [];
  private readonly MAX_REPETITION_COUNT = 3;

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    this.random = this.createSeededRandom(seed);
    const anchorDegrees = ['R', 'b3', '5', 'b7'];
    this.thematicDegree = anchorDegrees[calculateMusiNum(seed, 3, seed, anchorDegrees.length)];
  }

  private createSeededRandom(seed: number) {
    let state = seed;
    const next = () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
    return {
      next,
      nextInt: (max: number) => Math.floor(next() * max),
       shuffle: <T>(array: T[]): T[] => {
        let currentIndex = array.length, randomIndex;
        const newArray = [...array];
        while (currentIndex !== 0) {
            randomIndex = Math.floor(next() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
        }
        return newArray;
    }
  };
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
    
    this.evaluateTimbralDramaturgy(tension, hints, this.mood);
    
    const melodyStyle = tension > 0.65 ? 'solo' : 'fingerstyle';
    const melodyDensity = lastEvents.filter(e => e.type === 'melody').length;
    const lastBarHadMelody = melodyDensity > 0;

    // #ЗАЧЕМ: Защита от распада ансамбля на низком напряжении.
    // #ЧТО: Базовый бюджет увеличен со 100 до 150.
    const barBudget = 150 + (tension * 100);
    let consumedEnergy = 0;

    // Детектор игравших инструментов для скидки
    const previouslyPlaying = new Set(lastEvents.map(e => Array.isArray(e.type) ? e.type[0] : e.type));

    // Функция расчета цены со скидкой
    const getPrice = (basePrice: number, part: string) => {
        return previouslyPlaying.has(part as any) ? basePrice * 0.7 : basePrice;
    };

    const patternCycleIndex = Math.floor(epoch / 8);
    const patternIdx = calculateMusiNum(patternCycleIndex, 3, this.seed, this.patternOptions.length);
    const currentPattern = this.patternOptions[patternIdx];

    // 1. MELODY
    if (hints.melody) {
      const price = getPrice(ENERGY_PRICES.solo, 'melody');
      if (consumedEnergy + price <= barBudget) {
          const prog = hints.summonProgress?.melody ?? 1.0;
          let melodyEvents: FractalEvent[] = [];

          if (this.phrasePauseTimer > 0) {
              this.phrasePauseTimer--;
          } else {
              if (melodyStyle === 'solo') {
                  melodyEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna);
                  
                  const currentHash = this.getPhraseHash(melodyEvents);
                  if (this.isRepetitive(currentHash)) {
                      this.currentAxiom = [];
                      melodyEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna);
                  }
                  this.phraseHistory.push(currentHash);
                  if (this.phraseHistory.length > 8) this.phraseHistory.shift();

                  if (barIn12 === 11 || tension > 0.85) {
                      this.phrasePauseTimer = 1 + calculateMusiNum(epoch, 3, this.seed, 2);
                  }
              } else {
                  melodyEvents = this.generateFingerstyleMelody(epoch, currentChord, tempo, tension);
              }
          }

          melodyEvents.forEach(e => { e.weight *= prog; });
          events.push(...this.applyAntiFuneralMarch(melodyEvents, epoch, tension));
          consumedEnergy += price;
      }
    }

    // 2. BASS
    if (hints.bass) {
      const isWalking = (tension > 0.6) && melodyDensity < 12;
      const baseCost = isWalking ? ENERGY_PRICES.bass_walking : ENERGY_PRICES.bass_pedal;
      const price = getPrice(baseCost, 'bass');
      
      if (consumedEnergy + price <= barBudget) {
        const bassEvents = this.generateBass(epoch, currentChord, tempo, tension, isWalking);
        const prog = hints.summonProgress?.bass ?? 1.0;
        bassEvents.forEach(e => { e.weight *= prog; });
        events.push(...bassEvents);
        consumedEnergy += price;
      }
    }

    // 3. DRUMS
    if (hints.drums) {
      const baseCost = tension > 0.5 ? ENERGY_PRICES.drums_full : ENERGY_PRICES.drums_minimal;
      const price = getPrice(baseCost, 'drums');
      
      if (consumedEnergy + price <= barBudget) {
        const drumEvents = this.generateDrums(epoch, tempo, tension, lastBarHadMelody);
        const prog = hints.summonProgress?.drums ?? 1.0;
        drumEvents.forEach(e => { e.weight *= prog; });
        events.push(...drumEvents);
        consumedEnergy += price;
      }
    }

    // 4. PIANO
    const pianoPrice = getPrice(ENERGY_PRICES.piano, 'pianoAccompaniment');
    if (hints.pianoAccompaniment && (consumedEnergy + pianoPrice <= barBudget)) {
        const pianoEvents = this.generatePianoMotif(epoch, currentChord, tempo, tension);
        const prog = hints.summonProgress?.pianoAccompaniment ?? 1.0;
        pianoEvents.forEach(e => { e.weight *= (0.4 * prog); }); 
        events.push(...pianoEvents);
        consumedEnergy += pianoPrice;
    }

    // 5. HARMONY & ACCOMPANIMENT
    const harmPrice = getPrice(ENERGY_PRICES.harmony, 'harmony');
    if (hints.harmony && (consumedEnergy + harmPrice <= barBudget)) {
        const prog = hints.summonProgress?.harmony ?? 1.0;
        const harmEvents = this.generateHarmonyEvents(epoch, currentChord, tempo, tension, hints.harmony);
        harmEvents.forEach(e => { e.weight *= prog; });
        events.push(...harmEvents);
        consumedEnergy += harmPrice;
    }

    const accPrice = getPrice(ENERGY_PRICES.harmony, 'accompaniment');
    if (hints.accompaniment && (consumedEnergy + accPrice <= barBudget)) {
        const accEvents = this.generateAccompaniment(epoch, currentChord, tempo, tension, currentPattern);
        const prog = hints.summonProgress?.accompaniment ?? 1.0;
        accEvents.forEach(e => { e.weight *= prog; });
        events.push(...accEvents);
        consumedEnergy += accPrice;
    }

    return events;
  }

  private getPhraseHash(events: FractalEvent[]): string {
      return events.map(e => e.note).join('-');
  }

  private isRepetitive(newHash: string): boolean {
      if (this.phraseHistory.length < this.MAX_REPETITION_COUNT) return false;
      const recent = this.phraseHistory.slice(-this.MAX_REPETITION_COUNT);
      return recent.every(h => h === newHash);
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints, mood: Mood) {
    if (mood === 'dark' || mood === 'gloomy' || mood === 'anxious') {
        if (hints.melody) {
            if (tension < 0.4) (hints as any).melody = 'blackAcoustic';
            else if (tension < 0.75) (hints as any).melody = 'cs80';
            else (hints as any).melody = 'guitar_muffLead';
        }
        if (hints.bass) {
            if (tension < 0.4) (hints as any).bass = 'bass_jazz_warm';
            else if (tension < 0.7) (hints as any).bass = 'bass_reggae';
            else (hints as any).bass = 'bass_808';
        }
        if (hints.accompaniment) {
            if (tension < 0.5) (hints as any).accompaniment = 'ep_rhodes_warm';
            else if (tension < 0.7) (hints as any).accompaniment = 'organ_soft_jazz';
            else (hints as any).accompaniment = 'organ_jimmy_smith';
        }
    } else if (mood === 'melancholic') {
        if (hints.melody) {
            if (tension <= 0.5) (hints as any).melody = 'blackAcoustic';
            else if (tension <= 0.7) (hints as any).melody = 'cs80';
            else (hints as any).melody = 'guitar_shineOn';
        }
        if (hints.bass) {
            if (tension < 0.4) (hints as any).bass = 'bass_jazz_warm';
            else if (tension < 0.7) (hints as any).bass = 'bass_reggae';
            else (hints as any).bass = 'bass_808';
        }
    } else {
        if (hints.melody) (hints as any).melody = 'guitar_shineOn';
        if (hints.accompaniment) {
            if (tension < 0.4) (hints as any).accompaniment = 'ep_rhodes_warm';
            else if (tension < 0.7) (hints as any).accompaniment = 'organ_soft_jazz';
            else (hints as any).accompaniment = 'organ_jimmy_smith';
        }
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
        this.currentAxiom = this.generateInitialAxiom(tension, epoch, dna);
    } else {
        this.currentAxiom = this.evolveAxiom(this.currentAxiom, tension, phaseName, dna, epoch);
    }

    const registerLift = (tension > 0.7 || phaseName === 'CLIMAX') ? 12 : 0;

    return this.currentAxiom.map((n, idx, arr) => {
        let duration = n.d;
        if (idx < arr.length - 1) {
            duration = arr[idx+1].t - n.t;
        } else if (idx === arr.length - 1) {
            duration = Math.max(n.d, 6); 
        }

        const jitter = this.mood === 'anxious' ? (this.random.next() * 0.4 - 0.2) : 0;
        const timeInTicks = Math.max(0, n.t + jitter);

        const targetNote = chord.rootNote + 36 + registerLift + (DEGREE_TO_SEMITONE[n.deg] || 0);

        return {
            type: 'melody',
            note: Math.min(targetNote, this.MELODY_CEILING),
            time: timeInTicks * tickDur,
            duration: duration * tickDur,
            weight: 0.8 + (tension * 0.2),
            technique: n.tech,
            dynamics: tension > 0.6 ? 'mf' : 'p',
            phrasing: 'legato',
            harmonicContext: phaseName
        };
    });
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
                  note: Math.min(notes[noteIdx], this.MELODY_CEILING),
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

  private generateInitialAxiom(tension: number, epoch: number, dna: SuiteDNA): MelodicAxiomNote[] {
    if (dna.seedLickId && BLUES_SOLO_LICKS[dna.seedLickId]) {
        const rawLick = BLUES_SOLO_LICKS[dna.seedLickId].phrase;
        const transformedLick = transformLick(rawLick, this.seed, epoch);
        
        return transformedLick.map(note => ({
            deg: note.deg,
            t: note.t,
            d: note.d,
            tech: (note.tech as Technique) || 'pick'
        }));
    }

    const axiom: MelodicAxiomNote[] = [];
    const pool = ['R', 'b3', '4', '5', 'b7', this.thematicDegree];
    const count = tension > 0.6 ? 4 : 3; 
    const startAnchors = ['R', '5', ...(dna.thematicAnchors || [])];
    
    for (let i = 0; i < count; i++) {
        const stepSeed = this.seed + i + 100 + epoch;
        const deg = (i === 0) 
            ? startAnchors[calculateMusiNum(epoch, 3, this.seed, startAnchors.length)]
            : pool[calculateMusiNum(stepSeed, 3, i, pool.length)];
            
        axiom.push({ 
            deg, 
            t: i * 2.5, 
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

        return { ...note, deg: newDeg, tech: newTech, t: note.t }; 
    }).slice(0, 6);
  }

  private generateDrums(epoch: number, tempo: number, tension: number, lastBarHadMelody: boolean): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch, 3, this.seed, kitPool.length)];
    if (!p) return [];
    
    const events: FractalEvent[] = [];
    const barIn12 = epoch % 12;
    
    const isBreathBar = calculateMusiNum(epoch, 13, this.seed, 100) === 7;
    if (isBreathBar) return [];

    if (!lastBarHadMelody && tension > 0.3) {
        const percIds = ['perc-012', 'perc-013', 'perc-014', 'perc-015'];
        const pId = percIds[calculateMusiNum(epoch, 7, this.seed, percIds.length)];
        [3, 9].forEach(t => {
            events.push(this.createDrumEvent(pId as any, t * tickDur, 0.4 + (tension * 0.2), 'p'));
        });
    }

    if (barIn12 === 11) {
        const toms = ['drum_tom_high', 'drum_tom_mid', 'drum_tom_low'];
        [0, 3, 6, 9].forEach((t, i) => {
            const tomId = toms[i % toms.length];
            events.push(this.createDrumEvent(tomId as any, t * tickDur, 0.6 + (tension * 0.2), 'mf'));
        });
    }
    
    if (p.HH) p.HH.forEach(t => events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.3 + (tension * 0.4), 'p')));
    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.7 + (tension * 0.2), tension > 0.7 ? 'mf' : 'p')));
    if (p.SD) p.SD.forEach(t => events.push(this.createDrumEvent('drum_snare', t * tickDur, 0.3 + (tension * 0.6), 'mf')));
    
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

  private generatePianoMotif(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const root = chord.rootNote + 36;
    const isMinor = chord.chordType === 'minor';
    const notes = [root + 7, root + 10, root + (isMinor ? 15 : 16)]; 
    
    const events: FractalEvent[] = [];
    const density = 0.25 + (tension * 0.2); 
    
    [1, 2, 3].forEach(beat => {
        if (calculateMusiNum(epoch + beat, 7, this.seed + 50, 10) / 10 < density) {
            events.push({
                type: 'pianoAccompaniment',
                note: Math.min(notes[calculateMusiNum(epoch + beat, 3, this.seed, 3)], this.MELODY_CEILING),
                time: beat * beatDur + (this.random.next() * 0.1), 
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
          const chordName = isMinor ? 'Am7' : 'E7'; 
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
          const degree = (epoch % 8 < 4) ? 7 : 0;
          events.push({
              type: 'harmony',
              note: root + 48 + degree,
              time: 0.5,
              duration: 3.0,
              weight: 0.25 + (tension * 0.2),
              technique: 'swell',
              dynamics: 'p',
              phrasing: 'legate'
          });
      }
      return events;
  }

  private generateAccompaniment(epoch: number, chord: GhostChord, tempo: number, tension: number, currentPattern: string): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const pattern = GUITAR_PATTERNS[currentPattern] || GUITAR_PATTERNS['F_TRAVIS'];
    const voicing = BLUES_GUITAR_VOICINGS['E7_open'];
    const events: FractalEvent[] = [];
    const steps = (tension > 0.6 || currentPattern.startsWith('S_')) ? pattern.pattern : [pattern.pattern[0]];
    
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
        events.push({ type: 'melody', note: Math.min(last.note! + 5, this.MELODY_CEILING), time: last.time + last.duration + 0.3, duration: 1.2, weight: 0.95, technique: 'vibrato', dynamics: 'mf', phrasing: 'sostenuto', harmonicContext: 'RESOLUTION' });
        this.lastAscendingBar = epoch;
      }
    }
    return events;
  }
}
