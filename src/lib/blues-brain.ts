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
    DEGREE_TO_SEMITONE,
    decompressCompactPhrase,
    stretchToNarrativeLength
} from './music-theory';
import { 
    getNextChordRoot, 
    getChordNameForBar 
} from './blues-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

/**
 * #ЗАЧЕМ: Блюзовый Мозг V114.0 — "The Eternal Sentinel".
 * #ЧТО: 1. Усилена защита от зацикливания. Теперь отслеживается история LickID.
 *       2. Внедрен Ensemble Panic: при 3-х повторах меняется вся Династия.
 *       3. Исправлен баланс громкости в Tier 3.
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
      lastPianoHash: string,
      lastMelodyHash: string,
      lastAccompHash: string,
      currentMutationType: string,
      lastTension: number,
      tensionMomentum: number,
      activeAccompTimbre: string,
      recentLicks: string[]
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
      lastMelodyHash: '',
      lastAccompHash: '',
      blueNotePending: false,
      emotion: { melancholy: 0.8, darkness: 0.3 },
      stagnationStrikes: { micro: 0, meso: 0, macro: 0 },
      vaccineActive: { part: 'ensemble', type: 'jitter' },
      introBassStyle: selectedIntroStyle,
      currentMutationType: 'jitter',
      lastTension: 0.5,
      tensionMomentum: 0,
      activeAccompTimbre: 'organ_soft_jazz',
      recentLicks: []
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
  ): { events: FractalEvent[], lickId?: string, mutationType?: string } {
    const tension = dna.tensionMap?.[epoch] ?? 0.5;
    
    this.state.tensionMomentum = tension - this.state.lastTension;
    this.state.lastTension = tension;

    if (navInfo.currentPart.id !== this.currentPartId) {
        this.currentPartId = navInfo.currentPart.id;
        this.sfxPlayedInPart = false;
    }

    // --- TIMBRAL HYSTERESIS ---
    if (epoch % 4 === 0 || epoch === 0) {
        this.evaluateTimbralDramaturgy(tension, hints);
    } else {
        if (hints.melody) (hints as any).melody = this.state.lastMelodyHash ? (hints as any).melody : (tension <= 0.40 ? 'blackAcoustic' : (tension <= 0.70 ? 'cs80' : 'guitar_shineOn'));
        if (hints.accompaniment) (hints as any).accompaniment = this.state.activeAccompTimbre;
    }
    
    const isMutationBoundary = epoch % 4 === 0;
    const isStagnating = this.state.stagnationStrikes.micro >= 3;

    if (isStagnating) {
        console.warn(`%c[GUARD] Ensemble Stagnation Detected at bar ${epoch}! Triggering Emergency Mutation.`, 'color: #ff4444; font-weight: bold;');
    }

    if (this.currentAxiom.length === 0 || navInfo.isPartTransition || isMutationBoundary || isStagnating) {
        this.refreshUnifiedMutation();
        this.selectNextAxiom(navInfo, dna, epoch, isStagnating);
        this.state.stagnationStrikes.micro = 0; 
    }

    const events: FractalEvent[] = [];

    const melodyEvents = hints.melody ? this.renderMelodicSegment(epoch, currentChord, tension) : [];
    const accompEvents = hints.accompaniment ? this.renderDynamicAccompaniment(epoch, currentChord, tension) : [];
    const pianoEvents = hints.pianoAccompaniment ? this.renderIntegratedPiano(epoch, currentChord, tension) : [];

    events.push(...melodyEvents);
    events.push(...accompEvents);
    events.push(...pianoEvents);

    if (hints.bass) events.push(...this.renderIronBass(currentChord, epoch, tension, navInfo));
    if (hints.drums) events.push(...this.renderBluesBeat(epoch, tension, navInfo));
    if (hints.harmony) events.push(...this.renderDerivativeHarmony(currentChord, epoch, tension));

    return { 
        events, 
        lickId: this.currentLickId, 
        mutationType: this.state.currentMutationType 
    };
  }

  private renderDerivativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
      const momentum = this.state.tensionMomentum;
      const events: FractalEvent[] = [];
      const root = chord.rootNote;
      
      let probability = 0;
      let useViolin = false;

      if (momentum > 0.001) {
          useViolin = true;
          probability = Math.min(0.85, momentum * 25); 
      } else if (momentum < -0.001) {
          useViolin = false;
          probability = Math.min(0.85, Math.abs(momentum) * 20); 
      } else {
          useViolin = false;
          probability = tension < 0.4 ? 0.3 : 0.1;
      }

      if (this.random.next() > probability) return [];

      const notes = useViolin ? [root + 12, root + 19] : [root, root + 7, root + 10];

      notes.forEach((n, i) => {
          events.push({
              type: 'harmony',
              note: n + (useViolin ? 12 : 0),
              time: i * 0.1,
              duration: 8.0,
              weight: (useViolin ? 0.12 : 0.22),
              technique: 'swell',
              dynamics: 'p',
              phrasing: 'legate',
              chordName: chord.chordType === 'minor' ? 'Am' : 'E',
              params: { barCount: epoch, filterCutoff: 3000 }
          });
      });

      return events;
  }

  private refreshUnifiedMutation() {
      const types: ('jitter' | 'inversion' | 'rhythm' | 'transposition')[] = ['jitter', 'inversion', 'rhythm', 'transposition'];
      const nextType = types[this.random.nextInt(types.length)];
      this.state.currentMutationType = nextType;
  }

  private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number, forceNewDynasty: boolean = false) {
      let dynasty = dna.dynasty || 'slow-burn';
      
      // #ЗАЧЕМ: Если ансамбль стагнирует, мы меняем Династию принудительно.
      if (forceNewDynasty) {
          const dynasties = ['slow-burn', 'texas', 'soul', 'chromatic', 'legacy', 'lyrical'];
          dynasty = dynasties[this.random.nextInt(dyn dynasties.length)];
          console.log(`[GUARD] Switching Dynasty to: ${dynasty}`);
      }

      const allLickIds = Object.keys(BLUES_SOLO_LICKS);
      
      // Ищем лики, которые не играли в последних 5 фразах
      let pool = allLickIds.filter(id => 
          BLUES_SOLO_LICKS[id].tags.includes(dynasty) && 
          !this.state.recentLicks.includes(id)
      );

      if (pool.length === 0) {
          this.state.recentLicks = [];
          pool = allLickIds.filter(id => BLUES_SOLO_LICKS[id].tags.includes(dynasty));
      }

      const nextId = pool[this.random.nextInt(pool.length)] || 'LN_01';
      
      // Проверка на повтор (Страйк)
      if (nextId === this.currentLickId) {
          this.state.stagnationStrikes.micro++;
          console.log(`%c[GUARD] Stagnation Strike! (${this.state.stagnationStrikes.micro}/3)`, 'color: #ffa500;');
      }

      this.currentLickId = nextId;
      this.state.recentLicks.push(nextId);
      if (this.state.recentLicks.length > 5) this.state.recentLicks.shift();
      
      const lickData = BLUES_SOLO_LICKS[nextId];
      const rawPhrase = Array.isArray(lickData.phrase) ? lickData.phrase : decompressCompactPhrase(lickData.phrase as any);
      
      const stretchedPhrase = stretchToNarrativeLength(rawPhrase, 48, this.random);
      this.currentAxiom = this.mutateLick(stretchedPhrase);
  }

  private mutateLick(phrase: any[]): any[] {
      const type = this.state.currentMutationType;
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
        if (tension <= 0.40) (hints as any).melody = 'blackAcoustic';
        else if (tension <= 0.70) (hints as any).melody = 'cs80';
        else (hints as any).melody = 'guitar_shineOn';
    }
    if (hints.accompaniment) {
        let nextTimbre = this.state.activeAccompTimbre;
        if (this.state.activeAccompTimbre === 'organ_soft_jazz' && tension > 0.75) {
            nextTimbre = 'ep_rhodes_warm';
        } else if (this.state.activeAccompTimbre === 'ep_rhodes_warm' && tension < 0.65) {
            nextTimbre = 'organ_soft_jazz';
        }
        
        this.state.activeAccompTimbre = nextTimbre;
        (hints as any).accompaniment = nextTimbre;
    }
  }

  private renderMelodicSegment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const lickTicks = Math.max(...this.currentAxiom.map(n => n.t + n.d), 0) || 12;
    const lickBars = Math.ceil(lickTicks / 12);
    
    const effectiveBar = epoch % lickBars;
    const barOffset = effectiveBar * 12;
    const barNotes = this.currentAxiom.filter(n => n.t >= barOffset && n.t < barOffset + 12);
    
    const events: FractalEvent[] = [];
    const momentum = this.state.tensionMomentum;

    barNotes.forEach((n, i) => {
        const nextNote = barNotes[i+1];
        let duration = n.d / 3;
        if (nextNote && (nextNote.t - (n.t + n.d)) < 1) {
            duration += 0.15; 
        }

        if (momentum < 0) duration *= (1.0 + Math.abs(momentum) * 5); 
        if (momentum > 0) duration *= (1.0 - momentum * 3); 

        const phraseProgress = (n.t % 48) / 48;
        const exhaleModifier = 1.0 - (phraseProgress * 0.3);

        const isAccent = n.t % 6 === 0;
        const baseWeight = isAccent ? 0.98 : 0.88; 
        const momentumBoost = momentum > 0 ? momentum * 4 : 0;
        const finalWeight = (baseWeight + momentumBoost) * exhaleModifier * (0.95 + this.random.next() * 0.1);

        const event: FractalEvent = {
            type: 'melody',
            note: Math.min(chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0) + (n.octShift || 0), this.MELODY_CEILING),
            time: (n.t % 12) / 3,
            duration: duration,
            weight: finalWeight,
            technique: n.tech || 'pick',
            dynamics: (tension > 0.60 || momentum > 0.03) ? 'mf' : 'p',
            phrasing: momentum < -0.02 ? 'legato' : (momentum > 0.02 ? 'staccato' : 'detached'),
            params: { barCount: epoch }
        };

        events.push(event);

        if ((tension > 0.75 || momentum > 0.07) && this.random.next() < 0.4) {
            events.push({
                ...event,
                note: event.note - 12,
                weight: event.weight * 0.55,
                dynamics: 'p'
            });
        }
    });

    return events;
  }

  private renderDynamicAccompaniment(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
    const momentum = this.state.tensionMomentum;
    const effectiveTension = tension + momentum * 5;

    if (effectiveTension < 0.4) return this.renderSoftPillows(epoch, chord, tension);
    else if (effectiveTension <= 0.7) return this.renderArpPad(epoch, chord, tension);
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
            events.push({ 
                type: 'accompaniment', 
                note: p, 
                time: t + i * 0.03, 
                duration: 1.5, 
                weight: 0.38, 
                technique: 'pluck', 
                dynamics: 'mf', 
                phrasing: 'staccato' 
            });
        });
    });
    return events;
  }

  private renderIronBass(chord: GhostChord, epoch: number, tension: number, navInfo: NavigationInfo): FractalEvent[] {
    const momentum = this.state.tensionMomentum;
    const effectiveTension = tension + momentum * 3;

    if (effectiveTension < 0.4) {
        return this.renderDroneBass(chord, epoch);
    } else if (effectiveTension <= 0.7) {
        return this.renderRiffBass(chord, epoch, tension);
    } else {
        return this.renderWalkingBass(chord, epoch, tension);
    }
  }

  private renderDroneBass(chord: GhostChord, epoch: number): FractalEvent[] {
    return [{ 
        type: 'bass', 
        note: Math.max(chord.rootNote - 12, this.BASS_FLOOR), 
        time: 0, 
        duration: 3.5, 
        weight: 0.65, 
        technique: 'pluck', 
        dynamics: 'p', 
        phrasing: 'legato', 
        params: { attack: 0.5, release: 2.0, filterCutoff: 300 } 
    }];
  }

  private renderRiffBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const barInRiff = epoch % 4;
    
    // Smoke on the Water style logic
    const riffs = [
        [
            [{ t: 0, n: root, w: 0.85 }, { t: 2.0, n: root + 7, w: 0.7 }],
            [{ t: 0, n: root, w: 0.8 }, { t: 1.5, n: root, w: 0.7 }, { t: 2.5, n: root + 7, w: 0.75 }],
            [{ t: 0, n: root, w: 0.85 }, { t: 2.0, n: root + 7, w: 0.7 }, { t: 3.5, n: root + 10, w: 0.65 }],
            [{ t: 0, n: root + 7, w: 0.75 }, { t: 1.5, n: root + 5, w: 0.7 }, { t: 2.5, n: root, w: 0.9 }]
        ]
    ];

    const currentRiff = riffs[0]; 
    const currentBarPattern = currentRiff[barInRiff];
    
    return currentBarPattern.map(p => ({
        type: 'bass',
        note: p.n,
        time: p.t,
        duration: 1.2, 
        weight: (p.w + (tension * 0.1)) * (0.95 + this.random.next() * 0.1),
        technique: 'pluck',
        dynamics: p.t === 0 ? 'mf' : 'p',
        phrasing: 'legato',
        params: { attack: 0.1, release: 0.8, filterCutoff: 450 }
    }));
  }

  private renderWalkingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
    const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
    const nextRoot = getNextChordRoot(epoch % 12, chord.rootNote) - 12;
    const notes = [ root, root + 7, root + 10, nextRoot - 1 ];
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
      const momentum = this.state.tensionMomentum;
      const isBreakdown = navInfo.currentPart.id.includes('BRIDGE') || (tension < 0.42 && momentum <= 0);
      const isPeak = tension > 0.72 || momentum > 0.1;
      const kickTimes = isPeak ? [0, 1, 2, 3] : (isBreakdown ? [0] : [0, 2.66]);
      kickTimes.forEach(t => events.push({ type: 'drum_kick_reso', note: 36, time: t, duration: 0.1, weight: 0.5 + (tension * 0.2), technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
      if (!isBreakdown) { [1, 3].forEach(t => events.push({ type: isPeak ? 'drum_snare' : 'drum_snare_ghost_note', note: 38, time: t, duration: 0.1, weight: isPeak ? 0.75 : 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato' })); }
      [0, 0.66, 1, 1.66, 2, 2.66, 3, 3.66].forEach(t => {
          if (isBreakdown && t % 1 !== 0) return;
          events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t, duration: 0.1, weight: 0.22, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
      });
      return events;
  }

  private renderIntegratedPiano(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote + 24;
      const isMin = chord.chordType === 'minor' || chord.chordType === 'dimidished';
      const degrees = [0, isMin ? 3 : 4, 7, 10, 14];
      const momentum = this.state.tensionMomentum;
      
      const noteChance = 0.12 + (tension * 0.25); 
      [1.5, 3.5].forEach(beat => {
          if (this.random.next() < noteChance && momentum >= -0.01) { 
              const deg = degrees[this.random.nextInt(degrees.length)];
              events.push({
                  type: 'pianoAccompaniment',
                  note: Math.min(root + deg, this.MELODY_CEILING),
                  time: beat, duration: 4.0, weight: 0.20 + tension * 0.08,
                  technique: 'hit', dynamics: 'p', phrasing: 'staccato',
                  params: { barCount: epoch }
              });
          }
      });
      return events;
  }

  private evolveEmotion(epoch: number): void {
    this.state.emotion.melancholy += (this.random.next() - 0.5) * 0.06;
    this.state.emotion.darkness += (this.random.next() - 0.5) * 0.04;
    this.state.emotion.melancholy = Math.max(0.65, Math.min(0.95, this.state.emotion.melancholy));
    this.state.emotion.darkness = Math.max(0.15, Math.min(0.45, this.state.emotion.darkness));
  }

  private updatePhrasePhase(barIn12: number): void {
    if (barIn12 < 4) this.state.phraseState = 'call';
    else if (barIn12 < 8) this.state.phraseState = 'call_var';
    else this.state.phraseState = 'response';
  }
}
