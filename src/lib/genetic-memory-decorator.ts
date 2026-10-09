/**
 * @fileOverview Genetic Memory Decorator V2.1 — "Neuro Spiral".
 * #ЗАЧЕМ: Реализация ПЛАНА №1210. Заполнение пауз в Блюзе и Трансе (Breakdowns).
 * #ЧТО: Перехватчик партитуры, внедряющий "воспоминания" (мастерписы) в пустоты.
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
    iteration: number; // 0 or 1 (Double pass loop)
    currentBar: number; // relative to axiom
}

let pianoFillerState: FillerState | null = null;
let melodyFillerState: FillerState | null = null;

export class GeneticMemoryDecorator {
    public static fillGaps(
        events: FractalEvent[],
        genre: string,
        tension: number,
        cloudAxioms: any[],
        rootNote: number
    ): FractalEvent[] {
        // --- 1. BLUES LOGIC (Piano Only) ---
        if (genre === 'blues' || genre === 'cyber_blues') {
            const hasPiano = events.some(e => e.type === 'pianoAccompaniment');
            if (hasPiano) {
                pianoFillerState = null;
                return events;
            }

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

        // --- 2. PSYBIENT LOGIC (Breakdown Interception) ---
        // #ЗАЧЕМ: В трансе память активируется в моменты тишины ритм-секции.
        if (genre === 'psybient') {
            const hasDrums = events.some(e => String(e.type).toLowerCase().includes('drum') || String(e.type).toLowerCase().includes('kick'));
            const hasBass = events.some(e => e.type === 'bass');
            const isBreakdown = !hasDrums && !hasBass;

            if (isBreakdown) {
                const newEvents = [...events];
                
                // Перехват Мелодии
                const hasMelody = events.some(e => e.type === 'melody');
                if (!hasMelody) {
                    if (!melodyFillerState) {
                        const best = findGeneticFillerAxiom(cloudAxioms, 'melody', tension);
                        if (best) melodyFillerState = { axiom: best, iteration: 0, currentBar: 0 };
                    }
                    if (melodyFillerState) {
                        const filler = this.renderCurrentBar(melodyFillerState, 'melody', rootNote, 12, true);
                        this.advanceState(melodyFillerState);
                        if (melodyFillerState.iteration > 1) melodyFillerState = null;
                        newEvents.push(...filler);
                    }
                } else { melodyFillerState = null; }

                // Перехват Пианино (Rhodes)
                const hasPiano = events.some(e => e.type === 'pianoAccompaniment');
                if (!hasPiano) {
                    if (!pianoFillerState) {
                        const best = findGeneticFillerAxiom(cloudAxioms, 'pianoAccompaniment', tension);
                        if (best) pianoFillerState = { axiom: best, iteration: 0, currentBar: 0 };
                    }
                    if (pianoFillerState) {
                        const filler = this.renderCurrentBar(pianoFillerState, 'pianoAccompaniment', rootNote, 24, true);
                        this.advanceState(pianoFillerState);
                        if (pianoFillerState.iteration > 1) pianoFillerState = null;
                        newEvents.push(...filler);
                    }
                } else { pianoFillerState = null; }

                return newEvents;
            } else {
                pianoFillerState = null;
                melodyFillerState = null;
            }
        }

        return events;
    }

    private static renderCurrentBar(state: FillerState, type: string, root: number, octShift: number, isTrance: boolean = false): FractalEvent[] {
        const phrase = decompressCompactPhrase(state.axiom.phrase);
        const barOffset = state.currentBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);

        return barNotes.map(n => ({
            type: type as any,
            note: root + octShift + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.6,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { 
                isEcho: true, 
                hpCutoff: isTrance ? 800 : undefined // #ЗАЧЕМ: ПЛАН №1211. Фильтрация для транса.
            }
        }));
    }

    private static advanceState(state: FillerState) {
        state.currentBar++;
        // Определяем длину аксиомы
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
