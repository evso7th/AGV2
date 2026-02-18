import {
  FractalEvent,
  GhostChord,
  InstrumentHints,
  Mood,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState
} from '@/types/music';
import { 
    getNextChordRoot, 
    getChordNameForBar,
    DEGREE_TO_SEMITONE
} from './blues-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V98.0 — "The Integrated Pianist".
 * #ЧТО: 1. Пианист интегрирован в гармонию ансамбля (играет по аккордам).
 *       2. Реализованы арпеджио и соло-пассажи для Пианиста в зависимости от Tension.
 *       3. Полная синхронизация СОР: зацикливание Пианиста триггерит смену темы для всех.
 *       4. Исправлена передача barCount для корректной телеметрии.
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private random: any;
  private currentAxiom: any[] = [];
  private currentLickId: string = '';
  
  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 

  private state: BluesCognitiveState & { 
      introBassStyle: 'drone' | 'riff' | 'walking',
      lastPianoHash: string 
  };
  private sfxPlayedInPart = false;
  private currentPartId = '';
  private usedLicksInSuite: Set<string> = new Set();

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    this.random = this.createSeededRandom(seed);

    const introStyles: ('drone' | 'riff' | 'walking')[] = ['drone', 'riff', 'walking'];
    const selectedIntroStyle = introStyles[this.random.nextInt(introStyles.length)];

    this.state = {
      phraseState: 'call',
      tensionLevel: 0.3,
      phraseHistory: [],
      pianoHistory: [],
      accompHistory: [],
      mesoHistory: [],
      macroHistory: [],
      lastPhraseHash: '',
      lastLickId: '',
      lastPianoHash: '',
      blueNotePending: false,
      emotion: { melancholy: 0.8, darkness: 0.3 },
      stagnationStrikes: { micro: 0, meso: 0, macro: 0 },
      vaccineActive: { part: 'ensemble', type: 'jitter' },
      introBassStyle: selectedIntroStyle
    };
  }

  private createSeededRandom(seed: number) {
    let state = seed;
    const next = () => {
      state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
      return state / Math.pow(2, 32);
    };
    return { next, nextInt: (max: number) => Math.floor(next() * max) };
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints,
    lastEvents: FractalEvent[] = []
  ): FractalEvent[] {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    
    if (navInfo.currentPart.id !== this.currentPartId) {
        this.currentPartId = navInfo.currentPart.id;
        this.sfxPlayedInPart = false;
    }

    this.evaluateTimbralDramaturgy(tension, hints);
    
    const isMutationBoundary = epoch % 12 === 0;
    const isStagnating = this.state.stagnationStrikes.micro >= 3;

    if (this.currentAxiom.length === 0 || navInfo.isPartTransition || isMutationBoundary || isStagnating) {
        if (isStagnating) {
            console.warn(`%c[Narrative] ENSEMBLE STAGNATION at Bar ${epoch}. Injecting Diversity Vaccine...`, 'color: #ff4444; font-weight: bold;');
        }
        this.refreshUnifiedMutation();
        this.selectNextAxiom(navInfo, dna, epoch);
        this.logNarrativeActivity(epoch, navInfo, dna);
        this.state.stagnationStrikes.micro = 0; 
    }

    const events: FractalEvent[] = [];

    if (hints.melody) events.push(...this.renderMelodicSegment(epoch, currentChord, tension));
    if (hints.accompaniment) events.push(...this.renderDynamicAccompaniment(epoch, currentChord, tension));
    if (hints.bass) events.push(...this.renderIronBass(currentChord, epoch, tension, navInfo));
    if (hints.drums) events.push(...this.renderBluesBeat(epoch, tension, navInfo));
    
    if (hints.pianoAccompaniment) {
        const pianoEvents = this.renderIntegratedPiano(epoch, currentChord, tension);
        
        // Stagnation Guard for Piano
        const pianoHash = pianoEvents.map(e => e.note).join('|');
        if (pianoHash === this.state.lastPianoHash && pianoEvents.length > 0) {
            this.state.stagnationStrikes.micro++;
            console.log(`%c[Narrative] Piano Stagnation Strike: ${this.state.stagnationStrikes.micro}/3`, 'color: #ffa500;');
        } else {
            this.state.lastPianoHash = pianoHash;
        }
        
        events.push(...pianoEvents);
    }

    if (hints.sfx && this.mood === 'melancholic') {
        if (navInfo.currentPart.id.includes('BRIDGE') && !this.sfxPlayedInPart) {
            events.push(...this.renderCleanSfx(tension));
            this.sfxPlayedInPart = true;
        }
    }

    return events;
  }

  private logNarrativeActivity(epoch: number, navInfo: NavigationInfo, dna: SuiteDNA) {
      const type = this.state.vaccineActive?.type || 'none';
      const lickId = this.currentLickId;
      console.info(
          `%c[Narrative] Bar ${epoch} | Act: ${navInfo.currentPart.id} | Lick: ${lickId} | Mutation: ${type}`,
          'color: #DA70D6; font-weight: bold; background: #222; padding: 2px 5px; border-radius: 3px;'
      );
  }

  private refreshUnifiedMutation() {
      const types: ('jitter' | 'inversion' | 'transposition' | 'rhythm')[] = ['jitter', 'inversion', 'rhythm', 'transposition'];
      this.state.vaccineActive = { 
          part: 'ensemble', 
          type: types[this.random.nextInt(types.length)] 
      };
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      const dynasty = dna.dynasty || 'slow-burn';
      const sessionHistory = dna.sessionHistory || [];
      
      let pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
          BLUES_SOLO_LICKS[id].tags.includes(dynasty) && 
          !this.usedLicksInSuite.has(id) &&
          !sessionHistory.includes(id)
      );

      if (pool.length < 5) {
          pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
              !this.usedLicksInSuite.has(id) && 
              !sessionHistory.includes(id)
          );
      }

      if (pool.length === 0) {
          this.usedLicksInSuite.clear();
          pool = Object.keys(BLUES_SOLO_LICKS).filter(id => id !== this.state.lastLickId);
      }

      const nextId = pool[this.random.nextInt(pool.length)] || 'L01';
      this.currentLickId = nextId;
      this.state.lastLickId = nextId;
      this.usedLicksInSuite.add(nextId);
      this.currentAxiom = this.mutateLick(BLUES_SOLO_LICKS[nextId].phrase);
  }

  private mutateLick(phrase: any[]): any[] {
      const type = this.state.vaccineActive?.type || 'jitter';
      let mutated = JSON.parse(JSON.stringify(phrase));
      
      switch(type) {
          case 'inversion':
              const pivot = phrase[0]?.deg || 'R';
              mutated = phrase.map((n: any) => ({...n, deg: this.invertDegree(n.deg, pivot)}));
              break;
          case 'jitter':
              mutated = phrase.map((n: any) => ({...n, t: Math.max(0, n.t + (this.random.next() * 0.4 - 0.2))}));
              break;
          case 'rhythm':
              mutated = phrase.map((n: any) => ({...n, d: n.d * (0.8 + this.random.next() * 0.4)}));
              break;
          case 'transposition':
              const shift = this.random.next() < 0.5 ? 12 : -12;
              mutated = phrase.map((n: any) => ({...n, octShift: (n.octShift || 0) + shift}));
              break;
      }
      return mutated;
  }

  private invertDegree(deg: string, pivot: string): string {
      const s = DEGREE_TO_SEMITONE[deg] || 0;
      const p = DEGREE_TO_SEMITONE[pivot] || 0;
      const inv = (p - (s - p)) % 12;
      const finalS = inv < 0 ? inv + 12 : inv;
      const entry = Object.entries(DEGREE_TO_SEMITONE).find(([k, v]) => v === finalS);
      return entry ? entry[0] : deg;
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.50) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.72) (hints as any).melody = 'cs80';
        else (hints as any).melody = 'guitar_shineOn';
    }
    if (hints.accompaniment) {
        (hints as any).accompaniment = tension > 0.72 ? 'ep_rhodes_70s' : 'organ_soft_jazz';
    }
  }

  /**
   * #ЗАЧЕМ: Интегрированное пианино. Играет в гармонии с ансамблем.
   * #ЧТО: Использует ступени аккорда для создания арпеджио или соло-ответов.
   */
  private renderIntegratedPiano(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 24;
      const isMin = chord.chordType === 'minor' || chord.chordType === 'diminished';
      
      // Ступени для пианино: 1, 3, 5, 7, 9
      const degrees = [0, isMin ? 3 : 4, 7, 10, 14];
      
      if (tension < 0.45) {
          // Tier 1: Интимные ответы (одиночные ноты)
          const noteChance = 0.2 + tension * 0.5;
          [1.5, 3.0].forEach(beat => {
              if (this.random.next() < noteChance) {
                  const deg = degrees[this.random.nextInt(degrees.length)];
                  events.push({
                      type: 'pianoAccompaniment',
                      note: Math.min(root + deg, this.MELODY_CEILING),
                      time: beat, duration: 4.0, weight: 0.3 + tension * 0.2,
                      technique: 'hit', dynamics: 'p', phrasing: 'staccato',
                      params: { barCount: epoch }
                  });
              }
          });
      } else {
          // Tier 2-3: Арпеджио и пассажи
          const complexity = Math.floor(tension * 6); // 2-6 нот
          const step = 4.0 / complexity;
          
          for (let i = 0; i < complexity; i++) {
              if (this.random.next() < 0.8) {
                  const deg = degrees[i % degrees.length];
                  events.push({
                      type: 'pianoAccompaniment',
                      note: Math.min(root + deg, this.MELODY_CEILING),
                      time: i * step, 
                      duration: 2.5, 
                      weight: 0.4 + tension * 0.3,
                      technique: 'hit', dynamics: 'p', phrasing: 'staccato',
                      params: { barCount: epoch }
                  });
              }
          }
      }
      
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const barInCycle = epoch % 4;
    const barOffset = barInCycle * 12;
    const barNotes = this.currentAxiom.filter(n => n.t >= barOffset && n.t < barOffset + 12);
    
    return barNotes.map(n => ({
        type: 'melody',
        note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0) + (n.octShift || 0), this.MELODY_CEILING),
        time: (n.t % 12) / 3,
        duration: n.d / 3,
        weight: 0.85, technique: n.tech || 'pick',
        dynamics: tension > 0.7 ? 'mf' : 'p', phrasing: 'legato'
    }));
  }

  private renderDynamicAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    if (tension < 0.4) return this.renderSoftPillows(epoch, chord, tension);
    else if (tension <= 0.7) return this.renderArpPad(epoch, chord, tension);
    else return this.renderPowerChords(epoch, chord, tension);
  }

  private renderSoftPillows(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    if (epoch % 2 !== 0) return [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7];
    return notes.map((p, i) => ({
        type: 'accompaniment', note: p, time: 0.5 + i * 0.05, duration: 8.0, weight: 0.25,
        technique: 'swell', dynamics: 'p', phrasing: 'legato'
    }));
  }

  private renderArpPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];
    events.push({ type: 'accompaniment', note: root, time: 0, duration: 4.0, weight: 0.28, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
    notes.forEach((p, i) => {
        if (this.random.next() < 0.7) {
            events.push({ type: 'accompaniment', note: p + 12, time: 1.0 + i * 0.5, duration: 1.2, weight: 0.35, technique: 'pluck', dynamics: 'p', phrasing: 'detached' });
        }
    });
    return events;
  }

  private renderPowerChords(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];
    [0, 2.0].forEach(t => {
        notes.forEach((p, i) => {
            events.push({ type: 'accompaniment', note: p, time: t + i * 0.03, duration: 1.5, weight: 0.55, technique: 'pluck', dynamics: 'mf', phrasing: 'staccato' });
        });
    });
    return events;
  }

  private renderIronBass(chord: GhostChord, epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
    if (navInfo.currentPart.id === 'INTRO') {
        switch(this.state.introBassStyle) {
            case 'drone': return this.renderDroneBass(chord, epoch);
            case 'riff': return this.renderRiffBass(chord, epoch, tension);
            case 'walking': return this.renderWalkingBass(chord, epoch, tension);
        }
    }
    if (tension < 0.4) return this.renderDroneBass(chord, epoch);
    else if (tension <= 0.7) return this.renderRiffBass(chord, epoch, tension);
    else return this.renderWalkingBass(chord, epoch, tension);
  }

  private renderDroneBass(chord: GhostChord, epoch: number): FractalEvent[] {
    if (epoch % 2 !== 0) return []; 
    return [{ type: 'bass', note: Math.max(chord.rootNote - 12, this.BASS_FLOOR), time: 0, duration: 8.0, weight: 0.65, technique: 'pluck', dynamics: 'p', phrasing: 'legato', params: { attack: 0.5, release: 2.0, filterCutoff: 300 } }];
  }

  private renderRiffBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const isMin = chord.chordType === 'minor';
    const pattern = [ { t: 0, n: root, w: 0.7 }, { t: 1.0, n: root + 7, w: 0.5 }, { t: 2.0, n: root + (isMin ? 3 : 4), w: 0.6 }, { t: 3.0, n: root + 5, w: 0.5 } ];
    return pattern.map(p => ({ type: 'bass', note: p.n, time: p.t, duration: 0.8, weight: p.w + (tension * 0.1), technique: 'pluck', dynamics: 'p', phrasing: 'legato', params: { attack: 0.1, release: 0.8, filterCutoff: 400 } }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const nextRoot = getNextChordRoot(epoch % 12, chord.rootNote) - 12;
    const notes = [ root, root + 7, root + 10, nextRoot - 1 ];
    return notes.map((p, i) => ({ type: 'bass', note: p, time: i, duration: 0.9, weight: (i === 0 ? 0.85 : 0.5) + tension * 0.1, technique: 'pluck', dynamics: i === 0 ? 'mf' : 'p', phrasing: 'legato' }));
  }

  private renderBluesBeat(epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
      const events: FractalEvent[] = [];
      const isBreakdown = navInfo.currentPart.id.includes('BRIDGE') || tension < 0.42;
      const isPeak = tension > 0.72;
      const kickTimes = isPeak ? [0, 1, 2, 3] : (isBreakdown ? [0] : [0, 2.66]);
      kickTimes.forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t, duration: 0.1, weight: 0.5 + (tension * 0.2), technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      if (!isBreakdown) { [1, 3].forEach(t => events.push({ type: isPeak ? 'drum_snare' : 'drum_snare_ghost_note', note: 38, time: t, duration: 0.1, weight: isPeak ? 0.75 : 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato' })); }
      [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66].forEach(t => {
          if (isBreakdown && t % 1 !== 0) return;
          events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t, duration: 0.1, weight: 0.22, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });
      return events;
  }

  private renderCleanSfx(tension: number): FractalEvent[] {
      return [{ type: 'sfx', note: 60, time: 1.0, duration: 4.0, weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { mood: this.mood, genre: 'blues' } }];
  }
}
