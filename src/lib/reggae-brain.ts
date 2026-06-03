
/**
 * @fileOverview Reggae Brain V4.3 — "Heritage Connectivity Restoration".
 * #ЗАЧЕМ: Исправление потери связи с облаком.
 * #ЧТО: ПЛАН №35 — Сброс busy-таймеров при обновлении пула аксиом.
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

export class ReggaeBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    
    private sessionAnchorId: string | null = null; 
    private currentTrackName: string = 'Algorithmic';
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string }[] = [];

    private soloistBusyUntilBar: number = -1;
    private readonly MELODY_CEILING = 84;

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
        const wasEmpty = this.cloudAxioms.length === 0;
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;
        
        // #ЗАЧЕМ: Если мы были в режиме генерации, нужно немедленно попытаться подхватить Наследие.
        if (wasEmpty && this.cloudAxioms.length > 0 && this.useHeritage) {
            this.soloistBusyUntilBar = -1;
        }
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number): number {
        if (totalBars <= 0) return 0;
        if (this.isImprovising) {
            return calculateMusiNum(epoch, 11, this.seed, totalBars);
        }
        return (epoch - startEpoch) % totalBars;
    }

    private rippleLongNote(e: FractalEvent, chord: GhostChord): FractalEvent[] {
        if (e.duration < 3.5) return [e]; 

        const rippled: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const ripplePool = isMinor ? [0, 3, 7, 8, 10] : [0, 4, 7, 9, 11]; 
        
        const numChunks = Math.ceil(e.duration / 1.5); 
        const chunkDur = e.duration / numChunks;
        const baseOctaveMidi = Math.floor(e.note / 12) * 12;

        for (let i = 0; i < numChunks; i++) {
            let note: number;
            if (i === 0) {
                note = e.note;
            } else {
                const seedOffset = Math.floor(e.time * 12);
                const idx = calculateMusiNum(seedOffset + i, 13, this.seed, ripplePool.length);
                note = baseOctaveMidi + ripplePool[idx];
            }

            const rawType = Array.isArray(e.type) ? e.type[0] : e.type;
            let finalNote = note;
            
            if (rawType === 'bass') finalNote = this.constrainBassOctave(note);
            else if (rawType === 'melody') finalNote = Math.min(note, this.MELODY_CEILING);
            else finalNote = this.constrainAccompanimentOctave(note);

            rippled.push({
                ...e,
                note: finalNote,
                time: e.time + (i * chunkDur),
                duration: chunkDur * 1.15,
                params: { 
                    ...e.params, 
                    attack: i === 0 ? (e.params?.attack || 0.5) : 0.8,
                    release: 2.5 
                }
            });
        }
        return rippled;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentTheme = null;
        this.currentBassTheme = null;
        this.currentAccompAxioms = [];
        this.currentDrumAxioms = [];
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;
        
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
            filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axCommons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                return axGenres.includes('reggae') && axCommons.includes(commonMoodFilter);
            });
        }

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const firstChoice = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(firstChoice.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                    filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                    basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                }

                const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const suitePlayhead = epoch % (maxDonorBars || 144);
                
                let selected: any = null;
                if (this.isImprovising) {
                    selected = basePool[calculateMusiNum(this.seed, 19, epoch, basePool.length)];
                } else {
                    const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === (suitePlayhead % (maxDonorBars || 1)));
                    selected = sameOffsetPool.length > 0 ? sameOffsetPool[0] : basePool[0];
                }

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    
                    let rawPhrase = decompressCompactPhrase(selected.phrase);
                    if (selected.role === 'melody' || selected.role.includes('accomp')) rawPhrase = mergeIdenticalNotes(rawPhrase);

                    const cid = normalizeStr(selected.compositionId);
                    
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };
                    }

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    accompSiblings.forEach(ax => {
                        this.currentAccompAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument });
                    });

                    const drumSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('drum') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    drumSiblings.forEach(ax => { 
                        this.currentDrumAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role }); 
                    });

                    const baseBars = selected.bars || 4;
                    this.currentThemeMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { phrase: rawPhrase, startBar: epoch, endBar: epoch + baseBars, id: selected.id };
                    this.soloistBusyUntilBar = epoch + baseBars;
                    return selected.nativeBpm || undefined;
                }
            }
        }
        
        this.currentTrackName = 'Algorithmic';
        this.soloistBusyUntilBar = epoch + 4;
        return undefined;
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, trackName?: string, activeAxioms?: any, narrative?: string, instrumentOverrides?: Partial<InstrumentHints>, newBpm?: number } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const events: FractalEvent[] = [];
        
        let newBpm: number | undefined;
        if (epoch >= this.soloistBusyUntilBar) {
            newBpm = this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const instrumentOverrides: Partial<InstrumentHints> = {};

        if (this.currentPreferredInstrument && hints.melody) {
            instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'reggae');
        }

        // 1. DRUMS
        if (hints.drums) {
            if (this.currentDrumAxioms.length > 0) {
                events.push(...this.renderHeritageDrums(epoch, tension));
            } else {
                events.push(...this.renderDefaultReggaePulse(epoch, tension));
            }
        }

        // 2. BASS
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension).flatMap(e => this.rippleLongNote(e, resChord)));
            } else {
                events.push(...this.renderGenerativeBass(epoch, resChord, tension).flatMap(e => this.rippleLongNote(e, resChord)));
            }
        }

        // 3. ACCOMPANIMENT / PIANO / HARMONY
        const usedLayers = new Set<string>();
        let pianoAxiomId = 'none';
        let harmonyAxiomId = 'none';

        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = null;
            if (role.includes('piano')) { target = 'pianoAccompaniment'; pianoAxiomId = ax.id; }
            else if (role.includes('accomp')) target = 'accompaniment';
            else if (role.includes('harmony') || role.includes('strings') || role.includes('guitar')) { target = 'harmony'; harmonyAxiomId = ax.id; }

            if (target && hints[target] && !usedLayers.has(target)) {
                events.push(...this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension).flatMap(e => this.rippleLongNote(e, resChord)));
                usedLayers.add(target);
                
                if (ax.preferredInstrument) {
                    instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'reggae');
                }
            }
        });

        if (hints.harmony && !usedLayers.has('harmony')) {
            events.push(...this.renderGenerativeHarmony(resChord, epoch, tension).flatMap(e => this.rippleLongNote(e, resChord)));
            usedLayers.add('harmony');
            harmonyAxiomId = 'Generative Skank';
        }

        if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension, events.filter(e => e.type === 'melody'));
            if (p.events.length > 0) {
                events.push(...p.events.flatMap(e => this.rippleLongNote(e, resChord)));
                usedLayers.add('pianoAccompaniment');
                pianoAxiomId = p.style;
            }
        }

        if (hints.accompaniment && !usedLayers.has('accompaniment')) {
            events.push(...this.renderGenerativePad(resChord, tension).flatMap(e => this.rippleLongNote(e, resChord)));
        }

        // 4. MELODY
        let activeMelLick = 'none';
        if (hints.melody) {
            let melEvents: FractalEvent[] = [];
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melEvents = this.renderHeritageMelody(epoch, resChord, tension);
                if (melEvents.length > 0) activeMelLick = this.currentTheme.id;
            }
            
            if (activeMelLick === 'none') {
                melEvents = this.renderGapFiller(epoch, resChord, tension);
                activeMelLick = 'Gap-Filler';
            }
            events.push(...melEvents.flatMap(e => this.rippleLongNote(e, resChord)));
        }

        const modeStr = this.isImprovising ? 'IMPROVISATION' : 'RESTORATION';

        return {
            events, tension, beautyScore: 0.95,
            trackName: this.currentTrackName,
            newBpm,
            instrumentOverrides,
            activeAxioms: {
                melody: activeMelLick,
                bass: this.currentBassTheme ? `DNA: ${this.currentBassTheme.id}` : 'Generative Pulse',
                drums: this.currentDrumAxioms.length > 0 ? 'Heritage Sync' : 'Standard Pulse',
                harmony: harmonyAxiomId,
                piano: pianoAxiomId
            },
            narrative: `Reggae ${modeStr}: [DNA: ${this.currentTrackName}] [Protocol: ARIA]`
        };
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12;
        const scale = [0, 3, 5, 7, 10]; 
        
        const noteCount = calculateMusiNum(epoch, 2, this.seed, 2) + 1;
        const ticks = [0, 3, 6, 9].sort(() => Math.random() - 0.5).slice(0, noteCount);
        
        ticks.forEach(t => {
            const degIdx = calculateMusiNum(epoch + t, 11, this.seed, scale.length);
            const note = root + scale[degIdx];
            
            events.push({
                type: 'melody',
                note: Math.min(note, this.MELODY_CEILING),
                time: t * TICK_TO_BEAT,
                duration: (1.5 * TICK_TO_BEAT) * 1.25, 
                weight: 0.7 + (tension * 0.2),
                technique: tension > 0.4 ? 'vb' : 'pick',
                dynamics: 'p',
                phrasing: 'legato'
            });
        });
        return events;
    }

    private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
        const events: FractalEvent[] = [];
        
        [3, 9].forEach(t => { 
            intervals.forEach(interval => {
                events.push({
                    type: 'harmony',
                    note: this.constrainAccompanimentOctave(root + interval),
                    time: t * TICK_TO_BEAT,
                    duration: 0.5 * TICK_TO_BEAT, 
                    weight: 0.45 + (tension * 0.1),
                    technique: 'hit',
                    dynamics: 'p',
                    phrasing: 'staccato',
                    chordName: chord.chordType === 'minor' ? 'Am' : 'A'
                });
            });
        });
        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentTheme.startBar, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        
        return this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => {
            const useVibrato = (tension > 0.4 && n.d >= 3) || n.tech === 'vb';
            return {
                type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
                time: (n.t - barOffset) * TICK_TO_BEAT, 
                duration: (n.d * TICK_TO_BEAT) * 1.25, 
                weight: 0.85 + (tension * 0.1),
                technique: useVibrato ? 'vb' as Technique : 'pick', 
                dynamics: 'mf', phrasing: 'legato'
            };
        });
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentBassTheme.startBar, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        
        return this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        
        return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6, 
            technique: tension > 0.7 ? 'hit' : 'swell', dynamics: 'p', phrasing: 'staccato'
        }));
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;

        this.currentDrumAxioms.forEach(ax => {
            ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                events.push({
                    type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, 
                    duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    private renderDefaultReggaePulse(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        events.push({ type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        events.push({ type: 'drum_snare', note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        [0, 3, 6, 9].forEach(t => {
            events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        });
        return events;
    }

    private renderGenerativeBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote - 12;
        return [
            { type: 'bass', note: root, time: 1.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' },
            { type: 'bass', note: root + 7, time: 7.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.8, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' }
        ];
    }

    private renderGenerativePad(chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'accompaniment', note: chord.rootNote + 12, time: 0, duration: 4.0, weight: 0.5,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }];
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];

        if (melodyEvents.length > 0) {
            melodyEvents.forEach((m, i) => {
                if (i % 2 === 0) {
                    events.push({
                        ...m,
                        type: 'pianoAccompaniment',
                        note: this.constrainAccompanimentOctave(m.note + (chord.chordType === 'minor' ? 3 : 4)),
                        weight: 0.35,
                        technique: 'hit',
                        phrasing: 'staccato'
                    });
                }
            });
            return { events, style: 'Melodic Shadow' };
        } else {
            [1.5, 4.5, 7.5, 10.5].forEach(t => {
                if (this.random.next() < 0.6) {
                    intervals.forEach(interval => {
                        events.push({
                            type: 'pianoAccompaniment',
                            note: this.constrainAccompanimentOctave(root + interval + 12),
                            time: t * TICK_TO_BEAT,
                            duration: 0.3 * TICK_TO_BEAT,
                            weight: 0.3,
                            technique: 'hit',
                            dynamics: 'p',
                            phrasing: 'staccato'
                        });
                    });
                }
            });
            return { events, style: 'Rhodes Bubbling' };
        }
    }

    private constrainBassOctave(note: number): number {
        let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n;
    }

    private constrainAccompanimentOctave(note: number): number {
        let n = note; while (n > 71) n -= 12; while (n < 48) n += 12; return n;
    }
}
