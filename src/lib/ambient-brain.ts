
/**
 * @fileOverview Ambient Brain V120.0 — "Ensemble Sync Protocol Active".
 * #ЗАЧЕМ: ПЛАН №1279 — Синхронизация с логикой BluesBrain (Rolling Ribbon + Golden Notes).
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
    applyRhythmicJitter,
    safeSemitoneToDegree
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    // --- State & Memory ---
    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private currentLickId: string = '';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private currentMutationType: string = 'none';

    // #ЗАЧЕМ: ПЛАН №1267. Межтактовая память для борьбы с гудением.
    private heldNotesState: Map<string, { midi: number, barCount: number }> = new Map();

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
     * #ЗАЧЕМ: Протокол «Respiration» (ПЛАН №1266).
     * #ЧТО: Дробление длинных нот, микро-лики (50%) и спектральное «дыхание».
     */
    private rippleLongNote(e: FractalEvent, chord: GhostChord, chunkDurBase: number = 1.5): FractalEvent[] {
        if (e.chordName) return [e]; 
        if (e.duration < 5.0) return [e]; 

        const rippled: FractalEvent[] = [];
        const useLick = this.random.next() < 0.50; 
        
        const numChunks = Math.max(2, Math.ceil(e.duration / chunkDurBase));
        const chunkDur = e.duration / numChunks;
        
        const baseMidi = e.note;
        const isMinor = chord.chordType === 'minor';
        const neighborSemitone = isMinor ? 3 : 2; 

        for (let i = 0; i < numChunks; i++) {
            const jitter = 0.9 + (this.random.next() * 0.2 - 0.1); 
            let note = baseMidi;
            if (useLick && i === 1 && numChunks >= 3) {
                note += neighborSemitone;
            }

            rippled.push({
                ...e,
                note: note,
                time: e.time + (i * chunkDur),
                duration: chunkDur * 1.2, 
                weight: e.weight * jitter,
                technique: i === 0 ? e.technique : 'hit',
                params: { 
                    ...e.params, 
                    attack: 0.8, 
                    release: 2.5,
                    filterCutoff: 800 + (this.random.next() * 1200) 
                }
            });
        }
        return rippled;
    }

    /**
     * #ЗАЧЕМ: Протокол «Анти-Педаль» (ПЛАН №1267).
     * #ЧТО: Разрыв статики на 3-м такте удержания одной ноты.
     */
    private applyAntiPedal(part: string, events: FractalEvent[], chord: GhostChord): FractalEvent[] {
        if (events.length === 0) return events;

        // Определяем основную ноту такта
        const primary = events.find(e => e.time === 0) || events[0];
        const state = this.heldNotesState.get(part) || { midi: -1, barCount: 0 };

        if (primary.note === state.midi) {
            state.barCount++;
        } else {
            state.midi = primary.note;
            state.barCount = 1;
        }
        this.heldNotesState.set(part, state);

        // КРИЗИС 3-ГО ТАКТА
        if (state.barCount >= 3) {
            state.barCount = 0; // Сброс счетчика
            const strategy = this.random.nextInt(3);

            if (strategy === 0) {
                // Стратегия "Вздох": Слой замолкает
                return []; 
            } else if (strategy === 1) {
                // Стратегия "Гармонический прыжок": Уход в квинту
                return events.map(e => ({ 
                    ...e, 
                    note: e.note + 7, 
                    params: { ...e.params, narrative: 'Anti-Pedal Jump' } 
                }));
            } else {
                // Стратегия "Турбулентность": Усиленное дробление
                return events.flatMap(e => this.rippleLongNote(e, chord, 0.4));
            }
        }

        return events;
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
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axMoods = (Array.isArray(ax.mood) ? ax.mood : [ax.mood]).filter((m: any) => m != null && m !== '');
                return axGenres.includes(this.genre) && (axMoods.length === 0 || axMoods.includes(this.mood));
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

                // #ЗАЧЕМ: ПЛАН №1279. Вычисление границ ленты донора (как в BluesBrain).
                const maxDonorBars = Math.max(...filteredPool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                
                const sameOffsetPool = filteredPool.filter(ax => (ax.role === 'melody' || ax.role.toLowerCase().includes('accomp')) && (ax.barOffset || 0) === targetOffset);
                const variantIdx = calculateMusiNum(this.seed, 19, 0, sameOffsetPool.length || 1);
                const selected = sameOffsetPool.length > 0 ? sameOffsetPool[variantIdx % sameOffsetPool.length] : basePool[0];

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentLickId = selected.id || 'DNA';
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };
                    }

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
        this.currentTimeScale = navInfo.currentPart.instrumentRules?.melody?.timeScale || 1;

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

        // #ЗАЧЕМ: СЦЕПКА СИБЛИНГОВ. Единая позиция для всего ансамбля.
        const ensembleTotalBars = Math.max(1, Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR));
        const ensembleAnchor = this.currentTheme ? this.currentTheme.startBar : epoch;
        const mosaicBar = this.getMosaicIndex(epoch, ensembleAnchor, ensembleTotalBars, tension);

        // 1. Bass
        if (hints.bass) {
            let b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension, mosaicBar)
                : this.renderPulsatingBass(resChord, epoch, tension);
            
            b = this.applyAntiPedal('bass', b, resChord);
            events.push(...b.flatMap(e => this.rippleLongNote(e, resChord, 0.6)));
            layerAxioms.bass = this.currentBassTheme ? 'Sibling DNA' : 'Algorithm Pulse';
        }

        // 2. Melody
        if (hints.melody) {
            let m: FractalEvent[] = [];
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                m = this.renderHeritageMelody(epoch, resChord, tension, this.currentTimeScale, mosaicBar);
                if (m.length > 0) {
                    layerAxioms.melody = this.currentTheme.id;
                }
            }
            
            if (m.length === 0) {
                m = this.renderGapFiller(epoch, resChord, tension);
                layerAxioms.melody = 'Gap-Filler';
            }
            
            m = this.applyAntiPedal('melody', m, resChord);
            events.push(...m.flatMap(e => this.rippleLongNote(e, resChord, 1.0)));
            if (this.currentPreferredInstrument) instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'ambient');
        }

        // 3. Accompaniment & Piano
        const usedLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('accomp') ? 'accompaniment' : (role.includes('harmony') ? 'harmony' : null));
            if (target && hints[target] && !usedLayers.has(target)) {
                let rendered = this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension, mosaicBar);
                rendered = this.applyAntiPedal(target, rendered, resChord);
                events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord, 1.2)));
                usedLayers.add(target);
                layerAxioms[target === 'pianoAccompaniment' ? 'piano' : (target === 'harmony' ? 'harmony' : 'accompaniment')] = ax.id;
                if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'ambient');
            }
        });

        if (hints.accompaniment && !usedLayers.has('accompaniment')) {
            let pad = this.renderSidechainedPad(epoch, resChord, tension);
            pad = this.applyAntiPedal('accompaniment', pad, resChord);
            events.push(...pad.flatMap(e => this.rippleLongNote(e, resChord, 2.0)));
            layerAxioms.accompaniment = 'Generative Cloud';
        }

        if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension);
            if (p.events.length > 0) {
                const antiPedalPiano = this.applyAntiPedal('pianoAccompaniment', p.events, resChord);
                events.push(...antiPedalPiano.flatMap(e => this.rippleLongNote(e, resChord, 0.8)));
                layerAxioms.piano = p.style;
            }
        }

        if (hints.harmony && !usedLayers.has('harmony')) {
            const hResult = this.renderDerivativeHarmony(resChord, epoch, tension);
            if (hResult.events.length > 0) {
                events.push(...hResult.events.flatMap(e => this.rippleLongNote(e, resChord, 2.5)));
                layerAxioms.harmony = hResult.instrument === 'violin' ? 'Violin Whisper' : 'Guitar Chord';
                if (hResult.instrument) instrumentOverrides.harmony = hResult.instrument;
            }
        }

        // 4. Drums
        if (hints.drums) {
            events.push(...this.renderSonicLandscape(epoch, tension));
            layerAxioms.drums = 'Sonic Landscape';
        }

        // 5. Atmospheric Events
        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.9,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            instrumentOverrides,
            activeAxioms: layerAxioms,
            narrative: `Ambient Evolution: ${this.currentTrackName} [Ensemble Sync Active]`
        };
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, timeScale: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        
        let phrase = this.currentTheme.phrase;
        if (this.currentMutationType === 'inversion') phrase = invertPhrase(phrase);
        else if (this.currentMutationType === 'retrograde') phrase = retrogradePhrase(phrase);
        else if (this.currentMutationType === 'jitter') phrase = applyRhythmicJitter(phrase, this.seed + epoch);

        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const readingWindow = TICKS_PER_BAR / timeScale;
        const barNotes = phrase.filter(n => n.t >= offset && n.t < offset + readingWindow);
        
        const useNarrativeFilter = barNotes.length > 3;
        const goldenTicks = [0, 3, 6, 9];

        return barNotes.map(n => {
            const relativeTick = n.t - offset;
            const isGoldenCandidate = goldenTicks.some(gt => Math.abs(relativeTick - gt) < 0.1);
            
            let weight = 0.75;
            let durationScale = 1.25;
            let tech: Technique = (n.tech as any || 'pick');
            
            if (useNarrativeFilter) {
                if (isGoldenCandidate) {
                    weight = 0.95;
                    durationScale = 2.0; 
                    tech = 'vb';         
                } else {
                    weight = 0.3;        
                    durationScale = 0.4; 
                }
            }

            return {
                type: 'melody', 
                note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
                time: relativeTick * TICK_TO_BEAT * timeScale, 
                duration: (n.d * TICK_TO_BEAT * timeScale) * durationScale, 
                weight: weight,
                technique: tech, 
                dynamics: 'p', 
                phrasing: 'legato'
            };
        });
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        
        let phrase = this.currentBassTheme.phrase;
        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);

        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.85,
            technique: 'pulse', dynamics: 'p', phrasing: 'detached'
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number, mosaicBar: number): FractalEvent[] {
        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const rawBarNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({ ...n, t: n.t - offset }));

        return rawBarNotes.map(n => ({
            type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: n.t * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.45,
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.2, release: 4.5 }
        }));
    }

    private phraseBarCount(phrase: any[]): number {
        if (!phrase || phrase.length === 0) return 1;
        let maxT = 0;
        for (const n of phrase) if (n.t > maxT) maxT = n.t;
        return Math.max(1, Math.floor(maxT / TICKS_PER_BAR) + 1);
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
            time: 0, duration: 4.0, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 5.0 }
        }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents?: FractalEvent[]): { events: FractalEvent[], style: string } {
        if (this.random.next() > 0.3) return { events: [], style: 'none' };
        const root = chord.rootNote + 24;
        return {
            style: 'Ambient Echoes',
            events: [{
                type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(root + (chord.chordType === 'minor' ? 3 : 4)),
                time: [1.5, 4.5, 7.5, 10.5][this.random.nextInt(4)] * TICK_TO_BEAT,
                duration: 0.5, weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            }]
        };
    }

    private renderDerivativeHarmony(chord: GhostChord, epoch: number, tension: number): { events: FractalEvent[], instrument: string | null } {
        const events: FractalEvent[] = [];
        let instrument: string | null = null;
        if (calculateMusiNum(epoch, 11, this.seed, 100) < 12) {
            const rootNote = chord.rootNote;
            const rootName = NOTE_NAMES[rootNote % 12] || 'C';
            const chordName = rootName + (chord.chordType === 'minor' ? 'm' : '');
            instrument = 'guitarChords';
            events.push({
                type: 'harmony', note: this.constrainAccompanimentOctave(rootNote + 12),
                time: 0, duration: 4.0, weight: 0.45, technique: 'hit', dynamics: 'p',
                phrasing: 'staccato', chordName: chordName, pan: 0.45, params: { genre: 'ambient' } 
            });
        } else if (calculateMusiNum(epoch + 1, 13, this.seed, 100) < 6) {
            instrument = 'violin';
            events.push({
                type: 'harmony', note: this.constrainAccompanimentOctave(chord.rootNote + 24),
                time: 1.0 * TICK_TO_BEAT, duration: 3.0, weight: 0.4, technique: 'swell',
                dynamics: 'p', phrasing: 'legato', pan: -0.45, params: { attack: 2.0, release: 4.5 }
            });
        }
        return { events, instrument };
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const scale = [0, 2, 3, 5, 7, 10, 12];
        return [{
            type: 'melody', 
            note: chord.rootNote + 12 + scale[calculateMusiNum(epoch, 7, this.seed, scale.length)],
            time: [3, 6, 9][this.random.nextInt(3)] * TICK_TO_BEAT,
            duration: 2.5, 
            weight: 0.65, 
            technique: 'swell', 
            dynamics: 'p', 
            phrasing: 'legato',
            params: { attack: 1.2, release: 3.5 }
        }];
    }

    private renderSonicLandscape(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;
        const hitCount = 2 + calculateMusiNum(epoch, 3, this.seed, 2);
        for (let i = 0; i < hitCount; i++) {
            const perc = kit.perc[calculateMusiNum(epoch + i, 11, this.seed, kit.perc.length)];
            events.push({
                type: perc as any, note: 48, time: (this.random.next() * TICKS_PER_BAR) * TICK_TO_BEAT, duration: 0.5, weight: 0.25,
                technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.random.next() * 1.6) - 0.8
            });
        }
        return events;
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        if (epoch < 4) return [];
        const events: FractalEvent[] = [];
        const seedVal = this.seed + epoch;
        if (calculateMusiNum(seedVal, 13, 0, 100) < 12) {
            const categories = ['ELECTRONIC', 'DARK'];
            const category = categories[calculateMusiNum(epoch, 17, this.seed, categories.length)];
            events.push({
                type: 'sparkle', note: 60, time: this.random.next() * 3.5, duration: 4.0, weight: 0.7,
                technique: 'hit', dynamics: 'p', phrasing: 'legato', params: { category, genre: this.genre }
            });
        }
        const breathChance = tension < 0.3 ? 15 : 8;
        if (calculateMusiNum(seedVal + 7, 17, 0, 100) < breathChance) {
            events.push({
                type: 'sfx', note: 60, time: 1.0 + this.random.next() * 2.5, duration: 4.0, weight: 0.6,
                technique: 'hit', dynamics: 'p', phrasing: 'legato', params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'voice', weight: 1.0 }] } }
            });
        }
        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 71) v -= 12; while (v < 48) v += 12; return v; }
}
