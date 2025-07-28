"use client";

import { useEffect, useState } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData, Account } from "@/lib/types";
import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AccountForm } from "@/components/settings/account-form";
import { Wallet, CreditCard, Building2, Landmark, PlusCircle, Trash2, Edit, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { deleteAccountAction } from "@/app/actions";

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: Wallet, color: '#10B981' },
  { value: 'bcp', label: 'BCP', icon: CreditCard, color: '#3B82F6' },
  { value: 'interbank', label: 'Interbank', icon: Building2, color: '#F59E0B' },
  { value: 'banconacion', label: 'Banco de la Nación', icon: Landmark, color: '#8B5CF6' },
  { value: 'other', label: 'Otro', icon: Building2, color: '#6B7280' },
];

export default function AccountsPage() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la cuenta "${accountName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const result = await deleteAccountAction(accountId);
      if (result.success) {
        toast({
          title: "Cuenta Eliminada",
          description: `La cuenta "${accountName}" ha sido eliminada exitosamente.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al Eliminar",
          description: result.error || "No se pudo eliminar la cuenta.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Inesperado",
        description: "Ocurrió un error al eliminar la cuenta.",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  const getAccountTypeInfo = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.value === type) || ACCOUNT_TYPES[0];
  };

  const getTotalBalance = () => {
    if (!financialData?.accounts) return 0;
    return financialData.accounts.reduce((sum, account) => sum + account.balance, 0);
  };

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
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight">Gestión de Cuentas</h1>
                  <p className="text-muted-foreground">
                    Administra tus cuentas bancarias y efectivo.
                  </p>
                </div>
                <AccountForm>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nueva Cuenta
                  </Button>
                </AccountForm>
              </div>

              {/* Resumen de Saldos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Resumen de Saldos
                  </CardTitle>
                  <CardDescription>
                    Balance total de todas tus cuentas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(getTotalBalance())}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Distribuido en {financialData.accounts.length} cuenta{financialData.accounts.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              {/* Lista de Cuentas */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Tus Cuentas</h2>
                
                {financialData.accounts.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No tienes cuentas configuradas</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        Crea tu primera cuenta para comenzar a gestionar tus finanzas.
                      </p>
                      <AccountForm>
                        <Button>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Crear Primera Cuenta
                        </Button>
                      </AccountForm>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {financialData.accounts.map((account) => {
                      const typeInfo = getAccountTypeInfo(account.type);
                      const Icon = typeInfo.icon;
                      
                      return (
                        <Card key={account.id} className="relative">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="p-2 rounded-full"
                                  style={{ backgroundColor: `${typeInfo.color}20` }}
                                >
                                  <Icon 
                                    className="h-5 w-5" 
                                    style={{ color: typeInfo.color }} 
                                  />
                                </div>
                                <div>
                                  <CardTitle className="text-lg">{account.name}</CardTitle>
                                  <CardDescription>{typeInfo.label}</CardDescription>
                                </div>
                              </div>
                              <Badge 
                                variant={account.balance >= 0 ? "default" : "destructive"}
                                className="ml-2"
                              >
                                {account.balance >= 0 ? "Activa" : "En rojo"}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Saldo actual:</span>
                                <span className={`font-semibold text-lg ${
                                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(account.balance)}
                                </span>
                              </div>
                              
                              {account.description && (
                                <div className="text-sm text-muted-foreground">
                                  {account.description}
                                </div>
                              )}
                              
                              <Separator />
                              
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  disabled
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Editar
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleDeleteAccount(account.id, account.name)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Información Adicional */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipos de Cuentas Disponibles</CardTitle>
                  <CardDescription>
                    Diferentes tipos de cuentas que puedes configurar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {ACCOUNT_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <div key={type.value} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Icon className="h-5 w-5" style={{ color: type.color }} />
                          <div>
                            <p className="font-medium">{type.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {type.value === 'cash' && 'Efectivo físico'}
                              {type.value === 'bcp' && 'Banco de Crédito del Perú'}
                              {type.value === 'interbank' && 'Banco Interbank'}
                              {type.value === 'banconacion' && 'Banco de la Nación'}
                              {type.value === 'other' && 'Otros bancos o cuentas'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center">No se encontraron datos.</div>
          )}
        </main>
      </div>
    </div>
  );
} 