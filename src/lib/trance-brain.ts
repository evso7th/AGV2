
/**
 * @fileOverview Psybient Brain V4.2 — "Atmospheric Purge".
 * #ЗАЧЕМ: Точечная очистка Псиамбиента от избыточного шума.
 * #ЧТО: ПЛАН №1100 — Спарклы и SFX в 3 раза реже. Колокольчики выведены в редкие акценты.
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
    normalizePhraseGroup,
    decompressCompactPhrase,
    resolveSemanticTimbre,
    mergeIdenticalNotes,
    keyToMidiRoot,
    normalizeStr,
    TICKS_PER_BAR,
    TICK_TO_BEAT
} from './music-theory';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

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
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string, id: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private soloistBusyUntilBar: number = -1;
    private spiralTransposition: number = 0;

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
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number): number {
        if (this.isImprovising) {
            return calculateMusiNum(epoch, 11, this.seed, totalBars);
        }
        const barsElapsed = epoch - startEpoch;
        const linearIndex = barsElapsed % totalBars;
        
        if (tension > 0.8) {
            const rand = calculateMusiNum(epoch, 17, this.seed, 100) / 100;
            if (rand < 0.15) return (linearIndex + 1) % totalBars;
        }
        
        return linearIndex;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = [];
        this.currentDrumAxioms = [];
        this.currentBassTheme = null;
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;
        
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        const targetAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : null;
        
        let filteredPool: any[] = [];
        if (targetAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === targetAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood];
            filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                return axGenres.includes('psybient') && (axMoods.includes(this.mood) || (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter));
            });
        }

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
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
                    if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);

                    const cid = normalizeStr(selected.compositionId);
                    
                    const drumSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('drum') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    drumSiblings.forEach(ax => {
                        this.currentDrumAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id });
                    });

                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };
                    }

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    accompSiblings.forEach(ax => {
                        this.currentAccompAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument });
                    });

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
            this.activeHarmonyInstrument = this.rng.chance(50) ? 'violin' : 'guitarChords';
        }
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, trackName?: string, activeAxioms?: any, narrative?: string, instrumentOverrides?: Partial<InstrumentHints>, newBpm?: number } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        
        if (epoch > 0 && epoch % 8 === 0) {
            const shifts = [0, 3, 5, 7, -2];
            this.spiralTransposition = shifts[calculateMusiNum(epoch, 11, this.seed, shifts.length)];
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

        // 1. DRUMS (DNA First)
        if (hints.drums) {
            const heritageDrums = this.renderHeritageDrums(epoch, tension);
            if (heritageDrums.length > 0) {
                events.push(...heritageDrums);
                events.push(...this.renderNeuroBaseSupport(epoch, tension));
            } else {
                events.push(...this.renderNeuroDrums(epoch, tension));
            }
            events.push(...this.renderPsybientKitchen(epoch, tension));
        }

        // 2. BASS (DNA First)
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
            } else {
                events.push(...this.renderRollingBass(epoch, resChord, tension));
            }
        }

        // 3. MELODY (DNA First)
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension);
            } else {
                melodyEvents = this.renderLegacySolo(epoch, resChord, tension);
            }
            events.push(...melodyEvents);
        }

        // 4. ACCOMPANIMENT & PIANO (DNA First Logic)
        const usedTargetLayers = new Set<string>();
        
        if (!isIntro) {
            this.currentAccompAxioms.forEach(ax => {
                const role = ax.role.toLowerCase();
                let target: InstrumentPart | null = null;
                
                if (role.includes('piano')) target = 'pianoAccompaniment';
                else if (role.includes('accomp')) target = 'accompaniment';
                
                if (target && hints[target] && !usedTargetLayers.has(target)) {
                    const renders = this.renderSpecificHeritageAccompaniment(resChord, epoch, ax.phrase, target, tension);
                    if (renders.length > 0) {
                        events.push(...renders);
                        usedTargetLayers.add(target);
                        if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target);
                    }
                }
            });

            // 5. GENERATIVE FALLBACKS
            if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
                events.push(...this.renderSidechainedPad(epoch, resChord, tension));
            }
            if (hints.pianoAccompaniment && !usedTargetLayers.has('pianoAccompaniment')) {
                const p = this.renderVirtuosoPiano(epoch, resChord, tension, melodyEvents);
                if (p.events.length > 0) events.push(...p.events);
            }
        }

        // 6. HARMONY (Alternating)
        if (hints.harmony && !isIntro) {
            this.selectHarmonyInstrument(epoch);
            const harEvents = this.renderDerivativeHarmony(resChord, epoch, this.activeHarmonyInstrument);
            events.push(...harEvents);
            instrumentOverrides.harmony = this.activeHarmonyInstrument;
        }

        // 7. ATMOSPHERE
        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.9,
            trackName: this.currentTrackName,
            newBpm,
            instrumentOverrides,
            activeAxioms: {
                melody: this.currentTheme ? `DNA: ${this.currentTheme.id}` : 'Spiral Narrative',
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Neuro Rolling',
                drums: this.currentDrumAxioms.length > 0 ? 'Heritage Sync' : 'Neuro Pumping',
                accompaniment: usedTargetLayers.has('accompaniment') ? 'Heritage DNA' : 'Sidechain Pad',
                piano: usedTargetLayers.has('pianoAccompaniment') ? 'Heritage DNA' : 'Shadow Virtuoso'
            },
            narrative: `Psybient Master: [DNA: ${this.currentTrackName}] [Heritage Layers: ${usedTargetLayers.size}] [Atmosphere: Wide]`
        };
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
            events.push({ type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        });
        for (let t = 0; t < TICKS_PER_BAR; t += 0.75) {
            events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        return events;
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;

        this.currentDrumAxioms.forEach(ax => {
            const barNotes = ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
            barNotes.forEach(n => {
                events.push({
                    type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, 
                    duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    /**
     * #ЗАЧЕМ: ПЛАН №1100 — Очистка кухонной перкуссии.
     * #ЧТО: Снижение плотности, удаление колокольчиков из основного цикла.
     */
    private renderPsybientKitchen(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // Bells removed from primary pool
        const kitchenPool = ['bongo_pvc-tube-01', 'bongo_pc-01', 'perc-003', 'perc-007'];
        const bells = ['drum_Bell_-_Ambient', 'drum_Bell_-_Soft'];

        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) { // Slower steps
            // 3x general reduction
            if (this.rng.chance(20 + tension * 10)) {
                events.push({
                    type: kitchenPool[this.rng.nextInt(kitchenPool.length)] as any, note: 48, time: t * TICK_TO_BEAT, duration: 0.5, 
                    weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.rng.next() * 1.8) - 0.9
                });
            }
            
            // #ЗАЧЕМ: Колокольчики как редкие акценты (5% шанс).
            if (this.rng.chance(5)) {
                events.push({
                    type: bells[this.rng.nextInt(bells.length)] as any, note: 48, time: t * TICK_TO_BEAT, duration: 1.5, 
                    weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.rng.next() * 1.6) - 0.8
                });
            }
        }
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            events.push({
                type: 'bass', note: root, time: (t + 0.1) * TICK_TO_BEAT, 
                duration: 1.2 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'detached', params: { filterCutoff: 1000 + tension * 2000 }
            });
        }
        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        return this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pick', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        return this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'f', phrasing: 'detached'
        }));
    }

    private renderSpecificHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;

        return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: type, note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6,
            technique: tension > 0.7 ? 'hit' : 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderLegacySolo(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const lickKeys = Object.keys(BLUES_SOLO_LICKS).filter(k => k.startsWith('LN_'));
        const key = lickKeys[calculateMusiNum(epoch, 13, this.seed, lickKeys.length)];
        const lick = BLUES_SOLO_LICKS[key];
        if (!lick) return [];
        return decompressCompactPhrase(lick.phrase as any).map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: n.t * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.9, technique: 'pick', dynamics: 'mf', phrasing: 'legato'
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
                    weight: 0.35, technique: 'hit', phrasing: 'staccato', params: { ...m.params, release: 2.5 }
                });
            }
        });
        return { events, style: "Dynamic Shadow" };
    }

    private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'violin' | 'guitarChords'): FractalEvent[] {
        return [{ type: 'harmony', note: currentChord.rootNote + 12 + this.spiralTransposition, time: 0, duration: 4.0, weight: 0.4, technique: 'swell', dynamics: 'p', phrasing: 'legato' }];
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const isMinor = chord.chordType === 'minor';
        return (isMinor ? [0, 3, 7, 10] : [0, 4, 7, 11]).map((interval, i) => ({
            type: 'accompaniment', note: chord.rootNote + 12 + interval, time: 0.1, duration: 3.8, weight: 0.6, technique: 'swell',
            dynamics: 'p', phrasing: 'legato', pan: (i % 2 === 0 ? -0.6 : 0.6), params: { attack: 1.0, release: 2.0, gainCurve: [1.0, 0.1, 0.9, 0.2, 1.0, 0.3, 1.0] }
        }));
    }

    /**
     * #ЗАЧЕМ: ПЛАН №1100 — 3-х кратное разрежение атмосферных событий.
     */
    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // Chance reduced from 85% to 28%
        if (this.rng.chance(28)) {
            const categories = ['light', 'electronic', 'ambient_common', 'root', 'promenade'];
            const category = categories[calculateMusiNum(epoch, 17, this.seed, categories.length)];
            events.push({ type: 'sparkle', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, duration: 6.0, weight: 1.2, technique: 'hit', dynamics: 'mf', phrasing: 'legato', pan: (this.rng.next() * 1.8) - 0.9, params: { mood: this.mood, genre: this.genre, category } });
        }
        // Chance reduced from 60% to 20%
        if (this.rng.chance(20)) {
            const useVoice = this.rng.chance(30);
            events.push({ type: 'sfx', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, duration: 4.0, weight: 1.2, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: (this.rng.next() * 1.6) - 0.8, params: { mood: this.mood, genre: this.genre, rules: useVoice ? { categories: [{ name: 'voice', weight: 1.0 }] } : undefined } });
        }
        return events;
    }
}
