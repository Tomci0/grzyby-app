import type { Metadata, Viewport } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import QuickActionModal from "@/components/QuickActionModal";
import AppProvider from "@/components/AppProvider";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "MikroDziennik",
  description: "Prywatny dziennik protokołów mikrodawkowania",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MikroDziennik",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased">
        <AppProvider>
          {/* Kontener mobilny – max-w-md wycentrowany */}
          <div className="relative min-h-dvh flex flex-col max-w-md mx-auto">
            {/* Główna treść – padding na dole dla nav bara */}
            <main className="flex-1 pb-20">{children}</main>
          </div>

          {/* Nawigacja przyklejona na dole */}
          <BottomNav />

          {/* Modals */}
          <QuickActionModal />

          {/* Service Worker */}
          <ServiceWorkerRegistrar />
        </AppProvider>
      </body>
    </html>
  );
}
