"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Archive, BarChart3, Bell, Bike, ChefHat, ChevronLeft, CircleDollarSign, ClipboardList, Command, LayoutDashboard, LogOut, Menu, PackageOpen, Search, Settings, TableProperties, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { useConnection } from "@/components/providers";
import { GlobalSearch } from "@/components/global-search";
import { ThemeSwitcher } from "@/components/theme";

type Session = { id: string; name: string; firstName: string; roles: string[]; permissions: string[] } | null;

const LOGO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791823997/62ecbf28-81d2-4018-ad8e-ea743b7dcbc6.png";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "/tables", label: "Salón y mesas", icon: TableProperties, permission: "tables.view" },
  { href: "/orders", label: "Pedidos", icon: ClipboardList, permission: "orders.view" },
  { href: "/kitchen", label: "Cocina KDS", icon: ChefHat, permission: "kitchen.view" },
  { href: "/cash", label: "Caja", icon: CircleDollarSign, permission: "cash.view" },
  { href: "/products", label: "Productos y menú", icon: UtensilsCrossed, permission: "products.view" },
  { href: "/inventory", label: "Inventario", icon: PackageOpen, permission: "inventory.view" },
  { href: "/operations", label: "Reservas y delivery", icon: Bike, permission: "delivery.view" },
  { href: "/reports", label: "Reportes", icon: BarChart3, permission: "reports.view" },
  { href: "/users", label: "Usuarios y roles", icon: UsersRound, permission: "users.view" },
  { href: "/audit", label: "Auditoría", icon: Archive, permission: "audit.view" },
  { href: "/settings", label: "Configuración", icon: Settings, permission: "settings.view" }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const connection = useConnection();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = useQuery({ queryKey: ["session"], queryFn: () => api<Session>("/api/auth/session") });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredNav = nav.filter(item => session?.permissions.includes(item.permission));

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  const connectionLabel = connection === "connected" ? "Conectado" : connection === "offline" ? "Sin conexión" : "Reconectando";

  if (path.startsWith("/kitchen")) {
    return (
      <div className="min-h-dvh bg-neutral-950 text-white">
        <div className="fixed right-3 top-3 z-50 flex items-center gap-1.5">
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900 px-2.5 text-[11px] text-neutral-400"><span className={cn("h-1.5 w-1.5 rounded-full", connection === "connected" ? "bg-emerald-500" : connection === "offline" ? "bg-red-500" : "bg-amber-500")} />{connection === "connected" ? "En vivo" : connectionLabel}</div>
          <ThemeSwitcher className="border-neutral-800 bg-neutral-900" />
          <Link href="/dashboard" className="flex h-8 items-center justify-center rounded-md border border-neutral-800 bg-neutral-900 px-3 text-xs text-neutral-300 hover:text-white">Salir</Link>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      {mobileOpen && <button type="button" aria-label="Cerrar navegación" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}

      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[250px] flex-col border-r border-neutral-200 bg-white transition-all duration-200 dark:border-neutral-800 dark:bg-neutral-950 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0", !mobileOpen && "-translate-x-full lg:translate-x-0", collapsed && "lg:w-[72px]")}>
        <div className={cn("flex h-16 shrink-0 items-center border-b border-neutral-100 px-4 dark:border-neutral-800", collapsed ? "lg:justify-center lg:px-2" : "justify-between")}>
          <div className={cn("flex min-w-0 items-center gap-2.5", collapsed && "lg:justify-center")}>
            <Image src={LOGO_URL} alt="Rinconcito del Sabor" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
            {!collapsed && <div className="min-w-0"><strong className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">Rinconcito</strong><span className="block text-xs text-neutral-400">del Sabor</span></div>}
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 lg:hidden"><X size={18} /></button>
        </div>

        <nav className={cn("flex-1 space-y-0.5 overflow-y-auto px-2 py-3", collapsed && "lg:px-2")}>
          {filteredNav.map(item => {
            const active = path === item.href || path.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} title={item.label} className={cn("group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition", active ? "bg-neutral-100 text-neutral-950 dark:bg-neutral-900 dark:text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white", collapsed && "lg:justify-center lg:px-0")}>
                {active && <span className="absolute left-0 h-4 w-0.5 rounded-r-full bg-neutral-900 dark:bg-white" />}
                <Icon size={18} className={cn("shrink-0", active ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-100 p-2 dark:border-neutral-800">
          {!collapsed && <div className="mb-1 px-3 py-2"><strong className="block truncate text-sm font-medium text-neutral-900 dark:text-white">{session?.name ?? "Cargando..."}</strong><span className="block truncate text-xs capitalize text-neutral-400">{session?.roles[0]?.toLowerCase() ?? "usuario"}</span></div>}
          <button type="button" onClick={logout} title="Cerrar sesión" className={cn("flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white", collapsed && "lg:justify-center lg:px-0")}><LogOut size={17} />{!collapsed && <span>Cerrar sesión</span>}</button>
        </div>

        <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? "Expandir menú" : "Contraer menú"} className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:text-white lg:flex"><ChevronLeft size={14} className={cn("transition-transform", collapsed && "rotate-180")} /></button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 sm:px-5">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 lg:hidden"><Menu size={19} /></button>

          <button type="button" onClick={() => setSearchOpen(true)} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-left text-sm text-neutral-400 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800 sm:max-w-sm"><Search size={15} /><span className="truncate">Buscar mesa, pedido o producto...</span><kbd className="ml-auto hidden items-center gap-1 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[9px] text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950 sm:flex"><Command size={10} />K</kbd></button>

          <div className="ml-auto flex items-center gap-1">
            <span className="hidden items-center gap-1.5 text-xs text-neutral-400 sm:flex"><span className={cn("h-1.5 w-1.5 rounded-full", connection === "connected" ? "bg-emerald-500" : connection === "offline" ? "bg-red-500" : "bg-amber-500")} />{connectionLabel}</span>
            <ThemeSwitcher />
            <button type="button" aria-label="Notificaciones" className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-900 dark:hover:text-white"><Bell size={16} /></button>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-5 lg:p-6">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
