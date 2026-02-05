import type {
  FractalEvent,
  Mood,
  GhostChord,
  SuiteDNA,
  NavigationInfo,
  BluesCognitiveState,
  InstrumentHints,
  Technique,
  Dynamics,
  Phrasing
} from '@/types/music';

/**
 * #ЗАЧЕМ: Блюзовый Мозг — живая генерация уникальных 120-тактных пьес без зацикленности.
 * #ЧТО: 
 *   1. Каждый 12-тактный цикл уникален (4 фазы эволюции)
 *   2. Язык напряжений: ♭5 → разрешение (5/3)
 *   3. Волкинг-бас генерируется на лету по правилам проходящих/ведущих нот
 *   4. Эмоциональная арка: 120 тактов = нарастание → пик → затухание
 *   5. Полная совместимость с блюпринтами (winter.ts) и пресетами (guitar_shineOn)
 */

// ============================================================================
// КОНСТАНТЫ БЛЮЗОВОЙ ТЕОРИИ
// ============================================================================

/** Минорная пентатоника + блюзовая нота (♭5) */
const BLUES_SCALE_DEGREES = [0, 3, 5, 6, 7, 10]; // semitone offsets from root

/** 12-bar blues progression offsets (semitones from root) */
const BLUES_PROGRESSION_OFFSETS = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];

/** Получить следующий корень для ведущей ноты баса */
function getNextChordRoot(barIndex: number, rootNote: number): number {
  const nextBar = (barIndex + 1) % 12;
  return rootNote + BLUES_PROGRESSION_OFFSETS[nextBar];
}

/** Получить имя аккорда для такта */
function getChordNameForBar(barIndex: number): string {
  const progression = ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'v7', 'iv7', 'i7', 'v7'];
  return progression[barIndex % 12];
}

// ============================================================================
// КЛАСС БЛЮЗОВОГО МОЗГА
// ============================================================================

export class BluesBrain {
  private random: { next: () => number; nextInt: (max: number) => number };
  private cognitiveState: BluesCognitiveState;
  private chorusCount: number = 0; // Счётчик 12-тактных циклов (для эволюции)
  private tensionLevel: number = 0.3;
  private blueNotePending: boolean = false;
  private lastAscendingBar: number = -10;
  private phraseHistory: string[] = [];

  constructor(seed: number, mood: Mood) {
    // Инициализация рандома с сидом
    let state = seed;
    this.random = {
      next: () => {
        state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
        return state / Math.pow(2, 32);
      },
      nextInt: (max: number) => Math.floor(this.random.next() * max)
    };

    // Инициализация когнитивного состояния
    this.cognitiveState = {
      phraseState: 'call',
      tensionLevel: 0.3,
      phraseHistory: [],
      lastPhraseHash: '',
      blueNotePending: false,
      emotion: {
        melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4,
        darkness: ['dark', 'gloomy'].includes(mood) ? 0.35 : 0.2
      }
    };
  }

  // ───── ГЛАВНЫЙ МЕТОД ГЕНЕРАЦИИ ─────

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    const barIn12 = epoch % 12;
    const barDuration = 60 / (navInfo?.currentPart?.instrumentRules?.bpm?.base || 72); // seconds per bar

    // === ЭВОЛЮЦИЯ МЕЖДУ ЦИКЛАМИ (каждые 12 тактов) ===
    if (barIn12 === 0) {
      this.chorusCount++; // Новый цикл
      
      // Эмоциональная арка на 120 тактов (10 циклов)
      const totalCycles = 10;
      const cycleProgress = Math.min(1.0, this.chorusCount / totalCycles);
      
      // Арка: нарастание → пик (цикл 7) → затухание
      let melancholy: number;
      let darkness: number;
      
      if (cycleProgress < 0.7) {
        // Нарастание к пику
        melancholy = 0.7 + cycleProgress * 0.25;
        darkness = 0.2 + cycleProgress * 0.15;
      } else {
        // Затухание после пика
        const decay = (cycleProgress - 0.7) / 0.3;
        melancholy = 0.95 - decay * 0.3;
        darkness = 0.35 - decay * 0.1;
      }
      
      // Броуновский шум для естественности
      melancholy += (this.random.next() - 0.5) * 0.08;
      darkness += (this.random.next() - 0.5) * 0.06;
      
      // Клиппинг
      melancholy = Math.max(0.65, Math.min(0.95, melancholy));
      darkness = Math.max(0.15, Math.min(0.45, darkness));
      
      this.cognitiveState.emotion.melancholy = melancholy;
      this.cognitiveState.emotion.darkness = darkness;
      this.tensionLevel = 0.3 + cycleProgress * 0.4;
    }

    // === ОПРЕДЕЛЕНИЕ ФАЗЫ ФРАЗЫ ===
    const phrasePhase = barIn12 < 4 ? 'call' : (barIn12 < 8 ? 'call_var' : 'response');
    this.cognitiveState.phraseState = phrasePhase;

    // === ГЕНЕРАЦИЯ ПАРТИЙ ===
    
    // 1. Ударные
    if (hints.drums) {
      events.push(...this.generateDrums(epoch, barDuration));
    }
    
    // 2. Бас
    if (hints.bass) {
      events.push(...this.generateWalkingBass(currentChord, epoch, barDuration));
    }
    
    // 3. Аккомпанемент — динамический выбор манеры
    if (hints.accompaniment) {
      const accompRules = navInfo?.currentPart?.instrumentRules?.accompaniment;
      const selectedTechnique = this.pickTechnique(accompRules?.techniques) || 'rhythmic-comp';

      if (selectedTechnique === 'long-chords' || selectedTechnique === 'swell') {
        events.push(...this.generateSustainedComping(currentChord, epoch, barDuration));
      } else if (selectedTechnique === 'arpeggio-slow') {
        events.push(...this.generateSoftArpeggio(currentChord, epoch, barDuration));
      } else {
        events.push(...this.generateTravisPicking(currentChord, epoch, barDuration));
      }
    }
    
    // 4. Мелодия
    if (hints.melody) {
      const melodyEvents = this.generateBluesMelody(
        currentChord, 
        epoch, 
        barDuration, 
        phrasePhase
      );
      
      // Защита от похоронного марша
      const guardedEvents = this.applyAntiFuneralMarch(melodyEvents, epoch, barDuration);
      events.push(...guardedEvents);
    }

    return events;
  }

  // ============================================================================
  // 1. УДАРНЫЕ — НАСТОЯЩИЙ СВИНГ
  // ============================================================================

  private generateDrums(epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];

    // Кик: 1 и 3 доли с вариацией
    [0, 2].forEach(beat => {
      const humanOffset = (this.random.next() * 20 - 10) / 1000;
      events.push({
        type: 'drum_kick',
        note: 36,
        time: beat * barDuration + humanOffset,
        duration: barDuration * 0.3,
        weight: 0.85 - beat * 0.05,
        technique: 'hit' as Technique,
        dynamics: 'mf' as Dynamics,
        phrasing: 'staccato' as Phrasing
      });
    });

    // Снейр: 2 и 4 доли с триольным свингом
    const swingRatio = 0.66 + (this.random.next() - 0.5) * 0.08;
    
    [1, 3].forEach(beat => {
      const baseTime = beat * barDuration;
      const swungTime = baseTime * swingRatio + (1 - swingRatio) * barDuration;
      const humanOffset = (this.random.next() * 25 - 12) / 1000;
      
      events.push({
        type: 'drum_snare',
        note: 38,
        time: swungTime + humanOffset,
        duration: barDuration * 0.25,
        weight: 0.8,
        technique: 'hit' as Technique,
        dynamics: 'mf' as Dynamics,
        phrasing: 'staccato' as Phrasing
      });
    });

    // Хай-хэт: восьмые с триольным свингом
    for (let i = 0; i < 8; i++) {
      const isTripletFirst = i % 3 === 0;
      const baseTime = (i / 2) * barDuration;
      const swungTime = isTripletFirst 
        ? baseTime * 0.66 
        : baseTime * 0.34 + barDuration * 0.66;
      
      if (this.cognitiveState.emotion.melancholy > 0.8 && i % 2 === 1 && this.random.next() < 0.4) {
        continue;
      }
      
      const humanOffset = (this.random.next() * 15 - 7) / 1000;
      events.push({
        type: 'drum_hihat',
        note: 42,
        time: swungTime + humanOffset,
        duration: barDuration * 0.15,
        weight: 0.35 + this.random.next() * 0.2,
        technique: 'hit' as Technique,
        dynamics: 'p' as Dynamics,
        phrasing: 'staccato' as Phrasing
      });
    }

    return events;
  }

  // ============================================================================
  // 2. БАС — ВОЛКИНГ НА ЛЕТУ
  // ============================================================================

  private generateWalkingBass(
    chord: GhostChord,
    epoch: number,
    barDuration: number
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote - 12; // октава ниже
    const barIn12 = epoch % 12;
    const nextRoot = getNextChordRoot(barIn12, chord.rootNote) - 12;

    const passingNote = this.random.next() < 0.6 ? root + 1 : root + 2;
    const leadingNote = nextRoot - 1;

    const notes = [root, passingNote, root + 7, leadingNote];
    const dynamics = ['mf', 'mp', 'mp', 'mp'] as const;

    notes.forEach((note, i) => {
      const humanOffset = (this.random.next() * 30 - 15) / 1000;
      
      events.push({
        type: 'bass',
        note,
        time: i * (barDuration / 4) + humanOffset,
        duration: (barDuration / 4) * 0.92,
        weight: 0.9 - i * 0.1,
        technique: 'pluck' as Technique,
        dynamics: dynamics[i],
        phrasing: 'legato' as Phrasing,
        harmonicContext: getChordNameForBar(barIn12)
      });
    });

    return events;
  }

  // ============================================================================
  // 3. АККОМПАНЕМЕНТ — ТЕХНИКИ
  // ============================================================================

  private generateTravisPicking(
    chord: GhostChord,
    epoch: number,
    barDuration: number
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote;
    const isMinor = chord.chordType === 'minor';

    const chordNotes = [
      root,
      root + (isMinor ? 3 : 4),
      root + 7,
      root + 10
    ];

    const pattern = epoch % 2 === 0 
      ? [0, 2, 1, 3, 0, 2, 1, 3] 
      : [0, 3, 1, 2, 0, 3, 1, 2];

    pattern.forEach((noteIdx, i) => {
      const beat = Math.floor(i / 2);
      const subBeat = i % 2;
      const isBassBeat = beat % 2 === 0 && subBeat === 0;
      const pitch = isBassBeat ? chordNotes[0] : chordNotes[noteIdx % chordNotes.length];
      const time = beat * barDuration + (subBeat * barDuration * 0.5);
      const duration = isBassBeat ? barDuration * 0.7 : barDuration * 0.4;
      
      events.push({
        type: 'accompaniment',
        note: pitch + 12,
        time: time + (this.random.next() * 0.015),
        duration,
        weight: isBassBeat ? 0.4 : 0.25,
        technique: 'pluck' as Technique,
        dynamics: 'p' as Dynamics,
        phrasing: 'detached' as Phrasing,
        harmonicContext: getChordNameForBar(epoch % 12)
      });
    });

    return events;
  }

  /**
   * #ЗАЧЕМ: Мягкие, протяжные аккорды для создания "Hammond Bed".
   * #ЧТО: Генерирует блок-аккорд на весь такт с техникой 'swell'.
   */
  private generateSustainedComping(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote;
    const isMinor = chord.chordType === 'minor';

    // 1, 3, 5, 7
    const chordNotes = [
      root,
      root + (isMinor ? 3 : 4),
      root + 7,
      root + 10
    ];

    chordNotes.forEach((pitch, i) => {
      events.push({
        type: 'accompaniment',
        note: pitch + 12, // 4-я октава
        time: i * 0.05, // Легкое "рассыпание" для естественности
        duration: 4.0, // На весь такт
        weight: 0.35 - (i * 0.05),
        technique: 'swell' as Technique,
        dynamics: 'p' as Dynamics,
        phrasing: 'legato' as Phrasing,
        harmonicContext: getChordNameForBar(epoch % 12)
      });
    });
    return events;
  }

  /**
   * #ЗАЧЕМ: Медленное, мечтательное арпеджио.
   * #ЧТО: Поднимается вверх по аккорду в течение такта.
   */
  private generateSoftArpeggio(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote;
    const isMinor = chord.chordType === 'minor';
    const notes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10, root + 12];

    notes.forEach((pitch, i) => {
      events.push({
        type: 'accompaniment',
        note: pitch + 12,
        time: i * 0.75, // Очень медленно
        duration: 2.5,
        weight: 0.3,
        technique: 'pluck' as Technique,
        dynamics: 'p' as Dynamics,
        phrasing: 'detached' as Phrasing,
        harmonicContext: getChordNameForBar(epoch % 12)
      });
    });
    return events;
  }

  private pickTechnique(techniques?: { value: string; weight: number }[]): string | null {
    if (!techniques || techniques.length === 0) return null;
    const totalWeight = techniques.reduce((sum, t) => sum + t.weight, 0);
    let rand = this.random.next() * totalWeight;
    for (const t of techniques) {
      rand -= t.weight;
      if (rand <= 0) return t.value;
    }
    return techniques[0].value;
  }

  // ============================================================================
  // 4. МЕЛОДИЯ — ЯЗЫК НАПРЯЖЕНИЙ
  // ============================================================================

  private generateBluesMelody(
    chord: GhostChord,
    epoch: number,
    barDuration: number,
    phrasePhase: 'call' | 'call_var' | 'response'
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote;
    const cyclePhase = this.chorusCount % 4;

    if (phrasePhase === 'call') {
      if (cyclePhase === 0) {
        events.push(...this.generateCallPhrase(root, barDuration, [
          { deg: 10, t: 0.0 }, { deg: 7, t: 0.5 }, { deg: 6, t: 1.0 }, { deg: 3, t: 1.5 }
        ]));
      } else if (cyclePhase === 1) {
        events.push(...this.generateCallPhrase(root, barDuration, [
          { deg: 10, t: 0.0 }, { deg: 9, t: 0.3 }, { deg: 8, t: 0.6 }, { deg: 6, t: 0.9 }, { deg: 5, t: 1.4 }
        ]));
      } else if (cyclePhase === 2) {
        events.push(...this.generateCallPhraseWithPause(root, barDuration, [
          { deg: 10, t: 0.0 }, { deg: 7, t: 0.6 }, { deg: 6, t: 1.4 }, { deg: 3, t: 2.0 }
        ]));
      } else {
        events.push(...this.generateCallPhrase(root, barDuration, [
          { deg: 10, t: 0.0 }, { deg: 12, t: 0.4 }, { deg: 13, t: 0.8 }, { deg: 6, t: 1.2 }, { deg: 7, t: 1.7 }
        ]));
      }
    } 
    else if (phrasePhase === 'call_var') {
      events.push(...this.generateCallVariation(root, barDuration));
    } 
    else {
      events.push(...this.generateResponsePhrase(root, barDuration));
    }

    this.applyMicroArticulation(events, barDuration);
    return events;
  }

  private generateCallPhrase(root: number, barDuration: number, notes: Array<{ deg: number; t: number }>): FractalEvent[] {
    const events: FractalEvent[] = [];
    notes.forEach((noteInfo, i) => {
      const pitch = root + BLUES_SCALE_DEGREES[noteInfo.deg % 6] + 24;
      const technique = noteInfo.deg === 3 && this.random.next() < 0.75 ? 'bend' : 'pick';
      const duration = i === notes.length - 1 ? barDuration * 1.8 : barDuration * 0.7;
      events.push({
        type: 'melody', note: pitch, time: noteInfo.t * barDuration, duration, weight: 0.85 - i * 0.1,
        technique: technique as Technique, dynamics: 'mp' as Dynamics, phrasing: 'legato' as Phrasing, harmonicContext: 'i7'
      });
    });
    if (notes.some(n => n.deg === 3)) { this.tensionLevel = Math.min(1.0, this.tensionLevel + 0.35); this.blueNotePending = true; }
    events.push({ type: 'rest', time: notes.length * barDuration * 0.5, duration: barDuration * 1.2, weight: 0.95, phrasing: 'breath' as Phrasing });
    return events;
  }

  private generateCallPhraseWithPause(root: number, barDuration: number, notes: Array<{ deg: number; t: number }>): FractalEvent[] {
    const events: FractalEvent[] = [];
    notes.forEach((noteInfo, i) => {
      const pitch = root + BLUES_SCALE_DEGREES[noteInfo.deg % 6] + 24;
      events.push({
        type: 'melody', note: pitch, time: noteInfo.t * barDuration, duration: barDuration * 0.7, weight: 0.85 - i * 0.1,
        technique: noteInfo.deg === 3 ? 'bend' : 'pick' as Technique, dynamics: 'mp' as Dynamics, phrasing: 'legato' as Phrasing, harmonicContext: 'i7'
      });
    });
    this.tensionLevel = Math.min(1.0, this.tensionLevel + 0.4); this.blueNotePending = true;
    events.push({ type: 'rest', time: notes.length * barDuration * 0.5, duration: barDuration * 1.5, weight: 0.95, phrasing: 'breath' as Phrasing });
    return events;
  }

  private generateCallVariation(root: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const notes = [{ deg: 3, t: 0.0 }, { deg: 5, t: 0.6 }, { deg: 6, t: 1.2 }, { deg: 5, t: 1.8 }];
    notes.forEach((noteInfo, i) => {
      const pitch = root + BLUES_SCALE_DEGREES[noteInfo.deg % 6] + 24;
      events.push({
        type: 'melody', note: pitch, time: noteInfo.t * barDuration, duration: barDuration * 0.65, weight: 0.8 + i * 0.03,
        technique: noteInfo.deg === 3 ? 'bend' : 'pick' as Technique, dynamics: 'mp' as Dynamics, phrasing: 'legato' as Phrasing, harmonicContext: 'i7'
      });
    });
    this.tensionLevel = Math.min(1.0, this.tensionLevel + 0.2); this.blueNotePending = true;
    return events;
  }

  private generateResponsePhrase(root: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const notes = this.blueNotePending
      ? [{ deg: 3, t: 0.0 }, { deg: 5, t: 0.7 }, { deg: 7, t: 1.4 }]
      : [{ deg: 0, t: 0.0 }, { deg: 3, t: 0.8 }, { deg: 7, t: 1.6 }];
    notes.forEach((noteInfo, i) => {
      const pitch = root + BLUES_SCALE_DEGREES[noteInfo.deg % 6] + 24;
      const technique = i === notes.length - 1 && this.random.next() < 0.8 ? 'vibrato' : 'pick';
      events.push({
        type: 'melody', note: pitch, time: noteInfo.t * barDuration, duration: barDuration * 0.85, weight: 0.8 + i * 0.05,
        technique: technique as Technique, dynamics: 'mf' as Dynamics, phrasing: 'portamento' as Phrasing, harmonicContext: 'i7'
      });
    });
    this.tensionLevel = Math.max(0.1, this.tensionLevel - 0.4); this.blueNotePending = false;
    return events;
  }

  private applyMicroArticulation(events: FractalEvent[], barDuration: number): void {
    const swingRatio = 0.66 + (this.random.next() - 0.5) * 0.08;
    const maxOffsetMs = 20 + this.cognitiveState.emotion.melancholy * 15;
    events.forEach((event, i) => {
      if (event.type !== 'rest') {
        if (i % 2 === 1) { event.time = event.time * swingRatio + (1 - swingRatio) * barDuration; }
        const offsetMs = (this.random.next() * maxOffsetMs * 2 - maxOffsetMs) / 1000;
        event.time += offsetMs;
        if (event.technique === 'vibrato' || event.technique === 'bend') { event.weight *= 0.95 + this.random.next() * 0.1; }
      }
    });
  }

  private applyAntiFuneralMarch(events: FractalEvent[], epoch: number, barDuration: number): FractalEvent[] {
    if (epoch - this.lastAscendingBar >= 6 && this.tensionLevel > 0.5) {
      const melodyEvents = events.filter(e => e.type === 'melody');
      if (melodyEvents.length > 0) {
        const lastMelodyEvent = melodyEvents[melodyEvents.length - 1];
        if (lastMelodyEvent.note !== undefined) {
          events.push({
            type: 'melody', note: lastMelodyEvent.note + 5, time: lastMelodyEvent.time + lastMelodyEvent.duration + 0.3, duration: 1.2, weight: 0.92,
            technique: 'vibrato' as Technique, dynamics: 'mf' as Dynamics, phrasing: 'sostenuto' as Phrasing, harmonicContext: 'i7'
          });
          this.lastAscendingBar = epoch; this.tensionLevel = 0.2;
        }
      }
    }
    return events;
  }

  getEmotionState() { return { ...this.cognitiveState.emotion }; }
  getTensionLevel() { return this.tensionLevel; }
  resetState() {
    this.cognitiveState = { phraseState: 'call', tensionLevel: 0.3, phraseHistory: [], lastPhraseHash: '', blueNotePending: false, emotion: { ...this.cognitiveState.emotion } };
    this.chorusCount = 0; this.tensionLevel = 0.3; this.blueNotePending = false; this.lastAscendingBar = -10;
  }
}
