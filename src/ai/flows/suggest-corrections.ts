'use server';

/**
 * @fileOverview Financial entry correction suggestion AI agent.
 *
 * - suggestFinancialCorrections - A function that suggests corrections for financial entries.
 * - SuggestFinancialCorrectionsInput - The input type for the suggestFinancialCorrections function.
 * - SuggestFinancialCorrectionsOutput - The return type for the suggestFinancialCorrections function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFinancialCorrectionsInputSchema = z.object({
  financialEntries: z.string().describe('A JSON string of the user financial entries.'),
  sectionLimits: z.string().describe('A JSON string of the section limits.'),
});
export type SuggestFinancialCorrectionsInput = z.infer<typeof SuggestFinancialCorrectionsInputSchema>;

const SuggestFinancialCorrectionsOutputSchema = z.object({
  corrections: z.string().describe('A JSON string of suggested corrections and highlighted inaccuracies.'),
  savingsSuggestions: z.string().describe('A JSON string of personalized savings suggestions.'),
});
export type SuggestFinancialCorrectionsOutput = z.infer<typeof SuggestFinancialCorrectionsOutputSchema>;

export async function suggestFinancialCorrections(
  input: SuggestFinancialCorrectionsInput
): Promise<SuggestFinancialCorrectionsOutput> {
  return suggestFinancialCorrectionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFinancialCorrectionsPrompt',
  input: {schema: SuggestFinancialCorrectionsInputSchema},
  output: {schema: SuggestFinancialCorrectionsOutputSchema},
  prompt: `You are a financial advisor that is going to help the user by analyzing their financial entries and suggesting corrections or highlighting potential inaccuracies, such as unusually high expenses or discrepancies in income.

You will also provide personalized savings suggestions to the user.

Financial Entries: {{{financialEntries}}}
Section Limits: {{{sectionLimits}}}

Provide the output as JSON string for corrections and savings suggestions.`,
});

const suggestFinancialCorrectionsFlow = ai.defineFlow(
  {
    name: 'suggestFinancialCorrectionsFlow',
    inputSchema: SuggestFinancialCorrectionsInputSchema,
    outputSchema: SuggestFinancialCorrectionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
