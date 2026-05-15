
/**
 * @fileOverview Ambient Brain V79.0 — "Generative Resilience".
 * #ЗАЧЕМ: Фикс "DNA: Generative" и восстановление фоновой активности.
 * #ЧТО: ПЛАН №1782 — 1. Авто-сброс busy-таймера. 2. Гарантированный фоновый дрон.
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
    Technique,
    Dynamics,
    Phrasing
} from '@/types/music';
import {
    calculateMusiNum,
    DEGREE_TO_SEMITONE,
    GEO_ATLAS,
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

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private fog: number = 0.3;
    private registerShift: number = 0;
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;

    private soloistBusyUntilBar: number = -1;

    private readonly MELODY_CEILING = 72;
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string }[] = [];

    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' = 'ADAPTIVE';

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;

    constructor(seed: number, mood: Mood, genre: Genre, useHeritage: boolean = true) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.useHeritage = useHeritage;
        this.random = this.createSeededRandom(seed);
    }

    private createSeededRandom(seed: number) {
        let state = seed;
        const next = () => { state = (state * 1664525 + 1013904223) % Math.pow(2, 32); return state / Math.pow(2, 32); };
        return { next, nextInt: (max: number) => Math.floor(next() * max) };
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean, isImprovising?: boolean) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;
        this.soloistBusyUntilBar = -1;
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        if (totalBars <= 0) return 0;
        if (this.isImprovising && !this.activeAnchorId) {
            return calculateMusiNum(epoch, 11, this.seed, totalBars);
        }
        return (epoch - startEpoch) % totalBars;
    }

    private selectNextAxiom(epoch: number): number | undefined {
        this.currentTheme = null;
        this.currentBassTheme = null;
        this.currentAccompAxioms = [];
        this.currentDrumAxioms = [];
        this.ensembleStatus = 'ADAPTIVE';

        if (!this.useHeritage || this.cloudAxioms.length === 0) {
            this.currentTrackName = 'Algorithmic';
            return undefined;
        }

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
            filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return axGenres.includes('ambient') && (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter);
            });
        }

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const first = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(first.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                    filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                    basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                }

                const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const suitePlayhead = epoch % (maxDonorBars || 144);
                
                let selected: any = null;
                if (this.isImprovising && !this.activeAnchorId) {
                    selected = basePool[calculateMusiNum(this.seed, 19, epoch, basePool.length)];
                } else {
                    const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === (suitePlayhead % (maxDonorBars || 1)));
                    selected = sameOffsetPool.length > 0 ? sameOffsetPool[0] : basePool[0];
                }

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    this.currentAxiomMaxTick = (selected.bars || 4) * TICKS_PER_BAR;
                    this.currentTheme = { phrase: mergeIdenticalNotes(decompressCompactPhrase(selected.phrase)), startBar: epoch, endBar: epoch + (selected.bars || 4), id: selected.id };
                    
                    const cid = normalizeStr(selected.compositionId);
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4) };

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accompSiblings.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

                    this.soloistBusyUntilBar = epoch + (selected.bars || 4);
                    this.ensembleStatus = 'SIBLING';
                    return selected.nativeBpm || undefined;
                }
            }
        }
        
        this.currentTrackName = 'Algorithmic';
        this.soloistBusyUntilBar = epoch + 4;
        return undefined;
    }

    private rippleLongNote(e: FractalEvent, chord: GhostChord): FractalEvent[] {
        if (e.duration < 3.9) return [e]; 
        const rippled: FractalEvent[] = [];
        const ripplePool = chord.chordType === 'minor' ? [3, 7, 8, 10] : [4, 7, 9, 11]; 
        const numChunks = Math.ceil(e.duration / 2.6); 
        const chunkDur = e.duration / numChunks;
        for (let i = 0; i < numChunks; i++) {
            const note = (i === 0) ? e.note : (Math.floor(e.note / 12) * 12) + ripplePool[calculateMusiNum(Math.floor(e.time * 12) + i, 13, this.seed, ripplePool.length)];
            rippled.push({ ...e, note: Math.min(note, this.MELODY_CEILING), time: e.time + (i * chunkDur), duration: chunkDur });
        }
        return rippled;
    }

    public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints) {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        let newBpm: number | undefined;
        if (epoch >= this.soloistBusyUntilBar) newBpm = this.selectNextAxiom(epoch);

        this.applyGeography(epoch, dna);
        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];

        // 1. BASS
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
                const barOffset = (epoch % totalBars) * TICKS_PER_BAR;
                this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                    events.push({ type: 'bass', note: 31 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'legato' });
                });
            } else {
                events.push(...this.rippleLongNote({ type: 'bass', note: this.constrainBassOctave(resChord.rootNote - 12), time: 0, duration: 4.0, weight: 0.7, technique: 'drone', dynamics: 'p', phrasing: 'legato' }, resChord));
            }
        }

        // 2. MELODY
        let activeMelLick = 'none';
        if (hints.melody) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
                const barOffset = (epoch % totalBars) * TICKS_PER_BAR;
                this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                    events.push({ type: 'melody', note: 60 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: (n.d * TICK_TO_BEAT) * 1.25, weight: 0.9, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
                });
                activeMelLick = this.currentTheme.id;
            } else {
                // #ЗАЧЕМ: ПЛАН №1782. Генеративный пэд мелодии при отсутствии ДНК.
                events.push(...this.rippleLongNote({ type: 'melody', note: resChord.rootNote + 12, time: 0, duration: 4.5, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato' }, resChord));
                activeMelLick = 'Generative Pad';
            }
        }

        // 3. ACCOMP
        let usedAccomp = false;
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: any = role.includes('piano') ? 'pianoAccompaniment' : 'accompaniment';
            if (hints[target as InstrumentPart]) {
                const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
                const barOffset = (epoch % totalBars) * TICKS_PER_BAR;
                ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                    events.push({ type: target, note: 60 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
                });
                usedAccomp = true;
            }
        });

        if (hints.accompaniment && !usedAccomp) {
            events.push({ type: 'accompaniment', note: resChord.rootNote + 12, time: 0, duration: 4.0, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato' });
        }

        if (hints.drums) events.push(...this.renderLandscapeDrums(epoch, tension));

        const modeStr = this.isImprovising && !this.activeAnchorId ? 'IMPROVISATION' : 'RESTORATION';

        return {
            events, tension, beautyScore: 0.9,
            trackName: this.currentTrackName,
            newBpm,
            brightness: tension * 0.7,
            activeAxioms: {
                melody: activeMelLick,
                ensemble: `${this.ensembleStatus} [${modeStr}]`,
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Generative Drone'
            },
            narrative: `Ambient ${modeStr}: ${this.currentTrackName}`
        };
    }

    private applyGeography(epoch: number, dna: SuiteDNA) {
        if (!dna.itinerary?.length) return;
        const stage = Math.min(2, Math.floor((epoch / 150) * 3));
        const atom = GEO_ATLAS[dna.itinerary[stage]];
        if (atom) { this.registerShift = atom.reg; }
    }

    private renderLandscapeDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.random.next() < 0.3) events.push({ type: 'drum_kick_soft', note: 36, time: 0, duration: 0.1, weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        return events;
    }

    private constrainBassOctave(note: number): number {
        let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n;
    }
}
