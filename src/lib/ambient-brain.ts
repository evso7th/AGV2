/**
 * #ЗАЧЕМ: Суверенный Мозг Амбиента v14.0 — "Continuous Journey Fix".
 * #ЧТО: 1. Повышена общая активность мелодии (baseChance up).
 *       2. Сокращен rest период между темами (3 -> 1).
 *       3. Снижен пропуск нот из-за тумана (skipProb penalty reduced).
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
import { calculateMusiNum, DEGREE_TO_SEMITONE, pickWeightedDeterministic, GEO_ATLAS, LIGHT_ATLAS } from './music-theory';
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
    private bright: number = 0.3;
    private solistCutoff: number = 2000; 
    private registerShift: number = 0;

    // Momentum state
    private lastFog: number = 0.3;
    private lastDepth: number = 0.4;
    private dFog: number = 0;
    private dDepth: number = 0;

    private activatedParts: Set<InstrumentPart> = new Set();
    private activeTimbres: Partial<Record<InstrumentPart, string>> = {};
    private introLotteryMap: Map<number, Partial<Record<InstrumentPart, any>>> = new Map();

    private soloistBusyUntilBar: number = -1;
    private bassBusyUntilBar: number = -1; 
    private readonly MELODY_CEILING = 75;
    private readonly BASS_FLOOR = 31; 

    private currentTheme: { phrase: any[], startBar: number, endBar: number } | null = null;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null; 

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

        const isPositive = ['joyful', 'enthusiastic', 'epic'].includes(this.mood);
        if (isPositive) {
            this.applyRadiance(epoch, dna);
        } else {
            this.applyGeography(epoch, dna);
        }

        this.applySpectralAtom(epoch, waves[3]);
        this.updateMoodAxes(epoch, localTension);

        // Compute Momentum
        this.dFog = this.fog - this.lastFog;
        this.dDepth = this.depth - this.lastDepth;
        this.lastFog = this.fog;
        this.lastDepth = this.depth;

        const yogaChord = { ...currentChord };
        if (this.mood === 'epic') yogaChord.chordType = 'dominant'; 
        else if (this.mood === 'joyful') yogaChord.chordType = 'major'; 

        if (isPositive && epoch >= this.bassBusyUntilBar) {
            if (this.currentBassTheme && this.random.next() < 0.75) {
                this.currentBassTheme.phrase = this.currentBassTheme.phrase.map(n => ({
                    ...n,
                    deg: this.random.next() < 0.25 ? ['R', '5', '4', 'b7', '2'][this.random.nextInt(5)] : n.deg
                }));
                this.currentBassTheme.startBar = epoch;
                const bars = this.currentBassTheme.endBar - this.currentBassTheme.startBar;
                this.currentBassTheme.endBar = epoch + bars;
                this.bassBusyUntilBar = epoch + bars;
            } else {
                const bars = this.random.nextInt(3) + 2; 
                const noteCount = this.random.nextInt(5) + 4; 
                const phrase: any[] = [];
                const pool = ['R', '5', '4', 'b7', '2'];
                for (let i = 0; i < noteCount; i++) {
                    phrase.push({
                        t: i * (bars * 12 / noteCount),
                        d: (bars * 12 / noteCount) * 0.85,
                        deg: pool[this.random.nextInt(pool.length)]
                    });
                }
                this.currentBassTheme = { phrase, startBar: epoch, endBar: epoch + bars };
                this.bassBusyUntilBar = epoch + bars;
            }
        }

        if (epoch >= this.soloistBusyUntilBar) {
            // #ЗАЧЕМ: Повышение активности солиста.
            const baseChance = isPositive ? 0.60 : 0.40; 
            const developmentChance = baseChance + localTension * 0.25;
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
                
                // #ЗАЧЕМ: Сокращение rest периода для плотности.
                const restBars = this.mood === 'enthusiastic' ? 0 : 1;
                this.soloistBusyUntilBar = epoch + phraseBars + restBars; 
            } else {
                this.currentTheme = null;
            }
        }

        const hints = this.orchestrate(localTension, navInfo, epoch, dna);
        const events: FractalEvent[] = [];

        hints.accompaniment = hints.accompaniment || 'synth_ambient_pad_lush';
        hints.bass = hints.bass || 'bass_jazz_warm';

        events.push(...this.renderPad(yogaChord, epoch, hints.accompaniment as string));
        
        if (isPositive && this.currentBassTheme) {
            events.push(...this.renderThemeBass(yogaChord, epoch, localTension));
        } else if (this.mood === 'anxious') {
            events.push(...this.renderRitualWalkingBass(yogaChord, localTension, hints.bass as string, epoch));
        } else {
            events.push(...this.renderRhythmicBass(yogaChord, localTension, hints.bass as string, epoch));
        }

        if (hints.melody) {
            events.push(...this.renderMelodicPadBase(yogaChord, epoch, localTension));
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                events.push(...this.renderThemeMelody(yogaChord, epoch, localTension, hints, dna));
            }
        }

        if (hints.pianoAccompaniment) {
            events.push(...this.renderPianoDrops(yogaChord, epoch, localTension));
        }

        if (hints.harmony) {
            const harmonyChance = isPositive ? 0.35 : 1.0; 
            if (this.random.next() < harmonyChance) {
                const timbre = localTension > 0.55 ? 'violin' : 'guitarChords';
                hints.harmony = timbre as any; 
                events.push(...this.renderOrchestralHarmony(yogaChord, epoch, hints, localTension));
            }
        }

        events.push(...this.renderAmbientPercussion(epoch, localTension));

        if (hints.sparkles) {
            let sparkleProb = 0.3;
            if (this.mood === 'epic') sparkleProb = 0.05;
            else if (this.mood === 'enthusiastic') sparkleProb = 0.1 + (localTension * 0.3);
            else if (this.mood === 'joyful') sparkleProb = 0.12;

            if (this.random.next() < sparkleProb) {
                events.push(this.renderSparkle(yogaChord, isPositive));
            }
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

    private applyGeography(epoch: number, dna: SuiteDNA) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        const progress = epoch / 150; 
        const stage = Math.min(2, Math.floor(progress * 3));
        const atomKey = dna.itinerary[stage];
        const atom = GEO_ATLAS[atomKey];
        if (!atom) return;

        this.fog = (this.fog + atom.fog) / 2;
        this.depth = (this.depth + atom.depth) / 2;
        this.registerShift = atom.reg;
    }

    private applyRadiance(epoch: number, dna: SuiteDNA) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        const progress = epoch / 150;
        const stage = Math.min(2, Math.floor(progress * 3));
        const atomKey = dna.itinerary[stage];
        const atom = LIGHT_ATLAS[atomKey];
        if (!atom) return;

        this.fog = (this.fog + atom.fog) / 2;
        this.depth = (this.depth + atom.depth) / 2;
        this.bright = atom.bright;
        this.registerShift = this.mood === 'joyful' ? 12 : (this.mood === 'epic' ? -12 : 0);
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
            const stageIndex = Math.floor((epoch / (navInfo.currentPartEndBar || 1)) * (stages?.length || 1));
            currentInstructions = this.introLotteryMap.get(Math.min(stageIndex, (stages?.length || 1) - 1));
        } else if (stages && stages.length > 0) {
            const progress = epoch / (navInfo.currentPartEndBar || 1);
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
        const root = Math.min(chord.rootNote + 24 + this.registerShift, this.MELODY_CEILING);
        return [{
            type: 'melody',
            note: root,
            time: 0,
            duration: 12.0,
            weight: 0.45 * (1.0 - this.fog * 0.2), 
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

        const events: FractalEvent[] = [];
        const momentum = this.dFog;

        barNotes.forEach((n, i) => {
            // #ЗАЧЕМ: Снижение штрафа за туман для стабильности мелодии.
            let skipProb = (this.fog * 0.4) * (1.0 + Math.max(0, momentum * 10));
            if (momentum < -0.01) skipProb *= 0.5;

            if (skipProb > 0.75 && i % 2 !== 0 && this.random.next() < skipProb) return;

            const phraseProgress = n.t / 48; 
            const breathDecay = 1.0 - (phraseProgress * 0.4); 

            events.push({
                type: 'melody',
                note: Math.min(chord.rootNote + 36 + group.registerBias + this.registerShift + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
                time: (n.t % 12) / 3,
                duration: (n.d / 3) * 1.6, 
                weight: (0.55 * breathDecay) * (0.9 + this.random.next() * 0.2),
                technique: n.tech || 'pick',
                dynamics: 'p',
                phrasing: momentum < -0.02 ? 'legato' : 'detached', 
                params: { filterCutoff: this.solistCutoff, barCount: epoch } 
            });
        });

        return events;
    }

    private renderThemeBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const barOffset = (epoch - this.currentBassTheme.startBar) * 12;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + 12);

        return barNotes.map(n => {
            const pitch = Math.max(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.BASS_FLOOR);
            return {
                type: 'bass',
                note: pitch,
                time: (n.t % 12) / 3,
                duration: n.d / 3,
                weight: (0.45 + (tension * 0.1)) * (0.9 + this.random.next() * 0.2),
                technique: 'pluck',
                dynamics: 'p',
                phrasing: 'legato',
                params: { attack: 0.1, release: 0.8, filterCutoff: 400 }
            };
        });
    }

    private renderRhythmicBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR); 
        const isMinor = chord.chordType === 'minor' || chord.chordType === 'diminished';
        
        const pattern = [
            { t: 0, n: root, d: 0.7, w: 0.55 },
            { t: 2.0, n: Math.max(root + (isMinor ? 3 : 4), this.BASS_FLOOR), d: 0.4, w: 0.40 },
            { t: 3.0, n: Math.max(root + 7, this.BASS_FLOOR), d: 0.7, w: 0.50 }
        ];
        
        return pattern.map(p => ({
            type: 'bass',
            note: p.n,
            time: p.t,
            duration: p.d, 
            weight: (p.w + (tension * 0.08)) * (0.95 + this.random.next() * 0.1),
            technique: 'pluck',
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 0.1, release: 0.8, filterCutoff: 400 } 
        }));
    }

    private renderRitualWalkingBass(chord: GhostChord, tension: number, timbre: string, epoch: number): FractalEvent[] {
        const root = Math.max(chord.rootNote - 12, this.BASS_FLOOR);
        const ritualPattern = [
            { t: 0, n: root, w: 0.6 },
            { t: 1.0, n: root + 7, w: 0.4 },
            { t: 1.5, n: root + 6, w: 0.5 }, 
            { t: 2.5, n: root, w: 0.45 }
        ];

        return ritualPattern.map(p => ({
            type: 'bass',
            note: p.n,
            time: p.t,
            duration: 0.4,
            weight: p.w * (0.9 + this.random.next() * 0.2),
            technique: 'pluck',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { attack: 0.05, release: 0.4, filterCutoff: 400 }
        }));
    }

    private renderPianoDrops(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const momentum = Math.max(0, this.dDepth * 5);
        const beats = [1.2, 2.5, 3.7]; 
        beats.forEach(beat => {
            if (this.random.next() < (0.25 * this.depth + momentum)) { 
                events.push({
                    type: 'pianoAccompaniment',
                    note: Math.min(chord.rootNote + 24 + this.registerShift + [0, 3, 7, 12][this.random.nextInt(4)], this.MELODY_CEILING),
                    time: beat,
                    duration: 1.5, 
                    weight: 0.25, 
                    technique: 'hit',
                    dynamics: 'p',
                    phrasing: 'staccato'
                });
            }
        });
        return events;
    }

    private renderOrchestralHarmony(chord: GhostChord, epoch: number, hints: InstrumentHints, tension: number): FractalEvent[] {
        const root = chord.rootNote; 
        const timbre = (hints.harmony as string) || (tension > 0.55 ? 'violin' : 'guitarChords');
        const notes = [root, root + 7];
        
        return notes.map((n, i) => {
            return {
                type: 'harmony',
                note: n + 12 + this.registerShift, 
                time: i * 0.5,
                duration: 8.0,
                weight: (timbre === 'violin' ? 0.08 : 0.15) * (0.8 + this.random.next() * 0.4), 
                technique: 'swell',
                dynamics: 'p',
                phrasing: 'legato',
                chordName: chord.chordType === 'minor' ? 'Am' : 'E',
                params: { barCount: epoch, filterCutoff: this.solistCutoff * 0.8 }
            };
        });
    }

    private renderSparkle(chord: GhostChord, isPositive: boolean): FractalEvent {
        const duration = this.mood === 'joyful' ? 12.0 : 6.0;
        return {
            type: 'sparkle',
            note: chord.rootNote + 48 + this.registerShift,
            time: this.random.next() * 4,
            duration,
            weight: 0.45, 
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { mood: this.mood, genre: 'ambient', category: isPositive ? 'light' : 'ambient_common' }
        };
    }

    private renderSfx(tension: number, rules?: SfxRule): FractalEvent[] {
        return [{
            type: 'sfx',
            note: 60,
            time: this.random.next() * 2,
            duration: 4.0,
            weight: 0.35 * (1 - tension), 
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'staccato',
            params: { mood: this.mood, genre: 'ambient', rules }
        }];
    }

    private renderAmbientPercussion(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        
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

        const ironProb = 0.15 + (tension * 0.25);
        if (this.random.next() < ironProb) {
            const isRide = this.random.next() < 0.3; 
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

        const resonanceProb = 0.35 + (this.fog * 0.55); 
        if (this.random.next() < resonanceProb) {
            const tubeTypes = ['drum_bongo_pvc-tube-01', 'drum_bongo_pvc-tube-02', 'drum_bongo_pvc-tube-03'];
            events.push({
                type: tubeTypes[this.random.nextInt(3)] as any,
                note: 60,
                time: this.random.next() * 4,
                duration: 0.5,
                weight: 0.2 * (0.8 + this.random.next() * 0.4),
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
        
        const isPositive = ['joyful', 'enthusiastic', 'epic'].includes(this.mood);
        const dazzle = (isPositive && tension > 0.85) ? 1.0 : 0;
        
        const maxCutoff = isPositive ? 6500 : (this.mood === 'anxious' ? 3500 : 5300);
        this.solistCutoff = (maxCutoff * (1 - this.fog * 0.7) + 1500) * (1.0 + dazzle * 0.5); 
    }

    private renderPad(chord: GhostChord, epoch: number, timbre: string): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift;
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
            phrasing: 'legato',
            params: { attack: 2.0, release: 6.0, filterCutoff: this.solistCutoff * 0.7, barCount: epoch }
        }));
    }
}