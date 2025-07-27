"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft, Calculator } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { FinancialData, RecurringPayment, DailyBudget } from "@/lib/types";

interface BalanceCalculatorProps {
  data: FinancialData;
}

export function BalanceCalculator({ data }: BalanceCalculatorProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isOpen, setIsOpen] = useState(false);

  const calculateBalanceForDate = (date: Date) => {
    const currentBalance = data.currentBalance;
    const selectedDay = date.getDate();
    const selectedMonth = date.getMonth();
    const selectedYear = date.getFullYear();
    
    // Obtener el día actual
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Solo calcular si la fecha seleccionada es futura o igual a hoy
    if (date < today) {
      return {
        currentBalance,
        fixedExpenses: 0,
        dailyBudgetExpenses: 0,
        totalExpenses: 0,
        availableBalance: currentBalance
      };
    }
    
    // Calcular gastos fijos (pagos recurrentes)
    const fixedExpenses = data.recurringPayments.reduce((total, payment) => {
      // Si estamos en el mismo mes
      if (selectedMonth === currentMonth && selectedYear === currentYear) {
        // Solo incluir si el pago vence entre hoy y la fecha seleccionada
        if (payment.dayOfMonth >= currentDay && payment.dayOfMonth <= selectedDay) {
          return total + payment.amount;
        }
      } else {
        // Si estamos en un mes diferente, incluir todos los pagos del mes actual
        // desde hoy hasta el final del mes, más todos los pagos del mes seleccionado
        let monthTotal = 0;
        
        // Pagos del mes actual desde hoy hasta el final
        if (payment.dayOfMonth >= currentDay) {
          monthTotal += payment.amount;
        }
        
        // Pagos del mes seleccionado hasta la fecha
        if (payment.dayOfMonth <= selectedDay) {
          monthTotal += payment.amount;
        }
        
        return total + monthTotal;
      }
      return total;
    }, 0);

    // Calcular gastos de presupuestos diarios
    const dailyBudgetExpenses = data.dailyBudgets.reduce((total, budget) => {
      if (budget.autoCreate) {
        let budgetTotal = 0;
        
        // Si estamos en el mismo mes
        if (selectedMonth === currentMonth && selectedYear === currentYear) {
          // Calcular solo los días desde hoy hasta la fecha seleccionada
          for (let day = currentDay; day <= selectedDay; day++) {
            const currentDate = new Date(selectedYear, selectedMonth, day);
            const dayOfWeek = currentDate.getDay();
            
            // Si este día está en los días programados del presupuesto
            if (budget.daysOfWeek.includes(dayOfWeek)) {
              budgetTotal += budget.items.reduce((sum, item) => sum + item.amount, 0);
            }
          }
        } else {
          // Si estamos en un mes diferente, calcular todos los días del mes actual
          // desde hoy hasta el final, más todos los días del mes seleccionado
          
          // Días del mes actual desde hoy hasta el final
          const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          for (let day = currentDay; day <= daysInCurrentMonth; day++) {
            const currentDate = new Date(currentYear, currentMonth, day);
            const dayOfWeek = currentDate.getDay();
            
            if (budget.daysOfWeek.includes(dayOfWeek)) {
              budgetTotal += budget.items.reduce((sum, item) => sum + item.amount, 0);
            }
          }
          
          // Días del mes seleccionado desde el 1 hasta la fecha
          for (let day = 1; day <= selectedDay; day++) {
            const currentDate = new Date(selectedYear, selectedMonth, day);
            const dayOfWeek = currentDate.getDay();
            
            if (budget.daysOfWeek.includes(dayOfWeek)) {
              budgetTotal += budget.items.reduce((sum, item) => sum + item.amount, 0);
            }
          }
        }
        return total + budgetTotal;
      }
      return total;
    }, 0);

    const totalExpenses = fixedExpenses + dailyBudgetExpenses;
    const availableBalance = currentBalance - totalExpenses;

    return {
      currentBalance,
      fixedExpenses,
      dailyBudgetExpenses,
      totalExpenses,
      availableBalance
    };
  };

  const balance = selectedDate ? calculateBalanceForDate(selectedDate) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora de Saldo
        </CardTitle>
        <CardDescription>
          Calcula tu saldo disponible considerando solo gastos futuros desde hoy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: es })
                ) : (
                  <span>Selecciona una fecha</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {balance && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Saldo Actual</p>
                <p className="font-medium text-green-600">
                  S/ {balance.currentBalance.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Saldo Disponible</p>
                <p className={cn(
                  "font-medium",
                  balance.availableBalance >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  S/ {balance.availableBalance.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Gastos futuros desde hoy hasta {selectedDate ? format(selectedDate, "dd/MM/yyyy") : ""}:
              </p>
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>
                    Gastos Fijos (
                    {selectedDate && new Date().getMonth() === selectedDate.getMonth() 
                      ? `días ${new Date().getDate()}-${selectedDate.getDate()}`
                      : `mes actual + mes ${selectedDate ? format(selectedDate, "MMMM yyyy") : ""} hasta día ${selectedDate?.getDate()}`
                    }):
                  </span>
                  <span className="text-red-600">-S/ {balance.fixedExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Presupuestos Diarios (
                    {selectedDate && new Date().getMonth() === selectedDate.getMonth() 
                      ? `días ${new Date().getDate()}-${selectedDate.getDate()}`
                      : `mes actual + mes ${selectedDate ? format(selectedDate, "MMMM yyyy") : ""} hasta día ${selectedDate?.getDate()}`
                    }):
                  </span>
                  <span className="text-red-600">-S/ {balance.dailyBudgetExpenses.toFixed(2)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-medium">
                  <span>Total Gastos Futuros:</span>
                  <span className="text-red-600">-S/ {balance.totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {balance.availableBalance < 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-700 text-sm font-medium">
                  ⚠️ Saldo insuficiente para esta fecha
                </p>
                <p className="text-red-600 text-xs">
                  Necesitas S/ {Math.abs(balance.availableBalance).toFixed(2)} adicionales
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 