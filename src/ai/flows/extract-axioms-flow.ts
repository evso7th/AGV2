'use server';
/**
 * @fileOverview AI Musical Disassembler Flow.
 * #ЗАЧЕМ: Интеллектуальная экстракция аксиом вместо нарезки "ножницами".
 * #ЧТО: Анализирует поток нот и выделяет логически завершенные фразы переменной длины.
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
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      input: input,
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
    if (!output) throw new Error('AI extraction failed');
    return output;
  } catch (e) {
    console.error('[AI] Extraction failed:', e);
    throw e;
  }
}
