import type { FinancialData } from './types';

export function getFinancialData(): FinancialData {
  const transactions = [];
  const recurringPayments = [];
  const budgets = [];
  const currentBalance = 0;

  return {
    transactions,
    recurringPayments,
    budgets,
    currentBalance,
  };
}
