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
  Technique,
  BluesCognitiveState
} from '@/types/music';
import { calculateMusiNum, DEGREE_TO_SEMITONE } from './music-theory';
import { BLUES_DRUM_RIFFS } from './assets/blues-drum-riffs';
import { BLUES_BASS_RIFFS } from './assets/blues-bass-riffs';
import { BLUES_GUITAR_VOICINGS } from './assets/guitar-voicings';
import { GUITAR_PATTERNS } from './assets/guitar-patterns';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V55.1 — "Sentinel Hotfix".
 * #ЧТО: Исправлен TypeError при инициализации истории стагнации.
 * #ОБНОВЛЕНО (ПЛАН №438.1): Поля pianoHistory и accompHistory теперь корректно инициализируются в состоянии.
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

type MelodicAxiomNote = { deg: string, t: number, d: number, tech: Technique, phrasing?: Phrasing };

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private thematicDegree: string;
  private lastAscendingBar: number = -10;
  private currentAxiom: MelodicAxiomNote[] = [];
  private random: any;
  
  private readonly MELODY_CEILING = 73; 
  private readonly BASS_FLOOR = 31; 
  private readonly PIANO_CEILING = 71; 
  private readonly MAX_NOTE_DURATION = 2.0; 
  private readonly NORMAL_NOTE_DURATION = 1.2; 

  private readonly patternOptions: string[] = ['F_TRAVIS', 'F_ROLL12', 'S_SWING'];

  private pianoStagnationOffset: number = 0;
  private globalStagnationOffset: number = 0;
  
  private readonly MAX_HISTORY_DEPTH = 32;

  private state: BluesCognitiveState;

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    this.random = this.createSeededRandom(seed);
    const anchorDegrees = ['R', 'b3', '5', 'b7'];
    this.thematicDegree = anchorDegrees[calculateMusiNum(seed, 3, seed, anchorDegrees.length)];

    this.state = {
      phraseState: 'call',
      tensionLevel: 0.3,
      phraseHistory: [],
      pianoHistory: [], // Инициализация фикса
      accompHistory: [], // Инициализация фикса
      mesoHistory: [],
      macroHistory: [],
      lastPhraseHash: '',
      blueNotePending: false,
      emotion: {
        melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4,
        darkness: ['dark', 'gloomy'].includes(mood) ? 0.35 : 0.2
      },
      stagnationStrikes: { micro: 0, meso: 0, macro: 0 }
    };
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
      nextInRange: (min: number, max: number) => min + next() * (max - min)
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
    const tempo = dna.baseTempo || 72;
    const barIn12 = epoch % 12;
    const bpmFactor = Math.min(1.0, 75 / tempo);
    
    let tension = dna.tensionMap ? (dna.tensionMap[epoch % dna.tensionMap.length] || 0.5) : 0.5;
    const isMainZone = navInfo.currentPart.id.includes('MAIN') || navInfo.currentPart.id.includes('PEAK') || navInfo.currentPart.id.includes('ANTHEM');
    if (isMainZone) tension = Math.max(0.4, tension);

    this.evaluateTimbralDramaturgy(tension, hints, this.mood, epoch);
    
    if (navInfo.isPartTransition && dna.partLickMap?.has(navInfo.currentPart.id)) {
        const nextLickId = dna.partLickMap.get(navInfo.currentPart.id)!;
        console.log(`%c[SOR] Part Transition: Switching to related lick "${nextLickId}"`, 'color: #00ced1; font-weight: bold;');
        this.currentAxiom = BLUES_SOLO_LICKS[nextLickId].phrase.map(n => ({
            deg: n.deg, t: n.t, d: n.d, tech: (n.tech as Technique) || 'pick', phrasing: 'legato'
        }));
    }

    const baseBudget = isMainZone ? 300 : 220;
    const barBudget = baseBudget + (tension * 150); 
    
    let consumedEnergy = 0;
    const combinedEvents: FractalEvent[] = [];
    const currentPianoEvents: FractalEvent[] = [];
    const isMellowMood = ['dark', 'melancholic', 'anxious', 'gloomy', 'contemplative', 'calm'].includes(this.mood);

    if (hints.melody) {
      const prog = hints.summonProgress?.melody ?? 1.0;
      let mEvents: FractalEvent[] = [];
      const soloThreshold = isMainZone ? 0.45 : (isMellowMood ? 0.55 : 0.4);
      const shouldTakeBreath = !isMainZone && tension < 0.5 && calculateMusiNum(epoch, 3, this.seed, 4) === 0;

      if ((consumedEnergy + ENERGY_PRICES.solo <= barBudget) && tension > soloThreshold && !shouldTakeBreath) {
          mEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna, bpmFactor);
          consumedEnergy += ENERGY_PRICES.solo;
      } else {
          mEvents = this.generateFingerstyleMelody(epoch, currentChord, tempo, tension, bpmFactor);
          consumedEnergy += ENERGY_PRICES.harmony; 
      }
      mEvents.forEach(e => { e.weight *= prog; });
      combinedEvents.push(...this.applyAntiFuneralMarch(mEvents, epoch, tension));
    }

    if (hints.pianoAccompaniment) {
        const pEvents = this.generatePianoMotif(epoch, currentChord, tempo, tension, bpmFactor);
        pEvents.forEach(e => { e.weight *= (0.4 * (hints.summonProgress?.pianoAccompaniment ?? 1.0)); }); 
        currentPianoEvents.push(...pEvents);
        combinedEvents.push(...pEvents);
        consumedEnergy += ENERGY_PRICES.piano;
    }

    const currentAccompEvents: FractalEvent[] = [];
    if (hints.accompaniment) {
        const timbre = hints.accompaniment as string;
        let aEvents = (timbre.includes('guitar') || timbre.includes('blackAcoustic'))
            ? this.generateAccompaniment(epoch, currentChord, tempo, tension, this.patternOptions[calculateMusiNum(Math.floor(epoch/8), 3, this.seed + this.globalStagnationOffset, this.patternOptions.length)])
            : this.generateSustainedAccompaniment(epoch, currentChord, tempo, tension);
        aEvents.forEach(e => { e.weight *= (hints.summonProgress?.accompaniment ?? 1.0); });
        currentAccompEvents.push(...aEvents);
        combinedEvents.push(...aEvents);
    }

    this.auditStagnationV4(combinedEvents.filter(e => e.type === 'melody'), currentPianoEvents, currentAccompEvents, currentChord, dna, epoch, tension);
    
    if (hints.bass) {
      const bEvents = this.generateBass(epoch, currentChord, tempo, tension, tension > 0.55, bpmFactor);
      bEvents.forEach(e => { e.weight *= (hints.summonProgress?.bass ?? 1.0); });
      combinedEvents.push(...bEvents);
    }

    if (hints.drums) {
      const dEvents = this.generateDrums(epoch, tempo, tension, lastEvents.length > 0, bpmFactor);
      dEvents.forEach(e => { e.weight *= (hints.summonProgress?.drums ?? 1.0); });
      combinedEvents.push(...dEvents);
    }

    return combinedEvents;
  }

  private auditStagnationV4(melody: FractalEvent[], piano: FractalEvent[], accomp: FractalEvent[], chord: GhostChord, dna: SuiteDNA, epoch: number, tension: number) {
      const parts: ('melody' | 'piano' | 'accompaniment')[] = ['melody', 'piano', 'accompaniment'];
      
      parts.forEach(partName => {
          const events = partName === 'melody' ? melody : (partName === 'piano' ? piano : accomp);
          const currentHash = this.getFuzzyHash(events, chord.rootNote);
          
          // #ИСПРАВЛЕНО: Безопасное получение истории из состояния.
          let history = partName === 'melody' ? this.state.phraseHistory : (partName === 'piano' ? this.state.pianoHistory : this.state.accompHistory);
          
          if (!history) history = []; // Defensive fix

          const mesoHist = partName === 'melody' ? this.state.mesoHistory : [];
          const macroHist = partName === 'melody' ? this.state.macroHistory : [];

          if (currentHash === "SILENCE") return;

          // 1. MICRO AUDIT (1 Bar)
          if (history.length > 0 && currentHash === history[history.length - 1]) {
              this.state.stagnationStrikes.micro++;
              console.warn(`%c[SOR] ${partName.toUpperCase()} MICRO STRIKE ${this.state.stagnationStrikes.micro}/3`, 'color: #ff8c00;');
          } else {
              this.state.stagnationStrikes.micro = 0;
          }

          history.push(currentHash);
          if (history.length > this.MAX_HISTORY_DEPTH) history.shift();

          // 2. MESO AUDIT (2 Bars) - Only for melody
          if (partName === 'melody' && epoch % 2 === 1 && history.length >= 4) {
              const currentMeso = history.slice(-2).join('|');
              const prevMeso = history.slice(-4, -2).join('|');
              if (currentMeso === prevMeso) {
                  this.state.stagnationStrikes.meso++;
                  console.warn(`%c[SOR] MELODY MESO STRIKE ${this.state.stagnationStrikes.meso}/3 (2-bar loop)`, 'color: #ff4500; font-weight: bold;');
              } else {
                  this.state.stagnationStrikes.meso = 0;
              }
              mesoHist.push(currentMeso);
          }

          // 3. MACRO AUDIT (4 Bars) - Only for melody
          if (partName === 'melody' && epoch % 4 === 3 && history.length >= 8) {
              const currentMacro = history.slice(-4).join('|');
              const prevMacro = history.slice(-8, -4).join('|');
              if (currentMacro === prevMacro) {
                  this.state.stagnationStrikes.macro++;
                  console.warn(`%c[SOR] MELODY MACRO STRIKE ${this.state.stagnationStrikes.macro}/3 (4-bar phrase loop)`, 'color: #ff0000; font-weight: bold;');
              } else {
                  this.state.stagnationStrikes.macro = 0;
              }
              macroHist.push(currentMacro);
          }

          // --- REACTION (Vaccination) ---
          if (this.state.stagnationStrikes.micro >= 3) {
              this.injectVaccineV4(partName, 'jitter', dna, epoch);
              this.state.stagnationStrikes.micro = 0;
          } else if (this.state.stagnationStrikes.meso >= 3) {
              this.injectVaccineV4(partName, 'inversion', dna, epoch);
              this.state.stagnationStrikes.meso = 0;
          } else if (this.state.stagnationStrikes.macro >= 3) {
              this.injectVaccineV4(partName, 'transposition', dna, epoch);
              this.state.stagnationStrikes.macro = 0;
          }
      });

      this.evolveEmotion(epoch, tension);
  }

  private injectVaccineV4(partName: string, type: 'jitter' | 'inversion' | 'transposition', dna: SuiteDNA, epoch: number) {
      console.log(`%c[SOR] VACCINE INJECTED: ${type.toUpperCase()} for ${partName}`, 'color: #4ade80; font-weight: bold; border: 1px solid #4ade80; padding: 2px;');
      
      if (partName === 'melody') {
          if (type === 'jitter') {
              this.currentAxiom = this.currentAxiom.map(n => ({ ...n, t: (n.t + 1) % 12 }));
          } else if (type === 'inversion') {
              const firstMidi = DEGREE_TO_SEMITONE[this.currentAxiom[0].deg] || 0;
              this.currentAxiom = this.currentAxiom.map(n => {
                  const semitone = DEGREE_TO_SEMITONE[n.deg] || 0;
                  const inverted = (firstMidi * 2 - semitone + 12) % 12;
                  return { ...n, deg: Object.keys(DEGREE_TO_SEMITONE).find(key => DEGREE_TO_SEMITONE[key] === inverted) || 'R' };
              });
          } else {
              this.currentAxiom = this.currentAxiom.map(n => {
                  const semitone = DEGREE_TO_SEMITONE[n.deg] || 0;
                  return { ...n, deg: Object.keys(DEGREE_TO_SEMITONE).find(key => DEGREE_TO_SEMITONE[key] === (semitone + 5) % 12) || 'R' };
              });
          }
          this.globalStagnationOffset += 1000;
      } else {
          this.globalStagnationOffset += 1000;
          this.pianoStagnationOffset += 1000;
      }
  }

  private getFuzzyHash(events: FractalEvent[], rootNote: number): string {
      if (events.length === 0) return "SILENCE";
      const pitchSet = Array.from(new Set(events.map(e => ((e.note - rootNote) % 12 + 12) % 12))).sort((a,b) => a - b);
      return pitchSet.join(',');
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints, mood: Mood, epoch: number) {
    if (hints.melody) {
        if (tension <= 0.60) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = 'cs80'; 
        else (hints as any).melody = 'guitar_shineOn'; 
    }
  }

  private generateLSystemMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number, dna: SuiteDNA, bpmFactor: number): FractalEvent[] {
    const phaseInSentence = epoch % 4; 
    let phaseName = barIn12 === 11 ? 'TURNAROUND' : (phaseInSentence < 2 ? 'CALL' : (phaseInSentence === 2 ? 'RESPONSE' : (tension > 0.7 ? 'CLIMAX' : 'RESPONSE')));
    
    if (this.currentAxiom.length === 0) {
        this.currentAxiom = dna.seedLickNotes ? dna.seedLickNotes.map(n => ({ deg: n.deg, t: n.t, d: n.d, tech: (n.tech as Technique) || 'pick', phrasing: 'legato' })) : this.generateInitialAxiom(tension, epoch);
    } else if (phaseInSentence === 0) {
        this.currentAxiom = this.evolveAxiom(this.currentAxiom, tension, phaseName, dna, epoch);
    }

    const registerLift = (tension > 0.7 || phaseName === 'CLIMAX') ? 12 : 0;
    
    return this.currentAxiom.map((n, idx, arr) => {
        if (this.random.next() < (1.0 - bpmFactor) && n.deg !== 'R') return null; 
        
        let dur = (idx < arr.length - 1) ? (arr[idx+1].t - n.t) : Math.max(n.d, 6);
        dur = Math.min(dur, this.NORMAL_NOTE_DURATION * 3); 

        return { 
            type: 'melody', 
            note: Math.min(chord.rootNote + 36 + registerLift + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING), 
            time: n.t / 3, 
            duration: dur / 3, 
            weight: 0.8 + (tension * 0.2), 
            technique: n.tech, 
            dynamics: tension > 0.6 ? 'mf' : 'p', 
            phrasing: n.phrasing || (tension > 0.7 ? 'legato' : 'detached') 
        };
    }).filter(e => e !== null) as FractalEvent[];
  }

  private generateFingerstyleMelody(epoch: number, chord: GhostChord, tempo: number, tension: number, bpmFactor: number): FractalEvent[] {
      const root = chord.rootNote + 36;
      const notes = [root, root + 3, root + 7, root + 10];
      const events: FractalEvent[] = [];
      const density = (0.3 + (tension * 0.3)) * bpmFactor;
      
      [0, 1, 2, 3].forEach(beat => {
          if (calculateMusiNum(epoch + beat + this.globalStagnationOffset, 3, this.seed, 10) / 10 < density) {
              const techIdx = calculateMusiNum(epoch + beat, 2, this.seed, 3);
              const techs: Technique[] = ['pick', 'harm', 'slide'];
              
              events.push({ 
                  type: 'melody', 
                  note: Math.min(notes[calculateMusiNum(epoch + beat, 5, this.seed, 4)], this.MELODY_CEILING), 
                  time: beat, 
                  duration: 0.5, 
                  weight: 0.5 + (tension * 0.3), 
                  technique: techs[techIdx], 
                  dynamics: 'p', 
                  phrasing: 'staccato' 
              });
          }
      });
      return events;
  }

  private generateInitialAxiom(tension: number, epoch: number): MelodicAxiomNote[] {
    const axiom: MelodicAxiomNote[] = [];
    const pool = ['R', 'b3', '4', '5', 'b7', this.thematicDegree];
    const count = tension > 0.6 ? 4 : 3; 
    for (let i = 0; i < count; i++) axiom.push({ deg: pool[calculateMusiNum(this.seed + i + epoch, 3, i, pool.length)], t: i * 2.5, d: 3, tech: 'pick', phrasing: 'detached' });
    return axiom;
  }

  private evolveAxiom(axiom: MelodicAxiomNote[], tension: number, phase: string, dna: SuiteDNA, epoch: number): MelodicAxiomNote[] {
    return axiom.map((note, i) => {
        let newDeg = note.deg; 
        let newTech = note.tech;
        let newPhrasing = note.phrasing;

        const mutationChance = tension > 0.65 ? 0.40 : 0.15;

        if (this.random.next() < mutationChance) {
            if (phase === 'CLIMAX' || tension > 0.7) {
                newDeg = ['5', 'b7', 'R+8', '9'][calculateMusiNum(epoch + i, 3, this.seed, 4)]; 
                newTech = 'bend';
                newPhrasing = 'legato';
            } else if (phase === 'RESPONSE') {
                newDeg = i === axiom.length - 1 ? 'R' : newDeg;
                newTech = i === axiom.length - 1 ? 'vibrato' : 'pick';
            } else {
                const pool = ['R', 'b3', '4', '5', 'b7', this.thematicDegree];
                newDeg = pool[calculateMusiNum(epoch + i, 7, this.seed, pool.length)];
            }
        }

        return { ...note, deg: newDeg, tech: newTech, phrasing: newPhrasing }; 
    }).slice(0, 6);
  }

  private generateDrums(epoch: number, tempo: number, tension: number, isEnsemble: boolean, bpmFactor: number): FractalEvent[] {
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch + this.globalStagnationOffset, 3, this.seed, kitPool.length)];
    if (!p) return [];
    const events: FractalEvent[] = [];
    if (p.HH) p.HH.forEach(t => events.push(this.createDrumEvent('drum_hihat', t / 3, 0.3 + (tension * 0.3), 'p')));
    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent('drum_kick', t / 3, 0.65 + (tension * 0.2), 'p')));
    if (p.SD) p.SD.forEach(t => events.push(this.createDrumEvent('drum_snare', t / 3, 0.3 + (tension * 0.5), 'mf')));
    return events;
  }

  private generateBass(epoch: number, chord: GhostChord, tempo: number, tension: number, isWalking: boolean, bpmFactor: number): FractalEvent[] {
    const riffs = BLUES_BASS_RIFFS[this.mood] || BLUES_BASS_RIFFS.contemplative;
    const riff = riffs[calculateMusiNum(Math.floor(epoch / 4), 5, this.seed + this.globalStagnationOffset, riffs.length)];
    const barIn12 = epoch % 12;
    let pattern = (!isWalking) ? [{ t: 0, d: 12, deg: 'R' as BluesRiffDegree }] : (barIn12 === 11 ? riff.turn : ([4, 5, 9, 10].includes(barIn12) ? riff.IV : (barIn12 === 8 ? riff.V : riff.I)));
    
    return pattern.map((n, i) => {
        const drift = (this.random.next() * 40 - 20) / 1000; // ±20ms
        return { 
            type: 'bass', 
            note: Math.max(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.BASS_FLOOR), 
            time: n.t / 3 + drift, 
            duration: (n.d || 2) / 3, 
            weight: (0.7 + tension * 0.2) * (0.95 + this.random.next() * 0.1), 
            technique: 'pluck', 
            dynamics: tension > 0.6 ? 'mf' : 'p', 
            phrasing: 'legato' 
        };
    });
  }

  private generatePianoMotif(epoch: number, chord: GhostChord, tempo: number, tension: number, bpmFactor: number): FractalEvent[] {
    const root = chord.rootNote + 36;
    const notes = [root + 7, root + 10, root + 12].map(n => { let p = n; while (p > this.PIANO_CEILING) p -= 12; return p; });
    const events: FractalEvent[] = [];
    const density = (0.2 + (tension * 0.2)) * bpmFactor; 
    [1, 2, 3].forEach(beat => {
        if (calculateMusiNum(epoch + beat + this.pianoStagnationOffset, 7, this.seed, 10) / 10 < density) {
            events.push({ type: 'pianoAccompaniment', note: notes[calculateMusiNum(epoch + beat, 3, this.seed, 3)], time: beat, duration: 1.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
    });
    return events;
  }

  private generateAccompaniment(epoch: number, chord: GhostChord, tempo: number, tension: number, currentPattern: string): FractalEvent[] {
    const pattern = GUITAR_PATTERNS[currentPattern] || GUITAR_PATTERNS['F_TRAVIS'];
    const voicing = BLUES_GUITAR_VOICINGS['E7_open'];
    const events: FractalEvent[] = [];
    pattern.pattern.forEach(step => step.ticks.forEach(t => step.stringIndices.forEach(idx => {
          events.push({ type: 'accompaniment', note: chord.rootNote + (voicing[idx] - 40), time: t / 3, duration: 2.0, weight: 0.3, technique: 'pluck', dynamics: 'p', phrasing: 'detached' });
    })));
    return events;
  }

  private generateSustainedAccompaniment(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
      return [chord.rootNote, chord.rootNote + (chord.chordType === 'minor' ? 3 : 4), chord.rootNote + 7].map((note, i) => ({ 
          type: 'accompaniment', note: note + 12, time: i * 0.1, duration: 4.0, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato' 
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
        
        events.push({ 
            type: 'melody', 
            note: Math.min(last.note! + 5, this.MELODY_CEILING), 
            time: last.time + last.duration + 0.3, 
            duration: this.MAX_NOTE_DURATION, 
            weight: 0.98, 
            technique: 'vibrato', 
            dynamics: 'mf', 
            phrasing: 'sostenuto' 
        });
        this.lastAscendingBar = epoch;
      }
    }
    return events;
  }

  private evolveEmotion(epoch: number, tension: number): void {
    this.state.emotion.melancholy += (this.random.next() - 0.5) * 0.06;
    this.state.emotion.darkness += (this.random.next() - 0.5) * 0.04;
    this.state.emotion.melancholy = Math.max(0.65, Math.min(0.95, this.state.emotion.melancholy));
    this.state.emotion.darkness = Math.max(0.15, Math.min(0.45, this.state.emotion.darkness));
    this.state.tensionLevel = tension; 
  }

  private updatePhrasePhase(barIn12: number): void {
    if (barIn12 < 4) {
      this.state.phraseState = 'call';
    } else if (barIn12 < 8) {
      this.state.phraseState = 'call_var';
    } else {
      this.state.phraseState = 'response';
    }
  }
}
