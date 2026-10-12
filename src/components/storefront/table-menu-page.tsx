"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Fish, Search, ShoppingBag, Soup, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { ThemeSwitcher } from "@/components/theme";
import { ProductCard } from "@/components/storefront/product-card";
import { TableOrderDrawer } from "@/components/storefront/table-order-drawer";
import { api } from "@/lib/client-api";
import type { StorefrontMenu, StorefrontProduct, TableOrderResult } from "@/components/storefront/types";

const DEFAULT_LOGO = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";
const CATEGORY_ICONS = [Fish, Soup, UtensilsCrossed];

export function TableMenuPage({ tableNumber }: { tableNumber: number }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, { product: StorefrontProduct; quantity: number }>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<TableOrderResult | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const { data, isLoading, isError } = useQuery({ queryKey: ["public-menu"], queryFn: () => api<StorefrontMenu>("/api/public/menu") });

  useEffect(() => {
    const key = `table-access:${tableNumber}`;
    const fragment = new URLSearchParams(window.location.hash.slice(1)).get("access");
    const token = fragment ?? sessionStorage.getItem(key) ?? "";
    if (fragment) {
      sessionStorage.setItem(key, fragment);
      history.replaceState(null, "", window.location.pathname);
    }
    const timer = window.setTimeout(() => setAccessToken(token), 0);
    return () => window.clearTimeout(timer);
  }, [tableNumber]);

  const lines = Object.values(cart);
  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  const categories = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLocaleLowerCase("es");
    return data.categories
      .filter(category => !activeCategory || category.id === activeCategory)
      .map(category => ({ ...category, products: category.products.filter(product => !term || `${product.name} ${product.description ?? ""}`.toLocaleLowerCase("es").includes(term)) }))
      .filter(category => category.products.length);
  }, [activeCategory, data, search]);

  const changeQuantity = (product: StorefrontProduct, delta: number) => setCart(current => {
    const quantity = (current[product.id]?.quantity ?? 0) + delta;
    if (quantity <= 0) {
      const next = { ...current };
      delete next[product.id];
      return next;
    }
    return { ...current, [product.id]: { product, quantity: Math.min(quantity, 30) } };
  });

  const orderMutation = useMutation({
    mutationFn: () => api<TableOrderResult>("/api/public/table-orders", {
      method: "POST",
      body: JSON.stringify({
        idempotencyKey,
        tableNumber,
        accessToken,
        guestCount: guests,
        notes: notes.trim() || undefined,
        items: lines.map(line => ({ productId: line.product.id, quantity: line.quantity }))
      })
    }),
    onSuccess: order => setResult(order),
    onError: error => toast.error(error.message)
  });

  const newOrder = () => {
    setCart({});
    setNotes("");
    setResult(null);
    setIdempotencyKey(crypto.randomUUID());
    setDrawerOpen(false);
  };

  if (!Number.isInteger(tableNumber) || tableNumber < 1) return <ErrorState message="La mesa indicada no es válida." />;
  if (isLoading || accessToken === null) return <main className="min-h-dvh bg-neutral-50 p-4 dark:bg-[#040506]"><div className="mx-auto h-14 max-w-[1120px] animate-pulse rounded-xl bg-neutral-200 dark:bg-[#111214]" /><div className="mx-auto mt-24 grid max-w-[1120px] gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[340px] animate-pulse rounded-2xl bg-white dark:bg-[#07080a]" />)}</div></main>;
  if (!accessToken) return <ErrorState message="Este enlace no contiene la credencial válida de la mesa. Escanea nuevamente el QR físico colocado en ella o solicita ayuda al personal." />;
  if (isError || !data) return <ErrorState message="No pudimos cargar la carta en este momento." />;

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-[#040506] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 px-3 py-3 backdrop-blur-xl dark:border-[#1b1c1e] dark:bg-[#07080a]/90 sm:px-6">
        <div className="mx-auto flex max-w-[1120px] items-center gap-3">
          <Link href="/" className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:text-[#9c9c9d] dark:hover:bg-[#111214]"><ArrowLeft size={16} /><span className="hidden sm:inline">Volver a la carta</span></Link>
          <span className="relative h-9 w-9 overflow-hidden rounded-lg bg-[#ff6363]"><Image src={data.settings.logoUrl || DEFAULT_LOGO} alt="" fill sizes="36px" className="object-contain p-0.5" /></span>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{data.settings.tradeName}</p><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#ff6363]">Mesa {String(tableNumber).padStart(2, "0")}</p></div>
          <div className="ml-auto flex items-center gap-2"><ThemeSwitcher /><button type="button" onClick={() => setDrawerOpen(true)} className="flex h-9 items-center gap-2 rounded-lg bg-neutral-900 px-3 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]"><ShoppingBag size={15} /><span className="hidden sm:inline">Pedido</span>{cartCount > 0 && <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] dark:bg-black/10">{cartCount}</span>}</button></div>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
        <div className="max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#ff6363]">Carta de la mesa {tableNumber}</p><h1 className="mt-3 text-4xl font-medium tracking-tight sm:text-5xl">¿Qué se te antoja?</h1><p className="mt-4 text-base leading-7 text-neutral-500 dark:text-[#9c9c9d]">Agrega tus platos y envía el pedido para validación. No necesitas una cuenta porque el QR ya identificó de forma segura esta mesa.</p></div>

        <div className="mt-10 max-w-xl"><div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={event => { setSearch(event.target.value); setActiveCategory(null); }} placeholder="Buscar en la carta..." className="h-11 w-full rounded-lg border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-neutral-500 dark:border-[#363739] dark:bg-[#111214] dark:text-white" /></div></div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CategoryButton active={activeCategory === null} onClick={() => setActiveCategory(null)} label="Toda la carta" />
          {data.categories.map((category, index) => { const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length]; return <CategoryButton key={category.id} active={activeCategory === category.id} onClick={() => setActiveCategory(category.id)} label={category.name} icon={<Icon size={14} />} />; })}
        </div>

        <div className="mt-14 space-y-20">
          {categories.map(category => <section key={category.id}><div className="mb-6 flex items-center gap-2 border-b border-neutral-200 pb-4 dark:border-[#1b1c1e]"><h2 className="text-xl font-medium">{category.name}</h2><ChevronRight size={17} className="text-neutral-400" /></div><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{category.products.map(product => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity ?? 0} onAdd={() => changeQuantity(product, 1)} onDecrease={() => changeQuantity(product, -1)} />)}</div></section>)}
          {!categories.length && <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center dark:border-[#363739] dark:bg-[#07080a]"><Search className="mx-auto text-neutral-300 dark:text-[#454647]" /><h2 className="mt-4 text-lg font-medium">No encontramos ese plato</h2></div>}
        </div>
      </section>

      {cartCount > 0 && !drawerOpen && <button type="button" onClick={() => setDrawerOpen(true)} className="fixed bottom-5 left-1/2 z-20 flex h-12 -translate-x-1/2 items-center gap-4 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white shadow-xl dark:bg-[#e6e6e6] dark:text-[#454647]"><span>{cartCount} {cartCount === 1 ? "producto" : "productos"}</span><span className="h-5 w-px bg-current opacity-20" /><span>S/ {subtotal.toFixed(2)}</span></button>}
      <TableOrderDrawer open={drawerOpen} tableNumber={tableNumber} lines={lines} subtotal={subtotal} guests={guests} notes={notes} submitting={orderMutation.isPending} result={result} onClose={() => setDrawerOpen(false)} onQuantity={(productId, delta) => { const product = cart[productId]?.product; if (product) changeQuantity(product, delta); }} onGuests={setGuests} onNotes={setNotes} onSubmit={() => { if (lines.length) orderMutation.mutate(); }} onNewOrder={newOrder} />
    </main>
  );
}

function CategoryButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition ${active ? "border-neutral-900 bg-neutral-900 text-white dark:border-[#e6e6e6] dark:bg-[#e6e6e6] dark:text-[#454647]" : "border-neutral-200 bg-white text-neutral-600 dark:border-[#363739] dark:bg-[#07080a] dark:text-[#9c9c9d]"}`}>{icon}{label}</button>;
}

function ErrorState({ message }: { message: string }) {
  return <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 text-center dark:bg-[#040506] dark:text-white"><div><Fish className="mx-auto text-[#ff6363]" size={28} /><h1 className="mt-5 text-2xl font-medium">No pudimos abrir esta mesa</h1><p className="mt-2 text-sm text-neutral-500 dark:text-[#9c9c9d]">{message}</p><Link href="/menu" className="mt-6 inline-flex h-11 items-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]">Cómo pedir con QR</Link></div></main>;
}
