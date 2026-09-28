"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, PackageOpen, PencilLine, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import {
  Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  EmptyState, Input, NativeSelect, PageHeader, Skeleton, Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow, Textarea
} from "@/components/ui";

type Ingredient = { id: string; name: string; unit: string; stock: string; minStock?: string; averageCost: string; movements: Array<{ id: string; type: string; quantity: string; createdAt: string }> };

export default function InventoryPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [type, setType] = useState("PURCHASE");
  const [reason, setReason] = useState("");

  const { data = [], isLoading } = useQuery({ queryKey: ["inventory"], queryFn: () => api<Ingredient[]>("/api/inventory") });
  const mutation = useMutation({
    mutationFn: () => api("/api/inventory", { method: "POST", body: JSON.stringify({ ingredientId: selected!.id, quantity, type, reason, idempotencyKey: crypto.randomUUID() }) }),
    onSuccess: () => { toast.success("Stock actualizado y auditado."); setSelected(null); void client.invalidateQueries({ queryKey: ["inventory"] }); },
    onError: error => toast.error(error.message)
  });

  const low = data.filter(item => item.minStock && Number(item.stock) <= Number(item.minStock));
  const value = data.reduce((sum, item) => sum + Number(item.stock) * Number(item.averageCost), 0);
  const visible = data.filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div><PageHeader title="Inventario"/><Skeleton className="h-[500px] rounded-xl"/></div>;

  return <div className="page-stack">
    <PageHeader eyebrow="CONTROL DE INSUMOS" title="Inventario" description="Stock, alertas y movimientos en una sola vista." action={<Button onClick={() => data[0] && setSelected(data[0])}><PencilLine/> Registrar movimiento</Button>}/>
    <section className="inventory-summary">
      <article><span><Boxes/></span><div><small>INSUMOS ACTIVOS</small><strong>{data.length}</strong></div></article>
      <article><span className="warn"><AlertTriangle/></span><div><small>BAJO MÍNIMO</small><strong>{low.length}</strong></div></article>
      <article><span className="green"><PackageOpen/></span><div><small>VALOR ESTIMADO</small><strong>S/ {value.toFixed(2)}</strong></div></article>
    </section>

    <div className="search-field inventory-search"><Search/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ingrediente..."/></div>

    <section className="panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ingrediente</TableHead>
            <TableHead>Stock actual</TableHead>
            <TableHead>Stock mínimo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Último movimiento</TableHead>
            <TableHead className="w-12"/>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map(item => {
            const isLow = Boolean(item.minStock && Number(item.stock) <= Number(item.minStock));
            const last = item.movements[0];
            return <TableRow key={item.id} className="cursor-pointer" onClick={() => { setSelected(item); setQuantity(0); setReason(""); }}>
              <TableCell><span className="ingredient-name"><i>{item.name[0]}</i><strong>{item.name}</strong></span></TableCell>
              <TableCell><strong>{Number(item.stock).toFixed(2)}</strong> {item.unit}</TableCell>
              <TableCell>{item.minStock ? `${Number(item.minStock).toFixed(2)} ${item.unit}` : "—"}</TableCell>
              <TableCell><Badge tone={isLow ? "danger" : "success"}>{isLow ? "Reponer" : "Correcto"}</Badge></TableCell>
              <TableCell>{last ? <span className="flex items-center gap-2"><i className={Number(last.quantity) >= 0 ? "movement-in" : "movement-out"}>{Number(last.quantity) >= 0 ? <ArrowUpRight/> : <ArrowDownRight/>}</i>{last.type.replaceAll("_", " ")}</span> : "Sin movimientos"}</TableCell>
              <TableCell><PencilLine className="size-4 text-muted-foreground"/></TableCell>
            </TableRow>;
          })}
        </TableBody>
      </Table>
    </section>

    {!data.length && <EmptyState icon={<Boxes/>} title="Inventario vacío" detail="Agrega ingredientes para comenzar el control."/>}

    <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)}>
      <DialogContent className="max-w-md">
        {selected && <>
          <DialogHeader>
            <p className="eyebrow">MOVIMIENTO DE INVENTARIO</p>
            <DialogTitle>{selected.name}</DialogTitle>
            <DialogDescription>Stock actual: {Number(selected.stock).toFixed(2)} {selected.unit}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
            <label>Tipo<NativeSelect value={type} onChange={e => setType(e.target.value)}><option value="PURCHASE">Ingreso / compra</option><option value="ADJUSTMENT">Ajuste</option><option value="LOSS">Pérdida</option><option value="DAMAGE">Deterioro</option><option value="EXPIRATION">Vencimiento</option></NativeSelect></label>
            <label>Cantidad ({selected.unit})<Input type="number" step="0.001" min="0.001" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required/></label>
            <label>Motivo<Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej. Compra semanal a proveedor" required/></label>
            <Button type="submit" loading={mutation.isPending}>Registrar movimiento</Button>
          </form>
        </>}
      </DialogContent>
    </Dialog>
  </div>;
}
