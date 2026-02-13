/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v1.6 — "Orchestral Presence Update".
 * #ЧТО: 1. Внедрена поддержка полноценного оркестрового рендеринга (Flute, Violin, Guitar Chords).
 *       2. Реализована манера "капельного" пианино.
 *       3. Бас переведен из режима чистого дрона в режим медленных риффов.
 *       4. Принудительное использование Dark Sparkles.
 * #СВЯЗИ: Вызывается из FractalMusicEngine.ts при genre === 'ambient'.
 */

import type { 
    FractalEvent, 
    GhostChord, 
    Mood, 
    SuiteDNA, 
    NavigationInfo,
    Technique,
    InstrumentHints,
    InstrumentPart,
    Phrasing
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
    
    // Локальные оси управления
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

        // #ЗАЧЕМ: Полноценное оркестровое присутствие.
        // #ЧТО: Рендеринг всех активных слоев.
        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string));
        }

        if (hints.bass) {
            events.push(...this.renderBass(currentChord, localTension, hints.bass as string, epoch));
        }

        if (hints.melody) {
            events.push(...this.renderLegacyMelody(currentChord, epoch, localTension, hints.melody as string));
        }

        if (hints.pianoAccompaniment) {
            events.push(...this.renderPianoDrops(currentChord, epoch, localTension));
        }

        if (hints.harmony) {
            events.push(...this.renderOrchestralHarmony(currentChord, epoch, hints.harmony as string));
        }

        if (hints.sparkles && this.random.next() < (0.2 * (1 - this.fog))) {
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

    private renderLegacyMelody(chord: GhostChord, epoch: number, tension: number, timbre: string): FractalEvent[] {
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
            weight: 0.7 * (1 - this.fog * 0.2),
            technique: n.tech || 'pick',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderPianoDrops(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // #ЗАЧЕМ: Манера "капелек" — редкие, точечные удары.
        const beats = [1.2, 3.4]; 
        beats.forEach(beat => {
            if (this.random.next() < (0.2 * this.depth)) {
                events.push({
                    type: 'pianoAccompaniment',
                    note: chord.rootNote + 48 + [0, 7, 12][this.random.nextInt(3)],
                    time: beat + (this.random.next() * 0.05),
                    duration: 0.8,
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
            time: i * 0.2,
            duration: 4.0,
            weight: 0.35,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            chordName: isMinor ? 'Am' : 'E'
        }));
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // Rare kicks
        if (epoch % 2 === 0 && this.random.next() < 0.4) {
            events.push({ type: 'drum_kick', note: 36, time: 0, duration: 0.1, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        // Toms and Bongos
        [1, 2.5, 3.8].forEach(t => {
            if (this.random.next() < (0.15 + tension * 0.2)) {
                const type = this.random.next() > 0.5 ? 'drum_Sonor_Classix_Low_Tom' : 'drum_bongo_pvc-tube-01';
                events.push({ type: type as any, note: 40, time: t, duration: 0.2, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
            }
        });
        // Bells (using the vast library)
        if (this.random.next() < 0.1) {
            const bellIndex = calculateMusiNum(epoch, 2, this.seed, 40);
            const bellTypes = ['Bell_-_Ambient', 'Bell_-_Soft', 'Bell_-_Echo', 'Bell_-_Deep'];
            events.push({ type: `drum_${bellTypes[bellIndex % 4]}` as any, note: 60, time: this.random.next() * 4, duration: 2.0, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
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
            duration: 4.0,
            weight: 0.3 * (1 - this.fog * 0.3),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.0 + this.fog * 3, release: 5.0, filterCutoff: cutoff }
        }));
    }

    private renderBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = chord.rootNote - 12;
        // #ЗАЧЕМ: Бас теперь играет медленные риффы вместо чистого дрона.
        if (calculateMusiNum(epoch, 3, this.seed, 10) > 6) {
            return [
                { type: 'bass', note: root, time: 0, duration: 2.0, weight: 0.6, technique: 'pluck', dynamics: 'p', phrasing: 'legato' },
                { type: 'bass', note: root + 7, time: 2.5, duration: 1.5, weight: 0.5, technique: 'pluck', dynamics: 'p', phrasing: 'legato' }
            ];
        }
        return [{
            type: 'bass',
            note: root,
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
            // #ЗАЧЕМ: Принудительное использование темных искр.
            params: { mood: this.mood, category: 'dark' }
        };
    }
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
