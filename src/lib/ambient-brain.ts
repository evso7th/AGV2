/**
 * @fileOverview Ambient Brain V118.2 — "Velvet Standard".
 * #ЗАЧЕМ: Реализация октавного заслона (MIDI 71) для мягкого звучания.
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
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTickBass: number = 0;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private currentMutationType: string = 'none';
    private microTransposition: number = 0;

    private heldNotesState: Map<string, { midi: number, barCount: number }> = new Map();
    private lickHistory: string[] = [];

    // #ЗАЧЕМ: Вельветовый Стандарт. Ограничение 4-й октавой.
    private readonly MELODY_CEILING = 71;

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

    // #ЗАЧЕМ: ПЛАН №1480. Октавный враппинг для мелодии.
    private wrapMelody(midi: number): number {
        let v = midi;
        while (v > this.MELODY_CEILING) v -= 12;
        return v;
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean, isImprovising?: boolean) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (this.isImprovising !== undefined) this.isImprovising = isImprovising;
        if (this.cloudAxioms.length > 0 && this.useHeritage) this.soloistBusyUntilBar = -1;
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
                    if (first) {
                        this.sessionAnchorId = normalizeStr(first.compositionId);
                        effectiveAnchor = this.sessionAnchorId;
                        filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                        basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                    }
                }

                if (basePool.length === 0) {
                    this.soloistBusyUntilBar = epoch + 4;
                    return undefined;
                }

                const maxDonorBars = Math.max(4, ...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                
                const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === targetOffset);
                const freshLicks = sameOffsetPool.filter(ax => !this.lickHistory.includes(ax.id));
                
                let selected = null;
                if (freshLicks.length > 0) {
                    selected = freshLicks[this.random.nextInt(freshLicks.length)];
                } else if (sameOffsetPool.length > 0) {
                    selected = sameOffsetPool[this.random.nextInt(sameOffsetPool.length)];
                } else {
                    const anyFresh = basePool.filter(ax => !this.lickHistory.includes(ax.id));
                    selected = anyFresh.length > 0 ? anyFresh[this.random.nextInt(anyFresh.length)] : basePool[0];
                }

                if (selected) {
                    this.lickHistory.push(selected.id);
                    if (this.lickHistory.length > 50) this.lickHistory.shift();

                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };
                        this.currentAxiomMaxTickBass = (selected.bars || 4) * TICKS_PER_BAR;
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

    private applyMutationLogic(phrase: any[], tension: number, seed: number): any[] {
        let notes = [...phrase];
        if (this.currentMutationType === 'inversion') notes = invertPhrase(notes);
        else if (this.currentMutationType === 'retrograde') notes = retrogradePhrase(notes);
        else if (this.currentMutationType === 'jitter') notes = applyRhythmicJitter(notes, seed);
        else if (this.currentMutationType === 'phase_shift') {
            notes = notes.map(n => ({ ...n, t: n.t + 1.5 }));
        }

        if (this.currentMutationType === 'density_guard' && tension < 0.4) {
            notes = notes.filter((_, i) => i % 2 === 0);
        }

        if (this.currentMutationType === 'velocity_curve') {
            const total = notes.length;
            notes = notes.map((n, i) => {
                const p = i / (total || 1);
                return {
                    ...n,
                    params: {
                        ...n.params,
                        attack: 0.1 + (1 - p) * 0.8, 
                        release: 0.5 + p * 2.0      
                    },
                    phrasing: p < 0.5 ? 'legato' : 'staccato'
                };
            });
        }
        return notes;
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
            const roll = calculateMusiNum(epoch, 23, this.seed, 100);
            if (roll < 20) this.currentMutationType = 'none';
            else if (roll < 40) { this.currentMutationType = 'transpose'; this.microTransposition = [-2, 2, 5, -5][this.random.nextInt(4)]; }
            else if (roll < 55) this.currentMutationType = 'inversion';
            else if (roll < 70) this.currentMutationType = 'retrograde';
            else if (roll < 80) this.currentMutationType = 'phase_shift';
            else if (roll < 90) this.currentMutationType = 'density_guard';
            else this.currentMutationType = 'velocity_curve';
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
            let b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension)
                : this.renderPulsatingBass(resChord, epoch, tension);
            
            b = this.applyAntiPedal('bass', b, resChord);
            events.push(...b.flatMap(e => this.rippleLongNote(e, resChord, 0.6)));
            layerAxioms.bass = this.currentBassTheme ? 'Sibling DNA' : 'Algorithm Pulse';
        }

        // 2. Melody
        let m: FractalEvent[] = []; 
        if (hints.melody) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                m = this.renderHeritageMelody(epoch, resChord, tension);
                if (m.length > 0) layerAxioms.melody = this.currentTheme.id;
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
        const usedTargetLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('accomp') ? 'accompaniment' : (role.includes('harmony') ? 'harmony' : null));
            if (target && hints[target] && !usedTargetLayers.has(target)) {
                let rendered = this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension);
                rendered = this.applyAntiPedal(target, rendered, resChord);
                events.push(...rendered.flatMap(e => this.rippleLongNote(e, resChord, 1.2)));
                usedTargetLayers.add(target);
                layerAxioms[target === 'pianoAccompaniment' ? 'piano' : (target === 'harmony' ? 'harmony' : 'accompaniment')] = ax.id;
                if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'ambient');
            }
        });

        if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
            let pad = this.renderSidechainedPad(epoch, resChord, tension);
            pad = this.applyAntiPedal('accompaniment', pad, resChord);
            events.push(...pad.flatMap(e => this.rippleLongNote(e, resChord, 2.0)));
            layerAxioms.accompaniment = 'Generative Cloud';
        }

        if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension, m);
            if (p.events.length > 0) {
                const antiPedalPiano = this.applyAntiPedal('pianoAccompaniment', p.events, resChord);
                events.push(...antiPedalPiano.flatMap(e => this.rippleLongNote(e, resChord, 0.8)));
                layerAxioms.piano = p.style;
            }
        }

        if (hints.harmony && !usedTargetLayers.has('harmony')) {
            const h = this.renderDerivativeHarmony(resChord, epoch, tension);
            if (h.length > 0) {
                events.push(...h.flatMap(e => this.rippleLongNote(e, resChord, 2.5)));
                layerAxioms.harmony = 'Telecaster & Orchestral';
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
            narrative: `Ambient Evolution: ${this.currentTrackName} [Mut: ${this.currentMutationType.toUpperCase()}]`
        };
    }

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
                    attack: i === 0 ? (e.params?.attack || 0.8) : 0.8, 
                    release: 2.5,
                    filterCutoff: 800 + (this.random.next() * 1200) 
                }
            });
        }
        return rippled;
    }

    private applyAntiPedal(part: string, events: FractalEvent[], chord: GhostChord): FractalEvent[] {
        if (events.length === 0) return events;

        const primary = events.find(e => e.time === 0) || events[0];
        const state = this.heldNotesState.get(part) || { midi: -1, barCount: 0 };

        if (primary.note === state.midi) {
            state.barCount++;
        } else {
            state.midi = primary.note;
            state.barCount = 1;
        }
        this.heldNotesState.set(part, state);

        if (state.barCount >= 3) {
            state.barCount = 0; 
            const strategy = this.random.nextInt(3);

            if (strategy === 0) {
                return []; 
            } else if (strategy === 1) {
                return events.map(e => ({ 
                    ...e, 
                    note: e.note + 7, 
                    params: { ...e.params, narrative: 'Anti-Pedal Jump' } 
                }));
            } else {
                return events.flatMap(e => this.rippleLongNote(e, chord, 0.4));
            }
        }

        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        const rawBarNotes = this.currentTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({ ...n, t: n.t - offset }));
        const barNotes = this.applyMutationLogic(rawBarNotes, tension, this.seed + epoch);
        
        return barNotes.map(n => {
            const isLong = n.d > 3;
            // #ЗАЧЕМ: Вельветовый Стандарт.
            const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition;
            return {
                type: 'melody', 
                note: this.wrapMelody(rawNote),
                time: n.t * TICK_TO_BEAT, 
                duration: n.d * TICK_TO_BEAT, 
                weight: isLong ? 0.85 : 0.65,
                technique: isLong ? 'swell' : 'pick', 
                dynamics: 'p', 
                phrasing: n.phrasing || 'legato',
                params: { 
                    attack: n.params?.attack || 1.0, 
                    release: n.params?.release || 3.5 
                }
            };
        });
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTickBass / TICKS_PER_BAR);
        const startEpoch = this.currentBassTheme.startBar;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        const rawBarNotes = this.currentBassTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({ ...n, t: n.t - offset }));
        const barNotes = this.applyMutationLogic(rawBarNotes, tension, this.seed + epoch + 1);

        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.85,
            technique: 'pulse', dynamics: 'p', phrasing: 'detached'
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.max(1, Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR));
        const mosaicBar = this.getMosaicIndex(epoch, epoch - (epoch % totalBars), totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        const rawBarNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({ ...n, t: n.t - offset }));
        const barNotes = this.applyMutationLogic(rawBarNotes, tension, this.seed + epoch + 2);

        return barNotes.map(n => {
            const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition;
            const finalNote = type === 'pianoAccompaniment' ? this.wrapMelody(rawNote) : this.constrainAccompanimentOctave(rawNote);
            return {
                type, note: finalNote,
                time: (n.t) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.45,
                technique: 'swell', dynamics: 'p', phrasing: 'legato',
                params: { 
                    attack: n.params?.attack || 1.2, 
                    release: n.params?.release || 4.5 
                }
            };
        });
    }

    private renderPulsatingBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = this.constrainBassOctave(chord.rootNote - 12 + this.microTransposition);
        return [{
            type: 'bass', note: root, time: 0, duration: 4.0, weight: 0.8,
            technique: 'pulse', dynamics: 'p', phrasing: 'legato'
        }];
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.microTransposition;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
        return intervals.map((interval) => ({
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval),
            time: 0, duration: 4.0, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 5.0 }
        }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents?: FractalEvent[]): { events: FractalEvent[], style: string } {
        if (this.random.next() > 0.6) return { events: [], style: 'none' };
        
        const root = chord.rootNote + 24 + this.microTransposition;
        const ticks = [1.5, 4.5, 7.5, 10.5];
        
        const count = 1 + this.random.nextInt(3);
        const shuffledTicks = [...ticks].sort(() => this.random.next() - 0.5).slice(0, count);

        return {
            style: 'Ambient Echoes',
            events: shuffledTicks.map(t => {
                const rawNote = root + (this.random.next() < 0.4 ? 0 : (chord.chordType === 'minor' ? 3 : 4));
                return {
                    type: 'pianoAccompaniment', 
                    note: this.wrapMelody(rawNote),
                    time: t * TICK_TO_BEAT,
                    duration: 0.8, 
                    weight: 0.58, 
                    technique: 'hit', 
                    dynamics: 'p', 
                    phrasing: 'staccato',
                    params: { attack: 0.01, release: 2.5 }
                };
            })
        };
    }

    private renderDerivativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const guitarProbability = 0.3 + (tension * 0.4); 
        
        if (this.random.next() < guitarProbability) {
            const rootNote = chord.rootNote + this.microTransposition;
            const rootName = NOTE_NAMES[rootNote % 12] || 'C';
            const chordName = rootName + (chord.chordType === 'minor' ? 'm' : '');
            
            events.push({
                type: 'harmony',
                note: this.constrainAccompanimentOctave(rootNote + 12),
                time: 0,
                duration: 4.0,
                weight: 0.45, 
                technique: 'hit', 
                dynamics: 'p',
                phrasing: 'staccato',
                chordName: chordName,
                pan: 0.45, 
                params: { genre: 'ambient' } 
            });
        }
        return events;
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const scale = [0, 2, 3, 5, 7, 10, 12];
        const rawNote = chord.rootNote + 12 + scale[calculateMusiNum(epoch, 7, this.seed, scale.length)] + this.microTransposition;
        return [{
            type: 'melody', 
            note: this.wrapMelody(rawNote),
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
        const hitCount = 2 + this.random.nextInt(4);
        for (let i = 0; i < hitCount; i++) {
            const perc = kit.perc[calculateMusiNum(epoch + i, 11, this.seed, kit.perc.length)];
            events.push({
                type: perc as any, note: 48, time: (this.random.next() * TICKS_PER_BAR) * TICK_TO_BEAT, duration: 3.0, weight: 0.25,
                technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.random.next() * 1.6) - 0.8
            });
        }
        return events;
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.random.next() < 0.16) {
            const category = this.random.next() < 0.5 ? 'ORGANIC' : 'MELODIC';
            events.push({
                type: 'sparkle',
                note: 60,
                time: this.random.next() * 3.5, 
                duration: 4.0,
                weight: 0.7,
                technique: 'hit',
                dynamics: 'p',
                phrasing: 'legato',
                params: { category, genre: this.genre }
            });
        }

        if (this.random.next() < 0.14) {
            events.push({
                type: 'sfx',
                note: 60,
                time: 1.0 + this.random.next() * 2.5,
                duration: 4.0,
                weight: 0.6,
                technique: 'hit',
                dynamics: 'p',
                phrasing: 'legato',
                params: { mood: this.mood, genre: this.genre }
            });
        }

        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 48) v += 12; return v; }
}
