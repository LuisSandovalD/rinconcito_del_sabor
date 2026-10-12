"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BellRing, Check, ChefHat, ChevronRight, CircleMinus, CirclePlus, Clock3, Minus, Plus, QrCode, Search, ShoppingBag, Users, Utensils, X } from "lucide-react";
import { toast } from "sonner";
import { api, elapsed, money } from "@/lib/client-api";
import { Badge, Button, EmptyState, Input, PageHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ProductCustomizerDialog } from "@/components/tables/product-customizer-dialog";
import { GuestAccessDialog } from "@/components/tables/guest-access-dialog";

type OrderItem = { id: string; productName: string; quantity: number; unitPrice: string; total: string; status: string; notes?: string | null; modifiers?: Array<{ name: string; priceDelta: string }> };
type ActiveOrder = { id: string; number: number; status: string; total: string; sentAt?: string | null; waiter?: { firstName: string } | null; items: OrderItem[] };
type Table = { id: string; number: number; capacity: number; status: string; orders: ActiveOrder[]; tableSessions: Array<{ openedAt: string; guestCount: number }> };
type Zone = { id: string; name: string; tables: Table[] };
type Modifier = { name: string; priceDelta: string };
type Product = { id: string; name: string; description?: string | null; price: string; imageUrl?: string | null; estimatedMinutes?: number | null; availability: string; category: { id: string; name: string }; variants: Array<Modifier & { id: string; groupName: string }>; addons: Array<{ id: string; name: string; price: string }> };
type ProductData = { products: Product[]; categories: Array<{ id: string; name: string }>; stations: unknown[] };
type CartItem = { key: string; product: Product; quantity: number; notes: string; modifiers: Array<{ name: string; priceDelta: number }> };

const labels: Record<string, string> = { FREE: "Disponible", RESERVED: "Reservada", NEW: "Pendiente de autorización", SENT: "En cocina", PREPARING: "Preparando", PARTIALLY_READY: "Parcialmente listo", READY: "Listo para entregar", WAITING_DELIVERY: "Esperando entrega", WAITING_BILL: "Solicitó cuenta", PENDING_PAYMENT: "Pendiente de pago", OCCUPIED: "Ocupada", DELIVERED: "Entregado" };

export default function TablesPage() {
  const client = useQueryClient();
  const searchRef = useRef<HTMLInputElement>(null);
  const { data: zones, isLoading } = useQuery({ queryKey: ["tables"], queryFn: () => api<Zone[]>("/api/tables") });
  const { data: menu } = useQuery({ queryKey: ["products"], queryFn: () => api<ProductData>("/api/products?available=true") });
  const [zoneId, setZoneId] = useState("");
  const [selected, setSelected] = useState<Table | null>(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState(2);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customize, setCustomize] = useState<Product | null>(null);
  const [guestAccess, setGuestAccess] = useState<Table | null>(null);

  const currentZone = zones?.find(zone => zone.id === zoneId) ?? zones?.[0];
  const visible = useMemo(() => menu?.products.filter(product => (category === "all" || product.category.id === category) && `${product.name} ${product.category.name}`.toLowerCase().includes(search.toLowerCase())) ?? [], [menu, category, search]);
  const total = cart.reduce((sum, item) => sum + (Number(item.product.price) + item.modifiers.reduce((acc, modifier) => acc + modifier.priceDelta, 0)) * item.quantity, 0);

  const addQuick = (product: Product) => setCart(items => {
    const existing = items.find(item => item.product.id === product.id && !item.modifiers.length && !item.notes);
    return existing ? items.map(item => item.key === existing.key ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { key: crypto.randomUUID(), product, quantity: 1, notes: "", modifiers: [] }];
  });

  const changeQuantity = (key: string, change: number) => setCart(items => items.map(item => item.key === key ? { ...item, quantity: item.quantity + change } : item).filter(item => item.quantity > 0));

  const submitOrder = useMutation({
    mutationFn: () => api<ActiveOrder>("/api/orders", { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), tableId: selected!.id, guestCount: guests, items: cart.map(item => ({ productId: item.product.id, quantity: item.quantity, notes: item.notes || undefined, modifiers: item.modifiers })) }) }),
    onSuccess: order => { toast.success(`Pedido #${order.number} enviado a cocina.`); setCart([]); void client.invalidateQueries({ queryKey: ["tables"] }); void client.invalidateQueries({ queryKey: ["orders"] }); setSelected(null); },
    onError: error => toast.error(error.message)
  });

  const action = useMutation({
    mutationFn: ({ orderId, action }: { orderId: string; action: string }) => api(`/api/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ action }) }),
    onSuccess: (_data, variables) => { toast.success(variables.action === "approve" ? "Pedido aprobado y enviado a cocina." : variables.action === "deliver" ? "Pedido entregado." : "Cuenta enviada a caja."); void client.invalidateQueries({ queryKey: ["tables"] }); setSelected(null); },
    onError: error => toast.error(error.message)
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "F2") { event.preventDefault(); searchRef.current?.focus(); }
      if (event.key === "F4" && selected && cart.length) { event.preventDefault(); submitOrder.mutate(); }
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, cart.length, submitOrder]);

  if (isLoading) return <div className="space-y-4"><PageHeader title="Salón y mesas" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 12 }).map((_, i) => <Skeleton className="h-36 rounded-xl" key={i} />)}</div></div>;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="SALÓN" title="Salón y mesas" description="Estado y atención de las mesas." />

      <div className="flex gap-1 overflow-x-auto">
        {zones?.map(zone => {
          const active = zone.id === currentZone?.id;
          return <button key={zone.id} type="button" onClick={() => setZoneId(zone.id)} className={cn("flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-medium transition", active ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800")}>{zone.name}<span className="opacity-60">{zone.tables.length}</span></button>;
        })}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {currentZone?.tables.map(table => {
          const order = table.orders[0];
          const minutes = table.tableSessions[0] ? elapsed(table.tableSessions[0].openedAt) : 0;
          const ready = order?.items.filter(item => item.status === "READY").length ?? 0;
          const free = table.status === "FREE";

          return (
            <button key={table.id} type="button" onClick={() => { setSelected(table); setGuests(table.tableSessions[0]?.guestCount ?? Math.min(2, table.capacity)); }} className="relative min-h-36 rounded-xl border border-neutral-200 bg-white p-4 text-left transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
              <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Mesa</span><Badge tone={table.status === "READY" || table.status === "PENDING_PAYMENT" ? "warning" : "neutral"} className="rounded-md px-2 py-0 text-[10px]">{labels[table.status] ?? table.status}</Badge></div>
              <strong className="mt-2 block text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">{String(table.number).padStart(2, "0")}</strong>

              {free ? <div className="mt-3"><span className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400"><Users size={13} />Hasta {table.capacity} personas</span></div> : <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400"><span className="flex items-center gap-1"><Clock3 size={13} />{minutes} min</span><span className="flex items-center gap-1"><Users size={13} />{table.tableSessions[0]?.guestCount ?? "—"}</span><span className="col-span-2 truncate">{order?.waiter?.firstName ?? "Equipo"}</span>{order && <strong className="text-sm text-neutral-900 dark:text-white">{money(order.total)}</strong>}{order?.status === "PARTIALLY_READY" && <span className="text-right">{ready}/{order.items.length} listos</span>}</div>}
              <ChevronRight size={15} className="absolute bottom-4 right-4 text-neutral-300 dark:text-neutral-600" />
            </button>
          );
        })}
      </section>

      {!currentZone?.tables.length && <EmptyState icon={<Utensils />} title="No hay mesas en esta zona" detail="Configura las mesas desde administración." />}

      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/50">
          <section className="flex h-dvh w-full flex-col bg-neutral-50 dark:bg-neutral-950">
            <header className="flex h-14 items-center gap-3 border-b border-neutral-200 bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
              <button type="button" onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><ArrowLeft size={18} /></button>
              <div><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Pedido</span><h2 className="text-base font-semibold text-neutral-900 dark:text-white">Mesa {String(selected.number).padStart(2, "0")}</h2></div>
              <button type="button" onClick={() => setGuestAccess(selected)} className="ml-auto flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"><QrCode size={14} />Acceso cliente</button><div className="flex items-center gap-1 rounded-lg border border-neutral-200 px-2 py-1 dark:border-neutral-800"><Users size={14} className="text-neutral-400" /><button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"><Minus size={13} /></button><strong className="min-w-5 text-center text-xs">{guests}</strong><button type="button" onClick={() => setGuests(Math.min(50, guests + 1))} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"><Plus size={13} /></button></div>
              <button type="button" onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={18} /></button>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 overflow-y-auto p-4">
                <div className="relative max-w-sm"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input ref={searchRef} value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar platos... (F2)" className="h-9 rounded-lg pl-9 text-sm" /></div>

                <div className="mt-3 flex gap-1 overflow-x-auto">
                  <button type="button" onClick={() => setCategory("all")} className={cn("h-8 shrink-0 rounded-md px-3 text-xs font-medium transition", category === "all" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800")}>Todo</button>
                  {menu?.categories.map(item => <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={cn("h-8 shrink-0 rounded-md px-3 text-xs font-medium transition", category === item.id ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800")}>{item.name}</button>)}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {visible.map(product => (
                    <article key={product.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                      <button type="button" onClick={() => setCustomize(product)} className="block w-full text-left">
                        {product.imageUrl ? <div className="relative aspect-[4/3] w-full"><Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 768px) 50vw, 240px" className="object-cover" /></div> : <div className="flex aspect-[4/3] w-full items-center justify-center bg-neutral-100 text-neutral-300 dark:bg-neutral-800 dark:text-neutral-600"><Utensils size={28} /></div>}
                        <div className="p-3"><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">{product.category.name}</span><h3 className="mt-1 truncate text-sm font-semibold text-neutral-900 dark:text-white">{product.name}</h3>{product.description && <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-neutral-500 dark:text-neutral-400">{product.description}</p>}<span className="mt-2 flex items-center gap-1 text-xs text-neutral-400"><Clock3 size={12} />{product.estimatedMinutes ?? 10} min</span></div>
                      </button>
                      <footer className="flex items-center justify-between border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800"><strong className="text-sm font-semibold text-neutral-900 dark:text-white">{money(product.price)}</strong><button type="button" onClick={() => addQuick(product)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"><Plus size={16} /></button></footer>
                    </article>
                  ))}
                </div>
              </div>

              <aside className="flex min-h-0 flex-col border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Pedido actual</h3><p className="text-xs text-neutral-400">Mesa {String(selected.number).padStart(2, "0")}</p></div><span className="text-xs text-neutral-400">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span></div>

                {selected.orders[0] && <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div className="flex items-start justify-between gap-3"><div><strong className="block text-sm">Pedido #{selected.orders[0].number}</strong><span className="text-xs text-neutral-400">{labels[selected.orders[0].status] ?? selected.orders[0].status}</span></div><strong className="text-sm">{money(selected.orders[0].total)}</strong></div>{selected.orders[0].status === "NEW" && <Button className="mt-2 h-8 w-full rounded-lg text-xs" onClick={() => action.mutate({ orderId: selected.orders[0].id, action: "approve" })}><Check size={14} />Aprobar y enviar a cocina</Button>}{selected.orders[0].status === "READY" && <Button className="mt-2 h-8 w-full rounded-lg text-xs" onClick={() => action.mutate({ orderId: selected.orders[0].id, action: "deliver" })}><Check size={14} />Entregar</Button>}{selected.orders[0].status === "DELIVERED" && <Button variant="outline" className="mt-2 h-8 w-full rounded-lg text-xs" onClick={() => action.mutate({ orderId: selected.orders[0].id, action: "request_bill" })}><BellRing size={14} />Solicitar cuenta</Button>}</div>}

                <div className="min-h-0 flex-1 overflow-y-auto px-4">
                  {!cart.length ? <EmptyState icon={<ShoppingBag />} title="Pedido vacío" detail="Agrega platos para comenzar." /> : <div className="divide-y divide-neutral-100 dark:divide-neutral-800">{cart.map(item => <div key={item.key} className="py-3"><div className="flex justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-sm text-neutral-900 dark:text-white">{item.product.name}</strong>{item.modifiers.map(modifier => <span key={modifier.name} className="block text-xs text-neutral-500">+ {modifier.name}</span>)}{item.notes && <span className="block text-xs italic text-neutral-400">{item.notes}</span>}<span className="mt-1 block text-sm font-medium">{money((Number(item.product.price) + item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0)) * item.quantity)}</span></div><div className="flex items-center gap-2"><button type="button" onClick={() => changeQuantity(item.key, -1)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"><CircleMinus size={19} /></button><strong className="min-w-4 text-center text-xs">{item.quantity}</strong><button type="button" onClick={() => changeQuantity(item.key, 1)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"><CirclePlus size={19} /></button></div></div></div>)}</div>}
                </div>

                <div className="border-t border-neutral-200 p-4 dark:border-neutral-800"><div className="flex justify-between text-xs text-neutral-500"><span>Subtotal</span><strong className="text-neutral-900 dark:text-white">{money(total)}</strong></div><div className="mt-1 flex items-end justify-between"><span className="text-sm font-medium">Total</span><strong className="text-xl font-semibold text-neutral-900 dark:text-white">{money(total)}</strong></div><Button className="mt-3 h-10 w-full rounded-lg text-sm" loading={submitOrder.isPending} disabled={!cart.length} onClick={() => submitOrder.mutate()}><ChefHat size={16} />{submitOrder.isPending ? "Enviando..." : "Enviar a cocina"}<kbd className="ml-auto rounded border border-white/20 px-1.5 py-0.5 text-[9px]">F4</kbd></Button></div>
              </aside>
            </div>
          </section>
        </div>
      )}

      {customize && <ProductCustomizerDialog product={customize} onClose={() => setCustomize(null)} onAdd={item => { setCart(items => [...items, item]); setCustomize(null); toast.success(`${customize.name} agregado.`); }} />}
      {guestAccess && <GuestAccessDialog table={guestAccess} guestCount={guests} onClose={() => setGuestAccess(null)} />}
    </div>
  );
}
