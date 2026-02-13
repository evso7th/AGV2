/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v2.0 — "Rhythmic Vitality".
 * #ЧТО: 1. Бас переведен из режима дронов в режим активных медленных риффов.
 *       2. Реализованы "Органные Пассажи" — текучие арпеджио для Manfred Mann style.
 *       3. Пэды теперь "дышат" за счет перекрывающихся пульсаций.
 */

import type { 
    FractalEvent, 
    GhostChord, 
    Mood, 
    SuiteDNA, 
    NavigationInfo,
    Technique,
    InstrumentHints,
    InstrumentPart
} from '@/types/music';
import { calculateMusiNum, DEGREE_TO_SEMITONE, pickWeightedDeterministic } from './music-theory';
import { AMBIENT_LEGACY } from './assets/ambient-legacy';

const SPECTRAL_ATOMS: Record<string, { fog: number[], depth: number[], pulse: number[] }> = {
    A01_BREATH: { fog: [0.2, 0.4, 0.6, 0.4, 0.2], depth: [0.3, 0.3, 0.5, 0.3, 0.3], pulse: [0.1, 0.1, 0.1, 0.1, 0.1] },
    A02_DAWN: { fog: [0.1, 0.2, 0.3, 0.2, 0.1], depth: [0.2, 0.4, 0.6, 0.4, 0.2], pulse: [0.3, 0.3, 0.3, 0.3, 0.3] },
    A05_CRYSTAL: { fog: [0.8, 0.2, 0.1, 0.5, 0.8], depth: [0.4, 0.7, 0.9, 0.6, 0.4], pulse: [0.2, 0.4, 0.6, 0.3, 0.2] },
    A09_ABYSS: { fog: [0.7, 0.8, 0.9, 0.95, 0.9], depth: [0.2, 0.4, 0.6, 0.8, 1.0], pulse: [0.05, 0.05, 0.05, 0.05, 0.05] },
    A12_IMPULSE: { fog: [0.3, 0.3, 0.3, 0.3, 0.3], depth: [0.5, 0.6, 0.7, 0.6, 0.5], pulse: [0.6, 0.8, 0.9, 0.7, 0.6] }
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
    
    private fog: number = 0.3;
    private pulse: number = 0.15;
    private depth: number = 0.4;

    private activatedParts: Set<InstrumentPart> = new Set();
    private activeTimbres: Partial<Record<InstrumentPart, string>> = {};

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

    public generateBar(
        epoch: number, 
        currentChord: GhostChord, 
        navInfo: NavigationInfo, 
        dna: SuiteDNA
    ): { events: FractalEvent[], instrumentHints: InstrumentHints, tension: number, beautyScore: number } {
        
        const waves = this.computeTensionWaves(epoch * (60 / dna.baseTempo) * 4);
        const localTension = this.computeGlobalTension(waves);

        this.applySpectralAtom(epoch, waves[3]);
        this.updateMoodAxes(epoch, localTension);

        const hints = this.orchestrate(localTension, navInfo, epoch, dna);
        const events: FractalEvent[] = [];

        // 1. ПЭДЫ (Теперь "дышат" перекрывающимися сегментами)
        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string));
        }

        // 2. БАС (Теперь всегда играет Ритмический Рифф)
        if (hints.bass) {
            events.push(...this.renderBass(currentChord, localTension, hints.bass as string, epoch));
        }

        // 3. МЕЛОДИЯ И ПАССАЖИ
        if (hints.melody) {
            const timbre = hints.melody as string;
            // #ЗАЧЕМ: Реализация Органных Пассажей.
            // #ЧТО: Если инструмент - орган, и мы в активной фазе, играем арпеджио.
            if (timbre.includes('organ') && localTension > 0.45) {
                events.push(...this.renderOrganArpeggio(currentChord, epoch, localTension));
            } else {
                events.push(...this.renderLegacyMelody(currentChord, epoch, localTension, hints, dna));
            }
        }

        // 4. ПИАНИНО (Капельки)
        if (hints.pianoAccompaniment) {
            events.push(...this.renderPianoDrops(currentChord, epoch, localTension));
        }

        // 5. ОРКЕСТРОВАЯ ГАРМОНИЯ
        if (hints.harmony) {
            events.push(...this.renderOrchestralHarmony(currentChord, epoch, hints.harmony as string));
        }

        // 6. ИСКРЫ
        if (hints.sparkles && this.random.next() < (0.25 * (1 - this.fog))) {
            events.push(this.renderSparkle(currentChord));
        }

        // 7. УДАРНЫЕ (Сцена 2 и далее)
        if (hints.drums) {
            events.push(...this.renderAmbientPercussion(epoch, localTension));
        }

        return { 
            events, 
            instrumentHints: hints,
            tension: localTension,
            beautyScore: 0.5 
        };
    }

    private orchestrate(tension: number, navInfo: NavigationInfo, epoch: number, dna: SuiteDNA): InstrumentHints {
        const hints: InstrumentHints = { summonProgress: {} };
        const stages = navInfo.currentPart.stagedInstrumentation;

        if (stages && stages.length > 0) {
            const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
            const progress = (epoch - navInfo.currentPartStartBar) / partBars;
            let currentStage = stages[stages.length - 1];
            let acc = 0;
            for (const s of stages) { 
                acc += s.duration.percent; 
                if (progress * 100 <= acc) { currentStage = s; break; } 
            }

            Object.entries(currentStage.instrumentation).forEach(([partStr, rule]: [any, any]) => {
                const part = partStr as InstrumentPart;
                
                if (!this.activatedParts.has(part)) {
                    if (this.random.next() < rule.activationChance) {
                        this.activatedParts.add(part);
                        this.activeTimbres[part] = pickWeightedDeterministic(rule.instrumentOptions, this.seed, epoch, 500);
                    }
                }

                if (this.activatedParts.has(part)) {
                    (hints as any)[part] = this.activeTimbres[part];
                    hints.summonProgress![part] = 1.0;
                }
            });
        }

        return hints;
    }

    /**
     * #ЗАЧЕМ: Реализация Органных Пассажей (The Flow).
     * #ЧТО: Медленные текучие арпеджио с наслоением.
     */
    private renderOrganArpeggio(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 36;
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const intervals = isMinor ? [0, 3, 7, 10, 12] : [0, 4, 7, 11, 12];
        
        const events: FractalEvent[] = [];
        const count = 4; // 4 ноты на такт
        const timeStep = 1.0; // Каждую секунду новая нота

        for (let i = 0; i < count; i++) {
            const idx = calculateMusiNum(epoch + i, 3, this.seed, intervals.length);
            events.push({
                type: 'melody',
                note: root + intervals[idx],
                time: i * timeStep,
                duration: 2.5, // Наслоение! Нота звучит 2.5 сек, перекрывая следующую
                weight: 0.65 * tension,
                technique: 'pick',
                dynamics: 'p',
                phrasing: 'legato'
            });
        }
        return events;
    }

    private renderLegacyMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints, dna: SuiteDNA): FractalEvent[] {
        const groupKey = dna.ambientLegacyGroup || 'ENO';
        const group = AMBIENT_LEGACY[groupKey];
        (hints as any).melody = group.preferredInstrument;

        const lickIdx = calculateMusiNum(epoch, 3, this.seed, group.licks.length);
        const lick = group.licks[lickIdx];

        return lick.phrase.map(n => ({
            type: 'melody',
            note: Math.min(chord.rootNote + 36 + group.registerBias + (DEGREE_TO_SEMITONE[n.deg] || 0), 88),
            time: n.t / 3,
            duration: (n.d / 3) * 2.0, // Усиленный Overlap
            weight: 0.75 * (1 - this.fog * 0.15),
            technique: n.tech || 'pick',
            dynamics: 'p',
            phrasing: group.phrasing === 'staccato' ? 'staccato' : 'legato'
        }));
    }

    private renderPianoDrops(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // #ЗАЧЕМ: Хаотичные, но музыкальные капли.
        const beats = [0.5, 1.8, 2.4, 3.7]; 
        beats.forEach(beat => {
            if (this.random.next() < (0.15 * this.depth)) {
                events.push({
                    type: 'pianoAccompaniment',
                    note: chord.rootNote + 48 + [0, 7, 12, 14][this.random.nextInt(4)],
                    time: beat,
                    duration: 2.0,
                    weight: 0.4,
                    technique: 'hit',
                    dynamics: 'p',
                    phrasing: 'staccato'
                });
            }
        });
        return events;
    }

    private renderOrchestralHarmony(chord: GhostChord, epoch: number, timbre: string): FractalEvent[] {
        const root = chord.rootNote + 24;
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const notes = [root + (isMinor ? 3 : 4), root + 7, root + 12];
        
        return notes.map((n, i) => ({
            type: 'harmony',
            note: n,
            time: i * 0.25,
            duration: 8.0, 
            weight: 0.4,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // Всегда минимальный кик раз в 2 такта
        const isKickBar = epoch % 2 === 0;
        
        if (isKickBar) {
            events.push({ type: 'drum_kick', note: 36, time: 0, duration: 0.1, weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }

        // Ритмические томы и бонги
        [1.0, 2.5, 3.5].forEach(t => {
            if (this.random.next() < (0.15 + tension * 0.25)) {
                const type = this.random.next() > 0.6 ? 'drum_Sonor_Classix_Low_Tom' : 'drum_bongo_pvc-tube-01';
                events.push({ 
                    type: type as any, 
                    note: 40, 
                    time: t, 
                    duration: 0.2, 
                    weight: 0.4 + (tension * 0.1), 
                    technique: 'hit', 
                    dynamics: 'p', 
                    phrasing: 'staccato' 
                });
            }
        });

        // Редкие колокольчики
        if (this.random.next() < (0.1 + tension * 0.1)) {
            const bellIndex = calculateMusiNum(epoch, 3, this.seed, 40);
            const bellTypes = ['Bell_-_Ambient', 'Bell_-_Echo', 'Bell_-_Deep', 'Bell_-_Gong', 'Bell_-_Soft'];
            events.push({ 
                type: `drum_${bellTypes[bellIndex % 5]}` as any, 
                note: 60, 
                time: this.random.next() * 4, 
                duration: 4.0, 
                weight: 0.35, 
                technique: 'hit', 
                dynamics: 'p', 
                phrasing: 'staccato' 
            });
        }
        return events;
    }

    private applySpectralAtom(epoch: number, t3: number) {
        const atomKeys = Object.keys(SPECTRAL_ATOMS);
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

    private renderPad(chord: GhostChord, epoch: number, timbre: string): FractalEvent[] {
        const root = chord.rootNote + 12;
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const notes = [root, root + 7, root + 12];
        const cutoff = 1800 * (1 - Math.pow(this.fog, 1.8));

        // #ЗАЧЕМ: Реализация Ритмического Дыхания Пэдов.
        // #ЧТО: Каждый такт пэд пере-атакует, но хвост 8.0с создает бесшовность.
        return notes.map((n, i) => ({
            type: 'accompaniment',
            note: n,
            time: i * 0.15,
            duration: 8.0, 
            weight: 0.38 * (1 - this.fog * 0.1),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legate',
            params: { attack: 2.0 + this.fog * 2, release: 6.0, filterCutoff: cutoff }
        }));
    }

    /**
     * #ЗАЧЕМ: Живой Бас (Slow Riffing).
     * #ЧТО: Басист играет медленные, но четкие ритмические фигуры.
     */
    private renderBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = chord.rootNote - 12;
        const events: FractalEvent[] = [];
        
        // Базовая ритмическая фигура: 1 и 3 доли
        const pattern = [
            { t: 0, n: root, d: 2.0, weight: 0.65 },
            { t: 2.0, n: root + 7, d: 2.0, weight: 0.55 }
        ];

        // В моменты напряжения — добавляем проходящую ноту
        if (tension > 0.6) {
            pattern.push({ t: 3.5, n: root + 10, d: 4.5, weight: 0.5 });
        }

        return pattern.map(p => ({
            type: 'bass',
            note: Math.max(p.n, 24), // Регистровая дисциплина (MIDI 24)
            time: p.t,
            duration: p.d + 4.0, // Усиленный Overlap для баса
            weight: p.weight + (tension * 0.1),
            technique: 'pluck',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 0.8, release: 4.0, filterCutoff: 150 + (tension * 100) }
        }));
    }

    private renderSparkle(chord: GhostChord): FractalEvent {
        return {
            type: 'sparkle',
            note: chord.rootNote + 36 + (this.random.next() > 0.5 ? 12 : 0),
            time: this.random.next() * 4,
            duration: 2.5,
            weight: 0.45,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { mood: this.mood, category: 'dark' }
        };
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
