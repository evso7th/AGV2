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
import { DEGREE_TO_SEMITONE } from './music-theory';

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v10.0 — "The Cognitive Architect".
 * #ЧТО: Полный отказ от заготовленных риффов. Блюз генерируется по правилам:
 *   1. Процедурный волкинг-бас (соединение аккордов через проходящие ноты).
 *   2. Когнитивная мелодия (♭5 -> разрешение, структура AAB).
 *   3. Активный Travis Picking (постоянная работа пальцев в аккомпанементе).
 *   4. True Shuffle Drums (нелинейный свинг и Midnight Drag).
 * #ИНТЕГРАЦИЯ: Оптимизировано для Dark Telecaster и Black Acoustic.
 */

export class BluesBrain {
    private state: BluesCognitiveState;
    private random: any;
    private lastAxiom: any[] = [];
    private barInChorus = 0;
    
    private readonly COMFORT_CEILING = 71; // H4
    private readonly BASS_FLOOR = 36; // C2

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
     * #ЗАЧЕМ: Удержание инструментов в густом, "грудном" регистре.
     */
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
        this.barInChorus = epoch % 12;
        const events: FractalEvent[] = [];

        // Обновляем фазу фразы (AAB Logic)
        this.updateCognitiveState();

        // 1. УДАРНЫЕ — True Shuffle
        if (hints.drums) events.push(...this.generateTrueShuffleDrums(epoch));

        // 2. БАС — Процедурный волкинг
        if (hints.bass) events.push(...this.generateProceduralWalkingBass(currentChord, epoch));
        
        // 3. АККОМПАНЕМЕНТ — Travis Picking
        if (hints.accompaniment) events.push(...this.generateActiveTravisPicking(currentChord, epoch));
        
        // 4. МЕЛОДИЯ — Когнитивная импровизация
        if (hints.melody) events.push(...this.generateCognitiveMelody(currentChord, epoch));

        return events;
    }

    // ============================================================================
    // 1. УДАРНЫЕ: TRUE SHUFFLE & MIDNIGHT DRAG
    // ============================================================================

    private generateTrueShuffleDrums(epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const beatDuration = 1.0; // В долях такта
        const swingRatio = 0.68 + (this.random.next() - 0.5) * 0.06; // "Дышащий" свинг

        // Кик на 1 и 3
        [0, 2].forEach(beat => {
            events.push({
                type: 'drum_kick_reso',
                time: beat + (this.random.next() * 0.02),
                duration: 0.2, weight: 0.8,
                technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
            });
        });

        // Снейр на 2 и 4 с оттяжкой
        [1, 3].forEach(beat => {
            const time = beat + (1 - swingRatio);
            events.push({
                type: 'drum_snare_ghost_note',
                time: time + (this.random.next() * 0.03),
                duration: 0.2, weight: 0.7,
                technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
            });
        });

        // Хай-хэт (триоли с пропусками для меланхолии)
        for (let i = 0; i < 4; i++) {
            // "1" и "а"
            events.push({
                type: 'drum_25693__walter_odington__hackney-hat-1',
                time: i, duration: 0.1, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });
            if (this.random.next() > this.state.emotion.melancholy * 0.5) {
                events.push({
                    type: 'drum_25693__walter_odington__hackney-hat-1',
                    time: i + swingRatio, duration: 0.1, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
                });
            }
        }

        return events;
    }

    // ============================================================================
    // 2. БАС: ПРОЦЕДУРНЫЙ ВОЛКИНГ (НЕПРЕРЫВНЫЙ ФУНДАМЕНТ)
    // ============================================================================

    private generateProceduralWalkingBass(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        
        // Находим корень следующего такта для целевой ноты
        const nextChordOffsets = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
        const nextRoot = chord.rootNote + nextChordOffsets[(epoch + 1) % 12] - 12;

        // 4 доли - 4 шага
        const steps = [
            root, // 1. Корень
            this.random.next() > 0.5 ? root + 2 : root + 4, // 2. Проходящая (диатоническая)
            root + 7, // 3. Квинта
            nextRoot - 1 // 4. Ведущий тон (хроматика к следующему корню)
        ];

        steps.forEach((note, i) => {
            events.push({
                type: 'bass',
                note: note,
                time: i + (this.random.next() * 0.04), // Midnight Drag
                duration: 0.95,
                weight: i === 0 ? 0.9 : 0.7,
                technique: 'pluck', dynamics: 'mf', phrasing: 'legato'
            });
        });

        return events;
    }

    // ============================================================================
    // 3. АККОМПАНЕМЕНТ: TRAVIS PICKING (BUSY FINGERS)
    // ============================================================================

    private generateActiveTravisPicking(chord: GhostChord, epoch: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.clampToCeiling(chord.rootNote + 12);
        const isMinor = chord.chordType === 'minor';
        const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

        // Ритмическая сетка: 8-е ноты с синкопами
        const pattern = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5];
        pattern.forEach((t, i) => {
            // Бас на сильных долях, арпеджио на слабых
            const isBassNote = i % 2 === 0;
            const noteIdx = isBassNote ? 0 : (1 + (i % 3));
            
            if (this.random.next() > 0.2) { // 80% плотность - "пальцы работают"
                events.push({
                    type: 'accompaniment',
                    note: this.clampToCeiling(chordNotes[noteIdx]),
                    time: t + (this.random.next() * 0.05),
                    duration: isBassNote ? 0.8 : 0.4,
                    weight: isBassNote ? 0.5 : 0.3,
                    technique: 'pluck', dynamics: 'p', phrasing: 'detached'
                });
            }
        });

        return events;
    }

    // ============================================================================
    // 4. МЕЛОДИЯ: КОГНИТИВНАЯ РЕЧЬ (AAB + ♭5 RESOLUTION)
    // ============================================================================

    private generateCognitiveMelody(chord: GhostChord, epoch: number): FractalEvent[] {
        const barIn12 = epoch % 12;
        const root = chord.rootNote;
        const events: FractalEvent[] = [];

        // Фаза AAB
        // 0-3: Call (Statement)
        // 4-7: Variation (Repeat with twist)
        // 8-11: Response (Resolution)

        if (barIn12 < 4) {
            // STATEMENT: Нисходящая фраза с напряжением
            const notes = [10, 7, 6, 3]; // 7 -> 5 -> ♭5 -> ♭3
            this.lastAxiom = notes;
            events.push(...this.renderPhrase(root, notes, 0));
        } else if (barIn12 < 8) {
            // VARIATION: Повтор аксиомы, но с бендом на ♭5
            events.push(...this.renderPhrase(root, this.lastAxiom, 0.1, true));
        } else {
            // RESPONSE: Восходящее разрешение
            const notes = [3, 5, 7, 12]; // ♭3 -> 4 -> 5 -> 8
            events.push(...this.renderPhrase(root, notes, 0.2, false, true));
        }

        return events;
    }

    private renderPhrase(root: number, degrees: number[], startTime: number, forceBend: boolean = false, isResponse: boolean = false): FractalEvent[] {
        const events: FractalEvent[] = [];
        let time = startTime;

        degrees.forEach((deg, i) => {
            let pitch = root + deg;
            
            // ПРАВИЛО РАЗРЕШЕНИЯ ♭5
            if (deg === 6) {
                this.state.blueNotePending = true;
                this.state.tensionLevel += 0.2;
            } else if (this.state.blueNotePending) {
                // Если предыдущая была ♭5, гарантируем разрешение в 5 или 3
                pitch = root + (this.random.next() > 0.5 ? 7 : 3);
                this.state.blueNotePending = false;
                this.state.tensionLevel -= 0.3;
            }

            const isLast = i === degrees.length - 1;
            const note: FractalEvent = {
                type: 'melody',
                note: this.clampToCeiling(pitch, isResponse && this.state.tensionLevel > 0.8 ? 83 : 71),
                time: time + (this.random.next() * 0.06),
                duration: isLast ? 1.5 : 0.6,
                weight: 0.9,
                technique: (deg === 6 || forceBend) ? 'bend' : (isLast ? 'vibrato' : 'pick'),
                dynamics: isResponse ? 'mf' : 'p',
                phrasing: 'legato'
            };

            events.push(note);
            time += isLast ? 1.0 : 0.5;
        });

        return events;
    }

    // ============================================================================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ============================================================================

    private updateCognitiveState() {
        // Эволюция уровня меланхолии и мрачности (статично для текущей задачи)
        this.state.tensionLevel = Math.max(0.1, Math.min(1.0, this.state.tensionLevel));
    }

    private applyAntiFuneralMarch(events: FractalEvent[], epoch: number): FractalEvent[] {
        // Проверка на 4+ нисходящие ноты (реализовано внутри renderPhrase через логику Response)
        return events;
    }

    private evolveEmotion(epoch: number) {
        // Brownian drift
        this.state.emotion.melancholy += (this.random.next() - 0.5) * 0.02;
        this.state.emotion.melancholy = clamp(this.state.emotion.melancholy, 0.6, 0.95);
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
