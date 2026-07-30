/**
 * @fileOverview Psybient Brain V56.0 — "Voice Saturation Active".
 * #ЗАЧЕМ: ПЛАН №1330 — Повышение частоты и разборчивости голосов.
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
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

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

    private readonly MELODY_CEILING = 84;

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
                const axMoods = (Array.isArray(ax.mood) ? ax.mood : [ax.mood]).filter((m: any) => m != null && m !== '');
                return axGenres.includes(this.genre) && (axMoods.length === 0 || axMoods.includes(this.mood));
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

    private selectHarmonyInstrument(epoch: number) {
        if (epoch % 8 === 0 && epoch !== this.lastHarmonySwitchBar) {
            this.lastHarmonySwitchBar = epoch;
            this.activeHarmonyInstrument = this.rng.next() < 0.5 ? 'violin' : 'guitarChords';
        }
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;

        if (epoch > 0 && epoch % 8 === 0) {
            const shifts = [0, 3, 5, 7, -2];
            this.spiralTransposition = shifts[calculateMusiNum(epoch, 11, this.seed, shifts.length)];
        }

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 17, this.seed, 100);
            if (roll < 60) this.currentMutationType = 'none';
            else if (roll < 80) this.currentMutationType = 'inversion';
            else this.currentMutationType = 'jitter';
        }

        const events: FractalEvent[] = [];
        const isIntro = navInfo.currentPart.id === 'INTRO' || epoch < 4;
        
        let newBpm: number | undefined;
        if (epoch >= this.soloistBusyUntilBar && !isIntro) {
            newBpm = this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot + this.spiralTransposition };
        const instrumentOverrides: Partial<InstrumentHints> = {};

        const ensembleTotalBars = Math.max(1, Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR));
        const ensembleAnchor = this.currentTheme ? this.currentTheme.startBar : epoch;
        const mosaicBar = this.getMosaicIndex(epoch, ensembleAnchor, ensembleTotalBars, tension);

        if (hints.drums) {
            const heritageDrums = this.renderHeritageDrums(epoch, tension, mosaicBar);
            if (heritageDrums.length > 0) {
                events.push(...heritageDrums);
                events.push(...this.renderNeuroBaseSupport(epoch, tension));
            } else {
                events.push(...this.renderNeuroDrums(epoch, tension));
            }
            events.push(...this.renderPsybientKitchen(epoch, tension));
            
            if (this.rng.chance(2)) {
                events.push({ type: 'drum_ride_wetter', note: 51, time: 0, duration: 4.0, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'legato' });
            }

            if (epoch % 4 === 3) events.push(...this.renderNeuroFills(epoch, tension));
        }

        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension, mosaicBar)
                : this.renderRollingBass(epoch, resChord, tension);
            events.push(...b.flatMap(e => this.rippleLongNote(e, resChord, tension)));
        }

        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension, this.currentTimeScale, mosaicBar);
            } else {
                melodyEvents = this.renderLegacySolo(epoch, resChord, tension);
            }
            melodyEvents.forEach(e => { e.pan = (this.rng.next() * 0.8 - 0.4); });
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

        if (hints.harmony && !isIntro) {
            this.selectHarmonyInstrument(epoch);
            const harEvents = this.renderDerivativeHarmony(resChord, epoch, this.activeHarmonyInstrument);
            harEvents.forEach(e => { e.pan = 0.5; });
            events.push(...harEvents.flatMap(e => this.rippleLongNote(e, resChord, tension)));
            instrumentOverrides.harmony = this.activeHarmonyInstrument;
        }

        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.9,
            trackName: this.currentTrackName,
            newBpm, instrumentOverrides,
            activeAxioms: {
                melody: this.currentTheme ? this.currentTheme.id : 'Spiral Narrative',
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Neuro Rolling',
                drums: this.currentDrumAxioms.length > 0 ? 'Heritage Sync' : 'Skilled Neuro'
            },
            narrative: `Psybient Spiral: [Kitchen V10.0 Active]`
        };
    }

    private renderHeritageDrums(epoch: number, tension: number, mosaicBar: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        this.currentDrumAxioms.forEach(ax => {
            const localBar = mosaicBar % this.phraseBarCount(ax.phrase);
            const offset = localBar * TICKS_PER_BAR;
            ax.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).forEach(n => {
                events.push({
                    type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - offset) * TICK_TO_BEAT, 
                    duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        });
        return events;
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
        return barNotes.map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - offset) * TICK_TO_BEAT * timeScale, duration: (n.d * TICK_TO_BEAT * timeScale) * 1.25,
            weight: 0.85, technique: (n.tech as any || 'pick'), dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        let phrase = this.currentBassTheme.phrase;
        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);

        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'f', phrasing: 'detached'
        }));
    }

    private renderSpecificHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number, mosaicBar: number): FractalEvent[] {
        let mutated = phrase;
        if (this.currentMutationType === 'inversion') mutated = invertPhrase(phrase);
        else if (this.currentMutationType === 'retrograde') mutated = retrogradePhrase(phrase);
        else if (this.currentMutationType === 'jitter') mutated = applyRhythmicJitter(phrase, this.seed + epoch);

        const localBar = mosaicBar % this.phraseBarCount(mutated);
        const offset = localBar * TICKS_PER_BAR;
        const barNotes = mutated.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);

        return barNotes.map(n => ({
            type, note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - offset) * TICK_TO_BEAT, 
            duration: n.d * TICK_TO_BEAT, 
            weight: 0.6,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private phraseBarCount(phrase: any[]): number {
        if (!phrase || phrase.length === 0) return 1;
        let maxT = 0;
        for (const n of phrase) if (n.t > maxT) maxT = n.t;
        return Math.max(1, Math.floor(maxT / TICKS_PER_BAR) + 1);
    }

    private renderNeuroBaseSupport(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        [0, 3, 6, 9].forEach(t => {
            events.push({ type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        });
        [3, 9].forEach(t => {
            events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        });
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
        
        for (let t = 0; t < TICKS_PER_BAR; t += 0.75) {
            const isStrong = t % 3 === 0;
            const isOff = t % 1.5 !== 0;
            const chance = isStrong ? 100 : (isOff ? tension * 40 : 60);
            if (this.rng.chance(chance)) {
                events.push({ 
                    type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, 
                    time: t * TICK_TO_BEAT, duration: 0.05, 
                    weight: isStrong ? 0.6 : 0.3, 
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: (t % 3 === 0 ? -0.2 : 0.2)
                });
            }
        }
        return events;
    }

    private renderNeuroFills(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const tomSequence = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
        
        [9, 10, 11].forEach((t, i) => {
            events.push({
                type: tomSequence[i] as any, note: 48, time: t * TICK_TO_BEAT, duration: 0.6,
                weight: 0.8 + (tension * 0.2), technique: 'hit', dynamics: 'mf', 
                phrasing: 'staccato', pan: Math.sin(t) * 0.8
            });
        });
        return events;
    }

    private renderPsybientKitchen(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        for (let t = 0; t < TICKS_PER_BAR; t += 3.0) { 
            if (this.rng.chance(30 + tension * 20)) {
                events.push({
                    type: 'sfx', note: 60, time: t * TICK_TO_BEAT, duration: 0.4, 
                    weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'detached', 
                    pan: (this.rng.next() * 1.8) - 0.9,
                    params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'tube', weight: 1.0 }] } }
                });
            }
        }
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = this.constrainBassOctave(chord.rootNote - 12);
        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            events.push({
                type: 'bass', note: root, time: (t + 0.1) * TICK_TO_BEAT, 
                duration: 1.2 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'detached', params: { filterEnv: 1000 + tension * 2000 }
            });
        }
        return events;
    }

    private renderLegacySolo(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const lickKeys = Object.keys(BLUES_SOLO_LICKS).filter(k => k.startsWith('LN_'));
        const key = lickKeys[calculateMusiNum(epoch, 13, this.seed, lickKeys.length)];
        const lick = BLUES_SOLO_LICKS[key];
        if (!lick) return [];
        return decompressCompactPhrase(lick.phrase as any).map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: n.t * TICK_TO_BEAT, duration: (n.d * TICK_TO_BEAT) * 1.25, weight: 0.9, 
            technique: n.d > 3 ? 'vb' : 'pick', dynamics: 'mf', phrasing: 'legate'
        }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (melodyEvents.length === 0) return { events: [], style: 'Waiting' };
        const isMinor = chord.chordType === 'minor';
        const thirdInterval = isMinor ? 3 : 4;
        melodyEvents.forEach((m, i) => {
            if (i % 3 === 0) {
                events.push({
                    ...m, type: 'pianoAccompaniment', note: m.note + thirdInterval,
                    weight: 0.68, technique: 'hit', phrasing: 'staccato', params: { ...m.params, release: 2.5 }
                });
            }
        });
        return { events, style: "Dynamic Shadow" };
    }

    private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'violin' | 'guitarChords'): FractalEvent[] {
        return [{ type: 'harmony', note: currentChord.rootNote + 12 + this.spiralTransposition, time: 0, duration: 3.2, weight: 0.4, technique: 'swell', dynamics: 'p', phrasing: 'legate' }];
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const isMinor = chord.chordType === 'minor';
        const intervals = isMinor ? [0, 3, 7, 10] : [0, 4, 7, 11];
        const events: FractalEvent[] = [];
        [0, 1, 2, 3].forEach(t => {
            intervals.forEach((interval, i) => {
                events.push({
                    type: 'accompaniment', 
                    note: chord.rootNote + 12 + interval + this.spiralTransposition, 
                    time: t, 
                    duration: 0.75, 
                    weight: 0.6 - (i * 0.05), 
                    technique: 'swell', dynamics: 'p', phrasing: 'legato', 
                    pan: (i % 2 === 0 ? -0.6 : 0.6), 
                    params: { attack: 0.1, release: 0.4, gainCurve: [1.0, 0.1, 0.9, 0.2, 1.0, 0.3, 1.0] }
                });
            });
        });
        return events;
    }

    /**
     * #ЗАЧЕМ: Реализация ПЛАНА №1330 — Voice Saturation.
     * #ЧТО: Повышена частота появления голосов в Psybient.
     */
    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        if (epoch < 12) return [];
        const events: FractalEvent[] = [];
        if (this.rng.chance(12)) {
            events.push({ 
                type: 'sparkle', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, 
                duration: 6.0, weight: 1.2, technique: 'hit', dynamics: 'mf', 
                phrasing: 'legato', params: { category: this.rng.chance(60) ? 'MELODIC' : 'ORGANIC' } 
            });
        }
        // #ЗАЧЕМ: ПЛАН №1330. Вероятность SFX повышена до 15-25%, вес голоса в категории — до 70%.
        const breathChance = tension < 0.4 ? 25 : 15;
        if (this.rng.chance(breathChance)) {
            events.push({ 
                type: 'sfx', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, duration: 4.0, 
                weight: 1.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', 
                params: { 
                    mood: this.mood, 
                    genre: this.genre, 
                    rules: { 
                        categories: [
                            { name: 'voice', weight: 0.70 }, // Значительно повышено
                            { name: 'glitch', weight: 0.30 }
                        ] 
                    } 
                } 
            });
        }
        return events;
    }

    private rippleLongNote(e: FractalEvent, chord: GhostChord, currentTension: number = 0.5): FractalEvent[] {
        if (e.duration < 3.5) return [e]; 
        const rippled: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const ripplePool = isMinor ? [0, 3, 7, 8, 10] : [0, 4, 7, 9, 11]; 
        const baseDur = currentTension > 0.7 ? 0.6 : 1.5;
        const numChunks = Math.ceil(e.duration / baseDur); 
        const chunkDur = e.duration / numChunks;
        const baseOctaveMidi = Math.floor(e.note / 12) * 12;
        for (let i = 0; i < numChunks; i++) {
            let note: number;
            if (i === 0) { note = e.note; } 
            else {
                const seedOffset = Math.floor(e.time * 12);
                const idx = calculateMusiNum(seedOffset + i, 13, this.seed, ripplePool.length);
                note = baseOctaveMidi + ripplePool[idx];
            }
            const rawType = Array.isArray(e.type) ? e.type[0] : e.type;
            let finalNote = note;
            if (rawType === 'bass') finalNote = this.constrainBassOctave(note);
            else if (rawType === 'melody') finalNote = Math.min(note, this.MELODY_CEILING);
            else finalNote = this.constrainAccompanimentOctave(note);
            rippled.push({ ...e, note: finalNote, time: e.time + (i * chunkDur), duration: chunkDur * 1.15, params: { ...e.params, attack: i === 0 ? (e.params?.attack || 0.5) : 0.8, release: 2.5 } });
        }
        return rippled;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 83) v -= 12; while (v < 48) v += 12; return n; }
}
