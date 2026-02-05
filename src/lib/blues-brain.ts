import type { 
    FractalEvent, 
    Mood, 
    Genre, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo, 
    BluesCognitiveState,
    InstrumentHints
} from '@/types/music';

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v12.0 — "The Grand Soul Synthesis".
 * #ЧТО: Реализация высших парадигм по Нирхаузу:
 *   1. L-System Theme Evolution (A -> A' -> B).
 *   2. 2nd Order Markov Melodic Syntax (связная речь).
 *   3. Fractal 1/f Noise Timing (человеческое дыхание).
 *   4. Tension Gating (умное управление 5-й октавой).
 * #ИНТЕГРАЦИЯ: Оптимизировано для Black Acoustic (MIDI 48-71).
 */

export class BluesBrain {
    private state: BluesCognitiveState;
    private random: any;
    private themeA: number[] = []; // Аксиома темы
    private lastNotes: number[] = [0, 0]; // Память для Маркова 2-го порядка
    private pinkNoiseState: number = 0; // Для фрактального времени
    
    private readonly COMFORT_CEILING = 71; // Конец 4-й октавы
    private readonly BASS_FLOOR = 36; 

    // Марковская матрица интервалов (веса тяготения)
    // -2: секста вниз, -1: терция вниз, 0: повтор, 1: терция вверх, 2: кварта вверх, 3: блюз-нота
    private readonly MELODIC_SYNTAX = [
        [0.1, 0.3, 0.2, 0.2, 0.1, 0.1], // после спуска - ждем стабилизации
        [0.05, 0.15, 0.3, 0.3, 0.15, 0.05], // после повтора - ждем движения
        [0.2, 0.2, 0.1, 0.3, 0.1, 0.1], // после подьема - ждем разрешения
    ];

    constructor(seed: number, mood: Mood) {
        this.random = this.seededRandom(seed);
        this.state = {
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

    private seededRandom(seed: number) {
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

    /**
     * #ЗАЧЕМ: Фрактальный шум 1/f (розовый шум) для "живого" тайминга.
     */
    private generatePinkNoise(): number {
        const white = this.random.next() * 2 - 1;
        this.pinkNoiseState = (this.pinkNoiseState + (0.02 * white)) / 1.02;
        return this.pinkNoiseState;
    }

    private clampToCeiling(pitch: number, limit: number = 71): number {
        let result = pitch;
        // #ЗАЧЕМ: Tension Gating. Выход в 5-ю октаву только при высоком напряжении.
        const currentLimit = this.state.tensionLevel > 0.88 ? 83 : limit;
        while (result > currentLimit) result -= 12;
        while (result < 36 && result > 0) result += 12;
        return result;
    }

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA, 
        hints: InstrumentHints
    ): FractalEvent[] {
        const barIn12 = epoch % 12;
        const events: FractalEvent[] = [];

        // Эволюция когнитивного состояния
        this.evolveCognitiveState(epoch);

        // 1. УДАРНЫЕ — True Shuffle с фрактальным таймингом
        if (hints.drums) events.push(...this.generateFractalDrums(epoch));

        // 2. БАС — Процедурный волкинг
        if (hints.bass) events.push(...this.generateProceduralBass(currentChord, epoch));
        
        // 3. АККОМПАНЕМЕНТ — Travis Picking
        if (hints.accompaniment) events.push(...this.generateLSystemComping(currentChord, epoch));
        
        // 4. МЕЛОДИЯ — L-System & Markov Phrasing
        if (hints.melody) events.push(...this.generateGrandSoulMelody(currentChord, epoch));

        return events;
    }

    // ============================================================================
    // 1. ФРАКТАЛЬНЫЕ УДАРНЫЕ: 1/f NOISE TIMING
    // ============================================================================

    private generateFractalDrums(epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const swingRatio = 0.68 + (this.generatePinkNoise() * 0.05);

        [0, 2].forEach(beat => {
            events.push({
                type: 'drum_kick_reso',
                time: beat + (this.generatePinkNoise() * 0.02),
                duration: 0.2, weight: 0.8 + (this.generatePinkNoise() * 0.1),
                technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
            });
        });

        [1, 3].forEach(beat => {
            const time = beat + (1 - swingRatio);
            events.push({
                type: 'drum_snare_ghost_note',
                time: time + (this.generatePinkNoise() * 0.03),
                duration: 0.2, weight: 0.7,
                technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
            });
        });

        for (let i = 0; i < 4; i++) {
            events.push({
                type: 'drum_25693__walter_odington__hackney-hat-1',
                time: i, duration: 0.1, weight: 0.4 + (this.generatePinkNoise() * 0.1), 
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });
        }

        return events;
    }

    // ============================================================================
    // 2. БАС: ПРОЦЕДУРНЫЙ ВОЛКИНГ (ПО НИРХАУЗУ)
    // ============================================================================

    private generateProceduralBass(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        const nextChordOffsets = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
        const nextRoot = chord.rootNote + nextChordOffsets[(epoch + 1) % 12] - 12;

        const steps = [
            root, 
            this.random.next() > 0.5 ? root + 3 : root + 4, // Терцовое тяготение
            root + 7, 
            nextRoot - 1 // Хроматический мост
        ];

        steps.forEach((note, i) => {
            events.push({
                type: 'bass',
                note: note,
                time: i + (this.generatePinkNoise() * 0.04),
                duration: 0.95, weight: 0.8,
                technique: 'pluck', dynamics: 'mf', phrasing: 'legato'
            });
        });

        return events;
    }

    // ============================================================================
    // 3. АККОМПАНЕМЕНТ: L-SYSTEM FINGERSTYLE
    // ============================================================================

    private generateLSystemComping(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.clampToCeiling(chord.rootNote + 12);
        const isMinor = chord.chordType === 'minor';
        const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

        // L-System Rule: Pattern 8th note -> recursive subdivision
        const baseTicks = [0, 1, 2, 3];
        baseTicks.forEach(beat => {
            // Если напряжение высокое - дробим долю
            const subdivide = this.state.tensionLevel > 0.7 && this.random.next() > 0.5;
            const times = subdivide ? [beat, beat + 0.5] : [beat];
            
            times.forEach(t => {
                const isBass = t % 1 === 0;
                events.push({
                    type: 'accompaniment',
                    note: this.clampToCeiling(chordNotes[isBass ? 0 : this.random.nextInt(chordNotes.length)]),
                    time: t + (this.generatePinkNoise() * 0.03),
                    duration: subdivide ? 0.4 : 0.8,
                    weight: isBass ? 0.45 : 0.25,
                    technique: 'pluck', dynamics: 'p', phrasing: 'detached'
                });
            });
        });

        return events;
    }

    // ============================================================================
    // 4. МЕЛОДИЯ: THE GRAND SOUL SYNTHESIS (L-System + Markov)
    // ============================================================================

    private generateGrandSoulMelody(chord: GhostChord, epoch: number): FractalEvent[] {
        const barIn12 = epoch % 12;
        const root = chord.rootNote;
        const events: FractalEvent[] = [];

        // Парадигма Порождающих Грамматик:
        // 0-3: Axiom (Theme A)
        // 4-7: Iteration (Variation A' - структурное развитие)
        // 8-11: Terminal (Response B - разрешение)

        if (barIn12 < 4) {
            this.themeA = this.generateMarkovPhrase(6); // Генерируем корень темы
            events.push(...this.renderGrandPhrase(root, this.themeA, 0));
        } else if (barIn12 < 8) {
            // Структурная мутация по L-системе: добавляем проходящие ноты в тему А
            const themeAPrime = this.themeA.flatMap(deg => 
                this.random.next() > 0.6 ? [deg, deg + 1] : [deg]
            ).slice(0, 6);
            events.push(...this.renderGrandPhrase(root, themeAPrime, 0.1, true));
        } else {
            // Финальное разрешение: восходящая линия к 5 или 8 ступени
            const response = [3, 5, 6, 7, 10, 12]; 
            events.push(...this.renderGrandPhrase(root, response, 0.2, false, true));
        }

        return events;
    }

    private generateMarkovPhrase(length: number): number[] {
        const phrase: number[] = [10]; // Начинаем с септимы (блюзовый старт)
        let currentState = 1; // 'Repeat'

        for (let i = 1; i < length; i++) {
            const rand = this.random.next();
            let cumulative = 0;
            let move = 0;
            
            for (let j = 0; j < 6; j++) {
                cumulative += this.MELODIC_SYNTAX[currentState][j];
                if (rand < cumulative) { move = j; break; }
            }

            const intervals = [-9, -3, 0, 3, 5, 6]; // Смещение в полутонах
            const nextNote = phrase[i-1] + intervals[move];
            phrase.push(nextNote);
            
            // Обновляем состояние Маркова
            if (move < 2) currentState = 0; // Down
            else if (move === 2) currentState = 1; // Repeat
            else currentState = 2; // Up
        }
        return phrase;
    }

    private renderGrandPhrase(root: number, degrees: number[], startTime: number, isMutation = false, isTerminal = false): FractalEvent[] {
        const events: FractalEvent[] = [];
        let time = startTime;

        degrees.forEach((deg, i) => {
            let pitch = root + deg;
            
            // Закон Искупления Блюзовой Ноты (разрешение ♭5)
            if (deg === 6) {
                this.state.blueNotePending = true;
                this.state.tensionLevel += 0.15;
            } else if (this.state.blueNotePending) {
                pitch = root + (this.random.next() > 0.7 ? 7 : 3);
                this.state.blueNotePending = false;
                this.state.tensionLevel -= 0.2;
            }

            const isLast = i === degrees.length - 1;
            events.push({
                type: 'melody',
                note: this.clampToCeiling(pitch),
                time: time + (this.generatePinkNoise() * 0.05),
                duration: isLast ? 1.8 : 0.5,
                weight: 0.9 + (this.generatePinkNoise() * 0.1),
                technique: (deg === 6) ? 'bend' : (isLast ? 'vibrato' : 'pick'),
                dynamics: isTerminal ? 'mf' : 'p',
                phrasing: 'legato'
            });

            time += isTerminal ? 0.4 : 0.6;
        });

        return events;
    }

    private evolveCognitiveState(epoch: number) {
        this.state.tensionLevel += (this.generatePinkNoise() * 0.05);
        this.state.tensionLevel = clamp(this.state.tensionLevel, 0.1, 1.0);
        
        this.state.emotion.melancholy += (this.generatePinkNoise() * 0.02);
        this.state.emotion.melancholy = clamp(this.state.emotion.melancholy, 0.7, 0.95);
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
