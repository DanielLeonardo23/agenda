import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AutoPaymentExecutor } from "@/components/dashboard/auto-payment-executor";

export const metadata: Metadata = {
  title: "Panel - Control Financiero",
  description: "Aplicación para el control de finanzas personales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased h-full bg-background">
        <SidebarProvider>
          {children}
        </SidebarProvider>
        <Toaster />
        <AutoPaymentExecutor />
      </body>
    </html>
  );
}
