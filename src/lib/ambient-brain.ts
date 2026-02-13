/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v1.4 — "The Hall of Giants" (Fix: Stability & Isolation).
 * #ЧТО: 1. Исправлена ошибка TypeError в applySpectralAtom (OOB Index).
 *       2. Реализована полная изоляция управления энергией (Sovereign Tension).
 *       3. Расширена библиотека Спектральных Атомов.
 * #СВЯЗИ: Вызывается из FractalMusicEngine.ts при genre === 'ambient'.
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
import { AMBIENT_LEGACY } from './assets/ambient-legacy';

// ───── SPECTRAL ATOMS (A01-A12) ─────
// Эти атомы определяют "форму дыхания" атмосферы.
const SPECTRAL_ATOMS: Record<string, { fog: number[], depth: number[], pulse: number[] }> = {
    A01_BREATH: {
        fog: [0.2, 0.4, 0.6, 0.4, 0.2],
        depth: [0.3, 0.3, 0.5, 0.3, 0.3],
        pulse: [0.1, 0.1, 0.1, 0.1, 0.1]
    },
    A02_DAWN: {
        fog: [0.1, 0.2, 0.3, 0.2, 0.1],
        depth: [0.2, 0.4, 0.6, 0.4, 0.2],
        pulse: [0.3, 0.3, 0.3, 0.3, 0.3]
    },
    A05_CRYSTAL: {
        fog: [0.8, 0.2, 0.1, 0.5, 0.8],
        depth: [0.4, 0.7, 0.9, 0.6, 0.4],
        pulse: [0.2, 0.4, 0.6, 0.3, 0.2]
    },
    A09_ABYSS: {
        fog: [0.7, 0.8, 0.9, 0.95, 0.9],
        depth: [0.2, 0.4, 0.6, 0.8, 1.0],
        pulse: [0.05, 0.05, 0.05, 0.05, 0.05]
    }
};

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
    
    // Локальные оси управления (Изоляция)
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
     * Генерирует один такт амбиента с полностью изолированным управлением.
     */
    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA
    ): { events: FractalEvent[], instrumentHints: InstrumentHints, tension: number, beautyScore: number } {
        
        // 1. Расчет фрактальных волн напряжения
        const waves = this.computeTensionWaves(epoch * (60 / dna.baseTempo) * 4);
        const localTension = this.computeGlobalTension(waves);

        // 2. Применение Спектрального Атома (структурирование тумана)
        this.applySpectralAtom(epoch, waves[3]);

        // 3. Обновление осей настроения
        this.updateMoodAxes(epoch, localTension);

        // 4. Оркестровка (выбор инструментов на основе локального напряжения)
        const hints = this.orchestrate(localTension);
        const events: FractalEvent[] = [];

        // 5. Рендеринг партий
        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch));
        }

        if (hints.bass) {
            events.push(...this.renderBass(currentChord, localTension));
        }

        if (hints.melody && this.random.next() < (0.4 * this.depth)) {
            events.push(...this.renderLegacyMelody(currentChord, epoch, localTension));
        }

        if (hints.sparkles && this.random.next() < (0.15 * (1 - this.fog))) {
            events.push(this.renderSparkle(currentChord));
        }

        return { 
            events, 
            instrumentHints: hints,
            tension: localTension, // Суверенное напряжение
            beautyScore: 0.5       // Будет пересчитано Двигателем
        };
    }

    private renderLegacyMelody(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        let groupKey = 'ENO';
        if (['joyful', 'epic'].includes(this.mood)) groupKey = tension > 0.6 ? 'JARRE' : 'OLDFIELD';
        else if (['dark', 'anxious'].includes(this.mood)) groupKey = 'CBL';
        else if (this.mood === 'enthusiastic') groupKey = 'KRAFTWERK';
        else if (tension < 0.4) groupKey = 'APHEX';
        else groupKey = 'BOARDS';

        const group = AMBIENT_LEGACY[groupKey];
        const lickIdx = calculateMusiNum(epoch, 3, this.seed, group.licks.length);
        const lick = group.licks[lickIdx];

        return lick.phrase.map(n => ({
            type: 'melody',
            note: chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: n.t / 3,
            duration: n.d / 3,
            weight: 0.7 * (1 - this.fog * 0.3),
            technique: n.tech || 'pick',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private applySpectralAtom(epoch: number, t3: number) {
        const atomKeys = Object.keys(SPECTRAL_ATOMS);
        
        // #ЗАЧЕМ: Безопасный расчет индекса (Fix TypeError).
        // #ЧТО: Нормализация t3 из [-1.5, 1.5] в [0, 1] и клэмп.
        const normalizedT3 = (t3 + 1.5) / 3.0;
        const safeIdx = Math.floor(clamp(normalizedT3, 0, 0.999) * atomKeys.length);
        
        const atom = SPECTRAL_ATOMS[atomKeys[safeIdx]];
        
        if (!atom) return;

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
            melody: tension > 0.4 ? 'mellotron_flute_intimate' : undefined,
            sparkles: tension < 0.5 ? 'light' : undefined,
            summonProgress: {
                bass: Math.min(1, tension * 2),
                accompaniment: 1.0,
                melody: tension > 0.4 ? (tension - 0.4) * 2 : 0
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
