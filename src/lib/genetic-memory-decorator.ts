/**
 * @fileOverview Genetic Memory Decorator V2.2 — "Foundry Stagnation Interceptor".
 * #ЗАЧЕМ: Реализация ПЛАНА №1211. Заполнение пауз в Блюзе, Трансе и Дарк-Трансе (Foundry).
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
let harmonyFillerState: FillerState | null = null;

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

        // --- 3. FOUNDRY LOGIC (Sinister Stagnation) ---
        // #ЗАЧЕМ: ПЛАН №1215. Внедрение памяти при остановке индустриального лида.
        if (genre === 'foundry') {
            const melodyEvents = events.filter(e => e.type === 'melody');
            // Стагнация: лид молчит или играет одну длинную ноту (дрон)
            const isStagnant = melodyEvents.length <= 1;

            if (isStagnant) {
                const newEvents = [...events];
                
                // 1. Harmony Memory (Dirty Mellotron)
                if (!harmonyFillerState) {
                    const best = findGeneticFillerAxiom(cloudAxioms, 'harmony', tension);
                    if (best) harmonyFillerState = { axiom: best, iteration: 0, currentBar: 0 };
                }
                if (harmonyFillerState) {
                    const filler = this.renderCurrentBar(harmonyFillerState, 'harmony', rootNote, 12, false, 0.4);
                    filler.forEach(f => {
                        if (!f.params) f.params = {};
                        f.params.isEcho = true;
                        f.params.drive = 0.85; // Принудительный Fuzz для зловещности
                    });
                    newEvents.push(...filler);
                    this.advanceState(harmonyFillerState);
                    if (harmonyFillerState.iteration > 1) harmonyFillerState = null;
                }

                // 2. Piano Memory (Harmonic Rhodes)
                if (!pianoFillerState) {
                    const best = findGeneticFillerAxiom(cloudAxioms, 'pianoAccompaniment', tension);
                    if (best) pianoFillerState = { axiom: best, iteration: 0, currentBar: 0 };
                }
                if (pianoFillerState) {
                    const filler = this.renderCurrentBar(pianoFillerState, 'pianoAccompaniment', rootNote, 24, false, 0.45);
                    filler.forEach(f => {
                        if (!f.params) f.params = {};
                        f.params.isEcho = true;
                        f.params.drive = 0.65; // Подгруженный Родос
                    });
                    newEvents.push(...filler);
                    this.advanceState(pianoFillerState);
                    if (pianoFillerState.iteration > 1) pianoFillerState = null;
                }
                return newEvents;
            } else {
                harmonyFillerState = null;
                pianoFillerState = null;
            }
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
