import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RecurringPayment } from "@/lib/types";
import { CircleDollarSign } from "lucide-react";

export function UpcomingPayments({ recurringPayments }: { recurringPayments: RecurringPayment[] }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagos Próximos</CardTitle>
        <CardDescription>Tus pagos recurrentes programados.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {recurringPayments.map((payment, index) => (
            <li key={payment.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                        <CircleDollarSign className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-medium">{payment.name}</p>
                        <p className="text-sm text-muted-foreground">Vence el día {payment.dayOfMonth}</p>
                    </div>
                </div>
                <p className="font-semibold">{formatCurrency(payment.amount)}</p>
              </div>
              {index < recurringPayments.length -1 && <Separator className="mt-4" />}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
