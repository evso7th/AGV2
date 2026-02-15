/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v7.12 — "The Voice & Dark Mix Update".
 * #ЧТО: 1. Метод renderSfx больше не хардкодит категорию 'laser'.
 *       2. Реализована передача правил из блюпринта для динамического микса SFX.
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
    Phrasing,
    SfxRule
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
    private solistCutoff: number = 2000; 

    private activatedParts: Set<InstrumentPart> = new Set();
    private activeTimbres: Partial<Record<InstrumentPart, string>> = {};
    private introLotteryMap: Map<number, Partial<Record<InstrumentPart, any>>> = new Map();

    private soloistBusyUntilBar: number = -1;
    private readonly MELODY_CEILING = 75;
    private readonly BASS_FLOOR = 24; 

    private currentTheme: { phrase: any[], startBar: number, endBar: number } | null = null;

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

        if (epoch >= this.soloistBusyUntilBar) {
            const developmentChance = 0.4 + localTension * 0.4;
            if (this.random.next() < developmentChance) {
                let groupKey = dna.ambientLegacyGroup || 'BUDD';
                const group = AMBIENT_LEGACY[groupKey];
                const lickIdx = calculateMusiNum(epoch, 3, this.seed, group.licks.length);
                const lick = group.licks[lickIdx];
                const phraseTicks = Math.max(...lick.phrase.map(n => n.t + n.d));
                const phraseBars = Math.ceil((phraseTicks + 1) / 12);
                
                this.currentTheme = {
                    phrase: lick.phrase,
                    startBar: epoch,
                    endBar: epoch + phraseBars
                };
                this.soloistBusyUntilBar = epoch + phraseBars + 1;
            } else {
                this.currentTheme = null;
            }
        }

        const hints = this.orchestrate(localTension, navInfo, epoch, dna);
        const events: FractalEvent[] = [];

        hints.accompaniment = hints.accompaniment || 'synth_ambient_pad_lush';
        hints.bass = hints.bass || 'bass_jazz_warm';

        events.push(...this.renderPad(currentChord, epoch, hints.accompaniment as string));
        events.push(...this.renderRhythmicBass(currentChord, localTension, hints.bass as string, epoch));

        if (hints.melody) {
            events.push(...this.renderMelodicPadBase(currentChord, epoch, localTension));

            if (localTension > 0.6) {
                events.push(...this.renderOrganArpeggio(currentChord, epoch, localTension));
            }

            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                events.push(...this.renderThemeMelody(currentChord, epoch, localTension, hints, dna));
            }
        }

        if (hints.pianoAccompaniment) {
            events.push(...this.renderPianoDrops(currentChord, epoch, localTension));
        }

        if (hints.harmony) {
            events.push(...this.renderOrchestralHarmony(currentChord, epoch, hints, localTension));
        }

        events.push(...this.renderAmbientPercussion(epoch, localTension));

        if (hints.sparkles && this.random.next() < 0.6) {
            events.push(this.renderSparkle(currentChord));
        }

        if (hints.sfx && epoch % 12 === 0) {
            const sfxRule = navInfo.currentPart.instrumentRules?.sfx as any;
            events.push(...this.renderSfx(localTension, sfxRule));
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
            const stageIndex = Math.floor(progress * (stages?.length || 1));
            currentInstructions = this.introLotteryMap.get(Math.min(stageIndex, (stages?.length || 1) - 1));
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
                        let selected = pickWeightedDeterministic(rule.instrumentOptions || rule.v2Options || rule.options || [], this.seed, epoch, 500);
                        if (selected === 'flute') selected = 'violin';
                        this.activeTimbres[partName] = selected;
                    }
                } else if (rule.instrumentOptions?.length > 0) {
                    let selected = pickWeightedDeterministic(rule.instrumentOptions, this.seed, epoch, 500);
                    if (selected === 'flute') selected = 'violin';
                    this.activeTimbres[partName] = selected;
                }
            });
        }

        if (part.layers) {
            this.activatedParts.forEach(p => {
                if ((part.layers as any)[p]) {
                    (hints as any)[p] = this.activeTimbres[p] || 'synth';
                    hints.summonProgress![p] = 1.0;
                }
            });
            if (part.layers.pianoAccompaniment) hints.pianoAccompaniment = 'piano';
        }

        return hints;
    }

    private renderMelodicPadBase(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = Math.min(chord.rootNote + 24, this.MELODY_CEILING);
        return [{
            type: 'melody',
            note: root,
            time: 0,
            duration: 12.0,
            weight: 0.22 * (1.0 - this.fog * 0.3),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 1.5, release: 4.0, filterCutoff: this.solistCutoff }
        }];
    }

    private renderThemeMelody(chord: GhostChord, epoch: number, tension: number, hints: InstrumentHints, dna: SuiteDNA): FractalEvent[] {
        if (!this.currentTheme) return [];
        const groupKey = dna.ambientLegacyGroup || 'BUDD';
        const group = AMBIENT_LEGACY[groupKey];
        const barOffset = (epoch - this.currentTheme.startBar) * 12;
        const barNotes = this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);

        return barNotes.map(n => {
            const breathDecay = 1.0 - (n.t / 60); 
            return {
                type: 'melody',
                note: Math.min(chord.rootNote + 36 + group.registerBias + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
                time: (n.t % 12) / 3,
                duration: (n.d / 3) * 1.6, 
                weight: (0.37 * breathDecay) * (0.9 + this.random.next() * 0.2), 
                technique: n.tech || 'pick',
                dynamics: 'p',
                phrasing: 'legato',
                params: { filterCutoff: this.solistCutoff, barCount: epoch } 
            };
        });
    }

    private renderOrganArpeggio(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24; 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'dominant';
        const intervals = isMinor ? [0, 3, 7, 10, 12, 15, 19, 24] : [0, 4, 7, 11, 12, 16, 19, 24];
        const events: FractalEvent[] = [];
        
        let timeStep = 1.0; 
        let count = 4;

        if (tension > 0.75) {
            timeStep = 0.25; 
            count = 16;
        } else if (tension > 0.45) {
            timeStep = 0.5; 
            count = 8;
        }

        for (let i = 0; i < count; i++) {
            if (this.random.next() < 0.15) continue;

            const idx = calculateMusiNum(epoch + i, 3, this.seed, intervals.length);
            events.push({
                type: 'melody',
                note: Math.min(root + intervals[idx], this.MELODY_CEILING),
                time: i * timeStep,
                duration: timeStep * 1.5, 
                weight: 0.22 * tension,
                technique: 'pick',
                dynamics: 'p',
                phrasing: 'legato',
                params: { filterCutoff: this.solistCutoff }
            });
        }
        return events;
    }

    private renderRhythmicBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR); 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        
        const pattern = [
            { t: 0, n: root, d: 1.5, w: 0.85 },
            { t: 1.5, n: Math.max(root + (isMinor ? 3 : 4), this.BASS_FLOOR), d: 1.0, w: 0.65 },
            { t: 2.5, n: Math.max(root + 7, this.BASS_FLOOR), d: 1.5, w: 0.75 }
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
            params: { attack: 0.5, release: 3.0, filterCutoff: 500 }
        }));
    }

    private renderPianoDrops(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const beats = [1.2, 2.5, 3.7]; 
        beats.forEach(beat => {
            if (this.random.next() < (0.30 * this.depth)) { 
                events.push({
                    type: 'pianoAccompaniment',
                    note: Math.min(chord.rootNote + 24 + [0, 3, 7, 12][this.random.nextInt(4)], this.MELODY_CEILING),
                    time: beat,
                    duration: 3.0,
                    weight: 0.4, 
                    technique: 'hit',
                    dynamics: 'p',
                    phrasing: 'staccato'
                });
            }
        });
        return events;
    }

    private renderOrchestralHarmony(chord: GhostChord, epoch: number, hints: InstrumentHints, tension: number): FractalEvent[] {
        if (calculateMusiNum(epoch, 3, this.seed, 10) < 3) return [];

        const isHighTension = tension > 0.65;
        const isLowTension = tension < 0.45;
        if (!isHighTension && !isLowTension) return [];

        const root = chord.rootNote; 
        const timbre = isHighTension ? 'violin' : 'guitarChords';
        const notes = [root, root + 7];
        
        return notes.map((n, i) => {
            return {
                type: 'harmony',
                note: n + 12, 
                time: i * 0.5,
                duration: 12.0,
                weight: (timbre === 'violin' ? 0.15 : 0.45) * (0.8 + this.random.next() * 0.4), 
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato',
                chordName: chord.chordType === 'minor' ? 'Am' : 'E',
                params: { barCount: epoch, filterCutoff: this.solistCutoff * 0.8 }
            };
        });
    }

    private renderSparkle(chord: GhostChord): FractalEvent {
        return {
            type: 'sparkle',
            note: chord.rootNote + 48,
            time: this.random.next() * 4,
            duration: 12.0,
            weight: 0.55,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { mood: this.mood, genre: 'ambient', category: 'ambient_common' }
        };
    }

    private renderSfx(tension: number, rules?: SfxRule): FractalEvent[] {
        return [{
            type: 'sfx',
            note: 60,
            time: this.random.next() * 2,
            duration: 4.0,
            weight: 0.45 * (1 - tension), 
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { mood: this.mood, genre: 'ambient', rules }
        }];
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        
        // 1. HEARTBEAT (Kick + Tom)
        // #ОБНОВЛЕНО (ПЛАН №421): Веса снижены в 2 раза.
        const heartbeatProb = 0.55 + (tension * 0.40); 
        if (this.random.next() < heartbeatProb) {
            const firstTime = 0;
            events.push({ 
                type: 'drum_kick_reso', 
                note: 36, time: firstTime, duration: 0.1, weight: 0.47, 
                technique: 'hit', dynamics: 'p', phrasing: 'staccato' 
            });
            events.push({
                type: 'drum_Sonor_Classix_Low_Tom',
                note: 40, time: firstTime, duration: 1.0, weight: 0.42,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });

            if (tension > 0.65) {
                const secondTime = 0.33; 
                events.push({ 
                    type: 'drum_kick_reso', 
                    note: 36, time: secondTime, duration: 0.1, weight: 0.37, 
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato' 
                });
                events.push({
                    type: 'drum_Sonor_Classix_Mid_Tom',
                    note: 43, time: secondTime, duration: 0.8, weight: 0.32,
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato'
                });
            }
        }

        // 2. SOFT IRON (Ghost Hat & Wet Ride)
        // #ОБНОВЛЕНО (ПЛАН №421): Вес снижен до 0.12.
        const ironProb = 0.15 + (tension * 0.25);
        if (this.random.next() < ironProb) {
            const isRide = this.random.next() < 0.3; // 30% ride
            events.push({
                type: isRide ? 'drum_ride_wetter' : 'drum_closed_hi_hat_ghost',
                note: 60,
                time: isRide ? 2.0 : this.random.next() * 4,
                duration: 1.0,
                weight: 0.12 * (1.0 - this.fog * 0.4),
                technique: 'hit',
                dynamics: 'p',
                phrasing: 'staccato'
            });
        }

        // 3. THE RESONANCE PROTOCOL (Tubes & Perks)
        // #ОБНОВЛЕНО (ПЛАН №421): Веса снижены до 0.2 и 0.32.
        const resonanceProb = 0.35 + (this.fog * 0.55); 
        if (this.random.next() < resonanceProb) {
            if (this.random.next() < 0.4) {
                const tubeIdx = 1 + this.random.nextInt(3);
                const tubeTypes = ['drum_bongo_pvc-tube-01', 'drum_bongo_pvc-tube-02', 'drum_bongo_pvc-tube-03'];
                events.push({
                    type: tubeTypes[tubeIdx - 1] as any,
                    note: 60,
                    time: this.random.next() * 4,
                    duration: 0.5,
                    weight: 0.2 * (0.8 + this.random.next() * 0.4),
                    technique: 'hit',
                    dynamics: 'p',
                    phrasing: 'staccato'
                });
            } else {
                const perkIdx = (1 + this.random.nextInt(15)).toString().padStart(3, '0');
                events.push({
                    type: `perc-${perkIdx}` as any,
                    note: 60, 
                    time: this.random.next() * 4, 
                    duration: 4.0, 
                    weight: 0.32 * (0.7 + this.random.next() * 0.3),
                    technique: 'hit', 
                    dynamics: 'p', 
                    phrasing: 'staccato'
                });
            }
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
        this.solistCutoff = 4500 * (1 - this.fog) + 1200; 
    }

    private renderPad(chord: GhostChord, epoch: number, timbre: string): FractalEvent[] {
        const root = chord.rootNote + 12;
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        const notes = [root, root + (isMinor ? 3 : 4), root + 7];

        return notes.map((n, i) => ({
            type: 'accompaniment',
            note: n,
            time: i * 0.2,
            duration: 12.0, 
            weight: 0.38 * (0.9 + this.random.next() * 0.2),
            technique: 'swell',
            dynamics: 'p',
            phrasing: 'legato' as Phrasing,
            params: { attack: 2.0, release: 6.0, filterCutoff: this.solistCutoff * 0.7, barCount: epoch }
        }));
    }
}
