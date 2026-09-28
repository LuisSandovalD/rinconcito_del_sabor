"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Calculator, CheckCircle2, CircleDollarSign, Clock3, CreditCard, Landmark, Plus, ReceiptText, Search, Smartphone, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { api, elapsed, money } from "@/lib/client-api";
import {
  Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, EmptyState, Input, PageHeader, Separator, Skeleton
} from "@/components/ui";

type Item = { id: string; productName: string; quantity: number; total: string };
type Order = { id: string; number: number; status: string; total: string; subtotal: string; discount: string; tax: string; deliveredAt?: string | null; requestedBillAt?: string | null; table?: { number: number; zone: { name: string } } | null; waiter?: { firstName: string } | null; items: Item[] };
type CashData = { registers: Array<{ id: string; name: string }>; session: null | { id: string; openingAmount: string; openedAt: string; register: { name: string }; movements: Array<{ id: string; type: string; amount: string; reference?: string | null; createdAt: string }> }; totals: Record<string, number> };
type Method = "CASH" | "YAPE" | "PLIN" | "CARD" | "TRANSFER" | "OTHER";
type PaymentRow = { id: string; method: Method; amount: number; receivedAmount?: number };

const methods: Array<{ id: Method; label: string; icon: typeof Banknote }> = [
  { id: "CASH", label: "Efectivo", icon: Banknote },
  { id: "YAPE", label: "Yape", icon: Smartphone },
  { id: "PLIN", label: "Plin", icon: Smartphone },
  { id: "CARD", label: "Tarjeta", icon: CreditCard },
  { id: "TRANSFER", label: "Transferencia", icon: Landmark },
  { id: "OTHER", label: "Otro", icon: WalletCards }
];

export default function CashPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [opening, setOpening] = useState(100);
  const [counted, setCounted] = useState(0);
  const [showClose, setShowClose] = useState(false);

  const { data: cash, isLoading: cashLoading } = useQuery({ queryKey: ["cash"], queryFn: () => api<CashData>("/api/cash") });
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", "cash"],
    queryFn: () => api<Order[]>("/api/orders?view=cash"),
    refetchInterval: 3_000,
    refetchIntervalInBackground: true
  });

  const visible = orders.filter(order => `${order.number} ${order.table?.number ?? ""}`.includes(search));
  const cashMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api("/api/cash", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, body) => {
      toast.success(body.action === "open" ? "Caja abierta. Ya puedes cobrar." : body.action === "close" ? "Caja cerrada correctamente." : "Movimiento registrado.");
      setShowClose(false);
      void client.invalidateQueries({ queryKey: ["cash"] });
    },
    onError: error => toast.error(error.message)
  });
  const paymentMutation = useMutation({
    mutationFn: () => api("/api/payments", { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), orderId: selected!.id, payments: payments.map(row => ({ method: row.method, amount: row.amount, receivedAmount: row.receivedAmount })) }) }),
    onSuccess: () => {
      toast.success("Pago registrado. La mesa ya está disponible.");
      setSelected(null);
      setPayments([]);
      void client.invalidateQueries({ queryKey: ["orders"] });
      void client.invalidateQueries({ queryKey: ["cash"] });
    },
    onError: error => toast.error(error.message)
  });

  const open = () => cash?.registers[0] && cashMutation.mutate({ action: "open", registerId: cash.registers[0].id, amount: opening, idempotencyKey: crypto.randomUUID() });
  const chooseOrder = (order: Order) => {
    setSelected(order);
    setPayments([{ id: crypto.randomUUID(), method: "CASH", amount: Number(order.total), receivedAmount: Number(order.total) }]);
  };
  const paidTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remaining = Math.max(0, Number(selected?.total ?? 0) - paidTotal);
  const updateRow = (id: string, patch: Partial<PaymentRow>) => setPayments(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));
  const expected = useMemo(() => Number(cash?.session?.openingAmount ?? 0) + (cash?.session?.movements ?? []).reduce((sum, movement) => ["EXPENSE", "WITHDRAWAL", "REFUND"].includes(movement.type) ? sum - Number(movement.amount) : sum + Number(movement.amount), 0), [cash]);

  if (cashLoading || isLoading) return <div><PageHeader title="Caja"/><div className="metric-grid">{Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-40 rounded-xl" key={i}/>)}</div></div>;

  if (!cash?.session) return <div className="cash-opening"><section>
    <div className="opening-icon"><CircleDollarSign/></div>
    <p className="eyebrow">INICIO DE TURNO</p>
    <h1>Abre tu caja</h1>
    <p>Registra el efectivo disponible para comenzar a cobrar.</p>
    <label>Caja seleccionada<div className="register-choice"><span><Calculator/></span><div><strong>{cash?.registers[0]?.name ?? "Caja principal"}</strong><small>Disponible</small></div><CheckCircle2/></div></label>
    <label>Monto inicial<Input type="number" min="0" step="0.1" value={opening} onChange={e => setOpening(Number(e.target.value))}/></label>
    <div className="cash-presets">{[0, 50, 100, 200].map(value => <Button variant="outline" size="sm" key={value} onClick={() => setOpening(value)}>{money(value)}</Button>)}</div>
    <Button onClick={open} loading={cashMutation.isPending}>Abrir caja y comenzar</Button>
    <small>Este movimiento quedará registrado en auditoría.</small>
  </section></div>;

  return <div className="page-stack">
    <PageHeader eyebrow="CAJA ABIERTA · EN VIVO" title="Cuentas por cobrar" description={`${cash.session.register.name} · Abierta hace ${elapsed(cash.session.openedAt)} min`} action={<Button variant="outline" onClick={() => setShowClose(true)}>Cerrar caja</Button>}/>

    <section className="cash-metrics">
      <article><span><CircleDollarSign/></span><div><small>EFECTIVO ESPERADO</small><strong>{money(expected)}</strong></div></article>
      <article><span><ReceiptText/></span><div><small>VENTAS REGISTRADAS</small><strong>{money(cash.totals.SALE ?? 0)}</strong></div></article>
      <article><span><Clock3/></span><div><small>CUENTAS PENDIENTES</small><strong>{orders.length}</strong></div></article>
    </section>

    <div className="search-field cash-search"><Search/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por mesa o número de pedido..."/></div>

    <section className="cash-orders">
      {visible.map(order => <article key={order.id}>
        <div className="cash-order-main">
          <div className="cash-table"><small>MESA</small><strong>{order.table ? String(order.table.number).padStart(2, "0") : "—"}</strong></div>
          <div><Badge tone={order.status === "PENDING_PAYMENT" ? "warning" : "info"}>{order.status === "PENDING_PAYMENT" ? "Cuenta solicitada" : "Lista para cobrar"}</Badge><h3>Pedido #{order.number}</h3><p>{order.items.reduce((sum, item) => sum + item.quantity, 0)} productos · {order.waiter?.firstName ?? "Equipo"}</p></div>
        </div>
        <div className="cash-order-total"><small>TOTAL A PAGAR</small><strong>{money(order.total)}</strong><Button onClick={() => chooseOrder(order)}>Cobrar ahora</Button></div>
      </article>)}
    </section>

    {!visible.length && <EmptyState icon={<ReceiptText/>} title="No hay cuentas pendientes" detail="Las mesas aparecerán automáticamente al solicitar la cuenta."/>}

    <Dialog open={Boolean(selected)} onOpenChange={openDialog => { if (!openDialog) { setSelected(null); setPayments([]); } }}>
      <DialogContent className="cash-payment-dialog max-w-[920px] overflow-hidden p-0">
        {selected && <>
          <DialogHeader className="cash-payment-header">
            <p className="eyebrow">REGISTRAR PAGO</p>
            <DialogTitle>Mesa {selected.table?.number} · Pedido #{selected.number}</DialogTitle>
            <DialogDescription>Registra uno o varios métodos de pago. El sistema calcula el saldo y el vuelto automáticamente.</DialogDescription>
          </DialogHeader>

          <div className="cash-payment-body">
            <section className="cash-receipt-panel">
              <h3>Detalle de consumo</h3>
              {selected.items.map(item => <div key={item.id}><span>{item.quantity}× {item.productName}</span><strong>{money(item.total)}</strong></div>)}
              <Separator/>
              <div><span>Subtotal</span><strong>{money(selected.subtotal)}</strong></div>
              <div><span>IGV incluido</span><strong>{money(selected.tax)}</strong></div>
              <div className="bill-total"><span>Total</span><strong>{money(selected.total)}</strong></div>
            </section>

            <section className="cash-payment-panel">
              <h3>¿Cómo pagará?</h3>
              {payments.map((row, index) => <div className="cash-payment-row" key={row.id}>
                <div className="cash-method-grid">{methods.map(method => <Button type="button" variant={row.method === method.id ? "default" : "outline"} key={method.id} onClick={() => updateRow(row.id, { method: method.id })}><method.icon/><span>{method.label}</span></Button>)}</div>
                <label>Monto<Input type="number" min="0.01" step="0.01" value={row.amount} onChange={e => updateRow(row.id, { amount: Number(e.target.value) })}/></label>
                {row.method === "CASH" && <label>Cliente entrega<Input type="number" min={row.amount} step="0.01" value={row.receivedAmount ?? row.amount} onChange={e => updateRow(row.id, { receivedAmount: Number(e.target.value) })}/></label>}
                {payments.length > 1 && <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setPayments(rows => rows.filter(item => item.id !== row.id))}><X/> Quitar</Button>}
                {row.method === "CASH" && (row.receivedAmount ?? 0) >= row.amount && <div className="change-line"><span>Vuelto</span><strong>{money((row.receivedAmount ?? 0) - row.amount)}</strong></div>}
                {index < payments.length - 1 && <Separator/>}
              </div>)}
              <Button type="button" variant="outline" onClick={() => setPayments(rows => [...rows, { id: crypto.randomUUID(), method: "YAPE", amount: remaining || Number(selected.total) }])}><Plus/> Agregar otro método</Button>
              <div className="cash-payment-summary"><div><span>Pagado</span><strong>{money(paidTotal)}</strong></div><div><span>Saldo</span><strong>{money(remaining)}</strong></div></div>
            </section>
          </div>

          <DialogFooter className="cash-payment-footer">
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button loading={paymentMutation.isPending} disabled={Math.abs(paidTotal - Number(selected.total)) > 0.009} onClick={() => paymentMutation.mutate()}><CheckCircle2/> Confirmar pago · {money(paidTotal)}</Button>
          </DialogFooter>
        </>}
      </DialogContent>
    </Dialog>

    <Dialog open={showClose} onOpenChange={setShowClose}>
      <DialogContent className="cash-close-dialog max-w-md">
        <DialogHeader>
          <p className="eyebrow">CIERRE DE TURNO</p>
          <DialogTitle>Cerrar caja</DialogTitle>
          <DialogDescription>El sistema espera {money(expected)}. Ingresa el efectivo contado antes de cerrar.</DialogDescription>
        </DialogHeader>
        <div className="cash-close-summary">
          <div><span>Esperado</span><strong>{money(expected)}</strong></div>
          <div><span>Contado</span><strong>{money(counted)}</strong></div>
        </div>
        <label className="cash-counted-field">Efectivo contado<Input autoFocus type="number" min="0" step="0.01" value={counted} onChange={e => setCounted(Number(e.target.value))}/></label>
        <div className={`cash-close-difference ${counted - expected === 0 ? "is-zero" : counted - expected > 0 ? "is-positive" : "is-negative"}`}><span>Diferencia</span><strong>{money(counted - expected)}</strong></div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowClose(false)}>Cancelar</Button>
          <Button variant="destructive" loading={cashMutation.isPending} onClick={() => cashMutation.mutate({ action: "close", sessionId: cash.session!.id, countedCash: counted })}>Cerrar caja</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
