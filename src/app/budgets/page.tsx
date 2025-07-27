"use client";

import { useEffect, useState } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData, Budget, Transaction, DailyBudget } from "@/lib/types";
import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, AlertTriangle, CheckCircle, Calendar, Trash2 } from "lucide-react";
import { DailyBudgetForm } from "@/components/settings/daily-budget-form";
import { deleteDailyBudgetAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function Budgets({ data }: { data: FinancialData }) {
    const { budgets, transactions } = data;

    const formatCurrency = (amount: number) => new Intl.NumberFormat("es-PE", { 
        style: "currency", 
        currency: "PEN" 
    }).format(amount);

    // Calcular gastos por categoría
    const expensesByCategory = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
            const category = transaction.category.toLowerCase();
            acc[category] = (acc[category] || 0) + transaction.amount;
            return acc;
        }, {} as Record<string, number>);

    // Combinar presupuestos con gastos reales
    const budgetStatus = budgets.map(budget => {
        const spent = expensesByCategory[budget.category.toLowerCase()] || 0;
        const percentage = (spent / budget.limit) * 100;
        const isOverBudget = spent > budget.limit;
        
        return {
            ...budget,
            spent,
            percentage,
            isOverBudget,
            remaining: budget.limit - spent
        };
    });

    if (budgets.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <PlusCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay presupuestos</h3>
                        <p className="text-gray-500">Crea tu primer presupuesto para comenzar a controlar tus gastos por categoría.</p>
                        <Button className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Crear Presupuesto
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Presupuestos Mensuales</CardTitle>
                        <CardDescription>Controla tus gastos creando presupuestos por categoría.</CardDescription>
                    </div>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Crear Presupuesto
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {budgetStatus.map(budget => (
                    <div key={budget.id}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{budget.category}</span>
                                {budget.isOverBudget ? (
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                ) : budget.percentage > 80 ? (
                                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                ) : (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                            </span>
                        </div>
                        <Progress 
                            value={Math.min(budget.percentage, 100)} 
                            className={budget.isOverBudget ? "bg-red-100" : ""}
                        />
                        <p className={`text-xs mt-1 ${
                            budget.isOverBudget 
                                ? 'text-red-500' 
                                : budget.percentage > 80 
                                    ? 'text-yellow-600' 
                                    : 'text-muted-foreground'
                        }`}>
                            {budget.isOverBudget 
                                ? `Te has excedido en ${formatCurrency(Math.abs(budget.remaining))}`
                                : budget.percentage > 80
                                    ? `Cuidado: te quedan ${formatCurrency(budget.remaining)}`
                                    : `Te quedan ${formatCurrency(budget.remaining)}`
                            }
                        </p>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function DailyBudgets({ data }: { data: FinancialData }) {
    const { dailyBudgets, transactions } = data;
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const formatCurrency = (amount: number) => new Intl.NumberFormat("es-PE", { 
        style: "currency", 
        currency: "PEN" 
    }).format(amount);

    const DAYS_OF_WEEK = [
        { id: 0, name: "Domingo", short: "D" },
        { id: 1, name: "Lunes", short: "L" },
        { id: 2, name: "Martes", short: "M" },
        { id: 3, name: "Miércoles", short: "X" },
        { id: 4, name: "Jueves", short: "J" },
        { id: 5, name: "Viernes", short: "V" },
        { id: 6, name: "Sábado", short: "S" },
    ];

    const getDaysText = (days: number[]) => {
        const sortedDays = days.sort((a, b) => a - b);
        return sortedDays.map(dayId => 
            DAYS_OF_WEEK.find(day => day.id === dayId)?.short
        ).join(", ");
    };

    const handleDeleteBudget = async (budgetId: string) => {
        setDeletingId(budgetId);
        try {
            const result = await deleteDailyBudgetAction(budgetId);
            if (result.success) {
                toast({
                    title: "Presupuesto Eliminado",
                    description: "El presupuesto diario ha sido eliminado exitosamente.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error al Eliminar",
                    description: result.error || "No se pudo eliminar el presupuesto.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error Inesperado",
                description: "Ocurrió un error al eliminar el presupuesto.",
            });
        } finally {
            setDeletingId(null);
        }
    };

    if (dailyBudgets.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay presupuestos diarios</h3>
                        <p className="text-gray-500">Crea presupuestos diarios para controlar gastos específicos por día de la semana.</p>
                        <DailyBudgetForm>
                            <Button className="mt-4">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Crear Presupuesto Diario
                            </Button>
                        </DailyBudgetForm>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Presupuestos Diarios</CardTitle>
                        <CardDescription>Presupuestos que se aplican en días específicos de la semana.</CardDescription>
                    </div>
                    <DailyBudgetForm>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Crear Presupuesto Diario
                        </Button>
                    </DailyBudgetForm>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {dailyBudgets.map(budget => (
                    <div key={budget.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-medium text-gray-900">{budget.name}</h4>
                                <p className="text-sm text-gray-500">{budget.category}</p>
                                {budget.description && (
                                    <p className="text-sm text-gray-600 mt-1">{budget.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                    {getDaysText(budget.daysOfWeek)}
                                </Badge>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            disabled={deletingId === budget.id}
                                        >
                                            {deletingId === budget.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar presupuesto diario?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción no se puede deshacer. El presupuesto "{budget.name}" 
                                                será eliminado permanentemente.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteBudget(budget.id)}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Eliminar
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                                Límite diario: {formatCurrency(budget.limit)}
                            </span>
                            <span className="text-sm font-medium text-blue-600">
                                {budget.daysOfWeek.length} día{budget.daysOfWeek.length !== 1 ? 's' : ''} por semana
                            </span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function BudgetsPage() {
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        try {
            const unsubscribe = listenToFinancialData((data) => {
                setFinancialData(data);
                setLoading(false);
                setError(null);
            });

            return () => unsubscribe();
        } catch (err) {
            console.error("Error al suscribirse a los datos financieros:", err);
            setError("No se pudieron cargar los datos. Por favor, revisa la conexión y la configuración.");
            setLoading(false);
        }
    }, []);

    return (
        <div className="flex min-h-screen w-full bg-background">
            <AppSidebar />
            <div className="flex flex-col w-full">
                <DashboardHeader />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                            <Skeleton className="h-32" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
                            <p><strong>Error:</strong> {error}</p>
                        </div>
                    ) : financialData ? (
                        <Tabs defaultValue="monthly" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="monthly">Presupuestos Mensuales</TabsTrigger>
                                <TabsTrigger value="daily">Presupuestos Diarios</TabsTrigger>
                            </TabsList>
                            <TabsContent value="monthly">
                                <Budgets data={financialData} />
                            </TabsContent>
                            <TabsContent value="daily">
                                <DailyBudgets data={financialData} />
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="text-center">No se encontraron datos.</div>
                    )}
                </main>
            </div>
        </div>
    );
}
