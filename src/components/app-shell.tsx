"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Archive, BarChart3, Bell, Bike, ChefHat, ChevronLeft, CircleDollarSign, ClipboardList, Command, LayoutDashboard, LogOut, Menu, Moon, PackageOpen, Search, Settings, Sun, TableProperties, UsersRound, UtensilsCrossed, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { cn } from "@/lib/utils";
import { useConnection } from "@/components/providers";
import { GlobalSearch } from "@/components/global-search";

type Session = { id: string; name: string; firstName: string; roles: string[]; permissions: string[] } | null;
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
  const path = usePathname(); const router = useRouter(); const connection = useConnection();
  const [mobileOpen, setMobileOpen] = useState(false); const [collapsed, setCollapsed] = useState(false); const [searchOpen, setSearchOpen] = useState(false);
  const { data: session } = useQuery({ queryKey: ["session"], queryFn: () => api<Session>("/api/auth/session") });
  const [dark, setDark] = useState(false);
  useEffect(() => { const saved = localStorage.getItem("theme"); const enabled = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches); const timer = window.setTimeout(() => setDark(enabled), 0); document.documentElement.classList.toggle("dark", enabled); return () => window.clearTimeout(timer); }, []);
  useEffect(() => { const handler = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  const filteredNav = nav.filter(item => session?.permissions.includes(item.permission));
  const logout = async () => { await api("/api/auth/logout", { method: "POST" }); router.replace("/login" as never); router.refresh(); };
  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.classList.toggle("dark", next); localStorage.setItem("theme", next ? "dark" : "light"); };

  if (path.startsWith("/kitchen")) return <div className="kds-shell"><div className="kds-shell-actions"><div className={cn("connection", `connection-${connection}`)}><span/>{connection === "connected" ? "En vivo" : connection === "offline" ? "Sin conexión" : "Reconectando"}</div><button className="icon-button" onClick={toggleTheme}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button><Link href={"/dashboard" as never} className="button button-ghost">Salir de KDS</Link></div>{children}</div>;

  return <div className="app-layout">
    {mobileOpen && <button aria-label="Cerrar navegación" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
    <aside className={cn("sidebar", collapsed && "sidebar-collapsed", mobileOpen && "sidebar-open")}>
      <div className="brand"><div className="brand-mark"><UtensilsCrossed size={21} /></div>{!collapsed && <div><strong>Rinconcito</strong><span>del Sabor</span></div>}<button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)}><X size={20}/></button></div>
      <nav className="nav-list">{filteredNav.map(item => <Link key={item.href} href={item.href as never} onClick={() => setMobileOpen(false)} className={cn("nav-link", path.startsWith(item.href) && "nav-link-active")} title={item.label}><item.icon size={20}/>{!collapsed && <span>{item.label}</span>}</Link>)}</nav>
      <div className="sidebar-footer">{!collapsed && <div className="profile"><div className="avatar">{session?.firstName?.[0] ?? "U"}</div><div><strong>{session?.name ?? "Cargando..."}</strong><span>{session?.roles[0]?.toLowerCase()}</span></div></div>}<button className="nav-link" onClick={logout} title="Cerrar sesión"><LogOut size={19}/>{!collapsed && <span>Cerrar sesión</span>}</button></div>
      <button className="collapse-button" onClick={() => setCollapsed(value => !value)} aria-label="Contraer menú"><ChevronLeft size={18} className={collapsed ? "rotate-180" : ""}/></button>
    </aside>
    <div className="app-main">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={22}/></button><button className="command-trigger" onClick={() => setSearchOpen(true)}><Search size={18}/><span>Buscar mesa, pedido o producto...</span><kbd><Command size={12}/> K</kbd></button><div className="topbar-actions"><div className={cn("connection", `connection-${connection}`)}><span/>{connection === "connected" ? "Conectado" : connection === "offline" ? "Sin conexión" : "Reconectando"}</div><button className="icon-button" onClick={toggleTheme} aria-label="Cambiar tema">{dark ? <Sun size={19}/> : <Moon size={19}/>}</button><button className="icon-button"><Bell size={19}/><i/></button></div></header>
      <main className="content">{children}</main>
    </div>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
  </div>;
}
