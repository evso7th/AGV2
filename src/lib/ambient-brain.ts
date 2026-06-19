
/**
 * @fileOverview Ambient Brain V104.0 — "Swell Phrasing Update".
 * #ЗАЧЕМ: ПЛАН №1242 — Обучение мелодиста технике Swell.
 * #ЧТО: Плавные атаки для всех сольных партий Амбиента.
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
    mergeIdenticalNotes,
    keyToMidiRoot,
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    normalizeStr,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    // --- State & Memory (Transplanted from Blues) ---
    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private currentMutationType: string = 'none';

    private readonly MELODY_CEILING = 88;
    private readonly BASS_FLOOR = 31;
    private readonly BASS_CEILING = 47;

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
        if (this.cloudAxioms.length > 0 && this.useHeritage) this.soloistBusyUntilBar = -1;
    }

    /**
     * #ЗАЧЕМ: Ритмическое сито (Anti-Drone).
     * #ЧТО: Дробит длинные ноты на переливающиеся капли.
     */
    private rippleLongNote(e: FractalEvent, chord: GhostChord, chunkDurBase: number = 1.0): FractalEvent[] {
        if (e.duration < 1.1) return [e]; 

        const rippled: FractalEvent[] = [];
        const numChunks = Math.max(1, Math.ceil(e.duration / chunkDurBase));
        const chunkDur = e.duration / numChunks;
        
        for (let i = 0; i < numChunks; i++) {
            rippled.push({
                ...e,
                time: e.time + (i * chunkDur),
                duration: chunkDur * 1.5, 
                weight: e.weight * (1.0 - (i * 0.05)),
                technique: i === 0 ? e.technique : 'hit',
                params: { ...e.params, attack: e.technique === 'swell' ? 0.6 : 0.2, release: chunkDur * 2.5 }
            });
        }
        return rippled;
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        if (totalBars <= 0) return 0;
        const startOffset = calculateMusiNum(this.seed, 13, 0, totalBars);
        if (this.isImprovising) {
            return calculateMusiNum(epoch + startOffset, 11, this.seed, totalBars);
        }
        const barsElapsed = epoch - startEpoch;
        return (barsElapsed + startOffset) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentTheme = null;
        this.currentBassTheme = null;
        this.currentAccompAxioms = [];
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;

        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool = effectiveAnchor 
            ? poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor)
            : poolToUse.filter(ax => {
                const genres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return genres.includes(this.genre) || genres.includes('rock') || genres.includes('blues');
            });

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const first = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(first.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                    filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                }

                const maxDonorBars = Math.max(...filteredPool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                
                const sameOffsetPool = filteredPool.filter(ax => (ax.role === 'melody' || ax.role.toLowerCase().includes('accomp')) && (ax.barOffset || 0) === targetOffset);
                const selected = sameOffsetPool.length > 0 ? sameOffsetPool[this.random.nextInt(sameOffsetPool.length)] : basePool[0];

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentLickId = selected.id;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accompSiblings.map(ax => ({ 
                        phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument 
                    }));

                    const baseBars = selected.bars || 4;
                    this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { phrase: mergeIdenticalNotes(decompressCompactPhrase(selected.phrase)), startBar: epoch, endBar: epoch + baseBars, id: selected.id };
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
    ): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 17, this.seed, 100);
            if (roll < 60) this.currentMutationType = 'none';
            else if (roll < 80) this.currentMutationType = 'inversion';
            else this.currentMutationType = 'jitter';
        }

        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];
        const instrumentOverrides: Partial<InstrumentHints> = {};
        
        const layerAxioms: Record<string, string> = {
            melody: 'none', bass: 'none', drums: 'none', accompaniment: 'none', harmony: 'none', piano: 'none'
        };

        // 1. Bass
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension)
                : this.renderPulsatingBass(resChord, epoch, tension);
            events.push(...b.flatMap(e => this.rippleLongNote(e, resChord, 0.5)));
            layerAxioms.bass = this.currentBassTheme ? 'Sibling DNA' : 'Algorithm Pulse';
        }

        // 2. Melody
        if (hints.melody) {
            let m: FractalEvent[] = [];
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                m = this.renderHeritageMelody(epoch, resChord, tension);
                layerAxioms.melody = this.currentTheme.id;
            } else {
                m = this.renderGapFiller(epoch, resChord, tension);
                layerAxioms.melody = 'Swell Accents';
            }
            events.push(...m.flatMap(e => this.rippleLongNote(e, resChord, 0.8)));
            if (this.currentPreferredInstrument) instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'ambient');
        }

        // 3. Accompaniment & Piano
        const usedLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('accomp') ? 'accompaniment' : (role.includes('harmony') ? 'harmony' : null));
            if (target && hints[target] && !usedLayers.has(target)) {
                const rendered = this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension);
                events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord, 1.2)));
                usedLayers.add(target);
                layerAxioms[target === 'pianoAccompaniment' ? 'piano' : (target === 'harmony' ? 'harmony' : 'accompaniment')] = ax.id;
                if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'ambient');
            }
        });

        if (hints.accompaniment && !usedLayers.has('accompaniment')) {
            events.push(...this.renderSidechainedPad(epoch, resChord, tension).flatMap(e => this.rippleLongNote(e, resChord, 1.5)));
            layerAxioms.accompaniment = 'Generative Cloud';
        }

        if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension);
            events.push(...p.events.flatMap(e => this.rippleLongNote(e, resChord, 0.8)));
            layerAxioms.piano = p.style;
        }

        if (hints.harmony && !usedLayers.has('harmony')) {
            const h = this.renderDerivativeHarmony(resChord, epoch, tension);
            if (h.length > 0) {
                events.push(...h.flatMap(e => this.rippleLongNote(e, resChord, 2.0)));
                layerAxioms.harmony = 'Orchestral Accents';
            }
        }

        // 4. Drums
        if (hints.drums) {
            events.push(...this.renderSonicLandscape(epoch, tension));
            layerAxioms.drums = 'Sonic Landscape';
        }

        return {
            events, tension, beautyScore: 0.9,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            instrumentOverrides,
            activeAxioms: layerAxioms,
            narrative: `Ambient Evolution: ${this.currentTrackName} [Swell Phrasing Active]`
        };
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        const rawBarNotes = this.currentTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);
        let barNotes = rawBarNotes.map(n => ({ ...n, t: n.t - offset }));
        
        if (this.currentMutationType === 'inversion') barNotes = invertPhrase(barNotes);
        else if (this.currentMutationType === 'jitter') barNotes = applyRhythmicJitter(barNotes, this.seed + epoch);

        return barNotes.map(n => {
            const isLong = n.d > 3;
            return {
                type: 'melody', 
                note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
                time: n.t * TICK_TO_BEAT, 
                duration: n.d * TICK_TO_BEAT, 
                weight: isLong ? 0.85 : 0.65,
                technique: isLong ? 'swell' : 'pick', 
                dynamics: 'p', 
                phrasing: 'legato',
                params: isLong ? { attack: 0.8, release: 2.5 } : { attack: 0.1, release: 1.5 }
            };
        });
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentBassTheme.startBar, totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        const rawBarNotes = this.currentBassTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);
        let barNotes = rawBarNotes.map(n => ({ ...n, t: n.t - offset }));

        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: n.t * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.9,
            technique: 'pulse', dynamics: 'p', phrasing: 'detached'
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, epoch - (epoch % totalBars), totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        let barNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({ ...n, t: n.t - offset }));

        return barNotes.map(n => ({
            type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: n.t * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.5,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderPulsatingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = this.constrainBassOctave(chord.rootNote - 12);
        return [{
            type: 'bass', note: root, time: 0, duration: 4.0, weight: 0.8,
            technique: 'pulse', dynamics: 'p', phrasing: 'legato'
        }];
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
        return intervals.map((interval, i) => ({
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval),
            time: 0, duration: 4.0, weight: 0.25, technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number): { events: FractalEvent[], style: string } {
        if (this.random.next() > 0.4) return { events: [], style: 'none' };
        const root = chord.rootNote + 24;
        return {
            style: 'Ambient Echoes',
            events: [{
                type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(root + (chord.chordType === 'minor' ? 3 : 4)),
                time: [1.5, 4.5, 7.5, 10.5][this.random.nextInt(4)] * TICK_TO_BEAT,
                duration: 0.5, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            }]
        };
    }

    private renderDerivativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        if (calculateMusiNum(epoch, 13, this.seed, 10) > 2) return [];
        return [{
            type: 'harmony', note: this.constrainAccompanimentOctave(chord.rootNote + 24),
            time: 0, duration: 4.0, weight: 0.2, technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }];
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (this.random.next() > 0.3) return [];
        const scale = [0, 2, 3, 5, 7, 10, 12];
        return [{
            type: 'melody', 
            note: chord.rootNote + 12 + scale[calculateMusiNum(epoch, 7, this.seed, scale.length)],
            time: [3, 6, 9][this.random.nextInt(3)] * TICK_TO_BEAT,
            duration: 2.5, 
            weight: 0.7, 
            technique: 'swell', 
            dynamics: 'p', 
            phrasing: 'legato',
            params: { attack: 1.2, release: 3.5 }
        }];
    }

    private renderSonicLandscape(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;
        const hitCount = 1 + calculateMusiNum(epoch, 3, this.seed, 3);
        for (let i = 0; i < hitCount; i++) {
            const perc = kit.perc[calculateMusiNum(epoch + i, 11, this.seed, kit.perc.length)];
            events.push({
                type: perc as any, note: 48, time: (this.random.next() * TICKS_PER_BAR) * TICK_TO_BEAT, duration: 2.0, weight: 0.3,
                technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.random.next() * 1.8) - 0.9
            });
        }
        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 48) v += 12; return v; }
}
