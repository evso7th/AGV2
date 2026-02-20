'use server';
/**
 * @fileOverview AI Orchestrator Flow for MIDI Structure Analysis.
 * #ОБНОВЛЕНО (ПЛАН №550): Удален префикс googleai/ для устранения ошибки 404.
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
      model: 'gemini-1.5-flash',
      input: input,
      output: { schema: AnalyzeMidiOutputSchema },
      prompt: `Suggest AuraGroove roles for these tracks based on their names and characteristics:
      melody: Lead instruments, solos, vocal lines.
      bass: Low end patterns, root pedals.
      drums: Percussion and rhythm tracks.
      accomp: Chords, pads, rhythm guitar/piano.
      
      Tracks:
      {{#each tracks}}
      Track {{index}}: "{{name}}", Notes={{noteCount}}, Range={{minPitch}}-{{maxPitch}}, AvgPitch={{avgPitch}}
      {{/each}}`,
    });
    if (!output) throw new Error('AI failed to respond');
    return output;
  } catch (e) {
    console.error('[AI] Orchestration failed:', e);
    throw e;
  }
}
