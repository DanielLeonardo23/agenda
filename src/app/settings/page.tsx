"use client";

import { useEffect, useState } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData } from "@/lib/types";
import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Settings, CreditCard, Calendar } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
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
            <div className="space-y-8">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-32" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">
              <p><strong>Error:</strong> {error}</p>
            </div>
          ) : financialData ? (
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">
                  Gestiona las configuraciones de tu aplicación financiera.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Cuentas
                    </CardTitle>
                    <CardDescription>
                      Gestiona tus cuentas bancarias y efectivo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Cuentas configuradas: {financialData.accounts.length}
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/scheduled-payments">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Gestionar Cuentas
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Pagos Programados
                    </CardTitle>
                    <CardDescription>
                      Configura pagos recurrentes y presupuestos diarios.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Pagos recurrentes: {financialData.recurringPayments.length} | 
                      Presupuestos: {financialData.dailyBudgets.length}
                    </p>
                    <Button asChild className="w-full">
                      <Link href="/scheduled-payments">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Gestionar Pagos
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configuración General
                    </CardTitle>
                    <CardDescription>
                      Ajustes generales de la aplicación.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configuración básica de la aplicación.
                    </p>
                    <Button variant="outline" className="w-full" disabled>
                      <Settings className="h-4 w-4 mr-2" />
                      Próximamente
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center">No se encontraron datos.</div>
          )}
        </main>
      </div>
    </div>
  );
}
