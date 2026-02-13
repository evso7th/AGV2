/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v1.8 — "The Art of Identity".
 * #ЧТО: 1. Полная дифференциация Legacy-групп (Eno, Oldfield, Mann, etc.).
 *       2. Принудительное наложение звука (Overlap Synthesis) для бесшовности.
 *       3. Автоматическое управление инструментами на основе Династии.
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

        const hints = this.orchestrate(localTension, navInfo, epoch, dna);
        const events: FractalEvent[] = [];

        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string));
        }

        if (hints.bass) {
            events.push(...this.renderBass(currentChord, localTension, hints.bass as string, epoch));
        }

        if (hints.melody) {
            events.push(...this.renderLegacyMelody(currentChord, epoch, localTension, hints, dna));
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

    private renderLegacyMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints, dna: SuiteDNA): FractalEvent[] {
        // #ЗАЧЕМ: Использование суверенной идентичности.
        const groupKey = dna.ambientLegacyGroup || 'ENO';
        const group = AMBIENT_LEGACY[groupKey];

        // #ЗАЧЕМ: Тотальная тембральная дифференциация.
        (hints as any).melody = group.preferredInstrument;

        const lickIdx = calculateMusiNum(epoch, 3, this.seed, group.licks.length);
        const lick = group.licks[lickIdx];

        return lick.phrase.map(n => ({
            type: 'melody',
            note: Math.min(chord.rootNote + 36 + group.registerBias + (DEGREE_TO_SEMITONE[n.deg] || 0), 88),
            time: n.t / 3,
            // #ЗАЧЕМ: Phrasing Identity.
            duration: (n.d / 3) * (group.phrasing === 'sparse' ? 2.5 : 1.6), 
            weight: 0.75 * (1 - this.fog * 0.15),
            technique: n.tech || 'pick',
            dynamics: 'p',
            phrasing: group.phrasing === 'staccato' ? 'staccato' : 'legato'
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
            duration: 8.0, // Глубокий overlap
            weight: 0.4,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
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
            duration: 8.0, 
            weight: 0.35 * (1 - this.fog * 0.2),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legate',
            params: { attack: 2.5 + this.fog * 3, release: 6.0, filterCutoff: cutoff }
        }));
    }

    private renderBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = chord.rootNote - 12;
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
            duration: 8.0, // Full Overlap
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
