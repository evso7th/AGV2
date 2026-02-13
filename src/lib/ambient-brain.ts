/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v2.9 — "Stability & Overlap".
 * #ЧТО: 1. Исправлена критическая ошибка доступа к неопределенным слоям.
 *       2. Усилена логика наслоения (Overlap) для создания бесшовной текстуры.
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
    private usedLickIndices: Map<string, number[]> = new Map();
    private introLotteryMap: Map<number, Partial<Record<InstrumentPart, any>>> = new Map();

    private readonly MELODY_CEILING = 73;

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
        const shuffle = <T>(array: T[]): T[] => {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(next() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };
        return { next, nextInt: (max: number) => Math.floor(next() * max), shuffle };
    }

    private performIntroLottery(stages: any[]) {
        console.log('%c[AmbientBrain] INITIALIZING INTRO LOTTERY...', 'color: #FFD700; font-weight: bold;');
        const allParticipants: { part: InstrumentPart, rule: any }[] = [];
        
        stages.forEach(s => {
            if (s.instrumentation) {
                Object.entries(s.instrumentation).forEach(([part, rule]) => {
                    allParticipants.push({ part: part as InstrumentPart, rule });
                });
            }
        });

        const shuffled = this.random.shuffle(allParticipants);
        const stageSize = Math.ceil(shuffled.length / (stages.length || 1));

        stages.forEach((_, i) => {
            const chunk = shuffled.slice(i * stageSize, (i + 1) * stageSize);
            const stageInstr: Partial<Record<InstrumentPart, any>> = {};
            chunk.forEach(p => { stageInstr[p.part] = p.rule; });
            this.introLotteryMap.set(i, stageInstr);
        });
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
            events.push(...this.renderRhythmicBass(currentChord, localTension, hints.bass as string, epoch));
        }

        if (hints.melody) {
            const timbre = hints.melody as string;
            if (timbre.includes('organ')) {
                events.push(...this.renderOrganArpeggio(currentChord, epoch, localTension));
            } else {
                events.push(...this.renderLegacyMelody(currentChord, epoch, localTension, hints, dna));
            }
        }

        if (hints.pianoAccompaniment) {
            events.push(...this.renderPianoDrops(currentChord, epoch, localTension));
        }

        if (hints.harmony && this.random.next() < 0.45) {
            events.push(...this.renderOrchestralHarmony(currentChord, epoch, hints.harmony as string));
        }

        if (hints.sparkles && this.random.next() < (0.3 * (1 - this.fog))) {
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
        const part = navInfo.currentPart;
        const stages = part.stagedInstrumentation;

        if (part.id === 'INTRO' && stages && stages.length > 0 && this.introLotteryMap.size === 0) {
            this.performIntroLottery(stages);
        }

        let currentInstructions: Partial<Record<InstrumentPart, any>> | undefined;

        if (part.id === 'INTRO' && this.introLotteryMap.size > 0) {
            const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
            const progress = (epoch - navInfo.currentPartStartBar) / (partBars || 1);
            const stageIndex = Math.floor(progress * stages!.length);
            currentInstructions = this.introLotteryMap.get(Math.min(stageIndex, stages!.length - 1));
        } else if (stages && stages.length > 0) {
            const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
            const progress = (epoch - navInfo.currentPartStartBar) / (partBars || 1);
            let acc = 0;
            for (const s of stages) { 
                acc += s.duration.percent; 
                if (progress * 100 <= acc) { currentInstructions = s.instrumentation; break; } 
            }
        } else {
            currentInstructions = part.instrumentation;
        }

        if (currentInstructions) {
            Object.entries(currentInstructions).forEach(([partStr, rule]: [any, any]) => {
                const partName = partStr as InstrumentPart;
                if (!this.activatedParts.has(partName)) {
                    if (this.random.next() < (rule.activationChance ?? 1.0)) {
                        this.activatedParts.add(partName);
                        this.activeTimbres[partName] = pickWeightedDeterministic(rule.instrumentOptions || rule.v2Options || rule.options || [], this.seed, epoch, 500);
                    }
                } else if (rule.instrumentOptions?.length > 0) {
                    this.activeTimbres[partName] = pickWeightedDeterministic(rule.instrumentOptions, this.seed, epoch, 500);
                }
            });
        }

        // #ЗАЧЕМ: Защита от краха при обращении к отсутствующим слоям в БП.
        this.activatedParts.forEach(p => {
            if (part.layers && (part.layers as any)[p]) {
                (hints as any)[p] = this.activeTimbres[p] || 'synth';
                hints.summonProgress![p] = 1.0;
            }
        });

        return hints;
    }

    private renderLegacyMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints, dna: SuiteDNA): FractalEvent[] {
        const groupKey = dna.ambientLegacyGroup || 'ENO';
        const group = AMBIENT_LEGACY[groupKey];
        (hints as any).melody = group.preferredInstrument;

        if (!this.usedLickIndices.has(groupKey)) this.usedLickIndices.set(groupKey, []);
        const used = this.usedLickIndices.get(groupKey)!;

        let lickIdx = calculateMusiNum(epoch, 3, this.seed, group.licks.length);
        if (used.length < group.licks.length) {
            while (used.includes(lickIdx)) {
                lickIdx = (lickIdx + 1) % group.licks.length;
            }
            used.push(lickIdx);
        } else {
            used.splice(0, Math.floor(used.length / 2));
        }

        const lick = group.licks[lickIdx];

        return lick.phrase.map(n => ({
            type: 'melody',
            note: Math.min(chord.rootNote + 36 + group.registerBias + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: n.t / 3,
            duration: (n.d / 3) * 1.6, 
            weight: (0.75 * (1 - this.fog * 0.2)) * (0.9 + this.random.next() * 0.2),
            technique: n.tech || 'pick',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderOrganArpeggio(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24; 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'dominant';
        const intervals = isMinor ? [0, 3, 7, 10, 12, 15] : [0, 4, 7, 11, 12, 16];
        
        const events: FractalEvent[] = [];
        const count = 4;
        const timeStep = 1.0; 

        for (let i = 0; i < count; i++) {
            const idx = calculateMusiNum(epoch + i, 3, this.seed, intervals.length);
            events.push({
                type: 'melody',
                note: Math.min(root + intervals[idx], this.MELODY_CEILING),
                time: i * timeStep,
                duration: 3.5,
                weight: 0.45 * tension * (0.9 + this.random.next() * 0.2),
                technique: 'pick',
                dynamics: 'p',
                phrasing: 'legato'
            });
        }
        return events;
    }

    private renderRhythmicBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = Math.max(chord.rootNote - 12, 24); 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        
        const pattern = [
            { t: 0, n: root, d: 1.5, w: 0.7 },
            { t: 1.5, n: root + (isMinor ? 3 : 4), d: 1.0, w: 0.5 },
            { t: 2.5, n: root + 7, d: 1.5, w: 0.6 }
        ];

        return pattern.map(p => ({
            type: 'bass',
            note: p.n,
            time: p.t,
            duration: 4.0,
            weight: (p.w + (tension * 0.15)) * (0.95 + this.random.next() * 0.1),
            technique: 'pluck',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 0.5, release: 3.0 }
        }));
    }

    private renderPianoDrops(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const beats = [1.2, 2.5, 3.7]; 
        beats.forEach(beat => {
            if (this.random.next() < (0.15 * this.depth)) {
                events.push({
                    type: 'pianoAccompaniment',
                    note: Math.min(chord.rootNote + 12 + [0, 3, 7, 12][this.random.nextInt(4)], 60),
                    time: beat,
                    duration: 3.0,
                    weight: 0.15, 
                    technique: 'hit',
                    dynamics: 'p',
                    phrasing: 'staccato'
                });
            }
        });
        return events;
    }

    private renderOrchestralHarmony(chord: GhostChord, epoch: number, timbre: string): FractalEvent[] {
        const root = chord.rootNote; 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const notes = [root + (isMinor ? 3 : 4), root + 7];
        
        return notes.map((n, i) => ({
            type: 'harmony',
            note: n + 12, 
            time: i * 0.5,
            duration: 8.0, 
            weight: 0.12 * (0.8 + this.random.next() * 0.4), 
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderSparkle(chord: GhostChord): FractalEvent {
        return {
            type: 'sparkle',
            note: chord.rootNote + 48,
            time: this.random.next() * 4,
            duration: 12.0,
            weight: 0.3,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { mood: this.mood, genre: 'ambient', category: 'dark' }
        };
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (epoch % 2 === 0) {
            events.push({ type: 'drum_kick', note: 36, time: 0, duration: 0.1, weight: 0.45, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        if (this.random.next() < (0.2 + tension * 0.1)) {
            const bellIndex = calculateMusiNum(epoch, 3, this.seed, 40);
            const bellTypes = ['Bell_-_Ambient', 'Bell_-_Echo', 'Bell_-_Deep', 'Bell_-_Gong', 'Bell_-_Soft', 'Bell_-_Astro'];
            events.push({ 
                type: `drum_${bellTypes[bellIndex % 6]}` as any, 
                note: 60, 
                time: this.random.next() * 4, 
                duration: 6.0, 
                weight: 0.35, 
                technique: 'hit', 
                dynamics: 'p', 
                phrasing: 'staccato' 
            });
        }
        if (this.random.next() < 0.3) {
            events.push({ type: 'drum_Sonor_Classix_Low_Tom', note: 40, time: 2.5, duration: 0.5, weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        return events;
    }

    private applySpectralAtom(epoch: number, t3: number) {
        const atomKeys = Object.keys(SPECTRAL_ATOMS);
        const normalizedT3 = (t3 + 1.5) / 3.0;
        const safeIdx = Math.floor(Math.max(0, Math.min(0.999, normalizedT3)) * atomKeys.length);
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
        this.fog = Math.max(0, Math.min(1, 0.3 + (tension * 0.55))); 
        this.depth = Math.max(0, Math.min(1, 0.4 + (tension * 0.45)));
        this.pulse = Math.max(0, Math.min(1, 0.15 + (tension * 0.35)));
    }

    private renderPad(chord: GhostChord, epoch: number, timbre: string): FractalEvent[] {
        const root = chord.rootNote + 12;
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const notes = [root, root + (isMinor ? 3 : 4), root + 7];
        const cutoff = 1600 * (1 - Math.pow(this.fog, 1.5));

        return notes.map((n, i) => ({
            type: 'accompaniment',
            note: n,
            time: i * 0.2,
            duration: 8.0, 
            weight: 0.38 * (0.9 + this.random.next() * 0.2),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato' as Phrasing,
            params: { attack: 2.0, release: 6.0, filterCutoff: cutoff }
        }));
    }
}
