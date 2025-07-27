"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function RecurringPaymentForm({ open, onOpenChange, editingPayment }: RecurringPaymentFormProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (editingPayment) {
      setName(editingPayment.name);
      setAmount(editingPayment.amount.toString());
      setCategory(editingPayment.category);
      setDayOfMonth(editingPayment.dayOfMonth.toString());
      setDescription(editingPayment.description || "");
    } else {
      setName("");
      setAmount("");
      setCategory("");
      setDayOfMonth("");
      setDescription("");
    }
  }, [editingPayment, open]);

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
        description: description || undefined,
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
      <DialogContent className="sm:max-w-[425px]">
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