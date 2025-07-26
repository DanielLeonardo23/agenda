
"use client";

import { useEffect, useState } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData } from "@/lib/types";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { TransactionsCalendar } from "@/components/dashboard/transactions-calendar";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { AiSuggestions } from "@/components/dashboard/ai-suggestions";
import { Skeleton } from "@/components/ui/skeleton";
import { InitialBalanceDialog } from "./initial-balance-dialog";
import { Button } from "../ui/button";

export function Dashboard() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // listenToFinancialData ahora devuelve una función de limpieza.
    const unsubscribe = listenToFinancialData((data) => {
      setFinancialData(data);
      setLoading(false);
    });

    // Se llama a la función de limpieza cuando el componente se desmonta.
    return () => unsubscribe();
  }, []);

  if (loading || !financialData) {
    return (
      <div className="grid gap-6 md:gap-8 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 grid gap-6 md:gap-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-[422px]" />
        </div>
        <div className="xl:col-span-1 grid gap-6 md:gap-8">
          <Skeleton className="h-[375px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  return (
    <>
      {financialData.initialBalance === 0 && financialData.transactions.length === 0 && (
        <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
            <p className="font-bold">¡Bienvenido a FinTrack!</p>
            <p>Parece que es tu primera vez aquí. Comienza estableciendo tu saldo inicial para obtener una visión precisa de tus finanzas.</p>
             <InitialBalanceDialog onBalanceSet={() => { /* No necesita hacer nada aquí gracias a las actualizaciones en tiempo real */ }}>
                <Button className="mt-2" variant="outline" size="sm">Establecer Saldo Inicial</Button>
            </InitialBalanceDialog>
        </div>
      )}
      <div className="grid gap-6 md:gap-8 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 grid gap-6 md:gap-8">
          <OverviewCards data={financialData} />
          <ExpenseChart transactions={financialData.transactions} />
        </div>
        <div className="xl:col-span-1 grid gap-6 md:gap-8">
          <TransactionsCalendar transactions={financialData.transactions} />
          <UpcomingPayments recurringPayments={financialData.recurringPayments} />
          <AiSuggestions data={financialData} />
        </div>
      </div>
    </>
  );
}

