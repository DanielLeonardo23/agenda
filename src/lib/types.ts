export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number; // in PEN
  date: string; // ISO string
  category: string;
  description: string;
};

export type RecurringPayment = {
  id: string;
  name: string;
  amount: number; // in PEN
  dayOfMonth: number;
  category: string;
};

export type Budget = {
  id:string;
  category: string;
  limit: number; // in PEN
  recurring: boolean;
};

export type FinancialData = {
  transactions: Transaction[];
  recurringPayments: RecurringPayment[];
  budgets: Budget[];
  currentBalance: number; // in PEN
  initialBalance: number; // in PEN
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

export interface AddTransactionData {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: Date;
    description?: string;
}

export interface AddRecurringPaymentData {
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
}
