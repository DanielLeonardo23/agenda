"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";

export function AddTransactionDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const amount = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;

    if (!date) {
        toast({
            variant: "destructive",
            title: "Error de Validación",
            description: "Por favor, selecciona una fecha.",
        });
        setIsPending(false);
        return;
    }

    const result = await addTransactionAction({
      type,
      amount: parseFloat(amount),
      category,
      date,
      description,
    });

    setIsPending(false);

    if (result.success) {
        toast({
            title: "Transacción Agregada",
            description: "Tu nueva transacción ha sido registrada exitosamente.",
        });
        setOpen(false);
    } else {
        toast({
            variant: "destructive",
            title: "Error al Guardar",
            description: result.error,
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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
              <Select name="type" value={type} onValueChange={(value) => setType(value as "income" | "expense")}>
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
                name="amount"
                type="number"
                placeholder="S/0.00"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Categoría
              </Label>
              <Input
                id="category"
                name="category"
                placeholder="Ej. Comida"
                className="col-span-3"
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
              <Label htmlFor="description" className="text-right">
                Descripción
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Detalles opcionales"
                className="col-span-3"
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