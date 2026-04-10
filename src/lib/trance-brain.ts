
/**
 * @fileOverview Trance Brain V2.0 — "Heritage Evolution".
 * #ЗАЧЕМ: Интеграция системы Наследия (DNA/Cloud Axioms) в жанр Trance.
 * #ЧТО: ПЛАН №1013 — Реализована поддержка Анкоров, Сиблингов и Векторного поиска.
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

    // --- Trance Specific ---
    private hookPhrase: any[] = [];
    private currentSpiralShift: number = 0;
    private lastSpiralUpdateBar: number = -1;
    private soloistBusyUntilBar: number = -1;

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
        return { next, nextInt };
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
        const barsElapsed = epoch - startEpoch;
        return barsElapsed % totalBars;
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
                const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                return axGenres.includes('trance') && (axMoods.includes(this.mood) || (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter));
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
                    const idx = calculateMusiNum(this.seed, 17, epoch, basePool.length);
                    selected = basePool[idx];
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
                        const rb = decompressCompactPhrase(bassSibling.phrase);
                        this.currentBassTheme = { phrase: rb, startBar: epoch, endBar: epoch + (selected.bars || 4) };
                    }

                    const accompSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('accomp') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    accompSiblings.forEach(ax => {
                        const p = decompressCompactPhrase(ax.phrase);
                        this.currentAccompAxioms.push({ phrase: p, role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument });
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
        const events: FractalEvent[] = [];
        
        const isInitialStart = epoch < 4;
        const isIntro = navInfo.currentPart.id === 'INTRO' || isInitialStart;

        // 1. SELECT DNA
        let newBpm: number | undefined;
        if (epoch >= this.soloistBusyUntilBar && !isIntro) {
            newBpm = this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };

        // 2. MELODY / LEAD
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension);
            } else {
                melodyEvents = this.renderSpiralLead(epoch, resChord, tension);
            }
            events.push(...melodyEvents);
        }

        // 3. BASS
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
            } else {
                events.push(...this.renderNeuroBass(epoch, currentChord, tension, isIntro));
            }
        }

        // 4. ACCOMPANIMENT / PADS
        let accStatus = 'none';
        if (hints.accompaniment && !isInitialStart) {
            if (this.currentAccompAxioms.length > 0) {
                const ax = this.currentAccompAxioms[0]; // Take first available
                events.push(...this.renderHeritageAccompaniment(epoch, resChord, ax.phrase, tension));
                accStatus = 'Heritage DNA';
            } else {
                events.push(...this.renderSidechainedPad(epoch, currentChord, tension));
                accStatus = 'Sidechained Pad';
            }
        }

        // 5. PIANO / RHODES
        if (hints.pianoAccompaniment && !isInitialStart) {
            events.push(...this.renderProgressiveRhodes(epoch, currentChord, tension, melodyEvents));
        }

        // 6. DRUMS
        if (hints.drums) {
            events.push(...this.renderTranceDrums(epoch, tension, isIntro));
        }

        return {
            events, tension, beautyScore: 0.6,
            newBpm,
            activeAxioms: {
                melody: isIntro ? 'Waiting' : (this.currentTheme ? this.currentTheme.id : 'Spiral Hook'),
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Neuro Drive',
                accompaniment: accStatus,
                drums: 'Solid 4/4',
                trackName: this.currentTrackName
            },
            narrative: `Trance Flow: ${this.currentTrackName}. Energy: ${(tension * 100).toFixed(0)}%. [Chronos Mode]`
        };
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

    private renderTranceDrums(epoch: number, tension: number, isIntro: boolean): FractalEvent[] {
        const events: FractalEvent[] = [];
        [0, 3, 6, 9].forEach(t => {
            events.push({
                type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 1.0, 
                technique: 'hit', dynamics: 'f', phrasing: 'staccato'
            });
        });
        if (tension > 0.3 || !isIntro) {
            [1.5, 4.5, 7.5, 10.5].forEach(t => {
                events.push({
                    type: 'drum_open_hh_top2', note: 46, time: t * TICK_TO_BEAT, duration: 0.2, weight: 0.6 + tension * 0.2,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: 0.1
                });
            });
        }
        return events;
    }

    private renderNeuroBass(epoch: number, chord: GhostChord, tension: number, isIntro: boolean): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        [1.5, 4.5, 7.5, 10.5].forEach(t => {
            events.push({
                type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: 1.2 * TICK_TO_BEAT, weight: 0.8,
                technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
                params: { filterCutoff: 400 + tension * 600 }
            });
        });
        return events;
    }

    private renderSpiralLead(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (this.hookPhrase.length === 0) {
            const scale = [0, 3, 7, 10, 12, 14, 15];
            for (let i = 0; i < 6; i++) {
                this.hookPhrase.push({ t: i * 2, d: 1.5, deg: SEMITONE_TO_DEGREE[scale[this.random.nextInt(scale.length)]] || 'R' });
            }
        }
        if (epoch % 2 === 0 && epoch !== this.lastSpiralUpdateBar) {
            this.lastSpiralUpdateBar = epoch;
            this.currentSpiralShift = [0, 2, 4, 7, 5, 3, 0][(epoch / 2) % 7];
        }
        const swirlPan = Math.sin(epoch * 0.5) * 0.6;
        return this.hookPhrase.map(n => ({
            type: 'melody',
            note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentSpiralShift,
            time: n.t * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.65,
            technique: 'pick', dynamics: 'mf', phrasing: 'legato',
            pan: swirlPan,
            params: { filterCutoff: 1500 + tension * 3000 }
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

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'accompaniment', note: chord.rootNote + 12,
            time: 0.1, duration: 3.8, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            pan: -0.3,
            params: { attack: 0.5, release: 1.0, filterCutoff: 1000 + tension * 1000 }
        }];
    }
}
