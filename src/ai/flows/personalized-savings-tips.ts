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
  income: z.number().describe('The user monthly income.'),
  expenses: z.record(z.string(), z.number()).describe('A record of the user expenses, grouped by category.'),
  financialGoals: z.string().describe('The user financial goals.'),
  currentBalance: z.number().describe('The user current balance.'),
  upcomingPayments: z.record(z.string(), z.number()).describe('A record of the user upcoming payments, grouped by category.'),
});
export type PersonalizedSavingsTipsInput = z.infer<typeof PersonalizedSavingsTipsInputSchema>;

const PersonalizedSavingsTipsOutputSchema = z.object({
  savingsTips: z.array(z.string()).describe('A list of personalized savings tips for the user.'),
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
  prompt: `You are a personal finance advisor. Analyze the user's financial situation and provide personalized, actionable savings tips tailored to their specific situation.

  Consider the user's income, expenses, financial goals, current balance and upcoming payments.

  Income: {{income}}
  Expenses: {{#each expenses}}{{@key}}: {{this}}
  {{/each}}
  Financial Goals: {{financialGoals}}
  Current Balance: {{currentBalance}}
  Upcoming Payments: {{#each upcomingPayments}}{{@key}}: {{this}}
  {{/each}}

  Provide at least 3 savings tips.
  Format the response as a list of strings.
  Do not include any introductory or concluding sentences.
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
