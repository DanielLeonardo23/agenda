// @ts-nocheck
'use server';

import { revalidatePath } from 'next/cache';
import { suggestFinancialCorrections } from '@/ai/flows/suggest-corrections';
import { addTransaction, setInitialBalance as setInitialBalanceDb, addRecurringPayment as addRecurringPaymentDb } from '@/lib/data';
import type { FinancialData, Correction, SavingsSuggestion, AddTransactionData, AddRecurringPaymentData } from '@/lib/types';


export async function addTransactionAction(data: AddTransactionData) {
  const result = await addTransaction(data);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function setInitialBalanceAction(balance: number) {
  const result = await setInitialBalanceDb(balance);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function addRecurringPaymentAction(data: AddRecurringPaymentData) {
  const result = await addRecurringPaymentDb(data);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}


export async function getFinancialHealthSuggestions(data: FinancialData): Promise<{ success: boolean; corrections?: Correction[]; savingsSuggestions?: SavingsSuggestion[]; error?: string; }> {
  try {
    const financialEntries = JSON.stringify(data.transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      category: t.category,
      type: t.type,
      date: t.date
    })));

    const sectionLimits = JSON.stringify(
      data.budgets.reduce((acc, budget) => {
        acc[budget.category] = budget.limit;
        return acc;
      }, {} as Record<string, number>)
    );

    const result = await suggestFinancialCorrections({
      financialEntries,
      sectionLimits,
    });
    
    const corrections = typeof result.corrections === 'string' ? JSON.parse(result.corrections) : result.corrections;
    const savingsSuggestions = typeof result.savingsSuggestions === 'string' ? JSON.parse(result.savingsSuggestions) : result.savingsSuggestions;

    return { success: true, corrections, savingsSuggestions };
  } catch (error) {
    console.error("Error getting financial health suggestions:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: `Failed to get suggestions from AI. Details: ${errorMessage}` };
  }
}
