
"use client";

import { useState, useEffect } from "react";
import { listenToFinancialData } from "@/lib/data";
import type { FinancialData, Account } from "@/lib/types";
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
import { useToast } from "@/hooks/use-toast";
import { setInitialBalanceAction, addAccountAction } from "@/app/actions";
import { Loader2, Wallet, CreditCard, Building2, PlusCircle, Landmark } from "lucide-react";

const ACCOUNT_TYPES = [
  { value: 'cash', label: 'Efectivo', icon: Wallet, color: '#10B981' },
  { value: 'bcp', label: 'BCP', icon: CreditCard, color: '#3B82F6' },
  { value: 'interbank', label: 'Interbank', icon: Building2, color: '#F59E0B' },
  { value: 'banconacion', label: 'Banco de la Nación', icon: Landmark, color: '#8B5CF6' },
  { value: 'other', label: 'Otro', icon: Building2, color: '#6B7280' },
];

export function InitialBalanceDialog({ children, onBalanceSet }: { children: React.ReactNode; onBalanceSet: () => void }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [balance, setBalance] = useState("");
  const [selectedAccountType, setSelectedAccountType] = useState<"cash" | "bcp" | "interbank" | "banconacion" | "other">("cash");
  const [accountName, setAccountName] = useState("");
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [selectedExistingAccount, setSelectedExistingAccount] = useState<string>("");
  const [createNewAccount, setCreateNewAccount] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const unsubscribe = listenToFinancialData((data) => {
        setFinancialData(data);
      });
      return () => unsubscribe();
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);

    try {
      let accountId = selectedExistingAccount;

      // Si se selecciona crear nueva cuenta
      if (createNewAccount && accountName.trim()) {
        const selectedType = ACCOUNT_TYPES.find(t => t.value === selectedAccountType);
        const accountResult = await addAccountAction({
          name: accountName,
          type: selectedAccountType,
          balance: parseFloat(balance),
          color: selectedType?.color,
        });

        if (accountResult.success) {
          accountId = accountResult.id!;
        } else {
          toast({
            variant: "destructive",
            title: "Error al Crear Cuenta",
            description: accountResult.error,
          });
          setIsPending(false);
          return;
        }
      }

      // Establecer el saldo inicial
      const result = await setInitialBalanceAction(parseFloat(balance));

      if (result.success) {
          toast({
              title: "Saldo Inicial Establecido",
              description: createNewAccount 
                ? `Tu saldo inicial de S/ ${parseFloat(balance).toFixed(2)} ha sido guardado en ${accountName}.`
                : "Tu saldo inicial ha sido guardado exitosamente.",
          });
          onBalanceSet();
          setOpen(false);
          // Reset form
          setBalance("");
          setSelectedAccountType("cash");
          setAccountName("");
          setSelectedExistingAccount("");
          setCreateNewAccount(false);
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

  const selectedType = ACCOUNT_TYPES.find(t => t.value === selectedAccountType);
  const IconComponent = selectedType?.icon || Wallet;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Establecer Saldo Inicial</DialogTitle>
          <DialogDescription>
            Ingresa tu saldo actual y especifica dónde está ubicado para comenzar a monitorear tus finanzas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance">Saldo Inicial (S/)</Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label>¿Dónde está tu saldo?</Label>
            
            {financialData?.accounts && financialData.accounts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="existing-account"
                    name="account-type"
                    checked={!createNewAccount}
                    onChange={() => setCreateNewAccount(false)}
                  />
                  <Label htmlFor="existing-account">Usar cuenta existente</Label>
                </div>
                
                {!createNewAccount && (
                  <Select value={selectedExistingAccount} onValueChange={setSelectedExistingAccount}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta existente" />
                    </SelectTrigger>
                    <SelectContent>
                      {financialData.accounts.map(account => {
                        const Icon = ACCOUNT_TYPES.find(t => t.value === account.type)?.icon || Wallet;
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
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="new-account"
                    name="account-type"
                    checked={createNewAccount}
                    onChange={() => setCreateNewAccount(true)}
                  />
                  <Label htmlFor="new-account">Crear nueva cuenta</Label>
                </div>
              </div>
            )}

            {createNewAccount && (
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="account-name">Nombre de la Cuenta</Label>
                    <Input
                      id="account-name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Ej: Cuenta Principal"
                      required={createNewAccount}
                    />
                  </div>
                  <div>
                    <Label htmlFor="account-type">Tipo de Cuenta</Label>
                    <Select value={selectedAccountType} onValueChange={(value) => setSelectedAccountType(value as any)}>
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

                {selectedType && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <IconComponent className="h-6 w-6" style={{ color: selectedType.color }} />
                    <div>
                      <p className="font-medium">{accountName || "Nombre de la cuenta"}</p>
                      <p className="text-sm text-gray-600">{selectedType.label}</p>
                      <p className="text-sm font-medium">
                        Saldo: S/ {balance || "0.00"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {(!financialData?.accounts || financialData.accounts.length === 0) && (
              <div className="space-y-3 p-3 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="account-name">Nombre de la Cuenta</Label>
                    <Input
                      id="account-name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Ej: Cuenta Principal"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="account-type">Tipo de Cuenta</Label>
                    <Select value={selectedAccountType} onValueChange={(value) => setSelectedAccountType(value as any)}>
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

                {selectedType && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <IconComponent className="h-6 w-6" style={{ color: selectedType.color }} />
                    <div>
                      <p className="font-medium">{accountName || "Nombre de la cuenta"}</p>
                      <p className="text-sm text-gray-600">{selectedType.label}</p>
                      <p className="text-sm font-medium">
                        Saldo: S/ {balance || "0.00"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
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
