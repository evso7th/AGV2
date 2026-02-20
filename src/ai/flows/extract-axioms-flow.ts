'use server';
/**
 * @fileOverview AI Musical Disassembler Flow.
 * #ОБНОВЛЕНО (ПЛАН №548): 1. Восстановлен префикс googleai/.
 *                          2. Введен жесткий лимит 100 нот для предотвращения падения по токенам.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const NoteSchema = z.object({
  t: z.number().describe('Time in ticks (12 per bar)'),
  d: z.number().describe('Duration in ticks'),
  pitch: z.number().describe('MIDI pitch'),
  vel: z.number().describe('Velocity 0-1'),
});

const ExtractAxiomsInputSchema = z.object({
  notes: z.array(NoteSchema),
  role: z.string(),
  trackName: z.string().optional(),
});

const AxiomDefinitionSchema = z.object({
  startTick: z.number(),
  endTick: z.number(),
  reasoning: z.string().describe('Why this phrase is a meaningful axiom.'),
  tags: z.array(z.string()),
});

const ExtractAxiomsOutputSchema = z.object({
  axioms: z.array(AxiomDefinitionSchema),
});

export async function extractAxioms(input: z.infer<typeof ExtractAxiomsInputSchema>): Promise<z.infer<typeof ExtractAxiomsOutputSchema>> {
  if (!input.notes || input.notes.length === 0) {
    return { axioms: [] };
  }

  // #ЗАЧЕМ: Защита от Token Overflow.
  // #ЧТО: Берем только первые 100 нот для анализа структуры.
  const cappedNotes = input.notes.slice(0, 100);

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      input: { ...input, notes: cappedNotes },
      output: { schema: ExtractAxiomsOutputSchema },
      prompt: `You are an expert music editor. Analyze the following sequence of MIDI notes for a track role: "{{role}}".
      Your goal is to identify meaningful musical "axioms" (phrases, riffs, or rhythmic motifs).
      
      RULES:
      1. Axioms must be between 4 and 12 bars long (48 to 144 ticks).
      2. Identify phrases that feel complete (e.g. Call and Response, a full Riff cycle).
      3. Avoid cutting notes in the middle.
      
      Track Data (Notes):
      {{{notes}}}
      
      Return a list of start/end tick boundaries for the best axioms found in this material.`,
    });
    if (!output) throw new Error('AI extraction failed to return output');
    return output;
  } catch (e) {
    console.error('[AI] Extraction failed:', e);
    throw e;
  }
}
