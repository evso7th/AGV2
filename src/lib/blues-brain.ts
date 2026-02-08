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
 * #ЗАЧЕМ: Блюзовый Мозг V40.0 — "The Suspense Injection".
 * #ЧТО: 1. Реализован Glitch Injection для настроения 'anxious' (сверхвысокие ноты-скрипы).
 *       2. Внедрен Ритмический Джиттер для создания эффекта нестабильности.
 *       3. Порог перехода в Соло поднят до 0.55 для минорных блюзов.
 */

const ENERGY_PRICES = {
    solo: 50,
    bass_walking: 20,
    bass_pedal: 5,
    drums_full: 10,
    drums_minimal: 5,
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
  private readonly GLITCH_FLOOR = 100; // Питч-стресс для скрипов
  private readonly patternOptions: string[] = ['F_TRAVIS', 'F_ROLL12', 'S_SWING'];

  private phraseHistory: string[] = [];
  private pianoHistory: string[] = [];
  private pianoStagnationOffset: number = 0;
  
  private readonly MAX_HISTORY_DEPTH = 24;

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
      nextInRange: (min: number, max: number) => min + next() * (max - min),
       shuffle: <T>(array: T[]): T[] => {
        let currentIndex = array.length, randomIndex;
        const newArray = [...array];
        while (currentIndex !== 0) {
            randomIndex = Math.floor(next() * currentIndex);
            currentIndex--;
            [newArray[currentIndex], newArray[randomIndex]] = [newArray[currentIndex], newArray[randomIndex]];
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
    const bpmFactor = Math.min(1.0, 75 / tempo);
    
    console.log(`%c[ENERGY @ Bar ${epoch}] Tension: ${tension.toFixed(3)} | Phase: ${getChordNameForBar(barIn12)}`, 'color: #FB923C; font-weight: bold;');

    this.evaluateTimbralDramaturgy(tension, hints, this.mood, epoch);
    
    const barBudget = 180 + (tension * 120); 
    let consumedEnergy = 0;
    
    const combinedEvents: FractalEvent[] = [];
    const currentPianoEvents: FractalEvent[] = [];
    
    const isMellowMood = ['dark', 'melancholic', 'anxious', 'gloomy', 'contemplative', 'calm'].includes(this.mood);

    if (hints.melody) {
      const prog = hints.summonProgress?.melody ?? 1.0;
      let melodyEvents: FractalEvent[] = [];
      
      const soloThreshold = isMellowMood ? 0.55 : 0.4;
      const canAffordSolo = (consumedEnergy + ENERGY_PRICES.solo <= barBudget) && tension > soloThreshold;
      
      if (canAffordSolo) {
          melodyEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna, bpmFactor);
          consumedEnergy += ENERGY_PRICES.solo;
      } else {
          melodyEvents = this.generateFingerstyleMelody(epoch, currentChord, tempo, tension, bpmFactor);
          consumedEnergy += ENERGY_PRICES.harmony; 
      }
      
      // #ЗАЧЕМ: Реализация Саспенс-Глитча для Anxious Blues.
      // #ЧТО: Впрыск сверхвысокой ноты-скрипа раз в 10 тактов.
      if (this.mood === 'anxious' && epoch % 10 === 0 && this.random.next() < 0.4) {
          console.log('%c[SOR] Injecting Dread Glitch...', 'color: #ef4444');
          melodyEvents.push({
              type: 'melody',
              note: this.GLITCH_FLOOR + this.random.nextInt(12),
              time: this.random.nextInRange(0.5, 3.5),
              duration: 0.05, // Короткий чирп
              weight: 0.3,
              technique: 'harm',
              dynamics: 'p',
              phrasing: 'staccato'
          });
      }

      melodyEvents.forEach(e => { e.weight *= prog; });
      combinedEvents.push(...this.applyAntiFuneralMarch(melodyEvents, epoch, tension));
    }

    if (hints.pianoAccompaniment) {
        const pEvents = this.generatePianoMotif(epoch, currentChord, tempo, tension, bpmFactor);
        pEvents.forEach(e => { e.weight *= (0.4 * (hints.summonProgress?.pianoAccompaniment ?? 1.0)); }); 
        currentPianoEvents.push(...pEvents);
        combinedEvents.push(...pEvents);
        consumedEnergy += ENERGY_PRICES.piano;
    }

    this.auditStagnation(combinedEvents, currentPianoEvents, currentChord, tempo, dna, epoch);
    
    // #ЗАЧЕМ: Ритмический Джиттер для Anxious Blues.
    if (this.mood === 'anxious') {
        combinedEvents.forEach(e => {
            if (e.type !== 'rest') {
                e.time += (this.random.next() * 0.08 - 0.04); // ±40ms
            }
        });
    }

    events.push(...combinedEvents);

    if (hints.bass) {
      const isWalking = (tension > 0.55);
      const bassEvents = this.generateBass(epoch, currentChord, tempo, tension, isWalking, bpmFactor);
      bassEvents.forEach(e => { e.weight *= (hints.summonProgress?.bass ?? 1.0); });
      events.push(...bassEvents);
    }

    if (hints.drums) {
      const drumEvents = this.generateDrums(epoch, tempo, tension, lastEvents.length > 0, bpmFactor);
      drumEvents.forEach(e => { e.weight *= (hints.summonProgress?.drums ?? 1.0); });
      events.push(...drumEvents);
    }

    if (hints.harmony) {
        const harmEvents = this.generateHarmonyEvents(epoch, currentChord, tempo, tension, hints.harmony);
        harmEvents.forEach(e => { e.weight *= (hints.summonProgress?.harmony ?? 1.0); });
        events.push(...harmEvents);
    }

    if (hints.accompaniment) {
        const timbre = hints.accompaniment as string;
        const isGuitarLike = timbre.includes('guitar') || timbre.includes('blackAcoustic');
        
        let accEvents: FractalEvent[] = [];
        if (isGuitarLike) {
            const currentPattern = this.patternOptions[calculateMusiNum(Math.floor(epoch/8), 3, this.seed, this.patternOptions.length)];
            accEvents = this.generateAccompaniment(epoch, currentChord, tempo, tension, currentPattern);
        } else {
            accEvents = this.generateSustainedAccompaniment(epoch, currentChord, tempo, tension);
        }
        
        accEvents.forEach(e => { e.weight *= (hints.summonProgress?.accompaniment ?? 1.0); });
        events.push(...accEvents);
    }

    return events;
  }

  private auditStagnation(combined: FractalEvent[], currentPiano: FractalEvent[], chord: GhostChord, tempo: number, dna: SuiteDNA, epoch: number) {
      const pianoHash = this.getSpecificShapeHash(currentPiano, chord.rootNote, tempo);
      
      if (currentPiano.length > 0) {
          const tickDur = (60 / tempo) / 3;
          const seqStr = currentPiano.map(e => `${this.getMidiNoteName(e.note)}(T:${Math.round(e.time / tickDur)})`).join(', ');
          console.debug(`[SOR] Bar ${epoch} Piano Sequence: [${seqStr}]`);
      }

      if (pianoHash !== "SILENCE") {
          this.pianoHistory.push(pianoHash);
          if (this.pianoHistory.length > this.MAX_HISTORY_DEPTH) this.pianoHistory.shift();
          const pStag = this.detectSequenceStagnation(this.pianoHistory);
          if (pStag > 0) {
              console.warn(`%c[SOR] PIANO STAGNATION DETECTED (${pStag}-bar loop). Injecting Heavy Vaccine!`, 'color: #ff00ff; font-weight: bold;');
              this.pianoStagnationOffset += (this.random.nextInt(1000) + 500);
              this.pianoHistory = [];
          }
      }

      const ensembleHash = this.getMelodicShapeHash(combined, chord.rootNote, tempo);
      if (ensembleHash) {
          this.phraseHistory.push(ensembleHash);
          if (this.phraseHistory.length > this.MAX_HISTORY_DEPTH) this.phraseHistory.shift();
          const eStag = this.detectSequenceStagnation(this.phraseHistory);
          if (eStag > 0) {
              console.warn(`%c[SOR] ENSEMBLE STAGNATION DETECTED (${eStag}-bar loop). Forcing L-Evolution!`, 'color: #ff00ff; font-weight: bold;');
              this.currentAxiom = this.evolveAxiom(this.currentAxiom, 0.99, 'CLIMAX', dna, epoch);
              this.phraseHistory = []; 
          }
      }
  }

  private detectSequenceStagnation(history: string[]): number {
      const lengths = [4, 2, 1];
      for (const L of lengths) {
          if (history.length < 3 * L) continue;
          const seq1 = history.slice(-L).join('|');
          const seq2 = history.slice(-2 * L, -L).join('|');
          const seq3 = history.slice(-3 * L, -2 * L).join('|');
          if (seq1 === seq2 && seq2 === seq3) return L;
      }
      return 0;
  }

  private getSpecificShapeHash(events: FractalEvent[], rootNote: number, tempo: number): string {
      if (events.length === 0) return "SILENCE";
      const tickDur = (60 / tempo) / 3;
      return events.sort((a, b) => a.time - b.time).map(e => `${(e.note - rootNote) % 12}:${Math.round(e.time / tickDur)}`).join('|');
  }

  private getMelodicShapeHash(events: FractalEvent[], rootNote: number, tempo: number): string {
      const tracked = events.filter(e => e.type === 'melody' || e.type === 'pianoAccompaniment');
      if (tracked.length === 0) return "";
      const tickDur = (60 / tempo) / 3;
      return tracked.sort((a, b) => a.time - b.time).map(e => `${e.type === 'melody' ? 'M' : 'P'}:${(e.note - rootNote) % 12}:${Math.round(e.time / tickDur)}`).join('|');
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints, mood: Mood, epoch: number) {
    if (hints.melody) {
        if (tension <= 0.50) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.80) (hints as any).melody = 'cs80';
        else (hints as any).melody = 'guitar_shineOn';
    }
    if (hints.bass) {
        if (tension < 0.4) (hints as any).bass = 'bass_jazz_warm';
        else if (tension < 0.75) (hints as any).bass = 'bass_reggae';
        else (hints as any).bass = 'bass_808';
    }
    if (hints.accompaniment) {
        if (tension < 0.5) (hints as any).accompaniment = 'ep_rhodes_warm';
        else (hints as any).accompaniment = 'organ_soft_jazz';
    }
  }

  private generateLSystemMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number, dna: SuiteDNA, bpmFactor: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const phaseInSentence = epoch % 4; 
    let phaseName: any = 'CALL';
    if (barIn12 === 11) phaseName = 'TURNAROUND';
    else if (phaseInSentence < 2) phaseName = 'CALL';
    else if (phaseInSentence === 2) phaseName = 'RESPONSE';
    else phaseName = (tension > 0.7) ? 'CLIMAX' : 'RESPONSE';

    if (this.currentAxiom.length === 0) {
        if (dna.seedLickNotes) {
            this.currentAxiom = dna.seedLickNotes.map(note => ({ deg: note.deg, t: note.t, d: note.d, tech: (note.tech as Technique) || 'pick' }));
        } else {
            this.currentAxiom = this.generateInitialAxiom(tension, epoch, dna);
        }
    } else if (phaseInSentence === 0) {
        this.currentAxiom = this.evolveAxiom(this.currentAxiom, tension, phaseName, dna, epoch);
    }

    const registerLift = (tension > 0.7 || phaseName === 'CLIMAX') ? 12 : 0;
    const skipChance = 1.0 - bpmFactor;

    return this.currentAxiom.map((n, idx, arr) => {
        if (this.random.next() < skipChance && n.deg !== 'R') return null; 
        const dur = (idx < arr.length - 1) ? (arr[idx+1].t - n.t) : Math.max(n.d, 6);
        const jitter = 0; // Jitter is now applied globally in generateBar for Anxious
        return {
            type: 'melody', note: Math.min(chord.rootNote + 36 + registerLift + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: Math.max(0, n.t + jitter) * tickDur, duration: dur * tickDur, weight: 0.8 + (tension * 0.2), technique: n.tech, dynamics: tension > 0.6 ? 'mf' : 'p', phrasing: 'legato', harmonicContext: phaseName
        };
    }).filter(e => e !== null) as FractalEvent[];
  }

  private generateFingerstyleMelody(epoch: number, chord: GhostChord, tempo: number, tension: number, bpmFactor: number): FractalEvent[] {
      const beatDur = 60 / tempo;
      const root = chord.rootNote + 36;
      const isMinor = chord.rootNote % 12 === 4 || chord.rootNote % 12 === 9; 
      const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];
      const events: FractalEvent[] = [];
      const baseDensity = 0.3 + (tension * 0.3);
      const density = baseDensity * bpmFactor;

      [0, 1, 2, 3].forEach(beat => {
          if (calculateMusiNum(epoch + beat, 3, this.seed, 10) / 10 < density) {
              events.push({
                  type: 'melody', note: Math.min(notes[calculateMusiNum(epoch + beat, 5, this.seed, 4)], this.MELODY_CEILING),
                  time: beat * beatDur, duration: beatDur * 0.8, weight: 0.5 + (tension * 0.3), technique: 'pick', dynamics: 'p', phrasing: 'detached'
              });
          }
      });
      return events;
  }

  private generateInitialAxiom(tension: number, epoch: number, dna: SuiteDNA): MelodicAxiomNote[] {
    const axiom: MelodicAxiomNote[] = [];
    const pool = ['R', 'b3', '4', '5', 'b7', this.thematicDegree];
    const count = tension > 0.6 ? 4 : 3; 
    for (let i = 0; i < count; i++) {
        axiom.push({ deg: pool[calculateMusiNum(this.seed + i + epoch, 3, i, pool.length)], t: i * 2.5, d: 3, tech: 'pick' });
    }
    return axiom;
  }

  private evolveAxiom(axiom: MelodicAxiomNote[], tension: number, phase: string, dna: SuiteDNA, epoch: number): MelodicAxiomNote[] {
    return axiom.map((note, i) => {
        let newDeg = note.deg; let newTech = note.tech;
        if (tension > 0.65 && phase === 'CLIMAX' && calculateMusiNum(epoch, 7, this.seed, 10) > 6) {
            newDeg = ['5', 'b7', 'R+8', '9'][calculateMusiNum(epoch + i, 3, this.seed, 4)]; newTech = 'bend';
        } else if (phase === 'RESPONSE' && i === axiom.length - 1) {
            newDeg = (dna.thematicAnchors?.[0] as any) || 'R'; newTech = 'vibrato';
        }
        return { ...note, deg: newDeg, tech: newTech }; 
    }).slice(0, 6);
  }

  private generateDrums(epoch: number, tempo: number, tension: number, isEnsemble: boolean, bpmFactor: number): FractalEvent[] {
    const tickDur = (60 / tempo) / 3;
    const isMellowMood = ['dark', 'melancholic', 'anxious', 'gloomy', 'contemplative', 'calm'].includes(this.mood);
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch, 3, this.seed, kitPool.length)];
    if (!p) return [];
    const events: FractalEvent[] = [];
    const barIn12 = epoch % 12;
    
    const effectiveBpmFactor = Math.max(bpmFactor, 0.85);
    if (calculateMusiNum(epoch, 13, this.seed, 100) / 100 > effectiveBpmFactor) return [];

    const kickSample = isMellowMood 
        ? (calculateMusiNum(epoch, 2, this.seed, 2) === 0 ? 'drum_drum_kick_reso' : 'drum_kick_drum6')
        : 'drum_kick';

    if (tension > 0.6) {
        const extraTicks = [2, 5, 8, 11];
        const extraPool = [
            'drum_bongo_pc-01', 'drum_bongo_pc-02', 'drum_bongo_pc-03',
            'drum_bongo_pvc-tube-01', 'drum_bongo_pvc-tube-02', 'drum_bongo_pvc-tube-03',
            'perc-012', 'perc-013', 'perc-014', 'perc-015'
        ];
        
        extraTicks.forEach(t => {
            if (this.random.next() < 0.35 * tension) {
                const percId = extraPool[this.random.nextInt(extraPool.length)] as any;
                events.push(this.createDrumEvent(percId, t * tickDur, 0.22, 'p'));
            }
        });
        
        if (tension > 0.85 && barIn12 % 4 === 0) {
            events.push(this.createDrumEvent('drum_ride', 0, 0.35, 'p'));
        }
    } else if (tension < 0.4 && isMellowMood) {
        if (epoch % 2 === 0) {
            const tomId = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'][this.random.nextInt(3)];
            events.push(this.createDrumEvent(tomId as any, 9 * tickDur, 0.35, 'p'));
        }
        
        [3, 9].forEach(t => {
            if (this.random.next() < 0.45) {
                const moodPerc = ['drum_bongo_pvc-tube-01', 'drum_bongo_pc-02', 'perc-013'][this.random.nextInt(3)];
                events.push(this.createDrumEvent(moodPerc as any, t * tickDur, 0.18, 'p'));
            }
        });
    }

    if (!isEnsemble && tension > 0.3) {
        [3, 9].forEach(t => events.push(this.createDrumEvent('perc-013', t * tickDur, 0.3, 'p')));
    }
    
    if (barIn12 === 11 && !isMellowMood) { 
        ['drum_tom_high', 'drum_tom_low'].forEach((tom, i) => events.push(this.createDrumEvent(tom as any, i * 3 * tickDur, 0.7, 'mf')));
    }

    if (p.HH) p.HH.forEach(t => {
        const hhWeight = isMellowMood ? 0.35 : (0.3 + (tension * 0.4));
        if (this.random.next() < effectiveBpmFactor) events.push(this.createDrumEvent('drum_hihat', t * tickDur, hhWeight, 'p'));
    });

    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent(kickSample as any, t * tickDur, 0.7 + (tension * 0.2), 'p')));
    if (p.SD) p.SD.forEach(t => {
        const snareSample = isMellowMood && tension < 0.5 ? 'drum_snare_ghost_note' : 'drum_snare';
        events.push(this.createDrumEvent(snareSample as any, t * tickDur, 0.3 + (tension * 0.6), 'mf'));
    });
    
    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number, tension: number, isWalking: boolean, bpmFactor: number): FractalEvent[] {
    const tickDur = (60 / tempo) / 3;
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    const riff = riffs[calculateMusiNum(Math.floor(epoch / 4), 5, this.seed, riffs.length)];
    const barIn12 = epoch % 12;
    
    let pattern = (!isWalking) ? [{ t: 0, d: 12, deg: 'R' as BluesRiffDegree }] : riff.I;
    if (barIn12 === 11) pattern = riff.turn;
    else if ([4, 5, 9, 10].includes(barIn12)) pattern = riff.IV;
    else if ([8].includes(barIn12)) pattern = riff.V;

    return pattern.map((n, i) => {
        if (tempo > 100 && i % 2 === 1 && n.deg !== 'R') return null;
        return { 
            type: 'bass', 
            note: chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), 
            time: n.t * tickDur, 
            duration: (n.d || 2) * tickDur, 
            weight: 0.7 + tension * 0.2, 
            technique: 'pluck', 
            dynamics: tension > 0.6 ? 'mf' : 'p', 
            phrasing: 'legato' 
        };
    }).filter(e => e !== null) as FractalEvent[];
  }

  private generatePianoMotif(epoch: number, chord: GhostChord, tempo: number, tension: number, bpmFactor: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const root = chord.rootNote + 36;
    const notes = [root + 7, root + 10, root + 12]; 
    const events: FractalEvent[] = [];
    const density = (0.2 + (tension * 0.2)) * bpmFactor; 
    
    [1, 2, 3].forEach(beat => {
        const musiInput = epoch + beat + this.pianoStagnationOffset;
        if (calculateMusiNum(musiInput, 7, this.seed, 10) / 10 < density) {
            events.push({ 
                type: 'pianoAccompaniment', 
                note: notes[calculateMusiNum(musiInput, 3, this.seed, 3)], 
                time: beat * beatDur, 
                duration: beatDur, 
                weight: 0.4, 
                technique: 'hit', 
                dynamics: 'p', 
                phrasing: 'staccato' 
            });
        }
    });
    return events;
  }

  private generateHarmonyEvents(epoch: number, chord: GhostChord, tempo: number, tension: number, instrument: any): FractalEvent[] {
      const root = chord.rootNote;
      if (instrument === 'guitarChords') {
          return [{ type: 'harmony', note: root + 24, time: 0, duration: 4.0, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato', chordName: chord.chordType === 'minor' ? 'Am' : 'E', params: { barCount: epoch } }];
      }
      return [];
  }

  private generateAccompaniment(epoch: number, chord: GhostChord, tempo: number, tension: number, currentPattern: string): FractalEvent[] {
    const beatDur = 60 / tempo; const tickDur = beatDur / 3;
    const pattern = GUITAR_PATTERNS[currentPattern] || GUITAR_PATTERNS['F_TRAVIS'];
    const voicing = BLUES_GUITAR_VOICINGS['E7_open'];
    const events: FractalEvent[] = [];
    pattern.pattern.forEach(step => step.ticks.forEach(t => step.stringIndices.forEach(idx => {
          events.push({ type: 'accompaniment', note: chord.rootNote + (voicing[idx] - 40), time: t * tickDur, duration: beatDur * 2.0, weight: 0.3, technique: 'pluck', dynamics: 'p', phrasing: 'detached' });
    })));
    return events;
  }

  private generateSustainedAccompaniment(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
      const root = chord.rootNote;
      const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
      const notes = [root, root + (isMinor ? 3 : 4), root + 7];
      
      return notes.map((note, i) => ({
          type: 'accompaniment',
          note: note + 12,
          time: i * 0.1, 
          duration: 4.0, 
          weight: 0.3, 
          technique: 'swell',
          dynamics: 'p',
          phrasing: 'legato'
      }));
  }

  private createDrumEvent(type: any, time: number, weight: number, dynamics: Dynamics): any {
    return { type, time, duration: 0.1, weight, technique: 'hit', dynamics, phrasing: 'staccato' };
  }

  private applyAntiFuneralMarch(events: FractalEvent[], epoch: number, tension: number): FractalEvent[] {
    if (epoch - this.lastAscendingBar >= 6 && tension > 0.6) {
      const melody = events.filter(e => e.type === 'melody');
      if (melody.length > 0) {
        const last = melody[melody.length - 1];
        events.push({ type: 'melody', note: last.note! + 5, time: last.time + last.duration + 0.3, duration: 1.2, weight: 0.95, technique: 'vibrato', dynamics: 'mf', phrasing: 'sostenuto' });
        this.lastAscendingBar = epoch;
      }
    }
    return events;
  }

  private getMidiNoteName(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    return `${notes[midi % 12]}${octave}`;
  }
}

function getChordNameForBar(barIndex: number): string {
  const progression = ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'v7', 'iv7', 'i7', 'v7'];
  return progression[barIndex % 12];
}
