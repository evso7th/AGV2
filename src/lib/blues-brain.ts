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
 * #ЗАЧЕМ: Блюзовый Мозг V56.0 — "The Lyrical Restoration".
 * #ЧТО: 1. Возвращение "Голоса" гитары (приоритет Legacy Licks).
 *       2. Замена "цыганочки" на синкопированные аккордовые "чопы" (Air Chops).
 *       3. Упрощение баса до монументальной опоры.
 *       4. Снижение суеты Sentinel: музыкальные повторы разрешены.
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
  
  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 
  private readonly PIANO_CEILING = 71; 
  private readonly MAX_NOTE_DURATION = 2.0; 
  private readonly NORMAL_NOTE_DURATION = 1.2; 

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
      pianoHistory: [],
      accompHistory: [],
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
    
    // #ЗАЧЕМ: Приоритет тематической связности.
    if (navInfo.isPartTransition && dna.partLickMap?.has(navInfo.currentPart.id)) {
        const nextLickId = dna.partLickMap.get(navInfo.currentPart.id)!;
        this.currentAxiom = BLUES_SOLO_LICKS[nextLickId].phrase.map(n => ({
            deg: n.deg, t: n.t, d: n.d, tech: (n.tech as Technique) || 'pick', phrasing: 'legato'
        }));
    }

    const combinedEvents: FractalEvent[] = [];
    const currentPianoEvents: FractalEvent[] = [];
    const currentAccompEvents: FractalEvent[] = [];

    // --- 1. MELODY (THE VOICE) ---
    if (hints.melody) {
      const prog = hints.summonProgress?.melody ?? 1.0;
      // #ЗАЧЕМ: Сохранение лирического голоса. Соло всегда в приоритете над фингерстайлом.
      const mEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna, bpmFactor);
      mEvents.forEach(e => { e.weight *= prog; });
      combinedEvents.push(...this.applyAntiFuneralMarch(mEvents, epoch, tension));
    }

    // --- 2. PIANO (THE ECHO) ---
    if (hints.pianoAccompaniment) {
        const pEvents = this.generatePianoMotif(epoch, currentChord, tempo, tension, bpmFactor);
        pEvents.forEach(e => { e.weight *= (0.35 * (hints.summonProgress?.pianoAccompaniment ?? 1.0)); }); 
        currentPianoEvents.push(...pEvents);
        combinedEvents.push(...pEvents);
    }

    // --- 3. ACCOMPANIMENT (THE CHOP) ---
    if (hints.accompaniment) {
        // #ЗАЧЕМ: Убийство "цыганочки". Переход на синкопированные аккордовые чопы.
        let aEvents = this.generateChordChops(epoch, currentChord, tempo, tension);
        aEvents.forEach(e => { e.weight *= (hints.summonProgress?.accompaniment ?? 1.0); });
        currentAccompEvents.push(...aEvents);
        combinedEvents.push(...aEvents);
    }

    // --- 4. SENTINEL AUDIT ---
    this.auditStagnationV4(combinedEvents.filter(e => e.type === 'melody'), currentPianoEvents, currentAccompEvents, currentChord, dna, epoch, tension);
    
    // --- 5. BASS (THE ANCHOR) ---
    if (hints.bass) {
      // #ЗАЧЕМ: Монументальный волкинг без суеты.
      const bEvents = this.generateSolidWalkingBass(epoch, currentChord, tempo, tension);
      bEvents.forEach(e => { e.weight *= (hints.summonProgress?.bass ?? 1.0); });
      combinedEvents.push(...bEvents);
    }

    // --- 6. DRUMS ---
    if (hints.drums) {
      const dEvents = this.generateDrums(epoch, tempo, tension, lastEvents.length > 0, bpmFactor);
      dEvents.forEach(e => { e.weight *= (hints.summonProgress?.drums ?? 1.0); });
      combinedEvents.push(...dEvents);
    }

    return combinedEvents;
  }

  // #ЗАЧЕМ: Реализация синкопированных аккордовых ударов (Air Chops).
  // #ЧТО: Орган играет только на слабые доли, создавая пространство.
  private generateChordChops(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 12;
      const isMinor = chord.chordType === 'minor';
      
      // Shell Voicing: только 3-я и 7-я ступени для "джазовой" прозрачности
      const shell = [root + (isMinor ? 3 : 4), root + 10];
      
      // Чопы на "и" 2-й и 4-й доли
      const chopTimes = [1.5, 3.5];
      
      chopTimes.forEach(time => {
          if (this.random.next() < 0.75) { // Не всегда, чтобы "дышало"
              shell.forEach(pitch => {
                  events.push({
                      type: 'accompaniment',
                      note: pitch,
                      time,
                      duration: 0.2,
                      weight: 0.35,
                      technique: 'pluck',
                      dynamics: 'p',
                      phrasing: 'staccato'
                  });
              });
          }
      });
      return events;
  }

  // #ЗАЧЕМ: Монументальный волкинг-бас (The Anchor).
  private generateSolidWalkingBass(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
      const isMinor = chord.chordType === 'minor';
      
      // Прямой волкинг на 4 четверти
      const notes = [
          root,                               // 1 доля: Корень
          root + (isMinor ? 3 : 4),           // 2 доля: Терция
          root + 7,                           // 3 доля: Квинта
          root + 10                           // 4 доля: Септима (или подвод к след.)
      ];

      notes.forEach((pitch, i) => {
          events.push({
              type: 'bass',
              note: pitch,
              time: i,
              duration: 0.8,
              weight: i === 0 ? 0.8 : 0.6,
              technique: 'pluck',
              dynamics: i === 0 ? 'mf' : 'p',
              phrasing: 'legato'
          });
      });
      return events;
  }

  private auditStagnationV4(melody: FractalEvent[], piano: FractalEvent[], accomp: FractalEvent[], chord: GhostChord, dna: SuiteDNA, epoch: number, tension: number) {
      const parts: ('melody' | 'piano' | 'accompaniment')[] = ['melody', 'piano', 'accompaniment'];
      
      parts.forEach(partName => {
          const events = partName === 'melody' ? melody : (partName === 'piano' ? piano : accomp);
          const currentHash = this.getFuzzyHash(events, chord.rootNote);
          
          let history = partName === 'melody' ? this.state.phraseHistory : (partName === 'piano' ? this.state.pianoHistory : this.state.accompHistory);
          if (!history) history = [];

          if (currentHash === "SILENCE") return;

          // 1. MICRO AUDIT (1 Bar)
          if (history.length > 0 && currentHash === history[history.length - 1]) {
              this.state.stagnationStrikes.micro++;
          } else {
              this.state.stagnationStrikes.micro = 0;
          }

          history.push(currentHash);
          if (history.length > this.MAX_HISTORY_DEPTH) history.shift();

          // 2. MACRO AUDIT (4 Bars) - Only for melody
          if (partName === 'melody' && epoch % 4 === 3 && history.length >= 8) {
              const currentMacro = history.slice(-4).join('|');
              const prevMacro = history.slice(-8, -4).join('|');
              if (currentMacro === prevMacro) {
                  this.state.stagnationStrikes.macro++;
                  console.warn(`%c[SOR] MELODY MACRO STRIKE ${this.state.stagnationStrikes.macro}/3 (4-bar phrase loop)`, 'color: #ff0000; font-weight: bold;');
              } else {
                  this.state.stagnationStrikes.macro = 0;
              }
          }

          // --- REACTION (Only on Strike 3) ---
          if (this.state.stagnationStrikes.macro >= 3) {
              this.injectVaccineV4(partName, 'transposition', dna, epoch);
              this.state.stagnationStrikes.macro = 0;
          }
      });

      this.evolveEmotion(epoch, tension);
  }

  private injectVaccineV4(partName: string, type: 'jitter' | 'inversion' | 'transposition', dna: SuiteDNA, epoch: number) {
      console.log(`%c[SOR] VACCINE INJECTED: ${type.toUpperCase()} for ${partName}`, 'color: #4ade80; font-weight: bold; border: 1px solid #4ade80; padding: 2px;');
      
      if (partName === 'melody') {
          // Принудительный сдвиг всей темы на терцию
          this.currentAxiom = this.currentAxiom.map(n => {
              const semitone = DEGREE_TO_SEMITONE[n.deg] || 0;
              return { ...n, deg: Object.keys(DEGREE_TO_SEMITONE).find(key => DEGREE_TO_SEMITONE[key] === (semitone + 3) % 12) || 'R' };
          });
          this.globalStagnationOffset += 1000;
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
        let dur = (idx < arr.length - 1) ? (arr[idx+1].t - n.t) : Math.max(n.d, 6);
        dur = Math.min(dur, this.NORMAL_NOTE_DURATION * 3); 

        return { 
            type: 'melody', 
            note: Math.min(chord.rootNote + 36 + registerLift + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING), 
            time: n.t / 3, 
            duration: dur / 3, 
            weight: 0.85 + (tension * 0.15), 
            technique: n.tech, 
            dynamics: tension > 0.6 ? 'mf' : 'p', 
            phrasing: 'legato'
        };
    }).filter(e => e !== null) as FractalEvent[];
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

        const mutationChance = tension > 0.65 ? 0.35 : 0.15;

        if (this.random.next() < mutationChance) {
            if (phase === 'CLIMAX' || tension > 0.7) {
                newDeg = ['5', 'b7', 'R+8', '9'][calculateMusiNum(epoch + i, 3, this.seed, 4)]; 
                newTech = 'bend';
            } else if (phase === 'RESPONSE') {
                newDeg = i === axiom.length - 1 ? 'R' : newDeg;
                newTech = i === axiom.length - 1 ? 'vibrato' : 'pick';
            } else {
                const pool = ['R', 'b3', '4', '5', 'b7', this.thematicDegree];
                newDeg = pool[calculateMusiNum(epoch + i, 7, this.seed, pool.length)];
            }
        }

        return { ...note, deg: newDeg, tech: newTech, phrasing: 'legato' as Phrasing }; 
    }).slice(0, 6);
  }

  private generateDrums(epoch: number, tempo: number, tension: number, isEnsemble: boolean, bpmFactor: number): FractalEvent[] {
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch + this.globalStagnationOffset, 3, this.seed, kitPool.length)];
    if (!p) return [];
    const events: FractalEvent[] = [];
    if (p.HH) p.HH.forEach(t => events.push(this.createDrumEvent('drum_hihat', t / 3, 0.25 + (tension * 0.25), 'p')));
    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent('drum_kick', t / 3, 0.65 + (tension * 0.2), 'p')));
    if (p.SD) p.SD.forEach(t => events.push(this.createDrumEvent('drum_snare', t / 3, 0.3 + (tension * 0.4), 'mf')));
    return events;
  }

  private generatePianoMotif(epoch: number, chord: GhostChord, tempo: number, tension: number, bpmFactor: number): FractalEvent[] {
    const root = chord.rootNote + 36;
    const notes = [root + 7, root + 10, root + 12].map(n => { let p = n; while (p > this.PIANO_CEILING) p -= 12; return p; });
    const events: FractalEvent[] = [];
    const density = (0.15 + (tension * 0.15)) * bpmFactor; 
    [1, 2, 3].forEach(beat => {
        if (calculateMusiNum(epoch + beat + this.pianoStagnationOffset, 7, this.seed, 10) / 10 < density) {
            events.push({ type: 'pianoAccompaniment', note: notes[calculateMusiNum(epoch + beat, 3, this.seed, 3)], time: beat, duration: 1.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
    });
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
