"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, CircleDollarSign, CreditCard, Download, ReceiptText, TrendingUp, Utensils } from "lucide-react";
import { toast } from "sonner";
import { api, money, shortTime } from "@/lib/client-api";
import {
  Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, EmptyState, Input, Pagination, PageHeader, Skeleton, Table, TableBody,
  TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui";

type Report = {
  total: number;
  count: number;
  average: number;
  daily: Array<{ date: string; total: number }>;
  payments: Array<{ method: string; _sum: { amount: string } }>;
  items: Array<{ productName: string; _sum: { quantity: number; total: string } }>;
  sales: Array<{ id: string; total: string; createdAt: string; order: { number: number; waiter?: { firstName: string } | null }; payments: Array<{ method: string }> }>;
  range: { from: string; to: string; page: number; pageSize: number; totalPages: number; totalSales: number };
};

function prettyDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Lima" })
    .format(new Date(`${value}T12:00:00-05:00`));
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

  const openRange = () => {
    setDraftFrom(data?.range.from ?? from);
    setDraftTo(data?.range.to ?? to);
    setRangeOpen(true);
  };

  const applyRange = () => {
    if (!draftFrom || !draftTo) {
      toast.error("Selecciona una fecha inicial y una fecha final.");
      return;
    }
    if (draftFrom > draftTo) {
      toast.error("La fecha inicial no puede ser posterior a la fecha final.");
      return;
    }
    setFrom(draftFrom);
    setTo(draftTo);
    setPage(1);
    setRangeOpen(false);
  };

  const resetRange = () => {
    setFrom("");
    setTo("");
    setPage(1);
    setRangeOpen(false);
  };

  if (isLoading || !data) return <div><PageHeader title="Reportes"/><Skeleton className="h-[560px] rounded-xl"/></div>;

  const maxDaily = Math.max(...data.daily.map(day => day.total), 1);
  const maxItem = Math.max(...data.items.map(item => item._sum.quantity), 1);
  const mainPayment = [...data.payments].sort((a, b) => Number(b._sum.amount) - Number(a._sum.amount))[0]?.method ?? "—";
  const rangeLabel = `${prettyDate(data.range.from)} — ${prettyDate(data.range.to)}`;

  return <div className="page-stack">
    <PageHeader
      eyebrow={rangeLabel.toUpperCase()}
      title="Reportes de ventas"
      description="Decisiones claras a partir de la operación real."
      action={<div className="report-actions">
        <Button variant="outline" onClick={openRange}><CalendarDays/> {rangeLabel}</Button>
        <Button variant="outline" onClick={() => window.print()}><Download/> Exportar</Button>
      </div>}
    />

    <section className="report-metrics">
      <article><CircleDollarSign/><span>VENTAS NETAS</span><strong>{money(data.total)}</strong></article>
      <article><ReceiptText/><span>TRANSACCIONES</span><strong>{data.count}</strong></article>
      <article><TrendingUp/><span>TICKET PROMEDIO</span><strong>{money(data.average)}</strong></article>
      <article><CreditCard/><span>MÉTODO PRINCIPAL</span><strong>{mainPayment}</strong></article>
    </section>

    <section className="reports-grid">
      <article className="panel sales-chart">
        <div className="panel-heading"><div><span>RENDIMIENTO</span><h2>Ventas por día</h2></div><BarChart3/></div>
        {data.daily.length ? <div className="bar-chart">{data.daily.map(day => <div key={day.date}>
          <strong>{money(day.total)}</strong>
          <i><b style={{ height: `${Math.max(8, (day.total / maxDaily) * 100)}%` }}/></i>
          <span>{new Intl.DateTimeFormat("es-PE", { weekday: "short", timeZone: "America/Lima" }).format(new Date(`${day.date}T12:00:00-05:00`))}</span>
        </div>)}</div> : <EmptyState icon={<BarChart3/>} title="Sin ventas en el período" detail="No se encontraron ventas para el rango seleccionado."/>}
      </article>

      <article className="panel">
        <div className="panel-heading"><div><span>TOP PRODUCTOS</span><h2>Lo más vendido</h2></div><Utensils/></div>
        <div className="ranking report-ranking">{data.items.map((item, index) => <div key={item.productName}>
          <span className="rank">{index + 1}</span>
          <div><strong>{item.productName}</strong><i><b style={{ width: `${item._sum.quantity / maxItem * 100}%` }}/></i></div>
          <span>{item._sum.quantity} uds.</span>
        </div>)}</div>
      </article>
    </section>

    <section className="panel sales-table overflow-hidden">
      <div className="panel-heading"><div><span>DETALLE</span><h2>Ventas del período</h2></div><Badge tone="neutral">{data.range.totalSales} registros</Badge></div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pedido</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.sales.map(sale => <TableRow key={sale.id}>
            <TableCell><strong>#{sale.order.number}</strong></TableCell>
            <TableCell>{sale.order.waiter?.firstName ?? "Equipo"}</TableCell>
            <TableCell className="text-muted-foreground">{shortTime(sale.createdAt)}</TableCell>
            <TableCell><Badge tone="info">{sale.payments.map(payment => payment.method).join(" + ") || "—"}</Badge></TableCell>
            <TableCell className="text-right font-semibold">{money(sale.total)}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
      <Pagination
        className="px-5"
        page={data.range.page}
        totalPages={data.range.totalPages}
        totalItems={data.range.totalSales}
        pageSize={data.range.pageSize}
        onPageChange={setPage}
      />
    </section>

    <Dialog open={rangeOpen} onOpenChange={setRangeOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rango del reporte</DialogTitle>
          <DialogDescription>Selecciona las fechas que quieres analizar. El rango incluye los días completos en horario de Perú.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>Desde<Input type="date" value={draftFrom} onChange={event => setDraftFrom(event.target.value)}/></label>
          <label>Hasta<Input type="date" value={draftTo} onChange={event => setDraftTo(event.target.value)}/></label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={resetRange}>Últimos 7 días</Button>
          <Button variant="outline" onClick={() => setRangeOpen(false)}>Cancelar</Button>
          <Button onClick={applyRange}>Aplicar rango</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
