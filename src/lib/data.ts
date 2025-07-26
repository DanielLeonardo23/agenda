import { getDatabase, ref, push, set, get, update, onValue, off } from 'firebase/database';
import type { FinancialData, Transaction, AddTransactionData, RecurringPayment, Budget, AddRecurringPaymentData } from './types';
import { firebaseApp } from './firebase';

const db = getDatabase(firebaseApp);

export function listenToFinancialData(callback: (data: FinancialData) => void) {
  const rootRef = ref(db);

  const listener = onValue(rootRef, (snapshot) => {
    const dbData = snapshot.val() || {};
    
    const transactions: Transaction[] = [];
    if (dbData.transactions) {
      const data = dbData.transactions;
      for (const key in data) {
        transactions.push({
          id: key,
          ...data[key]
        });
      }
    }

    const recurringPayments: RecurringPayment[] = [];
    if (dbData.recurringPayments) {
      const data = dbData.recurringPayments;
      for (const key in data) {
        recurringPayments.push({
          id: key,
          ...data[key]
        });
      }
    }
    
    const initialBalance = dbData.initialBalance || 0;

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentBalance = initialBalance + totalIncome - totalExpenses;

    // Mock data for budgets as it's not implemented yet
    const budgets: Budget[] = [];

    callback({
      transactions,
      recurringPayments,
      budgets,
      currentBalance,
      initialBalance,
    });
  });

  // Devuelve una función para cancelar la suscripción y limpiar el listener
  return () => off(rootRef, 'value', listener);
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

export async function setInitialBalance(balance: number) {
    try {
        const rootRef = ref(db);
        await update(rootRef, {
            initialBalance: Number(balance)
        });
        return { success: true };
    } catch (e) {
        console.error("Error al establecer el saldo inicial: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function addRecurringPayment(paymentData: AddRecurringPaymentData) {
  try {
    const paymentsRef = ref(db, 'recurringPayments');
    const newPaymentRef = push(paymentsRef);
    await set(newPaymentRef, {
      ...paymentData,
      amount: Number(paymentData.amount),
      dayOfMonth: Number(paymentData.dayOfMonth),
    });
    return { success: true, id: newPaymentRef.key };
  } catch(e) {
    console.error("Error al añadir el pago recurrente: ", e);
    const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
    return { success: false, error: errorMessage };
  }
}