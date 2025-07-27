
"use client";

import { useEffect, useState } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData } from "@/lib/types";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { TransactionsCalendar } from "@/components/dashboard/transactions-calendar";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { BalanceCalculator } from "@/components/dashboard/balance-calculator";
import { AiSuggestions } from "@/components/dashboard/ai-suggestions";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialBalanceDialog } from "./initial-balance-dialog";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function Dashboard() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    try {
      // listenToFinancialData ahora devuelve una función de limpieza.
      const unsubscribe = listenToFinancialData((data) => {
        setFinancialData(data);
        setLoading(false);
        setError(null);
      });

      // Se llama a la función de limpieza cuando el componente se desmonta.
      return () => unsubscribe();
    } catch (err) {
        console.error("Error al suscribirse a los datos financieros:", err);
        setError("No se pudieron cargar los datos. Por favor, revisa la conexión y la configuración.");
        setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 grid gap-6 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-[422px]" />
          </div>
          <div className="lg:col-span-1 grid gap-6 md:gap-8">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[375px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
      return (
          <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
              <p><strong>Error:</strong> {error}</p>
          </div>
      )
  }

  if (!financialData) {
      return <div className="text-center">No se encontraron datos. Comienza agregando una transacción.</div>
  }

  return (
    <div className="space-y-6">
      {/* Botón de regresar */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Regresar
        </Button>
      </div>

      {financialData.initialBalance === 0 && financialData.transactions.length === 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
            <p className="font-bold">¡Bienvenido a FinTrack!</p>
            <p>Parece que es tu primera vez aquí. Comienza estableciendo tu saldo inicial para obtener una visión precisa de tus finanzas.</p>
             <InitialBalanceDialog onBalanceSet={() => { /* No necesita hacer nada aquí gracias a las actualizaciones en tiempo real */ }}>
                <Button className="mt-2" variant="outline" size="sm">Establecer Saldo Inicial</Button>
            </InitialBalanceDialog>
        </div>
      )}

      <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Columna izquierda - Tarjetas de resumen y gráfico */}
        <div className="lg:col-span-2 grid gap-6 md:gap-8">
          <OverviewCards data={financialData} />
          <ExpenseChart transactions={financialData.transactions} />
        </div>

        {/* Columna derecha - Calculadora y calendario */}
        <div className="lg:col-span-1 grid gap-6 md:gap-8">
          <BalanceCalculator data={financialData} />
          <TransactionsCalendar 
            transactions={financialData.transactions} 
            recurringPayments={financialData.recurringPayments}
            dailyBudgets={financialData.dailyBudgets}
          />
        </div>
      </div>

      {/* Sección central - Pagos próximos */}
      <div className="grid gap-6 md:gap-8 grid-cols-1 xl:grid-cols-2">
        <UpcomingPayments recurringPayments={financialData.recurringPayments} />
        <AiSuggestions data={financialData} />
      </div>
    </div>
  );
}
