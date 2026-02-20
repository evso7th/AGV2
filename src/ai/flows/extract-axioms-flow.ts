'use server';
/**
 * @fileOverview AI Musical Disassembler Flow.
 * #ОБНОВЛЕНО (ПЛАН №550): 1. Удален префикс googleai/ для устранения 404.
 *                          2. Промпт переведен на "Интеллектуальный Анализ" (поиск фраз, а не нарезка).
 *                          3. Введен жесткий лимит 100 нот для стабильности.
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

  // #ЗАЧЕМ: Защита от Token Overflow и фокусировка на первых 32 тактах.
  const cappedNotes = input.notes.slice(0, 100);

  try {
    const { output } = await ai.generate({
      model: 'gemini-1.5-flash',
      input: { ...input, notes: cappedNotes },
      output: { schema: ExtractAxiomsOutputSchema },
      prompt: `You are an expert musicologist and master producer. Analyze the following MIDI data for the role: "{{role}}".
      
      CRITICAL MISSION: Do NOT simply cut the track every 4 bars.
      Find meaningful "musical atoms" (axioms).
      
      RULES:
      1. Identify complete musical thoughts: riffs, call-and-response pairs, or rhythmic hooks.
      2. Axioms should ideally be between 48 and 144 ticks (4-12 bars in 12/8).
      3. If the role is "bass", look for stable recurring patterns.
      4. If the role is "melody", look for lyrical arcs or expressive solos.
      5. If the role is "drums", look for consistent rhythmic grooves.
      6. Return start/end tick boundaries that capture these full ideas without cutting notes.
      
      Track Data (Notes):
      {{{notes}}}`,
    });
    if (!output) throw new Error('AI extraction failed to return output');
    return output;
  } catch (e) {
    console.error('[AI] Extraction failed:', e);
    throw e;
  }
}
