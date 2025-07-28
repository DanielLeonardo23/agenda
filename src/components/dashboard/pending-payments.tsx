"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { approvePendingPaymentAction, rejectPendingPaymentAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { PendingAutomaticPayment } from "@/lib/types";

interface PendingPaymentsProps {
  pendingPayments: PendingAutomaticPayment[];
}

export function PendingPayments({ pendingPayments }: PendingPaymentsProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pendiente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Aprobado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "recurring":
        return <Clock className="w-4 h-4" />;
      case "daily-budget":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleApprove = async (paymentId: string) => {
    setLoadingStates(prev => ({ ...prev, [paymentId]: true }));
    
    try {
      const result = await approvePendingPaymentAction(paymentId);
      if (result.success) {
        toast({
          title: "Pago Aprobado",
          description: "El pago se ha aprobado y ejecutado correctamente.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo aprobar el pago.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al aprobar el pago.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleReject = async (paymentId: string) => {
    setLoadingStates(prev => ({ ...prev, [paymentId]: true }));
    
    try {
      const result = await rejectPendingPaymentAction(paymentId);
      if (result.success) {
        toast({
          title: "Pago Rechazado",
          description: "El pago se ha rechazado correctamente.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo rechazar el pago.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al rechazar el pago.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, [paymentId]: false }));
    }
  };

  const pendingPaymentsList = pendingPayments.filter(p => p.status === 'pending');

  if (pendingPaymentsList.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertCircle className="w-5 h-5" />
          Pagos Pendientes de Aprobación
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingPaymentsList.map((payment, index) => (
            <div key={payment.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    {getTypeIcon(payment.type)}
                  </div>
                  <div>
                    <p className="font-medium text-orange-900">{payment.name}</p>
                    <p className="text-sm text-orange-700">
                      {formatDate(payment.scheduledDate)}
                    </p>
                    <p className="text-xs text-orange-600">{payment.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-orange-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  {getStatusBadge(payment.status)}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(payment.id)}
                      disabled={loadingStates[payment.id]}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(payment.id)}
                      disabled={loadingStates[payment.id]}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
              {index < pendingPaymentsList.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 