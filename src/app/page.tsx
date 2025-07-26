import { getFinancialData } from "@/lib/data";
import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";
import { SidebarInset } from "@/components/ui/sidebar";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ExpenseChart } from "@/components/dashboard/expense-chart";
import { TransactionsCalendar } from "@/components/dashboard/transactions-calendar";
import { UpcomingPayments } from "@/components/dashboard/upcoming-payments";
import { AiSuggestions } from "@/components/dashboard/ai-suggestions";

export default function DashboardPage() {
  const financialData = getFinancialData();

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col w-full">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
        </main>
      </div>
    </div>
  );
}
