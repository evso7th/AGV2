
/**
 * @fileOverview Psybient Brain V3.3 — "The Living Kinetic Forest".
 * #ЗАЧЕМ: Реализация максимально детализированной "кухни" и живых ударных.
 * #ЧТО: ПЛАН №1029 — Блюзовые пробежки по томам, "вздохи" (dropouts) и плотная фрактальная перкуссия.
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
    
    private currentTrackName: string = 'Algorithmic';
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private soloistBusyUntilBar: number = -1;
    private phraseArc: number = 0;
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

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentAccompAxioms = [];
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

        // 1. NEURO PUMPING (DRUMS & KITCHEN) - MANDATORY
        if (hints.drums) {
            events.push(...this.renderNeuroDrums(epoch, tension));
            events.push(...this.renderPsybientKitchen(epoch, tension));
        }

        // 2. ROLLING BASS - MANDATORY
        let activeBassAxiom = 'Neuro Rolling';
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
                activeBassAxiom = `DNA: ${this.currentBassTheme.id}`;
            } else {
                events.push(...this.renderRollingBass(epoch, resChord, tension));
            }
        }

        // 3. LEAD / TEXTURE - MANDATORY
        let melodyEvents: FractalEvent[] = [];
        let activeMelAxiom = isIntro ? 'Waiting' : 'Spiral Narrative';
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderHeritageMelody(epoch, resChord, tension);
                activeMelAxiom = `DNA: ${this.currentTheme.id}`;
            } else {
                melodyEvents = this.renderLegacySolo(epoch, resChord, tension);
            }
            events.push(...melodyEvents);
        }

        // 4. ACCOMPANIMENT (SIDECHAINED PAD)
        let activeAccAxiom = 'none';
        if (hints.accompaniment && !isIntro) {
            const padEvents = this.renderSidechainedPad(epoch, resChord, tension);
            events.push(...padEvents);
            activeAccAxiom = 'Sidechained Mist';
        }

        // 5. FX SPICES (SPARKLES & SFX) - MANDATORY
        events.push(...this.renderAtmosphericEvents(epoch, tension));

        return {
            events, tension, beautyScore: 0.9,
            trackName: this.currentTrackName,
            instrumentOverrides,
            activeAxioms: {
                melody: activeMelAxiom,
                bass: activeBassAxiom,
                accompaniment: activeAccAxiom,
                drums: 'Neuro Pumping + Live Kitchen'
            },
            narrative: `Psybient Matrix: [DNA: ${this.currentTrackName}] [Kitchen: DETAILED] [Toms: BLUESY]`
        };
    }

    private renderNeuroDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isFourthBar = epoch % 4 === 3;
        
        // "Breaths" (Kick Dropout logic)
        // #ЗАЧЕМ: Создает эффект вздоха перед филлом или на переходах.
        const shouldDropKick = isFourthBar && this.rng.chance(40);

        // 4/4 Kick foundation
        [0, 3, 6, 9].forEach(t => {
            if (shouldDropKick && t >= 6) return; // Drop last two beats for breath
            
            events.push({
                type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 1.0,
                technique: 'hit', dynamics: 'f', phrasing: 'staccato'
            });
        });

        // Snare on 2 and 4
        [3, 9].forEach(t => {
            events.push({
                type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.9,
                technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: -0.1
            });
        });

        // High frequency 16th hats
        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            const isBeat = t % 3 === 0;
            events.push({
                type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, 
                duration: 0.1, weight: isBeat ? 0.4 : 0.65,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.15
            });
        }

        // Bluesy Tom runs
        if (isFourthBar) {
            events.push(...this.renderBluesyTomFill(tension));
        }

        return events;
    }

    /**
     * #ЗАЧЕМ: Блюзовые пробежки по томам (ПЛАН №1029).
     * #ЧТО: Сложные каскадные ритмы вместо простой сетки.
     */
    private renderBluesyTomFill(tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const tomTypes = ['drum_Sonor_Classix_High_Tom', 'drum_Sonor_Classix_Mid_Tom', 'drum_Sonor_Classix_Low_Tom'];
        
        // Pattern 1: Rapid 16th triplet descent
        if (this.rng.chance(50)) {
            const startTick = 7.5;
            for(let i=0; i<6; i++) {
                const typeIdx = Math.floor(i / 2);
                events.push({
                    type: tomTypes[typeIdx] as any, note: 40, 
                    time: (startTick + i * 0.75) * TICK_TO_BEAT, 
                    duration: 0.3, weight: 0.75 + (i * 0.05),
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato', 
                    pan: (i - 2.5) * 0.3
                });
            }
        } else {
            // Pattern 2: Syncopated accents
            [6, 7.5, 9, 10.5, 11].forEach((t, i) => {
                const typeIdx = i % 3;
                events.push({
                    type: tomTypes[typeIdx] as any, note: 40, 
                    time: t * TICK_TO_BEAT, 
                    duration: 0.4, weight: 0.85,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato', 
                    pan: (this.rng.next() * 1.4) - 0.7
                });
            });
        }

        return events;
    }

    /**
     * #ЗАЧЕМ: Гипер-детализированная кухня (ПЛАН №1029).
     * #ЧТО: Сканирующая сетка 16-х долей, заполняющая все пустоты.
     */
    private renderPsybientKitchen(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const beatDuration = TICK_TO_BEAT;
        
        const kitchenPool = [
            'bongo_pvc-tube-01', 'bongo_pvc-tube-02', 'bongo_pvc-tube-03',
            'bongo_pc-01', 'bongo_pc-02', 'bongo_pc-03',
            'perc-003', 'perc-007', 'perc-012', 'perc-015',
            'drum_Bell_-_Ambient', 'drum_Bell_-_Astro', 'drum_Bell_-_Soft', 'drum_Bell_-_click'
        ];

        // Scanning grid logic: check every 1.5 ticks (16th note)
        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            // Skip strong beats (0, 3, 6, 9) to avoid masking kick/snare
            if (t % 3 === 0) continue;

            // Higher chance on higher tension
            if (this.rng.chance(75 + tension * 20)) {
                const sample = kitchenPool[this.rng.nextInt(kitchenPool.length)];
                events.push({
                    type: sample as any, note: 48, time: t * beatDuration, duration: 0.5, 
                    weight: 0.5 + (this.rng.next() * 0.3), // INCREASED VELOCITY
                    technique: 'hit', dynamics: 'p', phrasing: 'detached', 
                    pan: (this.rng.next() * 1.8) - 0.9 // WIDER PAN
                });
            }
        }

        // Rapid "Bubbling" bursts (tubes/perc)
        if (this.rng.chance(40)) {
            const start = this.rng.nextInt(6);
            const sample = kitchenPool[this.rng.nextInt(6)];
            for(let i=0; i<4; i++) {
                events.push({
                    type: sample as any, note: 48, time: (start + i*0.375) * beatDuration, 
                    duration: 0.15, weight: 0.4, technique: 'hit', dynamics: 'p', 
                    phrasing: 'staccato', pan: (this.rng.next() * 1.2) - 0.6
                });
            }
        }

        return events;
    }

    private renderRollingBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        
        for (let t = 0; t < TICKS_PER_BAR; t += 1.5) {
            const isBeat = t % 3 === 0;
            const note = isBeat ? root : root + [0, 3, 7, 10][this.rng.nextInt(4)];
            events.push({
                type: 'bass', note, time: (t + 0.1) * TICK_TO_BEAT, duration: 1.2 * TICK_TO_BEAT, weight: isBeat ? 1.0 : 0.8,
                technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
                params: { filterCutoff: 800 + tension * 1500 }
            });
        }
        return events;
    }

    private renderLegacySolo(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const lickKeys = Object.keys(BLUES_SOLO_LICKS).filter(k => k.startsWith('LN_'));
        const key = lickKeys[calculateMusiNum(epoch, 13, this.seed, lickKeys.length)];
        const lick = BLUES_SOLO_LICKS[key];
        
        if (!lick) return [];
        const rawPhrase = decompressCompactPhrase(lick.phrase as any);
        
        return rawPhrase.map(n => ({
            type: 'melody',
            note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: n.t * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.85,
            technique: 'pick',
            dynamics: 'mf',
            phrasing: 'legato',
            params: { filterCutoff: 2000 + tension * 2000, swell: true, mood: this.mood }
        }));
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const isMinor = chord.chordType === 'minor';
        const intervals = isMinor ? [0, 3, 7, 10] : [0, 4, 7, 11];
        return intervals.map((interval, i) => ({
            type: 'accompaniment', note: chord.rootNote + 12 + interval,
            time: 0.1, duration: 3.8, weight: 0.5,
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            pan: (i % 2 === 0 ? -0.6 : 0.6),
            params: { 
                attack: 1.5, release: 2.5, 
                gainCurve: [1.0, 0.2, 0.9, 0.3, 1.0, 0.4, 1.0], 
                filterCutoff: 1000 + tension * 1000 
            }
        }));
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        
        // 1. Sparkles (Crystals/Drops) - GUARANTEED + LOUDER
        if (this.rng.chance(45 + tension * 30)) {
            events.push({
                type: 'sparkle', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, 
                duration: 6.0, weight: 0.8, // LOUDER
                technique: 'hit', dynamics: 'p', phrasing: 'legato',
                pan: (this.rng.next() * 1.8) - 0.9,
                params: { mood: this.mood, genre: this.genre, category: tension < 0.5 ? 'light' : 'ambient_common' }
            });
        }

        // 2. SFX (Voices/Lasers) - GUARANTEED + LOUDER
        if (this.rng.chance(30 + tension * 20)) {
            events.push({
                type: 'sfx', note: 60, time: this.rng.nextInt(12) * TICK_TO_BEAT, 
                duration: 4.0, weight: 0.7, // LOUDER
                technique: 'hit', dynamics: 'p', phrasing: 'staccato',
                pan: (this.rng.next() * 1.6) - 0.8,
                params: { mood: this.mood, genre: this.genre }
            });
        }

        return events;
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.currentTheme.startBar;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8,
            technique: 'pick', dynamics: 'mf', phrasing: 'legato',
            params: { filterCutoff: 2000 + tension * 2500, swell: true }
        }));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.currentBassTheme.startBar;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        
        return barNotes.map(n => ({
            type: 'bass', note: chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'f', phrasing: 'detached',
            params: { filterCutoff: 600 + tension * 1200 }
        }));
    }
}
