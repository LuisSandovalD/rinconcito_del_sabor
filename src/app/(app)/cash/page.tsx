"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, Calculator, CheckCircle2, CircleDollarSign, Clock3, CreditCard, Landmark, Plus, ReceiptText, Search, Smartphone, WalletCards, X } from "lucide-react";
import { toast } from "sonner";
import { api, elapsed, money } from "@/lib/client-api";
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, EmptyState, Input, PageHeader, Separator, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  const { data: orders = [], isLoading } = useQuery({ queryKey: ["orders", "cash"], queryFn: () => api<Order[]>("/api/orders?view=cash"), refetchInterval: 3000, refetchIntervalInBackground: true });

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
  const chooseOrder = (order: Order) => { setSelected(order); setPayments([{ id: crypto.randomUUID(), method: "CASH", amount: Number(order.total), receivedAmount: Number(order.total) }]); };
  const paidTotal = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remaining = Math.max(0, Number(selected?.total ?? 0) - paidTotal);
  const updateRow = (id: string, patch: Partial<PaymentRow>) => setPayments(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row));
  const expected = useMemo(() => Number(cash?.session?.openingAmount ?? 0) + (cash?.session?.movements ?? []).reduce((sum, movement) => ["EXPENSE", "WITHDRAWAL", "REFUND"].includes(movement.type) ? sum - Number(movement.amount) : sum + Number(movement.amount), 0), [cash]);

  if (cashLoading || isLoading) return <div className="space-y-4"><PageHeader title="Caja" /><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-20 rounded-xl" key={i} />)}</div></div>;

  if (!cash?.session) return (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center">
      <section className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-2"><CircleDollarSign size={18} className="text-neutral-400" /><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Inicio de turno</span></div>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">Abrir caja</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Registra el efectivo disponible para comenzar.</p>
        <label className="mt-4 block text-sm"><span className="mb-1 block font-medium">Caja</span><div className="flex items-center gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800"><Calculator size={16} className="text-neutral-400" /><div className="flex-1"><strong className="block text-sm font-medium">{cash?.registers[0]?.name ?? "Caja principal"}</strong><span className="text-xs text-neutral-400">Disponible</span></div><CheckCircle2 size={16} className="text-neutral-400" /></div></label>
        <label className="mt-3 block text-sm"><span className="mb-1 block font-medium">Monto inicial</span><Input type="number" min="0" step="0.1" value={opening} onChange={e => setOpening(Number(e.target.value))} className="h-9 rounded-lg" /></label>
        <div className="mt-2 flex gap-2">{[0, 50, 100, 200].map(value => <Button variant="outline" size="sm" key={value} onClick={() => setOpening(value)} className="h-8 flex-1 rounded-lg text-xs">{money(value)}</Button>)}</div>
        <Button onClick={open} loading={cashMutation.isPending} className="mt-3 h-9 w-full rounded-lg">Abrir caja</Button>
        <span className="mt-2 block text-center text-[11px] text-neutral-400">El movimiento quedará registrado en auditoría.</span>
      </section>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="CAJA ABIERTA" title="Cuentas por cobrar" description={`${cash.session.register.name} · ${elapsed(cash.session.openedAt)} min abierta`} action={<Button variant="outline" onClick={() => setShowClose(true)} className="h-9 rounded-lg px-3 text-sm">Cerrar caja</Button>} />

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Efectivo esperado" value={money(expected)} />
        <Metric label="Ventas registradas" value={money(cash.totals.SALE ?? 0)} />
        <Metric label="Cuentas pendientes" value={String(orders.length)} />
      </section>

      <div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar mesa o pedido..." className="h-9 rounded-lg pl-9 text-sm" /></div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {visible.map((order, index) => (
          <article key={order.id} className={cn("flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between", index !== visible.length - 1 && "border-b border-neutral-100 dark:border-neutral-800")}>
            <div className="flex items-center gap-3">
              <div className="w-11 text-center"><span className="block text-[9px] uppercase text-neutral-400">Mesa</span><strong className="text-lg font-semibold">{order.table ? String(order.table.number).padStart(2, "0") : "—"}</strong></div>
              <div><div className="flex items-center gap-2"><h3 className="text-sm font-medium">Pedido #{order.number}</h3><Badge tone={order.status === "PENDING_PAYMENT" ? "warning" : "neutral"} className="rounded-md px-2 py-0 text-[10px]">{order.status === "PENDING_PAYMENT" ? "Cuenta solicitada" : "Lista para cobrar"}</Badge></div><p className="mt-0.5 text-xs text-neutral-400">{order.items.reduce((sum, item) => sum + item.quantity, 0)} productos · {order.waiter?.firstName ?? "Equipo"}</p></div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end"><strong className="text-base font-semibold">{money(order.total)}</strong><Button onClick={() => chooseOrder(order)} className="h-8 rounded-lg px-3 text-xs">Cobrar</Button></div>
          </article>
        ))}
      </section>

      {!visible.length && <EmptyState icon={<ReceiptText />} title="No hay cuentas pendientes" detail="Las mesas aparecerán al solicitar la cuenta." />}

      <Dialog open={Boolean(selected)} onOpenChange={openDialog => { if (!openDialog) { setSelected(null); setPayments([]); } }}>
        <DialogContent className="max-w-[820px] overflow-hidden rounded-xl p-0">
          {selected && <>
            <DialogHeader className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Registrar pago</span><DialogTitle className="text-lg">Mesa {selected.table?.number} · Pedido #{selected.number}</DialogTitle><DialogDescription>Registra uno o varios métodos de pago.</DialogDescription></DialogHeader>

            <div className="grid max-h-[65dvh] overflow-y-auto md:grid-cols-[260px_1fr]">
              <section className="border-b border-neutral-100 p-4 dark:border-neutral-800 md:border-b-0 md:border-r">
                <h3 className="mb-3 text-sm font-semibold">Consumo</h3>
                <div className="space-y-2">{selected.items.map(item => <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-neutral-500">{item.quantity}× {item.productName}</span><strong className="font-medium">{money(item.total)}</strong></div>)}</div>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><strong>{money(selected.subtotal)}</strong></div><div className="flex justify-between"><span className="text-neutral-500">IGV incluido</span><strong>{money(selected.tax)}</strong></div><div className="flex justify-between border-t border-neutral-100 pt-2 dark:border-neutral-800"><span className="font-semibold">Total</span><strong className="text-lg">{money(selected.total)}</strong></div></div>
              </section>

              <section className="p-4">
                <h3 className="mb-3 text-sm font-semibold">Método de pago</h3>
                <div className="space-y-4">
                  {payments.map((row, index) => (
                    <div key={row.id}>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{methods.map(method => <Button type="button" variant={row.method === method.id ? "default" : "outline"} key={method.id} onClick={() => updateRow(row.id, { method: method.id })} className="h-auto flex-col gap-1 rounded-lg px-2 py-2 text-[11px]"><method.icon size={14} />{method.label}</Button>)}</div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block font-medium">Monto</span><Input type="number" min="0.01" step="0.01" value={row.amount} onChange={e => updateRow(row.id, { amount: Number(e.target.value) })} className="h-9 rounded-lg" /></label>{row.method === "CASH" && <label className="text-sm"><span className="mb-1 block font-medium">Cliente entrega</span><Input type="number" min={row.amount} step="0.01" value={row.receivedAmount ?? row.amount} onChange={e => updateRow(row.id, { receivedAmount: Number(e.target.value) })} className="h-9 rounded-lg" /></label>}</div>
                      <div className="mt-2 flex items-center justify-between">{payments.length > 1 && <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs text-red-500" onClick={() => setPayments(rows => rows.filter(item => item.id !== row.id))}><X size={13} />Quitar</Button>}{row.method === "CASH" && (row.receivedAmount ?? 0) >= row.amount && <span className="ml-auto text-xs text-neutral-500">Vuelto <strong className="ml-1 text-neutral-900 dark:text-white">{money((row.receivedAmount ?? 0) - row.amount)}</strong></span>}</div>
                      {index < payments.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={() => setPayments(rows => [...rows, { id: crypto.randomUUID(), method: "YAPE", amount: remaining || Number(selected.total) }])} className="mt-3 h-8 gap-1.5 rounded-lg text-xs"><Plus size={14} />Agregar método</Button>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm dark:border-neutral-800"><span className="text-neutral-500">Pagado <strong className="ml-1 text-neutral-900 dark:text-white">{money(paidTotal)}</strong></span><span className="text-neutral-500">Saldo <strong className={cn("ml-1", remaining > 0 ? "text-amber-600" : "text-neutral-900 dark:text-white")}>{money(remaining)}</strong></span></div>
              </section>
            </div>

            <DialogFooter className="border-t border-neutral-100 px-4 py-3 dark:border-neutral-800"><Button variant="outline" onClick={() => setSelected(null)} className="h-9 rounded-lg">Cancelar</Button><Button loading={paymentMutation.isPending} disabled={Math.abs(paidTotal - Number(selected.total)) > 0.009} onClick={() => paymentMutation.mutate()} className="h-9 gap-2 rounded-lg"><CheckCircle2 size={16} />Confirmar pago · {money(paidTotal)}</Button></DialogFooter>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={showClose} onOpenChange={setShowClose}>
        <DialogContent className="max-w-sm rounded-xl p-4">
          <DialogHeader className="space-y-1"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Cierre de turno</span><DialogTitle className="text-lg">Cerrar caja</DialogTitle><DialogDescription>El sistema espera {money(expected)}.</DialogDescription></DialogHeader>
          <div className="mt-2 flex items-center justify-between text-sm"><span className="text-neutral-500">Esperado <strong className="ml-1 text-neutral-900 dark:text-white">{money(expected)}</strong></span><span className="text-neutral-500">Contado <strong className="ml-1 text-neutral-900 dark:text-white">{money(counted)}</strong></span></div>
          <label className="mt-3 block text-sm"><span className="mb-1 block font-medium">Efectivo contado</span><Input autoFocus type="number" min="0" step="0.01" value={counted} onChange={e => setCounted(Number(e.target.value))} className="h-9 rounded-lg" /></label>
          <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm dark:border-neutral-800"><span className="text-neutral-500">Diferencia</span><strong className={cn(counted - expected < 0 && "text-red-500", counted - expected > 0 && "text-amber-600")}>{money(counted - expected)}</strong></div>
          <DialogFooter className="mt-2"><Button variant="outline" onClick={() => setShowClose(false)} className="h-9 rounded-lg">Cancelar</Button><Button variant="destructive" loading={cashMutation.isPending} onClick={() => cashMutation.mutate({ action: "close", sessionId: cash.session!.id, countedCash: counted })} className="h-9 rounded-lg">Cerrar caja</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <article className="rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">{label}</span><strong className="mt-1 block text-lg font-semibold text-neutral-900 dark:text-white">{value}</strong></article>;
}