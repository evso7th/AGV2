'use server';
/**
 * @fileOverview AI Orchestrator Flow for MIDI Structure Analysis.
 *
 * - analyzeMidiStructure - Analyzes all tracks in a MIDI file and suggests roles.
 * - AnalyzeMidiInput - List of tracks with metadata (name, note count, pitch range).
 * - AnalyzeMidiOutput - Mapping of track indices to AuraGroove roles.
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

const SuggestedRoleSchema = z.enum(['melody', 'bass', 'drums', 'accomp', 'ignore']);

const AnalyzeMidiOutputSchema = z.object({
  suggestions: z.array(z.object({
    trackIndex: z.number(),
    suggestedRole: SuggestedRoleSchema,
    confidence: z.number(),
    reasoning: z.string(),
  })),
  globalAdvice: z.string().describe('General advice on how to ingest this specific composition.'),
});

export async function analyzeMidiStructure(input: z.infer<typeof AnalyzeMidiInputSchema>): Promise<z.infer<typeof AnalyzeMidiOutputSchema>> {
  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    input: input,
    output: { schema: AnalyzeMidiOutputSchema },
    prompt: `You are an expert music producer and orchestrator. 
Analyze the tracks of this MIDI file and suggest which roles they should play in the AuraGroove generative engine.

Roles:
- melody: Lead lines, solos, vocal-like themes.
- bass: Harmonic foundation, low end.
- drums: Rhythmic patterns, percussion.
- accomp: Chords, pads, textures.
- ignore: Technical tracks, duplicates, or junk.

Track Data:
{{#each tracks}}
Track {{index}}: Name="{{name}}", Notes={{noteCount}}, Range={{minPitch}}-{{maxPitch}}, AvgPitch={{avgPitch}}
{{/each}}

Provide a suggestion for each track and general orchestration advice.`,
  });

  if (!output) throw new Error('AI Orchestral analysis failed.');
  return output;
}
