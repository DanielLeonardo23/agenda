"use client";

import { useEffect } from "react";
import { executeRecurringPaymentsAction, executeDailyBudgetsAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export function AutoPaymentExecutor() {
  const { toast } = useToast();

  useEffect(() => {
    const executeAutoPayments = async () => {
      try {
        // Ejecutar pagos recurrentes
        const recurringResult = await executeRecurringPaymentsAction();
        if (recurringResult.success && recurringResult.executedPayments && recurringResult.executedPayments > 0) {
          toast({
            title: "Pagos Automáticos Ejecutados",
            description: `${recurringResult.executedPayments} pagos recurrentes se ejecutaron automáticamente desde la cuenta BCP.`,
          });
        }

        // Ejecutar presupuestos diarios
        const dailyResult = await executeDailyBudgetsAction();
        if (dailyResult.success && dailyResult.executedBudgets && dailyResult.executedBudgets > 0) {
          toast({
            title: "Presupuestos Diarios Ejecutados",
            description: `${dailyResult.executedBudgets} presupuestos diarios se ejecutaron automáticamente desde la cuenta BCP.`,
          });
        }
      } catch (error) {
        console.error("Error al ejecutar pagos automáticos:", error);
      }
    };

    // Ejecutar una vez al cargar la aplicación
    executeAutoPayments();
  }, [toast]);

  // Este componente no renderiza nada visible
  return null;
} 