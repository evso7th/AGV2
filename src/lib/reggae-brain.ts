/**
 * @fileOverview Reggae Brain V51.0 — "The Zero-Allocation Oracle".
 * #ЗАЧЕМ: Полное соответствие Плану №22400.
 * #ЧТО: 1. Оптимизация горячих циклов (for вместо .filter). 2. Кэширование декомпрессии.
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
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    transposePhraseDegrees,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    generateStitchPhrase,
    getScaleForMood,
    applyDynamicArticulation,
    applyMicroChronos
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
    private currentTrackName: string = 'Algo';
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string, id: string }[] = [];

    private soloistBusyUntilBar: number = -1;
    private bridgeUntilBar: number = -1;
    private lastMelodyNote: number = 60;
    private currentMutationType: string = 'none';
    private degreeTransposition: number = 0;
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
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;
        if (this.soloistBusyUntilBar === -1) this.soloistBusyUntilBar = 0;
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number): number {
        if (totalBars <= 0) return 0;
        if (this.isImprovising) return calculateMusiNum(epoch, 11, this.seed, totalBars);
        return (epoch - startEpoch) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentTheme = null; this.currentBassTheme = null; this.currentAccompAxioms = []; this.currentDrumAxioms = [];
        this.currentNativeRoot = null; this.currentPreferredInstrument = null;
        
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;
        
        const poolToUse = this.cloudAxioms.filter(ax => !ax.ignored);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            for (let i = 0; i < poolToUse.length; i++) {
                if (normalizeStr(poolToUse[i].compositionId) === effectiveAnchor) filteredPool.push(poolToUse[i]);
            }
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
            for (let i = 0; i < poolToUse.length; i++) {
                const ax = poolToUse[i];
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axCommons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                if (axGenres.includes('reggae') && axCommons.includes(commonMoodFilter)) filteredPool.push(ax);
            }
        }

        if (filteredPool.length > 0) {
            let basePool: any[] = [];
            for (let i = 0; i < filteredPool.length; i++) if (filteredPool[i].role === 'melody') basePool.push(filteredPool[i]);
            if (basePool.length === 0) {
                for (let i = 0; i < filteredPool.length; i++) if (filteredPool[i].role.toLowerCase().includes('accomp')) basePool.push(filteredPool[i]);
            }

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const firstChoice = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(firstChoice.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                    filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                    basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                }

                let maxDonorBars = 0;
                for (let i = 0; i < basePool.length; i++) {
                    const total = (basePool[i].barOffset || 0) + (basePool[i].bars || 4);
                    if (total > maxDonorBars) maxDonorBars = total;
                }
                const suitePlayhead = epoch % (maxDonorBars || 144);
                let selected: any = null;
                if (this.isImprovising) selected = basePool[calculateMusiNum(this.seed, 17, epoch, basePool.length)];
                else {
                    for (let i = 0; i < basePool.length; i++) {
                        if ((basePool[i].barOffset || 0) === (suitePlayhead % (maxDonorBars || 1))) { selected = basePool[i]; break; }
                    }
                    if (!selected) selected = basePool[0];
                }

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    let rawPhrase = decompressCompactPhrase(selected.phrase);
                    if (selected.role === 'melody' || selected.role.includes('accomp')) rawPhrase = mergeIdenticalNotes(rawPhrase);
                    const cid = normalizeStr(selected.compositionId);
                    for (let i = 0; i < poolToUse.length; i++) {
                        const ax = poolToUse[i];
                        if (normalizeStr(ax.compositionId) !== cid || ax.barOffset !== selected.barOffset) continue;
                        const role = ax.role.toLowerCase();
                        if (role.includes('drum')) this.currentDrumAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id });
                        else if (role === 'bass') this.currentBassTheme = { phrase: decompressCompactPhrase(ax.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: ax.id };
                        else if (role.includes('accomp') || role.includes('piano')) this.currentAccompAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument });
                    }
                    const baseBars = selected.bars || 4;
                    this.currentThemeMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { phrase: rawPhrase, startBar: epoch, endBar: epoch + baseBars, id: selected.id };
                    this.soloistBusyUntilBar = epoch + baseBars;
                    return selected.nativeBpm || undefined;
                }
            }
        }
        this.currentTrackName = 'Algo'; this.soloistBusyUntilBar = epoch + 4;
        return undefined;
    }

    private constrainBassOctave(note: number): number { let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n; }
    private constrainAccompanimentOctave(note: number): number { let n = note; while (n > 71) n -= 12; while (n < 48) n += 12; return n; }

    private rippleLongNote(e: FractalEvent, chord: GhostChord): FractalEvent[] {
        if (e.duration < 3.9) return [e]; 
        const rippled: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const ripplePool = isMinor ? [3, 7, 8, 10] : [4, 7, 9, 11]; 
        const numChunks = Math.ceil(e.duration / 2.6); 
        const chunkDur = e.duration / numChunks;
        const baseOctaveMidi = Math.floor(e.note / 12) * 12;
        for (let i = 0; i < numChunks; i++) {
            let note = (i === 0) ? e.note : baseOctaveMidi + ripplePool[calculateMusiNum(Math.floor(e.time * 12) + i, 13, this.seed, ripplePool.length)];
            rippled.push({ ...e, note: Math.min(note, this.MELODY_CEILING), time: e.time + (i * chunkDur), duration: chunkDur, params: { ...e.params, attack: i === 0 ? 1.5 : 0.8, release: 2.5 } });
        }
        return rippled;
    }

    public generateBar(
        epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, trackName?: string, activeAxioms?: any, narrative?: string, instrumentOverrides?: Partial<InstrumentHints>, newBpm?: number, mutationType?: string } {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const events: FractalEvent[] = [];
        
        if (epoch % 8 === 0 && epoch >= 4) {
            const mutationRand = this.random.next();
            const mutationThreshold = this.isImprovising ? 0.9 : 0.5;
            if (mutationRand < mutationThreshold * 0.25) {
                this.degreeTransposition = [-1, 1, 2, -2][this.random.nextInt(4)];
                this.currentMutationType = 'transpose_deg';
            }
            else if (mutationRand < mutationThreshold * 0.5) this.currentMutationType = 'inversion';
            else if (mutationRand < mutationThreshold * 0.75) this.currentMutationType = 'retrograde';
            else if (mutationRand < mutationThreshold) this.currentMutationType = 'jitter';
            else this.currentMutationType = 'none';
        } else if (epoch < 4) this.currentMutationType = 'none';
        
        const isSoloistFree = epoch >= this.soloistBusyUntilBar;
        const isBridging = epoch === this.bridgeUntilBar;
        let newBpm: number | undefined;
        let melodyStatus = 'Waiting';

        if (isSoloistFree && !isBridging) {
            if (this.currentTheme && this.useHeritage) this.bridgeUntilBar = epoch;
            else newBpm = this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const instrumentOverrides: Partial<InstrumentHints> = {};
        
        if (this.currentPreferredInstrument && hints.melody) {
            instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'reggae');
        }

        if (isBridging) {
            const scale = getScaleForMood(this.mood);
            const stitch = generateStitchPhrase(this.lastMelodyNote, resRoot + 12, scale);
            let finalStitch = stitch;
            if (epoch >= 4) { 
                finalStitch = applyDynamicArticulation(stitch, tension, this.seed + epoch); 
                finalStitch = applyMicroChronos(finalStitch, this.seed, tension); 
            }
            events.push(...this.renderHeritageMelody(epoch, resChord, tension, finalStitch));
            melodyStatus = 'STITCH'; this.bridgeUntilBar = -1; this.soloistBusyUntilBar = epoch + 1;
        }

        if (hints.drums) {
            if (this.currentDrumAxioms.length > 0) events.push(...this.renderHeritageDrums(epoch, tension));
            else events.push(...this.renderDefaultReggaePulse(epoch, tension));
        }

        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                let bassPhrase = this.currentBassTheme.phrase;
                if (this.currentMutationType === 'retrograde') bassPhrase = retrogradePhrase(bassPhrase);
                if (epoch >= 4) { 
                    bassPhrase = applyDynamicArticulation(bassPhrase, tension, this.seed + epoch + 50); 
                    bassPhrase = applyMicroChronos(bassPhrase, this.seed + 200, tension); 
                }
                events.push(...this.renderHeritageBass(epoch, resChord, tension, bassPhrase));
            } else events.push(...this.renderGenerativeBass(epoch, resChord, tension));
        }

        const usedLayers = new Set<string>();
        let pId = 'none'; let hId = 'none';
        
        if (!isBridging) {
            for (let i = 0; i < this.currentAccompAxioms.length; i++) {
                const ax = this.currentAccompAxioms[i];
                const role = ax.role.toLowerCase(); 
                let target: InstrumentPart | null = null;
                if (role.includes('piano')) { target = 'pianoAccompaniment'; pId = ax.id; }
                else if (role.includes('accomp')) target = 'accompaniment';
                else if (role.includes('harmony')) { target = 'harmony'; hId = ax.id; }
                
                if (target && hints[target] && !usedLayers.has(target)) {
                    let activePhrase = ax.phrase;
                    if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                    if (epoch >= 4) { 
                        activePhrase = applyDynamicArticulation(activePhrase, tension, this.seed + epoch + 100); 
                        activePhrase = applyMicroChronos(activePhrase, this.seed + 300, tension); 
                    }
                    events.push(...this.renderHeritageLayer(resChord, epoch, activePhrase, target, tension));
                    usedLayers.add(target);
                    if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'reggae');
                }
            }
        }

        if (hints.harmony && !usedLayers.has('harmony')) { 
            const harProb = 0.2 + (tension * 0.4);
            if (this.random.next() < harProb) { events.push(...this.renderGenerativeHarmony(resChord, epoch, tension)); hId = 'Algo-Skank'; }
        }

        if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension, events);
            if (p.events.length > 0) { events.push(...p.events); pId = p.style; }
        }

        if (hints.melody && !isBridging) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                let activePhrase = this.currentTheme.phrase;
                if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                if (epoch >= 4) { 
                    activePhrase = applyDynamicArticulation(activePhrase, tension, this.seed + epoch); 
                    activePhrase = applyMicroChronos(activePhrase, this.seed, tension); 
                }
                const hMelody = this.renderHeritageMelody(epoch, resChord, tension, activePhrase);
                if (hMelody.length > 0) { events.push(...hMelody); melodyStatus = this.currentTheme.id; }
            }
            if (melodyStatus === 'Waiting') { events.push(...this.renderGapFiller(epoch, resChord, tension)); melodyStatus = 'Gap'; }
        }

        if (events.length > 0) { 
            for (let i = events.length - 1; i >= 0; i--) { if (events[i].type === 'melody') { this.lastMelodyNote = events[i].note; break; } }
        }

        const modeStr = this.isImprovising ? 'IMPRO' : 'RESTO';
        return {
            events, tension, beautyScore: 0.95, trackName: this.currentTrackName, newBpm, instrumentOverrides, mutationType: this.currentMutationType,
            activeAxioms: { melody: melodyStatus, bass: this.currentBassTheme ? this.currentBassTheme.id : 'Algo', drums: this.currentDrumAxioms.length > 0 ? this.currentDrumAxioms[0].id : 'Pulse', harmony: hId, piano: pId },
            narrative: `Reggae ${modeStr}: ${melodyStatus}`
        };
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12; const scale = [0, 3, 5, 7, 10]; 
        const count = calculateMusiNum(epoch, 2, this.seed, 2) + 1;
        const potentialTicks = [0, 3, 6, 9];
        for (let i = 0; i < count; i++) {
            const t = potentialTicks[this.random.nextInt(4)];
            events.push({ 
                type: 'melody', note: Math.min(root + scale[calculateMusiNum(epoch + t, 11, this.seed, scale.length)], this.MELODY_CEILING), 
                time: t * TICK_TO_BEAT, duration: (1.5 * TICK_TO_BEAT) * 1.25, weight: 0.7 + (tension * 0.2), 
                technique: tension > 0.4 ? 'vb' : 'pick', dynamics: 'p', phrasing: 'legato' 
            });
        }
        return events;
    }

    private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12; const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7]; const events: FractalEvent[] = [];
        const skankTicks = [3, 9];
        for (let i = 0; i < 2; i++) {
            const t = skankTicks[i];
            for (let j = 0; j < intervals.length; j++) {
                events.push({ type: 'harmony', note: this.constrainAccompanimentOctave(root + intervals[j]), time: t * TICK_TO_BEAT, duration: 0.5 * TICK_TO_BEAT, weight: 0.45 + (tension * 0.1), technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
            }
        }
        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, phrase: any[]): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const results: FractalEvent[] = [];
        for (let i = 0; i < phrase.length; i++) {
            const n = phrase[i];
            if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                const e: FractalEvent = { type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING), time: (n.t - barOffset) * TICK_TO_BEAT, duration: (n.d * TICK_TO_BEAT) * 1.25, weight: 0.85 + (tension * 0.1), technique: n.tech as Technique, dynamics: 'mf', phrasing: 'legato' };
                results.push(...this.rippleLongNote(e, chord));
            }
        }
        return results;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number, phrase: any[]): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const results: FractalEvent[] = [];
        for (let i = 0; i < phrase.length; i++) {
            const n = phrase[i];
            if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                const e: FractalEvent = { type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0, technique: n.tech as Technique, dynamics: 'mf', phrasing: 'detached' };
                results.push(...this.rippleLongNote(e, chord));
            }
        }
        return results;
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const results: FractalEvent[] = [];
        for (let i = 0; i < phrase.length; i++) {
            const n = phrase[i];
            if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                const e: FractalEvent = { type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6, technique: n.tech as Technique, dynamics: 'p', phrasing: 'staccato' };
                results.push(...this.rippleLongNote(e, chord));
            }
        }
        return results;
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = []; 
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        for (let i = 0; i < this.currentDrumAxioms.length; i++) {
            const ax = this.currentDrumAxioms[i];
            for (let j = 0; j < ax.phrase.length; j++) {
                const n = ax.phrase[j];
                if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                    events.push({ type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: 0.1, weight: 0.32, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
                }
            }
        }
        return events;
    }

    private renderDefaultReggaePulse(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = []; 
        events.push({ type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        events.push({ type: 'drum_snare', note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        const hTicks = [0, 3, 6, 9];
        for (let i = 0; i < 4; i++) events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: hTicks[i] * TICK_TO_BEAT, duration: 0.1, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        return events;
    }

    private renderGenerativeBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote - 12; 
        const b1: FractalEvent = { type: 'bass', note: this.constrainBassOctave(root), time: 1.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' };
        const b2: FractalEvent = { type: 'bass', note: this.constrainBassOctave(root + 7), time: 7.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.8, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' };
        return [...this.rippleLongNote(b1, chord), ...this.rippleLongNote(b2, chord)];
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = []; const root = chord.rootNote + 12;
        const melodyOnly = melodyEvents.filter(e => e.type === 'melody');
        if (melodyOnly.length > 0) { 
            for (let i = 0; i < melodyOnly.length; i++) {
                if (i % 2 === 0) {
                    const m = melodyOnly[i];
                    events.push({ ...m, type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(m.note + (chord.chordType === 'minor' ? 3 : 4)), weight: 0.35, technique: 'hit', phrasing: 'staccato' });
                }
            }
            return { events, style: 'Shadow' }; 
        }
        const bubbleTicks = [1.5, 4.5, 7.5, 10.5];
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
        for (let i = 0; i < 4; i++) {
            if (this.random.next() < 0.6) {
                for (let j = 0; j < intervals.length; j++) {
                    events.push({ type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(root + intervals[j] + 12), time: bubbleTicks[i] * TICK_TO_BEAT, duration: 0.3 * TICK_TO_BEAT, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
                }
            }
        }
        return { events, style: 'Bubble' };
    }
}
