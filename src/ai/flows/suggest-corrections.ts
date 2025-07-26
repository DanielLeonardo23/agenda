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
  financialEntries: z.string().describe('Una cadena JSON de los registros financieros del usuario.'),
  sectionLimits: z.string().describe('Una cadena JSON de los límites de la sección.'),
});
export type SuggestFinancialCorrectionsInput = z.infer<typeof SuggestFinancialCorrectionsInputSchema>;

const SuggestFinancialCorrectionsOutputSchema = z.object({
  corrections: z.string().describe('Una cadena JSON de correcciones sugeridas e imprecisiones destacadas.'),
  savingsSuggestions: z.string().describe('Una cadena JSON de sugerencias de ahorro personalizadas.'),
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
  prompt: `Usted es un asesor financiero que ayudará al usuario analizando sus asientos financieros y sugiriendo correcciones o destacando posibles imprecisiones, como gastos inusualmente altos o discrepancias en los ingresos.

También proporcionará sugerencias de ahorro personalizadas al usuario.

Asientos financieros: {{{financialEntries}}}
Límites de sección: {{{sectionLimits}}}

Proporcione el resultado como una cadena JSON para las correcciones y sugerencias de ahorro.`,
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
