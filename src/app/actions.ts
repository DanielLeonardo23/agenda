// @ts-nocheck
'use server';

import { revalidatePath } from 'next/cache';
import { suggestFinancialCorrections } from '@/ai/flows/suggest-corrections';
import { 
  addTransaction as addTransactionDb, 
  addRecurringPayment as addRecurringPaymentDb,
  deleteTransaction as deleteTransactionDb,
  addDailyBudget as addDailyBudgetDb,
  deleteDailyBudget as deleteDailyBudgetDb,
  addAccount as addAccountDb,
  deleteAccount as deleteAccountDb,
  updateAccountBalance as updateAccountBalanceDb,
  updateTransaction as updateTransactionDb,
  detectPendingRecurringPayments as detectPendingRecurringPaymentsDb,
  detectPendingDailyBudgets as detectPendingDailyBudgetsDb,
  approvePendingPayment as approvePendingPaymentDb,
  rejectPendingPayment as rejectPendingPaymentDb,
  cleanupOldPendingPayments as cleanupOldPendingPaymentsDb,
  deleteRecurringPayment as deleteRecurringPaymentDb,
  updateRecurringPayment as updateRecurringPaymentDb,
  updateDailyBudget as updateDailyBudgetDb
} from "@/lib/data";
import { migrateRecurringPayments } from "@/lib/migration";
import type { FinancialData, Correction, SavingsSuggestion, AddTransactionData, AddRecurringPaymentData, AddDailyBudgetData, AddAccountData } from '@/lib/types';


export async function addTransactionAction(data: AddTransactionData) {
  const result = await addTransactionDb(data);
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

export async function deleteTransactionAction(transactionId: string) {
  const result = await deleteTransactionDb(transactionId);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/transactions');
  }
  return result;
}

export async function addDailyBudgetAction(data: AddDailyBudgetData) {
  const result = await addDailyBudgetDb(data);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/budgets');
  }
  return result;
}

export async function deleteDailyBudgetAction(budgetId: string) {
  const result = await deleteDailyBudgetDb(budgetId);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/budgets');
  }
  return result;
}

export async function addAccountAction(data: AddAccountData) {
  const result = await addAccountDb(data);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/settings');
  }
  return result;
}

export async function deleteAccountAction(accountId: string) {
  const result = await deleteAccountDb(accountId);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/settings');
  }
  return result;
}

export async function updateAccountBalanceAction(accountId: string, newBalance: number) {
  const result = await updateAccountBalanceDb(accountId, newBalance);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function updateTransactionAction(data: {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: Date;
  description?: string;
  accountId?: string;
}) {
  const result = await updateTransactionDb(data);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function executeRecurringPaymentsAction() {
  const result = await executeRecurringPaymentsDb();
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function executeDailyBudgetsAction() {
  const result = await executeDailyBudgetsDb();
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function deleteRecurringPaymentAction(paymentId: string) {
  const result = await deleteRecurringPaymentDb(paymentId);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/scheduled-payments');
  }
  return result;
}

export async function updateRecurringPaymentAction(data: {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  daysOfWeek?: number[];
  description?: string;
  requiresApproval?: boolean;
}) {
  const result = await updateRecurringPaymentDb(data);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/scheduled-payments');
  }
  return result;
}

export async function updateDailyBudgetAction(data: {
  id: string;
  name: string;
  category: string;
  limit: number;
  daysOfWeek: number[];
  description?: string;
  items: any[];
  autoCreate: boolean;
  accountId?: string;
}) {
  const result = await updateDailyBudgetDb(data);
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/scheduled-payments');
  }
  return result;
}

export async function detectPendingRecurringPaymentsAction() {
  const result = await detectPendingRecurringPaymentsDb();
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function detectPendingDailyBudgetsAction() {
  const result = await detectPendingDailyBudgetsDb();
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function approvePendingPaymentAction(pendingPaymentId: string) {
  const result = await approvePendingPaymentDb(pendingPaymentId);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function rejectPendingPaymentAction(pendingPaymentId: string) {
  const result = await rejectPendingPaymentDb(pendingPaymentId);
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function cleanupOldPendingPaymentsAction() {
  const result = await cleanupOldPendingPaymentsDb();
  if (result.success) {
    revalidatePath('/');
  }
  return result;
}

export async function migrateRecurringPaymentsAction() {
  const result = await migrateRecurringPayments();
  if (result.success) {
    revalidatePath('/');
    revalidatePath('/scheduled-payments');
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
