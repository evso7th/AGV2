'use server';

/**
 * @fileOverview A music parameter generation AI agent.
 *
 * - generateMusicParameters - A function that generates music parameters from a text prompt.
 * - GenerateMusicParametersInput - The input type for the generateMusicParameters function.
 * - GenerateMusicParametersOutput - The return type for the generateMusicParameters function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMusicParametersInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the kind of music desired.'),
});
export type GenerateMusicParametersInput = z.infer<typeof GenerateMusicParametersInputSchema>;

const GenerateMusicParametersOutputSchema = z.object({
  scale: z.string().describe('The musical scale to use.'),
  tempo: z.number().describe('The tempo of the music in beats per minute.'),
  instrument: z.string().describe('The instrument to use.'),
});
export type GenerateMusicParametersOutput = z.infer<typeof GenerateMusicParametersOutputSchema>;

export async function generateMusicParameters(input: GenerateMusicParametersInput): Promise<GenerateMusicParametersOutput> {
  return generateMusicParametersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMusicParametersPrompt',
  input: {schema: GenerateMusicParametersInputSchema},
  output: {schema: GenerateMusicParametersOutputSchema},
  prompt: `You are a music generation expert. Given a text prompt describing the kind of music desired, you will generate initial parameters for algorithmic music generation.

  The parameters are:
  - scale: The musical scale to use.
  - tempo: The tempo of the music in beats per minute.
  - instrument: The instrument to use.

  Text Prompt: {{{prompt}}}`,
});

const generateMusicParametersFlow = ai.defineFlow(
  {
    name: 'generateMusicParametersFlow',
    inputSchema: GenerateMusicParametersInputSchema,
    outputSchema: GenerateMusicParametersOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
