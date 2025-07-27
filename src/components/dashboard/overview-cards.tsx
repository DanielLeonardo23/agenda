import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DollarSign, ArrowUp, ArrowDown, CalendarClock, Wallet, CreditCard, Building2, Landmark } from "lucide-react";
import type { FinancialData } from "@/lib/types";

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: Wallet, color: '#10B981' },
  { value: 'bcp', label: 'BCP', icon: CreditCard, color: '#3B82F6' },
  { value: 'interbank', label: 'Interbank', icon: Building2, color: '#F59E0B' },
  { value: 'banconacion', label: 'Banco de la Nación', icon: Landmark, color: '#8B5CF6' },
  { value: 'other', label: 'Otro', icon: Wallet, color: '#8B5CF6' },
];

export function OverviewCards({ data }: { data: FinancialData }) {
  const { currentBalance, transactions, recurringPayments, initialBalance, accounts, accountTotals } = data;
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const upcomingPaymentsAmount = recurringPayments.reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  // Calcular el desglose del saldo por cuenta
  const accountBreakdown = accounts.map(account => ({
    ...account,
    percentage: currentBalance > 0 ? (account.balance / currentBalance) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Actual</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground">Tu panorama financiero</p>
            
            {/* Desglose por cuenta */}
            {accounts.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Desglose por cuenta:</p>
                {accountBreakdown.map(account => {
                  const Icon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet;
                  const color = ACCOUNT_TYPES.find(t => t.value === account.type)?.color;
                  return (
                    <div key={account.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1">
                        <Icon className="h-3 w-3" style={{ color }} />
                        <span className="text-muted-foreground">
                          {account.type === 'cash' ? 'Efectivo' : 
                           account.type === 'bcp' ? 'BCP' : 
                           account.type === 'interbank' ? 'Interbank' :
                           account.type === 'banconacion' ? 'Banco de la Nación' : 'Otro'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{formatCurrency(account.balance)}</span>
                        {currentBalance > 0 && (
                          <span className="text-muted-foreground">
                            ({account.percentage.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos Próximos</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(upcomingPaymentsAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Programados para este mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Totales por cuenta */}
      {accountTotals && accountTotals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accountTotals.map(account => {
            const Icon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet;
            const color = ACCOUNT_TYPES.find(t => t.value === account.type)?.color;
            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color }} />
                    {account.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Saldo actual:</span>
                      <span className="font-medium">{formatCurrency(account.balance)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Ingresos:</span>
                      <span className="text-green-600 font-medium">{formatCurrency(account.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Gastos:</span>
                      <span className="text-red-600 font-medium">{formatCurrency(account.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="font-medium">Flujo neto:</span>
                      <span className={`font-medium ${account.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(account.netFlow)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
