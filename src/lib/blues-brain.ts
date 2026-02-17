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
import { BLUES_SOLO_LICKS } from './assets/assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V57.0 — "The Fractal Sentinel & Lyrical Restoration".
 * #ЧТО: 1. Внедрен многомасштабный аудит стагнации (1-2-4 такта).
 *       2. Вакцинация: Jitter (1т), Inversion (2т), Transposition (4т).
 *       3. Возвращение Голоса: приоритет Legacy Licks, аккомпанемент — Chord Chops.
 *       4. Оцифрованный Sabbath Riff (L211) активирован.
 * #ИНТЕГРАЦИЯ: Полностью совместим с V2 Pipelines.
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private thematicDegree: string;
  private lastAscendingBar: number = -10;
  private currentAxiom: any[] = [];
  private random: any;
  
  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 
  private readonly PIANO_CEILING = 71; 
  
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
      nextInt: (max: number) => Math.floor(next() * max)
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
    
    // #ЗАЧЕМ: Тембральная драматургия (План №439).
    this.evaluateTimbralDramaturgy(tension, hints);
    
    // #ЗАЧЕМ: Динамическая связность при смене частей.
    if (navInfo.isPartTransition && dna.partLickMap?.has(navInfo.currentPart.id)) {
        const nextLickId = dna.partLickMap.get(navInfo.currentPart.id)!;
        this.currentAxiom = BLUES_SOLO_LICKS[nextLickId].phrase;
    }

    const combinedEvents: FractalEvent[] = [];
    const currentMelodyEvents: FractalEvent[] = [];
    const currentPianoEvents: FractalEvent[] = [];
    const currentAccompEvents: FractalEvent[] = [];

    // --- 1. MELODY (THE VOICE) ---
    if (hints.melody) {
      const mEvents = this.generateLSystemMelody(epoch, currentChord, barIn12, tempo, tension, dna, bpmFactor);
      currentMelodyEvents.push(...mEvents);
      combinedEvents.push(...this.applyAntiFuneralMarch(mEvents, epoch, tension));
    }

    // --- 2. PIANO (THE ECHO) ---
    if (hints.pianoAccompaniment) {
        const pEvents = this.generatePianoMotif(epoch, currentChord, tempo, tension, bpmFactor);
        currentPianoEvents.push(...pEvents);
        combinedEvents.push(...pEvents);
    }

    // --- 3. ACCOMPANIMENT (AIR CHOPS) ---
    if (hints.accompaniment) {
        let aEvents = this.generateChordChops(epoch, currentChord, tempo, tension);
        currentAccompEvents.push(...aEvents);
        combinedEvents.push(...aEvents);
    }

    // --- 4. THE FRACTAL SENTINEL (STAGNATION AUDIT) ---
    this.auditStagnationMultiScale(currentMelodyEvents, currentPianoEvents, currentAccompEvents, currentChord, epoch, tension);
    
    // --- 5. BASS (THE ANCHOR) ---
    if (hints.bass) {
      combinedEvents.push(...this.generateSolidWalkingBass(epoch, currentChord, tempo, tension));
    }

    // --- 6. DRUMS ---
    if (hints.drums) {
      combinedEvents.push(...this.generateDrums(epoch, tempo, tension, lastEvents.length > 0, bpmFactor));
    }

    return combinedEvents;
  }

  // #ЗАЧЕМ: Реализация многомасштабного аудита (1-2-4 такта).
  private auditStagnationMultiScale(melody: FractalEvent[], piano: FractalEvent[], accomp: FractalEvent[], chord: GhostChord, epoch: number, tension: number) {
      const melodyHash = this.getFuzzyHash(melody, chord.rootNote);
      if (melodyHash === "SILENCE") return;

      // 1. MICRO AUDIT (1 Bar)
      const lastMicro = this.state.phraseHistory[this.state.phraseHistory.length - 1];
      if (melodyHash === lastMicro) {
          this.state.stagnationStrikes.micro++;
          console.warn(`%c[SOR] MICRO STRIKE ${this.state.stagnationStrikes.micro}/3 (1-bar loop)`, 'color: #ff8c00;');
      } else {
          this.state.stagnationStrikes.micro = 0;
      }

      this.state.phraseHistory.push(melodyHash);
      if (this.state.phraseHistory.length > this.MAX_HISTORY_DEPTH) this.state.phraseHistory.shift();

      // 2. MESO AUDIT (2 Bars)
      if (epoch % 2 === 1 && this.state.phraseHistory.length >= 4) {
          const currentMeso = this.state.phraseHistory.slice(-2).join('|');
          const lastMeso = this.state.phraseHistory.slice(-4, -2).join('|');
          if (currentMeso === lastMeso) {
              this.state.stagnationStrikes.meso++;
              console.warn(`%c[SOR] MESO STRIKE ${this.state.stagnationStrikes.meso}/3 (2-bar cycle)`, 'color: #ff4500; font-weight: bold;');
          } else {
              this.state.stagnationStrikes.meso = 0;
          }
      }

      // 3. MACRO AUDIT (4 Bars)
      if (epoch % 4 === 3 && this.state.phraseHistory.length >= 8) {
          const currentMacro = this.state.phraseHistory.slice(-4).join('|');
          const lastMacro = this.state.phraseHistory.slice(-8, -4).join('|');
          if (currentMacro === lastMacro) {
              this.state.stagnationStrikes.macro++;
              console.warn(`%c[SOR] MACRO STRIKE ${this.state.stagnationStrikes.macro}/3 (4-bar phrase loop)`, 'color: #ff0000; font-weight: bold; border: 1px solid #ff0000; padding: 2px;');
          } else {
              this.state.stagnationStrikes.macro = 0;
          }
      }

      // --- VACCINE INJECTION ---
      if (this.state.stagnationStrikes.micro >= 3) {
          this.injectVaccine('micro', 'jitter');
          this.state.stagnationStrikes.micro = 0;
      }
      if (this.state.stagnationStrikes.meso >= 3) {
          this.injectVaccine('meso', 'inversion');
          this.state.stagnationStrikes.meso = 0;
      }
      if (this.state.stagnationStrikes.macro >= 3) {
          this.injectVaccine('macro', 'transposition');
          this.state.stagnationStrikes.macro = 0;
      }
  }

  private injectVaccine(scale: 'micro' | 'meso' | 'macro', type: string) {
      console.info(`%c[SOR] ${scale.toUpperCase()} VACCINE: Injecting "${type}"`, 'color: #4ade80; font-weight: bold;');
      
      if (type === 'jitter') {
          this.currentAxiom = this.currentAxiom.map(n => ({ ...n, t: n.t + (this.random.next() * 0.5 - 0.25) }));
      } else if (type === 'inversion') {
          const pivot = DEGREE_TO_SEMITONE[this.currentAxiom[0].deg];
          this.currentAxiom = this.currentAxiom.map(n => {
              const semitone = DEGREE_TO_SEMITONE[n.deg];
              const inverted = pivot - (semitone - pivot);
              const deg = Object.keys(DEGREE_TO_SEMITONE).find(k => DEGREE_TO_SEMITONE[k] === (inverted % 12 + 12) % 12) || 'R';
              return { ...n, deg };
          });
      } else if (type === 'transposition') {
          // Принудительный сдвиг на терцию в рамках блюзовой шкалы
          this.currentAxiom = this.currentAxiom.map(n => {
              const pool = ['R', 'b3', '4', '5', 'b7'];
              const idx = pool.indexOf(n.deg);
              return { ...n, deg: pool[(idx + 1) % pool.length] };
          });
      }
  }

  private getFuzzyHash(events: FractalEvent[], root: number): string {
      if (events.length === 0) return "SILENCE";
      return events.map(e => ((e.note - root) % 12 + 12) % 12).join(',');
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.60) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.85) (hints as any).melody = 'cs80'; 
        else (hints as any).melody = 'guitar_shineOn'; 
    }
  }

  private generateLSystemMelody(epoch: number, chord: GhostChord, barIn12: number, tempo: number, tension: number, dna: SuiteDNA, bpmFactor: number): FractalEvent[] {
    const phaseInSentence = epoch % 4; 
    
    if (this.currentAxiom.length === 0) {
        this.currentAxiom = dna.seedLickNotes || [];
    } else if (phaseInSentence === 0 && this.random.next() < 0.15) { // Basic evolution
        this.currentAxiom = this.currentAxiom.map(n => ({
            ...n, 
            deg: this.random.next() < 0.1 ? ['R', 'b3', '4', '5', 'b7'][this.random.nextInt(5)] : n.deg
        }));
    }

    return this.currentAxiom.map(n => ({ 
        type: 'melody', 
        note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING), 
        time: n.t / 3, 
        duration: n.d / 3, 
        weight: 0.85, 
        technique: n.tech || 'pick', 
        dynamics: tension > 0.6 ? 'mf' : 'p', 
        phrasing: 'legato'
    }));
  }

  private generateChordChops(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const isMinor = chord.chordType === 'minor';
      const shell = [chord.rootNote + 12 + (isMinor ? 3 : 4), chord.rootNote + 12 + 10];
      
      [1.5, 3.5].forEach(time => {
          if (this.random.next() < 0.75) {
              shell.forEach(pitch => {
                  events.push({
                      type: 'accompaniment', note: pitch, time, duration: 0.2, weight: 0.3,
                      technique: 'pluck', dynamics: 'p', phrasing: 'staccato'
                  });
              });
          }
      });
      return events;
  }

  private generateSolidWalkingBass(epoch: number, chord: GhostChord, tempo: number, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
      const isMinor = chord.chordType === 'minor';
      const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

      notes.forEach((pitch, i) => {
          events.push({
              type: 'bass', note: pitch, time: i, duration: 0.8, weight: i === 0 ? 0.8 : 0.5,
              technique: 'pluck', dynamics: i === 0 ? 'mf' : 'p', phrasing: 'legato'
          });
      });
      return events;
  }

  private generateDrums(epoch: number, tempo: number, tension: number, isEnsemble: boolean, bpmFactor: number): FractalEvent[] {
    const kitPool = BLUES_DRUM_RIFFS[this.mood] || BLUES_DRUM_RIFFS.contemplative;
    const p = kitPool[calculateMusiNum(epoch, 3, this.seed, kitPool.length)];
    if (!p) return [];
    const events: FractalEvent[] = [];
    if (p.HH) p.HH.forEach(t => events.push(this.createDrumEvent('drum_hihat', t / 3, 0.25, 'p')));
    if (p.K) p.K.forEach(t => events.push(this.createDrumEvent('drum_kick', t / 3, 0.65, 'p')));
    if (p.SD) p.SD.forEach(t => events.push(this.createDrumEvent('drum_snare', t / 3, 0.35, 'mf')));
    return events;
  }

  private generatePianoMotif(epoch: number, chord: GhostChord, tempo: number, tension: number, bpmFactor: number): FractalEvent[] {
    const root = chord.rootNote + 36;
    const notes = [root + 7, root + 10, root + 12].map(n => { let p = n; while (p > this.PIANO_CEILING) p -= 12; return p; });
    const events: FractalEvent[] = [];
    [1, 2, 3].forEach(beat => {
        if (this.random.next() < 0.15) {
            events.push({ type: 'pianoAccompaniment', note: notes[this.random.nextInt(3)], time: beat, duration: 1.0, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
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
            type: 'melody', note: Math.min(last.note! + 5, this.MELODY_CEILING), 
            time: last.time + last.duration + 0.3, duration: 1.2, weight: 0.95, 
            technique: 'vibrato', dynamics: 'mf', phrasing: 'sostenuto' 
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
    if (barIn12 < 4) this.state.phraseState = 'call';
    else if (barIn12 < 8) this.state.phraseState = 'call_var';
    else this.state.phraseState = 'response';
  }
}
