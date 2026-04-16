/**
 * @fileOverview Ambient Brain V70.0 — "Sonic Landscape Protocol".
 * #ЗАЧЕМ: Превращение ударных в текстурное звуковое полотно.
 * #ЧТО: ПЛАН №1092 — Текстурная перкуссия, редкие хэты и "влажный" райд.
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
    pickWeightedDeterministic,
    GEO_ATLAS,
    LIGHT_ATLAS,
    decompressCompactPhrase,
    normalizePhraseGroup,
    invertPhrase,
    retrogradePhrase,
    applyRhythmicJitter,
    mergeIdenticalNotes,
    keyToMidiRoot,
    resolveSemanticTimbre,
    TICKS_PER_BAR,
    TICK_TO_BEAT
} from './music-theory';
import { DRUM_KITS } from './assets/drum-kits';

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
    private pianistMode: 'rhodes' | 'acoustic' = 'rhodes';

    private fog: number = 0.3;
    private pulse: number = 0.15;
    private depth: number = 0.4;
    private bright: number = 0.3;
    private registerShift: number = 0;
    private currentTransposition: number = 0;
    private microTransposition: number = 0;
    private currentNativeRoot: number | null = null;
    private currentPreferredInstrument: string | null = null;

    private soloistBusyUntilBar: number = -1;
    private soloistRestingUntilBar: number = -1;
    private accompanimentRestingUntilBar: number = -1;

    private readonly MELODY_CEILING = 72;
    private readonly BASS_FLOOR = 31;
    private readonly BASS_CEILING = 47;
    private readonly PAD_CEILING = 64;

    private currentTheme: { phrase: any[], startBar: number, endBar: number, id: string, tags: string[] } | null = null;
    private currentThemeMaxTick: number = 0;
    private currentTimeScale: number = 1;
    private currentBassTheme: { phrase: any[], startBar: number, endBar: number } | null = null;
    private currentAccompAxioms: { phrase: any[], role: string, id?: string, endBar: number, preferredInstrument?: string }[] = [];
    private currentDrumAxioms: { phrase: any[], role: string, endBar: number }[] = [];

    private currentTrackName: string = '';
    private ensembleStatus: 'SIBLING' | 'ADAPTIVE' | 'LOCAL' = 'ADAPTIVE';
    private currentMutationType: string = 'none';

    private cloudAxioms: any[] = [];
    private activeAnchorId: string | null = null;

    private usedThemeHistory: string[] = [];

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

    private normalizeStr(s: string): string {
        return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
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
        const rand = calculateMusiNum(epoch, 17, this.seed, 100) / 100;
        if (tension > 0.8 && (rand < 0.15 || rand > 0.95)) return (linearIndex + 1) % totalBars;
        return linearIndex;
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string, newBpm?: number, instrumentOverrides?: Partial<InstrumentHints> } {

        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const localTension = tension;
        const isBridge = navInfo.currentPart.id.includes('BRIDGE') || navInfo.currentPart.id.includes('TRANSITION') || navInfo.currentPart.id.includes('PROLOGUE');

        if (navInfo.isPartTransition) {
            this.soloistBusyUntilBar = epoch;
            const shifts = [0, 2, -2, 5, 7, -5];
            this.currentTransposition = shifts[this.random.nextInt(shifts.length)];
            this.microTransposition = 0;
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
                activeAxioms: { melody: 'Bridge Flow', ensemble: 'UNISON', bass: 'Scalar Walk', drums: 'Soft Swells' },
                narrative: `Liquid Bridge: Smooth transition through ${navInfo.currentPart.name}`
            };
        }

        if (epoch % 4 === 0) {
            const mutationRand = this.random.next();
            const mutationThreshold = this.isImprovising ? 0.8 : 0.4;

            if (mutationRand < mutationThreshold * 0.25) {
                this.microTransposition = [-2, 0, 2, 5, -5][this.random.nextInt(5)];
                this.currentMutationType = 'transpose';
            }
            else if (mutationRand < mutationThreshold * 0.5) this.currentMutationType = 'inversion';
            else if (mutationRand < mutationThreshold * 0.75) this.currentMutationType = 'retrograde';
            else if (mutationRand < mutationThreshold) this.currentMutationType = 'jitter';
            else this.currentMutationType = 'none';
        }

        const isSoloistFree = epoch >= this.soloistBusyUntilBar;
        const isSoloistResting = epoch < this.soloistRestingUntilBar;

        let newBpm: number | undefined;
        if (isSoloistFree && !isSoloistResting) {
            newBpm = this.selectNextAxiom(navInfo, dna, epoch);
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
                    const accEvents = this.renderHeritageAccompaniment(resChord, epoch, ax.phrase, targetType, dna, localTension);
                    
                    if (accEvents.length > 0) {
                        if (ax.preferredInstrument) {
                            instrumentOverrides[targetType] = resolveSemanticTimbre(ax.preferredInstrument, localTension, targetType, 'ambient');
                        }
                        accEvents.forEach(e => e.pan = swirlPan);
                        events.push(...accEvents);
                        usedTargetLayers.add(targetType);
                        if (targetType === 'accompaniment') accStatus = `Heritage DNA`;
                    }
                }
            });
            
            if (hints.accompaniment && !usedTargetLayers.has('accompaniment')) {
                const padEvents = this.renderPad(resChord, epoch, hints.accompaniment as string, localTension);
                padEvents.forEach(e => e.pan = swirlPan);
                events.push(...padEvents);
                usedTargetLayers.add('accompaniment');
                accStatus = 'Adaptive Pad (No DNA)';
            }
            if (hints.harmony && !usedTargetLayers.has('harmony')) {
                const harEvents = this.renderGenerativeHarmony(resChord, epoch, localTension, hints.harmony);
                harEvents.forEach(e => e.pan = 0.25);
                events.push(...harEvents);
                usedTargetLayers.add('harmony');
            }
        }

        if (hints.bass && this.currentBassTheme && epoch < this.currentBassTheme.endBar) {
            const themeBass = this.renderThemeBass(resChord, epoch, localTension, dna);
            if (themeBass.length > 0) {
                events.push(...this.constrainBass(themeBass));
            } else {
                events.push(...this.constrainBass(this.renderDroneBass(resChord, epoch, localTension)));
            }
        } else if (hints.bass) {
            events.push(...this.constrainBass(this.renderDroneBass(resChord, epoch, localTension)));
        }

        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isSoloistResting) {
            if (this.currentTheme && epoch < this.currentTheme.endBar) {
                melodyEvents = this.renderThemeMelody(resChord, epoch, localTension, hints, dna, 'melody', this.currentTheme.phrase, this.currentThemeMaxTick, this.currentTimeScale);
            } 
            if (melodyEvents.length === 0) {
                melodyEvents = this.renderMelodicPadBase(resChord, epoch, localTension);
            }
        }
        melodyEvents.forEach(e => e.pan = -0.15); 
        events.push(...melodyEvents);

        let pianoInfo = { style: 'none', count: 0 };
        if (hints.pianoAccompaniment) {
            if (!usedTargetLayers.has('pianoAccompaniment')) {
                const p = this.renderVirtuosoPiano(epoch, resChord, localTension, melodyEvents);
                if (p.events.length > 0) {
                    p.events.forEach(e => e.pan = 0.2); 
                    events.push(...p.events);
                    pianoInfo = { style: p.style, count: p.events.length };
                    usedTargetLayers.add('pianoAccompaniment');
                }
            } else {
                pianoInfo = { style: 'Heritage DNA', count: 1 };
            }
            
            const pianoRules = navInfo.currentPart.instrumentRules?.pianoAccompaniment;
            const pianoProb = pianoRules?.pianoProbability ?? 0.3; 
            const pianoRoll = calculateMusiNum(epoch, 17, this.seed, 100) / 100;
            this.pianistMode = pianoRoll < pianoProb ? 'acoustic' : 'rhodes';
            
            instrumentOverrides.pianoAccompaniment = this.pianistMode === 'acoustic' ? 'piano' : 'ep_rhodes_warm';
        }

        // #ЗАЧЕМ: Тотальная переработка ударных для Эмбиента (ПЛАН №1092).
        if (hints.drums) {
            const landscapeDrums = this.renderSonicLandscape(epoch, localTension);
            events.push(...landscapeDrums);
        }

        if (hints.sparkles && this.random.nextInt(100) < 25) events.push(this.renderSparkle(resChord, MOOD_TO_COMMON[this.mood] === 'light'));
        if (hints.sfx && this.random.nextInt(100) < 15) events.push(...this.renderSfx(localTension));

        const modeStr = this.isImprovising ? 'IMPROVISATION' : 'RESTORATION';

        return {
            events, tension: localTension, beautyScore: 0.5,
            mutationType: this.currentMutationType, newBpm,
            instrumentOverrides,
            activeAxioms: {
                melody: isSoloistResting ? 'Breath' : (melodyEvents.length > 0 ? this.currentTheme?.id || 'Generative' : 'Waiting'),
                ensemble: `${this.ensembleStatus} [${modeStr}]`,
                bass: this.currentBassTheme ? 'Sibling DNA' : 'Walking Drone',
                drums: 'Sonic Landscape', // #ЧТО: Новая роль ударных в отчете.
                accompaniment: isAccompResting ? 'Breath' : accStatus,
                piano: pianoInfo.count > 0 ? `${pianoInfo.style} [${this.pianistMode.toUpperCase()}]` : 'none'
            },
            narrative: `Ambient ${modeStr}: ${this.currentTrackName || 'Algorithmic Cloud'} [Landscape: Pumping Textures]`
        };
    }

    /**
     * #ЗАЧЕМ: Генератор перкуссионного ландшафта (ПЛАН №1092).
     * #ЧТО: Мягкий кик, редкие хэты, влажный райд и диффузная перкуссия.
     */
    private renderSonicLandscape(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const kit = DRUM_KITS.ambient[this.mood as any] || DRUM_KITS.ambient.melancholic;

        // 1. DEEP KICK (Rare & Soft)
        // Только на 1-ю или 3-ю долю и только в 60% тактов.
        if (this.random.next() < 0.6) {
            const time = this.random.next() < 0.7 ? 0 : 6;
            events.push({
                type: (kit.kick[this.random.nextInt(kit.kick.length)] || 'drum_kick_soft') as any,
                note: 36, time: time * TICK_TO_BEAT, duration: 0.1, weight: 0.65,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato'
            });
        }

        // 2. WETTEST RIDE (Atmospheric Ping)
        // Редкое появление (20% шанс), создает ощущение пространства.
        if (this.random.next() < 0.2) {
            events.push({
                type: 'drum_ride_wetter', note: 51,
                time: (this.random.nextInt(TICKS_PER_BAR)) * TICK_TO_BEAT,
                duration: 2.0, weight: 0.45, technique: 'hit', dynamics: 'p', phrasing: 'legato',
                pan: (this.random.next() * 1.4) - 0.7
            });
        }

        // 3. RARE HATS (Ghostly accents)
        // Появляются только при росте Tension.
        if (tension > 0.4 && this.random.next() < 0.3) {
            [1.5, 4.5, 7.5, 10.5].forEach(t => {
                if (this.random.next() < 0.4) {
                    events.push({
                        type: 'drum_closed_hi_hat_ghost', note: 42,
                        time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.2 + (this.random.next() * 0.2),
                        technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.2
                    });
                }
            });
        }

        // 4. SONIC KITCHEN (Bells, Bongos, Tubes)
        // Хаотичное, но гармоничное распределение.
        const hitCount = 1 + this.random.nextInt(Math.floor(tension * 5) + 1);
        for (let i = 0; i < hitCount; i++) {
            const perc = kit.perc[this.random.nextInt(kit.perc.length)];
            const time = this.random.next() * TICKS_PER_BAR;
            const pan = (this.random.next() * 1.8) - 0.9;
            
            events.push({
                type: perc as any, note: 48, 
                time: time * TICK_TO_BEAT, duration: 1.0, 
                weight: 0.4 + (this.random.next() * 0.4), 
                technique: 'hit', dynamics: 'p', phrasing: 'detached', pan
            });
        }

        // 5. HERITAGE FILTER (Softening DNA drums)
        if (this.currentDrumAxioms.length > 0) {
            const hDrums = this.renderHeritageDrums(epoch, tension);
            hDrums.forEach(e => {
                e.weight *= 0.4; // Глушим ДНК-барабаны, чтобы они не разрушали ландшафт
                events.push(e);
            });
        }

        return events;
    }

    private renderHeritageDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        if (this.currentDrumAxioms.length === 0) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;

        this.currentDrumAxioms.forEach(ax => {
            const barNotes = ax.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
            
            barNotes.forEach(n => {
                let pan = 0;
                const midiNote = 36 + (DEGREE_TO_SEMITONE[n.deg] || 0);
                
                if ([41, 43, 45].includes(midiNote)) pan = (n.t % TICKS_PER_BAR < (TICKS_PER_BAR / 2)) ? -0.4 : 0.4;

                events.push({
                    type: 'drums', 
                    note: midiNote, 
                    time: (n.t - barOffset) * TICK_TO_BEAT, 
                    duration: 0.1, 
                    weight: 0.8, 
                    technique: 'hit', 
                    dynamics: 'p', 
                    phrasing: 'staccato', 
                    pan
                });
            });
        });
        return events;
    }

    private renderDroneBass(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const degrees = [0, 7, 9, 5, 0, 7, 2, 0];
        const shift = degrees[calculateMusiNum(epoch, 8, this.seed, 8)];
        return [{
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + shift + this.currentTransposition + this.microTransposition),
            time: 0, duration: 4.0, weight: 0.7, technique: 'drone', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 2.0, filterCutoff: 300 + (tension * 200) }
        }];
    }

    private renderThemeMelody(chord: GhostChord, epoch: number, localTension: number, hints: InstrumentHints, dna: SuiteDNA, type: string, phrase: any[], maxTick: number, timeScale: number): FractalEvent[] {
        const totalBarsInPhrase = Math.ceil((maxTick * timeScale) / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBarsInPhrase;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBarsInPhrase, localTension);
        const barOffset = (mosaicBar * TICKS_PER_BAR) / timeScale;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + (TICKS_PER_BAR / timeScale));
        return barNotes.map(n => ({
            type: type as any,
            note: Math.min(chord.rootNote + 24 + this.registerShift + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: (n.t - barOffset) * TICK_TO_BEAT * timeScale, duration: n.d * TICK_TO_BEAT * timeScale, weight: 0.7,
            technique: (localTension > 0.6 && n.d >= 4 && this.random.next() < 0.3) ? 'vb' : 'pick', dynamics: 'p', phrasing: 'legato',
            params: { attack: 0.3, release: 1.5, filterCutoff: 2000 + (localTension * 1500), mood: this.mood }
        }));
    }

    private renderThemeBass(chord: GhostChord, epoch: number, localTension: number, dna: SuiteDNA): FractalEvent[] {
        if (!this.currentBassTheme) return [];
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, localTension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = this.currentBassTheme.phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        if (barNotes.length === 0) return []; 
        return barNotes.map(n => ({
            type: 'bass', note: this.constrainBassOctave(chord.rootNote - 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.currentTransposition + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.7, technique: 'pick', dynamics: 'p', phrasing: 'legato'
        }));
    }

    private renderHeritageAccompaniment(chord: GhostChord, epoch: number, phrase: any[], type: InstrumentPart, dna: SuiteDNA, tension: number): FractalEvent[] {
        const totalBars = Math.ceil(this.currentThemeMaxTick / TICKS_PER_BAR);
        const startEpoch = this.soloistBusyUntilBar - totalBars;
        const mosaicBar = this.getMosaicIndex(epoch, startEpoch, totalBars, tension);
        const barOffset = mosaicBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);
        return barNotes.map(n => ({
            type: type, note: this.constrainAccompanimentOctave(chord.rootNote + 12 + (DEGREE_TO_SEMITONE[n.deg] || 0) + this.registerShift + this.currentTransposition + this.microTransposition),
            time: (n.t - barOffset) * TICK_TO_BEAT, duration: n.d * TICK_TO_BEAT, weight: 0.35,
            technique: tension > 0.7 ? 'hit' : 'swell', dynamics: 'p', phrasing: 'legato',
            params: { mood: this.mood }
        }));
    }

    private renderPad(chord: GhostChord, epoch: number, name: string, tension: number): FractalEvent[] {
        const root = chord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition;
        return [{
            type: 'accompaniment', note: this.constrainAccompanimentOctave(root),
            time: 0, duration: 4.0, 
            weight: 0.6, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 2.0, release: 3.0, filterCutoff: 1200 + (tension * 800), mood: this.mood }
        }];
    }

    private renderMelodicPadBase(chord: GhostChord, epoch: number, tension: number): FractalEvent[] {
        const shift = [0, 2, 4, 7, 9, 7, 4, 0][calculateMusiNum(epoch, 4, this.seed, 8)];
        return [{
            type: 'melody', note: Math.min(chord.rootNote + 24 + this.registerShift + shift + this.currentTransposition + this.microTransposition, this.MELODY_CEILING),
            time: 0, duration: 4.0, weight: 0.5, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            params: { attack: 1.5, release: 3.0, filterCutoff: 1800 + (tension * 1200), mood: this.mood }
        }];
    }

    private renderVirtuosoPiano(epoch: number, chord: GhostChord, tension: number, melodyEvents: FractalEvent[]): { events: FractalEvent[], style: string } {
        const events: FractalEvent[] = [];

        if (melodyEvents.length === 0) return { events: [], style: 'Waiting' };

        const isMinor = chord.chordType === 'minor';
        const thirdInterval = isMinor ? 3 : 4;

        melodyEvents.forEach((m, i) => {
            if (i % 2 === 0) {
                events.push({
                    ...m,
                    type: 'pianoAccompaniment',
                    note: this.constrainAccompanimentOctave(m.note + thirdInterval),
                    weight: 0.25,
                    technique: 'hit',
                    dynamics: 'p',
                    phrasing: 'staccato',
                    params: { ...m.params, release: 2.0 }
                });
            }
        });

        return { events, style: "Shadow (Thirds)" };
    }

    private renderGenerativeHarmony(resChord: GhostChord, epoch: number, localTension: number, timbre?: string): FractalEvent[] {
        const root = resChord.rootNote + 12 + this.registerShift + this.currentTransposition + this.microTransposition;
        const colorDegree = epoch % 8 < 4 ? (resChord.chordType === 'minor' ? 3 : 4) : 7;
        const note = this.constrainAccompanimentOctave(root + colorDegree);
        if (timbre === 'guitarChords') {
            return [{ type: 'harmony', note: note, time: 0, duration: 4.0, weight: 0.3, technique: 'hit', dynamics: 'p', phrasing: 'staccato', chordName: resChord.chordType === 'minor' ? 'Am' : 'A', params: { mood: this.mood } }];
        }
        return [{ type: 'harmony', note: note + 12, time: 0, duration: 4.0, weight: 0.25, technique: 'swell', dynamics: 'p', phrasing: 'legato', params: { mood: this.mood } }];
    }

    private renderSparkle(chord: GhostChord, isPositive: boolean): FractalEvent {
        return { type: 'sparkle', note: chord.rootNote + 48, time: this.random.nextInt(TICKS_PER_BAR) * TICK_TO_BEAT, duration: 6.0, weight: 0.65, technique: 'hit', dynamics: 'p', phrasing: 'legato', pan: (Math.random() * 1.8) - 0.9, params: { mood: this.mood, genre: this.genre, category: isPositive ? 'light' : 'ambient_common' } };
    }

    private renderSfx(tension: number): FractalEvent[] {
        return [{ type: 'sfx', note: 60, time: this.random.nextInt(TICKS_PER_BAR) * TICK_TO_BEAT, duration: 4.0, weight: 0.55, technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: (Math.random() * 1.6) - 0.8, params: { mood: this.mood, genre: this.genre } }];
    }

    private constrainBassOctave(note: number): number {
        let finalNote = note; while (finalNote > 47) finalNote -= 12; while (finalNote < 31) finalNote += 12; return finalNote;
    }

    private constrainAccompanimentOctave(note: number): number {
        let finalNote = note; while (finalNote > 71) finalNote -= 12; while (finalNote < 48) finalNote += 12; return finalNote;
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
}
