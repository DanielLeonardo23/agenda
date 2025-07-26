
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addRecurringPaymentAction } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  amount: z.coerce.number().positive("El monto debe ser un número positivo."),
  dayOfMonth: z.coerce.number().min(1).max(31, "El día debe estar entre 1 y 31."),
  category: z.string().min(2, "La categoría debe tener al menos 2 caracteres."),
});

export function RecurringPaymentsForm() {
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: 0,
      dayOfMonth: 1,
      category: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      const result = await addRecurringPaymentAction(values);
      if (result.success) {
        toast({
          title: "Gasto Fijo Agregado",
          description: "Tu nuevo gasto fijo ha sido guardado.",
        });
        form.reset();
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
        description: "Ocurrió un error al guardar el gasto fijo.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos Fijos</CardTitle>
        <CardDescription>
          Agrega tus gastos recurrentes mensuales, como alquiler, suscripciones, etc.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Gasto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Alquiler" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Monto (S/)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej. 1200" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Día de Vencimiento</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="Ej. 5" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej. Vivienda" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agregar Gasto Fijo
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
