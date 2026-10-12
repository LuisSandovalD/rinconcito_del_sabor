"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, ChefHat, Clock3, Flame, Maximize, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { api, elapsed } from "@/lib/client-api";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

type Item = { id: string; productName: string; quantity: number; status: string; notes?: string | null; modifiers: Array<{ name: string }>; product: { station?: { id: string; name: string } | null } };
type Order = { id: string; number: number; status: string; priority: string; sentAt: string; openedAt: string; notes?: string | null; table?: { number: number } | null; waiter?: { firstName: string; lastName: string } | null; items: Item[]; tickets: Array<{ station: { id: string; name: string } }> };

function timerLabel(minutes: number, tick: number) {
  const seconds = Math.floor(tick / 1000) % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function KitchenPage() {
  const client = useQueryClient();
  const [station, setStation] = useState("all");
  const [tick, setTick] = useState(0);
  const [sound, setSound] = useState(true);
  const previousCount = useRef<number | undefined>(undefined);

  const { data: orders = [], isLoading } = useQuery({ queryKey: ["orders", "kitchen"], queryFn: () => api<Order[]>("/api/orders?view=kitchen"), refetchInterval: 2000, refetchIntervalInBackground: true, refetchOnReconnect: "always", refetchOnWindowFocus: "always", staleTime: 0 });

  useEffect(() => { const interval = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(interval); }, []);

  useEffect(() => {
    if (previousCount.current !== undefined && orders.length > previousCount.current && sound) {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.frequency.value = 660;
      gain.gain.value = 0.08;
      oscillator.start();
      oscillator.stop(context.currentTime + 0.16);
    }
    previousCount.current = orders.length;
  }, [orders.length, sound]);

  const stations = useMemo(() => [...new Map(orders.flatMap(order => order.tickets.map(ticket => [ticket.station.id, ticket.station.name] as const))).entries()], [orders]);
  const filtered = useMemo(() => orders.map(order => ({ ...order, items: station === "all" ? order.items : order.items.filter(item => item.product.station?.id === station) })).filter(order => order.items.length), [orders, station]);

  const mutation = useMutation({
    mutationFn: ({ url, body }: { url: string; body?: object }) => api(url, { method: "PATCH", ...(body ? { body: JSON.stringify(body) } : {}) }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["orders"] }),
    onError: error => toast.error(error.message)
  });

  const markAll = async (order: Order) => {
    const pending = order.items.filter(item => item.status !== "READY" && item.status !== "DELIVERED");
    for (const item of pending) await mutation.mutateAsync({ url: `/api/orders/${order.id}/items/${item.id}/ready` });
    toast.success(`Pedido #${order.number} listo para entregar.`);
  };

  return (
    <main className="min-h-dvh bg-neutral-950 text-white">
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-neutral-950">
        <div className="flex h-14 items-center gap-3 px-4">
          <div className="flex items-center gap-2"><ChefHat size={18} className="text-neutral-300" /><div><strong className="block text-sm font-semibold">Cocina</strong><span className="block text-[10px] text-neutral-500">Kitchen Display System</span></div></div>
          <div className="ml-4 hidden items-center gap-4 text-xs text-neutral-400 lg:flex"><span>Nuevas <strong className="ml-1 text-neutral-200">{orders.filter(order => order.status === "SENT").length}</strong></span><span>Preparando <strong className="ml-1 text-neutral-200">{orders.filter(order => ["PREPARING", "PARTIALLY_READY"].includes(order.status)).length}</strong></span><span>Listas <strong className="ml-1 text-neutral-200">{orders.filter(order => order.status === "READY").length}</strong></span></div>
          <div className="ml-auto flex items-center gap-1"><button type="button" onClick={() => setSound(value => !value)} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-white" aria-label="Cambiar sonido">{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}</button><button type="button" onClick={() => document.documentElement.requestFullscreen?.()} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-900 hover:text-white" aria-label="Pantalla completa"><Maximize size={16} /></button><div className="ml-1 flex h-8 items-center gap-1.5 rounded-md border border-neutral-800 px-2.5 text-xs text-neutral-400"><Clock3 size={14} />{new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(tick))}</div></div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto border-t border-neutral-900 px-4 py-2">
          <button type="button" onClick={() => setStation("all")} className={cn("h-7 shrink-0 rounded-md px-2.5 text-xs font-medium transition", station === "all" ? "bg-neutral-200 text-neutral-950" : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200")}>Todas <span className="ml-1 opacity-60">{orders.length}</span></button>
          {stations.map(([id, name]) => <button type="button" key={id} onClick={() => setStation(id)} className={cn("h-7 shrink-0 rounded-md px-2.5 text-xs font-medium transition", station === id ? "bg-neutral-200 text-neutral-950" : "text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200")}>{name}</button>)}
          <span className="ml-auto hidden text-[10px] text-neutral-600 md:block">Actualización automática</span>
        </div>
      </header>

      <div className="p-3">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[480px] rounded-xl bg-neutral-900" />)}</div>
        ) : !filtered.length ? (
          <div className="mt-12"><EmptyState icon={<ChefHat />} title="Cocina al día" detail="Las nuevas comandas aparecerán aquí automáticamente." /></div>
        ) : (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map(order => {
              const minutes = elapsed(order.sentAt);
              const done = order.items.filter(item => ["READY", "DELIVERED"].includes(item.status)).length;
              const urgent = minutes >= 20;
              const warning = minutes >= 10;
              const ready = order.status === "READY";

              return (
                <article key={order.id} className={cn("overflow-hidden rounded-xl border bg-neutral-900", urgent ? "border-red-500/50" : warning ? "border-amber-500/40" : ready ? "border-emerald-500/40" : "border-neutral-800")}>
                  <div className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
                    <span className={cn("text-[10px] font-medium uppercase tracking-[0.12em]", urgent ? "text-red-400" : warning ? "text-amber-400" : ready ? "text-emerald-400" : "text-neutral-500")}>{order.priority !== "NORMAL" ? order.priority : `Orden #${order.number}`}</span>
                    <span className="max-w-[55%] truncate text-right text-[10px] text-neutral-600">{order.tickets.map(ticket => ticket.station.name).join(" · ")}</span>
                  </div>

                  <header className="flex items-center justify-between px-3 py-3">
                    <div><span className="block text-[9px] uppercase tracking-[0.14em] text-neutral-600">{order.table ? "Mesa" : "Pedido"}</span><strong className="text-3xl font-semibold tracking-tight">{order.table ? String(order.table.number).padStart(2, "0") : "LLEVAR"}</strong></div>
                    <div className="text-right"><div className={cn("flex items-center justify-end gap-1.5", urgent ? "text-red-400" : warning ? "text-amber-400" : "text-neutral-300")}><Clock3 size={14} /><strong className="font-mono text-base">{timerLabel(minutes, tick)}</strong></div><span className="block text-[9px] uppercase tracking-wider text-neutral-600">{urgent ? "Demorado" : warning ? "Atención" : "En tiempo"}</span></div>
                  </header>

                  <div className="px-3 pb-3">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500"><span>{done} de {order.items.length} listos</span><span>{Math.round(done / Math.max(order.items.length, 1) * 100)}%</span></div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-800"><div className="h-full bg-neutral-400 transition-all" style={{ width: `${done / Math.max(order.items.length, 1) * 100}%` }} /></div>
                  </div>

                  <div className="divide-y divide-neutral-800 border-y border-neutral-800">
                    {order.items.map(item => {
                      const itemDone = ["READY", "DELIVERED"].includes(item.status);
                      return (
                        <button type="button" key={item.id} disabled={itemDone || order.status === "SENT"} onClick={() => mutation.mutate({ url: `/api/orders/${order.id}/items/${item.id}/ready` })} className={cn("flex w-full items-start gap-3 px-3 py-2.5 text-left transition", !itemDone && order.status !== "SENT" && "hover:bg-neutral-800/50", itemDone && "opacity-50")}>
                          <span className="min-w-6 text-base font-semibold text-neutral-400">{item.quantity}×</span>
                          <div className="min-w-0 flex-1"><strong className={cn("block text-sm font-medium text-neutral-100", itemDone && "line-through")}>{item.productName}</strong>{item.modifiers.map(mod => <span key={mod.name} className="mt-0.5 block text-xs text-neutral-500">• {mod.name}</span>)}{item.notes && <span className="mt-1 block text-xs text-neutral-400">{item.notes}</span>}</div>
                          <span className="mt-0.5 flex h-6 min-w-10 items-center justify-center rounded-md border border-neutral-700 px-2 text-[9px] font-medium text-neutral-500">{itemDone ? <Check size={13} /> : "LISTO"}</span>
                        </button>
                      );
                    })}
                  </div>

                  <footer className="flex items-center gap-3 px-3 py-2.5">
                    <div className="min-w-0 flex-1"><span className="block text-[9px] uppercase tracking-wider text-neutral-600">Mesero</span><strong className="block truncate text-xs font-medium text-neutral-300">{order.waiter?.firstName ?? "Equipo"}</strong></div>
                    {order.status === "SENT" ? <Button loading={mutation.isPending} onClick={() => mutation.mutate({ url: `/api/orders/${order.id}/status`, body: { action: "start" } })} className="h-8 gap-1.5 rounded-md px-3 text-xs"><Flame size={13} />Iniciar</Button> : order.status === "READY" ? <div className="flex h-8 items-center gap-1.5 rounded-md border border-neutral-700 px-3 text-xs font-medium text-neutral-300"><BellRing size={13} />Listo para entregar</div> : <Button loading={mutation.isPending} onClick={() => void markAll(order)} className="h-8 gap-1.5 rounded-md px-3 text-xs"><Check size={13} />Todo listo</Button>}
                  </footer>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}