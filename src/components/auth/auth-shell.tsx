"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme";

const HERO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822417/8615ef40-d7b1-45fb-b564-d7103a9f7664.png";
const LOGO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh bg-white dark:bg-neutral-950 lg:grid-cols-[minmax(0,2fr)_minmax(390px,0.85fr)]">
      <section aria-label="Rinconcito del Sabor" className="relative hidden min-h-dvh overflow-hidden border-r border-neutral-200 dark:border-neutral-800 lg:block">
        <Image src={HERO_URL} alt="Platos de Rinconcito del Sabor" fill priority sizes="70vw" className="object-fill" />
      </section>
      <section className="flex min-h-dvh flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
        <header className="flex h-14 items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-neutral-800 dark:hover:text-white"><ArrowLeft size={13} />Volver a la carta</Link>
          <ThemeSwitcher />
        </header>
        <div className="flex flex-1 items-center px-6 py-6 lg:px-10"><div className="mx-auto w-full max-w-sm"><div className="flex justify-center"><Image src={LOGO_URL} alt="Logo Rinconcito del Sabor" width={220} height={120} priority className="h-auto w-full max-w-[220px] object-contain" /></div>{children}</div></div>
        <footer className="px-6 py-4 text-center text-[11px] text-neutral-400">© 2026 Rinconcito del Sabor</footer>
      </section>
    </main>
  );
}
