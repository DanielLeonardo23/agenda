"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { addRecurringPaymentAction, updateRecurringPaymentAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import type { RecurringPayment } from "@/lib/types";

interface RecurringPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPayment: RecurringPayment | null;
}

const PAYMENT_CATEGORIES = [
  "Servicios",
  "Alimentación",
  "Transporte",
  "Entretenimiento",
  "Salud",
  "Educación",
  "Vivienda",
  "Otros"
];

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function RecurringPaymentForm({ open, onOpenChange, editingPayment }: RecurringPaymentFormProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingPayment) {
      setName(editingPayment.name);
      setAmount(editingPayment.amount.toString());
      setCategory(editingPayment.category);
      setDayOfMonth(editingPayment.dayOfMonth.toString());
      setDaysOfWeek(editingPayment.daysOfWeek || []);
      setDescription(editingPayment.description || "");
      setRequiresApproval(editingPayment.requiresApproval !== false);
    } else {
      setName("");
      setAmount("");
      setCategory("");
      setDayOfMonth("");
      setDaysOfWeek([]);
      setDescription("");
      setRequiresApproval(true);
    }
  }, [editingPayment, open]);

  const handleDayOfWeekChange = (dayValue: number, checked: boolean) => {
    if (checked) {
      setDaysOfWeek(prev => [...prev, dayValue]);
    } else {
      setDaysOfWeek(prev => prev.filter(day => day !== dayValue));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !amount || !category || !dayOfMonth) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const day = parseInt(dayOfMonth);
    if (day < 1 || day > 31) {
      toast({
        title: "Error",
        description: "El día del mes debe estar entre 1 y 31.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        name,
        amount: parseFloat(amount),
        category,
        dayOfMonth: day,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
        description: description || undefined,
        requiresApproval,
      };

      let result;
      if (editingPayment) {
        result = await updateRecurringPaymentAction({
          id: editingPayment.id,
          ...paymentData,
        });
      } else {
        result = await addRecurringPaymentAction(paymentData);
      }

      if (result.success) {
        toast({
          title: editingPayment ? "Pago Recurrente Actualizado" : "Pago Recurrente Agregado",
          description: editingPayment 
            ? "El pago recurrente se actualizó correctamente."
            : "El pago recurrente se agregó correctamente.",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "No se pudo guardar el pago recurrente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el pago recurrente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingPayment ? "Editar Pago Recurrente" : "Agregar Pago Recurrente"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Pago *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Smart Fit, Netflix, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayOfMonth">Día del Mes *</Label>
            <Select value={dayOfMonth} onValueChange={setDayOfMonth} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el día" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Días de la Semana (opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${day.value}`}
                    checked={daysOfWeek.includes(day.value)}
                    onCheckedChange={(checked) => handleDayOfWeekChange(day.value, checked as boolean)}
                  />
                  <Label htmlFor={`day-${day.value}`} className="text-sm">
                    {day.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Si seleccionas días de la semana, el pago solo se ejecutará en esos días cuando coincida con el día del mes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresApproval"
                checked={requiresApproval}
                onCheckedChange={(checked) => setRequiresApproval(checked as boolean)}
              />
              <Label htmlFor="requiresApproval" className="text-sm">
                Requerir aprobación antes de ejecutar
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Si está marcado, el pago aparecerá como pendiente de aprobación antes de ejecutarse.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción adicional del pago..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : editingPayment ? "Actualizar" : "Agregar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 