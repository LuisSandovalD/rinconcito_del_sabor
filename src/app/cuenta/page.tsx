"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ShoppingBag, UserRound } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme";
import { api } from "@/lib/client-api";
import type { StorefrontUser } from "@/components/storefront/types";

export default function CustomerAccountPage() {
  const router = useRouter();
  const { data: customer, isLoading } = useQuery({ queryKey: ["customer-session"], queryFn: () => api<StorefrontUser | null>("/api/customer-auth/session") });
  const logout = async () => { await api("/api/customer-auth/logout", { method: "POST", body: "{}" }); router.replace("/"); router.refresh(); };
  if (isLoading) return <main className="min-h-dvh bg-neutral-50 dark:bg-[#040506]" />;
  if (!customer) return <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 text-center dark:bg-[#040506] dark:text-white"><div><UserRound className="mx-auto text-[#ff6363]" /><h1 className="mt-4 text-2xl font-medium">Tu sesión no está activa</h1><Link href="/login?next=/cuenta" className="mt-6 inline-flex h-11 items-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">Iniciar sesión</Link></div></main>;
  return <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-[#040506] dark:text-white"><header className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-[#1b1c1e] dark:bg-[#07080a]"><div className="mx-auto flex max-w-3xl items-center justify-between"><Link href="/" className="text-sm text-neutral-500">Volver a la carta</Link><ThemeSwitcher /></div></header><section className="mx-auto max-w-3xl px-4 py-14"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ff6363] text-white"><UserRound /></span><h1 className="mt-6 text-3xl font-medium">Hola, {customer.firstName}</h1><div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-[#363739] dark:bg-[#07080a]"><p className="text-sm font-semibold">{customer.name}</p><p className="mt-1 text-sm text-neutral-500">{customer.email}</p><p className="mt-1 text-sm text-neutral-500">{customer.phone}</p></div><div className="mt-4 flex flex-wrap gap-3"><Link href="/#carta" className="flex h-11 items-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"><ShoppingBag size={16} />Realizar pedido</Link><button type="button" onClick={logout} className="flex h-11 items-center gap-2 rounded-lg border border-neutral-200 px-5 text-sm font-medium dark:border-[#363739]"><LogOut size={16} />Cerrar sesión</button></div></section></main>;
}
