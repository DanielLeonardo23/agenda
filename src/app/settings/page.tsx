import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringPaymentsForm } from "@/components/settings/recurring-payments-form";

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col w-full">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Configuración General</CardTitle>
                    <CardDescription>Administra la configuración de tu cuenta y preferencias.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* TODO: Add general settings form */}
                    <p>Próximamente: Opciones de moneda, notificaciones y más.</p>
                </CardContent>
            </Card>

            <RecurringPaymentsForm />

          </div>
        </main>
      </div>
    </div>
  );
}
