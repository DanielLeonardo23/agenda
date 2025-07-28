import { getDatabase, ref, push, set, update, onValue, off, remove, get } from 'firebase/database';
import type { FinancialData, Transaction, AddTransactionData, RecurringPayment, Budget, AddRecurringPaymentData, DailyBudget, AddDailyBudgetData, Account, AddAccountData, PendingAutomaticPayment } from './types';
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

    const pendingAutomaticPayments: PendingAutomaticPayment[] = [];
    if (dbData.pendingAutomaticPayments) {
        const data = dbData.pendingAutomaticPayments;
        for (const key in data) {
            pendingAutomaticPayments.push({
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
      pendingAutomaticPayments,
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
        
        // Validar que el amount sea un número válido
        const amount = Number(transactionData.amount);
        if (isNaN(amount) || amount <= 0) {
            console.error("Amount inválido en transacción:", transactionData.amount);
            return { success: false, error: "Monto inválido" };
        }
        
        // Validar que la fecha sea válida antes de convertir a ISO string
        let dateToSave: string;
        try {
            if (isNaN(transactionData.date.getTime())) {
                throw new Error("Fecha inválida");
            }
            dateToSave = transactionData.date.toISOString();
        } catch (error) {
            console.error("Error al procesar fecha de transacción:", error);
            // Usar la fecha actual como fallback
            dateToSave = new Date().toISOString();
        }
        
        await set(newTransactionRef, {
            ...transactionData,
            amount: amount, // Usar el amount validado
            date: dateToSave,
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
                    newBalance += amount; // Usar el amount validado
                } else if (transactionData.type === 'expense') {
                    newBalance -= amount; // Usar el amount validado
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
      daysOfWeek: paymentData.daysOfWeek || null,
      requiresApproval: paymentData.requiresApproval !== false,
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

// Función para detectar pagos recurrentes pendientes (en lugar de ejecutarlos)
export async function detectPendingRecurringPayments() {
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
        const currentDayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, etc.
        
        let pendingPayments = 0;
        let executedPayments = 0;
        
        for (const payment of recurringPayments) {
            // Verificar si debe ejecutarse hoy
            const shouldExecute = 
                // Verificar día del mes (si está configurado)
                (payment.dayOfMonth === currentDay) &&
                // Verificar días de la semana (si está configurado)
                (!payment.daysOfWeek || payment.daysOfWeek.includes(currentDayOfWeek));
            
            if (shouldExecute) {
                // Verificar si ya se ejecutó hoy
                const todayStr = today.toISOString().split('T')[0];
                const existingTransactions = await get(ref(db, 'transactions'));
                const transactions = existingTransactions.val() || {};
                
                const alreadyExecuted = Object.values(transactions).some((t: any) => 
                    t.category === payment.category && 
                    t.amount === payment.amount &&
                    t.date && t.date.startsWith(todayStr) &&
                    t.description && t.description.includes(`Pago automático: ${payment.name}`)
                );
                
                if (!alreadyExecuted) {
                    // Si requiere aprobación, crear pago pendiente
                    if (payment.requiresApproval !== false) {
                        // Verificar si ya existe un pago pendiente para hoy
                        const existingPendingPayments = await get(ref(db, 'pendingAutomaticPayments'));
                        const pendingPaymentsData = existingPendingPayments.val() || {};
                        
                        const alreadyPending = Object.values(pendingPaymentsData).some((p: any) => 
                            p.sourceId === payment.id && 
                            p.scheduledDate && p.scheduledDate.startsWith(todayStr) &&
                            p.status === 'pending'
                        );
                        
                        if (!alreadyPending) {
                            // Crear pago pendiente
                            const pendingPaymentData: PendingAutomaticPayment = {
                                id: '', // Se generará automáticamente
                                type: 'recurring',
                                name: payment.name,
                                amount: payment.amount,
                                category: payment.category,
                                description: `Pago automático: ${payment.name}`,
                                scheduledDate: today.toISOString(),
                                accountId: bcpAccount.id,
                                sourceId: payment.id,
                                createdAt: new Date().toISOString(),
                                status: 'pending'
                            };
                            
                            const pendingPaymentsRef = ref(db, 'pendingAutomaticPayments');
                            const newPendingPaymentRef = push(pendingPaymentsRef);
                            await set(newPendingPaymentRef, pendingPaymentData);
                            
                            pendingPayments++;
                            console.log(`Pago recurrente pendiente creado: ${payment.name} - S/ ${payment.amount}`);
                        }
                    } else {
                        // Si no requiere aprobación, ejecutar directamente
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
                            console.log(`Pago recurrente ejecutado automáticamente: ${payment.name} - S/ ${payment.amount}`);
                        }
                    }
                }
            }
        }
        
        return { success: true, pendingPayments, executedPayments };
    } catch (e) {
        console.error("Error al detectar pagos recurrentes pendientes: ", e);
        return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
}

// Función para detectar presupuestos diarios pendientes (en lugar de ejecutarlos)
export async function detectPendingDailyBudgets() {
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
        
        let pendingBudgets = 0;
        
        for (const budget of dailyBudgets) {
            if (budget.autoCreate && budget.daysOfWeek.includes(currentDayOfWeek)) {
                // Verificar si ya existe un presupuesto pendiente para hoy
                const todayStr = today.toISOString().split('T')[0];
                const existingPendingPayments = await get(ref(db, 'pendingAutomaticPayments'));
                const pendingPaymentsData = existingPendingPayments.val() || {};
                
                const alreadyPending = Object.values(pendingPaymentsData).some((p: any) => 
                    p.sourceId === budget.id && 
                    p.scheduledDate && p.scheduledDate.startsWith(todayStr) &&
                    p.status === 'pending'
                );
                
                // Verificar si ya se ejecutó hoy
                const existingTransactions = await get(ref(db, 'transactions'));
                const transactions = existingTransactions.val() || {};
                
                const alreadyExecuted = Object.values(transactions).some((t: any) => 
                    t.category === budget.category && 
                    t.date && t.date.startsWith(todayStr) &&
                    t.description && t.description.includes(budget.name)
                );
                
                if (!alreadyPending && !alreadyExecuted) {
                    // Crear pagos pendientes para cada item del presupuesto diario
                    for (const item of budget.items) {
                        const pendingPaymentData: PendingAutomaticPayment = {
                            id: '', // Se generará automáticamente
                            type: 'daily-budget',
                            name: `${budget.name}: ${item.name}`,
                            amount: item.amount,
                            category: item.category,
                            description: `${budget.name}: ${item.name}`,
                            scheduledDate: today.toISOString(),
                            accountId: bcpAccount.id,
                            sourceId: budget.id,
                            createdAt: new Date().toISOString(),
                            status: 'pending'
                        };
                        
                        const pendingPaymentsRef = ref(db, 'pendingAutomaticPayments');
                        const newPendingPaymentRef = push(pendingPaymentsRef);
                        await set(newPendingPaymentRef, pendingPaymentData);
                        
                        pendingBudgets++;
                        console.log(`Presupuesto diario pendiente creado: ${budget.name} - ${item.name} - S/ ${item.amount}`);
                    }
                }
            }
        }
        
        return { success: true, pendingBudgets };
    } catch (e) {
        console.error("Error al detectar presupuestos diarios pendientes: ", e);
        return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
}

// Función para aprobar un pago pendiente
export async function approvePendingPayment(pendingPaymentId: string) {
    try {
        const pendingPaymentRef = ref(db, `pendingAutomaticPayments/${pendingPaymentId}`);
        const pendingPaymentSnapshot = await get(pendingPaymentRef);
        
        if (!pendingPaymentSnapshot.exists()) {
            return { success: false, error: "Pago pendiente no encontrado" };
        }
        
        const pendingPayment = pendingPaymentSnapshot.val();
        console.log("Datos del pago pendiente recuperados:", pendingPayment);
        
        // Verificar si los datos están anidados de manera extraña
        let paymentData = pendingPayment;
        let isNested = false;
        
        // Si los datos están anidados, extraerlos
        if (pendingPayment && typeof pendingPayment === 'object') {
            // Buscar la primera propiedad que contenga los datos del pago
            const keys = Object.keys(pendingPayment);
            for (const key of keys) {
                if (key !== 'status' && typeof pendingPayment[key] === 'object') {
                    paymentData = pendingPayment[key];
                    isNested = true;
                    console.log("Datos extraídos de estructura anidada:", paymentData);
                    break;
                }
            }
        }
        
        // Validar que el pago pendiente tenga todos los datos necesarios
        if (!paymentData.amount || !paymentData.category || !paymentData.description) {
            console.error("Pago pendiente con datos incompletos:", paymentData);
            return { success: false, error: "Datos del pago pendiente incompletos" };
        }
        
        // Validar que el amount sea un número válido
        const amount = Number(paymentData.amount);
        if (isNaN(amount) || amount <= 0) {
            console.error("Amount inválido en pago pendiente:", paymentData.amount);
            return { success: false, error: "Monto inválido" };
        }
        
        // Actualizar estado a aprobado - manejar estructura anidada
        if (isNested) {
            // Si está anidado, actualizar el estado en el nivel correcto
            await update(pendingPaymentRef, { status: 'approved' });
        } else {
            // Si no está anidado, actualizar directamente
            await update(pendingPaymentRef, { status: 'approved' });
        }
        
        // Crear la transacción real con validación de fecha
        let transactionDate: Date;
        try {
            if (paymentData.scheduledDate) {
                transactionDate = new Date(paymentData.scheduledDate);
                // Verificar que la fecha sea válida
                if (isNaN(transactionDate.getTime())) {
                    throw new Error("Fecha inválida");
                }
            } else {
                throw new Error("No hay fecha programada");
            }
        } catch (error) {
            console.error("Error al parsear fecha del pago pendiente:", error);
            // Usar la fecha actual como fallback
            transactionDate = new Date();
        }
        
        const transactionData: AddTransactionData = {
            type: 'expense',
            amount: amount, // Usar el amount validado
            category: paymentData.category,
            date: transactionDate,
            description: paymentData.description,
            accountId: paymentData.accountId
        };
        
        const result = await addTransaction(transactionData);
        if (result.success) {
            console.log(`Pago aprobado y ejecutado: ${paymentData.name} - S/ ${amount}`);
            return { success: true, transactionId: result.id };
        } else {
            // Revertir el estado si falla la transacción
            if (isNested) {
                await update(pendingPaymentRef, { status: 'pending' });
            } else {
                await update(pendingPaymentRef, { status: 'pending' });
            }
            return { success: false, error: result.error };
        }
    } catch (e) {
        console.error("Error al aprobar pago pendiente: ", e);
        return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
}

// Función para rechazar un pago pendiente
export async function rejectPendingPayment(pendingPaymentId: string) {
    try {
        const pendingPaymentRef = ref(db, `pendingAutomaticPayments/${pendingPaymentId}`);
        const pendingPaymentSnapshot = await get(pendingPaymentRef);
        
        if (!pendingPaymentSnapshot.exists()) {
            return { success: false, error: "Pago pendiente no encontrado" };
        }
        
        const pendingPayment = pendingPaymentSnapshot.val();
        
        // Verificar si los datos están anidados
        let isNested = false;
        if (pendingPayment && typeof pendingPayment === 'object') {
            const keys = Object.keys(pendingPayment);
            for (const key of keys) {
                if (key !== 'status' && typeof pendingPayment[key] === 'object') {
                    isNested = true;
                    break;
                }
            }
        }
        
        // Actualizar estado a rechazado
        await update(pendingPaymentRef, { status: 'rejected' });
        
        console.log(`Pago rechazado: ${pendingPaymentId}`);
        return { success: true };
    } catch (e) {
        console.error("Error al rechazar pago pendiente: ", e);
        return { success: false, error: e instanceof Error ? e.message : 'Error desconocido' };
    }
}

// Función para eliminar pagos pendientes antiguos (más de 7 días)
export async function cleanupOldPendingPayments() {
    try {
        const pendingPaymentsRef = ref(db, 'pendingAutomaticPayments');
        const snapshot = await get(pendingPaymentsRef);
        const pendingPayments = snapshot.val() || {};
        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        let deletedCount = 0;
        
        for (const [key, payment] of Object.entries(pendingPayments)) {
            const paymentData = payment as any;
            const createdAt = new Date(paymentData.createdAt);
            
            if (createdAt < sevenDaysAgo) {
                await remove(ref(db, `pendingAutomaticPayments/${key}`));
                deletedCount++;
            }
        }
        
        console.log(`Se eliminaron ${deletedCount} pagos pendientes antiguos`);
        return { success: true, deletedCount };
    } catch (e) {
        console.error("Error al limpiar pagos pendientes antiguos: ", e);
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
    daysOfWeek?: number[];
    description?: string;
    requiresApproval?: boolean;
}) {
    try {
        const paymentRef = ref(db, `recurringPayments/${paymentData.id}`);
        await update(paymentRef, {
            name: paymentData.name,
            amount: paymentData.amount,
            category: paymentData.category,
            dayOfMonth: paymentData.dayOfMonth,
            daysOfWeek: paymentData.daysOfWeek || null,
            description: paymentData.description || null,
            requiresApproval: paymentData.requiresApproval
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
