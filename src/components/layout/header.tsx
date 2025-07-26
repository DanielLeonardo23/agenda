"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardHeader() {
  const isMobile = useIsMobile();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
      {isMobile && <SidebarTrigger />}
      <h1 className="text-lg font-semibold md:text-xl">Panel</h1>
      <div className="flex-1" />
      <AddTransactionDialog>
         <Button>Agregar Transacción</Button>
      </AddTransactionDialog>
      <Avatar>
        <AvatarImage src="https://placehold.co/40x40" alt="Usuario" data-ai-hint="person avatar" />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
    </header>
  );
}
