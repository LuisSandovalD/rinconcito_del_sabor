"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, ChefHat, ClipboardList, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { api, elapsed, money } from "@/lib/client-api";
import { Badge, Button, EmptyState, Pagination, PageHeader, Skeleton } from "@/components/ui";

type Order = { id: string; number: number; status: string; total: string; sentAt?: string; table?: { number: number; zone: { name: string } } | null; waiter?: { firstName: string } | null; items: Array<{ id: string; productName: string; quantity: number; status: string }> };

export default function OrdersPage() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);

  const { data = [], isLoading } = useQuery({ queryKey: ["orders", "active"], queryFn: () => api<Order[]>("/api/orders") });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ action }) }),
    onSuccess: () => { toast.success("Pedido actualizado."); void client.invalidateQueries({ queryKey: ["orders"] }); },
    onError: error => toast.error(error.message)
  });

  if (isLoading) return <div className="space-y-4"><PageHeader title="Pedidos activos" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}</div></div>;

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = data.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="SEGUIMIENTO" title="Pedidos activos" description="Seguimiento de pedidos desde cocina hasta la entrega." />

      {data.length ? <>
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(order => {
            const readyCount = order.items.filter(item => item.status === "READY").length;
            const progress = Math.round(readyCount / Math.max(order.items.length, 1) * 100);

            return (
              <article key={order.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <header className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <div><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">{order.table ? `Mesa ${String(order.table.number).padStart(2, "0")}` : "Para llevar"}</span><h3 className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-white">Pedido #{order.number}</h3></div>
                  <Badge tone={order.status === "READY" ? "success" : order.status === "PENDING_PAYMENT" ? "warning" : "neutral"} className="rounded-md px-2 py-0 text-[10px]">{order.status.replaceAll("_", " ")}</Badge>
                </header>

                <div className="px-4 py-3">
                  <div className="flex items-center gap-4 text-xs text-neutral-400"><span className="flex items-center gap-1.5"><Clock3 size={13} />{order.sentAt ? `${elapsed(order.sentAt)} min` : "Nuevo"}</span><span className="flex items-center gap-1.5"><ChefHat size={13} />{readyCount}/{order.items.length} listos</span><span className="ml-auto">{order.waiter?.firstName ?? "Equipo"}</span></div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-neutral-500 dark:bg-neutral-400 transition-all" style={{ width: `${progress}%` }} /></div>

                  <div className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                    {order.items.map(item => {
                      const ready = item.status === "READY";
                      return <div key={item.id} className="flex items-center gap-2 py-2 text-sm"><span className="min-w-6 font-medium text-neutral-500">{item.quantity}×</span><span className={`flex-1 truncate ${ready ? "line-through text-neutral-400" : "text-neutral-700 dark:text-neutral-300"}`}>{item.productName}</span>{ready && <Check size={13} className="text-neutral-400" />}</div>;
                    })}
                  </div>
                </div>

                <footer className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800">
                  <strong className="text-base font-semibold text-neutral-900 dark:text-white">{money(order.total)}</strong>
                  {order.status === "READY" && <Button onClick={() => mutation.mutate({ id: order.id, action: "deliver" })} className="h-8 gap-1.5 rounded-lg px-3 text-xs"><Check size={13} />Entregar</Button>}
                  {order.status === "DELIVERED" && <Button variant="outline" onClick={() => mutation.mutate({ id: order.id, action: "request_bill" })} className="h-8 gap-1.5 rounded-lg px-3 text-xs"><BellRing size={13} />Solicitar cuenta</Button>}
                </footer>
              </article>
            );
          })}
        </section>

        <div className="border-t border-neutral-200 pt-2 dark:border-neutral-800"><Pagination page={safePage} totalPages={totalPages} totalItems={data.length} pageSize={pageSize} onPageChange={setPage} /></div>
      </> : <EmptyState icon={<ClipboardList />} title="No hay pedidos activos" detail="Los pedidos enviados desde salón aparecerán aquí." />}
    </div>
  );
}