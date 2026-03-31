
/**
 * @fileOverview Trance Brain V1.1 — "The Chronos Standard".
 * #ЗАЧЕМ: Абсолютная синхронность временной сетки с Dashboard.
 * #ЧТО: ПЛАН №978. Использование глобальных констант TICKS_PER_BAR и TICK_TO_BEAT.
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
    TICKS_PER_BAR,
    TICK_TO_BEAT
} from './music-theory';

export class TranceBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;

    private hookPhrase: any[] = [];
    private currentSpiralShift: number = 0;
    private lastSpiralUpdateBar: number = -1;
    
    private soloistRestingUntilBar: number = -1;

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

    private generateHook(seed: number): any[] {
        const scale = [0, 3, 7, 10, 12, 14, 15]; // Minor/Dorian blend
        const hook = [];
        const r = this.createSeededRandom(seed + 777);
        // Generate 6 notes on 1/16th slots (total 12 ticks)
        for (let i = 0; i < 6; i++) {
            const tick = i * 2; 
            hook.push({
                t: tick,
                d: 1.5,
                deg: SEMITONE_TO_DEGREE[scale[r.nextInt(scale.length)]] || 'R',
                tech: 'pick'
            });
        }
        return hook;
    }

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const events: FractalEvent[] = [];
        
        // 1. INTRO / START (2-4 bars) - Kick & Offbeat Bass only
        const isInitialStart = epoch < 4;
        const isIntro = navInfo.currentPart.id === 'INTRO' || isInitialStart;

        // 2. THE SPIRAL ARPEGIATTOR (Lead)
        let melodyEvents: FractalEvent[] = [];
        if (hints.melody && !isIntro) {
            melodyEvents = this.renderSpiralLead(epoch, currentChord, tension);
            events.push(...melodyEvents);
        }

        // 3. THE DRIVE (Bass)
        if (hints.bass) {
            events.push(...this.renderNeuroBass(epoch, currentChord, tension, isIntro));
        }

        // 4. THE BREATH (Rhodes Chords & Echoes)
        if (hints.pianoAccompaniment && !isInitialStart) {
            events.push(...this.renderProgressiveRhodes(epoch, currentChord, tension, melodyEvents));
        }

        // 5. DRUMS (4/4 Kick + Hats)
        if (hints.drums) {
            events.push(...this.renderTranceDrums(epoch, tension, isIntro));
        }

        // 6. ATMOSPHERE (Pads)
        if (hints.accompaniment && !isInitialStart) {
            events.push(...this.renderSidechainedPad(epoch, currentChord, tension));
        }

        return {
            events, tension, beautyScore: 0.6,
            activeAxioms: {
                melody: isIntro ? 'Waiting' : 'Spiral Hook',
                bass: isIntro ? 'Offbeat Drive' : 'Neuro Rolling',
                piano: 'Rhodes Echoes',
                drums: 'Solid 4/4'
            },
            narrative: isIntro ? 'Initial Strike: Establishing pulse.' : 'Kinetic Spiral: Shifting tonal centers.'
        };
    }

    private renderTranceDrums(epoch: number, tension: number, isIntro: boolean): FractalEvent[] {
        const events: FractalEvent[] = [];
        // Solid Kick on every beat
        [0, 3, 6, 9].forEach(t => {
            events.push({
                type: 'drum_kick_drum6', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 1.0, 
                technique: 'hit', dynamics: 'f', phrasing: 'staccato'
            });
        });

        // Open Hat on offbeats
        if (tension > 0.3 || !isIntro) {
            [1.5, 4.5, 7.5, 10.5].forEach(t => {
                events.push({
                    type: 'drum_open_hh_top2', note: 46, time: t * TICK_TO_BEAT, duration: 0.2, weight: 0.6 + tension * 0.2,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: 0.1
                });
            });
        }

        // Closed Hat 16th triplets (rolling)
        if (tension > 0.6 && !isIntro) {
            for (let t = 0; t < TICKS_PER_BAR; t++) {
                if (t % 3 !== 0) { // Not on the kick
                    events.push({
                        type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, 
                        duration: 0.1, weight: 0.3 + (t % 2 === 0 ? 0.1 : 0),
                        technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: -0.1
                    });
                }
            }
        }

        return events;
    }

    private renderNeuroBass(epoch: number, chord: GhostChord, tension: number, isIntro: boolean): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        
        if (isIntro || tension < 0.5) {
            // Simple Offbeat
            [1.5, 4.5, 7.5, 10.5].forEach(t => {
                events.push({
                    type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: 1.2 * TICK_TO_BEAT, weight: 0.8,
                    technique: 'pulse', dynamics: 'mf', phrasing: 'detached',
                    params: { filterCutoff: 400 + tension * 600 }
                });
            });
        } else {
            // Rolling / Gallop (Triplet feel)
            [1, 2, 4, 5, 7, 8, 10, 11].forEach((t, i) => {
                const varCutoff = 300 + (tension * 800) + (Math.sin(epoch + t) * 200);
                events.push({
                    type: 'bass', note: root, time: t * TICK_TO_BEAT, duration: 0.8 * TICK_TO_BEAT, weight: 0.75,
                    technique: 'pulse', dynamics: 'f', phrasing: 'staccato',
                    params: { filterCutoff: varCutoff }
                });
            });
        }
        return events;
    }

    private renderSpiralLead(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        if (this.hookPhrase.length === 0) {
            this.hookPhrase = this.generateHook(this.seed);
        }

        if (epoch % 2 === 0 && epoch !== this.lastSpiralUpdateBar) {
            this.lastSpiralUpdateBar = epoch;
            const shifts = [0, 2, 4, 7, 5, 3, 0];
            this.currentSpiralShift = shifts[(epoch / 2) % shifts.length];
        }

        const swirlPan = Math.sin(epoch * 0.5) * 0.6; 
        const events: FractalEvent[] = [];

        this.hookPhrase.forEach(n => {
            const semitone = DEGREE_TO_SEMITONE[n.deg] || 0;
            events.push({
                type: 'melody',
                note: chord.rootNote + 12 + semitone + this.currentSpiralShift,
                time: n.t * TICK_TO_BEAT,
                duration: n.d * TICK_TO_BEAT,
                weight: 0.65,
                technique: 'pick', dynamics: 'mf', phrasing: 'legato',
                pan: swirlPan,
                params: { filterCutoff: 1500 + tension * 3000 }
            });
        });

        return events;
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

        if (leadEvents.length > 0 && tension > 0.4) {
            leadEvents.forEach((m, i) => {
                if (i % 2 === 0) {
                    events.push({
                        ...m,
                        type: 'pianoAccompaniment',
                        note: m.note - 12, 
                        time: m.time + (1.5 * TICK_TO_BEAT), 
                        weight: 0.2,
                        duration: 1.0 * TICK_TO_BEAT,
                        pan: -m.pan!, 
                        params: { release: 2.0 }
                    });
                }
            });
        }

        return events;
    }

    private renderSidechainedPad(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'accompaniment', note: chord.rootNote + 12,
            time: 0.1, 
            duration: 3.8, weight: 0.3, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            pan: -0.3,
            params: { attack: 0.5, release: 1.0, filterCutoff: 1000 + tension * 1000 }
        }];
    }
}
