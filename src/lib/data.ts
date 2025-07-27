import { getDatabase, ref, push, set, update, onValue, off, remove, get } from 'firebase/database';
import type { FinancialData, Transaction, AddTransactionData, RecurringPayment, Budget, AddRecurringPaymentData, DailyBudget, AddDailyBudgetData, Account, AddAccountData } from './types';
import { firebaseApp } from './firebase';

const db = getDatabase(firebaseApp);

export function listenToFinancialData(callback: (data: FinancialData) => void) {
  const rootRef = ref(db);

  const listener = onValue(rootRef, (snapshot) => {
    const dbData = snapshot.val() || {};
    console.log("Datos recibidos de Firebase:", dbData);

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
    
    // El currentBalance ahora se calcula basado en los saldos de las cuentas

    const budgets: Budget[] = [];
    if (dbData.budgets) {
        const data = dbData.budgets;
        for (const key in data) {
            budgets.push({
                id: key,
                ...data[key]
            });
        }
    }

    const dailyBudgets: DailyBudget[] = [];
    if (dbData.dailyBudgets) {
        const data = dbData.dailyBudgets;
        for (const key in data) {
            const budget = data[key];
            // Asegurar que items existe
            if (!budget.items) {
                budget.items = [];
            }
            dailyBudgets.push({
                id: key,
                ...budget
            });
        }
    }

    const accounts: Account[] = [];
    if (dbData.accounts) {
        const data = dbData.accounts;
        for (const key in data) {
            accounts.push({
                id: key,
                ...data[key]
            });
        }
    }

    // Calcular el saldo actual basado en la suma de los saldos de las cuentas
    const totalAccountBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const currentBalance = totalAccountBalance;

    // Calcular totales por cuenta
    const accountTotals = accounts.map(account => {
        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const income = accountTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
        const expenses = accountTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        return {
            ...account,
            totalIncome: income,
            totalExpenses: expenses,
            netFlow: income - expenses
        };
    });

    const financialData: FinancialData = {
      transactions,
      recurringPayments,
      budgets,
      dailyBudgets,
      accounts,
      currentBalance,
      initialBalance,
      accountTotals,
    };
    
    console.log("Datos procesados para la UI:", financialData);
    callback(financialData);
  });

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

        // Actualizar el saldo de la cuenta si se especificó una cuenta
        if (transactionData.accountId) {
            const accountRef = ref(db, `accounts/${transactionData.accountId}`);
            const accountSnapshot = await get(accountRef);
            
            if (accountSnapshot.exists()) {
                const currentBalance = accountSnapshot.val().balance || 0;
                let newBalance = currentBalance;
                
                if (transactionData.type === 'income') {
                    newBalance += transactionData.amount;
                } else if (transactionData.type === 'expense') {
                    newBalance -= transactionData.amount;
                }
                
                await update(accountRef, {
                    balance: newBalance
                });
                console.log(`Saldo de cuenta ${transactionData.accountId} actualizado a: ${newBalance}`);
            }
        }

        return { success: true, id: newTransactionRef.key };
    } catch (e) {
        console.error("Error al añadir el documento: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function updateTransaction(transactionData: {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: Date;
    description?: string;
    accountId?: string;
}) {
    try {
        const transactionRef = ref(db, `transactions/${transactionData.id}`);
        const transactionSnapshot = await get(transactionRef);
        
        if (!transactionSnapshot.exists()) {
            return { success: false, error: "Transacción no encontrada" };
        }

        const oldTransaction = transactionSnapshot.val();
        
        // Revertir el saldo de la cuenta anterior si existía
        if (oldTransaction.accountId) {
            const oldAccountRef = ref(db, `accounts/${oldTransaction.accountId}`);
            const oldAccountSnapshot = await get(oldAccountRef);
            
            if (oldAccountSnapshot.exists()) {
                const currentBalance = oldAccountSnapshot.val().balance || 0;
                let newBalance = currentBalance;
                
                // Revertir la transacción anterior
                if (oldTransaction.type === 'income') {
                    newBalance -= oldTransaction.amount;
                } else if (oldTransaction.type === 'expense') {
                    newBalance += oldTransaction.amount;
                }
                
                await update(oldAccountRef, {
                    balance: newBalance
                });
                console.log(`Saldo de cuenta ${oldTransaction.accountId} revertido a: ${newBalance}`);
            }
        }

        // Actualizar la transacción
        await update(transactionRef, {
            type: transactionData.type,
            amount: Number(transactionData.amount),
            category: transactionData.category,
            date: transactionData.date.toISOString(),
            description: transactionData.description || '',
            accountId: transactionData.accountId,
        });

        // Actualizar el saldo de la nueva cuenta si se especificó
        if (transactionData.accountId) {
            const accountRef = ref(db, `accounts/${transactionData.accountId}`);
            const accountSnapshot = await get(accountRef);
            
            if (accountSnapshot.exists()) {
                const currentBalance = accountSnapshot.val().balance || 0;
                let newBalance = currentBalance;
                
                if (transactionData.type === 'income') {
                    newBalance += transactionData.amount;
                } else if (transactionData.type === 'expense') {
                    newBalance -= transactionData.amount;
                }
                
                await update(accountRef, {
                    balance: newBalance
                });
                console.log(`Saldo de cuenta ${transactionData.accountId} actualizado a: ${newBalance}`);
            }
        }

        console.log("Transacción actualizada con ID: ", transactionData.id);
        return { success: true };
    } catch (e) {
        console.error("Error al actualizar la transacción: ", e);
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

export async function deleteTransaction(transactionId: string) {
    try {
        const transactionRef = ref(db, `transactions/${transactionId}`);
        const transactionSnapshot = await get(transactionRef);
        
        if (transactionSnapshot.exists()) {
            const transaction = transactionSnapshot.val();
            
            // Restaurar el saldo de la cuenta si la transacción tenía una cuenta asociada
            if (transaction.accountId) {
                const accountRef = ref(db, `accounts/${transaction.accountId}`);
                const accountSnapshot = await get(accountRef);
                
                if (accountSnapshot.exists()) {
                    const currentBalance = accountSnapshot.val().balance || 0;
                    let newBalance = currentBalance;
                    
                    // Revertir la transacción
                    if (transaction.type === 'income') {
                        newBalance -= transaction.amount;
                    } else if (transaction.type === 'expense') {
                        newBalance += transaction.amount;
                    }
                    
                    await update(accountRef, {
                        balance: newBalance
                    });
                    console.log(`Saldo de cuenta ${transaction.accountId} restaurado a: ${newBalance}`);
                }
            }
        }
        
        await remove(transactionRef);
        console.log("Transacción eliminada con ID: ", transactionId);
        return { success: true };
    } catch (e) {
        console.error("Error al eliminar la transacción: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function addDailyBudget(budgetData: AddDailyBudgetData) {
    try {
        const dailyBudgetsRef = ref(db, 'dailyBudgets');
        const newBudgetRef = push(dailyBudgetsRef);
        await set(newBudgetRef, {
            ...budgetData,
            limit: Number(budgetData.limit),
        });
        console.log("Presupuesto diario creado con ID: ", newBudgetRef.key);
        return { success: true, id: newBudgetRef.key };
    } catch (e) {
        console.error("Error al crear el presupuesto diario: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function deleteDailyBudget(budgetId: string) {
    try {
        const budgetRef = ref(db, `dailyBudgets/${budgetId}`);
        await remove(budgetRef);
        console.log("Presupuesto diario eliminado con ID: ", budgetId);
        return { success: true };
    } catch (e) {
        console.error("Error al eliminar el presupuesto diario: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function addAccount(accountData: AddAccountData) {
    try {
        const accountsRef = ref(db, 'accounts');
        const newAccountRef = push(accountsRef);
        await set(newAccountRef, {
            ...accountData,
            balance: Number(accountData.balance),
        });
        console.log("Cuenta creada con ID: ", newAccountRef.key);
        return { success: true, id: newAccountRef.key };
    } catch (e) {
        console.error("Error al crear la cuenta: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function deleteAccount(accountId: string) {
    try {
        const accountRef = ref(db, `accounts/${accountId}`);
        await remove(accountRef);
        console.log("Cuenta eliminada con ID: ", accountId);
        return { success: true };
    } catch (e) {
        console.error("Error al eliminar la cuenta: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function updateAccountBalance(accountId: string, newBalance: number) {
    try {
        const accountRef = ref(db, `accounts/${accountId}`);
        await update(accountRef, {
            balance: newBalance
        });
        console.log(`Saldo de cuenta ${accountId} actualizado a: ${newBalance}`);
        return { success: true };
    } catch (e) {
        console.error("Error al actualizar el saldo de la cuenta: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

// Función para ejecutar pagos recurrentes automáticamente
export async function executeRecurringPayments() {
    try {
        const rootRef = ref(db);
        const snapshot = await get(rootRef);
        const dbData = snapshot.val() || {};
        
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

        const accounts: Account[] = [];
        if (dbData.accounts) {
            const data = dbData.accounts;
            for (const key in data) {
                accounts.push({
                    id: key,
                    ...data[key]
                });
            }
        }

        // Buscar cuenta BCP por defecto
        const bcpAccount = accounts.find(acc => acc.type === 'bcp');
        if (!bcpAccount) {
            console.log("No se encontró cuenta BCP para pagos automáticos");
            return { success: false, error: "No hay cuenta BCP configurada" };
        }

        const today = new Date();
        const currentDay = today.getDate();
        
        let executedPayments = 0;
        
        for (const payment of recurringPayments) {
            if (payment.dayOfMonth === currentDay) {
                // Verificar si ya se ejecutó hoy
                const todayStr = today.toISOString().split('T')[0];
                const existingTransactions = await get(ref(db, 'transactions'));
                const transactions = existingTransactions.val() || {};
                
                const alreadyExecuted = Object.values(transactions).some((t: any) => 
                    t.category === payment.category && 
                    t.amount === payment.amount &&
                    t.date && t.date.startsWith(todayStr)
                );
                
                if (!alreadyExecuted) {
                    // Crear transacción automática
                    const transactionData: AddTransactionData = {
                        type: 'expense',
                        amount: payment.amount,
                        category: payment.category,
                        date: today,
                        description: `Pago automático: ${payment.name}`,
                        accountId: bcpAccount.id
                    };
                    
                    const result = await addTransaction(transactionData);
                    if (result.success) {
                        executedPayments++;
                        console.log(`Pago recurrente ejecutado: ${payment.name} - S/ ${payment.amount}`);
                    }
                }
            }
        }
        
        return { success: true, executedPayments };
    } catch (e) {
        console.error("Error al ejecutar pagos recurrentes: ", e);
        return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
}

// Función para ejecutar presupuestos diarios automáticamente
export async function executeDailyBudgets() {
    try {
        const rootRef = ref(db);
        const snapshot = await get(rootRef);
        const dbData = snapshot.val() || {};
        
        const dailyBudgets: DailyBudget[] = [];
        if (dbData.dailyBudgets) {
            const data = dbData.dailyBudgets;
            for (const key in data) {
                const budget = data[key];
                if (!budget.items) {
                    budget.items = [];
                }
                dailyBudgets.push({
                    id: key,
                    ...budget
                });
            }
        }

        const accounts: Account[] = [];
        if (dbData.accounts) {
            const data = dbData.accounts;
            for (const key in data) {
                accounts.push({
                    id: key,
                    ...data[key]
                });
            }
        }

        // Buscar cuenta BCP por defecto
        const bcpAccount = accounts.find(acc => acc.type === 'bcp');
        if (!bcpAccount) {
            console.log("No se encontró cuenta BCP para presupuestos automáticos");
            return { success: false, error: "No hay cuenta BCP configurada" };
        }

        const today = new Date();
        const currentDayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, etc.
        const todayStr = today.toISOString().split('T')[0];
        
        let executedBudgets = 0;
        
        for (const budget of dailyBudgets) {
            if (budget.autoCreate && budget.daysOfWeek.includes(currentDayOfWeek)) {
                // Verificar si ya se ejecutó hoy
                const existingTransactions = await get(ref(db, 'transactions'));
                const transactions = existingTransactions.val() || {};
                
                const alreadyExecuted = Object.values(transactions).some((t: any) => 
                    t.category === budget.category && 
                    t.date && t.date.startsWith(todayStr) &&
                    t.description && t.description.includes(budget.name)
                );
                
                if (!alreadyExecuted) {
                    // Crear transacciones para cada item del presupuesto diario
                    for (const item of budget.items) {
                        const transactionData: AddTransactionData = {
                            type: 'expense',
                            amount: item.amount,
                            category: item.category,
                            date: today,
                            description: `${budget.name}: ${item.name}`,
                            accountId: bcpAccount.id,
                            dailyBudgetId: budget.id
                        };
                        
                        const result = await addTransaction(transactionData);
                        if (result.success) {
                            executedBudgets++;
                            console.log(`Presupuesto diario ejecutado: ${budget.name} - ${item.name} - S/ ${item.amount}`);
                        }
                    }
                }
            }
        }
        
        return { success: true, executedBudgets };
    } catch (e) {
        console.error("Error al ejecutar presupuestos diarios: ", e);
        return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
}

export async function deleteRecurringPayment(paymentId: string) {
    try {
        const paymentRef = ref(db, `recurringPayments/${paymentId}`);
        await remove(paymentRef);
        console.log(`Pago recurrente eliminado: ${paymentId}`);
        return { success: true };
    } catch (e) {
        console.error("Error al eliminar el pago recurrente: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function updateRecurringPayment(paymentData: {
    id: string;
    name: string;
    amount: number;
    category: string;
    dayOfMonth: number;
    description?: string;
}) {
    try {
        const paymentRef = ref(db, `recurringPayments/${paymentData.id}`);
        await update(paymentRef, {
            name: paymentData.name,
            amount: paymentData.amount,
            category: paymentData.category,
            dayOfMonth: paymentData.dayOfMonth,
            description: paymentData.description || null
        });
        console.log(`Pago recurrente actualizado: ${paymentData.id}`);
        return { success: true };
    } catch (e) {
        console.error("Error al actualizar el pago recurrente: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}

export async function updateDailyBudget(budgetData: {
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
    try {
        const budgetRef = ref(db, `dailyBudgets/${budgetData.id}`);
        await update(budgetRef, {
            name: budgetData.name,
            category: budgetData.category,
            limit: budgetData.limit,
            daysOfWeek: budgetData.daysOfWeek,
            description: budgetData.description || null,
            items: budgetData.items,
            autoCreate: budgetData.autoCreate,
            accountId: budgetData.accountId || null
        });
        console.log(`Presupuesto diario actualizado: ${budgetData.id}`);
        return { success: true };
    } catch (e) {
        console.error("Error al actualizar el presupuesto diario: ", e);
        const errorMessage = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, error: errorMessage };
    }
}
