"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bike, CalendarDays, Check, Clock3, ExternalLink, MapPin, PackageCheck, Phone, Plus, ShoppingBag, Users } from "lucide-react";
import { toast } from "sonner";
import { api, money } from "@/lib/client-api";
import { Badge, Button, EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CreateExternalOrderDialog } from "@/components/operations/create-external-order-dialog";
import { CreateReservationDialog } from "@/components/operations/create-reservation-dialog";

type Reservation = { id: string; customerName: string; phone: string; partySize: number; reservedFor: string; status: string; notes?: string; table?: { id: string; number: number; zone: { name: string } } | null };
type ExternalOrder = { id: string; number: number; type: "TAKEAWAY" | "DELIVERY"; status: string; customerName: string; customerPhone?: string; deliveryAddress?: string; total: string; openedAt: string; items: Array<{ id: string; productName: string; quantity: number }>; delivery?: { status: string; recipientType: "SELF" | "OTHER"; mapsUrl?: string } | null };

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
                                        <Badge tone={order.status === "READY" ? "success" : order.status === "PREPARING" || (order.status === "NEW" && order.delivery?.recipientType === "OTHER") ? "warning" : "neutral"} className="rounded-md px-2 py-0 text-[10px]">{order.status === "NEW" && order.delivery?.recipientType === "OTHER" ? "ESPERANDO AUTORIZACIÓN" : order.delivery?.status ?? order.status}</Badge>
                                    </div>
                                    <div className="mt-1 flex items-center gap-2"><strong className="text-sm font-semibold text-neutral-900 dark:text-white">#{order.number}</strong><span className="truncate text-sm text-neutral-600 dark:text-neutral-300">{order.customerName}</span></div>
                                </div>
                                <strong className="text-sm font-semibold text-neutral-900 dark:text-white">{money(order.total)}</strong>
                            </div>

                            {(order.customerPhone || order.deliveryAddress || order.delivery?.mapsUrl) && <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-400">{order.customerPhone && <span className="flex items-center gap-1"><Phone size={12} />{order.customerPhone}</span>}{order.deliveryAddress && <span className="flex items-center gap-1"><MapPin size={12} />{order.deliveryAddress}</span>}{order.delivery?.mapsUrl && <a href={order.delivery.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">Abrir ubicación exacta<ExternalLink size={11} /></a>}</div>}

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

            {newOrder && <CreateExternalOrderDialog onClose={() => setNewOrder(false)} onCreated={() => { setNewOrder(false); void client.invalidateQueries({ queryKey: ["external-orders"] }); }} />}
            {newReservation && <CreateReservationDialog onClose={() => setNewReservation(false)} onCreated={() => { setNewReservation(false); void client.invalidateQueries({ queryKey: ["reservations"] }); }} />}
        </div>
    );
}
