import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rinconcito del Sabor",
  description: "Sistema integral de gestión del restaurante",
  applicationName: "Rinconcito del Sabor",
  manifest: "/manifest.webmanifest"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" suppressHydrationWarning><body><Providers>{children}</Providers></body></html>;
}
