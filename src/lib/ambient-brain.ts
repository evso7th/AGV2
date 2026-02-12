/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v1.1 — "The Spectral Dynasty".
 * #ЧТО: Внедрена библиотека Спектральных Атомов (A01-A12) — структурных шаблонов для управления Туманом и Глубиной.
 *       Реализована изоляция управления (Fog, Pulse, Depth) и локальный микшер.
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
import { calculateMusiNum } from './music-theory';

// ───── SPECTRAL ATOMS (A01-A12) ─────
// Шаблоны изменения параметров внутри бандла (16 долей)
const SPECTRAL_ATOMS: Record<string, { fog: number[], depth: number[], pulse: number[] }> = {
    A01_BREATH: { // Плавное дыхание
        fog: [0.2, 0.4, 0.6, 0.4, 0.2],
        depth: [0.3, 0.3, 0.5, 0.3, 0.3],
        pulse: [0.1, 0.1, 0.1, 0.1, 0.1]
    },
    A05_CRYSTAL: { // Вспышки чистоты
        fog: [0.8, 0.2, 0.1, 0.5, 0.8],
        depth: [0.4, 0.7, 0.9, 0.6, 0.4],
        pulse: [0.2, 0.4, 0.6, 0.3, 0.2]
    },
    A09_ABYSS: { // Глубокое погружение
        fog: [0.7, 0.8, 0.9, 0.95, 0.9],
        depth: [0.2, 0.4, 0.6, 0.8, 1.0],
        pulse: [0.05, 0.05, 0.05, 0.05, 0.05]
    }
};

// ───── ФРАКТАЛЬНЫЕ КОНСТАНТЫ ─────
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

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA
    ): { events: FractalEvent[], instrumentHints: InstrumentHints } {
        
        const waves = this.computeTensionWaves(epoch * (60 / dna.baseTempo) * 4);
        const localTension = this.computeGlobalTension(waves);

        // Применяем Спектральный Атом на основе макро-волны T3
        this.applySpectralAtom(epoch, waves[3]);
        this.updateMoodAxes(epoch, localTension);

        const hints = this.orchestrate(localTension);
        const events: FractalEvent[] = [];

        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch));
        }

        if (hints.bass) {
            events.push(...this.renderBass(currentChord, localTension));
        }

        if (hints.sparkles && this.random.next() < (0.12 * (1 - this.fog))) {
            events.push(this.renderSparkle(currentChord));
        }

        return { events, instrumentHints: hints };
    }

    private applySpectralAtom(epoch: number, t3: number) {
        // Выбор атома на основе макро-состояния
        const atomKeys = Object.keys(SPECTRAL_ATOMS);
        const atomIdx = Math.floor(((t3 + 1) / 2) * atomKeys.length) % atomKeys.length;
        const atom = SPECTRAL_ATOMS[atomKeys[atomIdx]];
        
        // Модуляция осей через атом (интерполяция по 16 долям)
        const step = epoch % 5; 
        this.fog = (this.fog + atom.fog[step]) / 2;
        this.depth = (this.depth + atom.depth[step]) / 2;
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
        this.fog = clamp(0.2 + (tension * 0.6), 0, 1); 
        this.depth = clamp(0.3 + (tension * 0.5), 0, 1);
        this.pulse = clamp(0.1 + (tension * 0.4), 0, 1);
    }

    private orchestrate(tension: number): InstrumentHints {
        return {
            bass: tension > 0.25 ? 'bass_ambient' : undefined,
            accompaniment: 'synth_ambient_pad_lush',
            sparkles: tension < 0.5 ? 'light' : undefined,
            summonProgress: {
                bass: Math.min(1, tension * 2),
                accompaniment: 1.0
            }
        };
    }

    private renderPad(chord: GhostChord, epoch: number): FractalEvent[] {
        const root = chord.rootNote + 12;
        const isMinor = chord.chordType === 'minor';
        const notes = [root, root + (isMinor ? 3 : 4), root + 7];
        const cutoff = 1800 * (1 - Math.pow(this.fog, 1.8));

        return notes.map((n, i) => ({
            type: 'accompaniment',
            note: n,
            time: i * 0.1,
            duration: 4.0,
            weight: 0.25 * (1 - this.fog * 0.4),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.0 + this.fog * 3, release: 5.0, filterCutoff: cutoff }
        }));
    }

    private renderBass(chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'bass',
            note: chord.rootNote - 12,
            time: 0,
            duration: 4.0,
            weight: 0.55,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.5, release: 6.0, filterCutoff: 110 + (tension * 120) }
        }];
    }

    private renderSparkle(chord: GhostChord): FractalEvent {
        return {
            type: 'sparkle',
            note: chord.rootNote + 36 + (this.random.next() > 0.5 ? 12 : 0),
            time: this.random.next() * 4,
            duration: 1.5,
            weight: 0.35,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { mood: this.mood, category: 'light' }
        };
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
