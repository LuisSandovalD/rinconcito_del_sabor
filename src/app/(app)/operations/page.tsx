"use client";

/* Reservation defaults are intentionally computed when the creation sheet opens. */
/* eslint-disable react-hooks/purity, @typescript-eslint/no-unused-vars */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, CalendarDays, Check, Clock3, MapPin, PackageCheck, Phone, Plus, ShoppingBag, Users, X } from "lucide-react";
import { toast } from "sonner";
import { api, money } from "@/lib/client-api";
import { Badge, Button, EmptyState, Input, PageHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

type Reservation = { id: string; customerName: string; phone: string; partySize: number; reservedFor: string; status: string; notes?: string; table?: { id: string; number: number; zone: { name: string } } | null };
type ExternalOrder = { id: string; number: number; type: "TAKEAWAY" | "DELIVERY"; status: string; customerName: string; customerPhone?: string; deliveryAddress?: string; total: string; openedAt: string; items: Array<{ id: string; productName: string; quantity: number }>; delivery?: { status: string } | null };
type Product = { id: string; name: string; price: string; availability: string; category: { name: string } };
type Zone = { tables: Array<{ id: string; number: number; capacity: number; status: string }> };

export default function OperationsPage() {
    const client = useQueryClient();
    const [tab, setTab] = useState<"orders" | "reservations">("orders");
    const [newOrder, setNewOrder] = useState(false);
    const [newReservation, setNewReservation] = useState(false);

    const { data: orders = [], isLoading: loadingOrders } = useQuery({ queryKey: ["external-orders"], queryFn: () => api<ExternalOrder[]>("/api/external-orders") });
    const { data: reservations = [], isLoading: loadingReservations } = useQuery({ queryKey: ["reservations"], queryFn: () => api<Reservation[]>("/api/reservations") });

    const statusMutation = useMutation({
        mutationFn: ({ kind, id, value }: { kind: "order" | "reservation"; id: string; value: string }) => api(kind === "order" ? `/api/external-orders/${id}` : `/api/reservations/${id}`, { method: "PATCH", body: JSON.stringify(kind === "order" ? { action: value } : { status: value }) }),
        onSuccess: () => { toast.success("Estado actualizado."); void client.invalidateQueries({ queryKey: ["external-orders"] }); void client.invalidateQueries({ queryKey: ["reservations"] }); },
        onError: error => toast.error(error.message)
    });

    if (loadingOrders || loadingReservations) return <div className="space-y-4"><PageHeader title="Reservas y pedidos externos" /><Skeleton className="h-[520px] rounded-xl" /></div>;

    return (
        <div className="space-y-4">
            <PageHeader eyebrow="CANALES DE ATENCIÓN" title="Reservas y pedidos externos" description="Controla delivery, recojos y reservas." action={<Button onClick={() => tab === "orders" ? setNewOrder(true) : setNewReservation(true)} className="h-9 gap-2 rounded-lg px-3 text-sm"><Plus size={15} />{tab === "orders" ? "Nuevo pedido" : "Nueva reserva"}</Button>} />

            <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">
                <button type="button" onClick={() => setTab("orders")} className={cn("flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition", tab === "orders" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white")}><Bike size={14} />Delivery y recojo <span className="opacity-60">{orders.length}</span></button>
                <button type="button" onClick={() => setTab("reservations")} className={cn("flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium transition", tab === "reservations" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white")}><CalendarDays size={14} />Reservas <span className="opacity-60">{reservations.length}</span></button>
            </div>

            {tab === "orders" ? (
                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    {orders.map((order, index) => (
                        <article key={order.id} className={cn("px-4 py-3", index !== orders.length - 1 && "border-b border-neutral-100 dark:border-neutral-800")}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        {order.type === "DELIVERY" ? <Bike size={14} className="text-neutral-400" /> : <ShoppingBag size={14} className="text-neutral-400" />}
                                        <span className="text-xs font-medium text-neutral-500">{order.type === "DELIVERY" ? "Delivery" : "Para llevar"}</span>
                                        <Badge tone={order.status === "READY" ? "success" : order.status === "PREPARING" ? "warning" : "neutral"} className="rounded-md px-2 py-0 text-[10px]">{order.delivery?.status ?? order.status}</Badge>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2"><strong className="text-sm font-semibold text-neutral-900 dark:text-white">#{order.number}</strong><span className="truncate text-sm text-neutral-600 dark:text-neutral-300">{order.customerName}</span></div>
                                </div>
                                <strong className="text-sm font-semibold text-neutral-900 dark:text-white">{money(order.total)}</strong>
                            </div>

                            {(order.customerPhone || order.deliveryAddress) && <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-400">{order.customerPhone && <span className="flex items-center gap-1"><Phone size={12} />{order.customerPhone}</span>}{order.deliveryAddress && <span className="flex items-center gap-1"><MapPin size={12} />{order.deliveryAddress}</span>}</div>}

                            <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{order.items.slice(0, 3).map(item => <span key={item.id} className="mr-3">{item.quantity}× {item.productName}</span>)}{order.items.length > 3 && <span className="text-xs">+{order.items.length - 3} más</span>}</div>

                            {(order.status === "READY" || order.delivery?.status === "ON_THE_WAY") && (
                                <div className="mt-3 flex justify-end">
                                    {order.status === "READY" && order.type === "DELIVERY" && order.delivery?.status !== "ON_THE_WAY" && <Button onClick={() => statusMutation.mutate({ kind: "order", id: order.id, value: "dispatch" })} className="h-8 gap-1.5 rounded-lg px-3 text-xs"><Bike size={14} />En reparto</Button>}
                                    {order.status === "READY" && order.type === "TAKEAWAY" && <Button onClick={() => statusMutation.mutate({ kind: "order", id: order.id, value: "deliver" })} className="h-8 gap-1.5 rounded-lg px-3 text-xs"><Check size={14} />Entregar</Button>}
                                    {order.delivery?.status === "ON_THE_WAY" && <Button onClick={() => statusMutation.mutate({ kind: "order", id: order.id, value: "deliver" })} className="h-8 gap-1.5 rounded-lg px-3 text-xs"><PackageCheck size={14} />Entregado</Button>}
                                </div>
                            )}
                        </article>
                    ))}
                </section>
            ) : (
                <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    {reservations.map((reservation, index) => (
                        <article key={reservation.id} className={cn("grid items-center gap-3 px-4 py-3 sm:grid-cols-[42px_1fr_auto_auto]", index !== reservations.length - 1 && "border-b border-neutral-100 dark:border-neutral-800")}>
                            <div className="text-center"><strong className="block text-lg font-semibold text-neutral-900 dark:text-white">{new Intl.DateTimeFormat("es-PE", { day: "2-digit" }).format(new Date(reservation.reservedFor))}</strong><span className="text-[9px] uppercase text-neutral-400">{new Intl.DateTimeFormat("es-PE", { month: "short" }).format(new Date(reservation.reservedFor))}</span></div>
                            <div className="min-w-0"><h3 className="truncate text-sm font-medium text-neutral-900 dark:text-white">{reservation.customerName}</h3><div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-400"><span className="flex items-center gap-1"><Clock3 size={12} />{new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(reservation.reservedFor))}</span><span className="flex items-center gap-1"><Users size={12} />{reservation.partySize}</span><span className="flex items-center gap-1"><Phone size={12} />{reservation.phone}</span>{reservation.table && <span>Mesa {reservation.table.number}</span>}</div></div>
                            <Badge tone={reservation.status === "CONFIRMED" ? "success" : reservation.status === "PENDING" ? "warning" : "neutral"} className="rounded-md px-2 py-0 text-[10px]">{reservation.status}</Badge>
                            <div>{reservation.status === "PENDING" && <Button variant="outline" onClick={() => statusMutation.mutate({ kind: "reservation", id: reservation.id, value: "CONFIRMED" })} className="h-8 rounded-lg px-3 text-xs">Confirmar</Button>}{reservation.status === "CONFIRMED" && <Button onClick={() => statusMutation.mutate({ kind: "reservation", id: reservation.id, value: "ARRIVED" })} className="h-8 rounded-lg px-3 text-xs">Ya llegó</Button>}</div>
                        </article>
                    ))}
                </section>
            )}

            {tab === "orders" && !orders.length && <EmptyState icon={<Bike />} title="Sin pedidos externos" detail="Los nuevos pedidos aparecerán aquí." />}
            {tab === "reservations" && !reservations.length && <EmptyState icon={<CalendarDays />} title="Sin reservas próximas" detail="Registra una reserva en pocos segundos." />}

            {newOrder && <CreateExternalOrder onClose={() => setNewOrder(false)} onCreated={() => { setNewOrder(false); void client.invalidateQueries({ queryKey: ["external-orders"] }); }} />}
            {newReservation && <CreateReservation onClose={() => setNewReservation(false)} onCreated={() => { setNewReservation(false); void client.invalidateQueries({ queryKey: ["reservations"] }); }} />}
        </div>
    );
}

function CreateExternalOrder({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { data } = useQuery({ queryKey: ["products"], queryFn: () => api<{ products: Product[] }>("/api/products?available=true") });
    const [type, setType] = useState<"TAKEAWAY" | "DELIVERY">("TAKEAWAY");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [cart, setCart] = useState<Record<string, number>>({});
    const selected = useMemo(() => data?.products.filter(product => cart[product.id]) ?? [], [data, cart]);

    const mutation = useMutation({
        mutationFn: () => api("/api/external-orders", { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), type, customerName: name, customerPhone: phone || undefined, deliveryAddress: type === "DELIVERY" ? address : undefined, items: selected.map(product => ({ productId: product.id, quantity: cart[product.id] })) }) }),
        onSuccess: () => { toast.success("Pedido enviado a cocina."); onCreated(); },
        onError: error => toast.error(error.message)
    });

    const totalItems = selected.reduce((sum, product) => sum + cart[product.id], 0);
    const total = selected.reduce((sum, product) => sum + Number(product.price) * cart[product.id], 0);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white dark:bg-neutral-900">
                <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Nuevo pedido</span><h2 className="text-lg font-semibold">Delivery o para llevar</h2></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={17} /></button></header>

                <div className="grid min-h-0 flex-1 md:grid-cols-[250px_1fr]">
                    <section className="border-b border-neutral-100 p-4 dark:border-neutral-800 md:border-b-0 md:border-r">
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setType("TAKEAWAY")} className={cn("flex h-8 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium", type === "TAKEAWAY" ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 text-neutral-500 dark:border-neutral-800")}><ShoppingBag size={14} />Para llevar</button>
                            <button type="button" onClick={() => setType("DELIVERY")} className={cn("flex h-8 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium", type === "DELIVERY" ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 text-neutral-500 dark:border-neutral-800")}><Bike size={14} />Delivery</button>
                        </div>
                        <div className="mt-3 space-y-3"><label className="block text-sm"><span className="mb-1 block font-medium">Cliente</span><Input value={name} onChange={e => setName(e.target.value)} required className="h-9 rounded-lg" /></label><label className="block text-sm"><span className="mb-1 block font-medium">Teléfono</span><Input value={phone} onChange={e => setPhone(e.target.value)} className="h-9 rounded-lg" /></label>{type === "DELIVERY" && <label className="block text-sm"><span className="mb-1 block font-medium">Dirección</span><Input value={address} onChange={e => setAddress(e.target.value)} required className="h-9 rounded-lg" /></label>}</div>
                    </section>

                    <section className="min-h-0 overflow-y-auto p-4"><h3 className="mb-2 text-sm font-semibold">Productos</h3><div className="grid gap-2 sm:grid-cols-2">{data?.products.map(product => <button type="button" key={product.id} onClick={() => setCart(current => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }))} className="relative flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/40"><div className="min-w-0"><strong className="block truncate text-sm font-medium">{product.name}</strong><span className="text-xs text-neutral-400">{product.category.name}</span></div><b className="ml-3 text-sm font-medium">{money(product.price)}</b>{!!cart[product.id] && <span className="ml-2 text-xs font-semibold text-neutral-500">×{cart[product.id]}</span>}</button>)}</div></section>
                </div>

                <footer className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><span className="block text-xs text-neutral-400">{totalItems} productos</span><strong className="text-base font-semibold">{money(total)}</strong></div><Button type="submit" disabled={!selected.length} loading={mutation.isPending} className="h-9 rounded-lg px-4 text-sm">Enviar a cocina</Button></footer>
            </form>
        </div>
    );
}

function CreateReservation({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const { data: zones = [] } = useQuery({ queryKey: ["tables"], queryFn: () => api<Zone[]>("/api/tables") });
    const tables = zones.flatMap(zone => zone.tables).filter(table => table.status === "FREE");
    const tomorrow = new Date(Date.now() + 86_400_000);
    tomorrow.setHours(19, 0, 0, 0);
    const [form, setForm] = useState({ customerName: "", phone: "", partySize: 2, reservedFor: tomorrow.toISOString().slice(0, 16), tableId: "", notes: "" });

    const mutation = useMutation({
        mutationFn: () => api("/api/reservations", { method: "POST", body: JSON.stringify({ ...form, reservedFor: new Date(form.reservedFor).toISOString(), tableId: form.tableId || null }) }),
        onSuccess: () => { toast.success("Reserva registrada."); onCreated(); },
        onError: error => toast.error(error.message)
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
            <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }} className="relative w-full max-w-sm rounded-xl bg-white p-4 dark:bg-neutral-900">
                <button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={17} /></button>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Nueva reserva</span><h2 className="mt-0.5 text-lg font-semibold">Datos de la visita</h2>
                <div className="mt-3 space-y-3"><label className="block text-sm"><span className="mb-1 block font-medium">Cliente</span><Input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required className="h-9 rounded-lg" /></label><label className="block text-sm"><span className="mb-1 block font-medium">Teléfono</span><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required className="h-9 rounded-lg" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm"><span className="mb-1 block font-medium">Fecha y hora</span><Input type="datetime-local" value={form.reservedFor} onChange={e => setForm({ ...form, reservedFor: e.target.value })} required className="h-9 rounded-lg" /></label><label className="block text-sm"><span className="mb-1 block font-medium">Personas</span><Input type="number" min="1" value={form.partySize} onChange={e => setForm({ ...form, partySize: Number(e.target.value) })} className="h-9 rounded-lg" /></label></div><label className="block text-sm"><span className="mb-1 block font-medium">Mesa</span><select value={form.tableId} onChange={e => setForm({ ...form, tableId: e.target.value })} className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950"><option value="">Asignar después</option>{tables.map(table => <option key={table.id} value={table.id}>Mesa {table.number} · {table.capacity} personas</option>)}</select></label></div>
                <Button type="submit" loading={mutation.isPending} className="mt-3 h-9 w-full rounded-lg text-sm">Guardar reserva</Button>
            </form>
        </div>
    );
}