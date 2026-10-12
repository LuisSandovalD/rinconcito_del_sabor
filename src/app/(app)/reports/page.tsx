"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Download } from "lucide-react";
import { toast } from "sonner";
import { api, money, shortTime } from "@/lib/client-api";
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, Input, Pagination, PageHeader, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";

type Report = { total: number; count: number; average: number; daily: Array<{ date: string; total: number }>; payments: Array<{ method: string; _sum: { amount: string } }>; items: Array<{ productName: string; _sum: { quantity: number; total: string } }>; sales: Array<{ id: string; total: string; createdAt: string; order: { number: number; waiter?: { firstName: string } | null }; payments: Array<{ method: string }> }>; range: { from: string; to: string; page: number; pageSize: number; totalPages: number; totalSales: number } };

function prettyDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Lima" }).format(new Date(`${value}T12:00:00-05:00`));
}

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["reports", from, to, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      return api<Report>(`/api/reports?${params.toString()}`);
    }
  });

  const openRange = () => { setDraftFrom(data?.range.from ?? from); setDraftTo(data?.range.to ?? to); setRangeOpen(true); };
  const applyRange = () => {
    if (!draftFrom || !draftTo) return toast.error("Selecciona una fecha inicial y una fecha final.");
    if (draftFrom > draftTo) return toast.error("La fecha inicial no puede ser posterior a la fecha final.");
    setFrom(draftFrom); setTo(draftTo); setPage(1); setRangeOpen(false);
  };
  const resetRange = () => { setFrom(""); setTo(""); setPage(1); setRangeOpen(false); };

  if (isLoading || !data) return <div className="space-y-4"><PageHeader title="Reportes" /><Skeleton className="h-[520px] rounded-xl" /></div>;

  const maxDaily = Math.max(...data.daily.map(day => day.total), 1);
  const maxItem = Math.max(...data.items.map(item => item._sum.quantity), 1);
  const mainPayment = [...data.payments].sort((a, b) => Number(b._sum.amount) - Number(a._sum.amount))[0]?.method ?? "—";
  const rangeLabel = `${prettyDate(data.range.from)} — ${prettyDate(data.range.to)}`;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow={rangeLabel.toUpperCase()} title="Reportes de ventas" description="Rendimiento de ventas, productos y medios de pago." action={<div className="flex gap-2"><Button variant="outline" onClick={openRange} className="h-9 gap-2 rounded-lg px-3 text-sm"><CalendarDays size={15} />{rangeLabel}</Button><Button variant="outline" onClick={() => window.print()} className="h-9 gap-2 rounded-lg px-3 text-sm"><Download size={15} />Exportar</Button></div>} />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Ventas netas" value={money(data.total)} />
        <Metric label="Transacciones" value={String(data.count)} />
        <Metric label="Ticket promedio" value={money(data.average)} />
        <Metric label="Método principal" value={mainPayment} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">Rendimiento</span><h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Ventas por día</h2></div><BarChart3 size={16} className="text-neutral-400" /></div>
          {data.daily.length ? <div className="flex h-[220px] items-end gap-2 overflow-x-auto px-4 pb-4 pt-4">{data.daily.map(day => <div key={day.date} className="flex min-w-[48px] flex-1 flex-col items-center justify-end"><span className="mb-2 text-[10px] text-neutral-400">{money(day.total)}</span><div className="flex h-[145px] w-full items-end justify-center"><div className="w-6 rounded-t-sm bg-neutral-500 dark:bg-neutral-400" style={{ height: `${Math.max(8, day.total / maxDaily * 100)}%` }} /></div><span className="mt-2 text-[10px] capitalize text-neutral-400">{new Intl.DateTimeFormat("es-PE", { weekday: "short", timeZone: "America/Lima" }).format(new Date(`${day.date}T12:00:00-05:00`))}</span></div>)}</div> : <div className="p-4"><EmptyState icon={<BarChart3 />} title="Sin ventas en el período" detail="No se encontraron ventas para el rango seleccionado." /></div>}
        </article>

        <article className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">Top productos</span><h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Lo más vendido</h2></div>
          <div className="space-y-3 px-4 py-4">{data.items.map((item, index) => <div key={item.productName} className="grid grid-cols-[22px_1fr_auto] items-center gap-3"><span className="text-xs text-neutral-400">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><strong className="block truncate text-sm font-medium text-neutral-800 dark:text-neutral-100">{item.productName}</strong><div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-neutral-500 dark:bg-neutral-400" style={{ width: `${item._sum.quantity / maxItem * 100}%` }} /></div></div><span className="text-xs text-neutral-400">{item._sum.quantity} uds.</span></div>)}</div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">Detalle</span><h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Ventas del período</h2></div><span className="text-xs text-neutral-400">{data.range.totalSales} registros</span></div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 dark:bg-neutral-950/50">
                <TableHead className="h-9 text-xs font-semibold">Pedido</TableHead>
                <TableHead className="h-9 text-xs font-semibold">Responsable</TableHead>
                <TableHead className="h-9 text-xs font-semibold">Hora</TableHead>
                <TableHead className="h-9 text-xs font-semibold">Método</TableHead>
                <TableHead className="h-9 text-right text-xs font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sales.map(sale => <TableRow key={sale.id} className="hover:bg-neutral-50/70 dark:hover:bg-neutral-800/40"><TableCell className="py-2.5"><strong className="text-sm">#{sale.order.number}</strong></TableCell><TableCell className="py-2.5 text-sm">{sale.order.waiter?.firstName ?? "Equipo"}</TableCell><TableCell className="py-2.5 text-sm text-neutral-500">{shortTime(sale.createdAt)}</TableCell><TableCell className="py-2.5"><Badge tone="neutral" className="rounded-md px-2 py-0 text-[10px]">{sale.payments.map(payment => payment.method).join(" + ") || "—"}</Badge></TableCell><TableCell className="py-2.5 text-right text-sm font-semibold">{money(sale.total)}</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-800"><Pagination page={data.range.page} totalPages={data.range.totalPages} totalItems={data.range.totalSales} pageSize={data.range.pageSize} onPageChange={setPage} /></div>
      </section>

      <Dialog open={rangeOpen} onOpenChange={setRangeOpen}>
        <DialogContent className="max-w-sm rounded-xl p-4">
          <DialogHeader className="space-y-1"><DialogTitle className="text-lg">Rango del reporte</DialogTitle><DialogDescription>Selecciona las fechas que quieres analizar.</DialogDescription></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block font-medium">Desde</span><Input type="date" value={draftFrom} onChange={e => setDraftFrom(e.target.value)} className="h-9 rounded-lg" /></label><label className="text-sm"><span className="mb-1 block font-medium">Hasta</span><Input type="date" value={draftTo} onChange={e => setDraftTo(e.target.value)} className="h-9 rounded-lg" /></label></div>
          <DialogFooter className="gap-2"><Button variant="ghost" onClick={resetRange} className="h-9 rounded-lg">Últimos 7 días</Button><Button variant="outline" onClick={() => setRangeOpen(false)} className="h-9 rounded-lg">Cancelar</Button><Button onClick={applyRange} className="h-9 rounded-lg">Aplicar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">{label}</span><strong className="mt-1 block truncate text-lg font-semibold text-neutral-900 dark:text-white">{value}</strong></article>;
}