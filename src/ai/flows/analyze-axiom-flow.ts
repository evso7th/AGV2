'use server';
/**
 * @fileOverview AI Musicologist Flow for Axiom Calibration.
 *
 * - analyzeAxiom - A function that performs deep musicological analysis of a MIDI fragment.
 * - AnalyzeAxiomInput - MIDI sequence, genre, and intended mood.
 * - AnalyzeAxiomOutput - Vector coordinates (t, b, e, h) and reasoning.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeAxiomInputSchema = z.object({
  phrase: z.array(z.number()).describe('Compact phrase format [t, d, degIdx, techIdx]'),
  genre: z.string().optional(),
  mood: z.string().optional(),
  rootNote: z.number().optional(),
});
export type AnalyzeAxiomInput = z.infer<typeof AnalyzeAxiomInputSchema>;

const AnalyzeAxiomOutputSchema = z.object({
  vector: z.object({
    t: z.number().describe('Tension: Dissonance and chromaticism (0-1)'),
    b: z.number().describe('Brightness: Register and major/minor feel (0-1)'),
    e: z.number().describe('Entropy: Rhythmic complexity and syncopation (0-1)'),
    h: z.number().describe('Harmonic Stability: Pull to the tonic (0-1)'),
  }),
  reasoning: z.string().describe('Brief musicological justification for these values.'),
});
export type AnalyzeAxiomOutput = z.infer<typeof AnalyzeAxiomOutputSchema>;

export async function analyzeAxiom(input: AnalyzeAxiomInput): Promise<AnalyzeAxiomOutput> {
  return analyzeAxiomFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAxiomPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: AnalyzeAxiomInputSchema },
  output: { schema: AnalyzeAxiomOutputSchema },
  prompt: `You are a world-class musicologist and expert in generative music theory.
Analyze the following MIDI fragment provided in a compact format [tick, duration, degreeIndex, techniqueIndex].

Context:
Genre: {{{genre}}}
Intended Mood: {{{mood}}}
Root Note MIDI: {{{rootNote}}}

Degrees Mapping: R, b2, 2, b3, 3, 4, #4, 5, b6, 6, b7, 7, R+8, 9, 11 (in this order).

Your task is to position this fragment in the AuraGroove Hypercube (4D vector space):

1. Tension (t): Evaluate dissonance. High values for tritones (#4/b5), minor seconds (b2), and frequent chromatic steps.
2. Brightness (b): Evaluate the "light". High values for major intervals (3, 6, 7), high registers, and Lydian characteristics. Low for minor and Phrygian.
3. Entropy (e): Evaluate rhythmic surprise. High values for syncopation, triplets against straight time, and irregular rests. 
4. Harmonic Stability (h): Evaluate "gravity". High values if the phrase anchors strongly on the Root (R) and 5th. Low if it wanders or stays on tensions.

Phrase Data:
{{{phrase}}}

Provide the 4D vector and a one-sentence reasoning.`,
});

const analyzeAxiomFlow = ai.defineFlow(
  {
    name: 'analyzeAxiomFlow',
    inputSchema: AnalyzeAxiomInputSchema,
    outputSchema: AnalyzeAxiomOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('AI analysis failed to return output.');
    return output;
  }
);
