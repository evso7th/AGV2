/**
 * @fileOverview Psybient Brain V62.5 — "Living Pulse & Fill Supremacy".
 * #ЗАЧЕМ: Реализация ПЛАНА №1510. Возврат слышимых филлов, райдов и крэшей.
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

class SeededRNG {
  private state: number;
  constructor(seed: number) { this.state = seed; }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.state / Math.pow(2, 32);
  }
  nextInt(max: number): number { return Math.floor(this.next() * max); }
  chance(p: number): boolean { return this.next() < p / 100; }
}

export class TranceBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private rng: SeededRNG;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string, id: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private soloistBusyUntilBar: number = -1;
    private spiralTransposition: number = 0;
    private currentMutationType: string = 'none';

    private activeHarmonyInstrument: 'violin' | 'guitarChords' = 'guitarChords';
    private lastHarmonySwitchBar: number = -1;

    private readonly MELODY_CEILING = 88;

    constructor(seed: number, mood: Mood, genre: Genre, useHeritage: boolean = true) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.useHeritage = useHeritage;
        this.rng = new SeededRNG(seed);
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean, isImprovising?: boolean) {
        const wasEmpty = this.cloudAxioms.length === 0;
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;

        if (wasEmpty && this.cloudAxioms.length > 0 && this.useHeritage) {
            this.soloistBusyUntilBar = -1;
        }
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
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return axGenres.includes(this.genre) || axGenres.includes('trance');
            });

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
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === targetOffset);
                const variantIdx = calculateMusiNum(this.seed, 19, 0, sameOffsetPool.length || 1);
                const selected = sameOffsetPool.length > 0 ? sameOffsetPool[variantIdx % sameOffsetPool.length] : basePool[0];

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    let rawPhrase = decompressCompactPhrase(selected.phrase);
                    if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);
                    const cid = normalizeStr(selected.compositionId);
                    
                    const drumSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('drum') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentDrumAxioms = drumSiblings.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id }));

                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accompSiblings.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

                    const baseBars = selected.bars || 4;
                    this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
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
    ): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;

        if (epoch % 8 === 0) {
            const shifts = [0, 5, 7, -5];
            this.spiralTransposition = shifts[calculateMusiNum(epoch, 11, this.seed, shifts.length)];
        }

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 17, this.seed, 100);
            if (roll < 40) this.currentMutationType = 'none';
            else if (roll < 70) this.currentMutationType = 'inversion';
            else this.currentMutationType = 'jitter';
        }

        const events: FractalEvent[] = [];
        const isIntro = navInfo.currentPart.id === 'INTRO' || epoch < 4;
        
        if (epoch >= this.soloistBusyUntilBar && !isIntro) {
            this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot + this.spiralTransposition };
        const instrumentOverrides: Partial<InstrumentHints> = {};

        const ensembleTotalBars = Math.max(1, Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR));
        const ensembleAnchor = this.currentTheme ? this.currentTheme.startBar : epoch;
        const mosaicBar = this.getMosaicIndex(epoch, ensembleAnchor, ensembleTotalBars, tension);

        // 1. DRUMS (More varied, less "woodpecker")
        if (hints.drums) {
            // #ЗАЧЕМ: Акцентные крэши на границах.
            if (epoch % 16 === 0 || navInfo.isPartTransition) {
                events.push({ type: 'drum_crash2', note: 49, time: 0, duration: 4.0, weight: 0.45, technique: 'hit', dynamics: 'f', phrasing: 'legato' });
            }

            const heritageDrums = this.renderHeritageDrums(epoch, tension, mosaicBar);
            if (heritageDrums.length > 0) {
                events.push(...heritageDrums);
                events.push(...this.renderNeuroBaseSupport(epoch, tension));
            } else {
                events.push(...this.renderNeuroDrums(epoch, tension));
            }
            
            // #ЗАЧЕМ: ПЛАН №1510. Увеличенная частота филлов.
            if (epoch % 4 === 3 || tension > 0.82) {
                events.push(...this.renderComplexNeuroFill(epoch, tension));
            }
        }

        // 2. BASS
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension, mosaicBar)
                : this.renderRollingBass(epoch, resChord, tension);
            events.push(...b.flatMap(e => this.rippleLongNote(e, resChord, tension)));
        }

        // 3. SYNTHESIS: MELODY & ACCOMPANIMENT
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension, this.currentTimeScale, mosaicBar);
            }
            
            if (melodyEvents.length < 2) {
                melodyEvents = this.renderShimmerArp(epoch, resChord, tension);
            }

            melodyEvents.forEach(e => { 
                e.pan = (this.rng.next() * 1.2 - 0.6);
                e.weight *= 1.15; 
            });
            events.push(...melodyEvents.flatMap(e => this.rippleLongNote(e, resChord, tension)));
            if (this.currentPreferredInstrument) instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'psybient');
        }

        const usedTargetLayers = new Set<string>();
        if (!isIntro) {
            this.currentAccompAxioms.forEach(ax => {
                const role = ax.role.toLowerCase();
                let target: InstrumentPart | null = null;
                if (role.includes('piano')) target = 'pianoAccompaniment';
                else if (role.includes('accomp')) target = 'accompaniment';
                
                if (target && hints[target] && !usedTargetLayers.has(target)) {
                    const renders = this.renderSpecificHeritageAccompaniment(resChord, epoch, ax.phrase, target, tension, mosaicBar);
                    if (renders.length > 0) {
                        events.push(...renders.flatMap(e => this.rippleLongNote(e, resChord, tension)));
                        usedTargetLayers.add(target);
                        if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'psybient');
                    }
                }
            });
            
            if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
                events.push(...this.renderSidechainedPad(epoch, resChord, tension).flatMap(e => this.rippleLongNote(e, resChord, tension)));
            }

            if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
                const p = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
                if (p.events.length > 0) events.push(...p.events.flatMap(e => this.rippleLongNote(e, resChord, tension)));
            }
        }

        // 4. ATMOSPHERIC
        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.95,
            trackName: this.currentTrackName,
            activeAxioms: {
                melody: this.currentTheme ? this.currentTheme.id : 'Shimmer Arp',
                ensemble: 'Neuro-Climax'
            },
            narrative: `Neuro-Synthesis Awakening: [Mood: ${this.mood.toUpperCase()}]`
        };
    }

    private renderShimmerArp(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 24; 
        const scale = chord.chordType === 'minor' ? [0, 3, 7, 10, 14] : [0, 4, 7, 11, 14];
        
        for (let i = 0; i < 4; i++) {
            if (this.rng.chance(35 + tension * 30)) {
                const deg = scale[calculateMusiNum(epoch + i, 7, this.seed, scale.length)];
                events.push({
                    type: 'melody',
                    note: root + deg,
                    time: i * 1.5 * TICK_TO_BEAT,
                    duration: 0.5 * TICK_TO_BEAT,
                    weight: 0.65,
                    technique: 'pick',
                    dynamics: 'p',
                    phrasing: 'staccato',
                    params: { attack: 0.01, release: 1.5 }
                });
            }
        }
        return events;
    }

    /**
     * #ЗАЧЕМ: ПЛАН №1510. Реальные "пробежки" по томам и снейру.
     */
    private renderComplexNeuroFill(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const noteCount = 8 + Math.floor(tension * 6); 
        const tomSequence = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
        
        // Начинаем с 2.5 доли (тик 7.5) и до конца такта
        const startBeat = 2.5;
        const totalDuration = 1.5; // до конца 4-й доли
        
        for (let i = 0; i < noteCount; i++) {
            const beatTime = startBeat + (i / noteCount) * totalDuration;
            const inst = (i % 3 === 0) ? 'drum_snare' : tomSequence[i % 3];
            events.push({
                type: inst as any, note: 48, time: beatTime, duration: 0.1,
                weight: 0.85 + (i / noteCount) * 0.3, technique: 'hit', dynamics: 'f', phrasing: 'staccato'
            });
        }
        return events;
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isLight = ['joyful', 'epic', 'enthusiastic', 'dreamy'].includes(this.mood);
        
        if (epoch % 4 === 0) {
            if (this.rng.chance(15 + tension * 10)) {
                events.push({ 
                    type: 'sparkle', note: 60, time: this.rng.next() * 3, 
                    duration: 6.0, weight: 1.1, technique: 'hit', dynamics: 'p', 
                    params: { category: isLight ? 'MELODIC' : 'ORGANIC' } 
                });
            }
            
            if (this.rng.chance(12 + tension * 8)) {
                let category = 'common';
                if (isLight) category = this.rng.chance(60) ? 'laser' : 'voice';
                else category = this.rng.chance(60) ? 'dark' : 'glitch';

                events.push({ 
                    type: 'sfx', note: 60, time: 1.0 + this.rng.next() * 2.5, duration: 4.0, 
                    weight: 1.1, technique: 'hit', dynamics: 'mf', 
                    params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: category, weight: 1.0 }] } } 
                });
            }
        }
        return events;
    }

    private renderNeuroDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        [0, 3, 6, 9].forEach(t => {
            events.push({ type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        });
        [3, 9].forEach(t => {
            events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        });
        
        // #ЗАЧЕМ: ПЛАН №1510. Усиление оффбит-райда.
        if (tension > 0.6) {
            [1.5, 4.5, 7.5, 10.5].forEach(t => {
                events.push({ 
                    type: 'drum_ride_wetter', note: 51, time: t * TICK_TO_BEAT, 
                    duration: 1.5, weight: 0.45, technique: 'hit', dynamics: 'p', pan: 0.4 
                });
            });
        }

        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            if (this.rng.chance(65)) {
                events.push({ 
                    type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, 
                    time: t * TICK_TO_BEAT, duration: 0.05, weight: 0.45, 
                    technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: 0.1
                });
            }
        }
        return events;
    }

    private renderHeritageDrums(epoch: number, tension: number, mosaicBar: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        this.currentDrumAxioms.forEach(ax => {
            const offset = (mosaicBar % 4) * TICKS_PER_BAR;
            ax.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).forEach(n => {
                events.push({
                    type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - offset) * TICK_TO_BEAT, 
                    duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    private renderNeuroBaseSupport(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        [0, 6].forEach(t => {
            events.push({ type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        });
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.constrainBassOctave(chord.rootNote - 12);
        for (let t = 1.5; t < TICKS_PER_BAR; t += 1.5) {
            if (t % 3 !== 0) { 
                events.push({
                    type: 'bass', note: root, time: t * TICK_TO_BEAT, 
                    duration: 1.0 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
                });
            }
        }
        return events;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const offset = (mosaicBar % 4) * TICKS_PER_BAR;
        return this.currentBassTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'f', phrasing: 'detached'
        }));
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, timeScale: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const offset = (mosaicBar % 4) * TICKS_PER_BAR;
        const readingWindow = TICKS_PER_BAR / timeScale;
        return this.currentTheme.phrase.filter(n => n.t >= offset && n.t < offset + readingWindow).map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - offset) * TICK_TO_BEAT * timeScale, duration: (n.d * TICK_TO_BEAT * timeScale),
            weight: 0.9, technique: n.d > 3 ? 'vb' : 'pick', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private renderSpecificHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number, mosaicBar: number): FractalEvent[] {
        const offset = (mosaicBar % 4) * TICKS_PER_BAR;
        return phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type, note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
        return intervals.map((interval) => ({
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval),
            time: 0, duration: 4.0, weight: 0.55, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 2.5 }
        }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (this.rng.chance(30)) {
            const root = chord.rootNote + 12;
            events.push({
                type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(root + (chord.chordType === 'minor' ? 3 : 4)),
                time: 10.5 * TICK_TO_BEAT, duration: 0.5 * TICK_TO_BEAT, weight: 0.55,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });
        }
        return { events, style: 'Neuro Echo' };
    }

    private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'violin' | 'guitarChords'): FractalEvent[] {
        return [{ type: 'harmony', note: currentChord.rootNote + 12 + this.spiralTransposition, time: 0, duration: 3.5, weight: 0.45, technique: 'swell', dynamics: 'p', phrasing: 'legato' }];
    }

    private rippleLongNote(e: FractalEvent, chord: GhostChord, currentTension: number = 0.5): FractalEvent[] {
        if (e.duration < 3.0) return [e]; 
        const rippled: FractalEvent[] = [];
        const baseDur = currentTension > 0.8 ? 0.4 : 1.2;
        const numChunks = Math.ceil(e.duration / baseDur); 
        const chunkDur = e.duration / numChunks;
        for (let i = 0; i < numChunks; i++) {
            rippled.push({ ...e, time: e.time + (i * chunkDur), duration: chunkDur * 0.95, weight: e.weight * (0.9 + this.rng.next() * 0.2), params: { ...e.params, release: 2.0 } });
        }
        return rippled;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 48) v += 12; return n; }
}
