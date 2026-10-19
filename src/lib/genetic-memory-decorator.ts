/**
 * @fileOverview Genetic Memory Decorator V3.4 — "Mincer Protocol".
 * #ЗАЧЕМ: ПЛАН №2860. Реализация "всеядного" заполнения пауз для Foundry.
 * #ЧТО: Добавлен филлер для accompaniment и унифицирована логика для Dark Trance.
 */
import { FractalEvent } from '@/types/music';
import { 
    findGeneticFillerAxiom, 
    decompressCompactPhrase, 
    TICK_TO_BEAT, 
    TICKS_PER_BAR, 
    DEGREE_TO_SEMITONE 
} from './music-theory';

interface FillerState {
    axiom: any;
    iteration: number; 
    currentBar: number; 
    maxBars: number;
}

let pianoFillerState: FillerState | null = null;
let melodyFillerState: FillerState | null = null;
let accompFillerState: FillerState | null = null;

export class GeneticMemoryDecorator {
    public static fillGaps(
        events: FractalEvent[],
        genre: string,
        tension: number,
        cloudAxioms: any[],
        rootNote: number
    ): FractalEvent[] {
        const isFoundry = genre === 'foundry';
        const isTrance = genre === 'psybient';

        // --- 1. PIANO FILLER (Mincer Protocol: scavenge everything for Foundry) ---
        const hasPiano = events.some(e => e.type === 'pianoAccompaniment');
        if (hasPiano) {
            pianoFillerState = null;
        } else {
            if (!pianoFillerState) {
                const best = findGeneticFillerAxiom(cloudAxioms, 'pianoAccompaniment', tension);
                if (best) pianoFillerState = this.createState(best);
            }
            if (pianoFillerState) {
                const filler = this.renderCurrentBar(pianoFillerState, 'pianoAccompaniment', rootNote, isFoundry ? 12 : 24);
                if (filler.length > 0) events.push(...filler);
                this.advanceState(pianoFillerState);
                if (pianoFillerState.iteration >= 16) pianoFillerState = null; 
            }
        }

        // --- 2. ACCOMPANIMENT FILLER (New for Foundry) ---
        const hasAccomp = events.some(e => e.type === 'accompaniment');
        if (hasAccomp) {
            accompFillerState = null;
        } else if (isFoundry || isTrance) {
            if (!accompFillerState) {
                const best = findGeneticFillerAxiom(cloudAxioms, 'accompaniment', tension);
                if (best) accompFillerState = this.createState(best);
            }
            if (accompFillerState) {
                const filler = this.renderCurrentBar(accompFillerState, 'accompaniment', rootNote, 12, true, 0.45);
                if (filler.length > 0) events.push(...filler);
                this.advanceState(accompFillerState);
                if (accompFillerState.iteration >= 8) accompFillerState = null;
            }
        }

        // --- 3. MELODY FILLER (Foundry/Trance) ---
        if (isTrance || isFoundry) {
            const melodyEvents = events.filter(e => e.type === 'melody');
            // В Foundry застой детектируется агрессивнее
            const isStagnant = isFoundry ? (melodyEvents.length <= 1) : (melodyEvents.length === 0);

            if (isStagnant) {
                if (!melodyFillerState) {
                    const best = findGeneticFillerAxiom(cloudAxioms, 'melody', tension);
                    if (best) melodyFillerState = this.createState(best);
                }
                if (melodyFillerState) {
                    const filler = this.renderCurrentBar(melodyFillerState, 'melody', rootNote, 12, true, isFoundry ? 0.65 : 0.5);
                    if (filler.length > 0) events.push(...filler);
                    else melodyFillerState = null; 
                    
                    if (melodyFillerState) {
                        this.advanceState(melodyFillerState);
                        if (melodyFillerState.iteration >= 16) melodyFillerState = null;
                    }
                }
            } else {
                melodyFillerState = null;
            }
        }

        return events;
    }

    private static createState(axiom: any): FillerState {
        const phrase = decompressCompactPhrase(axiom.phrase);
        let maxT = 0;
        phrase.forEach(n => { if (n.t > maxT) maxT = n.t; });
        const maxBars = Math.max(1, Math.ceil((maxT + 1) / TICKS_PER_BAR));
        
        return {
            axiom,
            iteration: 0,
            currentBar: 0,
            maxBars: maxBars
        };
    }

    private static renderCurrentBar(state: FillerState, type: string, root: number, octShift: number, isTrance: boolean = false, weightMult: number = 0.6): FractalEvent[] {
        const phrase = decompressCompactPhrase(state.axiom.phrase);
        const barOffset = state.currentBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);

        return barNotes.map(n => ({
            type: type as any,
            note: root + octShift + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: weightMult,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { 
                isEcho: true, 
                hpCutoff: isTrance ? 800 : undefined 
            }
        })) as FractalEvent[];
    }

    private static advanceState(state: FillerState) {
        state.currentBar++;
        if (state.currentBar >= state.maxBars) {
            state.iteration++;
            state.currentBar = 0;
        }
    }
}
