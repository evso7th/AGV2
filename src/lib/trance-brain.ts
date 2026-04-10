
/**
 * @fileOverview Trance Brain V2.5 — "The Spiral Intelligence".
 * #ЗАЧЕМ: Интеграция фрактальных ритмов и адаптивных матриц Маркова.
 * #ЧТО: ПЛАН №1014 — Внедрен вечный спиральный протокол для Neuro F-Matrix.
 * #FIX: normalizeStr import error fixed.
 */

import type {
    FractalEvent,
    GhostChord,
    Mood,
    SuiteDNA,
    NavigationInfo,
    InstrumentHints,
    InstrumentPart,
    Genre,
    CommonMood,
    Technique
} from '@/types/music';
import {
    calculateMusiNum,
    DEGREE_TO_SEMITONE,
    SEMITONE_TO_DEGREE,
    normalizePhraseGroup,
    decompressCompactPhrase,
    resolveSemanticTimbre,
    mergeIdenticalNotes,
    keyToMidiRoot,
    normalizeStr,
    TICKS_PER_BAR,
    TICK_TO_BEAT
} from './music-theory';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

// ───── MARKOV SPIRAL DEFINITIONS ─────
const MARKOV_BASE = [
  // 0  1  2  3  4  5  6  7  8  9  10 11 12 (scale degrees)
  [40, 5, 15, 10, 5,  10, 5, 15, 3,  5, 8,  3, 20], // from root
  [15, 30, 10, 5,  15, 5,  10, 5,  8,  3, 5,  8, 10],
  [10, 5,  30, 15, 5,  10, 5,  20, 3,  10, 10, 5, 15],
  [10, 5,  10, 30, 15, 5,  10, 5,  5,  8,  15, 3, 10],
  [5,  10, 10, 15, 30, 15, 5,  10, 5,  8,  5,  10, 15],
  [10, 5,  10, 5,  10, 30, 15, 10, 5,  10, 8,  5, 15],
  [5,  10, 5,  10, 5,  15, 30, 10, 15, 5,  10, 5, 10],
  [15, 5,  20, 5,  10, 5,  10, 30, 5,  10, 15, 5, 20],
  [5,  8,  5,  8,  5,  10, 15, 5,  25, 10, 5,  8, 10],
  [5,  3,  10, 8,  8,  5,  5,  10, 10, 25, 10, 15, 10],
  [8,  5,  10, 15, 5,  8,  10, 5,  5,  10, 25, 15, 15],
  [3,  8,  5,  3,  10, 5,  5,  5,  8,  15, 15, 25, 15],
  [20, 5,  15, 10, 5,  10, 5,  20, 3,  5,  8,  3, 40]  // from octave
];

export class TranceBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    // --- Heritage State ---
    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id?: string, preferredInstrument?: string }[] = [];
    private currentTrackName: string = 'Algorithmic';
    private currentNativeRoot: number | null = null;
    private usedThemeHistory: string[] = [];

    // --- Spiral State ---
    private prevDegree: number = 0;
    private soloistBusyUntilBar: number = -1;
    private phraseArc: number = 0; 

    constructor(seed: number, mood: Mood, genre: Genre, useHeritage: boolean = true) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.useHeritage = useHeritage;
        this.random = this.createSeededRandom(seed);
    }

    private createSeededRandom(seed: number) {
        let state = seed;
        const next = () => {
            state = (state * 1664525 + 1013904223) % Math.pow(2, 32);
            return state / Math.pow(2, 32);
        };
        const nextInt = (max: number) => Math.floor(next() * max);
        const chance = (p: number) => next() < p / 100;
        const weightedPick = <T>(items: T[], weights: number[]): T => {
            const total = weights.reduce((a, b) => a + b, 0);
            let r = next() * total;
            for (let i = 0; i < items.length; i++) {
                r -= weights[i];
                if (r <= 0) return items[i];
            }
            return items[items.length - 1];
        };
        return { next, nextInt, chance, weightedPick };
    }

    private updatePhraseArc(epoch: number): number {
        // 8-bar evolution arc: 0 -> 1 -> 0
        const cycle = epoch % 8;
        const raw = Math.sin((cycle / 8) * Math.PI);
        return Math.max(0, Math.min(1, raw + (this.random.next() - 0.5) * 0.1));
    }

    private adaptMatrixForTension(baseRow: number[], tension: number): number[] {
        const row = [...baseRow];
        const boost = tension * 0.5;
        // High Tension: encourage jumps and dissonances (b2, #4, b7)
        row[1] += boost * 10; row[6] += boost * 15; row[10] += boost * 10;
        // Low Tension: gravity towards root and octave
        if (tension < 0.4) { row[0] += 20; row[12] += 20; }
        return row;
    }

    private generateFractalRhythm(subdivision: number): number[] {
        const grid: number[] = [];
        const maxTicks = TICKS_PER_BAR;
        for (let t = 0; t < maxTicks; t++) {
            const level = Math.log2(TICKS_PER_BAR / (t % 3 === 0 ? 3 : (t % 1.5 === 0 ? 1.5 : 1)));
            const prob = 0.8 * Math.pow(0.5, level);
            if (this.random.chance(prob * 100)) grid.push(t);
        }
        if (!grid.includes(0)) grid.unshift(0);
        return grid.sort((a, b) => a - b);
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean, isImprovising?: boolean) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        if (this.isImprovising) {
            return calculateMusiNum(epoch, 13, this.seed, totalBars);
        }
        return (epoch - startEpoch) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = [];
        this.currentNativeRoot = null;
        this.currentBassTheme = null;
        
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        const targetAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : null;
        
        let filteredPool: any[] = [];
        if (targetAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === targetAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood];
            filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return axGenres.includes('trance') && (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter);
            });
        }

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const suitePlayhead = epoch % (maxDonorBars || 144);
                let selected: any = null;

                if (this.isImprovising) {
                    selected = basePool[calculateMusiNum(this.seed, 17, epoch, basePool.length)];
                } else {
                    const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === (suitePlayhead % maxDonorBars));
                    selected = sameOffsetPool.length > 0 ? sameOffsetPool[0] : basePool[0];
                }

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    
                    let rawPhrase = decompressCompactPhrase(selected.phrase);
                    if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);

                    const cid = normalizeStr(selected.compositionId);
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4) };
                    }

                    const accompSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('accomp') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    accompSiblings.forEach(ax => {
                        this.currentAccompAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument });
                    });

                    const baseBars = selected.bars || 4;
                    this.currentThemeMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { phrase: rawPhrase, startBar: epoch, endBar: epoch + baseBars, id: selected.id };
                    this.soloistBusyUntilBar = epoch + baseBars;
                    return selected.nativeBpm || undefined;
                }
            }
        }
        return undefined;
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string, newBpm?: number } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        this.phraseArc = this.updatePhraseArc(epoch);
        const events: FractalEvent[] = [];
        
        const isIntro = navInfo.currentPart.id === 'INTRO' || epoch < 4;

        if (epoch >= this.soloistBusyUntilBar && !isIntro) {
            const nb = this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };

        // 1. NEURO DRUMS (Fractal Hats)
        if (hints.drums) events.push(...this.renderTranceDrums(epoch, tension));

        // 2. SPIRAL BASS (Markov Assisted)
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
            } else {
                events.push(...this.renderNeuroBass(epoch, currentChord, tension, isIntro));
            }
        }

        // 3. SPIRAL LEAD (Arc-phrased)
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension);
            } else {
                melodyEvents = this.renderSpiralLead(epoch, resChord, tension);
            }
            events.push(...melodyEvents);
        }

        // 4. DYNAMIC PADS (Sidechained)
        if (hints.accompaniment && epoch >= 4) {
            if (this.currentAccompAxioms.length > 0) {
                events.push(...this.renderHeritageAccompaniment(epoch, resChord, this.currentAccompAxioms[0].phrase, tension));
            } else {
                events.push(...this.renderSidechainedPad(epoch, currentChord, tension));
            }
        }

        if (hints.pianoAccompaniment && !isIntro) {
            events.push(...this.renderProgressiveRhodes(epoch, currentChord, tension, melodyEvents));
        }

        return {
            events, tension, beautyScore: 0.7,
            activeAxioms: {
                melody: isIntro ? 'Waiting' : (this.currentTheme ? this.currentTheme.id : 'Spiral Lead'),
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Neuro Rolling',
                drums: 'Fractal Grid',
                trackName: this.currentTrackName
            },
            narrative: `Neuro F-Matrix: Spiral Protocol Active. Arc: ${(this.phraseArc * 100).toFixed(0)}%. [Chronos Mode]`
        };
    }

    private renderTranceDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // Solid Kick 4/4
        [0, 3, 6, 9].forEach(t => {
            events.push({
                type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 1.0, 
                technique: 'hit', dynamics: 'f', phrasing: 'staccato'
            });
        });

        // Fractal Hats
        const rhythm = this.generateFractalRhythm(4);
        rhythm.forEach(t => {
            if (t % 3 !== 0) { // Avoid kick beats for clean off-beats
                const vel = 0.4 + this.random.next() * 0.3 + (tension * 0.2);
                events.push({
                    type: 'drum_hat', note: 42, time: t * TICK_TO_BEAT, duration: 0.05, weight: vel,
                    technique: 'hit', dynamics: 'mf', phrasing: 'detached', pan: 0.1
                });
            }
        });

        // Snare/Clap on 3 and 9
        if (tension > 0.4) {
            [3, 9].forEach(t => {
                events.push({
                    type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.8,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: -0.1
                });
            });
        }

        return events;
    }

    private renderNeuroBass(epoch: number, chord: GhostChord, tension: number, isIntro: boolean): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        
        // Markov Step
        const scale = [0, 3, 5, 7, 10, 12];
        const weights = this.adaptMatrixForTension(MARKOV_BASE[this.prevDegree % 13], tension);
        const nextDeg = this.random.weightedPick(scale, weights.slice(0, scale.length));
        this.prevDegree = nextDeg;

        // Rolling 1/16 pattern
        [1.5, 4.5, 7.5, 10.5].forEach(t => {
            events.push({
                type: 'bass', note: root + nextDeg, time: t * TICK_TO_BEAT, duration: 1.2 * TICK_TO_BEAT, weight: 0.85,
                technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
                params: { filterCutoff: 400 + tension * 800 }
            });
        });

        return events;
    }

    private renderSpiralLead(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12;
        const scale = [0, 2, 3, 5, 7, 8, 10, 12];
        
        // PHRASE ARC CONTROL: Density and Register
        const density = this.phraseArc < 0.3 ? 0.4 : (this.phraseArc > 0.8 ? 0.3 : 0.7);
        if (this.random.chance((1 - this.phraseArc) * 30)) return [];

        const rhythm = this.generateFractalRhythm(8);
        let lastDeg = this.prevDegree;

        rhythm.forEach(t => {
            if (this.random.chance(density * 100)) {
                const weights = this.adaptMatrixForTension(MARKOV_BASE[lastDeg % 13], tension);
                const deg = this.random.weightedPick(scale, weights.slice(0, scale.length));
                
                events.push({
                    type: 'melody',
                    note: root + deg + (this.phraseArc > 0.7 ? 12 : 0),
                    time: t * TICK_TO_BEAT,
                    duration: 0.3,
                    weight: 0.6 + tension * 0.3,
                    technique: 'pick', dynamics: 'mf', phrasing: 'legato',
                    pan: Math.sin(epoch + t) * 0.6,
                    params: { filterCutoff: 2000 + tension * 3000 }
                });
                lastDeg = deg;
            }
        });

        return events;
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const isMinor = chord.chordType === 'minor';
        const intervals = isMinor ? [0, 3, 7, 10] : [0, 4, 7, 11];
        
        return intervals.map((interval, i) => ({
            type: 'accompaniment',
            note: chord.rootNote + 12 + interval,
            time: 0.1,
            duration: 3.8,
            weight: 0.4 - (i * 0.05),
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            pan: i % 2 === 0 ? -0.4 : 0.4,
            params: { 
                attack: 0.5, 
                release: 1.0, 
                gainCurve: [1.0, 0.4, 0.8, 0.5, 0.9, 0.6, 1.0], // Sidechain effect
                filterCutoff: 1000 + tension * 1000 
            }
        }));
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'melody',
            note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), 84),
            time: (n.t - barOffset) * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.7,
            technique: 'pick', dynamics: 'mf', phrasing: 'legato',
            params: { filterCutoff: 2000 + tension * 3000 }
        }));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'bass',
            note: chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.85,
            technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
            params: { filterCutoff: 400 + tension * 800 }
        }));
    }

    private renderHeritageAccompaniment(epoch: number, chord: GhostChord, phrase: any[], tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'accompaniment',
            note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.4,
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 0.5, release: 1.0, filterCutoff: 1200 + tension * 1000 }
        }));
    }

    private renderProgressiveRhodes(epoch: number, chord: GhostChord, tension: number, leadEvents: FractalEvent[]): FractalEvent[] {
        const events: FractalEvent[] = [];
        [0, 6].forEach(t => {
            events.push({
                type: 'pianoAccompaniment', note: chord.rootNote + 12,
                time: t * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.4,
                technique: 'hit', dynamics: 'p', phrasing: 'legato', pan: 0.2,
                params: { release: 3.0 }
            });
        });
        return events;
    }
}
