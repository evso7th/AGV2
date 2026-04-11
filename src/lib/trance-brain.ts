
/**
 * @fileOverview Psybient Brain V3.0 — "The Kinetic Forest Protocol".
 * #ЗАЧЕМ: Замена Trance на Psybient с внедрением иерархических ландшафтов.
 * #ЧТО: ПЛАН №1025 — Смена высоты каждые 2 витка, фрактальная кухня и нейро-бас.
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
    SEMITONE_TO_DEGREE,
    normalizePhraseGroup,
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

const MARKOV_BASE = [
  [40, 5, 15, 10, 5,  10, 5, 15, 3,  5, 8,  3, 20], 
  [15, 30, 10, 5,  15, 5,  10, 5,  8,  3, 5,  8, 10],
  [10, 5,  30, 15, 5,  10, 5,  20, 3,  10, 10, 5, 15],
  [10, 5,  10, 30, 15, 5,  10, 5,  5,  8,  15, 3, 10],
  [5,  10, 10, 15, 30, 15, 5,  10, 5,  8,  5,  10, 15],
  [10, 5,  10, 5,  10, 30, 15, 10, 5,  10, 8,  5, 15],
  [5,  10, 5,  10, 5,  15, 30, 10, 15, 5,  10, 5, 10],
  [15, 5,  20, 5,  10, 5,  10, 30, 5,  10, 15, 5, 20],
  [5,  8,  5,  8,  5,  10, 15, 5,  25, 10, 5,  8, 10],
  [5,  3,  10, 8,  8,  5,  5,  10, 10, 25, 10, 15, 10],
  [8,  5,  10, 15, 5,  8,  10, 5,  5,  10, 25, 15, 15],
  [3,  8,  5,  3,  10, 5,  5,  5,  8,  15, 15, 25, 15],
  [20, 5,  15, 10, 5,  10, 5,  20, 3,  5,  8,  3, 40] 
];

class SeededRNG {
  private state: number;
  constructor(seed: number) { this.state = seed; }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % Math.pow(2, 32);
    return this.state / Math.pow(2, 32);
  }
  nextInt(max: number): number { return Math.floor(this.next() * max); }
  chance(p: number): boolean { return this.next() < p / 100; }
  weightedPick<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
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
    private currentDrumAxioms: { phrase: any[], role: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private soloistBusyUntilBar: number = -1;
    private phraseArc: number = 0;
    private prevDegree: number = 0;
    private spiralTransposition: number = 0;

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
        return (epoch - startEpoch) % totalBars;
    }

    private generateFractalRhythm(): number[] {
        const grid: number[] = [];
        for (let t = 0; t < TICKS_PER_BAR; t++) {
            const level = Math.log2(TICKS_PER_BAR / (t % 3 === 0 ? 3 : (t % 1.5 === 0 ? 1.5 : 1)));
            const prob = 0.70 * Math.pow(0.50, level);
            if (this.rng.chance(prob * 100)) grid.push(t);
        }
        if (!grid.includes(0)) grid.unshift(0);
        return grid.sort((a, b) => a - b);
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
                return axGenres.includes('psybient') && (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter);
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
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: bassSibling.id };
                    }

                    const accompSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('accomp') && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
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
        return undefined;
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, trackName?: string, activeAxioms?: any, narrative?: string, instrumentOverrides?: Partial<InstrumentHints> } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        this.phraseArc = Math.max(0, Math.min(1, Math.sin((epoch % 8 / 8) * Math.PI)));
        
        // #ЗАЧЕМ: Tonal Spiral Logic (ПЛАН №1025).
        // Каждые 8 тактов (2 витка по 4 такта) меняем высоту.
        if (epoch > 0 && epoch % 8 === 0) {
            const shifts = [0, 3, 5, 7, -2];
            this.spiralTransposition = shifts[calculateMusiNum(epoch, 11, this.seed, shifts.length)];
        }

        const events: FractalEvent[] = [];
        const isIntro = navInfo.currentPart.id === 'INTRO' || epoch < 4;

        if (epoch >= this.soloistBusyUntilBar && !isIntro) {
            this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot + this.spiralTransposition };
        const instrumentOverrides: Partial<InstrumentHints> = {};

        if (this.currentPreferredInstrument && hints.melody && !isIntro) {
            instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'psybient');
        }

        // 1. KINETIC KITCHEN (DRUMS)
        if (hints.drums) events.push(...this.renderPsybientDrums(epoch, tension));

        // 2. NEURO BASS
        let activeBassAxiom = 'Neuro Pulsar';
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
                activeBassAxiom = `DNA: ${this.currentBassTheme.id}`;
            } else {
                events.push(...this.renderNeuroBass(epoch, resChord, tension));
            }
        }

        // 3. LEAD / TEXTURE
        let melodyEvents: FractalEvent[] = [];
        let activeMelAxiom = isIntro ? 'Waiting' : 'Spiral Lead';
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension);
                activeMelAxiom = `DNA: ${this.currentTheme.id}`;
            } else {
                melodyEvents = this.renderPsybientLead(epoch, resChord, tension);
            }
            events.push(...melodyEvents);
        }

        // 4. ACCOMPANIMENT (MISTY PADS)
        let activeAccAxiom = 'none';
        if (hints.accompaniment && !isIntro) {
            const padEvents = this.renderSidechainedPad(epoch, resChord, tension);
            events.push(...padEvents);
            activeAccAxiom = 'Sidechained Mist';
        }

        // 5. FX / SPARKLES
        if (hints.sparkles && this.rng.chance(25)) {
            events.push({
                type: 'sparkle', note: resChord.rootNote + 36, time: this.rng.next() * 4, duration: 6.0,
                weight: 0.6, technique: 'hit', dynamics: 'p', phrasing: 'legato', pan: (this.rng.next() * 1.6) - 0.8,
                params: { mood: this.mood, genre: 'ambient' }
            });
        }

        return {
            events, tension, beautyScore: 0.8,
            trackName: this.currentTrackName,
            instrumentOverrides,
            activeAxioms: {
                melody: activeMelAxiom,
                bass: activeBassAxiom,
                accompaniment: activeAccAxiom,
                drums: 'Fractal Kitchen'
            },
            narrative: `Psybient Journey: [DNA: ${this.currentTrackName}] [Spiral: ${this.spiralTransposition}] [Chronos Mode]`
        };
    }

    private renderPsybientDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isSoft = tension < 0.4;
        
        // 1. Soft Kick
        [0, 2, 4, 6, 8, 10].forEach(t => {
            if (t % 3 === 0 || (tension > 0.6 && this.rng.chance(30))) {
                events.push({
                    type: 'drum_kick_reso', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: isSoft ? 0.7 : 0.9,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            }
        });

        // 2. Kitchen Spices (Tubes, Bongo, Perc)
        const kit = DRUM_KITS.ambient.melancholic;
        for (let i = 0; i < 4; i++) {
            if (this.rng.chance(40 + tension * 20)) {
                const t = this.rng.nextInt(TICKS_PER_BAR);
                const perc = kit.perc[this.rng.nextInt(kit.perc.length)];
                events.push({
                    type: perc as any, note: 48, time: t * TICK_TO_BEAT, duration: 0.5, weight: 0.5,
                    technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.rng.next() * 1.4) - 0.7
                });
            }
        }

        // 3. Fills
        if (epoch % 4 === 3 && tension > 0.5) {
            const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom'];
            [9, 10, 11].forEach((t, i) => {
                events.push({
                    type: tomTypes[i % 2] as any, note: 40, time: t * TICK_TO_BEAT, duration: 0.4, weight: 0.7,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: (i - 1) * 0.4
                });
            });
        }

        return events;
    }

    private renderNeuroBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        const pattern = [1.5, 4.5, 7.5, 10.5]; 
        
        pattern.forEach((t, i) => {
            const isTonic = i % 4 === 0;
            const note = isTonic ? root : root + [0, 3, 7, 10][this.rng.nextInt(4)];
            events.push({
                type: 'bass', note, time: t * TICK_TO_BEAT, duration: 1.2 * TICK_TO_BEAT, weight: 1.0,
                technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
                params: { filterCutoff: 600 + tension * 1200 }
            });
        });
        return events;
    }

    private renderPsybientLead(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.phraseArc < 0.2) return [];
        const root = chord.rootNote + 12;
        const scale = [0, 2, 3, 5, 7, 10, 12];
        
        const rhythm = this.generateFractalRhythm();
        rhythm.forEach(t => {
            if (this.rng.chance(tension * 60)) {
                const deg = scale[this.rng.nextInt(scale.length)];
                events.push({
                    type: 'melody', note: root + deg, time: t * TICK_TO_BEAT, duration: 0.4, weight: 0.7,
                    technique: 'pick', dynamics: 'mf', phrasing: 'legato',
                    params: { swell: true, attack: 0.1, release: 0.5 }
                });
            }
        });
        return events;
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const isMinor = chord.chordType === 'minor';
        const intervals = isMinor ? [0, 3, 7, 10] : [0, 4, 7, 11];
        return intervals.map((interval, i) => ({
            type: 'accompaniment', note: chord.rootNote + 12 + interval,
            time: 0.1, duration: 3.8, weight: 0.45,
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            pan: (i % 2 === 0 ? -0.5 : 0.5),
            params: { 
                attack: 1.5, release: 2.0, 
                gainCurve: [1.0, 0.3, 0.8, 0.4, 0.9, 0.5, 1.0],
                filterCutoff: 800 + tension * 800 
            }
        }));
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.currentTheme.startBar;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.75,
            technique: 'pick', dynamics: 'mf', phrasing: 'legato',
            params: { filterCutoff: 1500 + tension * 2000, swell: true }
        }));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.currentBassTheme.startBar;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'bass', note: chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
            params: { filterCutoff: 500 + tension * 1000 }
        }));
    }

    private renderHeritageAccompaniment(epoch: number, chord: GhostChord, phrase: any[], tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'accompaniment', note: chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.5,
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { 
                attack: 1.0, release: 1.5, 
                gainCurve: [1.0, 0.4, 0.8, 0.5, 0.9, 0.6, 1.0],
                filterCutoff: 1000 + tension * 1000 
            }
        }));
    }

    private renderProgressiveRhodes(epoch: number, chord: GhostChord, tension: number, leadEvents: FractalEvent[]): FractalEvent[] {
        const events: FractalEvent[] = [];
        [0, 6].forEach(t => {
            events.push({
                type: 'pianoAccompaniment', note: chord.rootNote + 12,
                time: t * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.4,
                technique: 'hit', dynamics: 'p', phrasing: 'legato', pan: 0.2,
                params: { release: 3.0 }
            });
        });
        return events;
    }
}
