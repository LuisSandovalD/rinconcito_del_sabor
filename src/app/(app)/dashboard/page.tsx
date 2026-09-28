"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowUpRight, ChefHat, CircleDollarSign, Clock3, ReceiptText, Sparkles, TableProperties, TrendingUp, Users, UtensilsCrossed } from "lucide-react";
import { api, money, shortTime } from "@/lib/client-api";
import { Badge, PageHeader, Skeleton } from "@/components/ui";

type Dashboard = { sales: number; orders: number; averageTicket: number; occupied: number; free: number; kitchen: number; delayed: number; waitingPayment: number; lowStock: number; topProducts: Array<{ productName: string; _sum: { quantity: number; total: string } }>; recentOrders: Array<{ id: string; number: number; status: string; total: string; openedAt: string; table: { number: number } | null; waiter: { firstName: string } | null }> };
const statusLabel: Record<string, string> = { SENT: "Enviado", PREPARING: "Preparando", PARTIALLY_READY: "Parcial", READY: "Listo", DELIVERED: "Entregado", PENDING_PAYMENT: "Por cobrar", PAID: "Pagado" };

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => api<Dashboard>("/api/dashboard") });
  const hour = new Date().getHours(); const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  if (isLoading || !data) return <div><PageHeader eyebrow="COMMAND CENTER" title="Resumen operativo"/><div className="metric-grid">{Array.from({ length: 4 }).map((_, i) => <Skeleton className="h-40 rounded-3xl" key={i}/>)}</div></div>;
  const max = Math.max(...data.topProducts.map(item => item._sum.quantity), 1);
  return <div className="page-stack"><PageHeader eyebrow="COMMAND CENTER" title={`${greeting}, equipo`} description="Esto es lo que está pasando ahora en el restaurante." action={<div className="date-chip"><span/> EN VIVO · {new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "long" }).format(new Date()).toUpperCase()}</div>}/>
    {data.delayed > 0 && <div className="attention-banner"><div><AlertTriangle size={22}/></div><span><strong>{data.delayed} pedidos necesitan atención</strong><small>Llevan más de 20 minutos en cocina.</small></span><a href="/kitchen">Ver en cocina <ArrowUpRight size={16}/></a></div>}
    <section className="metric-grid">
      <article className="metric-card metric-featured"><div className="metric-icon"><CircleDollarSign/></div><span>VENTAS DE HOY</span><strong>{money(data.sales)}</strong><small><TrendingUp size={14}/> Operación en tiempo real</small><Sparkles className="metric-spark"/></article>
      <article className="metric-card"><div className="metric-top"><div className="metric-icon mint"><ReceiptText/></div><Badge tone="success">+{data.orders}</Badge></div><span>PEDIDOS DE HOY</span><strong>{data.orders}</strong><small>Ticket promedio {money(data.averageTicket)}</small></article>
      <article className="metric-card"><div className="metric-top"><div className="metric-icon blue"><TableProperties/></div><Badge tone="info">{data.free} libres</Badge></div><span>MESAS OCUPADAS</span><strong>{data.occupied}<small> / {data.occupied + data.free}</small></strong><div className="mini-progress"><i style={{ width: `${(data.occupied / Math.max(data.occupied + data.free, 1)) * 100}%` }}/></div></article>
      <article className="metric-card"><div className="metric-top"><div className="metric-icon amber"><ChefHat/></div><Badge tone={data.delayed ? "danger" : "success"}>{data.delayed ? `${data.delayed} demorados` : "A tiempo"}</Badge></div><span>EN COCINA</span><strong>{data.kitchen}</strong><small><Clock3 size={14}/> Pedidos activos</small></article>
    </section>
    <section className="dashboard-grid"><article className="panel live-orders"><div className="panel-heading"><div><span className="live-dot"/> ACTIVIDAD RECIENTE<h2>Pedidos de hoy</h2></div><a href="/orders">Ver todos <ArrowUpRight size={15}/></a></div><div className="order-list">{data.recentOrders.map(order => <div className="order-row" key={order.id}><div className="order-number">#{order.number}</div><div><strong>{order.table ? `Mesa ${String(order.table.number).padStart(2, "0")}` : "Para llevar"}</strong><span>{order.waiter?.firstName ?? "Equipo"} · {shortTime(order.openedAt)}</span></div><Badge tone={order.status === "READY" ? "success" : order.status === "PENDING_PAYMENT" ? "warning" : "info"}>{statusLabel[order.status] ?? order.status}</Badge><strong>{money(order.total)}</strong></div>)}</div></article>
      <article className="panel"><div className="panel-heading"><div><span>MÁS PEDIDOS</span><h2>Favoritos del día</h2></div><UtensilsCrossed size={21}/></div><div className="ranking">{data.topProducts.map((item, index) => <div key={item.productName}><span className="rank">{index + 1}</span><div><strong>{item.productName}</strong><i><b style={{ width: `${(item._sum.quantity / max) * 100}%` }}/></i></div><span>{item._sum.quantity} uds.</span></div>)}</div></article>
    </section>
    <section className="quick-stats"><div><Users/><span><strong>{data.waitingPayment}</strong> cuentas por cobrar</span></div><div><Clock3/><span><strong>{data.kitchen}</strong> pedidos en cocina</span></div><div><AlertTriangle/><span><strong>{data.lowStock}</strong> insumos por revisar</span></div></section>
  </div>;
}
