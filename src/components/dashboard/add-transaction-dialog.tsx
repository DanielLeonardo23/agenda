"use client";

import { useState, useEffect } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData, DailyBudget, Account } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { addTransactionAction } from "@/app/actions";
import { Loader2, Calendar, Wallet, CreditCard, Building2, Landmark } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: Wallet, color: '#10B981' },
  { value: 'bcp', label: 'BCP', icon: CreditCard, color: '#3B82F6' },
  { value: 'interbank', label: 'Interbank', icon: Building2, color: '#F59E0B' },
  { value: 'banconacion', label: 'Banco de la Nación', icon: Landmark, color: '#8B5CF6' },
  { value: 'other', label: 'Otro', icon: Building2, color: '#6B7280' },
];

const INCOME_CATEGORIES = [
  "Salario",
  "Freelance", 
  "Inversiones",
  "Ventas",
  "Reembolso",
  "Otro"
];

const EXPENSE_CATEGORIES = [
  "Comida",
  "Transporte",
  "Entretenimiento",
  "Servicios",
  "Compras",
  "Salud",
  "Educación",
  "Otro"
];

export function AddTransactionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [selectedDailyBudget, setSelectedDailyBudget] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const unsubscribe = listenToFinancialData((data) => {
        setFinancialData(data);
      });
      return () => unsubscribe();
    }
  }, [open]);

  const getAvailableDailyBudgets = (): DailyBudget[] => {
    if (!financialData || !date) return [];
    
    const dayOfWeek = date.getDay(); // 0 = domingo, 1 = lunes, etc.
    return financialData.dailyBudgets.filter(budget => 
      budget.daysOfWeek.includes(dayOfWeek)
    );
  };

  const handleDailyBudgetSelect = (budgetId: string) => {
    setSelectedDailyBudget(budgetId);
    const budget = financialData?.dailyBudgets.find(b => b.id === budgetId);
    if (budget && !selectedCategory) {
      setSelectedCategory(budget.category);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    if (!date) {
        toast({
            variant: "destructive",
            title: "Error de Validación",
            description: "Por favor, selecciona una fecha.",
        });
        setIsPending(false);
        return;
    }

    if (!selectedAccount || selectedAccount === "no-accounts") {
        toast({
            variant: "destructive",
            title: "Error de Validación",
            description: "Por favor, selecciona una cuenta.",
        });
        setIsPending(false);
        return;
    }

    if (!selectedCategory) {
        toast({
            variant: "destructive",
            title: "Error de Validación",
            description: "Por favor, selecciona una categoría.",
        });
        setIsPending(false);
        return;
    }

    try {
      const result = await addTransactionAction({
        type,
        amount: parseFloat(amount),
        category: selectedCategory,
        date,
        description,
        dailyBudgetId: selectedDailyBudget && selectedDailyBudget !== "no-budget" ? selectedDailyBudget : undefined,
        accountId: selectedAccount,
      });

      if (result.success) {
          toast({
              title: "Transacción Agregada",
              description: "Tu nueva transacción ha sido registrada exitosamente.",
          });
          setOpen(false);
          // Reset form
          setSelectedDailyBudget("");
          setSelectedAccount("");
          setSelectedCategory("");
          setAmount("");
          setDescription("");
      } else {
          toast({
              variant: "destructive",
              title: "Error al Guardar",
              description: result.error,
          });
      }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error Inesperado",
            description: "Ocurrió un error al guardar la transacción.",
        });
    } finally {
        setIsPending(false);
    }
  };

  const availableBudgets = getAvailableDailyBudgets();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agregar Nueva Transacción</DialogTitle>
          <DialogDescription>
            Registra tus ingresos o gastos. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Tipo
              </Label>
              <Select value={type} onValueChange={(value) => setType(value as "income" | "expense")}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Gasto</SelectItem>
                  <SelectItem value="income">Ingreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Monto
              </Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="S/0.00"
                className="col-span-3"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Fecha
              </Label>
              <DatePicker date={date} setDate={setDate} className="col-span-3" />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {type === "income" ? "Cuenta Destino" : "Cuenta Origen"}
              </Label>
              <Select 
                value={selectedAccount} 
                onValueChange={setSelectedAccount}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={`Seleccionar cuenta ${type === "income" ? "destino" : "origen"}`} />
                </SelectTrigger>
                <SelectContent>
                  {financialData?.accounts && financialData.accounts.length > 0 ? (
                    financialData.accounts.map(account => {
                      const Icon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet;
                      return (
                        <SelectItem key={account.id} value={account.id}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: account.color }} />
                            {account.name}
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-accounts" disabled>
                      No hay cuentas disponibles. Crea una cuenta en Configuración.
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {type === "expense" && availableBudgets.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Presupuesto Diario
                </Label>
                <Select 
                  value={selectedDailyBudget} 
                  onValueChange={handleDailyBudgetSelect}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar presupuesto diario (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-budget">Sin presupuesto diario</SelectItem>
                    {availableBudgets.map(budget => (
                      <SelectItem key={budget.id} value={budget.id}>
                        {budget.name} - {budget.category} (S/{budget.limit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {type === "income" ? (
                    INCOME_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  ) : (
                    EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Input
                id="description"
                placeholder="Detalles opcionales"
                className="col-span-3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Transacción
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
