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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addAccountAction } from "@/app/actions";
import { Loader2, PlusCircle, Wallet, CreditCard, Building2, Landmark } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: Wallet, color: '#10B981' },
  { value: 'bcp', label: 'BCP', icon: CreditCard, color: '#3B82F6' },
  { value: 'interbank', label: 'Interbank', icon: Building2, color: '#F59E0B' },
  { value: 'banconacion', label: 'Banco de la Nación', icon: Landmark, color: '#8B5CF6' },
  { value: 'other', label: 'Otro', icon: Building2, color: '#6B7280' },
];

export function AccountForm({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"cash" | "bcp" | "interbank" | "banconacion" | "other">("cash");
  const [balance, setBalance] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      const selectedType = ACCOUNT_TYPES.find(t => t.value === type);
      const result = await addAccountAction({
        name,
        type,
        balance: parseFloat(balance),
        color: selectedType?.color,
        description: description || undefined,
      });

      if (result.success) {
        toast({
          title: "Cuenta Creada",
          description: "Tu nueva cuenta ha sido creada exitosamente.",
        });
        setOpen(false);
        // Reset form
        setName("");
        setType("cash");
        setBalance("");
        setDescription("");
      } else {
        toast({
          variant: "destructive",
          title: "Error al Crear",
          description: result.error,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Inesperado",
        description: "Ocurrió un error al crear la cuenta.",
      });
    } finally {
      setIsPending(false);
    }
  };

  const selectedType = ACCOUNT_TYPES.find(t => t.value === type);
  const IconComponent = selectedType?.icon || Wallet;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Crear Nueva Cuenta
          </DialogTitle>
          <DialogDescription>
            Agrega una nueva cuenta para organizar mejor tus finanzas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Cuenta</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Cuenta Principal"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Cuenta</Label>
              <Select value={type} onValueChange={(value) => setType(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((accountType) => {
                    const Icon = accountType.icon;
                    return (
                      <SelectItem key={accountType.value} value={accountType.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" style={{ color: accountType.color }} />
                          {accountType.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="balance">Saldo Inicial (S/)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción adicional de la cuenta..."
              rows={3}
            />
          </div>

          {selectedType && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <IconComponent className="h-6 w-6" style={{ color: selectedType.color }} />
              <div>
                <p className="font-medium">{name || "Nombre de la cuenta"}</p>
                <p className="text-sm text-gray-600">{selectedType.label}</p>
                <p className="text-sm font-medium">
                  Saldo: S/ {balance || "0.00"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 