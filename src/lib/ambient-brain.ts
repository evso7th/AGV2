/**
 * @fileOverview Ambient Brain V94.0 — "Spectral Clarity Update".
 * #ЗАЧЕМ: ПЛАН №1217 — Устранение перегруза и гула.
 * #ЧТО: Сокращение релизов, снижение громкости и замена вибрато на плавный swell.
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
    applyRhythmicJitter
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';
import { BLUES_SOLO_LICKS } from './assets/blues_guitar_solo';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    // --- State & Memory ---
    private history: { chord: GhostChord; tension: number; events: FractalEvent[] }[] = [];
    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1;
    
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAxiomMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id?: string, endBar: number, preferredInstrument?: string }[] = [];
    
    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    private currentMutationType: string = 'none';
    private currentGapLickId: string = 'none';

    private readonly MELODY_CEILING = 78;
    private readonly BASS_FLOOR = 31;
    private readonly BASS_CEILING = 47;

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
        return { next, nextInt: (max: number) => Math.floor(next() * max) };
    }

    public updateCloudAxioms(axioms: any[], activeAnchorId?: string | null, useHeritage?: boolean, isImprovising?: boolean) {
        this.cloudAxioms = axioms || [];
        if (activeAnchorId !== undefined) this.activeAnchorId = activeAnchorId;
        if (useHeritage !== undefined) this.useHeritage = useHeritage;
        if (isImprovising !== undefined) this.isImprovising = isImprovising;
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
                const moods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                return genres.includes(this.genre) && moods.includes(this.mood);
            });

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const first = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(first.compositionId);
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
                    const cid = normalizeStr(selected.compositionId);
                    
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4) };

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    accompSiblings.forEach(ax => {
                        this.currentAccompAxioms.push({ 
                            phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, preferredInstrument: ax.preferredInstrument, endBar: epoch + (selected.bars || 4)
                        });
                    });

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

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): any {
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        this.currentTimeScale = navInfo.currentPart.instrumentRules?.melody?.timeScale || 1;
        this.currentGapLickId = 'none';

        if (epoch % 4 === 0) {
            const roll = calculateMusiNum(epoch, 17, this.seed, 100);
            if (roll < 40) this.currentMutationType = 'none';
            else if (roll < 60) this.currentMutationType = 'inversion';
            else if (roll < 80) this.currentMutationType = 'retrograde';
            else this.currentMutationType = 'jitter';
        }

        if (epoch >= this.soloistBusyUntilBar) this.selectNextAxiom(navInfo, dna, epoch);

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];
        const instrumentOverrides: Partial<InstrumentHints> = {};

        // 1. Bass
        if (hints.bass) {
            const b = (this.currentBassTheme && epoch < this.currentBassTheme.endBar)
                ? this.renderHeritageBass(epoch, resChord, tension)
                : this.renderDroneBass(resChord, epoch, tension);
            events.push(...b);
        }

        // 2. Melody
        if (hints.melody) {
            let m: FractalEvent[] = [];
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                m = this.renderHeritageMelody(epoch, resChord, tension, this.currentTimeScale);
            }
            
            if (m.length === 0) {
                m = this.renderGapFiller(epoch, resChord, tension);
            }

            events.push(...m);
            if (this.currentPreferredInstrument) instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, tension, 'melody', 'ambient');
        }

        // 3. Accompaniment & Piano
        const usedLayers = new Set<string>();
        
        // --- MONOLITH PROTOCOL ---
        if (hints.bass && hints.accompaniment) {
            const bassNotesInBar = events.filter(e => e.type === 'bass');
            if (bassNotesInBar.length > 0) {
                bassNotesInBar.forEach(be => {
                    events.push({
                        ...be,
                        type: 'accompaniment',
                        note: be.note + (be.note < 40 ? 24 : 12),
                        weight: be.weight * 0.45, // #ЗАЧЕМ: Снижение громкости для устранения перегруза.
                        technique: 'swell',
                        params: { ...be.params, attack: 2.0, release: 6.0, genre: 'ambient' }
                    });
                });
                usedLayers.add('accompaniment');
            }
        }

        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = role.includes('piano') ? 'pianoAccompaniment' : (role.includes('accomp') ? 'accompaniment' : (role.includes('harmony') ? 'harmony' : null));
            if (target && hints[target] && !usedLayers.has(target)) {
                events.push(...this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension));
                usedLayers.add(target);
                if (ax.preferredInstrument) instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'ambient');
            }
        });

        if (hints.accompaniment && !usedLayers.has('accompaniment')) {
            events.push(...this.renderEvolvingPad(resChord, epoch, tension));
        }

        // 4. Drums
        if (hints.drums) {
            events.push(...this.renderSonicLandscape(epoch, tension));
        }

        const modeStr = this.isImprovising ? 'IMPROVISATION' : 'RESTORATION';

        return {
            events, tension, beautyScore: 0.8,
            trackName: this.currentTrackName,
            mutationType: this.currentMutationType,
            instrumentOverrides,
            activeAxioms: {
                melody: this.currentGapLickId !== 'none' ? `Gap-Fill [${this.currentGapLickId}]` : (this.currentTheme ? `${this.currentTheme.id} (Cloud)` : 'Algorithmic'),
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Pulsating Drone',
                drums: 'Sonic Landscape',
                ensemble: 'SIBLING [MONOLITH]'
            },
            narrative: `Ambient ${modeStr}: ${this.currentTrackName} [Status: Pumping Textures]`
        };
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number, timeScale: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBarsInPhrase = Math.ceil((this.currentAxiomMaxTick * timeScale) / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, tension);
        
        const readingWindow = TICKS_PER_BAR / timeScale;
        const barOffset = mosaicBar * readingWindow;
        
        const rawBarNotes = this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + readingWindow);
        let barNotes = rawBarNotes.map(n => ({ ...n, t: (n.t - barOffset) * timeScale }));
        
        if (this.currentMutationType === 'inversion') barNotes = invertPhrase(barNotes);
        else if (this.currentMutationType === 'retrograde') barNotes = retrogradePhrase(barNotes);
        else if (this.currentMutationType === 'jitter') barNotes = applyRhythmicJitter(barNotes, this.seed + epoch);

        return barNotes.map(n => ({
            type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: n.t * TICK_TO_BEAT, 
            duration: (n.d * TICK_TO_BEAT * timeScale) * 1.25, 
            weight: 0.7, // Снижено с 0.8
            technique: 'swell', // #ЗАЧЕМ: Устранение вибраций (замена vb на swell).
            dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 5.0, genre: 'ambient' }
        }));
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentBassTheme.startBar, totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        
        const rawBarNotes = this.currentBassTheme.phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR);
        let barNotes = rawBarNotes.map(n => ({ ...n, t: n.t - offset }));

        if (this.currentMutationType === 'inversion') barNotes = invertPhrase(barNotes);
        else if (this.currentMutationType === 'retrograde') barNotes = retrogradePhrase(barNotes);
        else if (this.currentMutationType === 'jitter') barNotes = applyRhythmicJitter(barNotes, this.seed + epoch);

        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: n.t * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8,
            technique: 'drone', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.0, release: 4.0, genre: 'ambient' }
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, epoch - (epoch % totalBars), totalBars, tension);
        const offset = mosaicBar * TICKS_PER_BAR;
        
        let barNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({ ...n, t: n.t - offset }));

        if (this.currentMutationType === 'inversion') barNotes = invertPhrase(barNotes);
        else if (this.currentMutationType === 'retrograde') barNotes = retrogradePhrase(barNotes);

        return barNotes.map(n => ({
            type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: n.t * TICK_TO_BEAT, duration: (n.d * TICK_TO_BEAT), weight: 0.35, // Снижено с 0.5
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 2.5, release: 6.0, genre: 'ambient' } // #ЗАЧЕМ: Сокращение релиза для чистоты.
        }));
    }

    private renderDroneBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = this.constrainBassOctave(chord.rootNote - 12);
        return [
            {
                type: 'bass', note: root,
                time: 0, duration: 6.0, weight: 0.65, technique: 'drone', dynamics: 'p', phrasing: 'legato',
                params: { attack: 1.5, release: 4.0, genre: 'ambient' }
            },
            {
                type: 'bass', note: root + (tension > 0.7 ? 7 : 0), 
                time: 6.0 * TICK_TO_BEAT, duration: 6.0, weight: 0.45, technique: 'drone', dynamics: 'p', phrasing: 'legato',
                params: { attack: 2.0, release: 3.0, genre: 'ambient' }
            }
        ];
    }

    private renderEvolvingPad(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12;
        const intervals = chord.chordType === 'minor' ? [0, 3, 7, 10] : [0, 4, 7, 11];
        return intervals.map((interval, i) => ({
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root + interval),
            time: (i * 0.5) * TICK_TO_BEAT, duration: 8.0, weight: 0.3 - (i * 0.05),
            technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 3.0 + i, release: 6.0, genre: 'ambient' }
        }));
    }

    private renderGapFiller(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (this.random.next() > (0.3 + tension * 0.2)) return [];
        const lickKeys = Object.keys(BLUES_SOLO_LICKS).filter(k => k.startsWith('LN_'));
        const lickId = lickKeys[calculateMusiNum(epoch, 13, this.seed, lickKeys.length)];
        const masterpiece = BLUES_SOLO_LICKS[lickId];
        if (!masterpiece) return [];
        this.currentGapLickId = lickId;

        const phrase = decompressCompactPhrase(masterpiece.phrase as any);
        const barInLick = epoch % 4; 
        const offset = barInLick * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= offset && n.t < offset + TICKS_PER_BAR).map(n => ({ ...n, t: n.t - offset }));
        
        return barNotes.map(n => ({
            type: 'melody',
            note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
            time: n.t * TICK_TO_BEAT,
            duration: (n.d * TICK_TO_BEAT) * 1.5,
            weight: 0.4 + (tension * 0.15),
            technique: 'swell', 
            dynamics: 'p',
            phrasing: 'legato',
            params: { attack: 2.0, release: 5.0, genre: 'ambient' }
        }));
    }

    private renderSonicLandscape(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;
        const hitCount = 2 + calculateMusiNum(epoch, 3, this.seed, 4);
        for (let i = 0; i < hitCount; i++) {
            const perc = kit.perc[calculateMusiNum(epoch + i, 11, this.seed, kit.perc.length)];
            events.push({
                type: perc as any, note: 48, time: (this.random.next() * TICKS_PER_BAR) * TICK_TO_BEAT, 
                duration: 6.0, weight: 0.25 + (this.random.next() * 0.25),
                technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.random.next() * 1.8) - 0.9,
                params: { genre: 'ambient' }
            });
        }
        return events;
    }

    private rippleLongNote(e: FractalEvent, chord: GhostChord): FractalEvent[] {
        if (e.duration < 3.5) return [e]; 
        const rippled: FractalEvent[] = [];
        const isMinor = chord.chordType === 'minor';
        const ripplePool = isMinor ? [0, 3, 7, 8, 10] : [0, 4, 7, 9, 11]; 
        const numChunks = Math.ceil(e.duration / 2.0); 
        const chunkDur = e.duration / numChunks;
        const baseOctaveMidi = Math.floor(e.note / 12) * 12;

        for (let i = 0; i < numChunks; i++) {
            let note: number;
            if (i === 0) {
                note = e.note;
            } else {
                const seedOffset = Math.floor(e.time * 12);
                const idx = calculateMusiNum(seedOffset + i, 13, this.seed, ripplePool.length);
                note = baseOctaveMidi + ripplePool[idx];
            }
            const rawType = Array.isArray(e.type) ? e.type[0] : e.type;
            let finalNote = note;
            if (rawType === 'bass') finalNote = this.constrainBassOctave(note);
            else if (rawType === 'melody') finalNote = Math.min(note, this.MELODY_CEILING);
            else finalNote = this.constrainAccompanimentOctave(note);

            rippled.push({
                ...e,
                note: finalNote,
                time: e.time + (i * chunkDur),
                duration: chunkDur * 1.1,
                weight: e.weight * 0.8,
                params: { ...e.params, attack: i === 0 ? (e.params?.attack || 0.5) : 1.2, release: 5.0 }
            });
        }
        return rippled;
    }

    private constrainBassOctave(n: number): number { let v = n; while (v > 47) v -= 12; while (v < 31) v += 12; return v; }
    private constrainAccompanimentOctave(n: number): number { let v = n; while (v > 71) v -= 12; while (v < 48) v += 12; return v; }
}
