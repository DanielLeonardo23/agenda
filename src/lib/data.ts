import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import type { FinancialData, Transaction, AddTransactionData, RecurringPayment, Budget } from './types';
import { firebaseApp } from './firebase';

const db = getFirestore(firebaseApp);

// This is a placeholder for user authentication.
// In a real app, you would get this from your auth provider.
const FAKE_USER_ID = "user123";

export async function getFinancialData(): Promise<FinancialData> {
  const transactionsCol = collection(db, "transactions");
  const q = query(transactionsCol, where("userId", "==", FAKE_USER_ID));
  const transactionSnapshot = await getDocs(q);

  const transactions: Transaction[] = transactionSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  } as Transaction));

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const currentBalance = totalIncome - totalExpenses;

  // For now, we'll keep these as empty arrays.
  // You would fetch these from Firestore in a similar way.
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
        const docRef = await addDoc(collection(db, "transactions"), {
            ...transactionData,
            amount: Number(transactionData.amount),
            date: transactionData.date.toISOString(),
            userId: FAKE_USER_ID,
        });
        console.log("Document written with ID: ", docRef.id);
        return { success: true, id: docRef.id };
    } catch (e) {
        console.error("Error adding document: ", e);
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        return { success: false, error: errorMessage };
    }
}