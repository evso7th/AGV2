
/**
 * @fileOverview Reggae Brain V3.5 — "Heritage First Standard".
 * #ЗАЧЕМ: Полноценная интеграция с Облачным Наследием.
 * #ЧТО: ПЛАН №1130 — Внедрена логика Sibling Search и Session Anchor из Ambient/Blues.
 *       Регги теперь — это прозрачный проигрыватель аксиом с поддержкой Протокола Ария.
 *       Дефолты: Melody(Telecaster), Accomp(Prog Organ), Harmony(GuitarChords), Piano(Rhodes).
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
    
    // Memory for consistent track playback (Anchor Persistence)
    private sessionAnchorId: string | null = null; 
    private currentTrackName: string = 'Algorithmic';
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;
    
    // Sibling Containers for Ensemble Synchronization
    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string }[] = [];

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
    }

    /**
     * #ЗАЧЕМ: Определение индекса такта внутри фразы донора.
     * В режиме импровизации индекс случаен, в режиме Анкора — линеен.
     */
    private getMosaicIndex(epoch: number, startEpoch: number, totalBars: number): number {
        if (this.isImprovising) {
            return calculateMusiNum(epoch, 11, this.seed, totalBars);
        }
        return (epoch - startEpoch) % totalBars;
    }

    /**
     * #ЗАЧЕМ: Поиск и фиксация трека-донора и всех его "сиблингов".
     */
    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentTheme = null;
        this.currentBassTheme = null;
        this.currentAccompAxioms = [];
        this.currentDrumAxioms = [];
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;
        
        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        
        // #ЗАЧЕМ: Генетическая блокировка (Anchor Lockdown).
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood];
            filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                // В свободном режиме ищем по жанру и настроению
                return axGenres.includes('reggae') && (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter);
            });
        }

        if (filteredPool.length > 0) {
            let basePool = filteredPool.filter(ax => ax.role === 'melody');
            if (basePool.length === 0) basePool = filteredPool.filter(ax => ax.role.toLowerCase().includes('accomp'));

            if (basePool.length > 0) {
                // Если сессионный якорь еще не выбран — выбираем его сейчас и навсегда
                if (!effectiveAnchor) {
                    const firstChoice = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(firstChoice.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                    // Перефильтровываем пул под новый якорь
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
                    
                    // --- SIBLING SEARCH ENGINE ---
                    // Ищем бас, ударные и аккомпанемент, записанные в этом же фрагменте
                    const bassSibling = poolToUse.find(ax => ax.role === 'bass' && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    if (bassSibling) {
                        this.currentBassTheme = { 
                            phrase: decompressCompactPhrase(bassSibling.phrase), 
                            startBar: epoch, 
                            endBar: epoch + (selected.bars || 4), 
                            id: bassSibling.id 
                        };
                    }

                    const accompSiblings = poolToUse.filter(ax => 
                        (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano')) && 
                        normalizeStr(ax.compositionId) === cid && 
                        ax.barOffset === selected.barOffset
                    );
                    this.currentAccompAxioms = accompSiblings.map(ax => ({ 
                        phrase: decompressCompactPhrase(ax.phrase), 
                        role: ax.role, 
                        id: ax.id, 
                        preferredInstrument: ax.preferredInstrument 
                    }));

                    const drumSiblings = poolToUse.filter(ax => 
                        ax.role.toLowerCase().includes('drum') && 
                        normalizeStr(ax.compositionId) === cid && 
                        ax.barOffset === selected.barOffset
                    );
                    this.currentDrumAxioms = drumSiblings.map(ax => ({ 
                        phrase: decompressCompactPhrase(ax.phrase), 
                        role: ax.role 
                    }));

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
    ): { events: FractalEvent[], tension: number, beautyScore: number, trackName?: string, activeAxioms?: any, narrative?: string, instrumentOverrides?: Partial<InstrumentHints>, newBpm?: number } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const events: FractalEvent[] = [];
        const isIntro = navInfo.currentPart.id === 'INTRO' || epoch < 4;

        let newBpm: number | undefined;
        // #ЗАЧЕМ: Смена аксиомы только когда солист "освободился".
        if (epoch >= this.soloistBusyUntilBar && !isIntro) {
            newBpm = this.selectNextAxiom(navInfo, dna, epoch);
        }

        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const instrumentOverrides: Partial<InstrumentHints> = {};

        // 1. DRUMS (DNA First)
        if (hints.drums) {
            if (this.currentDrumAxioms.length > 0) {
                events.push(...this.renderHeritageDrums(epoch, tension));
            } else {
                events.push(...this.renderDefaultReggaePulse(epoch, tension));
            }
        }

        // 2. BASS (DNA First)
        if (hints.bass) {
            if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
                events.push(...this.renderHeritageBass(epoch, resChord, tension));
            } else {
                events.push(...this.renderGenerativeBass(epoch, resChord, tension));
            }
        }

        // 3. ACCOMPANIMENT / PIANO / HARMONY (DNA First Logic)
        const usedLayers = new Set<string>();
        this.currentAccompAxioms.forEach(ax => {
            const role = ax.role.toLowerCase();
            let target: InstrumentPart | null = null;
            if (role.includes('piano')) target = 'pianoAccompaniment';
            else if (role.includes('accomp')) target = 'accompaniment';
            else if (role.includes('harmony') || role.includes('strings')) target = 'harmony';

            if (target && hints[target] && !usedLayers.has(target)) {
                events.push(...this.renderHeritageLayer(resChord, epoch, ax.phrase, target, tension));
                usedLayers.add(target);
                if (ax.preferredInstrument) {
                    instrumentOverrides[target] = resolveSemanticTimbre(ax.preferredInstrument, tension, target, 'reggae');
                }
            }
        });

        // Fallbacks for empty layers
        if (hints.accompaniment && !usedLayers.has('accompaniment')) {
            events.push(...this.renderGenerativePad(resChord, tension));
            instrumentOverrides.accompaniment = 'organ_prog';
        }
        if (hints.pianoAccompaniment && !usedLayers.has('pianoAccompaniment')) {
            instrumentOverrides.pianoAccompaniment = 'ep_rhodes_warm';
        }
        if (hints.harmony && !usedLayers.has('harmony')) {
            instrumentOverrides.harmony = 'guitarChords';
        }

        // 4. MELODY (The Soul - DNA Based with Aria Protocol)
        let activeMelLick = 'none';
        if (hints.melody && !isIntro) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                events.push(...this.renderHeritageMelody(epoch, resChord, tension));
                activeMelLick = this.currentTheme.id;
            } else {
                events.push(...this.renderGenerativeAriaMelody(epoch, resChord, tension));
                activeMelLick = 'Generative Aria';
            }
            instrumentOverrides.melody = 'telecaster';
        }

        const modeStr = this.isImprovising ? 'IMPROVISATION' : 'RESTORATION';

        return {
            events, tension, beautyScore: 0.92,
            trackName: this.currentTrackName,
            newBpm,
            instrumentOverrides,
            activeAxioms: {
                melody: isIntro ? 'Waiting' : activeMelLick,
                bass: this.currentBassTheme ? `DNA: ${this.currentBassTheme.id}` : 'Generative Pulse',
                drums: this.currentDrumAxioms.length > 0 ? 'Heritage Sync' : 'Standard Pulse'
            },
            narrative: `Reggae ${modeStr}: [DNA: ${this.currentTrackName}] [Protocol: ARIA]`
        };
    }

    private renderHeritageMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentTheme.startBar, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        
        return this.currentTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => {
            // #ЗАЧЕМ: Aria Protocol - автоматическое вибрато на затяжные ноты.
            const useVibrato = (tension > 0.4 && n.d >= 3) || n.tech === 'vb';
            
            return {
                type: 'melody', note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0), this.MELODY_CEILING),
                time: (n.t - barOffset) * TICK_TO_BEAT, 
                duration: (n.d * TICK_TO_BEAT) * 1.25, // Aria Overlap
                weight: 0.85 + (tension * 0.1),
                technique: useVibrato ? 'vb' as Technique : 'pick', 
                dynamics: 'mf', phrasing: 'legato'
            };
        });
    }

    private renderHeritageBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const mosaicBar = this.getMosaicIndex(epoch, this.currentBassTheme.startBar, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        
        return this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 1.0,
            technique: 'pulse', dynamics: 'mf', phrasing: 'detached'
        }));
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        
        return phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).map(n => ({
            type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0)),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.6, 
            technique: tension > 0.7 ? 'hit' : 'swell', dynamics: 'p', phrasing: 'staccato'
        }));
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        const totalBars = Math.ceil(this.currentAxiomMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;

        this.currentDrumAxioms.forEach(ax => {
            ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                events.push({
                    type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, 
                    duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    private renderDefaultReggaePulse(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        // Bass Drum on 3 (Standard One-Drop feeling)
        events.push({ type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        events.push({ type: 'drum_snare', note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9, technique: 'hit', dynamics: 'f', phrasing: 'staccato' });
        // Steady Hats
        [0, 3, 6, 9].forEach(t => {
            events.push({ type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.4, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        });
        return events;
    }

    private renderGenerativeBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const root = chord.rootNote - 12;
        return [
            { type: 'bass', note: root, time: 1.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 1.0, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' },
            { type: 'bass', note: root + 7, time: 7.5 * TICK_TO_BEAT, duration: 1.5 * TICK_TO_BEAT, weight: 0.8, technique: 'pulse', dynamics: 'mf', phrasing: 'detached' }
        ];
    }

    private renderGenerativePad(chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'accompaniment', note: chord.rootNote + 12, time: 0, duration: 4.0, weight: 0.5,
            technique: 'swell', dynamics: 'p', phrasing: 'legato'
        }];
    }

    private renderGenerativeAriaMelody(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (epoch % 2 === 0) return [];
        const root = chord.rootNote + 12;
        const scale = [0, 2, 3, 5, 7, 9, 10]; 
        const t = [0, 3, 6, 9][this.random.nextInt(4)];
        const note = root + scale[this.random.nextInt(scale.length)];
        return [{
            type: 'melody', note, time: t * TICK_TO_BEAT, 
            duration: (1.5 * TICK_TO_BEAT) * 1.25, // Aria Protocol
            weight: 0.75, technique: tension > 0.4 ? 'vb' : 'pick', 
            dynamics: 'mf', phrasing: 'legato'
        }];
    }

    private constrainBassOctave(note: number): number {
        let n = note; while (n > 47) n -= 12; while (n < 31) n += 12; return n;
    }

    private constrainAccompanimentOctave(note: number): number {
        let n = note; while (n > 71) n -= 12; while (n < 48) n += 12; return n;
    }
}
