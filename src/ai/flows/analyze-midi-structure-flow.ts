'use server';
/**
 * @fileOverview AI Orchestrator Flow for MIDI Structure Analysis.
 * #ОБНОВЛЕНО (ПЛАН №548): Восстановлен префикс googleai/.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TrackInfoSchema = z.object({
  index: z.number(),
  name: z.string(),
  noteCount: z.number(),
  avgPitch: z.number(),
  minPitch: z.number(),
  maxPitch: z.number(),
});

const AnalyzeMidiInputSchema = z.object({
  tracks: z.array(TrackInfoSchema),
  fileName: z.string().optional(),
});

const AnalyzeMidiOutputSchema = z.object({
  suggestions: z.array(z.object({
    trackIndex: z.number(),
    suggestedRole: z.enum(['melody', 'bass', 'drums', 'accomp', 'ignore']),
    confidence: z.number(),
    reasoning: z.string(),
  })),
  globalAdvice: z.string(),
});

export async function analyzeMidiStructure(input: z.infer<typeof AnalyzeMidiInputSchema>): Promise<z.infer<typeof AnalyzeMidiOutputSchema>> {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      input: input,
      output: { schema: AnalyzeMidiOutputSchema },
      prompt: `Suggest AuraGroove roles for these tracks:
      melody: Lead/Solos.
      bass: Low end.
      drums: Rhythm.
      accomp: Chords/Pads.
      
      Tracks:
      {{#each tracks}}
      Track {{index}}: "{{name}}", Notes={{noteCount}}, Range={{minPitch}}-{{maxPitch}}
      {{/each}}`,
    });
    if (!output) throw new Error('AI failed to respond');
    return output;
  } catch (e) {
    console.error('[AI] Orchestration failed:', e);
    throw e;
  }
}
