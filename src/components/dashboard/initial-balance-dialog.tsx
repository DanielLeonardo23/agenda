
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
import { useToast } from "@/hooks/use-toast";
import { setInitialBalanceAction } from "@/app/actions";
import { Loader2 } from "lucide-react";

export function InitialBalanceDialog({ children, onBalanceSet }: { children: React.ReactNode; onBalanceSet: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const balance = formData.get("balance") as string;

    try {
      const result = await setInitialBalanceAction(parseFloat(balance));

      if (result.success) {
          toast({
              title: "Saldo Inicial Establecido",
              description: "Tu saldo inicial ha sido guardado exitosamente.",
          });
          onBalanceSet(); // La actualización en tiempo real se encargará del resto
          setOpen(false);
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
            description: "Ocurrió un error al guardar el saldo inicial.",
        });
    } finally {
        setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Establecer Saldo Inicial</DialogTitle>
          <DialogDescription>
            Ingresa tu saldo actual para comenzar a monitorear tus finanzas. Este será el punto de partida.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="balance" className="text-right">
                Saldo
              </Label>
              <Input
                id="balance"
                name="balance"
                type="number"
                placeholder="S/0.00"
                className="col-span-3"
                required
                step="0.01"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Saldo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
