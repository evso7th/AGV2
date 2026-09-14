/**
 * @fileOverview Trance Brain V89.0 — "Heritage Assimilation".
 * #ЗАЧЕМ: Перевод Neuro Space на логику Наследия по образу Cyber Blues.
 * #ЧТО: 1. Внедрение Sibling Sovereignty (бас и аккомпанемент из того же донора).
 *       2. Применение Velvet Standard (MIDI 71) и Golden Note фильтрации.
 *       3. Сохранение нейро-ударных и спиральных арпеджио.
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
  nextInt(max: number): number { 
      if (max <= 0) return 0;
      return Math.floor(this.next() * max); 
  }
  chance(p: number): boolean { return this.next() < p / 100; }
}

export class TranceBrain {
    private rng: SeededRNG;
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;
    
    private currentAxiom: any[] = [];
    private currentAxiomMaxTick: number = 0;
    private currentBassAxiom: any[] = [];
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentLickId: string = '';
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' = 'ADAPTIVE';
    
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private soloistBusyUntilBar: number = -1;
    private soloistRestUntilBar: number = -1;
    private currentTimeScale: number = 1;
    
    private currentMutationType: string = 'none';
    private microTransposition: number = 0;
    private currentTransposition: number = 0;
    private lickHistory: string[] = [];

    private readonly MELODY_CEILING = 71;
    private readonly GOLDEN_TICKS = [0, 3, 6, 9];

    constructor(seed: number, mood: Mood, genre: Genre, useHeritage: boolean = true) {
        this.seed = seed;
        this.mood = mood;
        this.genre = genre;
        this.useHeritage = useHeritage;
        this.rng = new SeededRNG(seed);
    }

    private isGolden(tick: number): boolean {
        const relT = ((tick % TICKS_PER_BAR) + TICKS_PER_BAR) % TICKS_PER_BAR;
        return this.GOLDEN_TICKS.some(gt => Math.abs(relT - gt) < 0.1);
    }

    private wrapMelody(midi: number): number {
        let v = midi;
        if (!isFinite(v)) return 60;
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
        if (this.isImprovising) return calculateMusiNum(epoch + startOffset, 7, this.seed, totalBars);
        const barsElapsed = epoch - startEpoch;
        return Math.abs(barsElapsed + startOffset) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAxiom = [];
        this.currentBassAxiom = [];
        this.currentAccompAxioms = [];
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;
        this.ensembleStatus = 'ADAPTIVE';

        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool = effectiveAnchor 
            ? poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor)
            : poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const isTranceMatch = axGenres.some(g => ['trance', 'psybient', 'foundry'].includes(g));
                return isTranceMatch;
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

                const maxDonorBars = Math.max(4, ...basePool.map(ax => (ax.barOffset || 0) + (ax.bars || 4)));
                const tension = dna.tensionMap?.[epoch] ?? 0.5;
                const targetOffset = this.getMosaicIndex(epoch, 0, maxDonorBars, tension);
                
                const sameOffsetPool = basePool.filter(ax => (ax.barOffset || 0) === targetOffset);
                const freshLicks = sameOffsetPool.filter(ax => !this.lickHistory.includes(ax.id));

                let selected = null;
                if (freshLicks.length > 0) {
                    selected = freshLicks[this.rng.nextInt(freshLicks.length)];
                } else if (sameOffsetPool.length > 0) {
                    selected = sameOffsetPool[this.rng.nextInt(sameOffsetPool.length)];
                } else {
                    const anyFresh = basePool.filter(ax => !this.lickHistory.includes(ax.id));
                    selected = anyFresh.length > 0 ? anyFresh[this.rng.nextInt(anyFresh.length)] : basePool[0];
                }

                if (selected) {
                    this.lickHistory.push(selected.id);
                    if (this.lickHistory.length > 50) this.lickHistory.shift();

                    this.currentTrackName = selected.compositionId;
                    this.currentLickId = selected.id || 'DNA-Lick';
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    
                    let rawPhrase = decompressCompactPhrase(selected.phrase);
                    if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);
                    this.currentAxiom = rawPhrase;

                    const cid = normalizeStr(selected.compositionId);
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) this.currentBassAxiom = decompressCompactPhrase(bassSibling.phrase);

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accompSiblings.map(ax => ({
                        phrase: decompressCompactPhrase(ax.phrase),
                        role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument
                    }));

                    const baseBars = selected.bars || 4;
                    this.currentAxiomMaxTick = baseBars * TICKS_PER_BAR;
                    this.soloistBusyUntilBar = epoch + baseBars;
                    this.ensembleStatus = 'SIBLING';
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
                    }
                };
            });
        }
        return notes;
    }

    public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const bpm = dna.baseTempo || 75;
        const kit = DRUM_KITS.foundry[this.mood as any] || DRUM_KITS.foundry.melancholic;

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 29, this.seed, 100);
            if (roll < 25) this.currentMutationType = 'none';
            else if (roll < 40) { this.currentMutationType = 'transpose'; this.microTransposition = [-2, 2, 5, -5][this.rng.nextInt(4)]; }
            else if (roll < 55) this.currentMutationType = 'inversion';
            else if (roll < 70) this.currentMutationType = 'retrograde';
            else if (roll < 85) this.currentMutationType = 'jitter';
            else this.currentMutationType = 'none';
        }

        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        if (this.soloistRestUntilBar <= epoch) {
            if (this.rng.chance(1)) this.soloistRestUntilBar = epoch + 1; 
        }
        const isResting = epoch < this.soloistRestUntilBar;

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        let events: FractalEvent[] = [];
        const instrumentOverrides: Partial<InstrumentHints> = {};

        // 1. NEURO DRUMS (Preserved)
        if (hints.drums) events.push(...this.renderNeuroDrums(epoch, tension, kit));

        // 2. BASS (Hybrid: Sibling DNA or Rolling)
        if (hints.bass) {
            const b = (this.currentBassAxiom.length > 0 && epoch < this.soloistBusyUntilBar)
                ? this.renderHeritageBass(epoch, resChord, tension)
                : this.renderRollingBass(epoch, resChord, tension);
            events.push(...b); 
        }

        // 3. MELODY (Heritage Assimilated)
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isResting) {
            if (this.currentAxiom.length > 0 && epoch < this.soloistBusyUntilBar) {
                let activeAxiom = this.applyMutationLogic(this.currentAxiom, tension, this.seed + epoch);
                melodyEvents = this.renderMelodicSegment(epoch, resChord, dna, 'melody', activeAxiom, this.currentAxiomMaxTick, this.currentTimeScale, tension);
            }
            
            if (melodyEvents.length === 0 || this.rng.chance(20)) {
                melodyEvents.push(...this.renderShimmerArp(epoch, resChord, tension));
            }
            events.push(...melodyEvents); 

            if (this.currentPreferredInstrument) {
                instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'psybient');
            }
        }

        // 4. ACCOMPANIMENT (Sibling Logic)
        const usedTargetLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('harmony') ? 'harmony' : (role.includes('accomp') ? 'accompaniment' : null));
            if (target && hints[target] && !usedTargetLayers.has(target)) {
                let p = this.applyMutationLogic(ax.phrase, tension, this.seed + epoch + 1);
                const rendered = this.renderHeritageAccompaniment(resChord, epoch, p, target, dna, tension);
                events.push(...rendered);
                usedTargetLayers.add(target);
                if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'psybient');
            }
        });
        
        if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
            events.push(...this.renderSidechainedPad(epoch, resChord, tension)); 
        }

        if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
            const pResult = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
            if (pResult.events.length > 0) events.push(...pResult.events);
        }

        events.push(...this.renderAtmosphericEvents(epoch, tension));

        // Optimization for performance
        const maxEvents = Math.floor(100 * (120 / bpm));
        const prioritizedEvents = events.map(e => {
            let tier = 3;
            const type = String(e.type).toLowerCase();
            if (type.includes('kick') || type === 'bass' || type.includes('snare')) tier = 0; 
            else if (type === 'melody' && this.isGolden(e.time / TICK_TO_BEAT)) tier = 0; 
            else if (type === 'accompaniment') tier = 1; 
            return { ...e, tier };
        }).sort((a, b) => a.tier - b.tier).slice(0, maxEvents).sort((a, b) => a.time - b.time);

        return {
            events: prioritizedEvents, tension, beautyScore: 0.95,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            activeAxioms: { 
                melody: isResting ? 'Breath' : (this.currentAxiom.length > 0 ? this.currentLickId : 'Neuro Arp'), 
                ensemble: `${this.ensembleStatus}` 
            },
            narrative: `Neuro Space Epoch ${epoch} | DNA: ${this.currentTrackName}`
        };
    }

    private renderNeuroDrums(epoch: number, tension: number, kit: any): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kickSample = kit.kick[this.rng.nextInt(kit.kick.length)];
        const snareSample = kit.snare[0] || 'drum_snare';
        const hatSample = kit.hihat[0] || 'drum_open_hh_top2';
        [0, 3, 6, 9].forEach(t => events.push({ type: kickSample as any, note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.60, technique: 'hit', dynamics: 'f', phrasing: 'staccato' }));
        [1.5, 4.5, 7.5, 10.5].forEach(t => events.push({ type: hatSample as any, note: 42, time: t * TICK_TO_BEAT, duration: 0.05, weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'staccato' }));
        [3, 9].forEach(t => events.push({ type: snareSample as any, note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' }));
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.constrainBassOctave(chord.rootNote - 12 + this.microTransposition);
        [0, 3, 6, 9].forEach(t => {
            events.push({ type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: 1.0 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'f', phrasing: 'detached' });
        });
        return events;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (this.currentBassAxiom.length === 0) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        let notes = this.currentBassAxiom.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        notes = this.applyMutationLogic(notes, tension, this.seed + epoch);
        return notes.map(n => ({
            type: 'bass',
            note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.9,
            technique: 'pulse'
        }));
    }

    private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
        const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
        const barOffset = mosaicBar * (TICKS_PER_BAR / timeScale);
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
        const goldenTicks = [0, 3, 6, 9];
        const useNarrativeFilter = barNotes.length > 3;

        return barNotes.map((n) => {
            const relativeTick = n.t - barOffset;
            const isGolden = goldenTicks.some(gt => Math.abs(relativeTick - gt) < 0.1);
            let weight = 0.85;
            let durationScale = 1.0;
            if (useNarrativeFilter) {
                if (isGolden) { weight = 0.95; durationScale = 2.0; } 
                else { weight = 0.30; durationScale = 0.4; }
            } else {
                weight = isGolden ? 0.95 : 0.75;
                durationScale = isGolden ? 1.5 : 1.0;
            }
            const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition;
            return {
                type: type as any, 
                note: this.wrapMelody(rawNote),
                time: relativeTick * TICK_TO_BEAT * timeScale, 
                duration: (n.d * TICK_TO_BEAT * timeScale) * durationScale,
                weight, technique: isGolden ? 'vb' : 'pick', dynamics: 'mf', phrasing: 'legato'
            };
        });
    }

    private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => {
            const rawNote = chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition;
            const finalNote = type === 'pianoAccompaniment' ? this.wrapMelody(rawNote) : this.constrainAccompanimentOctave(rawNote);
            return {
                type, note: finalNote,
                time: (n.t - barOffset) * TICK_TO_BEAT, duration: Math.min(n.d, 6) * TICK_TO_BEAT,
                weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'legato'
            };
        });
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.microTransposition;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7];
        return intervals.map((interval) => ({ type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval), time: 0, duration: 4.0, weight: 0.7, technique: 'swell', dynamics: 'p', phrasing: 'legato' }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (melodyEvents.length > 0) {
            melodyEvents.forEach((m) => {
                 events.push({ ...m, type: 'pianoAccompaniment', note: this.wrapMelody(m.note + 7), weight: 0.375, technique: 'hit' });
            });
            return { events, style: 'Golden Support' };
        }
        return { events: [], style: 'none' };
    }

    private renderShimmerArp(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote + 24 + this.microTransposition; 
        const scale = chord.chordType === 'minor' ? [0, 3, 7, 10, 14] : [0, 4, 7, 11, 14];
        return [0, 3, 6, 9].filter(() => this.rng.chance(20)).map(t => ({
            type: 'melody', note: this.wrapMelody(root + scale[calculateMusiNum(epoch + t, 7, this.seed, scale.length)]),
            time: t * TICK_TO_BEAT, duration: 0.8 * TICK_TO_BEAT, weight: 0.9, technique: 'pick', dynamics: 'p', phrasing: 'staccato'
        }));
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.rng.chance(10)) {
            events.push({ type: 'sfx', note: 60, time: this.rng.next() * 3, duration: 4.0, weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'legato', params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'dark', weight: 0.6 }, { name: 'voice', weight: 0.4 }] } } });
        }
        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 48) v += 12; return v; }
}
