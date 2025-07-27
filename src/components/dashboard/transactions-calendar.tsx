"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, Calendar as CalendarIcon } from "lucide-react"
import type { Transaction, RecurringPayment, DailyBudget } from "@/lib/types"

interface TransactionsCalendarProps {
  transactions: Transaction[]
  recurringPayments: RecurringPayment[]
  dailyBudgets: DailyBudget[]
}

export function TransactionsCalendar({ 
  transactions, 
  recurringPayments, 
  dailyBudgets 
}: TransactionsCalendarProps) {
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  
  // Set initial date on client-side only to avoid hydration mismatch
  React.useEffect(() => {
    setDate(new Date());
  }, []);

  const transactionsByDay = React.useMemo(() => {
    return transactions.reduce((acc, transaction) => {
      const day = new Date(transaction.date).toDateString()
      if (!acc[day]) {
        acc[day] = { income: 0, expense: 0 }
      }
      if (transaction.type === 'income') {
        acc[day].income += 1
      } else {
        acc[day].expense += 1
      }
      return acc
    }, {} as Record<string, { income: number; expense: number }>)
  }, [transactions])

  // Calcular días con pagos próximos
  const upcomingPaymentsByDay = React.useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const payments: Record<string, RecurringPayment[]> = {};
    
    recurringPayments.forEach(payment => {
      // Crear fecha para el día del mes en el mes actual
      let paymentDate = new Date(currentYear, currentMonth, payment.dayOfMonth);
      
      // Si la fecha ya pasó este mes, crear para el próximo mes
      if (paymentDate < currentDate) {
        paymentDate = new Date(currentYear, currentMonth + 1, payment.dayOfMonth);
      }
      
      // Solo incluir si la fecha es futura o igual a hoy
      if (paymentDate >= currentDate) {
        const dayKey = paymentDate.toDateString();
        if (!payments[dayKey]) {
          payments[dayKey] = [];
        }
        payments[dayKey].push(payment);
      }
    });
    
    return payments;
  }, [recurringPayments]);

  // Calcular días con presupuestos diarios
  const dailyBudgetsByDay = React.useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const budgets: Record<string, DailyBudget[]> = {};
    
    dailyBudgets.forEach(budget => {
      if (budget.autoCreate) {
        // Calcular todos los días del mes actual que coinciden con los días de la semana
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(currentYear, currentMonth, day);
          const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes, etc.
          
          // Solo incluir días futuros o igual a hoy
          if (budget.daysOfWeek.includes(dayOfWeek) && date >= currentDate) {
            const dayKey = date.toDateString();
            if (!budgets[dayKey]) {
              budgets[dayKey] = [];
            }
            budgets[dayKey].push(budget);
          }
        }
      }
    });
    
    return budgets;
  }, [dailyBudgets]);

  const modifiers = {
    income: (day: Date) => transactionsByDay[day.toDateString()]?.income > 0,
    expense: (day: Date) => transactionsByDay[day.toDateString()]?.expense > 0,
    upcomingPayment: (day: Date) => upcomingPaymentsByDay[day.toDateString()]?.length > 0,
    dailyBudget: (day: Date) => dailyBudgetsByDay[day.toDateString()]?.length > 0,
  }

  const modifiersStyles = {
    income: {
      position: 'relative' as const,
    },
    expense: {
      position: 'relative' as const,
    },
    upcomingPayment: {
      position: 'relative' as const,
    },
    dailyBudget: {
      position: 'relative' as const,
    },
  }

  const DayWithIcons = ({ date }: { date: Date }) => {
    const dayData = transactionsByDay[date.toDateString()];
    const upcomingPayments = upcomingPaymentsByDay[date.toDateString()] || [];
    const dailyBudgets = dailyBudgetsByDay[date.toDateString()] || [];
    
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {date.getDate()}
        
        {/* Iconos en la parte inferior */}
        <div className="absolute bottom-1 flex space-x-0.5">
          {/* Transacciones existentes */}
          {dayData?.income > 0 && <div className="h-1 w-1 rounded-full bg-green-500" />}
          {dayData?.expense > 0 && <div className="h-1 w-1 rounded-full bg-red-500" />}
          
          {/* Pagos próximos */}
          {upcomingPayments.length > 0 && (
            <Clock className="h-2 w-2 text-blue-500" />
          )}
          
          {/* Presupuestos diarios */}
          {dailyBudgets.length > 0 && (
            <CalendarIcon className="h-2 w-2 text-purple-500" />
          )}
        </div>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario de Transacciones</CardTitle>
        <CardDescription>Visualiza tu flujo financiero diario.</CardDescription>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-green-500" />
            <span>Ingresos</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1 w-1 rounded-full bg-red-500" />
            <span>Gastos</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-2 w-2 text-blue-500" />
            <span>Pagos Próximos</span>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-2 w-2 text-purple-500" />
            <span>Presupuestos Diarios</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        {date && <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          components={{
            DayContent: DayWithIcons
          }}
          initialFocus
        />}
      </CardContent>
    </Card>
  )
}
