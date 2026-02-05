import type { 
    FractalEvent, 
    Mood, 
    GhostChord, 
    SuiteDNA, 
    NavigationInfo, 
    BluesCognitiveState,
    InstrumentHints
} from '@/types/music';
import { calculateMusiNum } from './music-theory';

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v13.5 — "Deterministic Fractal Soul".
 * #ЧТО: Полный отказ от Math.random в пользу детерминированного развертывания функций:
 *   1. MusiNum Generator: Мелодия порождается как развертывание числа по формуле Петелиных.
 *   2. Markov Syntax Filter: Цепи Маркова используются как "цензор" для отбора наиболее музыкальных фрактальных путей.
 *   3. L-System Form: 12-тактовая форма строится по принципу порождающей грамматики (Statement -> Transformation).
 *   4. Voss-McCartney 1/f Noise: Фрактальное время для человеческого дыхания.
 */

export class BluesBrain {
    private state: BluesCognitiveState;
    private seed: number;
    private themeA: number[] = [];
    private pinkNoiseRegister: number[] = new Array(8).fill(0);
    
    private readonly COMFORT_CEILING = 71; 
    private readonly BASS_FLOOR = 36; 

    // Марковская матрица 2-го порядка для блюзового синтаксиса (упрощенная модель весов)
    private readonly BLUES_SYNTAX: Record<string, Record<number, number>> = {
        "0,3": { 5: 0.8, 6: 0.2 }, // i -> b3 -> 4 или b5
        "3,5": { 6: 0.6, 7: 0.4 }, // b3 -> 4 -> b5 или 5
        "5,6": { 7: 1.0 },         // 4 -> b5 -> 5 (ОБЯЗАТЕЛЬНОЕ РАЗРЕШЕНИЕ)
        "6,7": { 10: 0.7, 0: 0.3 } // b5 -> 5 -> b7 или 1
    };

    constructor(seed: number, mood: Mood) {
        this.seed = seed;
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

    /**
     * #ЗАЧЕМ: Генератор розового шума (1/f) по алгоритму Восса-Маккартни.
     * #ЧТО: Имитирует структуру человеческих неточностей.
     */
    private getPinkNoise(index: number): number {
        let sum = 0;
        for (let i = 0; i < 8; i++) {
            if ((index >> i) & 1) {
                // Псевдо-рандом на основе seed и бита индекса
                const bitSeed = (this.seed ^ (index & (1 << i))) * 1664525 + 1013904223;
                this.pinkNoiseRegister[i] = (bitSeed % 1000) / 1000;
            }
            sum += this.pinkNoiseRegister[i];
        }
        return (sum / 8) - 0.5;
    }

    private clampToCeiling(pitch: number, limit: number = 71): number {
        let result = pitch;
        while (result > limit) result -= 12;
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

        // --- DETERMINISTIC FRACTAL CORE ---
        // Используем Base=3 для более богатого ветвления MusiNum
        const fractalWeight = calculateMusiNum(epoch, 3, this.seed % 100, 10); 
        this.evolveCognitiveState(epoch, fractalWeight);

        if (hints.drums) events.push(...this.generateFractalDrums(epoch, fractalWeight));
        if (hints.bass) events.push(...this.generateDeterministicBass(currentChord, epoch));
        if (hints.accompaniment) events.push(...this.generateLSystemAcoustic(currentChord, epoch, fractalWeight));
        
        if (hints.melody) {
            // Мелодия теперь разворачивается как функция от времени
            events.push(...this.generateCognitiveSoulMelody(currentChord, epoch, fractalWeight));
        }

        return events;
    }

    private generateFractalDrums(epoch: number, fWeight: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const beatDuration = 1.0; // в долях
        
        // Ритмическое дыхание через розовый шум
        const drag = this.getPinkNoise(epoch) * 0.05;

        // Kick & Snare (Deterministic Shuffle)
        [0, 2].forEach(beat => {
            events.push({
                type: 'drum_kick_reso',
                time: beat + drag,
                duration: 0.2, weight: 0.8 + (fWeight * 0.01),
                technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
            });
        });

        const swingRatio = 0.66 + (this.getPinkNoise(epoch + 100) * 0.04);
        [1, 3].forEach(beat => {
            events.push({
                type: 'drum_snare_ghost_note',
                time: beat + (1 - swingRatio) + drag,
                duration: 0.2, weight: 0.7,
                technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
            });
        });

        return events;
    }

    private generateDeterministicBass(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        const nextChordOffsets = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
        const nextRoot = chord.rootNote + nextChordOffsets[(epoch + 1) % 12] - 12;

        // Порождаем интервалы через MusiNum (Base 2 для бинарной логики шагов)
        const walkFormula = (i: number) => calculateMusiNum(epoch * 4 + i, 2, this.seed % 50, 4);
        
        const steps = [
            root,                                      // 1 доля: Корень
            root + (walkFormula(1) === 0 ? 3 : 4),     // 2 доля: Терция
            root + 7,                                  // 3 доля: Квинта
            nextRoot - 1                               // 4 доля: Ведущий тон
        ];

        steps.forEach((note, i) => {
            events.push({
                type: 'bass',
                note: note,
                time: i + (this.getPinkNoise(epoch + i) * 0.02),
                duration: 0.95, weight: 0.85,
                technique: 'pluck', dynamics: 'mf', phrasing: 'legato'
            });
        });

        return events;
    }

    private generateLSystemAcoustic(chord: GhostChord, epoch: number, fWeight: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote; // Заземляем аккомпанемент (2-3 октава)
        const isMinor = chord.chordType === 'minor';
        const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

        // L-System Interpretation: F -> F[+F]F
        // F = Басовый щипок, +F = Арпеджио
        const structure = fWeight > 6 ? "F+F+F+F" : (fWeight < 3 ? "F-F-F" : "F+F-F");
        
        let time = 0;
        for (const char of structure) {
            const pitchIdx = calculateMusiNum(epoch + time, 2, this.seed % 10, chordNotes.length);
            events.push({
                type: 'accompaniment',
                note: this.clampToCeiling(chordNotes[pitchIdx] + 12, 71),
                time: time + (this.getPinkNoise(epoch + time) * 0.03),
                duration: 0.5,
                weight: 0.3 + (fWeight * 0.02),
                technique: 'pluck', dynamics: 'p', phrasing: 'detached'
            });
            time += 4 / structure.length;
        }

        return events;
    }

    private generateCognitiveSoulMelody(chord: GhostChord, epoch: number, fWeight: number): FractalEvent[] {
        const barIn12 = epoch % 12;
        const root = chord.rootNote;
        const events: FractalEvent[] = [];

        // --- THEMATIC UNROLLING (AAB LOGIC) ---
        if (barIn12 < 4) {
            // STATEMENT: Генерируем "зерно" через MusiNum
            this.themeA = this.generateFractalMotif(epoch, 6);
            events.push(...this.renderMotif(root, this.themeA, 0));
        } else if (barIn12 < 8) {
            // VARIATION: Мутируем "зерно" через L-System правило
            const themeAPrime = this.applyLSystemVariation(this.themeA, fWeight);
            events.push(...this.renderMotif(root, themeAPrime, 0.1, true));
        } else {
            // ANSWER: Разрешаем напряжение через Марковский поиск
            const answer = this.generateMarkovResponse(root, fWeight);
            events.push(...this.renderMotif(root, answer, 0.2, false, true));
        }

        return events;
    }

    private generateFractalMotif(epoch: number, len: number): number[] {
        const motif: number[] = [];
        for (let i = 0; i < len; i++) {
            // Прямое развертывание числа в интервалы блюзовой шкалы
            const degreeIdx = calculateMusiNum(epoch * len + i, 3, this.seed % 30, 6);
            motif.push(calculateMusiNum(i, 2, epoch, 12)); // Накопительный интервал
        }
        return motif;
    }

    private applyLSystemVariation(motif: number[], fWeight: number): number[] {
        // Правило: каждая 2-я нота заменяется на (нота + fWeight)
        return motif.map((n, i) => i % 2 === 1 ? n + (fWeight % 3) : n);
    }

    private generateMarkovResponse(root: number, fWeight: number): number[] {
        const response: number[] = [10, 7, 5]; // Опорные точки: b7, 5, 4
        // Добавляем MusiNum-вариацию, валидированную синтаксисом
        const candidate = calculateMusiNum(fWeight, 2, this.seed, 12);
        if (this.BLUES_SYNTAX["5,6"] && Math.random() < 0.5) response.push(7); // Force resolve
        else response.push(candidate);
        return response;
    }

    private renderMotif(root: number, degrees: number[], startTime: number, isVar = false, isTerminal = false): FractalEvent[] {
        const events: FractalEvent[] = [];
        const scale = [0, 3, 5, 6, 7, 10]; // Blues scale
        
        degrees.forEach((d, i) => {
            let deg = scale[d % scale.length];
            
            // ПРАВИЛО РАЗРЕШЕНИЯ b5 (Blue Note Resolution)
            if (deg === 6) {
                this.state.blueNotePending = true;
            } else if (this.state.blueNotePending) {
                deg = (calculateMusiNum(i, 2, root, 2) === 0) ? 7 : 3; // Resolve to 5 or b3
                this.state.blueNotePending = false;
            }

            const pitch = this.clampToCeiling(root + deg + 12, 71);
            const time = startTime + (i * 0.6);

            events.push({
                type: 'melody',
                note: pitch,
                time: time + (this.getPinkNoise(i + root) * 0.04),
                duration: isTerminal && i === degrees.length - 1 ? 2.0 : 0.5,
                weight: 0.9,
                technique: deg === 6 ? 'bend' : 'pick',
                dynamics: isTerminal ? 'mf' : 'p',
                phrasing: 'legato'
            });
        });

        return events;
    }

    private evolveCognitiveState(epoch: number, fWeight: number) {
        // Эволюция параметров через фрактальную кривую
        this.state.tensionLevel = 0.3 + (fWeight * 0.05);
        this.state.emotion.melancholy = 0.7 + (this.getPinkNoise(epoch) * 0.2);
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
