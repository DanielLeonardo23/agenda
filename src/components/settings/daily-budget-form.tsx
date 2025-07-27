"use client";

import { useState, useEffect } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData, DailyBudgetItem, Account, DailyBudget } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { addDailyBudgetAction, updateDailyBudgetAction } from "@/app/actions";
import { Loader2, PlusCircle, Trash2, Wallet, CreditCard, Building2, Landmark } from "lucide-react";

const DAYS_OF_WEEK = [
  { id: 1, name: "Lunes", short: "L" },
  { id: 2, name: "Martes", short: "M" },
  { id: 3, name: "Miércoles", short: "X" },
  { id: 4, name: "Jueves", short: "J" },
  { id: 5, name: "Viernes", short: "V" },
  { id: 6, name: "Sábado", short: "S" },
  { id: 0, name: "Domingo", short: "D" },
];

const ACCOUNT_ICONS = {
  cash: Wallet,
  bcp: CreditCard,
  interbank: Building2,
  banconacion: Landmark,
  other: Building2,
};

interface DailyBudgetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingBudget: DailyBudget | null;
}

export function DailyBudgetForm({ open, onOpenChange, editingBudget }: DailyBudgetFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [autoCreate, setAutoCreate] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [items, setItems] = useState<DailyBudgetItem[]>([
    { id: "1", name: "", amount: 0, category: "", description: "" }
  ]);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const unsubscribe = listenToFinancialData((data) => {
        setFinancialData(data);
      });
      return () => unsubscribe();
    }
  }, [open]);

  useEffect(() => {
    if (editingBudget) {
      setName(editingBudget.name);
      setCategory(editingBudget.category);
      setDescription(editingBudget.description || "");
      setSelectedDays(editingBudget.daysOfWeek);
      setAutoCreate(editingBudget.autoCreate);
      setSelectedAccount(editingBudget.accountId || "");
      setItems(editingBudget.items.length > 0 ? editingBudget.items : [
        { id: "1", name: "", amount: 0, category: "", description: "" }
      ]);
    } else {
      setName("");
      setCategory("");
      setDescription("");
      setSelectedDays([]);
      setAutoCreate(false);
      setSelectedAccount("");
      setItems([{ id: "1", name: "", amount: 0, category: "", description: "" }]);
    }
  }, [editingBudget, open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    if (selectedDays.length === 0) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, selecciona al menos un día de la semana.",
      });
      setIsPending(false);
      return;
    }

    // Validar que todos los items tengan nombre y monto
    const validItems = items.filter(item => item.name.trim() && item.amount > 0);
    if (validItems.length === 0) {
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "Por favor, agrega al menos un gasto con nombre y monto.",
      });
      setIsPending(false);
      return;
    }

    // Calcular el total
    const total = validItems.reduce((sum, item) => sum + item.amount, 0);

    try {
      if (editingBudget) {
        await updateDailyBudgetAction({
          id: editingBudget.id,
          name,
          category,
          limit: total,
          daysOfWeek: selectedDays,
          description: description || undefined,
          items: validItems,
          autoCreate,
          accountId: selectedAccount || undefined,
        });
        toast({
          title: "Presupuesto Diario Actualizado",
          description: "Tu presupuesto diario ha sido actualizado exitosamente.",
        });
      } else {
        const result = await addDailyBudgetAction({
          name,
          category,
          limit: total,
          daysOfWeek: selectedDays,
          description: description || undefined,
          items: validItems,
          autoCreate,
          accountId: selectedAccount || undefined,
        });

        if (result.success) {
          toast({
            title: "Presupuesto Diario Creado",
            description: "Tu nuevo presupuesto diario ha sido creado exitosamente.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Error al Crear",
            description: result.error,
          });
        }
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Inesperado",
        description: "Ocurrió un error al crear el presupuesto diario.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const getSelectedDaysText = () => {
    if (selectedDays.length === 0) return "Seleccionar días";
    const sortedDays = selectedDays.sort((a, b) => a - b);
    return sortedDays.map(dayId => 
      DAYS_OF_WEEK.find(day => day.id === dayId)?.short
    ).join(", ");
  };

  const addItem = () => {
    const newId = (items.length + 1).toString();
    setItems([...items, { id: newId, name: "", amount: 0, category: "", description: "" }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof DailyBudgetItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            {editingBudget ? "Editar Presupuesto Diario" : "Crear Presupuesto Diario"}
          </DialogTitle>
          <DialogDescription>
            Crea un presupuesto que se aplicará en días específicos de la semana con múltiples gastos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Presupuesto</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Gastos de trabajo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría Principal</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Transporte"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Días de la Semana</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.id} className="flex flex-col items-center">
                  <Checkbox
                    id={`day-${day.id}`}
                    checked={selectedDays.includes(day.id)}
                    onCheckedChange={() => toggleDay(day.id)}
                  />
                  <Label 
                    htmlFor={`day-${day.id}`} 
                    className="text-xs mt-1 cursor-pointer"
                  >
                    {day.short}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Seleccionados: {getSelectedDaysText()}
            </p>
          </div>

          {financialData?.accounts && financialData.accounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="account">Cuenta para Transacciones</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin cuenta específica</SelectItem>
                  {financialData.accounts.map(account => {
                    const Icon = ACCOUNT_ICONS[account.type];
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: account.color }} />
                          {account.name} - S/ {account.balance.toFixed(2)}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Gastos Individuales</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <PlusCircle className="h-4 w-4 mr-1" />
                Agregar Gasto
              </Button>
            </div>
            
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gasto {index + 1}</span>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`item-name-${item.id}`}>Nombre</Label>
                      <Input
                        id={`item-name-${item.id}`}
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Ej: Pasaje ida"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`item-amount-${item.id}`}>Monto (S/)</Label>
                      <Input
                        id={`item-amount-${item.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount || ""}
                        onChange={(e) => updateItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`item-category-${item.id}`}>Categoría</Label>
                      <Input
                        id={`item-category-${item.id}`}
                        value={item.category}
                        onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                        placeholder="Ej: Transporte"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`item-description-${item.id}`}>Descripción</Label>
                      <Input
                        id={`item-description-${item.id}`}
                        value={item.description || ""}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Total del Presupuesto:</span>
              <span className="text-lg font-bold text-blue-600">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto-create"
              checked={autoCreate}
              onCheckedChange={setAutoCreate}
            />
            <Label htmlFor="auto-create">Crear transacciones automáticamente en los días seleccionados</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción General (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción adicional del presupuesto..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingBudget ? "Actualizando..." : "Creando..."}
                </>
              ) : (
                editingBudget ? "Actualizar Presupuesto" : "Crear Presupuesto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 