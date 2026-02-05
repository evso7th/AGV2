import type {
    FractalEvent,
    Mood,
    GhostChord,
    SuiteDNA,
    NavigationInfo,
    BluesCognitiveState,
    InstrumentHints
  } from '@/types/music';
  
  /**
   * #ЗАЧЕМ: Блюзовый Мозг на языке напряжений — не сборка клише, а живая генерация.
   * #ЧТО: 
   *   1. Волкинг-бас генерируется на лету по правилам проходящих/ведущих нот
   *   2. Мелодия строится на языке ♭5 → разрешение (5/3)
   *   3. Вопрос-ответная структура фраз (нисходящий вопрос → восходящий ответ)
   *   4. Микроартикуляция: свинг, бенды, вибрато, гуманизация
   *   5. Защита от артефактов через музыкальные правила
   * #ИНТЕГРАЦИЯ: Полностью совместим с presets-v2.ts (guitar_shineOn, bass_jazz_warm)
   */
  
  // ============================================================================
  // КОНСТАНТЫ И ТИПЫ
  // ============================================================================
  
  export interface BluesBrainConfig {
    tempo: number;           // BPM (68-80 для медленного блюза)
    rootNote: number;        // MIDI root (55 = G3)
    emotion: {
      melancholy: number;    // 0.6-0.95
      darkness: number;      // 0.1-0.4
    };
  }
  
  export const DEFAULT_CONFIG: BluesBrainConfig = {
    tempo: 72,
    rootNote: 55, // G3
    emotion: { melancholy: 0.82, darkness: 0.25 }
  };
  
  // ============================================================================
  // БЛЮЗОВАЯ ТЕОРИЯ (встроенные правила)
  // ============================================================================
  
  /**
   * Минорная пентатоника + блюзовая нота (♭5)
   * Ступени относительно тональности:
   * 0 = 1 (тоника)
   * 3 = ♭3 (минорная терция)
   * 5 = 4 (кварта)
   * 6 = ♭5 (блюзовая нота — напряжение!)
   * 7 = 5 (квинта)
   * 10 = ♭7 (минорная септима)
   */
  const BLUES_SCALE = [0, 3, 5, 6, 7, 10];
  
  /**
   * Гармоническая прогрессия 12-bar blues
   * Смещения в полутонах относительно тональности:
   * 0 = i (тоника)
   * 5 = iv (субдоминанта)
   * 7 = v (доминанта)
   */
  const BLUES_PROGRESSION_OFFSETS = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
  
  /**
   * Получить следующий корень аккорда для ведущей ноты баса
   */
  function getNextChordRoot(barIndex: number, rootNote: number): number {
    const nextBar = (barIndex + 1) % 12;
    return rootNote + BLUES_PROGRESSION_OFFSETS[nextBar];
  }
  
  /**
   * Получить имя аккорда для такта
   */
  function getChordNameForBar(barIndex: number): string {
    const progression = ['i7', 'i7', 'i7', 'i7', 'iv7', 'iv7', 'i7', 'i7', 'v7', 'iv7', 'i7', 'v7'];
    return progression[barIndex % 12];
  }
  
  // ============================================================================
  // КЛАСС БЛЮЗОВОГО МОЗГА
  // ============================================================================
  
  export class BluesBrain {
    private config: BluesBrainConfig;
    private state: BluesCognitiveState;
    private random: any;
    
    // Защита от артефактов
    private lastAscendingBar: number = -10;
    private blueNotePending: boolean = false;
    private tensionLevel: number = 0.3;
    private phraseHistory: string[] = [];
    
    constructor(seed: number, mood: Mood) {
      this.random = this.createSeededRandom(seed);
      
      this.config = {
        ...DEFAULT_CONFIG,
        emotion: {
          melancholy: ['melancholic', 'dark', 'anxious'].includes(mood) ? 0.85 : 0.4,
          darkness: ['dark', 'gloomy'].includes(mood) ? 0.35 : 0.2
        }
      };
      
      this.state = {
        phraseState: 'call',
        tensionLevel: 0.3,
        phraseHistory: [],
        lastPhraseHash: '',
        blueNotePending: false,
        emotion: { ...this.config.emotion }
      };
    }
    
    // ───── ГЕНЕРАТОР С ПОСЕВОМ ─────
    
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
      const beatDuration = 60 / this.config.tempo;
      
      // Эволюция эмоции
      this.evolveEmotion(epoch);
      
      // Определение фазы фразы (каждые 4 такта: вопрос-вопрос-ответ)
      this.updatePhrasePhase(barIn12);
      
      // 1. УДАРНЫЕ — настоящий свинг с гуманизацией
      if (hints.drums) {
        events.push(...this.generateDrums(epoch, beatDuration));
      }
      
      // 2. БАС — волкинг-бас генерируется на лету по правилам
      if (hints.bass) {
        events.push(...this.generateWalkingBass(currentChord, epoch, beatDuration));
      }
      
      // 3. АККОМПАНЕМЕНТ — трэвис-пикинг с арпеджио
      if (hints.accompaniment) {
        events.push(...this.generateTravisPicking(currentChord, epoch, beatDuration));
      }
      
      // 4. МЕЛОДИЯ — язык напряжений ♭5 → разрешение
      if (hints.melody) {
        const melodyEvents = this.generateBluesMelody(currentChord, epoch, beatDuration);
        // Защита от похоронного марша
        const guardedEvents = this.applyAntiFuneralMarch(melodyEvents, epoch, beatDuration);
        events.push(...guardedEvents);
      }
      
      return events;
    }
    
    // ============================================================================
    // 1. УДАРНЫЕ — НАСТОЯЩИЙ СВИНГ
    // ============================================================================
    
    private generateDrums(epoch: number, beatDuration: number): FractalEvent[] {
      const events: FractalEvent[] = [];
      
      // === КИК: 1 и 3 доли с вариацией ===
      [0, 2].forEach(beat => {
        const humanOffset = (this.random.next() * 20 - 10) / 1000; // ±10мс
        events.push({
          type: 'drum_kick',
          note: 36, // C1
          time: beat * beatDuration + humanOffset,
          duration: beatDuration * 0.3,
          weight: 0.85 - beat * 0.05,
          technique: 'hit',
          dynamics: 'mf',
          phrasing: 'staccato'
        });
      });
      
      // === СНЕЙР: 2 и 4 доли с триольным свингом ===
      const swingRatio = 0.66 + (this.random.next() - 0.5) * 0.08; // 0.62-0.70
      
      [1, 3].forEach(beat => {
        const baseTime = beat * beatDuration;
        const swungTime = baseTime * swingRatio + (1 - swingRatio) * beatDuration;
        
        const humanOffset = (this.random.next() * 25 - 12) / 1000; // ±12мс
        events.push({
          type: 'drum_snare',
          note: 38, // D1
          time: swungTime + humanOffset,
          duration: beatDuration * 0.25,
          weight: 0.8,
          technique: 'hit',
          dynamics: 'mf',
          phrasing: 'staccato'
        });
      });
      
      // === ХАЙ-ХЭТ: восьмые с триольным свингом ===
      // При высокой меланхолии пропускаем некоторые хай-хэты («усталость»)
      for (let i = 0; i < 8; i++) {
        // Триольная сетка: 2:1 соотношение
        const isTripletFirst = i % 3 === 0;
        const baseTime = (i / 2) * beatDuration;
        const swungTime = isTripletFirst 
          ? baseTime * 0.66 
          : baseTime * 0.34 + beatDuration * 0.66;
        
        // Пропуск при меланхолии > 0.8
        if (this.state.emotion.melancholy > 0.8 && i % 2 === 1 && this.random.next() < 0.4) {
          continue;
        }
        
        const humanOffset = (this.random.next() * 15 - 7) / 1000; // ±7мс
        events.push({
          type: 'drum_hihat',
          note: 42, // F#1
          time: swungTime + humanOffset,
          duration: beatDuration * 0.15,
          weight: 0.35 + this.random.next() * 0.2,
          technique: 'hit',
          dynamics: 'p',
          phrasing: 'staccato'
        });
      }
      
      return events;
    }
    
    // ============================================================================
    // 2. БАС — ВОЛКИНГ-БАС НА ЛЕТУ (НЕ КЛИШЕ!)
    // ============================================================================
    
    private generateWalkingBass(
      chord: GhostChord, 
      epoch: number,
      beatDuration: number
    ): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote - 12; // октава ниже для баса
      const barIn12 = epoch % 12;
      
      // Следующий корень для ведущей ноты
      const nextRoot = getNextChordRoot(barIn12, chord.rootNote) - 12;
      
      // === ПРАВИЛА ВОЛКИНГ-БАСА ===
      // 1-я доля: корень аккорда
      // 2-я доля: проходящая нота (диатоническая или хроматическая)
      // 3-я доля: квинта или септима
      // 4-я доля: ведущая нота к следующему аккорду (хроматическая)
      
      const fifth = root + 7;
      const seventh = root + 10;
      
      // Проходящая нота: 60% хроматическая (♭2), 40% диатоническая (2)
      const passingNote = this.random.next() < 0.6 
        ? root + 1  // хроматическая (полутон выше)
        : root + 2; // диатоническая (2-я ступень)
      
      // Ведущая нота: хроматическая к следующему корню
      const leadingNote = nextRoot - 1; // на полтона ниже следующего корня
      
      // === ГЕНЕРАЦИЯ 4 ДОЛЕЙ ===
      const notes = [root, passingNote, fifth, leadingNote];
      const dynamics = ['mf', 'mp', 'mp', 'mp']; // акцент только на 1-й доле
      
      notes.forEach((note, i) => {
        // Микрогуманизация: ±15мс на каждую долю
        const humanOffset = (this.random.next() * 30 - 15) / 1000;
        
        events.push({
          type: 'bass',
          note,
          time: i * beatDuration + humanOffset,
          duration: beatDuration * 0.92,
          weight: 0.9 - i * 0.1, // убывающий вес
          technique: 'pluck',
          dynamics: dynamics[i],
          phrasing: 'legato',
          harmonicContext: getChordNameForBar(barIn12)
        });
      });
      
      return events;
    }
    
    // ============================================================================
    // 3. АККОМПАНЕМЕНТ — ТРЭВИС-ПИКИНГ
    // ============================================================================
    
    private generateTravisPicking(
      chord: GhostChord,
      epoch: number,
      beatDuration: number
    ): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote;
      const isMinor = chord.chordType === 'minor';
      
      // Ноты аккорда: тоника, терция, квинта, септима
      const chordNotes = [
        root,                              // 1
        root + (isMinor ? 3 : 4),          // ♭3 или 3
        root + 7,                          // 5
        root + 10                          // ♭7
      ];
      
      // Трэвис-пикинг паттерн: бас на сильных долях, арпеджио на слабых
      const pattern = epoch % 2 === 0 
        ? [0, 2, 1, 3, 0, 2, 1, 3]  // вариант А
        : [0, 3, 1, 2, 0, 3, 1, 2]; // вариант Б
      
      pattern.forEach((noteIdx, i) => {
        const beat = Math.floor(i / 2);
        const subBeat = i % 2;
        
        // Басовая нота на сильных долях (1 и 3)
        const isBassBeat = beat % 2 === 0 && subBeat === 0;
        const pitch = isBassBeat ? chordNotes[0] : chordNotes[noteIdx % chordNotes.length];
        
        // Время с лёгким свингом
        const time = beat * beatDuration + (subBeat * beatDuration * 0.5);
        
        // Длительность: басовые ноты дольше
        const duration = isBassBeat ? beatDuration * 0.7 : beatDuration * 0.4;
        
        events.push({
          type: 'accompaniment',
          note: pitch + 12, // +1 октава
          time: time + (this.random.next() * 0.015), // гуманизация
          duration,
          weight: isBassBeat ? 0.4 : 0.25,
          technique: 'pluck',
          dynamics: 'p',
          phrasing: 'detached',
          harmonicContext: getChordNameForBar(epoch % 12)
        });
      });
      
      return events;
    }
    
    // ============================================================================
    // 4. МЕЛОДИЯ — ЯЗЫК НАПРЯЖЕНИЙ ♭5 → РАЗРЕШЕНИЕ
    // ============================================================================
    
    private generateBluesMelody(
      chord: GhostChord,
      epoch: number,
      beatDuration: number
    ): FractalEvent[] {
      const events: FractalEvent[] = [];
      const root = chord.rootNote;
      const barIn12 = epoch % 12;
      
      // === ФАЗА ФРАЗЫ ===
      // Такты 0-3: вопрос (нисходящий, с ♭5)
      // Такты 4-7: вопрос (вариация)
      // Такты 8-11: ответ (восходящий, разрешение)
      
      const phrasePhase = barIn12 < 4 ? 'call' : (barIn12 < 8 ? 'call_var' : 'response');
      
      if (phrasePhase === 'call') {
        // === ВОПРОС: нисходящая фраза с напряжением (♭5) ===
        events.push(...this.generateCallPhrase(root, beatDuration, epoch));
      } 
      else if (phrasePhase === 'call_var') {
        // === ВОПРОС (вариация): повтор с изменением ===
        events.push(...this.generateCallVariation(root, beatDuration, epoch));
      } 
      else {
        // === ОТВЕТ: восходящее разрешение ===
        events.push(...this.generateResponsePhrase(root, beatDuration, epoch));
      }
      
      // === МИКРОАРТИКУЛЯЦИЯ ===
      this.applyMicroArticulation(events, beatDuration);
      
      return events;
    }
    
    private generateCallPhrase(
      root: number,
      beatDuration: number,
      epoch: number
    ): FractalEvent[] {
      const events: FractalEvent[] = [];
      
      // Нисходящая фраза: 7 → 5 → ♭5 → 3 (напряжение!)
      const phraseNotes = [
        { degree: 10, time: 0.0 },      // ♭7 (начало фразы)
        { degree: 7, time: 0.5 },       // 5
        { degree: 6, time: 1.0 },       // ♭5 (напряжение!)
        { degree: 3, time: 1.5 }        // ♭3
      ];
      
      phraseNotes.forEach((noteInfo, i) => {
        const pitch = root + noteInfo.degree + 24; // +2 октавы для соло
        
        // Бенд на ♭5 (напряжение!)
        const technique = noteInfo.degree === 6 && this.random.next() < 0.75 
          ? 'bend' 
          : 'pick';
        
        // Длительность: последняя нота длиннее (вопрос без ответа)
        const duration = i === phraseNotes.length - 1 
          ? beatDuration * 1.8 
          : beatDuration * 0.7;
        
        events.push({
          type: 'melody',
          note: pitch,
          time: noteInfo.time * beatDuration,
          duration,
          weight: 0.85 - i * 0.1,
          technique,
          dynamics: 'mp',
          phrasing: 'legato',
          harmonicContext: 'i7'
        });
      });
      
      // === ЗАПОМИНАЕМ НАПРЯЖЕНИЕ ===
      this.tensionLevel = Math.min(1.0, this.tensionLevel + 0.35);
      this.blueNotePending = true;
      
      // === СТРАТЕГИЧЕСКАЯ ПАУЗА ===
      // После вопроса — пауза («незаконченность»)
      events.push({
        type: 'rest',
        time: 2.0 * beatDuration,
        duration: beatDuration * 1.2,
        weight: 0.95,
        phrasing: 'breath'
      });
      
      return events;
    }
    
    private generateCallVariation(
      root: number,
      beatDuration: number,
      epoch: number
    ): FractalEvent[] {
      const events: FractalEvent[] = [];
      
      // Вариация вопроса: начинаем с ♭3, идём к ♭5
      const phraseNotes = [
        { degree: 3, time: 0.0 },       // ♭3
        { degree: 5, time: 0.6 },       // 4
        { degree: 6, time: 1.2 },       // ♭5 (напряжение!)
        { degree: 5, time: 1.8 }        // 4 (частичное разрешение)
      ];
      
      phraseNotes.forEach((noteInfo, i) => {
        const pitch = root + noteInfo.degree + 24;
        
        const technique = noteInfo.degree === 6 && this.random.next() < 0.7
          ? 'bend'
          : 'pick';
        
        events.push({
          type: 'melody',
          note: pitch,
          time: noteInfo.time * beatDuration,
          duration: beatDuration * 0.65,
          weight: 0.8 + i * 0.03,
          technique,
          dynamics: 'mp',
          phrasing: 'legato',
          harmonicContext: 'i7'
        });
      });
      
      this.tensionLevel = Math.min(1.0, this.tensionLevel + 0.2);
      this.blueNotePending = true;
      
      return events;
    }
    
    private generateResponsePhrase(
      root: number,
      beatDuration: number,
      epoch: number
    ): FractalEvent[] {
      const events: FractalEvent[] = [];
      
      // === ОТВЕТ: восходящее разрешение ===
      // Если было напряжение (♭5) — разрешаем в 5 или 3
      // Если нет — спокойный ответ
      
      let phraseNotes: { degree: number; time: number }[];
      
      if (this.blueNotePending) {
        // Разрешение напряжения: 3 → 5 → 7
        phraseNotes = [
          { degree: 3, time: 0.0 },      // ♭3
          { degree: 5, time: 0.7 },      // 4
          { degree: 7, time: 1.4 }       // 5 (разрешение!)
        ];
      } else {
        // Спокойный ответ: 1 → 3 → 5
        phraseNotes = [
          { degree: 0, time: 0.0 },      // 1 (тоника)
          { degree: 3, time: 0.8 },      // ♭3
          { degree: 7, time: 1.6 }       // 5
        ];
      }
      
      phraseNotes.forEach((noteInfo, i) => {
        const pitch = root + noteInfo.degree + 24;
        
        // Вибрато на последней ноте разрешения
        const technique = i === phraseNotes.length - 1 && this.random.next() < 0.8
          ? 'vibrato'
          : 'pick';
        
        events.push({
          type: 'melody',
          note: pitch,
          time: noteInfo.time * beatDuration,
          duration: beatDuration * 0.85,
          weight: 0.8 + i * 0.05, // нарастание веса
          technique,
          dynamics: 'mf',
          phrasing: 'portamento',
          harmonicContext: 'i7'
        });
      });
      
      // === СБРОС НАПРЯЖЕНИЯ ===
      this.tensionLevel = Math.max(0.1, this.tensionLevel - 0.4);
      this.blueNotePending = false;
      
      return events;
    }
    
    // ============================================================================
    // МИКРОАРТИКУЛЯЦИЯ
    // ============================================================================
    
    private applyMicroArticulation(events: FractalEvent[], beatDuration: number): void {
      // Свинг: триольное соотношение 2:1 с вариацией
      const swingRatio = 0.66 + (this.random.next() - 0.5) * 0.08;
      
      events.forEach((event, i) => {
        if (event.type !== 'rest') {
          // Свинг на чётных долях
          if (i % 2 === 1) {
            const idealTime = event.time;
            event.time = idealTime * swingRatio + (1 - swingRatio) * beatDuration;
          }
          
          // Гуманизация тайминга: ±25мс с корреляцией к позиции в фразе
          const maxOffsetMs = 20 + this.state.emotion.melancholy * 15;
          const offsetMs = (this.random.next() * maxOffsetMs * 2 - maxOffsetMs) / 1000;
          event.time += offsetMs;
          
          // Модуляция громкости для «дыхания»
          if (event.technique === 'vibrato' || event.technique === 'bend') {
            event.weight *= 0.95 + this.random.next() * 0.1;
          }
        }
      });
    }
    
    // ============================================================================
    // ЗАЩИТА ОТ АРТЕФАКТОВ
    // ============================================================================
    
    private applyAntiFuneralMarch(
      events: FractalEvent[],
      epoch: number,
      beatDuration: number
    ): FractalEvent[] {
      // Защита от похоронного марша: обязательное восхождение каждые 6 тактов
      
      if (epoch - this.lastAscendingBar >= 6 && this.tensionLevel > 0.5) {
        const melodyEvents = events.filter(e => e.type === 'melody');
        if (melodyEvents.length > 0) {
          const lastMelodyEvent = melodyEvents[melodyEvents.length - 1];
          
          // Принудительное восходящее разрешение (квинта вверх)
          const resolutionNote: FractalEvent = {
            type: 'melody',
            note: lastMelodyEvent.note! + 5, // квинта вверх — музыкальное разрешение
            time: lastMelodyEvent.time + lastMelodyEvent.duration + 0.3,
            duration: 1.2,
            weight: 0.92,
            technique: 'vibrato',
            dynamics: 'mf',
            phrasing: 'sostenuto',
            harmonicContext: 'i7'
          };
          
          events.push(resolutionNote);
          this.lastAscendingBar = epoch;
          this.tensionLevel = 0.2;
        }
      }
      
      return events;
    }
    
    // ============================================================================
    // ЭМОЦИОНАЛЬНАЯ ЭВОЛЮЦИЯ
    // ============================================================================
    
    private evolveEmotion(epoch: number): void {
      // Броуновское движение с ограничениями
      this.state.emotion.melancholy += (this.random.next() - 0.5) * 0.06;
      this.state.emotion.darkness += (this.random.next() - 0.5) * 0.04;
      
      // Клиппинг
      this.state.emotion.melancholy = Math.max(0.65, Math.min(0.95, this.state.emotion.melancholy));
      this.state.emotion.darkness = Math.max(0.15, Math.min(0.45, this.state.emotion.darkness));
      
      // Обновление когнитивного состояния
      this.state.tensionLevel = this.tensionLevel;
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
    
    // ============================================================================
    // ГЕТТЕРЫ ДЛЯ ИНТЕГРАЦИИ
    // ============================================================================
    
    getEmotionState(): { melancholy: number; darkness: number } {
      return { ...this.state.emotion };
    }
    
    getTensionLevel(): number {
      return this.tensionLevel;
    }
    
    resetState(): void {
      this.state = {
        phraseState: 'call',
        tensionLevel: 0.3,
        phraseHistory: [],
        lastPhraseHash: '',
        blueNotePending: false,
        emotion: { ...this.config.emotion }
      };
      this.lastAscendingBar = -10;
      this.blueNotePending = false;
      this.tensionLevel = 0.3;
    }
  }