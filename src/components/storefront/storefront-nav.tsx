import Image from "next/image";
import Link from "next/link";
import { Armchair, ChefHat, CircleUserRound, House, LogIn, ShoppingBag, Utensils, MapPin, Phone } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme";
import type { StorefrontUser } from "@/components/storefront/types";

const DEFAULT_LOGO = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791823997/62ecbf28-81d2-4018-ad8e-ea743b7dcbc6.png";

export function StorefrontHeader({ name, logoUrl, cartCount, user, onCartOpen }: { name: string; logoUrl?: string; cartCount: number; user: StorefrontUser | null | undefined; onCartOpen: () => void }) {
  const navClass = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white sm:px-2.5 sm:text-[13px]";
  const iconSize = 17;

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3 lg:px-5">
      <nav aria-label="Navegación principal" className="mx-auto flex min-h-14 w-full max-w-[1440px] items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-white/95 px-2.5 shadow-sm backdrop-blur-xl dark:border-[#363739] dark:bg-[#07080a]/95 sm:min-h-16 sm:gap-4 sm:rounded-2xl sm:px-4">
        <Link href="/#inicio" aria-label="Inicio" className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg sm:h-10 sm:w-10"><Image src={logoUrl || DEFAULT_LOGO} alt={`Logo de ${name}`} fill sizes="40px" className="object-contain p-0.5" /></span>
          <span className="hidden max-w-36 truncate text-sm font-semibold text-neutral-900 dark:text-white md:block lg:max-w-48">{name}</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1">
          <Link href="/#inicio" className={navClass} aria-label="Inicio" title="Inicio"><House size={iconSize} /><span className="hidden lg:inline">Inicio</span></Link>
          <Link href="/#presentacion" className={`${navClass} hidden md:inline-flex`} aria-label="Presentación del día" title="Presentación del día"><ChefHat size={iconSize} /><span className="hidden lg:inline">Presentación</span></Link>
          <Link href="/#carta" className={navClass} aria-label="Carta" title="Carta"><Utensils size={iconSize} /><span className="hidden sm:inline">Carta</span></Link>
          <Link href="/menu" className={navClass} aria-label="Pedir desde mi mesa" title="Pedir desde mi mesa"><Armchair size={iconSize} /><span className="hidden xl:inline">Pedir desde mi mesa</span><span className="hidden sm:inline xl:hidden">Mi mesa</span></Link>
          <button type="button" onClick={onCartOpen} className={navClass} aria-label={`Mi pedido${cartCount ? `, ${cartCount} productos` : ""}`} title="Mi pedido"><ShoppingBag size={iconSize} /><span className="hidden sm:inline">Pedido</span>{cartCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] text-white dark:bg-white dark:text-black">{cartCount}</span>}</button>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <ThemeSwitcher className="h-9 w-9 shrink-0 sm:h-9 sm:w-9" />
          <Link href={user ? "/cuenta" : "/login?next=/"} className={cnHeaderButton(navClass)} aria-label={user ? "Mi cuenta" : "Iniciar sesión"} title={user ? "Mi cuenta" : "Iniciar sesión"}>
            {user ? <CircleUserRound size={iconSize} /> : <LogIn size={iconSize} />}
            <span className="hidden max-w-24 truncate sm:inline">{user ? user.firstName : "Entrar"}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

function cnHeaderButton(className: string) {
  return `${className} max-w-32`;
}

export function StorefrontFooter({ name, address, phone }: { name: string; address?: string; phone?: string }) {
  return (
    <footer id="contacto" className="border-t border-neutral-200 bg-neutral-100 px-4 py-8 text-neutral-900 dark:border-[#1b1c1e] dark:bg-[#040506] dark:text-white sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto grid max-w-[1120px] grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-[1.2fr_1fr_1fr] lg:gap-10">
        <div><div className="flex items-center gap-2"><span className="h-3 w-3 rotate-45 rounded-[2px] bg-[#ff6363]" /><p className="text-sm font-semibold">{name}</p></div><p className="mt-3 max-w-xs text-sm leading-6 text-neutral-500 dark:text-[#9c9c9d]">Cocina marina peruana preparada al momento. Pedidos en línea protegidos con tu cuenta.</p></div>
        <div><p className="font-mono text-[10px] uppercase tracking-wide text-neutral-400 dark:text-[#6a6b6c]">Local</p><p className="mt-3 flex items-start gap-2 break-words text-sm text-neutral-600 dark:text-[#9c9c9d]"><MapPin size={15} className="mt-0.5 shrink-0" />{address || "Lima, Perú"}</p>{phone && <p className="mt-2 flex items-center gap-2 break-words text-sm text-neutral-600 dark:text-[#9c9c9d]"><Phone size={15} className="shrink-0" />{phone}</p>}</div>
        <div><p className="font-mono text-[10px] uppercase tracking-wide text-neutral-400 dark:text-[#6a6b6c]">Servicio</p><p className="mt-3 text-sm text-neutral-600 dark:text-[#9c9c9d]">Delivery · Recojo en local</p><p className="mt-2 text-sm text-neutral-600 dark:text-[#9c9c9d]">Pedidos todos los días</p></div>
      </div>
      <div className="mx-auto mt-8 flex max-w-[1120px] flex-wrap items-center justify-center gap-x-2 gap-y-1 border-t border-neutral-200 pt-5 text-center font-mono text-[10px] text-neutral-400 dark:border-[#1b1c1e] dark:text-[#6a6b6c] sm:mt-10 sm:text-[11px]"><span>© 2026 {name}</span><span>|</span><span>Lima, Perú</span><span>|</span><span>Pedido web seguro</span></div>
    </footer>
  );
}