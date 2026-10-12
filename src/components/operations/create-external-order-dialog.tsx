"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bike, ShoppingBag, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import { api, money } from "@/lib/client-api";
import { cn } from "@/lib/utils";

type Product = { id: string; name: string; price: string; availability: string; category: { name: string } };

export function CreateExternalOrderDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data } = useQuery({ queryKey: ["products"], queryFn: () => api<{ products: Product[] }>("/api/products?available=true") });
  const [type, setType] = useState<"TAKEAWAY" | "DELIVERY">("TAKEAWAY");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const selected = useMemo(() => data?.products.filter(product => cart[product.id]) ?? [], [data, cart]);
  const mutation = useMutation({
    mutationFn: () => api("/api/external-orders", { method: "POST", body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), type, customerName: name, customerPhone: phone || undefined, deliveryAddress: type === "DELIVERY" ? address : undefined, items: selected.map(product => ({ productId: product.id, quantity: cart[product.id] })) }) }),
    onSuccess: () => { toast.success("Pedido enviado a cocina."); onCreated(); },
    onError: error => toast.error(error.message)
  });
  const totalItems = selected.reduce((sum, product) => sum + cart[product.id], 0);
  const total = selected.reduce((sum, product) => sum + Number(product.price) * cart[product.id], 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
      <form onSubmit={event => { event.preventDefault(); mutation.mutate(); }} className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white dark:bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Nuevo pedido</span><h2 className="text-lg font-semibold">Delivery o para llevar</h2></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={17} /></button></header>
        <div className="grid min-h-0 flex-1 md:grid-cols-[250px_1fr]">
          <section className="border-b border-neutral-100 p-4 dark:border-neutral-800 md:border-b-0 md:border-r"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setType("TAKEAWAY")} className={cn("flex h-8 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium", type === "TAKEAWAY" ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 text-neutral-500 dark:border-neutral-800")}><ShoppingBag size={14} />Para llevar</button><button type="button" onClick={() => setType("DELIVERY")} className={cn("flex h-8 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium", type === "DELIVERY" ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900" : "border-neutral-200 text-neutral-500 dark:border-neutral-800")}><Bike size={14} />Delivery</button></div><div className="mt-3 space-y-3"><label className="block text-sm"><span className="mb-1 block font-medium">Cliente</span><Input value={name} onChange={event => setName(event.target.value)} required className="h-9 rounded-lg" /></label><label className="block text-sm"><span className="mb-1 block font-medium">Teléfono</span><Input value={phone} onChange={event => setPhone(event.target.value)} className="h-9 rounded-lg" /></label>{type === "DELIVERY" && <label className="block text-sm"><span className="mb-1 block font-medium">Dirección</span><Input value={address} onChange={event => setAddress(event.target.value)} required className="h-9 rounded-lg" /></label>}</div></section>
          <section className="min-h-0 overflow-y-auto p-4"><h3 className="mb-2 text-sm font-semibold">Productos</h3><div className="grid gap-2 sm:grid-cols-2">{data?.products.map(product => <button type="button" key={product.id} onClick={() => setCart(current => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }))} className="relative flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-left hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/40"><div className="min-w-0"><strong className="block truncate text-sm font-medium">{product.name}</strong><span className="text-xs text-neutral-400">{product.category.name}</span></div><b className="ml-3 text-sm font-medium">{money(product.price)}</b>{!!cart[product.id] && <span className="ml-2 text-xs font-semibold text-neutral-500">×{cart[product.id]}</span>}</button>)}</div></section>
        </div>
        <footer className="flex items-center justify-between border-t border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><span className="block text-xs text-neutral-400">{totalItems} productos</span><strong className="text-base font-semibold">{money(total)}</strong></div><Button type="submit" disabled={!selected.length} loading={mutation.isPending} className="h-9 rounded-lg px-4 text-sm">Enviar a cocina</Button></footer>
      </form>
    </div>
  );
}
