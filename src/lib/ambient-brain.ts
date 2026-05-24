/**
 * @fileOverview Ambient Brain V88.0 — "The Elastic Dreamer".
 * #ЗАЧЕМ: Реализация микро-хроноса (ритмической эластичности).
 * #ЧТО: ПЛАН №3200 — Интеграция applyMicroChronos. Музыка теперь "дышит" ритмически.
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
    LIGHT_ATLAS,
    decompressCompactPhrase,
    normalizePhraseGroup,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    transposePhraseDegrees,
    mergeIdenticalNotes,
    keyToMidiRoot,
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT,
    normalizeStr,
    generateStitchPhrase,
    getScaleForMood,
    applyDynamicArticulation,
    applyMicroChronos
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

const MOOD_TO_COMMON: Record<Mood, CommonMood> = {
  epic: 'light', joyful: 'light', enthusiastic: 'light',
  dreamy: 'neutral', contemplative: 'neutral', calm: 'neutral',
  melancholic: 'dark', dark: 'dark', anxious: 'dark', gloomy: 'dark'
};

const MIDI_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class AmbientBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;
    private isImprovising: boolean = false;

    private fog: number = 0.3;
    private pulse: number = 0.15;
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
    private accompanimentRestingUntilBar: number = -1;
    private bridgeUntilBar: number = -1;

    private readonly MELODY_CEILING = 72;
    private readonly BASS_FLOOR = 31;
    private readonly BASS_CEILING = 47;

    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string, tags: string[] } | null = null;
    private lastMelodyNote: number = 60;
    private currentThemeMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id?: string, endBar: number, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string, endBar: number }[] = [];

    private currentTrackName: string = 'Algorithmic';
    private sessionAnchorId: string | null = null; 
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
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
        this.ensembleStatus = 'ADAPTIVE';

        if (!this.useHeritage || this.cloudAxioms.length === 0) return undefined;

        const poolToUse = this.cloudAxioms.filter(ax => ax.ignored !== true);
        let effectiveAnchor = this.activeAnchorId ? normalizeStr(this.activeAnchorId) : this.sessionAnchorId;
        
        let filteredPool: any[] = [];
        if (effectiveAnchor) {
            filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
        } else {
            const commonMoodFilter = MOOD_TO_COMMON[this.mood];
            filteredPool = poolToUse.filter(ax => {
                const axGenres = Array.isArray(ax.genre) ? ax.genre : [ax.genre];
                const axMoods = Array.isArray(ax.mood) ? ax.mood : [ax.mood];
                return axGenres.includes('ambient') && (axMoods.includes(this.mood) || (Array.isArray(ax.commonMood) ? ax.commonMood.includes(commonMoodFilter) : ax.commonMood === commonMoodFilter));
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
                    if (!effectiveAnchor) {
                        const firstSelection = basePool[calculateMusiNum(this.seed, 13, 0, basePool.length)];
                        this.sessionAnchorId = normalizeStr(firstSelection.compositionId);
                        effectiveAnchor = this.sessionAnchorId;
                        filteredPool = poolToUse.filter(ax => normalizeStr(ax.compositionId) === effectiveAnchor);
                        basePool = filteredPool.filter(ax => ax.role === 'melody' || ax.role.toLowerCase().includes('accomp'));
                    }
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
                        this.currentBassTheme = { phrase: decompressCompactPhrase(bassSibling.phrase), startBar: epoch, endBar: epoch + (selected.bars || 4) };
                    }

                    const accompSiblings = poolToUse.filter(ax => (ax.role.toLowerCase().includes('accomp') || ax.role.toLowerCase().includes('piano') || ax.role.toLowerCase().includes('harmony')) && normalizeStr(ax.compositionId) === cid && ax.barOffset === selected.barOffset);
                    accompSiblings.forEach(ax => {
                        this.currentAccompAxioms.push({ 
                            phrase: decompressCompactPhrase(ax.phrase), 
                            role: ax.role, 
                            id: ax.id, 
                            preferredInstrument: ax.preferredInstrument,
                            endBar: epoch + (selected.bars || 4)
                        });
                    });

                    const drumSiblings = poolToUse.filter(ax => ax.role.toLowerCase().includes('drum') && normalizeStr(selected.compositionId) === cid && ax.barOffset === selected.barOffset);
                    drumSiblings.forEach(ax => { 
                        this.currentDrumAxioms.push({ 
                            phrase: decompressCompactPhrase(ax.phrase), 
                            role: ax.role,
                            endBar: epoch + (selected.bars || 4)
                        }); 
                    });

                    const baseBars = selected.bars || 4;
                    this.currentThemeMaxTick = baseBars * TICKS_PER_BAR;
                    this.currentTheme = { 
                        phrase: rawPhrase, 
                        startBar: epoch, 
                        endBar: epoch + baseBars, 
                        id: selected.id,
                        tags: selected.tags || []
                    };
                    this.soloistBusyUntilBar = epoch + baseBars;
                    this.ensembleStatus = 'SIBLING';
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
                duration: chunkDur,
                params: { 
                    ...e.params, 
                    attack: i === 0 ? (e.params?.attack || 1.5) : 0.8,
                    release: 2.5 
                }
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
                const rippled = this.rippleLongNote(current, chord);
                processed.push(...rippled);
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

        this.applyGeography(epoch, dna);
        const resRoot = (this.currentNativeRoot !== null) ? this.currentNativeRoot : currentChord.rootNote;
        const resChord = { ...currentChord, rootNote: resRoot };
        const events: FractalEvent[] = [];

        const swirlPan = Math.sin(epoch * 0.2) * 0.4;

        if (isBridge) {
            const bridgeEvents = this.renderLiquidBridge(epoch, resChord, localTension, hints);
            bridgeEvents.forEach(e => {
                if(e.type === 'accompaniment') e.pan = swirlPan;
                if(e.type === 'melody') e.pan = -0.1;
            });
            events.push(...bridgeEvents);
            return {
                events, tension: localTension, beautyScore: 0.5,
                trackName: this.currentTrackName,
                activeAxioms: { melody: 'Bridge', bass: 'Scalar', drums: 'Swells', accompaniment: 'Flow', piano: 'Ghost', harmony: 'Unison' },
                narrative: `Liquid Bridge: Smooth transition through ${navInfo.currentPart.name}`
            };
        }

        // --- MUTATION DECISION ---
        if (epoch % 4 === 0) {
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

        if (isBridging) {
            const scale = getScaleForMood(this.mood);
            const nextNote = resRoot + 12 + this.registerShift; 
            const stitch = generateStitchPhrase(this.lastMelodyNote, nextNote, scale);
            // #ЗАЧЕМ: Применяем артикуляцию и микро-хронос к мосту.
            let finalStitch = applyDynamicArticulation(stitch, localTension, this.seed + epoch);
            finalStitch = applyMicroChronos(finalStitch, this.seed, localTension);
            
            const stitchEvents = this.renderMelodicSegment(epoch, resChord, dna, 'melody', finalStitch, TICKS_PER_BAR, 1.0, localTension);
            events.push(...stitchEvents);
            melodyStatus = 'STITCH';
            this.bridgeUntilBar = -1; 
            this.soloistBusyUntilBar = epoch + 1; 
        }

        const instrumentOverrides: Partial<InstrumentHints> = {};

        if (this.currentPreferredInstrument && hints.melody && !isSoloistResting) {
            instrumentOverrides.melody = resolveSemanticTimbre(this.currentPreferredInstrument, localTension, 'melody', 'ambient');
        }

        let accStatus = 'none';
        const isAccompResting = epoch < this.accompanimentRestingUntilBar;
        const usedTargetLayers = new Set<string>();
        
        if (!isAccompResting) {
            this.currentAccompAxioms.forEach((ax) => {
                const rawRole = ax.role.toLowerCase(); 
                let targetType: InstrumentPart | null = null;
                
                if (rawRole.includes('piano')) targetType = 'pianoAccompaniment';
                else if (rawRole.includes('accomp')) targetType = 'accompaniment';
                else if (rawRole.includes('strings') || rawRole.includes('violin') || rawRole.includes('harmony')) targetType = 'harmony';
                
                if (targetType && hints[targetType] && !usedTargetLayers.has(targetType)) {
                    let activePhrase = ax.phrase;
                    if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                    else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
                    else if (this.currentMutationType === 'jitter') activePhrase = applyRhythmicJitter(activePhrase, this.seed + epoch);
                    else if (this.currentMutationType === 'transpose_deg') activePhrase = transposePhraseDegrees(activePhrase, this.degreeTransposition);

                    // #ЗАЧЕМ: ПЛАН №3200. Плотная артикуляция и микро-хронос.
                    activePhrase = applyDynamicArticulation(activePhrase, localTension, this.seed + epoch + 100);
                    activePhrase = applyMicroChronos(activePhrase, this.seed + 200, localTension);

                    const accEvents = this.renderHeritageAccompaniment(resChord, epoch, activePhrase, targetType, dna, localTension);
                    
                    if (accEvents.length > 0) {
                        if (ax.preferredInstrument) {
                            instrumentOverrides[targetType] = resolveSemanticTimbre(ax.preferredInstrument, localTension, targetType, 'ambient');
                        }
                        accEvents.forEach(e => e.pan = swirlPan);
                        events.push(...accEvents);
                        usedTargetLayers.add(targetType);
                        if (targetType === 'accompaniment') accStatus = `Heritage`;
                    }
                }
            });
            
            if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
                const padEvents = this.renderPad(resChord, epoch, hints.accompaniment as string, localTension);
                padEvents.forEach(e => e.pan = swirlPan);
                events.push(...padEvents);
                usedTargetLayers.add('accompaniment');
                accStatus = 'Adaptive';
            }
            
            if (hints.harmony && !usedTargetLayers.has('harmony')) {
                if (calculateMusiNum(epoch, 7, this.seed, 100) < 45) {
                    const harEvents = this.renderGenerativeHarmony(resChord, epoch, localTension, hints.harmony);
                    harEvents.forEach(e => e.pan = 0.35); 
                    events.push(...harEvents);
                    usedTargetLayers.add('harmony');
                }
            }
        }

        let bassStatus = 'none';
        if (hints.bass && this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
            let bassPhrase = this.currentBassTheme.phrase;
            if (this.currentMutationType === 'retrograde') bassPhrase = retrogradePhrase(bassPhrase);
            else if (this.currentMutationType === 'jitter') bassPhrase = applyRhythmicJitter(bassPhrase, this.seed + epoch);
            
            // #ЗАЧЕМ: Микро-хронос басиста.
            bassPhrase = applyDynamicArticulation(bassPhrase, localTension, this.seed + epoch + 50);
            bassPhrase = applyMicroChronos(bassPhrase, this.seed + 300, localTension);

            const themeBass = this.renderThemeBass(resChord, epoch, localTension, dna, bassPhrase);
            if (themeBass.length > 0) {
                events.push(...this.constrainBass(themeBass));
                bassStatus = 'Heritage';
            } else {
                events.push(...this.constrainBass(this.renderDroneBass(resChord, epoch, localTension)));
                bassStatus = 'Algo';
            }
        } else if (hints.bass) {
            events.push(...this.constrainBass(this.renderDroneBass(resChord, epoch, localTension)));
            bassStatus = 'Algo';
        }

        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isSoloistResting && !isBridging) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                let activePhrase = this.currentTheme.phrase;
                if (this.currentMutationType === 'inversion') activePhrase = invertPhrase(activePhrase);
                else if (this.currentMutationType === 'retrograde') activePhrase = retrogradePhrase(activePhrase);
                else if (this.currentMutationType === 'jitter') activePhrase = applyRhythmicJitter(activePhrase, this.seed + epoch);
                else if (this.currentMutationType === 'transpose_deg') activePhrase = transposePhraseDegrees(activePhrase, this.degreeTransposition);

                // #ЗАЧЕМ: ПЛАН №3200. Эластичное соло.
                activePhrase = applyDynamicArticulation(activePhrase, localTension, this.seed + epoch);
                activePhrase = applyMicroChronos(activePhrase, this.seed, localTension);

                melodyEvents = this.renderThemeMelody(resChord, epoch, localTension, hints, dna, 'melody', activePhrase, this.currentThemeMaxTick, this.currentTimeScale);
                melodyStatus = this.currentTheme.id;
            } 
            if (melodyEvents.length === 0) {
                melodyEvents = this.renderMelodicPadBase(resChord, epoch, localTension);
                melodyStatus = 'Algo';
            }
            
            melodyEvents = this.applyMelodicTie(melodyEvents, resChord);
            if (melodyEvents.length > 0) {
                this.lastMelodyNote = melodyEvents[melodyEvents.length - 1].note;
            }
        }
        melodyEvents.forEach(e => e.pan = -0.15); 
        events.push(...melodyEvents);

        let pianoInfo = { style: 'none', count: 0 };
        const pianoHint = hints.pianoAccompaniment;
        if (pianoHint) {
            if (!usedTargetLayers.has('pianoAccompaniment')) {
                const p = this.renderVirtuosoPiano(epoch, resChord, localTension, melodyEvents);
                if (p.events.length > 0) {
                    p.events.forEach(e => e.pan = 0.2); 
                    events.push(...p.events);
                    pianoInfo = { style: p.style, count: p.events.length };
                    usedTargetLayers.add('pianoAccompaniment');
                }
            } else {
                pianoInfo = { style: 'Heritage', count: 1 };
            }
            
            const pianoRules = navInfo.currentPart.instrumentRules?.pianoAccompaniment;
            const pianoProb = pianoRules?.pianoProbability ?? 0.3; 
            const pianoRoll = calculateMusiNum(epoch, 17, this.seed, 100) / 100;
            const pianistMode = pianoRoll < pianoProb ? 'acoustic' : 'rhodes';
            
            instrumentOverrides.pianoAccompaniment = pianistMode === 'acoustic' ? 'piano' : 'ep_rhodes_warm';
        }

        if (hints.drums) {
            const landscapeDrums = this.renderSonicLandscape(epoch, localTension);
            events.push(...landscapeDrums);
        }

        if (hints.sparkles || hints.sfx) {
            events.push(...this.renderAtmosphericEvents(epoch, localTension));
        }

        const modeStr = this.isImprovising ? 'IMPRO' : 'RESTO';

        return {
            events, tension: localTension, beautyScore: 0.5,
            mutationType: this.currentMutationType, newBpm,
            trackName: this.currentTrackName,
            instrumentOverrides,
            activeAxioms: {
                melody: isSoloistResting ? 'Breath' : melodyStatus,
                ensemble: `${this.ensembleStatus} [${modeStr}]`,
                bass: bassStatus,
                drums: 'Landscape', 
                accompaniment: isAccompResting ? 'Breath' : accStatus,
                piano: pianoInfo.count > 0 ? `${pianoInfo.style}` : 'none',
                harmony: usedTargetLayers.has('harmony') ? 'Heritage' : 'Algo',
                sparkles: 'Spiral',
                sfx: 'Breath'
            },
            narrative: `Ambient ${modeStr}: ${this.currentTrackName}`
        };
    }

    private renderAtmosphericEvents(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.random.next() < 0.25) {
            const categories = ['light', 'electronic', 'ambient_common', 'root', 'promenade'];
            const category = categories[calculateMusiNum(epoch, 17, this.seed, categories.length)];
            events.push({ 
                type: 'sparkle', note: 60, time: this.random.nextInt(TICKS_PER_BAR) * TICK_TO_BEAT, 
                duration: 6.0, weight: 1.2, technique: 'hit', dynamics: 'mf', phrasing: 'legato', 
                pan: (this.random.next() * 1.8) - 0.9, 
                params: { mood: this.mood, genre: this.genre, category } 
            });
        }
        const breathChance = tension < 0.3 ? 0.35 : 0.18;
        if (this.random.next() < breathChance) {
            events.push({ 
                type: 'sfx', note: 60, time: this.random.nextInt(TICKS_PER_BAR) * TICK_TO_BEAT, 
                duration: 4.0, weight: 1.1, technique: 'hit', dynamics: 'mf', phrasing: 'staccato', 
                pan: (this.random.next() * 1.6) - 0.8, 
                params: { mood: this.mood, genre: this.genre, rules: { categories: [{ name: 'voice', weight: 1.0 }] } } 
            });
        }
        return events;
    }

    private renderSonicLandscape(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;

        if (this.random.next() < 0.35) {
            const time = this.random.next() * TICKS_PER_BAR; 
            events.push({
                type: (kit.kick[this.random.nextInt(kit.kick.length)] || 'drum_kick_soft') as any,
                note: 36, time: time * TICK_TO_BEAT, duration: 0.1, weight: 0.65,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });
        }

        if (this.random.next() < 0.45) {
            events.push({
                type: 'drum_ride_wetter', note: 51, 
                time: (this.random.next() * TICKS_PER_BAR) * TICK_TO_BEAT, 
                duration: 4.5, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'legato',
                pan: (this.random.next() * 1.6) - 0.8
            });
        }

        const hitCount = 2 + this.random.nextInt(Math.floor(tension * 6) + 2);
        for (let i = 0; i < hitCount; i++) {
            const perc = kit.perc[this.random.nextInt(kit.perc.length)];
            const time = this.random.next() * TICKS_PER_BAR;
            const pan = (this.random.next() * 1.8) - 0.9;
            events.push({
                type: perc as any, note: 48, 
                time: time * TICK_TO_BEAT, duration: 1.0, 
                weight: 0.4 + (this.random.next() * 0.35), 
                technique: 'hit', dynamics: 'p', phrasing: 'detached', pan
            });
        }

        if (this.currentDrumAxioms.length > 0) {
            const hDrums = this.renderHeritageDrums(epoch, tension);
            hDrums.forEach(e => { e.weight *= 0.35; events.push(e); });
        }
        return events;
    }

    private renderDroneBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const degrees = [0, 7, 9, 5, 0, 7, 2, 0];
        const shift = degrees[calculateMusiNum(epoch, 4, this.seed, 8)];
        const e: FractalEvent = {
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + shift + this.currentTransposition + this.microTransposition),
            time: 0, duration: 4.0, weight: 0.7, technique: 'drone' as Technique, dynamics: 'p' as Dynamics, phrasing: 'legato' as Phrasing,
            params: { attack: 1.5, release: 2.0, filterCutoff: 300 + (tension * 200) }
        };
        return this.rippleLongNote(e, chord);
    }

    private renderMelodicSegment(epoch: number, chord: GhostChord, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number, tension: number): FractalEvent[] {
        const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase);
        const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
        
        const rawEvents = barNotes.map(n => ({
            type: type as any,
            note: Math.min(chord.rootNote + 24 + (n.octShift ? n.octShift * 12 : 0) + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT * timeScale, 
            duration: (n.d * TICK_TO_BEAT * timeScale) * 1.25, 
            weight: 0.7,
            technique: n.tech as Technique, 
            dynamics: 'p' as Dynamics, phrasing: 'legato' as Phrasing,
            params: { attack: 1.5, release: 3.5, filterCutoff: 1600 + (tension * 1200), mood: this.mood }
        }));
        return rawEvents.flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderThemeMelody(chord: GhostChord, epoch: number, localTension: number, hints: InstrumentHints, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number): FractalEvent[] {
        const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase);
        const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
        
        const rawEvents = barNotes.map(n => ({
            type: type as any,
            note: Math.min(chord.rootNote + 24 + this.registerShift + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT * timeScale, 
            duration: (n.d * TICK_TO_BEAT * timeScale) * 1.25, 
            weight: 0.7,
            technique: n.tech as Technique, 
            dynamics: 'p' as Dynamics, phrasing: 'legato' as Phrasing,
            params: { attack: 1.5, release: 3.5, filterCutoff: 1600 + (localTension * 1200), mood: this.mood }
        }));
        return rawEvents.flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderThemeBass(chord: GhostChord, epoch: number, localTension: number, dna: SuiteDNA, phrase: any[]): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        if (barNotes.length === 0) return []; 
        const rawEvents = barNotes.map(n => ({
            type: 'bass' as any, note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.8, technique: n.tech as Technique, dynamics: 'p' as Dynamics, phrasing: 'legato' as Phrasing
        }));
        return rawEvents.flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        const rawEvents = barNotes.map(n => ({
            type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift + this.currentTransposition + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.35,
            technique: n.tech as Technique, dynamics: 'p', phrasing: 'staccato'
        }));
        return rawEvents.flatMap(e => this.rippleLongNote(e, chord));
    }

    private renderPad(chord: GhostChord, epoch: number, name: string, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition;
        const e: FractalEvent = {
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root),
            time: 0, duration: 4.0, weight: 0.6, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 2.0, release: 3.0, filterCutoff: 1200 + (tension * 800), mood: this.mood }
        };
        return this.rippleLongNote(e, chord);
    }

    private renderMelodicPadBase(resChord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const shift = [0, 2, 4, 7, 9, 7, 4, 0][calculateMusiNum(epoch, 4, this.seed, 8)];
        const e: FractalEvent = {
            type: 'melody', note: Math.min(resChord.rootNote + 24 + this.registerShift + shift + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: 0, duration: 4.5, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 3.0, filterCutoff: 1800 + (tension * 1200), mood: this.mood }
        };
        return this.rippleLongNote(e, resChord);
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];
        if (melodyEvents.length === 0) return { events: [], style: 'Waiting' };
        const thirdInterval = chord.chordType === 'minor' ? 3 : 4;
        melodyEvents.forEach((m, i) => {
            if (i % 2 === 0) {
                events.push({ ...m, type: 'pianoAccompaniment', note: this.constrainAccompanimentOctave(m.note + thirdInterval), weight: 0.25, technique: 'hit', dynamics: 'p', phrasing: 'staccato', params: { ...m.params, release: 2.5 } });
            }
        });
        return { events, style: "Shadow" };
    }

    private renderGenerativeHarmony(resChord: GhostChord, epoch: number, localTension: number, timbre?: string): FractalEvent[] {
        const root = resChord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition;
        const rootName = MIDI_NOTE_NAMES[resChord.rootNote % 12] || 'C';
        const chordName = rootName + (resChord.chordType === 'minor' ? 'm' : '');
        if (timbre === 'guitarChords') {
            const e: FractalEvent = { type: 'harmony', note: root, time: 0, duration: 4.0, weight: 0.35, technique: 'hit', dynamics: 'p', phrasing: 'staccato', chordName: chordName, params: { mood: this.mood } };
            return [e];
        }
        const interval = resChord.chordType === 'minor' ? 3 : 4;
        const e1: FractalEvent = { type: 'harmony', note: this.constrainAccompanimentOctave(root), time: 0, duration: 4.0, weight: 0.2, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 1.5, release: 2.5 } };
        const e2: FractalEvent = { type: 'harmony', note: this.constrainAccompanimentOctave(root + 7), time: 0.5, duration: 3.5, weight: 0.15, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 2.0, release: 3.0 } };
        return [...this.rippleLongNote(e1, resChord), ...this.rippleLongNote(e2, resChord)];
    }

    private constrainBass(events: FractalEvent[]): FractalEvent[] {
        return events.map(e => ({ ...e, note: this.constrainBassOctave(e.note) }));
    }

    private applyGeography(epoch: number, dna: SuiteDNA) {
        if (!dna.itinerary || dna.itinerary.length === 0) return;
        let stage = Math.min(2, Math.floor((epoch / 150) * 3));
        const atom = GEO_ATLAS[dna.itinerary[stage]];
        if (atom) { this.fog = atom.fog; this.depth = atom.depth; this.registerShift = atom.reg; }
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        if (this.currentDrumAxioms.length === 0) return [];
        const events: FractalEvent[] = [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        this.currentDrumAxioms.forEach(ax => {
            ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR).forEach(n => {
                events.push({
                    type: 'drums', note: 36 + (DEGREE_TO_SEMITONE[n.deg] || 0),
                    time: (n.t - barOffset) * TICK_TO_BEAT, duration: 0.1, weight: 0.9,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
        });
        return events;
    }

    private renderLiquidBridge(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
        const events: FractalEvent[] = []; 
        const root = chord.rootNote + this.currentTransposition + this.microTransposition; 
        const scale = [0, 2, 4, 5, 7, 9, 11];
        [0, 3, 6, 9].forEach((t, i) => { 
            events.push({ type: 'bass', note: this.constrainBassOctave(root - 12 + scale[i % scale.length]), time: t * TICK_TO_BEAT, duration: 3.0 * TICK_TO_BEAT, weight: 0.7, technique: 'pick', dynamics: 'p', phrasing: 'legato' }); 
        });
        const padE: FractalEvent = { type: 'accompaniment', note: this.constrainAccompanimentOctave(root + 12), time: 0, duration: 4.25, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 1.5, release: 2.5, mood: this.mood } };
        events.push(...this.rippleLongNote(padE, chord));
        if (hints.melody) { 
            const melE: FractalEvent = { type: 'melody', note: root + 24, time: 1.5, duration: 3.125, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { attack: 2.0, release: 3.0, mood: this.mood } };
            events.push(...this.rippleLongNote(melE, chord)); 
        }
        events.push({ type: 'drum_kick_reso', note: 36, time: 0, duration: 0.1, weight: 0.7, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        events.push({ type: 'drum_snare_ghost_note', note: 38, time: 9 * TICK_TO_BEAT, duration: 0.1, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato' });
        return events;
    }
}
