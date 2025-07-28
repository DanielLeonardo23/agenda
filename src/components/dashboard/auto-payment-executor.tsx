"use client";

import { useEffect } from "react";
import { 
  detectPendingRecurringPaymentsAction, 
  detectPendingDailyBudgetsAction,
  migrateRecurringPaymentsAction,
  cleanupOldPendingPaymentsAction
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export function AutoPaymentExecutor() {
  const { toast } = useToast();

  useEffect(() => {
    const initializeAutoPayments = async () => {
      try {
        // Ejecutar migración una vez al cargar la aplicación
        const migrationResult = await migrateRecurringPaymentsAction();
        if (migrationResult.success && migrationResult.migrated && migrationResult.migrated > 0) {
          console.log(`Migración completada: ${migrationResult.migrated} pagos recurrentes actualizados`);
        }

        // Limpiar pagos pendientes antiguos
        const cleanupResult = await cleanupOldPendingPaymentsAction();
        if (cleanupResult.success && cleanupResult.deletedCount && cleanupResult.deletedCount > 0) {
          console.log(`Limpieza completada: ${cleanupResult.deletedCount} pagos pendientes limpiados`);
        }

        // Detectar pagos recurrentes pendientes
        const recurringResult = await detectPendingRecurringPaymentsAction();
        if (recurringResult.success) {
          if (recurringResult.pendingPayments && recurringResult.pendingPayments > 0) {
            toast({
              title: "Pagos Pendientes Detectados",
              description: `${recurringResult.pendingPayments} pagos recurrentes están pendientes de aprobación.`,
            });
          }
          
          if (recurringResult.executedPayments && recurringResult.executedPayments > 0) {
            toast({
              title: "Pagos Automáticos Ejecutados",
              description: `${recurringResult.executedPayments} pagos recurrentes se ejecutaron automáticamente.`,
            });
          }
        }

        // Detectar presupuestos diarios pendientes
        const dailyResult = await detectPendingDailyBudgetsAction();
        if (dailyResult.success && dailyResult.pendingBudgets && dailyResult.pendingBudgets > 0) {
          toast({
            title: "Presupuestos Diarios Pendientes",
            description: `${dailyResult.pendingBudgets} presupuestos diarios están pendientes de aprobación.`,
          });
        }
      } catch (error) {
        console.error("Error al inicializar pagos automáticos:", error);
      }
    };

    // Ejecutar una vez al cargar la aplicación
    initializeAutoPayments();
  }, [toast]);

  // Este componente no renderiza nada visible
  return null;
} 