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
 * #ЗАЧЕМ: Блюзовый Мозг V24.0 — "Organic L-Logic Restoration".
 * #ЧТО: Удалена принудительная трансформация каждые 4 такта.
 *       Теперь развитие фразы идет исключительно через L-систему (evolveAxiom).
 *       Первоначальный "ген" лика берется из dna.seedLickNotes.
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
      nextInRange: (min: number, max: number) => min + next() * (max - min),
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
    
    const barBudget = 150 + (tension * 100);
    let consumedEnergy = 0;
    const previouslyPlaying = new Set(lastEvents.map(e => Array.isArray(e.type) ? e.type[0] : e.type));
    const getPrice = (basePrice: number, part: string) => previouslyPlaying.has(part as any) ? basePrice * 0.7 : basePrice;

    // 1. MELODY & PIANO
    const combinedEvents: FractalEvent[] = [];
    
    if (hints.melody) {
      const price = getPrice(ENERGY_PRICES.solo, 'melody');
      if (consumedEnergy + price <= barBudget) {
          const prog = hints.summonProgress?.melody ?? 1.0;
          let melodyEvents: FractalEvent[] = [];
          if (this.phrasePauseTimer > 0) { this.phrasePauseTimer--; } 
          else {
              const melodyStyle = tension > 0.65 ? 'solo' : 'fingerstyle';
              melodyEvents = (melodyStyle === 'solo') 
                ? this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna)
                : this.generateFingerstyleMelody(epoch, currentChord, tempo, tension);
              
              melodyEvents.forEach(e => { e.weight *= prog; });
              combinedEvents.push(...this.applyAntiFuneralMarch(melodyEvents, epoch, tension));
          }
          consumedEnergy += price;
      }
    }

    const pianoPrice = getPrice(ENERGY_PRICES.piano, 'pianoAccompaniment');
    if (hints.pianoAccompaniment && (consumedEnergy + pianoPrice <= barBudget)) {
        const pianoEvents = this.generatePianoMotif(epoch, currentChord, tempo, tension);
        pianoEvents.forEach(e => { e.weight *= (0.4 * (hints.summonProgress?.pianoAccompaniment ?? 1.0)); }); 
        combinedEvents.push(...pianoEvents);
        consumedEnergy += pianoPrice;
    }

    const shapeHash = this.getMelodicShapeHash(combinedEvents, currentChord.rootNote);
    if (this.isRepetitive(shapeHash)) {
        console.info(`%c[SOR] ENSEMBLE STAGNATION: Lead & Piano Loop Detected. Forcing Organic Shift.`, 'color: #ff4500; font-weight: bold; background: #222;');
        // #ЗАЧЕМ: При зацикливании мы не просто сбрасываем аксиому, 
        //         мы принудительно вызываем эволюцию Л-системы.
        this.currentAxiom = this.evolveAxiom(this.currentAxiom, tension, 'CLIMAX', dna, epoch);
        this.phraseHistory = [];
    } else if (shapeHash) {
        this.phraseHistory.push(shapeHash);
        if (this.phraseHistory.length > 8) this.phraseHistory.shift();
    }
    
    events.push(...combinedEvents);

    // 2. BASS
    if (hints.bass) {
      const isWalking = (tension > 0.6);
      const price = getPrice(isWalking ? ENERGY_PRICES.bass_walking : ENERGY_PRICES.bass_pedal, 'bass');
      if (consumedEnergy + price <= barBudget) {
        const bassEvents = this.generateBass(epoch, currentChord, tempo, tension, isWalking);
        bassEvents.forEach(e => { e.weight *= (hints.summonProgress?.bass ?? 1.0); });
        events.push(...bassEvents);
        consumedEnergy += price;
      }
    }

    // 3. DRUMS
    if (hints.drums) {
      const price = getPrice(tension > 0.5 ? ENERGY_PRICES.drums_full : ENERGY_PRICES.drums_minimal, 'drums');
      if (consumedEnergy + price <= barBudget) {
        const drumEvents = this.generateDrums(epoch, tempo, tension, lastEvents.length > 0);
        drumEvents.forEach(e => { e.weight *= (hints.summonProgress?.drums ?? 1.0); });
        events.push(...drumEvents);
        consumedEnergy += price;
      }
    }

    // 4. HARMONY & ACCOMPANIMENT
    const harmPrice = getPrice(ENERGY_PRICES.harmony, 'harmony');
    if (hints.harmony && (consumedEnergy + harmPrice <= barBudget)) {
        const harmEvents = this.generateHarmonyEvents(epoch, currentChord, tempo, tension, hints.harmony);
        harmEvents.forEach(e => { e.weight *= (hints.summonProgress?.harmony ?? 1.0); });
        events.push(...harmEvents);
        consumedEnergy += harmPrice;
    }

    const accPrice = getPrice(ENERGY_PRICES.harmony, 'accompaniment');
    if (hints.accompaniment && (consumedEnergy + accPrice <= barBudget)) {
        const currentPattern = this.patternOptions[calculateMusiNum(Math.floor(epoch/8), 3, this.seed, this.patternOptions.length)];
        const accEvents = this.generateAccompaniment(epoch, currentChord, tempo, tension, currentPattern);
        accEvents.forEach(e => { e.weight *= (hints.summonProgress?.accompaniment ?? 1.0); });
        events.push(...accEvents);
        consumedEnergy += accPrice;
    }

    if (hints.sparkles) {
        const cat = (hints as any).sparkleCategory || 'ambient_common';
        events.push({
            type: 'sparkle', time: this.random.nextInRange(0, 3), duration: 0.1, weight: 0.5,
            technique: 'hit', dynamics: 'p', phrasing: 'staccato',
            params: { mood: this.mood, genre: 'blues', category: cat }
        });
    }
    if (hints.sfx) {
        events.push({
            type: 'sfx', time: this.random.nextInRange(0, 2), duration: 1.0, weight: 0.4,
            technique: 'hit', dynamics: 'p', phrasing: 'legato',
            params: { mood: this.mood, genre: 'blues', category: 'common' }
        });
    }

    return events;
  }

  private getMelodicShapeHash(events: FractalEvent[], rootNote: number): string {
      const tracked = events.filter(e => e.type === 'melody' || e.type === 'pianoAccompaniment');
      if (tracked.length === 0) return "";
      
      return tracked
        .sort((a, b) => a.time - b.time)
        .map(e => {
            const typeId = e.type === 'melody' ? 'M' : 'P';
            const relativeNote = (e.note - rootNote) % 12;
            return `${typeId}:${relativeNote}:${e.time.toFixed(2)}`;
        })
        .join('|');
  }

  private isRepetitive(newHash: string): boolean {
      if (!newHash || this.phraseHistory.length < this.MAX_REPETITION_COUNT) return false;
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
    }
  }

  /**
   * #ЗАЧЕМ: Реализация Л-логики развития мелодии.
   * #ЧТО: Берет лик-ген из dna.seedLickNotes при рождении, затем только эволюционирует.
   */
  private generateLSystemMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number, dna: SuiteDNA): FractalEvent[] {
    const beatDur = 60 / tempo;
    const tickDur = beatDur / 3;
    const phaseInSentence = epoch % 4; 
    let phaseName: any = 'CALL';
    if (barIn12 === 11) phaseName = 'TURNAROUND';
    else if (phaseInSentence < 2) phaseName = 'CALL';
    else if (phaseInSentence === 2) phaseName = 'RESPONSE';
    else phaseName = (tension > 0.7) ? 'CLIMAX' : 'RESPONSE';

    // #ИСПРАВЛЕНО (ПЛАН 242): Первоначальная аксиома берется из ДНК (уже трансформированная).
    if (this.currentAxiom.length === 0) {
        if (dna.seedLickNotes) {
            console.log(`%c[SOR] L-SYSTEM: Initializing with Birth Lick-Seed`, 'color: #00BFFF; font-weight:bold;');
            this.currentAxiom = dna.seedLickNotes.map(note => ({ 
                deg: note.deg, t: note.t, d: note.d, tech: (note.tech as Technique) || 'pick' 
            }));
        } else {
            this.currentAxiom = this.generateInitialAxiom(tension, epoch, dna);
        }
    } else if (phaseInSentence === 0) {
        // #ЗАЧЕМ: Органическая эволюция фразы каждые 4 такта.
        // #ЧТО: Используем evolveAxiom вместо подмены из библиотеки.
        console.log(`%c[SOR] L-SYSTEM: Organic Evolution of Phrase at Bar ${epoch}`, 'color: #DA70D6');
        this.currentAxiom = this.evolveAxiom(this.currentAxiom, tension, phaseName, dna, epoch);
    }

    const registerLift = (tension > 0.7 || phaseName === 'CLIMAX') ? 12 : 0;
    return this.currentAxiom.map((n, idx, arr) => {
        const dur = (idx < arr.length - 1) ? (arr[idx+1].t - n.t) : Math.max(n.d, 6);
        const jitter = this.mood === 'anxious' ? (this.random.next() * 0.4 - 0.2) : 0;
        return {
            type: 'melody', note: Math.min(chord.rootNote + 36 + registerLift + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: Math.max(0, n.t + jitter) * tickDur, duration: dur * tickDur, weight: 0.8 + (tension * 0.2), technique: n.tech, dynamics: tension > 0.6 ? 'mf' : 'p', phrasing: 'legato', harmonicContext: phaseName
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

  /**
   * #ЗАЧЕМ: Л-правила развития фразы.
   * #ЧТО: Применяет музыкальные трансформации к текущей аксиоме.
   */
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

  private generateDrums(epoch: number, tempo: number, tension: number, isEnsemble: boolean): FractalEvent[] {
    const tickDur = (60 / tempo) / 3;
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch, 3, this.seed, kitPool.length)];
    if (!p) return [];
    const events: FractalEvent[] = [];
    const barIn12 = epoch % 12;
    if (calculateMusiNum(epoch, 13, this.seed, 100) === 7) return [];
    if (!isEnsemble && tension > 0.3) {
        [3, 9].forEach(t => events.push(this.createDrumEvent('perc-013', t * tickDur, 0.4, 'p')));
    }
    if (barIn12 === 11) {
        ['drum_tom_high', 'drum_tom_low'].forEach((tom, i) => events.push(this.createDrumEvent(tom as any, i * 3 * tickDur, 0.7, 'mf')));
    }
    if (p.HH) p.HH.forEach(t => events.push(this.createDrumEvent('drum_hihat', t * tickDur, 0.3 + (tension * 0.4), 'p')));
    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent('drum_kick', t * tickDur, 0.7 + (tension * 0.2), 'p')));
    if (p.SD) p.SD.forEach(t => events.push(this.createDrumEvent('drum_snare', t * tickDur, 0.3 + (tension * 0.6), 'mf')));
    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number, tension: number, isWalking: boolean): FractalEvent[] {
    const tickDur = (60 / tempo) / 3;
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    const riff = riffs[calculateMusiNum(Math.floor(epoch / 4), 5, this.seed, riffs.length)];
    const barIn12 = epoch % 12;
    let pattern = (!isWalking) ? [{ t: 0, d: 12, deg: 'R' as BluesRiffDegree }] : riff.I;
    if (barIn12 === 11) pattern = riff.turn;
    else if ([4, 5, 9, 10].includes(barIn12)) pattern = riff.IV;
    else if ([8].includes(barIn12)) pattern = riff.V;

    return pattern.map(n => ({ type: 'bass', note: chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: n.t * tickDur, duration: (n.d || 2) * tickDur, weight: 0.7 + tension * 0.2, technique: 'pluck', dynamics: tension > 0.6 ? 'mf' : 'p', phrasing: 'legato' }));
  }

  private generatePianoMotif(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
    const beatDur = 60 / tempo;
    const root = chord.rootNote + 36;
    const notes = [root + 7, root + 10, root + 12]; 
    const events: FractalEvent[] = [];
    const density = 0.2 + (tension * 0.2); 
    [1, 2, 3].forEach(beat => {
        if (calculateMusiNum(epoch + beat, 7, this.seed, 10) / 10 < density) {
            events.push({ type: 'pianoAccompaniment', note: notes[calculateMusiNum(epoch, 3, this.seed, 3)], time: beat * beatDur, duration: beatDur, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
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
}
