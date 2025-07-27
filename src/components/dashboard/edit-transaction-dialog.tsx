"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Calendar, Wallet, CreditCard, Building2, PlusCircle, Landmark } from "lucide-react";
import { listenToFinancialData } from "@/lib/data";
import { type FinancialData, type Transaction, type Account } from "@/lib/types";
import { updateTransactionAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: Wallet, color: '#10B981' },
  { value: 'bcp', label: 'BCP', icon: CreditCard, color: '#3B82F6' },
  { value: 'interbank', label: 'Interbank', icon: Building2, color: '#F59E0B' },
  { value: 'banconacion', label: 'Banco de la Nación', icon: Landmark, color: '#8B5CF6' },
  { value: 'other', label: 'Otro', icon: Wallet, color: '#8B5CF6' },
];

const INCOME_CATEGORIES = [
  "Salario",
  "Freelance", 
  "Inversiones",
  "Bonificación",
  "Otros ingresos"
];

const EXPENSE_CATEGORIES = [
  "Comida",
  "Transporte",
  "Servicios",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Ropa",
  "Otros gastos"
];

interface EditTransactionDialogProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const { toast } = useToast();
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [type, setType] = useState<'income' | 'expense'>(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [description, setDescription] = useState(transaction.description || '');
  const [date, setDate] = useState<Date | undefined>(new Date(transaction.date));
  const [selectedAccount, setSelectedAccount] = useState(transaction.accountId || 'no-accounts');

  useEffect(() => {
    if (open) {
      const unsubscribe = listenToFinancialData((data: FinancialData) => {
        setFinancialData(data);
      });
      return unsubscribe;
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!financialData) return;

    // Validaciones
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Monto Inválido",
        description: "Por favor ingresa un monto válido mayor a 0.",
      });
      return;
    }

    if (!category) {
      toast({
        variant: "destructive",
        title: "Categoría Requerida",
        description: "Por favor selecciona una categoría.",
      });
      return;
    }

    if (selectedAccount === 'no-accounts') {
      toast({
        variant: "destructive",
        title: "Cuenta Requerida",
        description: "Por favor selecciona una cuenta.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateTransactionAction({
        id: transaction.id,
        type,
        amount: parseFloat(amount),
        category,
        date: date || new Date(),
        description,
        accountId: selectedAccount,
      });

      if (result.success) {
        toast({
          title: "Transacción Actualizada",
          description: "La transacción ha sido actualizada exitosamente.",
        });
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Error al Actualizar",
          description: result.error || "No se pudo actualizar la transacción.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Inesperado",
        description: "Ocurrió un error al actualizar la transacción.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableAccounts = financialData?.accounts || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Transacción</DialogTitle>
          <DialogDescription>
            Modifica los detalles de la transacción. Los cambios se guardarán automáticamente.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (S/)</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {type === 'income' ? (
                  INCOME_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))
                ) : (
                  EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account">
              {type === 'income' ? 'Cuenta Destino' : 'Cuenta Origen'}
            </Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.length === 0 ? (
                  <SelectItem value="no-accounts">No hay cuentas disponibles</SelectItem>
                ) : (
                  availableAccounts.map((account: Account) => {
                    const Icon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet;
                    const color = ACCOUNT_TYPES.find(t => t.value === account.type)?.color;
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color }} />
                          <span>{account.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha</Label>
            <DatePicker
              date={date}
              setDate={setDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Agrega una descripción..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Actualizar Transacción"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 