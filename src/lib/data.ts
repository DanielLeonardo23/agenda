import { getDatabase, ref, push, set, get } from 'firebase/database';
import type { FinancialData, Transaction, AddTransactionData, RecurringPayment, Budget } from './types';
import { firebaseApp } from './firebase';

const db = getDatabase(firebaseApp);

export async function getFinancialData(): Promise<FinancialData> {
  const transactionsRef = ref(db, 'transactions');
  const snapshot = await get(transactionsRef);
  
  const transactions: Transaction[] = [];
  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const key in data) {
      transactions.push({
        id: key,
        ...data[key]
      });
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentBalance = totalIncome - totalExpenses;

  const recurringPayments: RecurringPayment[] = [];
  const budgets: Budget[] = [];

  return {
    transactions,
    recurringPayments,
    budgets,
    currentBalance,
  };
}

export async function addTransaction(transactionData: AddTransactionData) {
    try {
        const transactionsRef = ref(db, 'transactions');
        const newTransactionRef = push(transactionsRef);
        await set(newTransactionRef, {
            ...transactionData,
            amount: Number(transactionData.amount),
            date: transactionData.date.toISOString(),
        });
        console.log("Documento escrito con ID: ", newTransactionRef.key);
        return { success: true, id: newTransactionRef.key };
    } catch (e) {
        console.error("Error al añadir el documento: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}
