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
import { calculateMusiNum } from './music-theory';

/**
 * #ЗАЧЕМ: "Блюзовый Мозг" v13.0 — "Fractal Enlightenment".
 * #ЧТО: Интеграция парадигм Нирхауза и MusiNum:
 *   1. MusiNum Modulator: Детерминированные фрактальные последовательности управляют формой.
 *   2. Melodic Modes: Поддержка режимов Rising/Falling/New на основе фрактального веса.
 *   3. L-System & Markov: Сохранение связности синтаксиса.
 */

export class BluesBrain {
    private state: BluesCognitiveState;
    private random: any;
    private themeA: number[] = [];
    private lastNotes: number[] = [0, 0];
    private pinkNoiseState: number = 0;
    
    private readonly COMFORT_CEILING = 71; 
    private readonly BASS_FLOOR = 36; 

    private readonly MELODIC_SYNTAX = [
        [0.1, 0.3, 0.2, 0.2, 0.1, 0.1], 
        [0.05, 0.15, 0.3, 0.3, 0.15, 0.05], 
        [0.2, 0.2, 0.1, 0.3, 0.1, 0.1], 
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

    private generatePinkNoise(): number {
        const white = this.random.next() * 2 - 1;
        this.pinkNoiseState = (this.pinkNoiseState + (0.02 * white)) / 1.02;
        return this.pinkNoiseState;
    }

    private clampToCeiling(pitch: number, limit: number = 71): number {
        let result = pitch;
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

        // --- MUSINUM FRACTAL MODULATION ---
        // Используем Base=2 для классического самоподобия
        const fractalWeight = calculateMusiNum(epoch, 2, 0, 8); 
        const melodicMode = fractalWeight > 5 ? 'Rising' : (fractalWeight < 2 ? 'Falling' : 'All');

        this.evolveCognitiveState(epoch, fractalWeight);

        if (hints.drums) events.push(...this.generateFractalDrums(epoch, fractalWeight));
        if (hints.bass) events.push(...this.generateProceduralBass(currentChord, epoch, fractalWeight));
        if (hints.accompaniment) events.push(...this.generateLSystemComping(currentChord, epoch, fractalWeight));
        
        if (hints.melody) {
            const melodyEvents = this.generateGrandSoulMelody(currentChord, epoch, melodicMode);
            events.push(...melodyEvents);
        }

        return events;
    }

    private generateFractalDrums(epoch: number, fWeight: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const swingRatio = 0.68 + (this.generatePinkNoise() * 0.05);

        [0, 2].forEach(beat => {
            events.push({
                type: 'drum_kick_reso',
                time: beat + (this.generatePinkNoise() * 0.02),
                duration: 0.2, weight: 0.8 + (fWeight * 0.02),
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

        // Плотность хэта модулируется фракталом
        const hhCount = fWeight > 4 ? 4 : 2;
        for (let i = 0; i < hhCount; i++) {
            events.push({
                type: 'drum_25693__walter_odington__hackney-hat-1',
                time: i * (4/hhCount), duration: 0.1, weight: 0.4, 
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });
        }

        return events;
    }

    private generateProceduralBass(chord: GhostChord, epoch: number, fWeight: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        const nextChordOffsets = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7];
        const nextRoot = chord.rootNote + nextChordOffsets[(epoch + 1) % 12] - 12;

        // MusiNum модулирует выбор между 3-й и 4-й ступенью
        const third = fWeight % 2 === 0 ? root + 3 : root + 4;

        const steps = [root, third, root + 7, nextRoot - 1];

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

    private generateLSystemComping(chord: GhostChord, epoch: number, fWeight: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.clampToCeiling(chord.rootNote + 12);
        const isMinor = chord.chordType === 'minor';
        const chordNotes = [root, root + (isMinor ? 3 : 4), root + 7, root + 10];

        const baseTicks = [0, 1, 2, 3];
        baseTicks.forEach(beat => {
            // MusiNum решает, дробить ли долю (фрактальное самоподобие)
            const subdivide = fWeight > 5;
            const times = subdivide ? [beat, beat + 0.5] : [beat];
            
            times.forEach(t => {
                const isBass = t % 1 === 0;
                events.push({
                    type: 'accompaniment',
                    note: this.clampToCeiling(chordNotes[isBass ? 0 : (fWeight % chordNotes.length)]),
                    time: t + (this.generatePinkNoise() * 0.03),
                    duration: subdivide ? 0.4 : 0.8,
                    weight: isBass ? 0.45 : 0.25,
                    technique: 'pluck', dynamics: 'p', phrasing: 'detached'
                });
            });
        });

        return events;
    }

    private generateGrandSoulMelody(chord: GhostChord, epoch: number, mode: 'Rising' | 'Falling' | 'All'): FractalEvent[] {
        const barIn12 = epoch % 12;
        const root = chord.rootNote;
        const events: FractalEvent[] = [];

        if (barIn12 < 4) {
            this.themeA = this.generateMarkovPhrase(6); 
            events.push(...this.renderGrandPhrase(root, this.themeA, 0, mode));
        } else if (barIn12 < 8) {
            const themeAPrime = this.themeA.flatMap(deg => 
                this.random.next() > 0.6 ? [deg, deg + 1] : [deg]
            ).slice(0, 6);
            events.push(...this.renderGrandPhrase(root, themeAPrime, 0.1, mode, true));
        } else {
            const response = [3, 5, 6, 7, 10, 12]; 
            events.push(...this.renderGrandPhrase(root, response, 0.2, mode, false, true));
        }

        return events;
    }

    private generateMarkovPhrase(length: number): number[] {
        const phrase: number[] = [10]; 
        let currentState = 1; 

        for (let i = 1; i < length; i++) {
            const rand = this.random.next();
            let cumulative = 0;
            let move = 0;
            
            for (let j = 0; j < 6; j++) {
                cumulative += this.MELODIC_SYNTAX[currentState][j];
                if (rand < cumulative) { move = j; break; }
            }

            const intervals = [-9, -3, 0, 3, 5, 6]; 
            const nextNote = phrase[i-1] + intervals[move];
            phrase.push(nextNote);
            
            if (move < 2) currentState = 0; 
            else if (move === 2) currentState = 1; 
            else currentState = 2; 
        }
        return phrase;
    }

    private renderGrandPhrase(
        root: number, 
        degrees: number[], 
        startTime: number, 
        mode: 'Rising' | 'Falling' | 'All',
        isMutation = false, 
        isTerminal = false
    ): FractalEvent[] {
        const events: FractalEvent[] = [];
        let time = startTime;
        let lastPitch = -Infinity;

        degrees.forEach((deg, i) => {
            let pitch = root + deg;
            
            if (deg === 6) {
                this.state.blueNotePending = true;
                this.state.tensionLevel += 0.15;
            } else if (this.state.blueNotePending) {
                pitch = root + (this.random.next() > 0.7 ? 7 : 3);
                this.state.blueNotePending = false;
                this.state.tensionLevel -= 0.2;
            }

            const currentPitch = this.clampToCeiling(pitch);

            // --- MUSINUM MODE FILTER ---
            let shouldPlay = true;
            if (mode === 'Rising' && currentPitch <= lastPitch) shouldPlay = false;
            if (mode === 'Falling' && currentPitch >= lastPitch) shouldPlay = false;

            if (shouldPlay) {
                const isLast = i === degrees.length - 1;
                events.push({
                    type: 'melody',
                    note: currentPitch,
                    time: time + (this.generatePinkNoise() * 0.05),
                    duration: isLast ? 1.8 : 0.5,
                    weight: 0.9 + (this.generatePinkNoise() * 0.1),
                    technique: (deg === 6) ? 'bend' : (isLast ? 'vibrato' : 'pick'),
                    dynamics: isTerminal ? 'mf' : 'p',
                    phrasing: 'legato'
                });
                lastPitch = currentPitch;
            }

            time += isTerminal ? 0.4 : 0.6;
        });

        return events;
    }

    private evolveCognitiveState(epoch: number, fWeight: number) {
        // Напряжение модулируется фрактальным весом
        this.state.tensionLevel += (this.generatePinkNoise() * 0.05) + (fWeight * 0.01);
        this.state.tensionLevel = clamp(this.state.tensionLevel, 0.1, 1.0);
        
        this.state.emotion.melancholy += (this.generatePinkNoise() * 0.02);
        this.state.emotion.melancholy = clamp(this.state.emotion.melancholy, 0.7, 0.95);
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}