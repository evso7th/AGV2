
/**
 * @fileOverview Reggae Brain V12.0 — "Percussive Texture Shift".
 * #ЗАЧЕМ: Реализация ПЛАНА №1156. Регулировка плотности ритм-секции.
 * #ЧТО: Разряжение хэта и учащение перкуссии.
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
    TICKS_PER_BAR,
    TICK_TO_BEAT
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

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
    private currentTrackName: string = 'Algorithmic';
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];

    private soloistBusyUntilBar: number = -1;
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
        if (this.cloudAxioms.length > 0 && this.useHeritage) this.soloistBusyUntilBar = -1;
    }

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number): number {
        if (totalBars <= 0) return 0;
        if (this.isImprovising) return calculateMusiNum(epoch, 11, this.seed, totalBars);
        return (epoch - startEpoch) % totalBars;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = [];
        this.currentBassTheme = null;
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        const filteredPool = effectiveAnchor 
            ? poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor)
            : poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                return axGenres.includes(this.genre) && axMoods.includes(this.mood);
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
                const selected = basePool[calculateMusiNum(this.seed, 19, epoch, basePool.length)];
                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bass = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bass) this.currentBassTheme = { phrase: decompressCompactPhrase(bass.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bass.id };

                    const accs = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accs.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

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
        this.currentTimeScale = navInfo.currentPart.instrumentRules?.melody?.timeScale || 1;
        const events: FractalEvent[] = [];
        
        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const kit = DRUM_KITS.reggae.standard;
        const instrumentOverrides: Partial<InstrumentHints> = {};

        // 1. DRUMS (Evolutionary Riddim)
        if (hints.drums) {
            events.push(...this.renderReggaeGroove(epoch, tension, kit));
            events.push(...this.renderPsybientKitchen(epoch, tension, kit));
        }

        // 2. BASS
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar) 
                ? this.renderHeritageBass(epoch, resChord, tension)
                : this.renderGenerativeBass(epoch, resChord, tension);
            events.push(...b);
        }

        // 3. HARMONY & PIANO
        const usedLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('accomp') ? 'accompaniment' : (role.includes('harmony') ? 'harmony' : null));
            if (target && hints[target] && !usedLayers.has(target)) {
                events.push(...this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension));
                usedLayers.add(target);
                if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'reggae');
            }
        });

        if (hints.harmony && !usedLayers.has('harmony')) {
            events.push(...this.renderGenerativeHarmony(resChord, epoch, tension));
            usedLayers.add('harmony');
        }

        if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
            const p = this.renderVirtuosoPiano(epoch, resChord, tension);
            events.push(...p.events);
        }

        // 4. MELODY
        if (hints.melody) {
            const m = (this.currentTheme && epoch < this.currentTheme.endBar)
                ? this.renderHeritageMelody(epoch, resChord, tension, this.currentTimeScale)
                : this.renderGapFiller(epoch, resChord, tension);
            events.push(...m);
            if (this.currentPreferredInstrument) instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'reggae');
        }

        return {
            events, tension, beautyScore: 0.98,
            trackName: this.currentTrackName,
            instrumentOverrides,
            activeAxioms: { 
                melody: this.currentTheme?.id || 'Gap-Filler', 
                drums: 'Evolutionary Riddim',
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Algorithmic Dub'
            },
            narrative: `Pure Riddim Evolution: ${this.currentTrackName} [Phase: ${this.getStyleName(epoch, tension)}]`
        };
    }

    private getStyleName(epoch: number, tension: number): string {
        if (epoch < 32 || tension < 0.4) return 'One Drop';
        if (tension > 0.8 || epoch > 80) return 'Steppers';
        return 'Rockers';
    }

    private renderReggaeGroove(epoch: number, tension: number, kit: any): FractalEvent[] {
        const events: FractalEvent[] = [];
        let style: 'one-drop' | 'rockers' | 'steppers' = 'one-drop';
        
        if (epoch < 32 || tension < 0.4) style = 'one-drop';
        else if (tension > 0.8 || epoch > 80) style = 'steppers';
        else style = 'rockers';

        if (style === 'one-drop') {
            events.push({ type: kit.kick[0] as any, note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.05, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
            events.push({ type: kit.snare[0] as any, note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.95, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        } else if (style === 'rockers') {
            [0, 3, 6, 9].forEach(t => {
                events.push({ type: kit.kick[0] as any, note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
            });
            [3, 9].forEach(t => {
                events.push({ type: kit.snare[0] as any, note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.85, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
            });
        } else {
            [0, 3, 6, 9].forEach(t => {
                events.push({ type: kit.kick[0] as any, note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 1.15, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
            });
            events.push({ type: kit.snare[0] as any, note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
        }

        // #ЗАЧЕМ: ПЛАН №1156. Разрежение хэта. Только оффбиты ("и").
        [1.5, 4.5, 7.5, 10.5].forEach(tick => {
            events.push({ 
                type: kit.hihat[0] as any, note: 42, 
                time: tick * TICK_TO_BEAT, duration: 0.1, 
                weight: 0.55, 
                technique: 'hit', dynamics: 'p', phrasing: 'staccato' 
            });
        });

        return events;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentBassTheme.startBar, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        return this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.75, technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
        }));
    }

    private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        if (this.random.next() > (0.1 + tension * 0.4)) return [];
        const t = calculateMusiNum(epoch, 7, this.seed, 2) === 0 ? 3 : 9;
        const root = chord.rootNote + 12;
        return (chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7]).map(interval => ({
            type: 'harmony', note: this.constrainAccompanimentOctave(root + interval),
            time: t * TICK_TO_BEAT, duration: 0.4 * TICK_TO_BEAT, weight: 0.35,
            technique: 'hit', dynamics: 'p', phrasing: 'staccato', chordName: chord.chordType === 'minor' ? 'Am' : 'A'
        }));
    }

    private renderPsybientKitchen(epoch: number, tension: number, kit: any): FractalEvent[] {
        const events: FractalEvent[] = [];
        const pool = kit.perc || [];
        // #ЗАЧЕМ: ПЛАН №1156. Учащение перкуссии. Шаг 1.5 вместо 3.0.
        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            if (this.random.next() < (0.35 + tension * 0.15)) {
                events.push({
                    type: pool[this.random.nextInt(pool.length)] as any, note: 48, time: t * TICK_TO_BEAT, duration: 0.5,
                    weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.random.next() * 1.6) - 0.8
                });
            }
        }
        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, timeScale: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil((this.currentAxiomMaxTick * timeScale) / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentTheme.startBar, totalBars);
        const window = TICKS_PER_BAR / timeScale;
        const offset = mosaicBar * window;
        return this.currentTheme.phrase.filter(n => n.t >= offset && n.t < offset + window).map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - offset) * TICK_TO_BEAT * timeScale, duration: (n.d * TICK_TO_BEAT * timeScale) * 1.2,
            weight: 0.85, technique: n.tech === 'vb' ? 'vb' : 'pick', dynamics: 'mf', phrasing: 'legato'
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, epoch - (epoch % totalBars), totalBars);
        const offset = mosaicBar * TICKS_PER_BAR;
        return phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({
            type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.45,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderGenerativeBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote - 12;
        return [
            { type: 'bass', note: root, time: 1.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.9, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' },
            { type: 'bass', note: root + 7, time: 7.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.7, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' }
        ];
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number): { events: FractalEvent[], style: string } {
        if (this.random.next() > 0.3) return { events: [], style: 'none' };
        const root = chord.rootNote + 12;
        return {
            style: 'Dub Echoes',
            events: [{
                type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(root + (chord.chordType === 'minor' ? 3 : 4)),
                time: 10.5 * TICK_TO_BEAT, duration: 0.5 * TICK_TO_BEAT, weight: 0.5,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            }]
        };
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (this.random.next() > 0.5) return [];
        return [{
            type: 'melody', note: chord.rootNote + 12, time: 0, duration: 2.0, weight: 0.6,
            technique: 'vb', dynamics: 'p', phrasing: 'legato'
        }];
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 71) v -= 12; while (v < 48) v += 12; return v; }
}
