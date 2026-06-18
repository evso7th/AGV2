
/**
 * @fileOverview Psybient Brain V3.1 — "Spiral Alchemy Protocol".
 * #ЗАЧЕМ: Трансформация Хард-Рок Наследия в Псиамбиент.
 * #ЧТО: Циклическая ДНК-логика, Регги-ударные, ликвидация гудения через ритмическое сито.
 * #ОБНОВЛЕНО (ПЛАН №1229): Добавлены редкие гармонии, спарклы и активное заполнение пауз.
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
    decompressCompactPhrase,
    resolveSemanticTimbre,
    mergeIdenticalNotes,
    keyToMidiRoot,
    normalizeStr,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

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

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string }[] = [];

    private soloistBusyUntilBar: number = -1;
    private drumRestUntilBar: number = -1; 
    private currentMutationType: string = 'none';
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;

    private readonly MELODY_CEILING = 86;

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

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        if (totalBars <= 0) return 0;
        const startOffset = calculateMusiNum(this.seed, 13, 0, totalBars);
        if (this.isImprovising) {
            return calculateMusiNum(epoch + startOffset, 7, this.seed, totalBars);
        }
        const barsElapsed = epoch - startEpoch;
        return (barsElapsed + startOffset) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = [];
        this.currentDrumAxioms = [];
        this.currentBassTheme = null;
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;

        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool = effectiveAnchor 
            ? poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor)
            : poolToUse.filter(ax => {
                const genres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return genres.includes('rock') || genres.includes('blues') || genres.includes('trance') || genres.includes('psybient');
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

                const maxDonorBars = Math.max(...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === targetOffset);
                const selected = sameOffsetPool.length > 0 ? sameOffsetPool[calculateMusiNum(this.seed, 19, 0, sameOffsetPool.length)] : basePool[0];

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bass = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bass) this.currentBassTheme = { phrase: decompressCompactPhrase(bass.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bass.id };

                    const accs = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accs.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

                    const drums = poolToUse.filter(ax => ax.role.toLowerCase().includes('drum') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentDrumAxioms = drums.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role }));

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

    public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        
        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 17, this.seed, 100);
            if (roll < 50) this.currentMutationType = 'none';
            else if (roll < 70) this.currentMutationType = 'inversion';
            else this.currentMutationType = 'jitter';
        }

        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.reggae.standard;
        const instrumentOverrides: Partial<InstrumentHints> = {};
        const layerAxioms: Record<string, string> = { melody: 'none', bass: 'none', drums: 'none', accompaniment: 'none', harmony: 'none', piano: 'none' };

        // 1. DRUMS
        if (hints.drums) {
            const hDrums = this.renderHeritageDrums(epoch, tension);
            if (hDrums.length > 0) {
                events.push(...hDrums);
                layerAxioms.drums = 'Heritage Sync';
            } else {
                events.push(...this.renderPsybientReggaeGroove(epoch, tension, kit));
                layerAxioms.drums = 'Reggae-Neuro Hybrid';
            }
            events.push(...this.renderPsybientKitchen(epoch, tension, kit));
            if (epoch % 4 === 3) events.push(...this.renderNeuroFills(epoch, tension));
        }

        // 2. BASS
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension)
                : this.renderRollingBass(epoch, resChord, tension);
            events.push(...b.flatMap(e => this.rippleLongNote(e, resChord, 0.4))); 
            layerAxioms.bass = this.currentBassTheme ? 'Sibling DNA' : 'Neuro-Rolling';
        }

        // 3. ACCOMPANIMENT & PIANO
        const usedLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('accomp') ? 'accompaniment' : (role.includes('harmony') ? 'harmony' : null));
            if (target && hints[target] && !usedLayers.has(target)) {
                const rendered = this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension);
                events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord, 1.2)));
                usedLayers.add(target);
                layerAxioms[target === 'pianoAccompaniment' ? 'piano' : (target === 'harmony' ? 'harmony' : 'accompaniment')] = ax.id;
                if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'psybient');
            }
        });

        if (hints.accompaniment && !usedLayers.has('accompaniment')) {
            events.push(...this.renderSidechainedPad(epoch, resChord, tension).flatMap(e => this.rippleLongNote(e, resChord, 1.5)));
            layerAxioms.accompaniment = 'Spiral Pad';
        }

        if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension);
            events.push(...p.events.flatMap(e => this.rippleLongNote(e, resChord, 0.8)));
            layerAxioms.piano = p.style;
        }

        // --- NEW: HARMONY ACCENTS (Occasional Violin/Guitar Chords) ---
        if (hints.harmony && !usedLayers.has('harmony')) {
            const h = this.renderDerivativeHarmony(resChord, epoch, tension);
            if (h.length > 0) {
                events.push(...h.flatMap(e => this.rippleLongNote(e, resChord, 2.0)));
                layerAxioms.harmony = 'Atmospheric Accents';
            }
        }

        // 4. MELODY
        if (hints.melody) {
            let m: FractalEvent[] = [];
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                m = this.renderHeritageMelody(epoch, resChord, tension);
                layerAxioms.melody = this.currentTheme.id;
            } else {
                m = this.renderGapFiller(epoch, resChord, tension);
                layerAxioms.melody = 'Algorithm Accents';
            }
            events.push(...m.flatMap(e => this.rippleLongNote(e, resChord, 0.6)));
            if (this.currentPreferredInstrument) instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'psybient');
        }

        // --- NEW: ATMOSPHERIC EVENTS (Sparkles & SFX) ---
        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.85,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            instrumentOverrides,
            activeAxioms: layerAxioms,
            narrative: `Psybient Spiral: ${this.currentTrackName} [Movement Active]`
        };
    }

    private rippleLongNote(e: FractalEvent, chord: GhostChord, chunkDurBase: number = 0.8): FractalEvent[] {
        if (e.duration < 1.0) return [e]; 
        const rippled: FractalEvent[] = [];
        const numChunks = Math.max(1, Math.ceil(e.duration / chunkDurBase));
        const chunkDur = e.duration / numChunks;
        for (let i = 0; i < numChunks; i++) {
            rippled.push({
                ...e,
                time: e.time + (i * chunkDur),
                duration: chunkDur * 0.9,
                weight: e.weight * (1.0 - (i * 0.05)),
                technique: i === 0 ? e.technique : 'hit',
                params: { ...e.params, attack: 0.05, release: chunkDur * 2 }
            });
        }
        return rippled;
    }

    private renderPsybientReggaeGroove(epoch: number, tension: number, kit: any): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isOneDrop = tension < 0.6;
        if (!isOneDrop || epoch % 2 === 0) {
            events.push({ type: kit.kick[0] as any, note: 36, time: 0, duration: 0.1, weight: 1.1, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        }
        events.push({ type: kit.snare[0] as any, note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        if (tension > 0.7) {
            events.push({ type: kit.kick[0] as any, note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        }
        return events;
    }

    private renderPsybientKitchen(epoch: number, tension: number, kit: any): FractalEvent[] {
        const events: FractalEvent[] = [];
        const pool = kit.perc || [];
        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            if (this.random.next() < (0.15 + tension * 0.15)) {
                events.push({
                    type: pool[calculateMusiNum(epoch + t, 13, this.seed, pool.length)] as any,
                    note: 48, time: t * TICK_TO_BEAT, duration: 0.5, weight: 0.35,
                    technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.random.next() * 1.8) - 0.9
                });
            }
        }
        return events;
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        this.currentDrumAxioms.forEach(ax => {
            const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
            const offset = (epoch % totalBars) * TICKS_PER_BAR;
            ax.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).forEach(n => {
                events.push({
                    type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - offset) * TICK_TO_BEAT,
                    duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const offset = (epoch % totalBars) * TICKS_PER_BAR;
        return this.currentBassTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.95,
            technique: 'pulse', dynamics: 'f', phrasing: 'detached'
        }));
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        const subDiv = tension > 0.7 ? 1.5 : 3.0;
        for (let t = 0; t < TICKS_PER_BAR; t += subDiv) {
            events.push({
                type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: subDiv * TICK_TO_BEAT,
                weight: 0.8, technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
            });
        }
        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const offset = (epoch % totalBars) * TICKS_PER_BAR;
        return this.currentTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.85,
            technique: n.d > 3 ? 'vb' : 'pick', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const offset = (epoch % totalBars) * TICKS_PER_BAR;
        return phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.4,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12;
        const isMinor = chord.chordType === 'minor';
        const intervals = isMinor ? [0, 3, 7] : [0, 4, 7];
        return intervals.map((interval, i) => ({
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval),
            time: 0, duration: 4.0, weight: 0.25, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { gainCurve: [1.0, 0.2, 0.9, 0.3, 1.0] }
        }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number): { events: FractalEvent[], style: string } {
        if (this.random.next() > 0.4) return { events: [], style: 'Resting' };
        const root = chord.rootNote + 12;
        return {
            style: 'Staccato Accents',
            events: [{
                type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(root + (chord.chordType === 'minor' ? 3 : 4)),
                time: 0, duration: 0.5, weight: 0.6, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
            }]
        };
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (this.random.next() > (0.4 + tension * 0.2)) return [];
        const scale = [0, 2, 3, 5, 7, 10, 12];
        const t = [1.5, 3.0, 4.5, 7.5, 9.0, 10.5][calculateMusiNum(epoch, 7, this.seed, 6)];
        return [{
            type: 'melody', note: chord.rootNote + 12 + scale[calculateMusiNum(epoch + t, 11, this.seed, scale.length)],
            time: t * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.75,
            technique: 'pick', dynamics: 'p', phrasing: 'staccato'
        }];
    }

    private renderNeuroFills(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const fillTicks = [9, 10, 10.5, 11, 11.5];
        fillTicks.forEach((t, i) => {
            events.push({
                type: 'drum_Sonor_Classix_Mid_Tom', note: 48, time: t * TICK_TO_BEAT, duration: 0.2,
                weight: 0.6 + (i * 0.1), technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: -0.5 + (i * 0.2)
            });
        });
        return events;
    }

    private renderDerivativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        // Occasional harmonic accents (Violin/Guitar)
        if (calculateMusiNum(epoch, 17, this.seed, 10) > 2) return [];
        const root = chord.rootNote + 24;
        return [{
            type: 'harmony', note: this.constrainAccompanimentOctave(root),
            time: 0, duration: 4.0, weight: 0.2,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }];
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const rand = this.random.next();
        
        // Occasional Sparkles
        if (rand < (0.15 + tension * 0.1)) {
            events.push({
                type: 'sparkle', note: 60, time: this.random.next() * 4, duration: 4.0, weight: 0.8,
                technique: 'hit', dynamics: 'p', phrasing: 'legato', params: { category: 'electronic' }
            });
        }
        
        // Occasional SFX
        if (this.random.next() < (0.1 + tension * 0.05)) {
            events.push({
                type: 'sfx', note: 60, time: 1.5 + this.random.next() * 2, duration: 4.0, weight: 0.7,
                technique: 'hit', dynamics: 'p', phrasing: 'detached', 
                params: { genre: 'psybient', category: this.random.next() < 0.5 ? 'voice' : 'laser' }
            });
        }
        
        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 60) v += 12; return v; }
}
