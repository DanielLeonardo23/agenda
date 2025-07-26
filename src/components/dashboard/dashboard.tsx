
"use client";

import { useEffect, useState } from "react";
import { getFinancialData } from "@/lib/data";
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

  // Function to refetch data, can be passed to child components
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getFinancialData();
      setFinancialData(data);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
      {financialData.initialBalance === 0 && (
        <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
            <p className="font-bold">¡Bienvenido a FinTrack!</p>
            <p>Parece que es tu primera vez aquí. Comienza estableciendo tu saldo inicial para obtener una visión precisa de tus finanzas.</p>
             <InitialBalanceDialog onBalanceSet={fetchData}>
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
