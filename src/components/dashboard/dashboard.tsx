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

export function Dashboard() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getFinancialData();
        setFinancialData(data);
      } catch (error) {
        console.error("Error fetching financial data:", error);
        // Optionally set some error state to show in the UI
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !financialData) {
    return (
      <div className="grid gap-6 md:gap-8 grid-cols-1 xl:grid-cols-3">
        <div className="xl:col-span-2 grid gap-6 md:gap-8">
          {/* Skeleton for OverviewCards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          {/* Skeleton for ExpenseChart */}
          <Skeleton className="h-[422px]" />
        </div>
        <div className="xl:col-span-1 grid gap-6 md:gap-8">
          {/* Skeleton for TransactionsCalendar */}
          <Skeleton className="h-[375px]" />
          {/* Skeleton for UpcomingPayments */}
          <Skeleton className="h-[200px]" />
          {/* Skeleton for AiSuggestions */}
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    );
  }

  return (
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
  );
}
