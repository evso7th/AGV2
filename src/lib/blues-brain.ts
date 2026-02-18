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
 * #ЗАЧЕМ: Блюзовый Мозг V89.0 — "Dynamic Performance Engine".
 * #ЧТО: 1. Трехуровневая система техник (Tiers) на основе Tension (20/60/20).
 *       2. Динамический выбор манеры баса для Intro.
 *       3. Синхронизация плотности аккомпанемента и баса с энергией.
 */

export class BluesBrain {
  private seed: number;
  private mood: Mood;
  private random: any;
  private currentAxiom: any[] = [];
  private currentLickId: string = '';
  
  private readonly MELODY_CEILING = 75; 
  private readonly BASS_FLOOR = 31; 

  private state: BluesCognitiveState & { introBassStyle: 'drone' | 'riff' | 'walking' };
  private sfxPlayedInBridge = false;
  private usedLicksInSuite: Set<string> = new Set();

  constructor(seed: number, mood: Mood) {
    this.seed = seed;
    this.mood = mood;
    this.random = this.createSeededRandom(seed);

    // #ЗАЧЕМ: Разнообразие вступлений. Каждая пьеса имеет свой стартовый характер баса.
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
    hints: InstrumentHints
  ): FractalEvent[] {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    
    this.evaluateTimbralDramaturgy(tension, hints);
    
    const isMutationBoundary = epoch % 12 === 0;
    if (this.currentAxiom.length === 0 || navInfo.isPartTransition || isMutationBoundary) {
        this.selectNextAxiom(navInfo, dna, epoch);
        this.refreshUnifiedMutation();
    }

    const events: FractalEvent[] = [];

    if (hints.melody) events.push(...this.renderMelodicSegment(epoch, currentChord, tension));
    if (hints.accompaniment) events.push(...this.renderDynamicAccompaniment(epoch, currentChord, tension));
    if (hints.bass) events.push(...this.renderIronBass(currentChord, epoch, tension, navInfo));
    if (hints.drums) events.push(...this.renderBluesBeat(epoch, tension, navInfo));
    if (hints.pianoAccompaniment) events.push(...this.renderLyricalPiano(epoch, currentChord, tension));

    if (hints.sfx && this.mood === 'melancholic') {
        const isBridge = navInfo.currentPart.id.includes('BRIDGE');
        if (isBridge && !this.sfxPlayedInBridge) {
            events.push(...this.renderCleanSfx(tension));
            this.sfxPlayedInBridge = true;
        } else if (!isBridge) {
            this.sfxPlayedInBridge = false;
        }
    }

    return events;
  }

  private refreshUnifiedMutation() {
      const types: ('jitter' | 'inversion' | 'transposition' | 'rhythm')[] = ['jitter', 'inversion', 'rhythm'];
      this.state.vaccineActive = { 
          part: 'ensemble', 
          type: types[this.random.nextInt(types.length)] 
      };
  }

  private mutateLick(phrase: any[], epoch: number): any[] {
      const type = this.state.vaccineActive?.type || 'jitter';
      let mutated = [...phrase];
      
      switch(type) {
          case 'inversion':
              const pivot = phrase[0]?.deg || 'R';
              mutated = phrase.map(n => ({...n, deg: this.invertDegree(n.deg, pivot)}));
              break;
          case 'jitter':
              mutated = phrase.map(n => ({...n, t: n.t + (this.random.next() * 0.4 - 0.2)}));
              break;
          case 'rhythm':
              mutated = phrase.map(n => ({...n, d: n.d * (0.8 + this.random.next() * 0.4)}));
              break;
      }
      return mutated;
  }

  private invertDegree(deg: string, pivot: string): string {
      const s = DEGREE_TO_SEMITONE[deg] || 0;
      const p = DEGREE_TO_SEMITONE[pivot] || 0;
      const inv = p - (s - p);
      const entry = Object.entries(DEGREE_TO_SEMITONE).find(([k, v]) => v === (inv % 12));
      return entry ? entry[0] : deg;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number) {
      const dynasty = dna.dynasty || 'slow-burn';
      
      let pool = Object.keys(BLUES_SOLO_LICKS).filter(id => 
          BLUES_SOLO_LICKS[id].tags.includes(dynasty) && !this.usedLicksInSuite.has(id)
      );

      if (pool.length === 0) {
          this.usedLicksInSuite.clear();
          pool = Object.keys(BLUES_SOLO_LICKS).filter(id => BLUES_SOLO_LICKS[id].tags.includes(dynasty));
      }

      const nextId = pool[this.random.nextInt(pool.length)] || 'L01';
      this.currentLickId = nextId;
      this.usedLicksInSuite.add(nextId);
      this.currentAxiom = this.mutateLick(BLUES_SOLO_LICKS[nextId].phrase, epoch);
      
      console.info(`%c[SOR] Bar ${epoch} | Unified Mutation: ${this.state.vaccineActive?.type} | New Axiom: ${nextId} | Pool: ${pool.length}`, 'color: #DA70D6; font-weight: bold;');
  }

  private evaluateTimbralDramaturgy(tension: number, hints: InstrumentHints) {
    if (hints.melody) {
        if (tension <= 0.55) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.75) (hints as any).melody = 'cs80';
        else (hints as any).melody = 'guitar_shineOn';
    }
    if (hints.accompaniment) {
        (hints as any).accompaniment = tension > 0.75 ? 'ep_rhodes_warm' : 'organ_soft_jazz';
    }
  }

  private renderLyricalPiano(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 24;
      const noteChance = Math.max(0.1, tension * 0.85); 
      [0, 1.5, 3].forEach(beat => {
          if (this.random.next() < noteChance) {
              events.push({
                  type: 'pianoAccompaniment',
                  note: Math.min(root + [0,3,7,10][this.random.nextInt(4)], this.MELODY_CEILING),
                  time: beat, duration: 2.5, weight: 0.25 + tension * 0.3,
                  technique: 'hit', dynamics: 'p', phrasing: 'staccato'
              });
          }
      });
      return events;
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const barInPhrase = epoch % 4;
    const barNotes = this.currentAxiom.filter(n => n.t >= barInPhrase * 12 && n.t < (barInPhrase + 1) * 12);
    return barNotes.map(n => ({
        type: 'melody',
        note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
        time: (n.t % 12) / 3,
        duration: n.d / 3,
        weight: 0.85, technique: n.tech || 'pick',
        dynamics: tension > 0.7 ? 'mf' : 'p', phrasing: 'legato'
    }));
  }

  // ============================================================================
  // DYNAMIC PERFORMANCE ENGINE (ACCOMPANIMENT)
  // ============================================================================

  private renderDynamicAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    // Scheme: 20% (T<0.4) Soft Pads | 60% (0.4-0.7) Pad+Arp | 20% (T>0.7) Viscous Chords
    if (tension < 0.4) {
        return this.renderSoftPillows(epoch, chord, tension);
    } else if (tension <= 0.7) {
        return this.renderArpPad(epoch, chord, tension);
    } else {
        return this.renderPowerChords(epoch, chord, tension);
    }
  }

  private renderSoftPillows(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7];
    
    // Мягкое появление раз в 2 такта
    if (epoch % 2 !== 0) return [];

    return notes.map((p, i) => ({
        type: 'accompaniment',
        note: p,
        time: 0.5 + i * 0.05,
        duration: 8.0,
        weight: 0.22,
        technique: 'swell',
        dynamics: 'p',
        phrasing: 'legato'
    }));
  }

  private renderArpPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];

    // Базовый пад (тихий)
    events.push({
        type: 'accompaniment', note: root, time: 0, duration: 4.0, weight: 0.25,
        technique: 'swell', dynamics: 'p', phrasing: 'legato'
    });

    // Слышимые арпеджио
    notes.forEach((p, i) => {
        events.push({
            type: 'accompaniment',
            note: p + 12,
            time: 1.0 + i * 0.5,
            duration: 1.5,
            weight: 0.35,
            technique: 'pluck',
            dynamics: 'p',
            phrasing: 'detached'
        });
    });

    return events;
  }

  private renderPowerChords(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 12;
    const isMin = chord.chordType === 'minor';
    const notes = [root, root + (isMin ? 3 : 4), root + 7, root + 10];

    // Вязкие аккордовые удары ("навал")
    [0, 2.0].forEach(t => {
        notes.forEach((p, i) => {
            events.push({
                type: 'accompaniment',
                note: p,
                time: t + i * 0.03,
                duration: 1.8,
                weight: 0.55,
                technique: 'pluck',
                dynamics: 'mf',
                phrasing: 'staccato'
            });
        });
    });

    return events;
  }

  // ============================================================================
  // DYNAMIC PERFORMANCE ENGINE (BASS)
  // ============================================================================

  private renderIronBass(chord: GhostChord, epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
    // Intro Variety: Use chosen style for INTRO
    if (navInfo.currentPart.id === 'INTRO') {
        switch(this.state.introBassStyle) {
            case 'drone': return this.renderDroneBass(chord, epoch);
            case 'riff': return this.renderRiffBass(chord, epoch, tension);
            case 'walking': return this.renderWalkingBass(chord, epoch, tension);
        }
    }

    // Main Tiers: 20% Drone | 60% Riff | 20% Walking
    if (tension < 0.4) {
        return this.renderDroneBass(chord, epoch);
    } else if (tension <= 0.7) {
        return this.renderRiffBass(chord, epoch, tension);
    } else {
        return this.renderWalkingBass(chord, epoch, tension);
    }
  }

  private renderDroneBass(chord: GhostChord, epoch: number): FractalEvent[] {
    // Одна нота на 1-2 такта
    if (epoch % 2 !== 0) return []; 
    return [{
        type: 'bass',
        note: Math.max(chord.rootNote - 12, this.BASS_FLOOR),
        time: 0,
        duration: 8.0, // на 2 такта
        weight: 0.6,
        technique: 'pluck',
        dynamics: 'p',
        phrasing: 'legato',
        params: { attack: 0.5, release: 2.0, filterCutoff: 300 }
    }];
  }

  private renderRiffBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const isMin = chord.chordType === 'minor';
    
    // Несложный рифф: 4-8 ударов
    const pattern = [
        { t: 0, n: root, w: 0.7 },
        { t: 1.0, n: root + 7, w: 0.5 },
        { t: 2.0, n: root + (isMin ? 3 : 4), w: 0.6 },
        { t: 3.0, n: root + 5, w: 0.5 }
    ];

    return pattern.map(p => ({
        type: 'bass',
        note: p.n,
        time: p.t,
        duration: 0.8,
        weight: p.w + (tension * 0.1),
        technique: 'pluck',
        dynamics: 'p',
        phrasing: 'legato',
        params: { attack: 0.1, release: 0.8, filterCutoff: 400 }
    }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const nextRoot = getNextChordRoot(epoch % 12, chord.rootNote) - 12;
    
    // Классический волкинг: 4 ноты на такт
    const notes = [
        root, 
        root + 7, 
        root + 10, 
        nextRoot - 1 // ведущая хроматика
    ];

    return notes.map((p, i) => ({
        type: 'bass', 
        note: p, 
        time: i, 
        duration: 0.9, 
        weight: (i === 0 ? 0.85 : 0.5) + tension * 0.1,
        technique: 'pluck', 
        dynamics: i === 0 ? 'mf' : 'p', 
        phrasing: 'legato'
    }));
  }

  private renderBluesBeat(epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
      const events: FractalEvent[] = [];
      const isBreakdown = navInfo.currentPart.id.includes('MAIN_3') || tension < 0.45;
      const isPeak = tension > 0.75;
      
      const kickTimes = isPeak ? [0, 1, 2, 3] : (isBreakdown ? [0] : [0, 2.66]);
      kickTimes.forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t, duration: 0.1, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));

      if (!isBreakdown) {
          [1, 3].forEach(t => events.push({ type: isPeak ? 'drum_snare' : 'drum_snare_ghost_note', note: 38, time: t, duration: 0.1, weight: isPeak ? 0.7 : 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      }

      [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66].forEach(t => {
          if (isBreakdown && t % 1 !== 0) return;
          events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t, duration: 0.1, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });

      return events;
  }

  private renderCleanSfx(tension: number): FractalEvent[] {
      return [{ type: 'sfx', note: 60, time: 1.0, duration: 4.0, weight: 0.2, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { mood: this.mood, genre: 'blues' } }];
  }
}
