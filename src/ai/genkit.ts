import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * #ЗАЧЕМ: Центральный инстанс Genkit для AuraGroove.
 * #ЧТО: Инициализация Genkit с плагином Google AI.
 * #СВЯЗИ: Используется всеми AI Flow для интеллектуального анализа.
 */
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
});
