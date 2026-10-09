/**
 * @fileOverview Genetic Memory Decorator V2.0 — "Hypnotic Loop".
 * #ЗАЧЕМ: Реализация ПЛАНА №1210. Заполнение пауз пианиста в блюзе.
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
    iteration: number; // 0 or 1 (Double pass)
    currentBar: number; // relative to axiom
}

let pianoFillerState: FillerState | null = null;

export class GeneticMemoryDecorator {
    public static fillGaps(
        events: FractalEvent[],
        genre: string,
        tension: number,
        cloudAxioms: any[],
        rootNote: number
    ): FractalEvent[] {
        // ОГРАНИЧЕНИЕ: Только Блюз и только Пианино (согласно ТЗ)
        if (genre !== 'blues' && genre !== 'cyber_blues') {
            pianoFillerState = null;
            return events;
        }

        // Проверяем наличие оригинальной партии пианино в текущем такте
        const hasPiano = events.some(e => e.type === 'pianoAccompaniment');

        // Heritage Supremacy: Если в оригинале есть ноты — сбрасываем филлер
        if (hasPiano) {
            pianoFillerState = null;
            return events;
        }

        // Если нет активного воспоминания — ищем новое
        if (!pianoFillerState) {
            const best = findGeneticFillerAxiom(cloudAxioms, 'pianoAccompaniment', tension);
            if (best) {
                pianoFillerState = {
                    axiom: best,
                    iteration: 0,
                    currentBar: 0
                };
            }
        }

        if (!pianoFillerState) return events;

        // Рендерим текущий такт филлера
        const phrase = decompressCompactPhrase(pianoFillerState.axiom.phrase);
        const barOffset = pianoFillerState.currentBar * TICKS_PER_BAR;
        const barNotes = phrase.filter(n => n.t >= barOffset && n.t < barOffset + TICKS_PER_BAR);

        const fillerEvents: FractalEvent[] = barNotes.map(n => ({
            type: 'pianoAccompaniment',
            note: rootNote + 24 + (DEGREE_TO_SEMITONE[n.deg] || 0),
            time: (n.t - barOffset) * TICK_TO_BEAT,
            duration: n.d * TICK_TO_BEAT,
            weight: 0.65,
            technique: 'hit',
            dynamics: 'p',
            phrasing: 'legato',
            params: { isEcho: true } // Флаг для "призрачного" звука
        }));

        // Продвигаем жизненный цикл воспоминания
        pianoFillerState.currentBar++;
        
        // Считаем общую длину бандла в тактах
        let maxT = 0;
        phrase.forEach(note => { if (note.t > maxT) maxT = note.t; });
        const totalBars = pianoFillerState.axiom.bars || Math.ceil((maxT + 1) / TICKS_PER_BAR);

        if (pianoFillerState.currentBar >= totalBars) {
            if (pianoFillerState.iteration === 0) {
                // ПЕРВЫЙ ПОВТОР (Закон Двойного Круга)
                pianoFillerState.iteration = 1;
                pianoFillerState.currentBar = 0;
            } else {
                // ВТОРОЙ ПОВТОР ЗАВЕРШЕН — сброс для поиска нового воспоминания
                pianoFillerState = null;
            }
        }

        return [...events, ...fillerEvents];
    }
}
