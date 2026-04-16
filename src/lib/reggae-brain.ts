
/**
 * @fileOverview Reggae Brain V2.2 — "Sovereign Anchor Protocol".
 * #ЗАЧЕМ: Фиксация трека-донора на всю длительность пьесы (ПЛАН №1105).
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
import { DRUM_KITS } from './assets/drum-kits';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

export class ReggaeBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; // #ЗАЧЕМ: ПЛАН №1105. Фиксация трека на сессию.
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
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
            return calculateMusiNum(epoch, 7, this.seed, totalBars);
        }
        return (epoch - startEpoch) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = [];
        this.currentBassTheme = null;
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;
        
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        
        // #ЗАЧЕМ: ПЛАН №1105. Определение эффективного Якоря на сессию.
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood];
            filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return axGenres.includes('reggae') && (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter);
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
                    // #ЗАЧЕМ: ПЛАН №1105. В режиме импровизации фиксируем трек при первом выборе.
                    if (!effectiveAnchor) {
                        const firstSelection = basePool[calculateMusiNum(this.seed, 11, 0, basePool.length)];
                        this.sessionAnchorId = normalizeStr(firstSelection.compositionId);
                        effectiveAnchor = this.sessionAnchorId;
                        filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                        basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                    }
                    selected = basePool[calculateMusiNum(this.seed, 13, epoch, basePool.length)];
                } else {
                    const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === (suitePlayhead % (maxDonorBars || 1)));
                    selected = sameOffsetPool.length > 0 ? sameOffsetPool[0] : basePool[0];
                }

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    
                    let rawPhrase = decompressCompactPhrase(selected.phrase);
                    if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);

                    const cid = normalizeStr(selected.compositionId);
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };
                    }

                    const accompSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('accomp') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    accompSiblings.forEach(ax => {
                        this.currentAccompAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument });
                    });

                    const baseBars = selected.bars || 4;
                    this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { phrase: rawPhrase, startBar: epoch, endBar: epoch + baseBars, id: selected.id };
                    this.soloistBusyUntilBar = epoch + baseBars;
                    return selected.nativeBpm || undefined;
                }
            }
        }
        this.currentTrackName = 'Algorithmic';
        return undefined;
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, trackName?: string, activeAxioms?: any, narrative?: string, instrumentOverrides?: Partial<InstrumentHints> } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const events: FractalEvent[] = [];
        const isIntro = navInfo.currentPart.id === 'INTRO' || epoch < 4;

        if (epoch >= this.soloistBusyUntilBar && !isIntro) {
            this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const instrumentOverrides: Partial<InstrumentHints> = {};

        if (hints.drums) events.push(...this.renderOneDropDrums(epoch, tension));

        let activeBassAxiom = 'Roots Syncopation';
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
                activeBassAxiom = `DNA: ${this.currentBassTheme.id}`;
            } else {
                events.push(...this.renderRootsBass(epoch, resChord, tension));
            }
        }

        let activeAccAxiom = 'none';
        if (hints.accompaniment && !isIntro) {
            if (this.random.next() < 0.15) {
                const skankEvents = this.renderTheSkank(epoch, resChord, tension);
                events.push(...skankEvents);
                activeAccAxiom = 'Rare Skank Accent';
            }
            instrumentOverrides.accompaniment = 'reggae_organ';
        }

        let melEvents: FractalEvent[] = [];
        let activeMelAxiom = isIntro ? 'Waiting' : 'Tuff Gong Solo';
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melEvents = this.renderHeritageMelody(epoch, resChord, tension);
                activeMelAxiom = `DNA: ${this.currentTheme.id}`;
            } else {
                melEvents = this.renderLyricalSolo(epoch, resChord, tension);
            }
            events.push(...melEvents);
            instrumentOverrides.melody = 'reggae_guitar';
        }

        if (hints.pianoAccompaniment && !isIntro) {
            events.push(...this.renderBubbling(epoch, resChord, tension));
        }

        return {
            events, tension, beautyScore: 0.85,
            trackName: this.currentTrackName,
            instrumentOverrides,
            activeAxioms: {
                melody: activeMelAxiom,
                bass: activeBassAxiom,
                drums: tension > 0.7 ? 'Steppers' : 'One-Drop',
                accompaniment: activeAccAxiom,
                piano: 'Bubbling'
            },
            narrative: `Reggae Roots: [DNA: ${this.currentTrackName}] [Riddim: ${tension > 0.7 ? 'Steppers' : 'One-Drop'}] [Skank: Rare]`
        };
    }

    private renderOneDropDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isSteppers = tension > 0.75;

        if (!isSteppers) {
            events.push({
                type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0,
                technique: 'hit', dynamics: 'f', phrasing: 'staccato'
            });
            events.push({
                type: 'drum_snare', note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9,
                technique: 'hit', dynamics: 'f', phrasing: 'staccato', pan: -0.1
            });
        } else {
            [0, 3, 6, 9].forEach(t => {
                events.push({
                    type: 'drum_kick_reso', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.9,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
            events.push({
                type: 'drum_snare', note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0,
                technique: 'hit', dynamics: 'f', phrasing: 'staccato', pan: -0.1
            });
        }

        [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].forEach(t => {
            const isOff = t % 3 !== 0;
            events.push({
                type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, 
                duration: 0.1, weight: isOff ? 0.7 : 0.4,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.1
            });
        });

        return events;
    }

    private renderRootsBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        
        const patterns = [
            [1.5, 4.5, 7.5, 10.5],
            [0, 1.5, 6, 7.5],
            [3, 4.5, 9, 10.5],
        ];
        
        const activePattern = patterns[calculateMusiNum(epoch, 7, this.seed, patterns.length)];
        
        activePattern.forEach((t, i) => {
            const note = i === 0 ? root : root + [0, 7, 5, 3][calculateMusiNum(epoch + i, 11, this.seed, 4)];
            events.push({
                type: 'bass', note, time: t * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 1.0,
                technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
                params: { filterCutoff: 300 + tension * 400 }
            });
        });

        return events;
    }

    private renderTheSkank(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12;
        
        [3, 9].forEach(t => {
            events.push({
                type: 'accompaniment', note: root, time: t * TICK_TO_BEAT, duration: 0.2, weight: 0.6,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.3
            });
        });

        return events;
    }

    private renderBubbling(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12;
        
        [4, 5, 10, 11].forEach(t => {
            if (this.random.next() < 0.7) {
                events.push({
                    type: 'pianoAccompaniment', note: root + 12, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.3,
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: -0.2
                });
            }
        });

        return events;
    }

    private renderLyricalSolo(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (epoch % 2 === 0) return []; 
        
        const root = chord.rootNote + 12;
        const scale = [0, 2, 3, 5, 7, 9, 10]; 
        
        [0, 3, 6, 9].forEach(t => {
            if (this.random.next() < 0.4) {
                const note = root + scale[this.random.nextInt(scale.length)];
                events.push({
                    type: 'melody', note, time: (t + 0.5) * TICK_TO_BEAT, duration: 0.8, weight: 0.7,
                    technique: 'pick', dynamics: 'mf', phrasing: 'legato', pan: -0.3
                });
            }
        });

        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.currentTheme.startBar;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - barOffset + 0.5) * TICK_TO_BEAT, 
            duration: n.d * TICKS_PER_BAR * TICK_TO_BEAT, weight: 0.8,
            technique: 'pick', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.currentBassTheme.startBar;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - barOffset + 0.2) * TICK_TO_BEAT, 
            duration: n.d * TICKS_PER_BAR * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
        }));
    }

    private constrainBassOctave(note: number): number {
        let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n;
    }
}
