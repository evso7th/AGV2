/**
 * @fileOverview Psybient Brain V54.1 — "The ID Oracle".
 * #ЗАЧЕМ: Передача UID аксиом в логи воркера.
 * #ЧТО: План №21100 — Поля activeAxioms теперь содержат идентификаторы документов из Наследия.
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
    TICK_TO_BEAT,
    applyDynamicArticulation,
    applyMicroChronos,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    transposePhraseDegrees
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';
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
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private soloistBusyUntilBar: number = -1;
    private spiralTransposition: number = 0;
    private currentMutationType: string = 'none';
    private degreeTransposition: number = 0;

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
        if (totalBars <= 0) return 0;
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
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
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
                if (!effectiveAnchor) {
                    const firstChoice = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(firstChoice.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                    filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                    basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                }

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
                    this.currentThemeMaxTick = baseBars * TICKS_PER_BAR;
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

    private rippleLongNote(e: FractalEvent, chord: GhostChord): FractalEvent[] {
        if (e.duration < 3.9) return [e]; 
        const rippled: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const ripplePool = isMinor ? [3, 7, 8, 10] : [4, 7, 9, 11]; 
        const numChunks = Math.ceil(e.duration / 2.6); 
        const chunkDur = e.duration / numChunks;
        const baseOctaveMidi = Math.floor(e.note / 12) * 12;
        for (let i = 0; i < numChunks; i++) {
            let note = (i === 0) ? e.note : baseOctaveMidi + ripplePool[calculateMusiNum(Math.floor(e.time * 12) + i, 13, this.seed, ripplePool.length)];
            rippled.push({
                ...e, note: Math.min(note, this.MELODY_CEILING),
                time: e.time + (i * chunkDur), duration: chunkDur,
                params: { ...e.params, attack: i === 0 ? 1.5 : 0.8, release: 2.5 }
            });
        }
        return rippled;
    }

    private applyMelodicTie(events: FractalEvent[], chord: GhostChord): FractalEvent[] {
        if (events.length === 0) return [];
        const sorted = [...events].sort((a, b) => a.time - b.time);
        const processed: FractalEvent[] = [];
        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            const next = sorted[i+1];
            const nextStartTime = next ? next.time : 4.0;
            const gap = nextStartTime - current.time;
            current.duration = Math.max(current.duration, gap + 0.15); 
            if (next && current.note === next.note) {
                processed.push(...this.rippleLongNote(current, chord));
            } else {
                processed.push(current);
            }
        }
        return processed;
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, trackName?: string, activeAxioms?: any, narrative?: string, instrumentOverrides?: Partial<InstrumentHints>, newBpm?: number, mutationType?: string } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        
        if (epoch % 8 === 0 && epoch >= 4) {
            const mutationRand = this.rng.next();
            const mutationThreshold = this.isImprovising ? 0.9 : 0.5;
            if (mutationRand < mutationThreshold * 0.25) {
                this.degreeTransposition = [-1, 1, 2, -2][this.rng.nextInt(4)];
                this.currentMutationType = 'transpose_deg';
            }
            else if (mutationRand < mutationThreshold * 0.5) this.currentMutationType = 'inversion';
            else if (mutationRand < mutationThreshold * 0.75) this.currentMutationType = 'retrograde';
            else if (mutationRand < mutationThreshold) this.currentMutationType = 'jitter';
            else this.currentMutationType = 'none';
        } else if (epoch < 4) {
            this.currentMutationType = 'none';
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

        if (this.currentPreferredInstrument && hints.melody) {
            instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'psybient');
        }

        let dStatus = 'none';
        if (hints.drums) {
            const heritageDrums = this.renderHeritageDrums(epoch, tension);
            if (heritageDrums.length > 0) {
                events.push(...heritageDrums);
                dStatus = this.currentDrumAxioms[0].id;
            } else {
                events.push(...this.renderNeuroDrums(epoch, tension));
                dStatus = 'Algo';
            }
            events.push(...this.renderPsybientKitchen(epoch, tension));
        }

        let bStatus = 'none';
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
                bStatus = this.currentBassTheme.id;
            } else {
                events.push(...this.renderRollingBass(epoch, resChord, tension));
                bStatus = 'Algo';
            }
        }

        let mStatus = 'none';
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                let activePhrase = this.currentTheme.phrase;
                if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
                else if (this.currentMutationType === 'jitter') activePhrase = applyRhythmicJitter(activePhrase, this.seed + epoch);
                else if (this.currentMutationType === 'transpose_deg') activePhrase = transposePhraseDegrees(activePhrase, this.degreeTransposition);
                
                if (epoch >= 4) {
                    activePhrase = applyDynamicArticulation(activePhrase, tension, this.seed + epoch);
                    activePhrase = applyMicroChronos(activePhrase, this.seed, tension);
                }
                melodyEvents = this.renderHeritageMelodyRaw(epoch, resChord, tension, activePhrase);
                mStatus = this.currentTheme.id;
            } else {
                melodyEvents = this.renderLegacySolo(epoch, resChord, tension);
                mStatus = 'Legacy';
            }
            melodyEvents = this.applyMelodicTie(melodyEvents, resChord);
            events.push(...melodyEvents);
        }

        const usedTargetLayers = new Set<string>();
        let accStatus = 'none';
        let pStatus = 'none';
        let hStatus = 'none';

        if (!isIntro) {
            this.currentAccompAxioms.forEach(ax => {
                const role = ax.role.toLowerCase(); 
                let target: InstrumentPart | null = null;
                if (role.includes('piano')) target = 'pianoAccompaniment';
                else if (role.includes('accomp')) target = 'accompaniment';
                if (target && hints[target] && !usedTargetLayers.has(target)) {
                    let activePhrase = ax.phrase;
                    if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                    else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
                    
                    if (epoch >= 4) {
                        activePhrase = applyDynamicArticulation(activePhrase, tension, this.seed + epoch + 100);
                        activePhrase = applyMicroChronos(activePhrase, this.seed + 300, tension);
                    }
                    const rendered = this.renderSpecificHeritageAccompaniment(resChord, epoch, activePhrase, target, tension);
                    if (rendered.length > 0) {
                        events.push(...rendered);
                        usedTargetLayers.add(target);
                        if (target === 'accompaniment') accStatus = ax.id;
                        if (target === 'pianoAccompaniment') pStatus = ax.id;
                        if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target);
                    }
                }
            });
            if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
                events.push(...this.renderSidechainedPad(epoch, resChord, tension));
                accStatus = 'Algo';
            }
        }

        if (hints.harmony && !isIntro) {
            const harEvents = this.renderDerivativeHarmony(resChord, epoch, this.activeHarmonyInstrument);
            events.push(...harEvents);
            hStatus = 'Algo';
        }

        events.push(...this.renderAtmosphericEvents(epoch, tension));

        const modeStr = this.isImprovising ? 'IMPRO' : 'RESTO';

        return {
            events, tension, beautyScore: 0.9,
            trackName: this.currentTrackName, newBpm,
            instrumentOverrides, mutationType: this.currentMutationType,
            activeAxioms: {
                melody: mStatus,
                bass: bStatus,
                drums: dStatus,
                accompaniment: accStatus,
                piano: pStatus,
                harmony: hStatus
            },
            narrative: `Psybient: ${mStatus}`
        };
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        this.currentDrumAxioms.forEach(ax => {
            ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                events.push({ type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: 0.1, weight: 0.35, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
            });
        });
        return events;
    }

    private renderHeritageMelodyRaw(epoch: number, chord: GhostChord, tension: number, phrase: any[]): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const rawEvents = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => {
            return { type: 'melody' as any, note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING), time: (n.t - barOffset) * TICK_TO_BEAT, duration: (n.d * TICK_TO_BEAT) * 1.25, weight: 1.0, technique: n.tech as Technique, dynamics: 'mf', phrasing: 'legato', params: { attack: 1.5, release: 3.0 } };
        });
        return rawEvents.flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        let activePhrase = this.currentBassTheme.phrase;
        if (epoch >= 4) activePhrase = applyMicroChronos(activePhrase, this.seed + 250, tension);
        return activePhrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({ type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'f', phrasing: 'detached' }));
    }

    private renderSpecificHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const rawEvents = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({ type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6, technique: n.tech as Technique, dynamics: 'p', phrasing: 'legato' }));
        return rawEvents.flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderNeuroDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        [0, 1, 2, 3].forEach(t => events.push({ type: 'drum_kick_drum6', note: 36, time: t, duration: 0.1, weight: 1.05, technique: 'hit', dynamics: 'f', phrasing: 'staccato' }));
        return events;
    }

    private renderPsybientKitchen(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.rng.chance(20)) events.push({ type: 'perc-003' as any, note: 48, time: this.rng.next() * 4, duration: 0.5, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.rng.next() * 1.8) - 0.9 });
        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        for (let t = 0.5; t < 4; t += 1.0) events.push({ type: 'bass', note: root, time: t, duration: 0.4, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' });
        return events;
    }

    private renderLegacySolo(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const lickKeys = Object.keys(BLUES_SOLO_LICKS).filter(k => k.startsWith('LN_'));
        const key = lickKeys[calculateMusiNum(epoch, 13, this.seed, lickKeys.length)];
        const lick = BLUES_SOLO_LICKS[key];
        if (!lick) return [];
        let activePhrase = decompressCompactPhrase(lick.phrase as any);
        if (epoch >= 4) { activePhrase = applyDynamicArticulation(activePhrase, tension, this.seed + epoch); activePhrase = applyMicroChronos(activePhrase, this.seed, tension); }
        const rawEvents = activePhrase.map(n => ({ type: 'melody' as any, note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING), time: n.t * TICK_TO_BEAT, duration: (n.d * TICK_TO_BEAT) * 1.25, weight: 0.9, technique: n.tech as Technique, dynamics: 'mf', phrasing: 'legato', params: { attack: 1.2, release: 2.8 } }));
        return rawEvents.flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (melodyEvents.length === 0) return { events: [], style: 'Waiting' };
        melodyEvents.forEach((m, i) => { if (i % 3 === 0) events.push({ ...m, type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(m.note + (chord.chordType === 'minor' ? 3 : 4)), weight: 0.35, technique: 'hit', phrasing: 'staccato', params: { ...m.params, release: 2.5 } }); });
        return { events, style: "Shadow" };
    }

    private renderDerivativeHarmony(currentChord: GhostChord, epoch: number, timbre: 'violin' | 'guitarChords'): FractalEvent[] {
        const e: FractalEvent = { type: 'harmony', note: this.constrainAccompanimentOctave(currentChord.rootNote + 12), time: 0, duration: 4.0, weight: 0.4, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 1.5, release: 2.5 } };
        return this.rippleLongNote(e, currentChord);
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        return [{ type: 'accompaniment', note: this.constrainAccompanimentOctave(chord.rootNote + 12), time: 0.1, duration: 3.8, weight: 0.6, technique: 'swell', dynamics: 'p', phrasing: 'legato' }].flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        if (epoch < 12) return [];
        const events: FractalEvent[] = [];
        if (this.rng.chance(3 + tension * 9)) events.push({ type: 'sparkle', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, duration: 6.0, weight: 1.2, technique: 'hit', dynamics: 'mf', phrasing: 'legato', pan: (this.rng.next() * 1.8) - 0.9, params: { mood: this.mood, genre: this.genre, category: 'light' } });
        if (this.rng.chance(2 + tension * 6)) events.push({ type: 'sfx', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, duration: 4.0, weight: 1.1, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: (this.rng.next() * 1.6) - 0.8, params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'voice', weight: 1.0 }] } } });
        return events;
    }
}
