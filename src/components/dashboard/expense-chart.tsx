"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Transaction } from "@/lib/types";

interface ExpenseChartProps {
  transactions: Transaction[];
}

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const expenseData = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      if (!acc[t.category]) {
        acc[t.category] = 0;
      }
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expenseData).map(([name, total]) => ({
    name,
    total,
  }));

  const formatCurrency = (value: number) => `S/${value.toFixed(2)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Overview</CardTitle>
        <CardDescription>
          A breakdown of your expenses by category for this month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `S/${value}`}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.3)' }}
                contentStyle={{ 
                    background: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: 'var(--radius)'
                }}
                formatter={(value: number) => [formatCurrency(value), 'Total']}
            />
            <Bar
              dataKey="total"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
