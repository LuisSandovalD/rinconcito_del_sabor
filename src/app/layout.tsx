import type { Metadata } from "next";
import { headers } from "next/headers";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rinconcito del Sabor",
  description: "Cevichería y restaurante peruano. Pide en línea con tu cuenta o desde la mesa cuando nos visitas.",
  applicationName: "Rinconcito del Sabor",
  manifest: "/manifest.webmanifest"
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'dark';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){document.documentElement.classList.add('dark')}})()`;
  return <html lang="es" suppressHydrationWarning><head><script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} /></head><body className="antialiased"><Providers>{children}</Providers></body></html>;
}
