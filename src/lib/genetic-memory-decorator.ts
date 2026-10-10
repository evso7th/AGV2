/**
 * @fileOverview Genetic Memory Decorator V2.8 — "Aggressive Re-selection".
 * #ЗАЧЕМ: Предотвращение тишины через немедленный выбор нового мастерписа.
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

        // --- 1. BLUES & REGGAE (Piano Only) ---
        if (genre === 'blues' || genre === 'cyber_blues' || genre === 'reggae') {
            const hasPiano = events.some(e => e.type === 'pianoAccompaniment');
            if (hasPiano) {
                pianoFillerState = null;
            } else {
                if (!pianoFillerState) {
                    const best = findGeneticFillerAxiom(cloudAxioms, 'pianoAccompaniment', tension);
                    if (best) pianoFillerState = { axiom: best, iteration: 0, currentBar: 0 };
                }
                if (pianoFillerState) {
                    const filler = this.renderCurrentBar(pianoFillerState, 'pianoAccompaniment', rootNote, 24);
                    this.advanceState(pianoFillerState);
                    if (pianoFillerState.iteration > 1) pianoFillerState = null;
                    return [...events, ...filler];
                }
            }
        }

        // --- 2. FOUNDRY & PSYBIENT (Synthesis Interception) ---
        if (genre === 'psybient' || isFoundry) {
            const newEvents = [...events];
            const melodyEvents = events.filter(e => e.type === 'melody');
            
            // #ЗАЧЕМ: Усиленный порог стагнации.
            const isStagnant = isFoundry ? (melodyEvents.length <= 1) : (melodyEvents.length === 0);

            if (isStagnant) {
                if (!melodyFillerState) {
                    const best = findGeneticFillerAxiom(cloudAxioms, 'melody', tension);
                    if (best) melodyFillerState = { axiom: best, iteration: 0, currentBar: 0 };
                }
                if (melodyFillerState) {
                    const filler = this.renderCurrentBar(melodyFillerState, 'melody', rootNote, 12, true, isFoundry ? 0.65 : 0.5);
                    newEvents.push(...filler);
                    this.advanceState(melodyFillerState);
                    if (melodyFillerState.iteration > 1) melodyFillerState = null;
                }
            } else {
                melodyFillerState = null;
            }

            // Дополнительный слой гармонии для Foundry
            if (isFoundry) {
                const harmonyEvents = events.filter(e => e.type === 'harmony');
                if (harmonyEvents.length === 0) {
                    if (!harmonyFillerState) {
                        const best = findGeneticFillerAxiom(cloudAxioms, 'harmony', tension);
                        if (best) harmonyFillerState = { axiom: best, iteration: 0, currentBar: 0 };
                    }
                    if (harmonyFillerState) {
                        const filler = this.renderCurrentBar(harmonyFillerState, 'harmony', rootNote, 12, false, 0.55);
                        newEvents.push(...filler);
                        this.advanceState(harmonyFillerState);
                        if (harmonyFillerState.iteration > 1) harmonyFillerState = null;
                    }
                } else {
                    harmonyFillerState = null;
                }
            }

            return newEvents;
        }

        return events;
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
        }));
    }

    private static advanceState(state: FillerState) {
        state.currentBar++;
        const phrase = decompressCompactPhrase(state.axiom.phrase);
        let maxT = 0;
        phrase.forEach(n => { if (n.t > maxT) maxT = n.t; });
        const totalBars = state.axiom.bars || Math.ceil((maxT + 1) / TICKS_PER_BAR);

        if (state.currentBar >= totalBars) {
            state.iteration++;
            state.currentBar = 0;
        }
    }
}
