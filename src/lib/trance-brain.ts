/**
 * @fileOverview Psybient Brain V66.0 — "Universal Mutation Matrix".
 * #ЗАЧЕМ: Реализация ПЛАНА №1440. Включение транспозиции, ретрограда и новых алгоритмов.
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
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private soloistBusyUntilBar: number = -1;
    private currentMutationType: string = 'none';
    private microTransposition: number = 0;

    private readonly MELODY_CEILING = 88;

    constructor(seed: number, mood: Mood, genre: Genre, useHeritage: boolean = true) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.useHeritage = useHeritage;
        this.rng = new SeededRNG(seed);
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean, isImprovising?: boolean) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;
        if (this.cloudAxioms.length > 0 && this.useHeritage) this.soloistBusyUntilBar = -1;
    }

    private phraseBarCount(phrase: any[]): number {
        if (!phrase || phrase.length === 0) return 1;
        let maxT = 0;
        for (const n of phrase) if (n.t > maxT) maxT = n.t;
        return Math.max(1, Math.floor(maxT / TICKS_PER_BAR) + 1);
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        if (totalBars <= 0) return 0;
        const startOffset = calculateMusiNum(this.seed, 13, 0, totalBars);
        if (this.isImprovising) return calculateMusiNum(epoch + startOffset, 7, this.seed, totalBars);
        const barsElapsed = epoch - startEpoch;
        return (barsElapsed + startOffset) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = [];
        this.currentBassTheme = null;
        this.currentTheme = null;
        
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool = effectiveAnchor 
            ? poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor)
            : poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                return axGenres.includes('trance') || axGenres.includes('psybient') || axGenres.includes('rock') || axGenres.includes('blues');
            });

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const first = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(first.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                }

                const baseBars = Math.max(4, ...filteredPool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, baseBars, tension);
                const sameOffsetPool = filteredPool.filter(ax => (ax.barOffset || 0) === targetOffset && (ax.role === 'melody' || ax.role.toLowerCase().includes('accomp')));
                const selected = sameOffsetPool.length > 0 ? sameOffsetPool[this.rng.nextInt(sameOffsetPool.length)] : basePool[0];

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bass = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bass) this.currentBassTheme = { phrase: decompressCompactPhrase(bass.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bass.id };

                    const accs = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accs.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

                    const axiomBars = selected.bars || 4;
                    this.currentAxiomMaxTick = axiomBars * TICKS_PER_BAR;
                    this.currentTheme = { phrase: mergeIdenticalNotes(decompressCompactPhrase(selected.phrase)), startBar: epoch, endBar: epoch + axiomBars, id: selected.id };
                    this.soloistBusyUntilBar = epoch + axiomBars;
                    return selected.nativeBpm || undefined;
                }
            }
        }
        this.currentTrackName = 'Algorithmic';
        this.soloistBusyUntilBar = epoch + 4;
        return undefined;
    }

    /** #ЗАЧЕМ: Унифицированный маппер мутаций. */
    private applyMutationLogic(phrase: any[], tension: number, seed: number): any[] {
        let notes = [...phrase];
        if (this.currentMutationType === 'inversion') notes = invertPhrase(notes);
        else if (this.currentMutationType === 'retrograde') notes = retrogradePhrase(notes);
        else if (this.currentMutationType === 'jitter') notes = applyRhythmicJitter(notes, seed);
        
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
                        attack: 0.05 + (1 - p) * 0.4, 
                        release: 0.1 + p * 1.5        
                    },
                    phrasing: p < 0.5 ? 'legato' : 'staccato'
                };
            });
        }
        return notes;
    }

    public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 23, this.seed, 100);
            if (roll < 30) this.currentMutationType = 'none';
            else if (roll < 45) { this.currentMutationType = 'transpose'; this.microTransposition = [-2, 2, 5, -5][this.rng.nextInt(4)]; }
            else if (roll < 60) this.currentMutationType = 'inversion';
            else if (roll < 75) this.currentMutationType = 'retrograde';
            else if (roll < 85) this.currentMutationType = 'density_guard';
            else this.currentMutationType = 'velocity_curve';
        }

        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];
        const instrumentOverrides: Partial<InstrumentHints> = {};

        const ensembleAnchor = this.currentTheme ? this.currentTheme.startBar : epoch;
        const ensembleTotalBars = Math.max(1, Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR));
        const mosaicBar = this.getMosaicIndex(epoch, ensembleAnchor, ensembleTotalBars, tension);

        // 1. DRUMS
        if (hints.drums) events.push(...this.renderNeuroDrums(epoch, tension));

        // 2. BASS
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension, mosaicBar)
                : this.renderRollingBass(epoch, resChord, tension);
            events.push(...b.flatMap(e => this.rippleLongNote(e, resChord, tension)));
        }

        // 3. SYNTHESIS: MELODY & ACCOMPANIMENT
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension, mosaicBar);
            }
            if (melodyEvents.length === 0 || this.rng.chance(15)) {
                melodyEvents.push(...this.renderShimmerArp(epoch, resChord, tension));
            }
            events.push(...melodyEvents.flatMap(e => this.rippleLongNote(e, resChord, tension)));
        }

        const usedTargetLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('harmony') ? 'harmony' : (role.includes('accomp') ? 'accompaniment' : null));
            if (target && hints[target] && !usedTargetLayers.has(target)) {
                const renders = this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension, mosaicBar);
                events.push(...renders.flatMap(e => this.rippleLongNote(e, resChord, tension)));
                usedTargetLayers.add(target);
            }
        });
        
        if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
            events.push(...this.renderSidechainedPad(epoch, resChord, tension).flatMap(e => this.rippleLongNote(e, resChord, tension)));
        }

        if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
            if (p.events.length > 0) events.push(...p.events.flatMap(e => this.rippleLongNote(e, resChord, tension)));
        }

        // 4. ATMOSPHERIC
        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.95,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            activeAxioms: { melody: this.currentTheme ? this.currentTheme.id : 'Neuro Arp', ensemble: 'Restored Sibling' },
            narrative: `Trance Evolution: ${this.currentTrackName} [Mut: ${this.currentMutationType.toUpperCase()}]`
        };
    }

    private renderNeuroDrums(epoch: number, tension: number): FractalEvent[] {
        const kit = DRUM_KITS.trance.melancholic;
        const events: FractalEvent[] = [];
        [0, 3, 6, 9].forEach(t => events.push({ type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 1.05, technique: 'hit', dynamics: 'f', phrasing: 'staccato' }));
        [3, 9].forEach(t => events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' }));
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.constrainBassOctave(chord.rootNote - 12 + this.microTransposition);
        [1, 2, 4, 5, 7, 8, 10, 11].forEach(t => {
            events.push({
                type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: 1.0 * TICK_TO_BEAT,
                weight: 0.85, technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
            });
        });
        return events;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        let phrase = this.currentBassTheme.phrase;
        phrase = this.applyMutationLogic(phrase, tension, this.seed + epoch);
        
        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        return phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.9, technique: 'pulse', dynamics: 'f', phrasing: 'detached'
        }));
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        let phrase = this.currentTheme.phrase;
        phrase = this.applyMutationLogic(phrase, tension, this.seed + epoch);

        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const goldenTicks = [0, 3, 6, 9];
        return phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => {
            const relT = n.t - offset;
            const isGold = goldenTicks.some(gt => Math.abs(relT - gt) < 0.1);
            return {
                type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition, this.MELODY_CEILING),
                time: relT * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT * (isGold ? 1.5 : 1.0),
                weight: isGold ? 0.95 : 0.4, technique: isGold ? 'vb' : 'pick', dynamics: 'mf', 
                phrasing: n.phrasing || 'legato',
                params: { attack: n.params?.attack, release: n.params?.release }
            };
        });
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number, mosaicBar: number): FractalEvent[] {
        let mutated = this.applyMutationLogic(phrase, tension, this.seed + epoch + 1);
        const localBar = mosaicBar % this.phraseBarCount(mutated);
        const offset = localBar * TICKS_PER_BAR;
        return mutated.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.microTransposition;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
        return intervals.map((interval) => ({ type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval), time: 0, duration: 4.0, weight: 0.4, technique: 'swell', dynamics: 'p', phrasing: 'legato' }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (melodyEvents.length > 0) {
            melodyEvents.forEach((m, i) => { if (i % 2 === 0) events.push({ ...m, type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(m.note + 7), weight: 0.5, technique: 'hit' }); });
            return { events, style: 'Shadow Support' };
        }
        return { events: [], style: 'none' };
    }

    private renderShimmerArp(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24 + this.microTransposition; 
        const scale = chord.chordType === 'minor' ? [0, 3, 7, 10, 14] : [0, 4, 7, 11, 14];
        return [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].filter(() => this.rng.chance(40 + tension * 40)).map(t => ({
            type: 'melody', note: root + scale[calculateMusiNum(epoch + t, 7, this.seed, scale.length)],
            time: t * TICK_TO_BEAT, duration: 0.5 * TICK_TO_BEAT, weight: 0.6, technique: 'pick', dynamics: 'p', phrasing: 'staccato'
        }));
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (epoch % 4 === 0 && this.rng.chance(25)) {
            const category = this.rng.chance(50) ? 'ORGANIC' : 'MELODIC';
            events.push({ 
                type: 'sparkle', note: 60, time: this.rng.next() * 3, duration: 4.0, 
                weight: 0.8, technique: 'hit', dynamics: 'p', params: { category } 
            });
        }
        return events;
    }

    private rippleLongNote(e: FractalEvent, chord: GhostChord, currentTension: number = 0.5): FractalEvent[] {
        if (e.duration < 3.0) return [e]; 
        const rippled: FractalEvent[] = [];
        const numChunks = Math.ceil(e.duration / 1.5); 
        const chunkDur = e.duration / numChunks;
        for (let i = 0; i < numChunks; i++) rippled.push({ ...e, time: e.time + (i * chunkDur), duration: chunkDur * 0.95, weight: e.weight * 0.9 });
        return rippled;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 48) v += 12; return v; }
}
