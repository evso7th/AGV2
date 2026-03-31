
/**
 * @fileOverview Reggae Brain V1.2 — "The Chronos Standard".
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

export class ReggaeBrain {
    private seed: number;
    private mood: Mood;
    private genre: Genre;
    private random: any;
    private useHeritage: boolean;

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

    public generateBar(
        epoch: number,
        currentChord: GhostChord,
        navInfo: NavigationInfo,
        dna: SuiteDNA,
        hints: InstrumentHints
    ): { events: FractalEvent[], tension: number, beautyScore: number, mutationType?: string, activeAxioms?: any, narrative?: string } {
        
        const tension = dna.tensionMap?.[epoch] ?? 0.5;
        const events: FractalEvent[] = [];
        
        if (hints.drums) {
            events.push(...this.renderReggaeDrums(epoch, tension));
        }

        if (hints.bass) {
            events.push(...this.renderRootsBass(epoch, currentChord, tension));
        }

        if (hints.accompaniment || hints.melody) {
            events.push(...this.renderTheSkank(epoch, currentChord, tension, hints));
        }

        if (hints.pianoAccompaniment) {
            events.push(...this.renderBubbling(epoch, currentChord, tension));
        }

        if (hints.harmony) {
            events.push(...this.renderDubAtmosphere(epoch, currentChord, tension));
        }

        return {
            events, tension, beautyScore: 0.7,
            activeAxioms: {
                drums: tension > 0.7 ? 'Steppers' : 'One-Drop',
                bass: 'Lazy Syncopation',
                accompaniment: 'Classic Skank',
                piano: 'Bubbling Triplets'
            },
            narrative: `Reggae Roots: Establishing the riddim. ${tension > 0.7 ? 'High energy drive.' : 'Deep meditation.'} [Chronos Mode]`
        };
    }

    private renderReggaeDrums(epoch: number, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const isSteppers = tension > 0.75;

        if (isSteppers) {
            [0, 3, 6, 9].forEach(t => {
                events.push({
                    type: 'drum_kick_reso', note: 36, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.9,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato'
                });
            });
            [3, 9].forEach(t => {
                events.push({
                    type: 'drum_snare', note: 38, time: t * TICK_TO_BEAT, duration: 0.1, weight: 0.8,
                    technique: 'hit', dynamics: 'mf', phrasing: 'staccato', pan: -0.1
                });
            });
        } else {
            events.push({
                type: 'drum_kick_reso', note: 36, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 1.0,
                technique: 'hit', dynamics: 'f', phrasing: 'staccato'
            });
            events.push({
                type: 'drum_snare', note: 38, time: 6 * TICK_TO_BEAT, duration: 0.1, weight: 0.9,
                technique: 'hit', dynamics: 'f', phrasing: 'staccato', pan: -0.1
            });
        }

        [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5].forEach(t => {
            const isOff = t % 3 !== 0;
            events.push({
                type: 'drum_25693__walter_odington__hackney-hat-1', note: 42, time: t * TICK_TO_BEAT, 
                duration: 0.1, weight: isOff ? 0.6 : 0.3,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.1
            });
        });

        return events;
    }

    private renderRootsBass(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote - 12;
        const pattern = [1.5, 4.5, 7.5, 10.5]; 
        
        pattern.forEach((t, i) => {
            const isRoot = i % 2 === 0;
            const note = isRoot ? root : root + 7; 
            events.push({
                type: 'bass', note, time: t * TICK_TO_BEAT, duration: 1.0 * TICK_TO_BEAT, weight: 0.85,
                technique: 'pick', dynamics: 'mf', phrasing: 'detached',
                params: { filterCutoff: 200 + tension * 300 }
            });
        });

        return events;
    }

    private renderTheSkank(epoch: number, chord: GhostChord, tension: number, hints: InstrumentHints): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12;
        const third = chord.chordType === 'minor' ? 3 : 4;
        
        [3, 9].forEach(t => {
            if (hints.melody) {
                events.push({
                    type: 'melody', note: root + 12 + third, time: t * TICK_TO_BEAT, duration: 0.2, weight: 0.6,
                    technique: 'pick', dynamics: 'mf', phrasing: 'staccato', pan: -0.3,
                    params: { filterCutoff: 3000 }
                });
            }
            if (hints.accompaniment) {
                events.push({
                    type: 'accompaniment', note: root, time: t * TICK_TO_BEAT, duration: 0.25, weight: 0.5,
                    technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.3
                });
            }
        });

        return events;
    }

    private renderBubbling(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        const events: FractalEvent[] = [];
        const root = chord.rootNote + 12;
        [4, 5, 10, 11].forEach(t => {
            events.push({
                type: 'pianoAccompaniment', note: root + 7, time: t * TICK_TO_BEAT, duration: 0.15, weight: 0.3,
                technique: 'hit', dynamics: 'p', phrasing: 'staccato', pan: 0.2
            });
        });

        return events;
    }

    private renderDubAtmosphere(epoch: number, chord: GhostChord, tension: number): FractalEvent[] {
        return [{
            type: 'harmony', note: chord.rootNote + 24,
            time: 0, duration: 4.0, weight: 0.25, technique: 'swell', dynamics: 'p', phrasing: 'legato',
            pan: 0.4,
            params: { attack: 1.5, release: 2.5, filterCutoff: 800 + tension * 1000 }
        }];
    }
}
