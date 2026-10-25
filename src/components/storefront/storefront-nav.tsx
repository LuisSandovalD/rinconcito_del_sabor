import Image from "next/image";
import Link from "next/link";
import { Armchair, ArrowUpRight, ChefHat, CircleUserRound, House, LogIn, MapPin, MessageCircle, Phone, ShoppingBag, Utensils } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme";
import type { StorefrontUser } from "@/components/storefront/types";

const DEFAULT_LOGO = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791823997/62ecbf28-81d2-4018-ad8e-ea743b7dcbc6.png";
const FOOTER_LOGO = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";

export function StorefrontHeader({ name, logoUrl, cartCount, user, onCartOpen }: { name: string; logoUrl?: string; cartCount: number; user: StorefrontUser | null | undefined; onCartOpen: () => void }) {
  const navClass = "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white sm:px-2.5 sm:text-[13px]";
  const iconSize = 17;

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-2 pt-2 sm:px-4 sm:pt-3 lg:px-5">
      <nav aria-label="Navegación principal" className="mx-auto flex min-h-14 w-full max-w-[1440px] items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-white/95 px-2.5 shadow-sm backdrop-blur-xl dark:border-[#363739] dark:bg-[#07080a]/95 sm:min-h-16 sm:gap-4 sm:rounded-2xl sm:px-4">
        <Link href="/#inicio" aria-label="Inicio" className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg sm:h-10 sm:w-10">
            <Image src={logoUrl || DEFAULT_LOGO} alt={`Logo de ${name} `} fill sizes="40px" className="object-contain p-0.5" />
          </span>
          <span className="hidden max-w-36 truncate text-sm font-semibold text-neutral-900 dark:text-white md:block lg:max-w-48">{name}</span>
        </Link>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1">
          <Link href="/#inicio" className={navClass} aria-label="Inicio" title="Inicio"><House size={iconSize} /><span className="hidden lg:inline">Inicio</span></Link>
          <Link href="/#presentacion" className={`${navClass} hidden md: inline - flex`} aria-label="Presentación del día" title="Presentación del día"><ChefHat size={iconSize} /><span className="hidden lg:inline">Presentación</span></Link>
          <Link href="/#carta" className={navClass} aria-label="Carta" title="Carta"><Utensils size={iconSize} /><span className="hidden sm:inline">Carta</span></Link>
          <Link href="/menu" className={navClass} aria-label="Pedir desde mi mesa" title="Pedir desde mi mesa"><Armchair size={iconSize} /><span className="hidden xl:inline">Pedir desde mi mesa</span><span className="hidden sm:inline xl:hidden">Mi mesa</span></Link>
          <button type="button" onClick={onCartOpen} className={navClass} aria-label={`Mi pedido${cartCount ? `, ${cartCount} productos` : ""} `} title="Mi pedido"><ShoppingBag size={iconSize} /><span className="hidden sm:inline">Pedido</span>{cartCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] text-white dark:bg-white dark:text-black">{cartCount}</span>}</button>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <ThemeSwitcher className="h-9 w-9 shrink-0 sm:h-9 sm:w-9" />
          <Link href={user ? "/cuenta" : "/login?next=/"} className={`${navClass} max - w - 32`} aria-label={user ? "Mi cuenta" : "Iniciar sesión"} title={user ? "Mi cuenta" : "Iniciar sesión"}>
            {user ? <CircleUserRound size={iconSize} /> : <LogIn size={iconSize} />}
            <span className="hidden max-w-24 truncate sm:inline">{user ? user.firstName : "Entrar"}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function StorefrontFooter({ name, address, phone }: { name: string; address?: string; phone?: string }) {
  const whatsappNumber = phone?.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber && whatsappNumber.length >= 9
    ? `https://wa.me/${whatsappNumber.startsWith("51") ? whatsappNumber : `51${whatsappNumber}`}`
    : undefined;

  return (
    <footer id="contacto" className="border-t border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-white/10 dark:bg-[#070809] dark:text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr] lg:gap-12">
          <div>
            <Link href="/#inicio" className="inline-flex items-center" aria-label={`Ir al inicio de ${name}`}>
              <Image src={FOOTER_LOGO} alt={`Logo de ${name}`} width={220} height={90} sizes="(max-width: 640px) 180px, 220px" className="h-auto w-44 object-contain sm:w-52" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-neutral-600 dark:text-neutral-400">El sabor del mar en cada plato. Disfruta nuestra cocina marina peruana, preparada al momento con dedicación y buenos ingredientes.</p>
            <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Calidad y sabor en cada pedido</div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900 dark:text-white">Explora</h3>
            <ul className="mt-5 space-y-3.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li><Link href="/#inicio" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Inicio</Link></li>
              <li><Link href="/#presentacion" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Especial del día</Link></li>
              <li><Link href="/#carta" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Nuestra carta</Link></li>
              <li><Link href="/menu" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Pedir desde mi mesa</Link></li>
              <li><Link href="/cuenta" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Mi cuenta</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900 dark:text-white">Contacto</h3>
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400"><MapPin size={17} className="mt-1 shrink-0 text-neutral-400" /><span>{address || "Lima, Perú"}</span></div>
              {phone && <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-3 break-words text-sm text-neutral-600 transition-colors hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white"><Phone size={17} className="shrink-0 text-neutral-400" /><span>{phone}</span></a>}
              {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm font-medium transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white dark:border-white/15 dark:hover:border-white dark:hover:bg-white dark:hover:text-neutral-950"><MessageCircle size={17} />Consultar por WhatsApp <ArrowUpRight size={14} /></a>}
              {!phone && <p className="text-sm leading-6 text-neutral-500 dark:text-neutral-500">Contáctanos para conocer más sobre nuestros platos y pedidos.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-900 dark:text-white">Información legal</h3>
            <ul className="mt-5 space-y-3.5 text-sm text-neutral-600 dark:text-neutral-400">
              <li><Link href="/privacidad" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Política de privacidad</Link></li>
              <li><Link href="/terminos" className="transition-colors hover:text-neutral-950 dark:hover:text-white">Términos y condiciones</Link></li>
            </ul>
            <div className="mt-7 border-t border-neutral-200 pt-5 dark:border-white/10"><p className="text-xs leading-5 text-neutral-500 dark:text-neutral-500">Tu pedido, tu experiencia. Navega y compra con tranquilidad.</p></div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-500 sm:mt-16 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {name}. Todos los derechos reservados.</p>
          <a href="#inicio" className="inline-flex items-center gap-2 transition-colors hover:text-neutral-900 dark:hover:text-white">Hecho para disfrutar <ArrowUpRight size={13} /></a>
        </div>
      </div>
    </footer>
  );
}