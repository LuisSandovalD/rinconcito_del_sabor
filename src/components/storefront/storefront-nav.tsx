import Image from "next/image";
import Link from "next/link";
import { Armchair, CircleUserRound, LogIn, MapPin, Phone, ShoppingBag } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme";
import type { StorefrontUser } from "@/components/storefront/types";

const DEFAULT_LOGO = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";

export function StorefrontHeader({ name, logoUrl, cartCount, user, onCartOpen }: { name: string; logoUrl?: string; cartCount: number; user: StorefrontUser | null | undefined; onCartOpen: () => void }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav aria-label="Navegación principal" className="mx-auto flex h-14 max-w-[1120px] items-center rounded-xl border border-neutral-300/80 bg-white/80 px-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-3xl dark:border-[#363739] dark:bg-[#07080a]/75 dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)] sm:px-3">
        <a href="#inicio" className="flex min-w-0 items-center gap-2.5">
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-[#ff6363] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"><Image src={logoUrl || DEFAULT_LOGO} alt="" fill sizes="32px" className="object-contain p-0.5" /></span>
          <span className="hidden truncate text-[13px] font-semibold text-neutral-900 dark:text-white sm:inline">{name}</span>
        </a>

        <div className="mx-auto hidden items-center gap-6 text-[13px] font-medium text-neutral-500 dark:text-[#9c9c9d] md:flex">
          <a href="#carta" className="transition hover:text-neutral-950 dark:hover:text-white">Carta</a>
          <a href="#presentacion" className="transition hover:text-neutral-950 dark:hover:text-white">Presentación del día</a>
          <a href="#contacto" className="transition hover:text-neutral-950 dark:hover:text-white">Contacto</a>
          <Link href="/menu" className="flex items-center gap-1.5 transition hover:text-neutral-950 dark:hover:text-white"><Armchair size={13} />Pedir desde mi mesa</Link>
          <Link href={user ? "/cuenta" : "/login?next=/"} className="flex items-center gap-1.5 transition hover:text-neutral-950 dark:hover:text-white">{user ? <CircleUserRound size={13} /> : <LogIn size={13} />}{user ? user.firstName : "Iniciar sesión"}</Link>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ThemeSwitcher />
          <button type="button" onClick={onCartOpen} className="flex h-9 items-center gap-2 rounded-lg bg-neutral-900 px-3 text-[13px] font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition hover:bg-neutral-700 dark:bg-[#e6e6e6] dark:text-[#454647] dark:hover:bg-white">
            <ShoppingBag size={14} /><span className="hidden lg:inline">Mi pedido</span>
            {cartCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-white/15 px-1 text-[10px] dark:bg-black/10">{cartCount}</span>}
          </button>
        </div>
      </nav>
    </header>
  );
}

export function StorefrontFooter({ name, address, phone }: { name: string; address?: string; phone?: string }) {
  return (
    <footer id="contacto" className="border-t border-neutral-200 bg-neutral-100 px-5 py-12 text-neutral-900 dark:border-[#1b1c1e] dark:bg-[#040506] dark:text-white">
      <div className="mx-auto grid max-w-[1120px] gap-10 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div><div className="flex items-center gap-2"><span className="h-3 w-3 rotate-45 rounded-[2px] bg-[#ff6363]" /><p className="text-sm font-semibold">{name}</p></div><p className="mt-4 max-w-xs text-sm leading-6 text-neutral-500 dark:text-[#6a6b6c]">Cocina marina peruana preparada al momento. Pedidos en línea protegidos con tu cuenta.</p></div>
        <div><p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-400 dark:text-[#6a6b6c]">Local</p><p className="mt-3 flex items-start gap-2 text-sm text-neutral-600 dark:text-[#9c9c9d]"><MapPin size={15} className="mt-0.5 shrink-0" />{address || "Lima, Perú"}</p>{phone && <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600 dark:text-[#9c9c9d]"><Phone size={15} />{phone}</p>}</div>
        <div><p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-400 dark:text-[#6a6b6c]">Servicio</p><p className="mt-3 text-sm text-neutral-600 dark:text-[#9c9c9d]">Delivery · Recojo en local</p><p className="mt-2 text-sm text-neutral-600 dark:text-[#9c9c9d]">Pedidos todos los días</p></div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1120px] flex-wrap items-center justify-center gap-2 border-t border-neutral-200 pt-6 font-mono text-[11px] text-neutral-400 dark:border-[#1b1c1e] dark:text-[#6a6b6c]"><span>© 2026 {name}</span><span>|</span><span>Lima, Perú</span><span>|</span><span>Pedido web seguro</span></div>
    </footer>
  );
}
