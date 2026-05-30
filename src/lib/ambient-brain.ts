/**
 * @fileOverview Ambient Brain V94.0 — "The Velvet Register".
 * #ЗАЧЕМ: Исправление "писклявого" звука.
 * #ЧТО: ПЛАН №22800 — Опускание мелодии на 1 октаву для естественного звучания.
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
    GEO_ATLAS,
    decompressCompactPhrase,
    mergeIdenticalNotes,
    keyToMidiRoot,
    normalizeStr,
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    generateStitchPhrase,
    getScaleForMood,
    applyDynamicArticulation,
    applyMicroChronos,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    transposePhraseDegrees
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private fog: number = 0.3;
    private depth: number = 0.4;
    private bright: number = 0.3;
    private registerShift: number = 0;
    private currentTransposition: number = 0;
    private microTransposition: number = 0;
    private degreeTransposition: number = 0;
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;

    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1;
    private bridgeUntilBar: number = -1;

    private readonly MELODY_CEILING = 72; // C5 - Standard Lead Ceiling
    private readonly BASS_FLOOR = 31;
    private readonly BASS_CEILING = 47;

    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string, tags: string[] } | null = null;
    private lastMelodyNote: number = 60;
    private currentThemeMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number, id: string } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id: string, endBar: number, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string, id: string, endBar: number }[] = [];

    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private currentMutationType: string = 'none';

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
        const nextInt = (max: number) => Math.floor(next() * max);
        return { next, nextInt };
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
        const rand = calculateMusiNum(epoch, 17, this.seed, 100) / 100;
        if (tension > 0.8 && (rand < 0.15 || rand > 0.95)) return (linearIndex + 1) % totalBars;
        return linearIndex;
    }

    private selectNextAxiom(navInfo: NavigationInfo, dna: SuiteDNA, epoch: number): number | undefined {
        this.currentTheme = null;
        this.currentBassTheme = null;
        this.currentAccompAxioms = [];
        this.currentDrumAxioms = [];
        this.currentNativeRoot = null;
        this.currentPreferredInstrument = null;

        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            for (let i = 0; i < poolToUse.length; i++) {
                if (normalizeStr(poolToUse[i].compositionId) === effectiveAnchor) filteredPool.push(poolToUse[i]);
            }
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood] || 'neutral';
            for (let i = 0; i < poolToUse.length; i++) {
                const ax = poolToUse[i];
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                const axCommons = Array.isArray(ax.commonMood) ? ax.commonMood : [ax.commonMood];
                if (axGenres.includes('ambient') && (axMoods.includes(this.mood) || axCommons.includes(commonMoodFilter))) {
                    filteredPool.push(ax);
                }
            }
        }

        if (filteredPool.length > 0) {
            let basePool: any[] = [];
            for (let i = 0; i < filteredPool.length; i++) {
                if (filteredPool[i].role === 'melody') basePool.push(filteredPool[i]);
            }
            if (basePool.length === 0) {
                for (let i = 0; i < filteredPool.length; i++) {
                    if (filteredPool[i].role.toLowerCase().includes('accomp')) basePool.push(filteredPool[i]);
                }
            }

            if (basePool.length > 0) {
                if (!effectiveAnchor) {
                    const firstSelection = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                    this.sessionAnchorId = normalizeStr(firstSelection.compositionId);
                    effectiveAnchor = this.sessionAnchorId;
                    filteredPool = [];
                    for (let i = 0; i < poolToUse.length; i++) {
                        if (normalizeStr(poolToUse[i].compositionId) === effectiveAnchor) filteredPool.push(poolToUse[i]);
                    }
                    basePool = [];
                    for (let i = 0; i < filteredPool.length; i++) {
                        if (filteredPool[i].role === 'melody' || filteredPool[i].role.toLowerCase().includes('accomp')) basePool.push(filteredPool[i]);
                    }
                }

                let maxDonorBars = 0;
                for (let i = 0; i < basePool.length; i++) {
                    const total = (basePool[i].barOffset || 0) + (basePool[i].bars || 4);
                    if (total > maxDonorBars) maxDonorBars = total;
                }

                const suitePlayhead = epoch % (maxDonorBars || 144);
                let selected: any = null;

                if (this.isImprovising) {
                    selected = basePool[calculateMusiNum(this.seed, 19, epoch, basePool.length)];
                } else {
                    for (let i = 0; i < basePool.length; i++) {
                        if ((basePool[i].barOffset || 0) === (suitePlayhead % (maxDonorBars || 1))) {
                            selected = basePool[i];
                            break;
                        }
                    }
                    if (!selected) selected = basePool[0];
                }

                if (selected) {
                    this.currentTrackName = selected.compositionId;
                    this.currentNativeRoot = keyToMidiRoot(selected.nativeKey);
                    this.currentPreferredInstrument = selected.preferredInstrument || null;
                    
                    let rawPhrase = decompressCompactPhrase(selected.phrase);
                    if (selected.role === 'melody') rawPhrase = mergeIdenticalNotes(rawPhrase);

                    const cid = normalizeStr(selected.compositionId);
                    
                    for (let i = 0; i < poolToUse.length; i++) {
                        const ax = poolToUse[i];
                        if (normalizeStr(ax.compositionId) !== cid || ax.barOffset !== selected.barOffset) continue;
                        
                        const role = ax.role.toLowerCase();
                        if (role === 'bass') {
                            this.currentBassTheme = { phrase: decompressCompactPhrase(ax.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4), id: ax.id };
                        } else if (role.includes('accomp') || role.includes('piano') || role.includes('harmony')) {
                            this.currentAccompAxioms.push({ 
                                phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, 
                                preferredInstrument: ax.preferredInstrument, endBar: epoch + (selected.bars || 4)
                            });
                        } else if (role.includes('drum')) {
                            this.currentDrumAxioms.push({ phrase: decompressCompactPhrase(ax.phrase), role: ax.role, id: ax.id, endBar: epoch + (selected.bars || 4) });
                        }
                    }

                    const baseBars = selected.bars || 4;
                    this.currentThemeMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { 
                        phrase: rawPhrase, startBar: epoch, endBar: epoch + baseBars, 
                        id: selected.id, tags: selected.tags || []
                    };
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
            const rawType = Array.isArray(e.type) ? e.type[0] : e.type;
            let finalNote = note;
            if (rawType === 'bass') finalNote = this.constrainBassOctave(note);
            else if (rawType === 'melody') finalNote = Math.min(note, this.MELODY_CEILING);
            else finalNote = this.constrainAccompanimentOctave(note);

            rippled.push({
                ...e, note: finalNote, time: e.time + (i * chunkDur), duration: chunkDur,
                params: { ...e.params, attack: i === 0 ? (e.params?.attack || 1.5) : 0.8, release: 2.5 }
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
    ): { events: FractalEvent[], tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string, trackName?: string, newBpm?: number, instrumentOverrides?: Partial<InstrumentHints> } {

        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const localTension = tension;
        const isBridge = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');

        if (navInfo.isPartTransition) {
            this.soloistBusyUntilBar = epoch;
            const shifts = [0, 2, -2, 5, 7, -5];
            this.currentTransposition = shifts[this.random.nextInt(shifts.length)];
            this.microTransposition = 0;
            this.degreeTransposition = 0;
        }

        if (epoch % 8 === 0 && epoch >= 4) {
            const mutationRand = this.random.next();
            const mutationThreshold = this.isImprovising ? 0.9 : 0.5;
            if (mutationRand < mutationThreshold * 0.25) {
                this.degreeTransposition = [-1, 1, 2, -2][this.random.nextInt(4)];
                this.currentMutationType = 'transpose_deg';
            }
            else if (mutationRand < mutationThreshold * 0.5) this.currentMutationType = 'inversion';
            else if (mutationRand < mutationThreshold * 0.75) this.currentMutationType = 'retrograde';
            else if (mutationRand < mutationThreshold) this.currentMutationType = 'jitter';
            else this.currentMutationType = 'none';
        } else if (epoch < 4) {
            this.currentMutationType = 'none';
        }

        const isSoloistFree = epoch >= this.soloistBusyUntilBar;
        const isSoloistResting = epoch < this.soloistRestingUntilBar;
        const isBridging = epoch === this.bridgeUntilBar;

        let newBpm: number | undefined;
        let melodyStatus = 'Waiting';

        if (isSoloistFree && !isSoloistResting && !isBridging) {
            if (this.currentTheme && this.useHeritage) {
                this.bridgeUntilBar = epoch;
                melodyStatus = 'STITCH';
            } else {
                newBpm = this.selectNextAxiom(navInfo, dna, epoch);
            }
        }

        this.applyGeography(epoch, dna);
        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];

        if (isBridge) {
            events.push(...this.renderLiquidBridge(epoch, resChord, localTension, hints));
            return {
                events, tension: localTension, beautyScore: 0.5,
                trackName: this.currentTrackName,
                activeAxioms: { melody: 'Bridge', bass: 'Scalar', drums: 'Swells', accompaniment: 'Flow', piano: 'Ghost', harmony: 'Unison' },
                narrative: `Liquid Bridge: Smooth transition`
            };
        }

        if (isBridging) {
            const scale = getScaleForMood(this.mood);
            const stitch = generateStitchPhrase(this.lastMelodyNote, resRoot + 12, scale);
            let finalStitch = stitch;
            if (epoch >= 4) {
                finalStitch = applyDynamicArticulation(stitch, localTension, this.seed + epoch);
                finalStitch = applyMicroChronos(finalStitch, this.seed, localTension);
            }
            events.push(...this.renderHeritageMelody(epoch, resChord, dna, 'melody', finalStitch, TICKS_PER_BAR, 1.0, localTension));
            melodyStatus = 'STITCH';
            this.bridgeUntilBar = -1; 
            this.soloistBusyUntilBar = epoch + 1; 
        }

        const instrumentOverrides: Partial<InstrumentHints> = {};
        if (this.currentPreferredInstrument && hints.melody) {
            instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, localTension, 'melody', 'ambient');
        }

        let accStatus = 'none';
        let bassStatus = 'none';
        let drumStatus = 'Landscape';
        let harmonyStatus = 'none';
        let pianoStatus = 'none';

        if (epoch >= 4) {
            for (let i = 0; i < this.currentAccompAxioms.length; i++) {
                const ax = this.currentAccompAxioms[i];
                const rawRole = ax.role.toLowerCase(); 
                let targetType: InstrumentPart | null = null;
                if (rawRole.includes('piano')) targetType = 'pianoAccompaniment';
                else if (rawRole.includes('accomp')) targetType = 'accompaniment';
                else if (rawRole.includes('strings') || rawRole.includes('violin') || rawRole.includes('guitar')) targetType = 'harmony';
                
                if (targetType && hints[targetType]) {
                    let activePhrase = ax.phrase;
                    if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                    else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
                    else if (this.currentMutationType === 'jitter') activePhrase = applyRhythmicJitter(activePhrase, this.seed + epoch);
                    else if (this.currentMutationType === 'transpose_deg') activePhrase = transposePhraseDegrees(activePhrase, this.degreeTransposition);

                    activePhrase = applyDynamicArticulation(activePhrase, localTension, this.seed + epoch + 100);
                    activePhrase = applyMicroChronos(activePhrase, this.seed + 200, localTension);

                    const rendered = this.renderHeritageLayer(resChord, epoch, activePhrase, targetType, dna, localTension);
                    if (rendered.length > 0) {
                        events.push(...rendered);
                        if (targetType === 'accompaniment') accStatus = ax.id;
                        if (targetType === 'pianoAccompaniment') pianoStatus = ax.id;
                        if (targetType === 'harmony') harmonyStatus = ax.id;
                    }
                }
            }
            
            if (hints.accompaniment && accStatus === 'none') {
                events.push(...this.renderPad(resChord, epoch, hints.accompaniment as string, localTension));
                accStatus = 'Adaptive';
            }
            if (hints.harmony && harmonyStatus === 'none') {
                const harProb = 15 + (localTension * 50); 
                if (calculateMusiNum(epoch, 7, this.seed, 100) < harProb) {
                    events.push(...this.renderGenerativeHarmony(resChord, epoch, localTension, hints.harmony));
                    harmonyStatus = 'Algo';
                }
            }
        }

        const bassEvents = hints.bass ? this.renderSymbioticBass(resChord, epoch, localTension, dna) : [];
        if (bassEvents.length > 0) {
            events.push(...bassEvents);
            bassStatus = this.currentBassTheme ? this.currentBassTheme.id : 'Algo';
        }

        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isSoloistResting && !isBridging) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                let activePhrase = this.currentTheme.phrase;
                if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
                else if (this.currentMutationType === 'jitter') activePhrase = applyRhythmicJitter(activePhrase, this.seed + epoch);
                else if (this.currentMutationType === 'transpose_deg') activePhrase = transposePhraseDegrees(activePhrase, this.degreeTransposition);
                
                if (epoch >= 4) {
                    activePhrase = applyDynamicArticulation(activePhrase, localTension, this.seed + epoch);
                    activePhrase = applyMicroChronos(activePhrase, this.seed, tension);
                }
                // #ЗАЧЕМ: ПЛАН №22800. Опускаем на 12 полутонов.
                melodyEvents = this.renderMelodicSegment(epoch, resChord, dna, 'melody', activePhrase, this.currentThemeMaxTick, this.currentTimeScale, localTension);
                melodyStatus = this.currentTheme.id;
            } else {
                melodyEvents = this.renderMelodicPadBase(resChord, epoch, localTension);
                melodyStatus = 'PadAlgo';
            }
            melodyEvents = this.applyMelodicTie(melodyEvents, resChord);
            if (melodyEvents.length > 0) this.lastMelodyNote = melodyEvents[melodyEvents.length - 1].note;
            events.push(...melodyEvents);
        }

        if (hints.pianoAccompaniment && pianoStatus === 'none') {
            const p = this.renderVirtuosoPiano(epoch, resChord, localTension, melodyEvents);
            if (p.events.length > 0) {
                events.push(...p.events);
                pianoStatus = p.style;
            }
        }

        if (hints.drums) {
            const dHeritage = this.renderHeritageDrums(epoch, tension);
            if (dHeritage.length > 0) {
                events.push(...dHeritage);
                drumStatus = this.currentDrumAxioms[0].id;
            } else {
                events.push(...this.renderSonicLandscape(epoch, localTension));
            }
        }

        events.push(...this.renderAtmosphericEvents(epoch, localTension));

        return {
            events, tension: localTension, beautyScore: 0.5,
            mutationType: this.currentMutationType, newBpm,
            trackName: this.currentTrackName, instrumentOverrides,
            activeAxioms: {
                melody: melodyStatus, bass: bassStatus, drums: drumStatus,
                accompaniment: accStatus, piano: pianoStatus, harmony: harmonyStatus
            },
            narrative: `Ambient: ${melodyStatus}`
        };
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        if (epoch < 12) return [];
        const events: FractalEvent[] = [];
        const sparkleProb = 0.03 + (tension * 0.09); 
        if (this.random.next() < sparkleProb) {
            const categories = ['light', 'electronic', 'ambient_common', 'root', 'promenade'];
            const category = categories[calculateMusiNum(epoch, 17, this.seed, categories.length)];
            events.push({ 
                type: 'sparkle', note: 60, time: (this.random.nextInt(TICKS_PER_BAR)) * TICK_TO_BEAT, 
                duration: 6.0, weight: 1.2, technique: 'hit', dynamics: 'mf', phrasing: 'legato', 
                pan: (this.random.next() * 1.8) - 0.9, 
                params: { mood: this.mood, genre: this.genre, category } 
            });
        }
        const sfxProb = 0.02 + (tension * 0.06); 
        if (this.random.next() < sfxProb) {
            events.push({ 
                type: 'sfx', note: 60, time: (this.random.nextInt(TICKS_PER_BAR)) * TICK_TO_BEAT, 
                duration: 4.0, weight: 1.1, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', 
                pan: (this.random.next() * 1.6) - 0.8, 
                params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'voice', weight: 1.0 }] } } 
            });
        }
        return events;
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        
        for (let i = 0; i < this.currentDrumAxioms.length; i++) {
            const ax = this.currentDrumAxioms[i];
            for (let j = 0; j < ax.phrase.length; j++) {
                const n = ax.phrase[j];
                if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                    events.push({ type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0), time: (n.t - barOffset) * TICK_TO_BEAT, duration: 0.1, weight: 0.35, technique: 'hit', dynamics: 'mf', phrasing: 'staccato' });
                }
            }
        }
        return events;
    }

    private renderSonicLandscape(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;
        if (this.random.next() < 0.30) {
            events.push({ type: (kit.kick[this.random.nextInt(kit.kick.length)] || 'drum_kick_soft') as any, note: 36, time: [0, 6][this.random.nextInt(2)] * TICK_TO_BEAT, duration: 0.1, weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        }
        const landscapeDensity = 2 + this.random.nextInt(Math.floor(tension * 5) + 3);
        for (let i = 0; i < landscapeDensity; i++) {
            events.push({ type: kit.perc[this.random.nextInt(kit.perc.length)] as any, note: 48, time: this.random.next() * TICKS_PER_BAR * TICK_TO_BEAT, duration: 1.2, weight: 0.3 + (this.random.next() * 0.3), technique: 'hit', dynamics: 'p', phrasing: 'detached', pan: (this.random.next() * 1.8) - 0.9 });
        }
        return events;
    }

    private renderSymbioticBass(chord: GhostChord, epoch: number, tension: number, dna: SuiteDNA): FractalEvent[] {
        if (this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
            const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
            const startEpoch = this.soloistBusyUntilBar - totalBars;
            const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
            const barOffset = mosaicBar * TICKS_PER_BAR;
            let activePhrase = this.currentBassTheme.phrase;
            if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
            if (epoch >= 4) activePhrase = applyMicroChronos(activePhrase, this.seed + 250, tension);
            
            for (let i = 0; i < activePhrase.length; i++) {
                const n = activePhrase[i];
                if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                    const e: FractalEvent = { type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition), time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8, technique: n.tech as Technique, dynamics: 'p', phrasing: 'legato' };
                    return this.rippleLongNote(e, chord);
                }
            }
        }
        const e: FractalEvent = { type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + this.currentTransposition + this.microTransposition), time: 0, duration: 4.0, weight: 0.7, technique: 'drone', dynamics: 'p', phrasing: 'legato' };
        return this.rippleLongNote(e, chord);
    }

    private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
        const totalBars = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
        const results: FractalEvent[] = [];
        
        for (let i = 0; i < phrase.length; i++) {
            const n = phrase[i];
            if (n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale)) {
                // #ЗАЧЕМ: ПЛАН №22800. Понижаем базовый регистр с +24 до +12.
                const e: FractalEvent = {
                    type: type as any, note: Math.min(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
                    time: (n.t - barOffset) * TICK_TO_BEAT * timeScale, duration: (n.d * TICK_TO_BEAT * timeScale) * 1.25, weight: 0.7,
                    technique: n.tech as Technique, dynamics: 'p', phrasing: 'legato', params: { attack: 1.5, release: 3.5 }
                };
                results.push(...this.rippleLongNote(e, chord));
            }
        }
        return results;
    }

    private renderHeritageLayer(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const results: FractalEvent[] = [];
        
        for (let i = 0; i < phrase.length; i++) {
            const n = phrase[i];
            if (n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR) {
                const e: FractalEvent = {
                    type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition),
                    time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.35, technique: n.tech as Technique, dynamics: 'p', phrasing: 'staccato'
                };
                results.push(...this.rippleLongNote(e, chord));
            }
        }
        return results;
    }

    private renderPad(chord: GhostChord, epoch: number, name: string, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition;
        const e: FractalEvent = { type: 'accompaniment', note: this.constrainAccompanimentOctave(root), time: 0, duration: 4.0, weight: 0.6, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 2.0, release: 3.0 } };
        return this.rippleLongNote(e, chord);
    }

    private renderMelodicPadBase(resChord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        // #ЗАЧЕМ: ПЛАН №22800. Понижаем базовый регистр с +24 до +12.
        const e: FractalEvent = { type: 'melody', note: Math.min(resChord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition, this.MELODY_CEILING), time: 0, duration: 4.5, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato' };
        return this.rippleLongNote(e, resChord);
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (melodyEvents.length === 0) return { events: [], style: 'Waiting' };
        const third = chord.chordType === 'minor' ? 3 : 4;
        for (let i = 0; i < melodyEvents.length; i++) {
            if (i % 2 === 0) {
                events.push({ ...melodyEvents[i], type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(melodyEvents[i].note + third), weight: 0.25, technique: 'hit', phrasing: 'staccato' });
            }
        }
        return { events, style: "Shadow" };
    }

    private renderGenerativeHarmony(resChord: GhostChord, epoch: number, localTension: number, timbre?: string): FractalEvent[] {
        const root = resChord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition;
        if (timbre === 'guitarChords') return [ { type: 'harmony', note: root, time: 0, duration: 4.0, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato', chordName: resChord.chordType === 'minor' ? 'Am' : 'A' } ];
        const e: FractalEvent = { type: 'harmony', note: this.constrainAccompanimentOctave(root), time: 0, duration: 4.0, weight: 0.2, technique: 'swell', dynamics: 'p', phrasing: 'legato' };
        return this.rippleLongNote(e, resChord);
    }

    private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + this.currentTransposition + this.microTransposition;
        const scale = [0, 2, 4, 5, 7, 9, 11];
        for (let i = 0; i < 4; i++) {
            events.push({ type: 'bass', note: this.constrainBassOctave(root - 12 + scale[i % scale.length]), time: (i * 3) * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.7, technique: 'pick', dynamics: 'p', phrasing: 'legato' });
        }
        events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 0.8, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        return events;
    }

    private applyGeography(epoch: number, dna: SuiteDNA) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        let stage = Math.min(2, Math.floor((epoch / 150) * 3));
        const atom = GEO_ATLAS[dna.itinerary[stage]];
        if (atom) { this.fog = atom.fog; this.depth = atom.depth; this.registerShift = atom.reg; }
    }
}
