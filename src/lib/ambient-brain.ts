/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v1.0.
 * #ЧТО: Изолированная логика управления (Fog, Pulse, Depth). 
 *       Собственный расчет громкости, фильтров и вероятностей.
 * #СВЯЗИ: Вызывается исключительно из FractalMusicEngine при genre === 'ambient'.
 */

import type { 
    FractalEvent, 
    GhostChord, 
    Mood, 
    SuiteDNA, 
    NavigationInfo,
    Technique,
    InstrumentHints
} from '@/types/music';
import { calculateMusiNum, DEGREE_TO_SEMITONE } from './music-theory';

// ───── ФРАКТАЛЬНЫЕ КОНСТАНТЫ (4 МАСШТАБА) ─────
const PHI = [0.0, 1.309, 2.618, 4.188];
const PSI = [0.785, 2.094, 3.927, 5.498];
const BETA = 7.2360679775;
const PERIODS = [8, 45, 180, 600];
const WEIGHTS = [0.15, 0.35, 0.30, 0.20];
const MOD_DEPTH = [0.05, 0.12, 0.25, 0.40];

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private random: any;
    
    // Локальное состояние осей (Суверенитет управления)
    private fog: number = 0.3;
    private pulse: number = 0.15;
    private depth: number = 0.4;

    constructor(seed: number, mood: Mood) {
        this.seed = seed;
        this.mood = mood;
        this.random = this.createSeededRandom(seed);
    }

    private createSeededRandom(seed: number) {
        let state = seed;
        return {
            next: () => {
                state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
                return state / Math.pow(2, 32);
            }
        };
    }

    /**
     * #ЗАЧЕМ: Главный цикл суверенного мозга.
     * #ЧТО: Возвращает события и хинты, вычисленные по внутренним правилам.
     */
    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA
    ): { events: FractalEvent[], instrumentHints: InstrumentHints } {
        
        // 1. Расчет фрактальных волн (Локальное время)
        const waves = this.computeTensionWaves(epoch * (60 / dna.baseTempo) * 4);
        const localTension = this.computeGlobalTension(waves);

        // 2. Обновление осей (Fog, Pulse, Depth)
        this.updateMoodAxes(epoch, localTension);

        // 3. Формирование состава ансамбля (Локальные вероятности)
        const hints = this.orchestrate(localTension);

        // 4. Генерация событий (Локальный микшер)
        const events: FractalEvent[] = [];

        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch));
        }

        if (hints.bass) {
            events.push(...this.renderBass(currentChord, localTension));
        }

        if (hints.sparkles && this.random.next() < (0.1 * (1 - this.fog))) {
            events.push(this.renderSparkle(currentChord));
        }

        return { events, instrumentHints: hints };
    }

    private computeTensionWaves(timeSec: number): number[] {
        const waves = [];
        for (let n = 0; n < 4; n++) {
            const base = Math.sin(2 * Math.PI * timeSec / PERIODS[n] + PHI[n]);
            const mod = Math.sin(2 * Math.PI * timeSec / (PERIODS[n] / BETA) + PSI[n]);
            waves.push(base * (1 + MOD_DEPTH[n] * mod));
        }
        return waves;
    }

    private computeGlobalTension(waves: number[]): number {
        let t = 0;
        for (let n = 0; n < 4; n++) t += WEIGHTS[n] * waves[n];
        return (t + 1) / 2;
    }

    private updateMoodAxes(epoch: number, tension: number) {
        // Локальное вычисление параметров "Тумана" и "Глубины"
        this.fog = 0.2 + (tension * 0.6); 
        this.depth = 0.3 + (tension * 0.5);
        this.pulse = 0.1 + (tension * 0.4);
    }

    private orchestrate(tension: number): InstrumentHints {
        // Суверенное решение о составе
        return {
            bass: tension > 0.2 ? 'bass_ambient' : undefined,
            accompaniment: 'synth_ambient_pad_lush',
            sparkles: tension < 0.6 ? 'light' : undefined,
            summonProgress: {
                bass: Math.min(1, tension * 2),
                accompaniment: 1.0
            }
        };
    }

    private renderPad(chord: GhostChord, epoch: number): FractalEvent[] {
        const root = chord.rootNote + 12;
        const notes = [root, root + 3, root + 7];
        
        // Локальный расчет фильтра (Туман закрывает фильтр)
        const cutoff = 1600 * (1 - Math.pow(this.fog, 1.5));

        return notes.map((n, i) => ({
            type: 'accompaniment',
            note: n,
            time: i * 0.1,
            duration: 4.0,
            weight: 0.3 * (1 - this.fog * 0.5), // Громкость падает в тумане
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.5 + this.fog * 2, release: 4.0, filterCutoff: cutoff }
        }));
    }

    private renderBass(chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'bass',
            note: chord.rootNote - 12,
            time: 0,
            duration: 4.0,
            weight: 0.6,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.0, release: 5.0, filterCutoff: 120 + (tension * 100) }
        }];
    }

    private renderSparkle(chord: GhostChord): FractalEvent {
        return {
            type: 'sparkle',
            note: chord.rootNote + 36 + (Math.random() > 0.5 ? 12 : 0),
            time: Math.random() * 4,
            duration: 1.0,
            weight: 0.4,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { mood: this.mood, category: 'light' }
        };
    }
}
