/**
 * @fileOverview Reggae Brain V25.0 — "Global Mutation Sync".
 * #ЗАЧЕМ: Реализация ПЛАНА №1440. Внедрение транспозиции и новых защитных алгоритмов.
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
    private currentDrumAxioms: { phrase: any[], role: string, id: string }[] = [];

    private soloistBusyUntilBar: number = -1;
    private drumRestUntilBar: number = -1;
    private currentMutationType: string = 'none';
    private microTransposition: number = 0;
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

    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number, tension: number = 0.5): number {
        if (totalBars <= 0) return 0;
        const startOffset = calculateMusiNum(this.seed, 13, 0, totalBars);
        if (this.isImprovising) {
            return calculateMusiNum(epoch + startOffset, 11, this.seed, totalBars);
        }
        const barsElapsed = epoch - startEpoch;
        return (barsElapsed + startOffset) % totalBars;
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
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bass = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bass) this.currentBassTheme = { phrase: decompressCompactPhrase(bass.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bass.id };

                    const accs = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentAccompAxioms = accs.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument }));

                    const drumSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('drum') && normalizeStr(selected.compositionId) === cid && ax.barOffset === selected.barOffset);
                    this.currentDrumAxioms = drumSiblings.map(ax => ({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id }));

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

    private getActiveBassTicks(epoch: number, tension: number = 0.5, mosaicBar: number = 0): Set<number> {
        const ticks = new Set<number>();
        if (this.currentBassTheme) {
            const localBar = mosaicBar % this.phraseBarCount(this.currentBassTheme.phrase);
            const barOffset = localBar * TICKS_PER_BAR;
            this.currentBassTheme.phrase.forEach(n => {
                if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                    ticks.add(n.t - barOffset);
                }
            });
        } else {
            ticks.add(1.5);
            ticks.add(6.0);
            ticks.add(10.5);
        }
        return ticks;
    }

    private phraseBarCount(phrase: any[]): number {
        if (!phrase || phrase.length === 0) return 1;
        let maxT = 0;
        for (const n of phrase) if (n.t > maxT) maxT = n.t;
        return Math.max(1, Math.floor(maxT / TICKS_PER_BAR) + 1);
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
                        attack: 0.1 + (1 - p) * 0.3, 
                        release: 0.2 + p * 1.0        
                    },
                    phrasing: p < 0.5 ? 'legato' : 'staccato'
                };
            });
        }
        return notes;
    }

    public generateBar(epoch: number, currentChord: GhostChord, navInfo: NavigationInfo, dna: SuiteDNA, hints: InstrumentHints): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        this.currentTimeScale = navInfo.currentPart.instrumentRules?.melody?.timeScale || 1;
        const events: FractalEvent[] = [];
        
        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 23, this.seed, 100);
            if (roll < 40) this.currentMutationType = 'none';
            else if (roll < 55) { this.currentMutationType = 'transpose'; this.microTransposition = [-2, 2, 5, -5][this.random.nextInt(4)]; }
            else if (roll < 70) this.currentMutationType = 'inversion';
            else if (roll < 85) this.currentMutationType = 'retrograde';
            else if (roll < 95) this.currentMutationType = 'density_guard';
            else this.currentMutationType = 'velocity_curve';
        }

        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        if (this.drumRestUntilBar <= epoch) {
            const restRoll = calculateMusiNum(epoch, 17, this.seed, 100) / 100;
            if (restRoll < 0.05 || (epoch > 0 && epoch % 16 === 15)) {
                this.drumRestUntilBar = epoch + 1; 
            }
        }

        const isDrumResting = epoch < this.drumRestUntilBar;
        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const kit = DRUM_KITS.reggae.standard;
        const instrumentOverrides: Partial<InstrumentHints> = {};

        const ensembleTotalBars = Math.max(1, Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR));
        const ensembleAnchor = this.currentTheme ? this.currentTheme.startBar
            : (this.currentBassTheme ? this.currentBassTheme.startBar : epoch);
        const mosaicBar = this.getMosaicIndex(epoch, ensembleAnchor, ensembleTotalBars, tension);

        const bassTicks = this.getActiveBassTicks(epoch, tension, mosaicBar);

        // 1. DRUMS
        if (hints.drums) {
            if (!isDrumResting) {
                events.push(...this.renderReggaeGroove(epoch, tension, kit, bassTicks));
                if (this.random.next() < 0.03) {
                    events.push({ type: 'drum_ride_wetter', note: 51, time: 0, duration: 4.0, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'legato' });
                }
                if (epoch % 4 === 3) events.push(...this.renderReggaeFills(epoch, tension));
            }
        }

        // 2. BASS
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension, mosaicBar)
                : this.renderGenerativeBass(epoch, resChord, tension);
            events.push(...b);
        }

        // 3. HARMONY & PIANO
        const usedLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('accomp') ? 'accompaniment' : (role.includes('harmony') ? 'harmony' : null));
            if (target && hints[target] && !usedLayers.has(target)) {
                events.push(...this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension, mosaicBar));
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
        let melodyLabel = 'none';
        if (hints.melody) {
            let m: FractalEvent[] = [];
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                m = this.renderHeritageMelody(epoch, resChord, tension, this.currentTimeScale, mosaicBar, navInfo.currentPart.instrumentRules?.melody?.density);
            }
            
            if (m.length === 0) {
                m = this.renderGapFiller(epoch, resChord, tension);
                melodyLabel = 'Gap-Filler';
            } else {
                melodyLabel = this.currentTheme?.id || 'DNA';
            }

            events.push(...m);
            if (this.currentPreferredInstrument) instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'reggae');
        }

        return {
            events, tension, beautyScore: 0.98,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            instrumentOverrides,
            activeAxioms: { 
                melody: melodyLabel, 
                drums: isDrumResting ? 'BREATH' : `Riddim Sync [${this.getStyleName(epoch, tension)}]`,
                bass: this.currentBassTheme ? 'Sibling DNA' : 'One-Drop Dub'
            },
            narrative: `Reggae Evolution: ${this.currentTrackName} [Mut: ${this.currentMutationType.toUpperCase()}]`
        };
    }

    private getStyleName(epoch: number, tension: number): string {
        if (epoch < 32 || tension < 0.4) return 'One Drop';
        if (tension > 0.8 || epoch > 80) return 'Steppers';
        return 'Rockers';
    }

    private renderReggaeGroove(epoch: number, tension: number, kit: any, bassTicks: Set<number>): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kickEnabled = epoch % 2 === 0;
        if (kickEnabled) {
            events.push({ type: kit.kick[0] as any, note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.15, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        }
        events.push({ type: kit.snare[0] as any, note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.05, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });

        bassTicks.forEach(t => {
            if (Math.abs(t - 6) > 0.1) {
                if (!kickEnabled) return;
                const weight = t < 1.0 ? 0.35 : 0.95;
                if (weight > 0.4 || this.random.next() < 0.4) {
                    events.push({ type: kit.kick[0] as any, note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
                }
            }
        });
        events.push(...this.renderOrganicHats(epoch, tension, kit, bassTicks));
        return events;
    }

    private renderOrganicHats(epoch: number, tension: number, kit: any, bassTicks: Set<number>): FractalEvent[] {
        const events: FractalEvent[] = [];
        const patternIdx = calculateMusiNum(epoch, 3, this.seed, 3); 
        const mainOffbeats = [1.5, 4.5, 7.5, 10.5];
        if (patternIdx === 0) { 
            mainOffbeats.forEach((t, i) => {
                if (i % 2 === (epoch % 2)) {
                    events.push({ type: kit.hihat[0] as any, note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
                }
            });
        } else if (patternIdx === 1) { 
            for (let t = 0; t < TICKS_PER_BAR; t += 3.0) {
                if (this.random.next() < (bassTicks.has(t) ? 0.15 : 0.45)) {
                    events.push({ type: kit.hihat[0] as any, note: 42, time: t * TICK_TO_BEAT, duration: 0.05, weight: 0.5, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
                }
            }
        } else { 
            for (let t = 0; t < TICKS_PER_BAR; t += 3.0) {
                events.push({ type: kit.hihat[0] as any, note: 42, time: t * TICK_TO_BEAT, duration: 0.05, weight: (t % 6 === 0) ? 0.20 : 0.45, technique: 'ghost', dynamics: 'p', phrasing: 'staccato' });
            }
        }
        return events;
    }

    private renderReggaeFills(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const tomSequence = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
        
        [9.5, 10.5, 11.5].forEach((t, i) => {
            events.push({ 
                type: tomSequence[i] as any, note: 48, time: t * TICK_TO_BEAT, 
                duration: 0.2, weight: 0.85 + (tension * 0.15), technique: 'hit', 
                dynamics: 'mf', phrasing: 'staccato', pan: -0.6 + (i * 0.6) 
            });
        });
        return events;
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number, mosaicBar: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        let phrase = this.currentBassTheme.phrase;
        phrase = this.applyMutationLogic(phrase, tension, this.seed + epoch);

        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const barOffset = localBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);

        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.9, technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
        }));
    }

    private renderGenerativeBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote - 12 + this.microTransposition;
        return [
            { type: 'bass', note: root, time: 1.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.8, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' },
            { type: 'bass', note: root, time: 6.0 * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'f', phrasing: 'detached' }, 
            { type: 'bass', note: root + 7, time: 10.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.7, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' }
        ];
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, timeScale: number, mosaicBar: number, density?: { min: number; max: number }): FractalEvent[] {
        if (!this.currentTheme) return [];
        let phrase = this.currentTheme.phrase;
        phrase = this.applyMutationLogic(phrase, tension, this.seed + epoch);

        const localBar = mosaicBar % this.phraseBarCount(phrase);
        const offset = localBar * TICKS_PER_BAR;
        const readingWindow = TICKS_PER_BAR / timeScale;
        const barNotes = phrase.filter(n => n.t >= offset && n.t < offset + readingWindow);

        const goldenTicks = [0, 3, 6, 9];
        const isGold = (n: any) => goldenTicks.some(gt => Math.abs((n.t - offset) - gt) < 0.1);

        const keepFrac = density ? (density.min + (density.max - density.min) * tension) : 1;
        const cap = Math.max(2, Math.round(barNotes.length * keepFrac));
        let keptNotes = barNotes;
        if (barNotes.length > cap) {
            const golden = barNotes.filter(isGold);
            const filler = barNotes.filter(n => !isGold(n));
            const slots = Math.max(0, cap - golden.length);
            const thinned = filler.length > slots
                ? Array.from({ length: slots }, (_, i) => filler[Math.floor(i * filler.length / slots)])
                : filler;
            keptNotes = [...golden, ...thinned].sort((a, b) => a.t - b.t);
        }

        const useNarrativeFilter = keptNotes.length > 3;

        return keptNotes.map(n => {
            const relativeTick = n.t - offset;
            const isGolden = isGold(n);
            let weight = 0.85;
            let durationScale = 1.2;
            let tech = (n.tech === 'vb' ? 'vb' : 'pick');
            if (useNarrativeFilter) {
                if (isGolden) { weight = 0.95; durationScale = 2.0; tech = 'vb'; }
                else { weight = 0.3; durationScale = 0.4; }
            }
            return {
                type: 'melody',
                note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition, this.MELODY_CEILING),
                time: relativeTick * TICK_TO_BEAT * timeScale,
                duration: (n.d * TICK_TO_BEAT * timeScale) * durationScale,
                weight,
                technique: tech,
                dynamics: 'mf',
                phrasing: n.phrasing || 'legato',
                params: { attack: n.params?.attack, release: n.params?.release }
            };
        }) as FractalEvent[];
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number, mosaicBar: number): FractalEvent[] {
        let mutated = this.applyMutationLogic(phrase, tension, this.seed + epoch + 1);
        const localBar = mosaicBar % this.phraseBarCount(mutated);
        const offset = localBar * TICKS_PER_BAR;
        const barNotes = mutated.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);

        return barNotes.map(n => ({
            type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.microTransposition),
            time: (n.t - offset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.45,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderGenerativeHarmony(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        if (this.random.next() > (0.1 + tension * 0.4)) return [];
        const t = calculateMusiNum(epoch, 7, this.seed, 2) === 0 ? 3 : 9;
        const root = chord.rootNote + 12 + this.microTransposition;
        return (chord.chordType === 'minor' ? [0, 3, 7] : [0, 4, 7]).map(interval => ({
            type: 'harmony', note: this.constrainAccompanimentOctave(root + interval),
            time: t * TICK_TO_BEAT, duration: 0.4 * TICK_TO_BEAT, weight: 0.35,
            technique: 'hit', dynamics: 'p', phrasing: 'staccato', chordName: chord.chordType === 'minor' ? 'Am' : 'A'
        }));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number): { events: FractalEvent[], style: string } {
        if (this.random.next() > 0.3) return { events: [], style: 'none' };
        const root = chord.rootNote + 12 + this.microTransposition;
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
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12 + this.microTransposition;
        const isMinor = chord.chordType === 'minor';
        const scale = isMinor ? [0, 3, 5, 7, 10] : [0, 4, 7, 9]; 
        
        const count = calculateMusiNum(epoch, 7, this.seed, 3) + 1; 
        const offbeats = [1.5, 3.0, 4.5, 7.5, 9.0, 10.5];
        
        for (let i = 0; i < count; i++) {
            const tIdx = calculateMusiNum(epoch + i, 11, this.seed, offbeats.length);
            const time = offbeats[tIdx];
            const degIdx = calculateMusiNum(epoch + i, 13, this.seed, scale.length);
            const note = root + scale[degIdx];
            
            events.push({
                type: 'melody',
                note: Math.min(note, this.MELODY_CEILING),
                time: time * TICK_TO_BEAT,
                duration: 0.5 * TICK_TO_BEAT, 
                weight: 0.6 + (tension * 0.2),
                technique: 'pick', dynamics: 'p', phrasing: 'staccato'
            });
        }
        return events;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 71) v -= 12; while (v < 48) v += 12; return n; }
}
