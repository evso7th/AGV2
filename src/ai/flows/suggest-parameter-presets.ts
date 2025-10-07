'use server';

/**
 * @fileOverview Suggests parameter presets based on a text description.
 *
 * - suggestParameterPresets - A function that suggests parameter presets.
 * - SuggestParameterPresetsInput - The input type for the suggestParameterPresets function.
 * - SuggestParameterPresetsOutput - The return type for the suggestParameterPresets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestParameterPresetsInputSchema = z.object({
  description: z
    .string()
    .describe('A text description of the desired music style or mood.'),
});

export type SuggestParameterPresetsInput = z.infer<
  typeof SuggestParameterPresetsInputSchema
>;

const SuggestParameterPresetsOutputSchema = z.object({
  presets: z
    .array(z.record(z.any()))
    .describe('An array of suggested parameter presets as key-value pairs.'),
});

export type SuggestParameterPresetsOutput = z.infer<
  typeof SuggestParameterPresetsOutputSchema
>;

export async function suggestParameterPresets(
  input: SuggestParameterPresetsInput
): Promise<SuggestParameterPresetsOutput> {
  return suggestParameterPresetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestParameterPresetsPrompt',
  input: {schema: SuggestParameterPresetsInputSchema},
  output: {schema: SuggestParameterPresetsOutputSchema},
  prompt: `You are a music expert who can suggest parameter presets for algorithmic music generation based on a text description.

  The user will provide a description of the desired music style or mood. You should suggest a few different parameter presets that would be appropriate for that style or mood. Return them as a JSON array of key-value pairs.

  Description: {{{description}}}
  `,
});

const suggestParameterPresetsFlow = ai.defineFlow(
  {
    name: 'suggestParameterPresetsFlow',
    inputSchema: SuggestParameterPresetsInputSchema,
    outputSchema: SuggestParameterPresetsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
