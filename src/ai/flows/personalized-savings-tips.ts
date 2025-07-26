'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing personalized savings tips based on user's financial data.
 *
 * - getPersonalizedSavingsTips - A function that calls the personalized savings tips flow.
 * - PersonalizedSavingsTipsInput - The input type for the getPersonalizedSavingsTips function.
 * - PersonalizedSavingsTipsOutput - The return type for the getPersonalizedSavingsTips function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedSavingsTipsInputSchema = z.object({
  income: z.number().describe('El ingreso mensual del usuario en PEN.'),
  expenses: z.record(z.string(), z.number()).describe('Un registro de los gastos del usuario, agrupados por categoría en PEN.'),
  financialGoals: z.string().describe('Los objetivos financieros del usuario.'),
  currentBalance: z.number().describe('El saldo actual del usuario en PEN.'),
  upcomingPayments: z.record(z.string(), z.number()).describe('Un registro de los próximos pagos del usuario, agrupados por categoría in PEN.'),
});
export type PersonalizedSavingsTipsInput = z.infer<typeof PersonalizedSavingsTipsInputSchema>;

const PersonalizedSavingsTipsOutputSchema = z.object({
  savingsTips: z.array(z.string()).describe('Una lista de consejos de ahorro personalizados para el usuario.'),
});
export type PersonalizedSavingsTipsOutput = z.infer<typeof PersonalizedSavingsTipsOutputSchema>;

export async function getPersonalizedSavingsTips(
  input: PersonalizedSavingsTipsInput
): Promise<PersonalizedSavingsTipsOutput> {
  return personalizedSavingsTipsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedSavingsTipsPrompt',
  input: {schema: PersonalizedSavingsTipsInputSchema},
  output: {schema: PersonalizedSavingsTipsOutputSchema},
  prompt: `Eres un asesor financiero personal. Analiza la situación financiera del usuario y proporciona consejos de ahorro personalizados y procesables adaptados a su situación específica. La moneda está en Soles Peruanos (PEN).

  Considera los ingresos, gastos, metas financieras, saldo actual y próximos pagos del usuario.

  Ingresos: S/{{income}}
  Gastos: {{#each expenses}}{{@key}}: S/{{this}}
  {{/each}}
  Metas Financieras: {{financialGoals}}
  Saldo Actual: S/{{currentBalance}}
  Próximos Pagos: {{#each upcomingPayments}}{{@key}}: S/{{this}}
  {{/each}}

  Proporciona al menos 3 consejos de ahorro.
  Formatea la respuesta como una lista de strings.
  No incluyas ninguna oración introductoria o final.
  `,
});

const personalizedSavingsTipsFlow = ai.defineFlow(
  {
    name: 'personalizedSavingsTipsFlow',
    inputSchema: PersonalizedSavingsTipsInputSchema,
    outputSchema: PersonalizedSavingsTipsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
