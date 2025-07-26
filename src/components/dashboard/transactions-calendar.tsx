"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Transaction } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function TransactionsCalendar({ transactions }: { transactions: Transaction[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

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

  const modifiers = {
    income: (day: Date) => transactionsByDay[day.toDateString()]?.income > 0,
    expense: (day: Date) => transactionsByDay[day.toDateString()]?.expense > 0,
  }

  const modifiersStyles = {
    income: {
      position: 'relative',
    },
    expense: {
      position: 'relative',
    },
  }

  const DayWithDots = ({ date }: { date: Date }) => {
    const dayData = transactionsByDay[date.toDateString()];
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {date.getDate()}
        <div className="absolute bottom-1 flex space-x-0.5">
          {dayData?.income > 0 && <div className="h-1 w-1 rounded-full bg-green-500" />}
          {dayData?.expense > 0 && <div className="h-1 w-1 rounded-full bg-red-500" />}
        </div>
      </div>
    );
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario de Transacciones</CardTitle>
        <CardDescription>Visualiza tu flujo financiero diario.</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md"
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          components={{
            DayContent: DayWithDots
          }}
        />
      </CardContent>
    </Card>
  )
}
