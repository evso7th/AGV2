/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v1.7 — "Seamless Orchestra & Legacy Identity".
 * #ЧТО: 1. Реализована технология Overlap Synthesis (длинные хвосты нот).
 *       2. Внедрена строгая дифференциация Мэнна и Олдфилда.
 *       3. Enforce No-Silence Policy: база всегда слышна.
 *       4. Орган принудительно используется для пассажей Мэнна.
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
    A09_ABYSS: { fog: [0.7, 0.8, 0.9, 0.95, 0.9], depth: [0.2, 0.4, 0.6, 0.8, 1.0], pulse: [0.05, 0.05, 0.05, 0.05, 0.05] }
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

        const hints = this.orchestrate(localTension, navInfo, epoch);
        const events: FractalEvent[] = [];

        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string));
        }

        if (hints.bass) {
            events.push(...this.renderBass(currentChord, localTension, hints.bass as string, epoch));
        }

        if (hints.melody) {
            events.push(...this.renderLegacyMelody(currentChord, epoch, localTension, hints));
        }

        if (hints.pianoAccompaniment) {
            events.push(...this.renderPianoDrops(currentChord, epoch, localTension));
        }

        if (hints.harmony) {
            events.push(...this.renderOrchestralHarmony(currentChord, epoch, hints.harmony as string));
        }

        if (hints.sparkles && this.random.next() < (0.25 * (1 - this.fog))) {
            events.push(this.renderSparkle(currentChord));
        }

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

    private orchestrate(tension: number, navInfo: NavigationInfo, epoch: number): InstrumentHints {
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

    private renderLegacyMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints): FractalEvent[] {
        // #ЗАЧЕМ: Дифференциация мастеров.
        // #ЧТО: Мэнн против Олдфилда.
        let groupKey = 'ENO';
        if (['joyful', 'epic'].includes(this.mood)) {
            groupKey = tension > 0.6 ? 'MANN' : 'OLDFIELD';
        } else if (['dark', 'anxious'].includes(this.mood)) groupKey = 'CBL';
        else groupKey = 'BOARDS';

        // #ЗАЧЕМ: Манфред Мэнн всегда играет на Органе.
        if (groupKey === 'MANN') {
            (hints as any).melody = 'organ_soft_jazz';
        } else if (groupKey === 'OLDFIELD') {
            (hints as any).melody = 'synth';
        }

        const group = AMBIENT_LEGACY[groupKey];
        const lickIdx = calculateMusiNum(epoch, 3, this.seed, group.licks.length);
        const lick = group.licks[lickIdx];

        return lick.phrase.map(n => ({
            type: 'melody',
            note: chord.rootNote + 36 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: n.t / 3,
            // #ЗАЧЕМ: Overlap Synthesis (наслоение).
            // #ЧТО: Длительность каждой ноты увеличена в 1.6 раза.
            duration: (n.d / 3) * 1.6, 
            weight: 0.75 * (1 - this.fog * 0.15),
            technique: n.tech || 'pick',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderPianoDrops(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const beats = [1.2, 3.4]; 
        beats.forEach(beat => {
            if (this.random.next() < (0.2 * this.depth)) {
                events.push({
                    type: 'pianoAccompaniment',
                    note: chord.rootNote + 48 + [0, 7, 12][this.random.nextInt(3)],
                    time: beat,
                    duration: 1.5,
                    weight: 0.45,
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
            time: i * 0.2,
            duration: 6.0, // Глубокий overlap
            weight: 0.4,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // #ЗАЧЕМ: Enforce No-Silence.
        // #ЧТО: Гарантированный кик или том каждые 2 такта.
        const mustPlay = epoch % 2 === 0;
        
        if (mustPlay || this.random.next() < 0.4) {
            events.push({ type: 'drum_kick', note: 36, time: 0, duration: 0.1, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }

        [1.5, 3.2].forEach(t => {
            if (this.random.next() < (0.2 + tension * 0.2)) {
                const type = this.random.next() > 0.5 ? 'drum_Sonor_Classix_Low_Tom' : 'drum_bongo_pvc-tube-01';
                events.push({ type: type as any, note: 40, time: t, duration: 0.2, weight: 0.45, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
            }
        });

        if (this.random.next() < 0.15) {
            const bellIndex = calculateMusiNum(epoch, 2, this.seed, 40);
            const bellTypes = ['Bell_-_Ambient', 'Bell_-_Soft', 'Bell_-_Echo', 'Bell_-_Deep', 'Bell_-_Gong'];
            events.push({ type: `drum_${bellTypes[bellIndex % 5]}` as any, note: 60, time: this.random.next() * 4, duration: 3.0, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
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
        const notes = [root, root + (isMinor ? 3 : 4), root + 7];
        const cutoff = 1800 * (1 - Math.pow(this.fog, 1.8));

        return notes.map((n, i) => ({
            type: 'accompaniment',
            note: n,
            time: i * 0.1,
            // #ЗАЧЕМ: Overlap Synthesis.
            // #ЧТО: Длительность 8 секунд обеспечивает наслоение хвостов на следующий такт.
            duration: 8.0, 
            weight: 0.35 * (1 - this.fog * 0.2),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.5 + this.fog * 3, release: 6.0, filterCutoff: cutoff }
        }));
    }

    private renderBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = chord.rootNote - 12;
        // #ЗАЧЕМ: Постоянство баса.
        const isRiffBar = calculateMusiNum(epoch, 3, this.seed, 10) > 5;
        if (isRiffBar) {
            return [
                { type: 'bass', note: root, time: 0, duration: 3.0, weight: 0.65, technique: 'pluck', dynamics: 'p', phrasing: 'legato' },
                { type: 'bass', note: root + 7, time: 2.0, duration: 2.0, weight: 0.55, technique: 'pluck', dynamics: 'p', phrasing: 'legato' }
            ];
        }
        return [{
            type: 'bass',
            note: root,
            time: 0,
            duration: 6.0, // Overlap
            weight: 0.6,
            technique: 'drone',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.5, release: 8.0, filterCutoff: 110 + (tension * 120) }
        }];
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
