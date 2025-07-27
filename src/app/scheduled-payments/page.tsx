"use client";

import { useEffect, useState } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData, RecurringPayment, DailyBudget } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, Edit, Trash2, Plus } from "lucide-react";
import { RecurringPaymentForm, DailyBudgetForm } from "@/components/settings";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { deleteRecurringPaymentAction, deleteDailyBudgetAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

export default function ScheduledPaymentsPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recurringPaymentDialogOpen, setRecurringPaymentDialogOpen] = useState(false);
  const [dailyBudgetDialogOpen, setDailyBudgetDialogOpen] = useState(false);
  const [editingRecurringPayment, setEditingRecurringPayment] = useState<RecurringPayment | null>(null);
  const [editingDailyBudget, setEditingDailyBudget] = useState<DailyBudget | null>(null);
  const { toast } = useToast();

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

  const handleDeleteRecurringPayment = async (paymentId: string) => {
    try {
      const result = await deleteRecurringPaymentAction(paymentId);
      if (result.success) {
        toast({
          title: "Pago Recurrente Eliminado",
          description: "El pago recurrente se eliminó correctamente.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el pago recurrente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el pago recurrente.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDailyBudget = async (budgetId: string) => {
    try {
      const result = await deleteDailyBudgetAction(budgetId);
      if (result.success) {
        toast({
          title: "Presupuesto Diario Eliminado",
          description: "El presupuesto diario se eliminó correctamente.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo eliminar el presupuesto diario.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el presupuesto diario.",
        variant: "destructive",
      });
    }
  };

  const getDayName = (dayOfMonth: number) => {
    const date = new Date(2024, 0, dayOfMonth);
    return date.toLocaleDateString('es-ES', { day: 'numeric' });
  };

  const getDaysOfWeekNames = (daysOfWeek: number[]) => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return daysOfWeek.map(day => dayNames[day]).join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
        <p><strong>Error:</strong> {error}</p>
      </div>
    );
  }

  if (!financialData) {
    return <div className="text-center">No se encontraron datos.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Pagos Programados</h1>
          <p className="text-lg text-muted-foreground">
            Gestiona tus pagos recurrentes y presupuestos diarios programados.
          </p>
        </div>

        <Tabs defaultValue="recurring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="recurring" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pagos Recurrentes
            </TabsTrigger>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Presupuestos Diarios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recurring" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Pagos Recurrentes</h2>
              <Button 
                onClick={() => {
                  setEditingRecurringPayment(null);
                  setRecurringPaymentDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Pago Recurrente
              </Button>
            </div>

            <div className="grid gap-6">
              {financialData.recurringPayments.length === 0 ? (
                <Card className="max-w-md mx-auto">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="h-16 w-16 text-muted-foreground mb-6" />
                    <h3 className="text-xl font-medium mb-3">No hay pagos recurrentes</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      Agrega pagos recurrentes para automatizar tus gastos mensuales.
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingRecurringPayment(null);
                        setRecurringPaymentDialogOpen(true);
                      }}
                    >
                      Agregar Primer Pago
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                financialData.recurringPayments.map((payment) => (
                  <Card key={payment.id} className="max-w-2xl mx-auto w-full">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-medium">{payment.name}</h3>
                            <Badge variant="secondary" className="text-sm">
                              Día {getDayName(payment.dayOfMonth)}
                            </Badge>
                          </div>
                          {payment.description && (
                            <p className="text-muted-foreground">{payment.description}</p>
                          )}
                          <div className="flex items-center gap-6 text-sm">
                            <span className="font-semibold text-red-600 text-lg">
                              S/ {payment.amount.toFixed(2)}
                            </span>
                            <span className="text-muted-foreground">
                              Categoría: {payment.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRecurringPayment(payment);
                              setRecurringPaymentDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar Pago Recurrente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar el pago recurrente "{payment.name}"? 
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRecurringPayment(payment.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="daily" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Presupuestos Diarios</h2>
              <Button 
                onClick={() => {
                  setEditingDailyBudget(null);
                  setDailyBudgetDialogOpen(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Presupuesto Diario
              </Button>
            </div>

            <div className="grid gap-6">
              {financialData.dailyBudgets.length === 0 ? (
                <Card className="max-w-md mx-auto">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-6" />
                    <h3 className="text-xl font-medium mb-3">No hay presupuestos diarios</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      Agrega presupuestos diarios para automatizar tus gastos diarios.
                    </p>
                    <Button 
                      onClick={() => {
                        setEditingDailyBudget(null);
                        setDailyBudgetDialogOpen(true);
                      }}
                    >
                      Agregar Primer Presupuesto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                financialData.dailyBudgets.map((budget) => (
                  <Card key={budget.id} className="max-w-2xl mx-auto w-full">
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-medium">{budget.name}</h3>
                            <Badge variant={budget.autoCreate ? "default" : "secondary"}>
                              {budget.autoCreate ? "Automático" : "Manual"}
                            </Badge>
                          </div>
                          {budget.description && (
                            <p className="text-muted-foreground">{budget.description}</p>
                          )}
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-muted-foreground">
                              Días: {getDaysOfWeekNames(budget.daysOfWeek)}
                            </span>
                            <span className="text-muted-foreground">
                              Items: {budget.items.length}
                            </span>
                          </div>
                          {budget.items.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                              <p className="text-sm font-medium">Items del presupuesto:</p>
                              <div className="grid gap-2">
                                {budget.items.map((item, index) => (
                                  <div key={index} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-medium text-red-600">
                                      S/ {item.amount.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t pt-3 mt-3">
                                <div className="flex justify-between text-sm font-semibold">
                                  <span>Total:</span>
                                  <span className="text-red-600 text-lg">
                                    S/ {budget.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingDailyBudget(budget);
                              setDailyBudgetDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Eliminar Presupuesto Diario</AlertDialogTitle>
                                <AlertDialogDescription>
                                  ¿Estás seguro de que quieres eliminar el presupuesto diario "{budget.name}"? 
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteDailyBudget(budget.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Diálogos */}
        <RecurringPaymentForm
          open={recurringPaymentDialogOpen}
          onOpenChange={setRecurringPaymentDialogOpen}
          editingPayment={editingRecurringPayment}
        />

        <DailyBudgetForm
          open={dailyBudgetDialogOpen}
          onOpenChange={setDailyBudgetDialogOpen}
          editingBudget={editingDailyBudget}
        />
      </div>
    </div>
  );
} 