/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v2.7 — "The Playing Orchestra".
 * #ЧТО: 1. Внедрена система "Weaving Organ" для текучих арпеджио.
 *       2. Бас переведен из режима дронов в режим ритмических риффов.
 *       3. Усилена политика "No-Silence" (всегда слышны ударные и пульс).
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

        // 1. ПЭДЫ (Overlap Strategy)
        if (hints.accompaniment) {
            events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string));
        }

        // 2. БАС (Rhythmic Riffing Strategy)
        if (hints.bass) {
            events.push(...this.renderRhythmicBass(currentChord, localTension, hints.bass as string, epoch));
        }

        // 3. МЕЛОДИЯ / ПАССАЖИ
        if (hints.melody) {
            const timbre = hints.melody as string;
            // #ЗАЧЕМ: Принудительное вплетение органных арпеджио.
            if (timbre.includes('organ')) {
                events.push(...this.renderOrganArpeggio(currentChord, epoch, localTension));
            } else {
                events.push(...this.renderLegacyMelody(currentChord, epoch, localTension, hints, dna));
            }
        }

        // 4. ПИАНИНО (Drops)
        if (hints.pianoAccompaniment) {
            events.push(...this.renderPianoDrops(currentChord, epoch, localTension));
        }

        // 5. ОРКЕСТРОВАЯ ГАРМОНИЯ (Seasoning)
        if (hints.harmony && this.random.next() < 0.45) {
            events.push(...this.renderOrchestralHarmony(currentChord, epoch, hints.harmony as string));
        }

        // 6. ИСКРЫ
        if (hints.sparkles && this.random.next() < (0.3 * (1 - this.fog))) {
            events.push(this.renderSparkle(currentChord));
        }

        // 7. УДАРНЫЕ (Ambient Vitality)
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
        let currentInstructions: Partial<Record<InstrumentPart, any>> | undefined;
        const stages = navInfo.currentPart.stagedInstrumentation;

        if (stages && stages.length > 0) {
            const partBars = navInfo.currentPartEndBar - navInfo.currentPartStartBar + 1;
            const progress = (epoch - navInfo.currentStartBar || 0) / (partBars || 1);
            let acc = 0;
            for (const s of stages) { 
                acc += s.duration.percent; 
                if (progress * 100 <= acc) { currentInstructions = s.instrumentation; break; } 
            }
        } else {
            currentInstructions = navInfo.currentPart.instrumentation;
        }

        if (currentInstructions) {
            Object.entries(currentInstructions).forEach(([partStr, rule]: [any, any]) => {
                const part = partStr as InstrumentPart;
                if (!this.activatedParts.has(part)) {
                    if (this.random.next() < (rule.activationChance ?? 1.0)) {
                        this.activatedParts.add(part);
                        this.activeTimbres[part] = pickWeightedDeterministic(rule.instrumentOptions || rule.v2Options || rule.options || [], this.seed, epoch, 500);
                    }
                } else {
                    const options = rule.instrumentOptions || rule.v2Options || rule.options || [];
                    if (options.length > 0) {
                        this.activeTimbres[part] = pickWeightedDeterministic(options, this.seed, epoch, 500);
                    }
                }
            });
        }

        this.activatedParts.forEach(part => {
            if (navInfo.currentPart.layers[part]) {
                (hints as any)[part] = this.activeTimbres[part] || 'synth';
                hints.summonProgress![part] = 1.0;
            }
        });

        return hints;
    }

    /**
     * #ЗАЧЕМ: Реализация "плетения" звука через нахлест нот.
     */
    private renderOrganArpeggio(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24; 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const intervals = isMinor ? [0, 3, 7, 10, 12, 15] : [0, 4, 7, 11, 12, 16];
        
        const events: FractalEvent[] = [];
        const count = 4; // 4 ноты на такт
        const timeStep = 1.0; 

        for (let i = 0; i < count; i++) {
            const idx = calculateMusiNum(epoch + i, 3, this.seed, intervals.length);
            events.push({
                type: 'melody',
                note: Math.min(root + intervals[idx], this.MELODY_CEILING),
                time: i * timeStep,
                duration: 3.5, // Длинный хвост накрывает следующую ноту
                weight: 0.45 * tension,
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
            note: Math.min(chord.rootNote + 36 + group.registerBias + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: n.t / 3,
            duration: (n.d / 3) * 1.8, // Повышенный Overlap
            weight: 0.70 * (1 - this.fog * 0.2),
            technique: n.tech || 'pick',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    /**
     * #ЗАЧЕМ: Уход от статики в басу.
     */
    private renderRhythmicBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = Math.max(chord.rootNote - 12, 24); 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        
        // Ритмический паттерн "Abyssal Crawl"
        const pattern = [
            { t: 0, n: root, d: 1.5, w: 0.7 },
            { t: 1.5, n: root + (isMinor ? 3 : 4), d: 1.0, w: 0.5 },
            { t: 2.5, n: root + 7, d: 1.5, w: 0.6 }
        ];

        return pattern.map(p => ({
            type: 'bass',
            note: p.n,
            time: p.t,
            duration: 4.0, // Перекрытие для плотности
            weight: p.w + (tension * 0.15),
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
                    weight: 0.18, 
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
            note: n + 12, // Средний регистр
            time: i * 0.5,
            duration: 8.0, 
            weight: 0.12, 
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato'
        }));
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        
        // Кик как пульс (не бит!)
        if (epoch % 2 === 0) {
            events.push({ type: 'drum_kick', note: 36, time: 0, duration: 0.1, weight: 0.45, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }

        // Ритуальные колокола
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

        // Бонги и томы
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
            weight: 0.38,
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato' as Phrasing,
            params: { attack: 2.0, release: 6.0, filterCutoff: cutoff }
        }));
    }
}
