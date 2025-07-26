import { AppSidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/header";

// TODO: Implement a full transaction history component
function TransactionsList() {
    return (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Historial de Transacciones</h2>
            <p className="text-gray-600 dark:text-gray-400">Aquí se mostrará una lista de todas tus transacciones.</p>
             <div className="border-t mt-4 pt-4">
                <div className="flex justify-between items-center py-2">
                    <div>
                        <p className="font-medium">Sueldo</p>
                        <p className="text-sm text-gray-500">Ingreso</p>
                    </div>
                    <p className="text-green-500 font-semibold">+S/3,500.00</p>
                </div>
                 <div className="flex justify-between items-center py-2 border-t">
                    <div>
                        <p className="font-medium">Alquiler</p>
                        <p className="text-sm text-gray-500">Gasto</p>
                    </div>
                    <p className="text-red-500 font-semibold">-S/1,200.00</p>
                </div>
                 <div className="flex justify-between items-center py-2 border-t">
                    <div>
                        <p className="font-medium">Supermercado</p>
                        <p className="text-sm text-gray-500">Gasto</p>
                    </div>
                    <p className="text-red-500 font-semibold">-S/450.00</p>
                </div>
            </div>
        </div>
    )
}


export default function TransactionsPage() {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col w-full">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <TransactionsList />
        </main>
      </div>
    </div>
  );
}
