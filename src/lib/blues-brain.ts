import type {
  FractalEvent,
  Mood,
  GhostChord,
  SuiteDNA,
  NavigationInfo,
  InstrumentHints,
  Technique,
  Dynamics,
  Phrasing
} from '@/types/music';

/**
 * #ЗАЧЕМ: Блюзовый Мозг с логированием всей генерации.
 * #ЧТО: Выводит в консоль каждую ноту/событие по мере генерации.
 */

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const BLUES_SCALE = [0, 3, 5, 6, 7, 10]; // [1, ♭3, 4, ♭5, 5, ♭7]
const BLUES_PROGRESSION = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];

function getChordNameForBar(barIndex: number): string {
  const progression = ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'v7', 'iv7', 'i7', 'v7'];
  return progression[barIndex % 12];
}

function getNextChordRoot(barIndex: number, rootNote: number): number {
  const nextBar = (barIndex + 1) % 12;
  return rootNote + BLUES_PROGRESSION[nextBar];
}

// ============================================================================
// ГЕНЕРАТОР
// ============================================================================

export class BluesBrain {
  private random: { next: () => number; nextInt: (max: number) => number };
  private chorusCount: number = 0;
  private tensionLevel: number = 0.3;
  private blueNotePending: boolean = false;

  constructor(seed: number, mood: Mood) {
    let state = seed;
    this.random = {
      next: () => {
        state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
        return state / Math.pow(2, 32);
      },
      nextInt: (max: number) => Math.floor(this.random.next() * max)
    };
  }

  public generateBar(
    epoch: number,
    currentChord: GhostChord,
    navInfo: NavigationInfo,
    dna: SuiteDNA,
    hints: InstrumentHints
  ): FractalEvent[] {
    const barIn12 = epoch % 12;
    const barDuration = 60 / (navInfo.tempo || 72);
    const events: FractalEvent[] = [];

    // === ЭВОЛЮЦИЯ ЦИКЛОВ ===
    if (barIn12 === 0) {
      this.chorusCount++;
    }

    // === ФАЗА ФРАЗЫ ===
    const phraseType = barIn12 < 4 ? 'call' : (barIn12 < 8 ? 'call_var' : 'response');

    // === ГЕНЕРАЦИЯ ===
    if (hints.drums) {
      const drumEvents = this.generateDrums(barDuration);
      drumEvents.forEach(event => {
        console.log(`[DRUMS] Bar ${epoch}, Time: ${event.time.toFixed(2)}s, Note: ${event.note}, Type: ${event.type}`);
      });
      events.push(...drumEvents);
    }
    if (hints.bass) {
      const bassEvents = this.generateWalkingBass(currentChord, epoch, barDuration);
      bassEvents.forEach(event => {
        console.log(`[BASS] Bar ${epoch}, Time: ${event.time.toFixed(2)}s, Note: ${event.note}, Type: ${event.type}, Technique: ${event.technique}`);
      });
      events.push(...bassEvents);
    }
    if (hints.accompaniment) {
      const accompEvents = this.generateTravisPicking(currentChord, epoch, barDuration);
      accompEvents.forEach(event => {
        console.log(`[ACCOMP] Bar ${epoch}, Time: ${event.time.toFixed(2)}s, Note: ${event.note}, Type: ${event.type}, Harmonic: ${event.harmonicContext}`);
      });
      events.push(...accompEvents);
    }
    if (hints.melody) {
      const melodyEvents = this.generateBluesMelody(currentChord, epoch, barDuration, phraseType);
      melodyEvents.forEach(event => {
        console.log(`[MELODY] Bar ${epoch}, Time: ${event.time.toFixed(2)}s, Note: ${event.note}, Type: ${event.type}, Technique: ${event.technique}, Harmonic: ${event.harmonicContext}`);
      });
      events.push(...melodyEvents);
    }

    return events;
  }

  // ───── УДАРНЫЕ ─────
  private generateDrums(barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const swing = 0.66 + (this.random.next() - 0.5) * 0.08;

    // Кик: 1 и 3
    [0, 2].forEach(beat => {
      events.push({
        type: 'drum_kick',
        note: 36,
        time: beat * barDuration,
        duration: barDuration * 0.3,
        weight: 0.8,
        technique: 'hit' as Technique,
        dynamics: 'mf' as Dynamics,
        phrasing: 'staccato' as Phrasing
      });
    });

    // Снейр: 2 и 4
    [1, 3].forEach(beat => {
      events.push({
        type: 'drum_snare',
        note: 38,
        time: beat * barDuration * swing,
        duration: barDuration * 0.25,
        weight: 0.75,
        technique: 'hit' as Technique,
        dynamics: 'mf' as Dynamics,
        phrasing: 'staccato' as Phrasing
      });
    });

    return events;
  }

  // ───── БАС ─────
  private generateWalkingBass(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote - 12;
    const nextRoot = getNextChordRoot(epoch, chord.rootNote) - 12;

    const notes = [
      root,                           // 1
      this.random.next() < 0.6 ? root + 1 : root + 2, // проходящая
      root + 7,                      // 5
      nextRoot - 1                   // ведущая
    ];

    notes.forEach((note, i) => {
      events.push({
        type: 'bass',
        note,
        time: i * (barDuration / 4),
        duration: (barDuration / 4) * 0.9,
        weight: 0.9 - i * 0.1,
        technique: 'pluck' as Technique,
        dynamics: i === 0 ? 'mf' : 'mp',
        phrasing: 'legato' as Phrasing,
        harmonicContext: getChordNameForBar(epoch % 12)
      });
    });

    return events;
  }

  // ───── АККОМПАНЕМЕНТ ─────
  private generateTravisPicking(chord: GhostChord, epoch: number, barDuration: number): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote;
    const chordNotes = [root, root + 3, root + 7, root + 10]; // i7

    const pattern = epoch % 2 === 0 ? [0, 2, 1, 3] : [0, 3, 1, 2];

    pattern.forEach((noteIdx, i) => {
      const beat = Math.floor(i / 2);
      const subBeat = i % 2;
      const isBass = i % 2 === 0;
      
      const pitch = isBass ? chordNotes[0] : chordNotes[noteIdx];
      const duration = isBass ? barDuration * 0.6 : barDuration * 0.3;

      events.push({
        type: 'accompaniment',
        note: pitch + 12,
        time: beat * barDuration + (subBeat * barDuration * 0.5),
        duration,
        weight: isBass ? 0.4 : 0.2,
        technique: 'pluck' as Technique,
        dynamics: 'p' as Dynamics,
        phrasing: 'detached' as Phrasing,
        harmonicContext: getChordNameForBar(epoch % 12)
      });
    });

    return events;
  }

  // ───── МЕЛОДИЯ ─────
  private generateBluesMelody(
    chord: GhostChord,
    epoch: number,
    barDuration: number,
    phraseType: 'call' | 'call_var' | 'response'
  ): FractalEvent[] {
    const events: FractalEvent[] = [];
    const root = chord.rootNote + 24; // +2 октавы

    if (phraseType === 'call') {
      // Вопрос: нисходящая фраза с ♭5
      const notes = [root + 10, root + 7, root + 6, root + 3]; // ♭7 → 5 → ♭5 → ♭3
      notes.forEach((note, i) => {
        const technique = i === 2 ? 'bend' : 'pick'; // на ♭5 бенд
        events.push({
          type: 'melody',
          note,
          time: i * (barDuration / 4),
          duration: (barDuration / 4) * 0.8,
          weight: 0.8 - i * 0.1,
          technique: technique as Technique,
          dynamics: 'mp' as Dynamics,
          phrasing: 'legato' as Phrasing,
          harmonicContext: 'i7'
        });
      });
      
      this.blueNotePending = true;
      
      // Пауза после вопроса
      events.push({
        type: 'rest',
        time: notes.length * (barDuration / 4),
        duration: barDuration * 0.5,
        weight: 0.9,
        phrasing: 'breath' as Phrasing
      });
    }
    else if (phraseType === 'response') {
      // Ответ: восходящее разрешение
      const notes = this.blueNotePending 
        ? [root + 3, root + 5, root + 7]  // ♭3 → 4 → 5
        : [root, root + 3, root + 7];     // 1 → ♭3 → ♭7
      
      notes.forEach((note, i) => {
        const technique = i === notes.length - 1 ? 'vibrato' : 'pick';
        events.push({
          type: 'melody',
          note,
          time: i * (barDuration / 3),
          duration: (barDuration / 3) * 0.9,
          weight: 0.8 + i * 0.05,
          technique: technique as Technique,
          dynamics: 'mf' as Dynamics,
          phrasing: 'portamento' as Phrasing,
          harmonicContext: 'i7'
        });
      });
      
      this.blueNotePending = false;
    }

    return events;
  }
}