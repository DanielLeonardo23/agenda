export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number; // in PEN
  date: string; // ISO string
  category: string;
  description: string;
  dailyBudgetId?: string; // ID del presupuesto diario usado
  accountId?: string; // ID de la cuenta donde se registra
};

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bcp' | 'interbank' | 'banconacion' | 'other';
  balance: number; // in PEN
  color?: string; // Color para identificar la cuenta
  description?: string;
};

export type AccountTotal = Account & {
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
};

export interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  category: string;
  dayOfMonth: number;
  description?: string;
}

export type Budget = {
  id:string;
  category: string;
  limit: number; // in PEN
  recurring: boolean;
};

export type DailyBudgetItem = {
  id: string;
  name: string;
  amount: number; // in PEN
  category: string;
  description?: string;
};

export type DailyBudget = {
  id: string;
  name: string;
  category: string;
  limit: number; // in PEN - total de todos los items
  daysOfWeek: number[]; // 0=domingo, 1=lunes, ..., 6=sábado
  description?: string;
  items: DailyBudgetItem[]; // Lista de gastos individuales
  autoCreate: boolean; // Si se crean transacciones automáticamente
  accountId?: string; // Cuenta donde se registran las transacciones
};

export type FinancialData = {
  transactions: Transaction[];
  recurringPayments: RecurringPayment[];
  budgets: Budget[];
  dailyBudgets: DailyBudget[];
  accounts: Account[];
  currentBalance: number; // in PEN
  initialBalance: number; // in PEN
  accountTotals: AccountTotal[];
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
    dailyBudgetId?: string;
    accountId?: string;
}

export interface AddRecurringPaymentData {
  name: string;
  amount: number;
  dayOfMonth: number;
  category: string;
}

export interface AddDailyBudgetData {
  name: string;
  category: string;
  limit: number;
  daysOfWeek: number[];
  description?: string;
  items: DailyBudgetItem[];
  autoCreate: boolean;
  accountId?: string;
}

export interface AddAccountData {
  name: string;
  type: 'cash' | 'bcp' | 'interbank' | 'banconacion' | 'other';
  balance: number;
  color?: string;
  description?: string;
}
