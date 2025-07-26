import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

// TODO: Implement real budget management
function Budgets() {
    const budgets = [
        { category: "Comida", spent: 450, limit: 800 },
        { category: "Transporte", spent: 120, limit: 200 },
        { category: "Entretenimiento", spent: 250, limit: 300 },
        { category: "Servicios", spent: 350, limit: 350 },
    ];

    const formatCurrency = (amount: number) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(amount);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Presupuestos</CardTitle>
                        <CardDescription>Controla tus gastos creando presupuestos por categoría.</CardDescription>
                    </div>
                    <Button>
                        <PlusCircle className="mr-2"/>
                        Crear Presupuesto
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {budgets.map(budget => (
                    <div key={budget.category}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{budget.category}</span>
                            <span className="text-sm text-muted-foreground">
                                {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                            </span>
                        </div>
                        <Progress value={(budget.spent / budget.limit) * 100} />
                         <p className={`text-xs mt-1 ${budget.spent > budget.limit ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {budget.spent > budget.limit 
                                ? `Te has excedido en ${formatCurrency(budget.spent - budget.limit)}`
                                : `Te quedan ${formatCurrency(budget.limit - budget.spent)}`
                            }
                        </p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function BudgetsPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col w-full">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Budgets />
        </main>
      </div>
    </div>
  );
}
