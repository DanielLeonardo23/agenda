"use client";

import { useEffect, useState } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData, Transaction } from "@/lib/types";
import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Calendar, DollarSign, TrendingUp, TrendingDown, Trash2, Edit } from "lucide-react";
import { deleteTransactionAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { EditTransactionDialog } from "@/components/dashboard/edit-transaction-dialog";

function TransactionsList({ transactions }: { transactions: Transaction[] }) {
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN",
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-PE", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getCategoryIcon = (category: string) => {
        const categoryIcons: Record<string, React.ReactNode> = {
            comida: "🍽️",
            transporte: "🚗",
            entretenimiento: "🎮",
            servicios: "⚡",
            salud: "🏥",
            educación: "📚",
            ropa: "👕",
            otros: "📦",
            sueldo: "💰",
            freelance: "💼",
            inversiones: "📈",
        };
        return categoryIcons[category.toLowerCase()] || "📄";
    };

    const handleDeleteTransaction = async (transactionId: string) => {
        setDeletingId(transactionId);
        try {
            const result = await deleteTransactionAction(transactionId);
            if (result.success) {
                toast({
                    title: "Transacción Eliminada",
                    description: "La transacción ha sido eliminada exitosamente.",
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error al Eliminar",
                    description: result.error || "No se pudo eliminar la transacción.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error Inesperado",
                description: "Ocurrió un error al eliminar la transacción.",
            });
        } finally {
            setDeletingId(null);
        }
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setEditDialogOpen(true);
    };

    if (transactions.length === 0) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center py-8">
                        <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay transacciones</h3>
                        <p className="text-gray-500">Comienza agregando tu primera transacción para ver tu historial aquí.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Historial de Transacciones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {transactions
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">
                                            {getCategoryIcon(transaction.category)}
                                        </div>
                    <div>
                                            <p className="font-medium text-gray-900">
                                                {transaction.description || transaction.category}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                                                    {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                                                </Badge>
                                                <span className="text-sm text-gray-500">
                                                    {formatDate(transaction.date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2">
                                            {transaction.type === 'income' ? (
                                                <TrendingUp className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4 text-red-500" />
                                            )}
                                            <span
                                                className={`font-semibold text-lg ${
                                                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                                }`}
                                            >
                                                {transaction.type === 'income' ? '+' : '-'}
                                                {formatCurrency(transaction.amount)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => handleEditTransaction(transaction)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        disabled={deletingId === transaction.id}
                                                    >
                                                        {deletingId === transaction.id ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Eliminar transacción?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. La transacción "{transaction.description || transaction.category}" 
                                                            por {formatCurrency(transaction.amount)} será eliminada permanentemente.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteTransaction(transaction.id)}
                                                            className="bg-red-500 hover:bg-red-600"
                                                        >
                                                            Eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
            
            {/* Diálogo de edición */}
            {editingTransaction && editDialogOpen && (
                <EditTransactionDialog
                    transaction={editingTransaction}
                    open={editDialogOpen}
                    onOpenChange={(open) => {
                        setEditDialogOpen(open);
                        if (!open) {
                            setEditingTransaction(null);
                        }
                    }}
                />
            )}
        </>
    );
}

export default function TransactionsPage() {
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = listenToFinancialData((data) => {
            setFinancialData(data);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Transacciones</h2>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-[400px] w-full" />
                </div>
                    </div>
        );
    }

    if (!financialData) {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Transacciones</h2>
                </div>
                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center py-8">
                                <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
                                <p className="text-gray-500">No se pudieron cargar las transacciones. Intenta recargar la página.</p>
                    </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
}

  return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Transacciones</h2>
            </div>
            <div className="space-y-4">
                <TransactionsList transactions={financialData.transactions} />
      </div>
    </div>
  );
}
