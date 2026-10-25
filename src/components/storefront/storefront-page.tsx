"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, Fish, Search, Soup, UtensilsCrossed, ShoppingBag, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { DailySpecial } from "@/components/storefront/daily-special";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontHero } from "@/components/storefront/storefront-hero";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront/storefront-nav";
import type { CheckoutData, PublicOrderResult, StorefrontMenu, StorefrontProduct, StorefrontUser } from "@/components/storefront/types";
import StorefrontLoading from "./StorefrontLoading";

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

const CATEGORY_ICONS = [UtensilsCrossed, Soup, Fish];

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

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["public-menu"],
    queryFn: () => api<StorefrontMenu>("/api/public/menu"),
    retry: 2,
    refetchOnWindowFocus: true
  });

  const { data: user } = useQuery({
    queryKey: ["customer-session"],
    queryFn: () => api<StorefrontUser | null>("/api/customer-auth/session")
  });

  const settings = data?.settings;
  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);
  const menuUnavailable = isError || !data;
  const hasProducts = categories.some(category => category.products.length > 0);
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
    const term = search.trim().toLocaleLowerCase("es");
    return categories
      .filter(category => !activeCategory || category.id === activeCategory)
      .map(category => ({
        ...category,
        products: category.products.filter(product =>
          !term || `${product.name} ${product.description ?? ""}`.toLocaleLowerCase("es").includes(term)
        )
      }))
      .filter(category => category.products.length > 0);
  }, [activeCategory, categories, search]);

  const featured = useMemo(
    () => categories.flatMap(category => category.products).filter(product => product.featured).slice(0, 3),
    [categories]
  );

  const products = featured.length ? featured : categories.flatMap(category => category.products).slice(0, 3);

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
    if (!lines.length) {
      toast.error("Agrega al menos un producto antes de continuar.");
      return;
    }
    orderMutation.mutate();
  };

  const startNewOrder = () => {
    setCart({});
    setResult(null);
    setForm(INITIAL_FORM);
    setIdempotencyKey(crypto.randomUUID());
    setCartOpen(false);
  };

  return (
    <main className="min-h-dvh overflow-x-clip bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <StorefrontHeader name={settings?.tradeName ?? "Nuestra tienda"} cartCount={cartCount} user={user} onCartOpen={() => setCartOpen(true)} />
      <StorefrontHero name={settings?.tradeName ?? "Nuestra tienda"} featured={products} search={search} onSearch={value => {
        setSearch(value);
        setActiveCategory(null);
        if (value) window.setTimeout(() => document.getElementById("carta")?.scrollIntoView({ behavior: "smooth" }), 50);
      }} />
      {products.length > 0 && <DailySpecial product={products[0]} products={products} />}
      <section id="carta" className="scroll-mt-20 border-b border-neutral-200 bg-neutral-50/70 dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto w-full max-w-[1600px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="flex flex-col justify-between gap-7 border-b border-neutral-200 pb-9 dark:border-neutral-800 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">Nuestra propuesta gastronómica</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-5xl lg:text-6xl">La carta<span className="font-normal text-neutral-400 dark:text-neutral-500">.</span></h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600 dark:text-neutral-400 sm:text-base">Descubre nuestros platos, explora los ingredientes y elige tus favoritos. Cada pedido se prepara al momento.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"><ShoppingBag size={17} strokeWidth={1.5} /></span>
              <div><p className="font-medium text-neutral-800 dark:text-neutral-200">Pedido directo</p><p className="mt-0.5">Elige y agrega al carrito</p></div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10"><StorefrontLoading /></div>
          ) : menuUnavailable || !hasProducts ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">{menuUnavailable ? <Fish size={24} strokeWidth={1.5} /> : <Soup size={24} strokeWidth={1.5} />}</span>
              <h3 className="mt-5 text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">{menuUnavailable ? "Estamos preparando nuestra carta" : "Nuestra carta estará disponible pronto"}</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500 dark:text-neutral-400">{menuUnavailable ? "Estamos organizando la información de nuestros productos. Vuelve a visitarnos en unos momentos." : "Nuestros platos y categorías todavía se están creando. Pronto podrás descubrirlos y realizar tu pedido."}</p>
              {menuUnavailable && <button type="button" onClick={() => refetch()} disabled={isFetching} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />{isFetching ? "Intentando conectar..." : "Volver a intentar"}</button>}
            </div>
          ) : (
            <>
              <div className="sticky top-[68px] z-20 -mx-5 border-b border-neutral-200/80 bg-neutral-50/95 px-5 py-4 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/95 sm:-mx-8 sm:px-8 lg:-mx-12 lg:px-12">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button type="button" onClick={() => setActiveCategory(null)} className={`flex h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition ${activeCategory === null ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"}`}>Todas las categorías</button>
                    {categories.map((category, index) => {
                      const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
                      const isActive = activeCategory === category.id;
                      return <button key={category.id} type="button" onClick={() => setActiveCategory(category.id)} className={`flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition ${isActive ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-600"}`}><Icon size={15} strokeWidth={1.7} />{category.name}</button>;
                    })}
                  </div>
                  <label className="flex h-11 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 transition focus-within:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:focus-within:border-neutral-600 xl:max-w-sm">
                    <Search size={17} className="shrink-0 text-neutral-400" />
                    <input value={search} onChange={event => { setSearch(event.target.value); setActiveCategory(null); }} placeholder="Buscar en la carta..." aria-label="Buscar productos" className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500" />
                    {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda" className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Limpiar</button>}
                  </label>
                </div>
              </div>

              <div className="mt-12 space-y-20 sm:mt-16 sm:space-y-24">
                {filteredCategories.map(category => (
                  <section key={category.id}>
                    <div className="mb-7 flex items-end justify-between gap-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
                      <div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400">Categoría</p><h3 className="text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-3xl">{category.name}</h3></div>
                      <span className="shrink-0 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs tabular-nums text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">{String(category.products.length).padStart(2, "0")} platos</span>
                    </div>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {category.products.map(product => <ProductCard key={product.id} product={product} quantity={cart[product.id]?.quantity ?? 0} onAdd={() => changeQuantity(product, 1)} onDecrease={() => changeQuantity(product, -1)} />)}
                    </div>
                  </section>
                ))}
                {!filteredCategories.length && <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-16 text-center"><Search size={23} strokeWidth={1.5} className="text-neutral-400" /><h3 className="mt-5 text-xl font-semibold tracking-tight">No encontramos ese plato</h3><p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500 dark:text-neutral-400">Prueba con otro término o vuelve a mostrar todas las categorías de nuestra carta.</p><button type="button" onClick={() => { setSearch(""); setActiveCategory(null); }} className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">Ver toda la carta <ArrowRight size={15} /></button></div>}
              </div>
            </>
          )}
        </div>
      </section>

      <StorefrontFooter name={settings?.tradeName ?? "Nuestra tienda"} address={settings?.address ?? ""} phone={settings?.phone ?? ""} />
      {cartCount > 0 && !cartOpen && <button type="button" onClick={() => setCartOpen(true)} className="fixed bottom-5 left-1/2 z-30 flex h-14 -translate-x-1/2 items-center gap-4 rounded-2xl border border-neutral-700 bg-neutral-950 px-5 text-sm text-white shadow-[0_12px_40px_rgba(0,0,0,0.16)] transition hover:bg-neutral-800 dark:border-neutral-600 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 lg:left-auto lg:right-8 lg:translate-x-0"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 dark:bg-black/5"><ShoppingBag size={16} /></span><span className="font-medium">{cartCount} {cartCount === 1 ? "producto" : "productos"}</span><span className="h-5 w-px bg-current opacity-20" /><span className="font-semibold tabular-nums">S/ {subtotal.toFixed(2)}</span><ChevronRight size={16} className="opacity-70" /></button>}
      <CartDrawer open={cartOpen} lines={lines} subtotal={subtotal} form={form} customer={user} submitting={orderMutation.isPending} result={result} onClose={() => setCartOpen(false)} onChange={setForm} onQuantity={changeQuantityById} onClear={() => setCart({})} onSubmit={submitOrder} onNewOrder={startNewOrder} />
    </main>
  );
}