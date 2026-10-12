"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, PencilLine, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, EmptyState, Input, NativeSelect, Pagination, PageHeader, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from "@/components/ui";

type Ingredient = { id: string; name: string; unit: string; stock: string; minStock?: string; averageCost: string; movements: Array<{ id: string; type: string; quantity: string; createdAt: string }> };

export default function InventoryPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState("PURCHASE");
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);

  const { data = [], isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => api<Ingredient[]>("/api/inventory") });

  const mutation = useMutation({
    mutationFn: () => api("/api/inventory", { method: "POST", body: JSON.stringify({ ingredientId: selected!.id, quantity, type, reason, idempotencyKey: crypto.randomUUID() }) }),
    onSuccess: () => { toast.success("Stock actualizado y auditado."); setSelected(null); setQuantity(0); setReason(""); void client.invalidateQueries({ queryKey: ["inventory"] }); },
    onError: error => toast.error(error.message)
  });

  const low = data.filter(item => item.minStock && Number(item.stock) <= Number(item.minStock));
  const value = data.reduce((sum, item) => sum + Number(item.stock) * Number(item.averageCost), 0);
  const filtered = data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openMovement = (item: Ingredient) => { setSelected(item); setQuantity(0); setType("PURCHASE"); setReason(""); };

  if (isLoading) return <div className="space-y-4"><PageHeader title="Inventario" /><Skeleton className="h-[500px] rounded-xl" /></div>;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="CONTROL DE INSUMOS" title="Inventario" description="Stock, alertas y movimientos." action={<Button onClick={() => data[0] && openMovement(data[0])} disabled={!data.length} className="h-9 gap-2 rounded-lg px-3 text-sm"><PencilLine size={15} />Registrar movimiento</Button>} />

      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Insumos activos" value={String(data.length)} />
        <Metric label="Bajo mínimo" value={String(low.length)} warning={low.length > 0} />
        <Metric label="Valor estimado" value={`S/ ${value.toFixed(2)}`} />
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar ingrediente..." className="h-9 rounded-lg pl-9 text-sm" /></div>
        <span className="hidden text-xs text-neutral-400 sm:block">{filtered.length} insumos</span>
      </div>

      {data.length ? (
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 dark:bg-neutral-950/50">
                  <TableHead className="h-10 text-xs font-semibold">Ingrediente</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Stock actual</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Stock mínimo</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Estado</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Último movimiento</TableHead>
                  <TableHead className="h-10 w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(item => {
                  const isLow = Boolean(item.minStock && Number(item.stock) <= Number(item.minStock));
                  const last = item.movements[0];
                  const incoming = last ? Number(last.quantity) >= 0 : false;
                  return (
                    <TableRow key={item.id} onClick={() => openMovement(item)} className="cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <TableCell className="py-2.5"><strong className="text-sm font-medium text-neutral-900 dark:text-white">{item.name}</strong></TableCell>
                      <TableCell className="py-2.5"><span className="text-sm font-semibold text-neutral-900 dark:text-white">{Number(item.stock).toFixed(2)}</span><span className="ml-1 text-xs text-neutral-400">{item.unit}</span></TableCell>
                      <TableCell className="py-2.5 text-sm text-neutral-500 dark:text-neutral-400">{item.minStock ? `${Number(item.minStock).toFixed(2)} ${item.unit}` : "—"}</TableCell>
                      <TableCell className="py-2.5"><Badge tone={isLow ? "danger" : "neutral"} className="rounded-md px-2 py-0 text-[10px]">{isLow ? "Reponer" : "Correcto"}</Badge></TableCell>
                      <TableCell className="py-2.5">
                        {last ? <div className="flex items-center gap-2">{incoming ? <ArrowUpRight size={14} className="text-neutral-400" /> : <ArrowDownRight size={14} className="text-neutral-400" />}<div><span className="block text-xs font-medium capitalize text-neutral-700 dark:text-neutral-200">{last.type.replaceAll("_", " ").toLowerCase()}</span><span className="text-[11px] text-neutral-400">{incoming ? "+" : ""}{Number(last.quantity).toFixed(2)} {item.unit}</span></div></div> : <span className="text-xs text-neutral-400">Sin movimientos</span>}
                      </TableCell>
                      <TableCell className="py-2.5"><PencilLine size={14} className="text-neutral-400" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-800"><Pagination page={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} /></div>
        </section>
      ) : <EmptyState icon={<Boxes />} title="Inventario vacío" detail="Agrega ingredientes para comenzar el control." />}

      {data.length > 0 && !visible.length && <EmptyState icon={<Search />} title="Sin resultados" detail="No encontramos ingredientes con ese nombre." />}

      <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-sm rounded-xl p-4">
          {selected && <>
            <DialogHeader className="space-y-1"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Movimiento de inventario</span><DialogTitle className="text-lg">{selected.name}</DialogTitle><DialogDescription>Stock actual: {Number(selected.stock).toFixed(2)} {selected.unit}</DialogDescription></DialogHeader>
            <form className="mt-2 grid gap-3" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
              <label className="text-sm"><span className="mb-1 block font-medium">Tipo</span><NativeSelect value={type} onChange={e => setType(e.target.value)} className="h-9 rounded-lg"><option value="PURCHASE">Ingreso / compra</option><option value="ADJUSTMENT">Ajuste</option><option value="LOSS">Pérdida</option><option value="DAMAGE">Deterioro</option><option value="EXPIRATION">Vencimiento</option></NativeSelect></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Cantidad ({selected.unit})</span><Input type="number" step="0.001" min="0.001" value={quantity || ""} onChange={e => setQuantity(Number(e.target.value))} required className="h-9 rounded-lg" /></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Motivo</span><Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej. Compra semanal a proveedor" required className="min-h-20 resize-none rounded-lg" /></label>
              <Button type="submit" loading={mutation.isPending} className="h-9 rounded-lg text-sm">Registrar movimiento</Button>
            </form>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return <article className="rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><div className="flex items-center justify-between"><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">{label}</span>{warning && <AlertTriangle size={14} className="text-neutral-400" />}</div><strong className="mt-1 block text-lg font-semibold text-neutral-900 dark:text-white">{value}</strong></article>;
}