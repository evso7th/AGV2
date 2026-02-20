'use server';
/**
 * @fileOverview AI Musicologist Flow for Axiom Calibration.
 * #ОБНОВЛЕНО (ПЛАН №548): Восстановлен префикс googleai/ для корректной маршрутизации.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeAxiomInputSchema = z.object({
  phrase: z.array(z.number()).describe('Compact phrase format [t, d, degIdx, techIdx]'),
  genre: z.string().optional(),
  mood: z.string().optional(),
  rootNote: z.number().optional(),
});

const AnalyzeAxiomOutputSchema = z.object({
  vector: z.object({
    t: z.number(),
    b: z.number(),
    e: z.number(),
    h: z.number(),
  }),
  reasoning: z.string(),
});

export async function analyzeAxiom(input: z.infer<typeof AnalyzeAxiomInputSchema>): Promise<z.infer<typeof AnalyzeAxiomOutputSchema>> {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      input: input,
      output: { schema: AnalyzeAxiomOutputSchema },
      prompt: `Analyze this MIDI fragment [tick, duration, degreeIndex, techniqueIndex].
      Context: Genre={{{genre}}}, Mood={{{mood}}}, Root={{{rootNote}}}.
      Position it in the 4D space (0-1):
      1. Tension (t): Dissonance/Chromaticism.
      2. Brightness (b): Major feel/High register.
      3. Entropy (e): Rhythmic complexity.
      4. Stability (h): Tonic gravity.
      
      Phrase: {{{phrase}}}`,
    });
    if (!output) throw new Error('AI failed to respond');
    return output;
  } catch (e) {
    console.error('[AI] Axiom Analysis failed:', e);
    throw e;
  }
}
