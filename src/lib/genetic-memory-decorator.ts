/**
 * @fileOverview Genetic Memory Decorator V3.0 — "Infinite Loop Protocol".
 * #ЗАЧЕМ: Гарантия непрерывного заполнения пауз мастерписами.
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
let harmonyFillerState: FillerState | null = null;

export class GeneticMemoryDecorator {
    public static fillGaps(
        events: FractalEvent[],
        genre: string,
        tension: number,
        cloudAxioms: any[],
        rootNote: number
    ): FractalEvent[] {
        const isFoundry = genre === 'foundry';

        // --- 1. PIANO FILLER (Blues/Reggae/Ambient) ---
        const hasPiano = events.some(e => e.type === 'pianoAccompaniment');
        if (hasPiano) {
            pianoFillerState = null;
        } else {
            if (!pianoFillerState) {
                const best = findGeneticFillerAxiom(cloudAxioms, 'pianoAccompaniment', tension);
                if (best) pianoFillerState = this.createState(best);
            }
            if (pianoFillerState) {
                const filler = this.renderCurrentBar(pianoFillerState, 'pianoAccompaniment', rootNote, 24);
                if (filler.length > 0) events.push(...filler);
                this.advanceState(pianoFillerState);
                if (pianoFillerState.iteration > 16) pianoFillerState = null; // Увеличен лимит жизни филлера
            }
        }

        // --- 2. MELODY FILLER (Trance/Foundry) ---
        if (genre === 'psybient' || isFoundry) {
            const melodyEvents = events.filter(e => e.type === 'melody');
            const isStagnant = isFoundry ? (melodyEvents.length <= 1) : (melodyEvents.length === 0);

            if (isStagnant) {
                if (!melodyFillerState) {
                    const best = findGeneticFillerAxiom(cloudAxioms, 'melody', tension);
                    if (best) melodyFillerState = this.createState(best);
                }
                if (melodyFillerState) {
                    const filler = this.renderCurrentBar(melodyFillerState, 'melody', rootNote, 12, true, isFoundry ? 0.65 : 0.5);
                    if (filler.length > 0) events.push(...filler);
                    else melodyFillerState = null; // Если мастерпис пустой — сброс для поиска нового
                    
                    if (melodyFillerState) {
                        this.advanceState(melodyFillerState);
                        if (melodyFillerState.iteration > 16) melodyFillerState = null;
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
            phrasing: 'legate',
            params: { 
                isEcho: true, 
                hpCutoff: isTrance ? 800 : undefined 
            }
        }));
    }

    private static advanceState(state: FillerState) {
        state.currentBar++;
        if (state.currentBar >= state.maxBars) {
            state.iteration++;
            state.currentBar = 0;
        }
    }
}
