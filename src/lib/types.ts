export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string; // ISO string
  category: string;
  description: string;
};

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
};

export type Budget = {
  id:string;
  category: string;
  limit: number;
  recurring: boolean;
};

export type FinancialData = {
  transactions: Transaction[];
  recurringPayments: RecurringPayment[];
  budgets: Budget[];
  currentBalance: number;
};

export type Correction = {
  entryId: string;
  reason: string;
  suggestion: string;
};

export type SavingsSuggestion = {
  suggestion: string;
  area: string;
};
