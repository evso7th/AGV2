'use server';
/**
 * @fileOverview AI Musical Disassembler Flow.
 * #ЗАЧЕМ: Замена "ножниц" на интеллектуальный анализ. 
 * #ЧТО: ИИ находит логические музыкальные предложения вместо тупой нарезки по тактам.
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

  // #ЗАЧЕМ: Фокусировка на начале произведения для поиска "ДНК".
  const cappedNotes = input.notes.slice(0, 150);

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      input: { ...input, notes: cappedNotes },
      output: { schema: ExtractAxiomsOutputSchema },
      prompt: `You are an expert musicologist. Analyze the following MIDI notes for the instrument role: "{{role}}".
      
      MISSION: Identify meaningful "musical atoms" (axioms). 
      An axiom is a complete thought: a riff, a call-and-response pair, or a distinct rhythmic groove.
      
      RULES:
      1. Axioms must be between 24 and 144 ticks (2-12 bars). 
      2. Do NOT just split every 4 bars. Look for melodic peaks and pauses.
      3. For "bass", find stable recurring motifs.
      4. For "melody", find lyrical arcs or distinctive solos.
      5. Return tick boundaries [startTick, endTick] that capture these full ideas perfectly.
      
      Track Name: "{{trackName}}"
      MIDI Data:
      {{{notes}}}`,
    });
    
    if (!output) throw new Error('AI extraction failed to return output');
    return output;
  } catch (e) {
    console.error('[AI] Extraction failed:', e);
    throw e;
  }
}
