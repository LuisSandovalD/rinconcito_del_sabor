"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, ChefHat, CircleDollarSign, ReceiptText, TableProperties } from "lucide-react";
import { api, money, shortTime } from "@/lib/client-api";
import { Badge, MiniStat, PageHeader, Skeleton, StatCard } from "@/components/ui";

type Dashboard = { sales: number; orders: number; averageTicket: number; occupied: number; free: number; kitchen: number; delayed: number; waitingPayment: number; lowStock: number; topProducts: Array<{ productName: string; _sum: { quantity: number; total: string } }>; recentOrders: Array<{ id: string; number: number; status: string; total: string; openedAt: string; table: { number: number } | null; waiter: { firstName: string } | null }> };

const statusLabel: Record<string, string> = { SENT: "Enviado", PREPARING: "Preparando", PARTIALLY_READY: "Parcial", READY: "Listo", DELIVERED: "Entregado", PENDING_PAYMENT: "Por cobrar", PAID: "Pagado" };

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/api/dashboard") });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  if (isLoading || !data) return <div className="space-y-4"><PageHeader title="Resumen operativo" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div></div>;

  const max = Math.max(...data.topProducts.map(item => item._sum.quantity), 1);
  const totalTables = Math.max(data.occupied + data.free, 1);
  const occupiedPercentage = data.occupied / totalTables * 100;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="RESUMEN" title={`${greeting}, equipo`} description="Estado actual del restaurante." />

      {data.delayed > 0 && <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300"><AlertTriangle size={17} /><span className="flex-1"><strong>{data.delayed} pedidos</strong> llevan más de 20 minutos en cocina.</span><a href="/kitchen" className="flex items-center gap-1 font-medium hover:underline">Ver cocina <ArrowUpRight size={14} /></a></div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard prominent icon={<CircleDollarSign size={17} />} label="Ventas de hoy" value={money(data.sales)} />
        <StatCard prominent icon={<ReceiptText size={17} />} label="Pedidos de hoy" value={String(data.orders)} detail={`Ticket ${money(data.averageTicket)}`} />
        <StatCard prominent icon={<TableProperties size={17} />} label="Mesas ocupadas" value={`${data.occupied}/${data.occupied + data.free}`} progress={occupiedPercentage} />
        <StatCard prominent icon={<ChefHat size={17} />} label="En cocina" value={String(data.kitchen)} detail={data.delayed ? `${data.delayed} demorados` : "A tiempo"} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">Actividad reciente</span><h2 className="text-base font-semibold text-neutral-900 dark:text-white">Pedidos de hoy</h2></div><a href="/orders" className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white">Ver todos <ArrowUpRight size={13} /></a></div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentOrders.map(order => <div key={order.id} className="grid grid-cols-[52px_1fr_auto_auto] items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"><span className="text-xs font-semibold text-neutral-500">#{order.number}</span><div className="min-w-0"><strong className="block truncate text-sm font-medium text-neutral-900 dark:text-white">{order.table ? `Mesa ${String(order.table.number).padStart(2, "0")}` : "Para llevar"}</strong><span className="text-xs text-neutral-400">{order.waiter?.firstName ?? "Equipo"} · {shortTime(order.openedAt)}</span></div><Badge tone={order.status === "READY" ? "success" : order.status === "PENDING_PAYMENT" ? "warning" : "info"} className="rounded-md px-2 py-0 text-[10px]">{statusLabel[order.status] ?? order.status}</Badge><strong className="text-sm font-semibold">{money(order.total)}</strong></div>)}
          </div>
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">Top productos</span><h2 className="text-base font-semibold text-neutral-900 dark:text-white">Más vendidos</h2></div>
          <div className="space-y-3 px-4 py-4">{data.topProducts.map((item, index) => <div key={item.productName} className="grid grid-cols-[22px_1fr_auto] items-center gap-3"><span className="text-xs font-medium text-neutral-400">{index + 1}</span><div className="min-w-0"><strong className="block truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{item.productName}</strong><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-neutral-500 dark:bg-neutral-400" style={{ width: `${item._sum.quantity / max * 100}%` }} /></div></div><span className="text-xs text-neutral-400">{item._sum.quantity} uds.</span></div>)}</div>
        </article>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <MiniStat label="Cuentas por cobrar" value={data.waitingPayment} />
        <MiniStat label="Pedidos en cocina" value={data.kitchen} />
        <MiniStat label="Insumos por revisar" value={data.lowStock} />
      </section>
    </div>
  );
}
