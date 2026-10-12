"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronRight, Fish, Search, Soup, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { DailySpecial } from "@/components/storefront/daily-special";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontHero } from "@/components/storefront/storefront-hero";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront/storefront-nav";
import type { CheckoutData, PublicOrderResult, StorefrontMenu, StorefrontProduct, StorefrontUser } from "@/components/storefront/types";

const INITIAL_FORM: CheckoutData = {
  type: "TAKEAWAY",
  deliveryAddress: "",
  deliveryReference: "",
  deliveryLatitude: null,
  deliveryLongitude: null,
  deliveryAccuracy: null,
  recipientType: "SELF",
  recipientName: "",
  recipientEmail: "",
  recipientPhone: "",
  notes: ""
};
const CATEGORY_ICONS = [Fish, Soup, UtensilsCrossed];

export function StorefrontPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, { product: StorefrontProduct; quantity: number }>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [form, setForm] = useState<CheckoutData>(INITIAL_FORM);
  const [result, setResult] = useState<PublicOrderResult | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = sessionStorage.getItem("storefront-cart");
        if (stored) setCart(JSON.parse(stored) as Record<string, { product: StorefrontProduct; quantity: number }>);
      } catch {
        sessionStorage.removeItem("storefront-cart");
      } finally {
        setCartReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    if (Object.keys(cart).length) sessionStorage.setItem("storefront-cart", JSON.stringify(cart));
    else sessionStorage.removeItem("storefront-cart");
  }, [cart, cartReady]);

  const { data, isLoading, isError } = useQuery({ queryKey: ["public-menu"], queryFn: () => api<StorefrontMenu>("/api/public/menu") });
  const { data: user } = useQuery({ queryKey: ["customer-session"], queryFn: () => api<StorefrontUser | null>("/api/customer-auth/session") });
  const lines = Object.values(cart);
  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);

  const orderMutation = useMutation({
    mutationFn: () => api<PublicOrderResult>("/api/public/orders", {
      method: "POST",
      body: JSON.stringify({
        idempotencyKey,
        ...form,
        deliveryAddress: form.type === "DELIVERY" ? form.deliveryAddress : undefined,
        deliveryReference: form.type === "DELIVERY" ? form.deliveryReference || undefined : undefined,
        deliveryLatitude: form.type === "DELIVERY" ? form.deliveryLatitude : undefined,
        deliveryLongitude: form.type === "DELIVERY" ? form.deliveryLongitude : undefined,
        deliveryAccuracy: form.type === "DELIVERY" ? form.deliveryAccuracy : undefined,
        recipientType: form.type === "DELIVERY" ? form.recipientType : undefined,
        recipientName: form.type === "DELIVERY" && form.recipientType === "OTHER" ? form.recipientName : undefined,
        recipientEmail: form.type === "DELIVERY" && form.recipientType === "OTHER" ? form.recipientEmail : undefined,
        recipientPhone: form.type === "DELIVERY" && form.recipientType === "OTHER" ? form.recipientPhone || undefined : undefined,
        notes: form.notes || undefined,
        items: lines.map(line => ({ productId: line.product.id, quantity: line.quantity }))
      })
    }),
    onSuccess: order => setResult(order),
    onError: error => toast.error(error.message)
  });

  const filteredCategories = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLocaleLowerCase("es");
    return data.categories
      .filter(category => !activeCategory || category.id === activeCategory)
      .map(category => ({ ...category, products: category.products.filter(product => !term || `${product.name} ${product.description ?? ""}`.toLocaleLowerCase("es").includes(term)) }))
      .filter(category => category.products.length > 0);
  }, [activeCategory, data, search]);

  const featured = useMemo(() => data?.categories.flatMap(category => category.products).filter(product => product.featured).slice(0, 3) ?? [], [data]);

  const changeQuantity = (product: StorefrontProduct, delta: number) => {
    setCart(current => {
      const quantity = (current[product.id]?.quantity ?? 0) + delta;
      if (quantity <= 0) {
        const next = { ...current };
        delete next[product.id];
        return next;
      }
      return { ...current, [product.id]: { product, quantity: Math.min(quantity, 30) } };
    });
  };

  const changeQuantityById = (productId: string, delta: number) => {
    const product = cart[productId]?.product;
    if (product) changeQuantity(product, delta);
  };

  const submitOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lines.length) return;
    orderMutation.mutate();
  };

  const startNewOrder = () => {
    setCart({});
    setResult(null);
    setForm(INITIAL_FORM);
    setIdempotencyKey(crypto.randomUUID());
    setCartOpen(false);
  };

  if (isLoading) return <StorefrontLoading />;
  if (isError || !data) return <main className="flex min-h-dvh items-center justify-center bg-neutral-50 px-5 text-center text-neutral-900 dark:bg-[#040506] dark:text-white"><div><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 dark:border-[#363739]"><Fish className="text-[#ff6363]" size={24} /></span><h1 className="mt-5 text-2xl font-medium">La carta está tomando un descanso</h1><p className="mt-2 text-sm text-neutral-500 dark:text-[#9c9c9d]">Intenta nuevamente en unos instantes.</p><button type="button" onClick={() => location.reload()} className="mt-5 rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]">Volver a intentar</button></div></main>;

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-[#040506] dark:text-white">
      <StorefrontHeader name={data.settings.tradeName} logoUrl={data.settings.logoUrl} cartCount={cartCount} user={user} onCartOpen={() => setCartOpen(true)} />
      <StorefrontHero name={data.settings.tradeName} featured={featured.length ? featured : data.categories.flatMap(category => category.products).slice(0, 3)} search={search} onSearch={value => { setSearch(value); setActiveCategory(null); }} />
      <DailySpecial product={(featured.length ? featured : data.categories.flatMap(category => category.products))[0]} />

      <section id="carta" className="mx-auto max-w-[1120px] scroll-mt-20 px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        <div className="mb-10 max-w-2xl"><p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-400 dark:text-[#6a6b6c]">Menú completo</p><h2 className="mt-3 text-3xl font-medium tracking-[0.005em] text-neutral-950 dark:text-white sm:text-4xl">Elige. Agrega. Disfruta.</h2><p className="mt-3 text-base leading-7 text-neutral-500 dark:text-[#9c9c9d]">Cada plato se prepara al momento. Usa las categorías o escribe en el buscador para encontrar tu favorito.</p></div>
        <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => setActiveCategory(null)} className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${activeCategory === null ? "border-neutral-900 bg-neutral-900 text-white dark:border-[#e6e6e6] dark:bg-[#e6e6e6] dark:text-[#454647]" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-[#363739] dark:bg-[#07080a] dark:text-[#9c9c9d] dark:hover:border-[#454647] dark:hover:text-white"}`}>Toda la carta</button>
          {data.categories.map((category, index) => {
            const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
            return <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`flex shrink-0 items-center gap-2 rounded-lg border py-2 pl-2 pr-4 text-sm font-medium transition ${activeCategory === category.id ? "border-neutral-900 bg-neutral-900 text-white dark:border-[#e6e6e6] dark:bg-[#e6e6e6] dark:text-[#454647]" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-[#363739] dark:bg-[#07080a] dark:text-[#9c9c9d] dark:hover:border-[#454647] dark:hover:text-white"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-md ${activeCategory === category.id ? "bg-white/10 dark:bg-black/10" : "bg-neutral-100 text-neutral-500 dark:bg-[#111214] dark:text-[#9c9c9d]"}`}><Icon size={14} /></span>{category.name}</button>;
          })}
        </div>

        <div className="mt-16 space-y-24">
          {filteredCategories.map(category => (
            <section key={category.id}>
              <div className="mb-6 flex items-center gap-2 border-b border-neutral-200 pb-4 dark:border-[#1b1c1e]"><h2 className="text-xl font-medium tracking-[0.01em] text-neutral-950 dark:text-white">{category.name}</h2><ChevronRight size={17} className="text-neutral-400 dark:text-[#6a6b6c]" /></div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {category.products.map(product => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity ?? 0} onAdd={() => changeQuantity(product, 1)} onDecrease={() => changeQuantity(product, -1)} />)}
              </div>
            </section>
          ))}

          {!filteredCategories.length && <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center dark:border-[#363739] dark:bg-[#07080a] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"><Search className="mx-auto text-neutral-300 dark:text-[#454647]" size={28} /><h2 className="mt-4 text-lg font-medium">No encontramos ese plato</h2><p className="mt-2 text-sm text-neutral-500 dark:text-[#9c9c9d]">Prueba con otro nombre o revisa toda la carta.</p><button type="button" onClick={() => { setSearch(""); setActiveCategory(null); }} className="mt-5 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]">Limpiar búsqueda</button></div>}
        </div>
      </section>

      <StorefrontFooter name={data.settings.tradeName} address={data.settings.address} phone={data.settings.phone} />
      {cartCount > 0 && !cartOpen && <button type="button" onClick={() => setCartOpen(true)} className="fixed bottom-5 left-1/2 z-30 flex h-12 -translate-x-1/2 items-center gap-4 rounded-lg border border-neutral-700 bg-neutral-900 px-5 text-sm font-semibold text-white shadow-[0_10px_36px_rgba(0,0,0,0.28)] dark:border-[#454647] dark:bg-[#e6e6e6] dark:text-[#454647] lg:left-auto lg:right-6 lg:translate-x-0"><span>{cartCount} {cartCount === 1 ? "producto" : "productos"}</span><span className="h-5 w-px bg-current opacity-20" /><span>S/ {subtotal.toFixed(2)}</span></button>}
      <CartDrawer open={cartOpen} lines={lines} subtotal={subtotal} form={form} customer={user} submitting={orderMutation.isPending} result={result} onClose={() => setCartOpen(false)} onChange={setForm} onQuantity={changeQuantityById} onClear={() => setCart({})} onSubmit={submitOrder} onNewOrder={startNewOrder} />
    </main>
  );
}

function StorefrontLoading() {
  return <main className="min-h-dvh bg-neutral-50 p-4 dark:bg-[#040506]"><div className="mx-auto h-14 max-w-[1120px] animate-pulse rounded-xl bg-neutral-200 dark:bg-[#111214]" /><div className="mx-auto mt-16 h-[620px] max-w-[960px] animate-pulse rounded-[20px] bg-neutral-100 dark:bg-[#07080a]" /><div className="mx-auto mt-20 grid max-w-[1120px] gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[340px] animate-pulse rounded-2xl bg-white dark:bg-[#07080a]" />)}</div></main>;
}
