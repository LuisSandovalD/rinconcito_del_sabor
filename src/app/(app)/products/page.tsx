"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, MoreHorizontal, Plus, Search, Utensils } from "lucide-react";
import { toast } from "sonner";
import { api, money } from "@/lib/client-api";
import { Button, EmptyState, Input, Pagination, PageHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { CreateProductDialog } from "@/components/products/create-product-dialog";

type Product = { id: string; name: string; slug: string; description?: string; price: string; cost: string; imageUrl?: string; imagePublicId?: string; estimatedMinutes?: number; availability: "AVAILABLE" | "LOW_STOCK" | "SOLD_OUT" | "TEMPORARILY_UNAVAILABLE"; category: { id: string; name: string }; station?: { id: string; name: string } };
type Data = { products: Product[]; categories: Array<{ id: string; name: string }>; stations: Array<{ id: string; name: string }> };

const availability = [
  { id: "AVAILABLE", label: "Disponible", tone: "neutral" },
  { id: "LOW_STOCK", label: "Poco stock", tone: "warning" },
  { id: "SOLD_OUT", label: "Agotado", tone: "danger" },
  { id: "TEMPORARILY_UNAVAILABLE", label: "No disponible", tone: "neutral" }
] as const;

export default function ProductsPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: () => api<Data>("/api/products") });

  const filteredProducts = useMemo(() => data?.products.filter(product => (category === "all" || product.category.id === category) && product.name.toLowerCase().includes(search.toLowerCase())) ?? [], [data, search, category]);
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const products = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  const update = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string }) => api(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify({ availability: value }) }),
    onMutate: ({ id, value }) => client.setQueryData<Data>(["products"], current => current ? { ...current, products: current.products.map(product => product.id === id ? { ...product, availability: value as Product["availability"] } : product) } : current),
    onSuccess: () => { toast.success("Disponibilidad actualizada."); setEditingAvailability(null); },
    onError: error => { toast.error(error.message); void client.invalidateQueries({ queryKey: ["products"] }); }
  });

  if (isLoading) return <div className="space-y-4"><PageHeader title="Productos y menú" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}</div></div>;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="MENÚ" title="Productos y menú" description="Precios, categorías y disponibilidad." action={<Button onClick={() => setCreateOpen(true)} className="h-9 gap-2 rounded-lg px-3 text-sm"><Plus size={15} />Nuevo producto</Button>} />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span><strong className="mr-1 text-neutral-900 dark:text-white">{data?.products.filter(product => product.availability === "AVAILABLE").length}</strong> disponibles</span>
        <span><strong className="mr-1 text-neutral-900 dark:text-white">{data?.products.filter(product => product.availability === "LOW_STOCK").length}</strong> poco stock</span>
        <span><strong className="mr-1 text-neutral-900 dark:text-white">{data?.products.filter(product => product.availability === "SOLD_OUT").length}</strong> agotados</span>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full max-w-sm"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar producto..." className="h-9 rounded-lg pl-9 text-sm" /></div>
        <div className="flex gap-1 overflow-x-auto">
          <button type="button" onClick={() => { setCategory("all"); setPage(1); }} className={cn("h-8 shrink-0 rounded-md px-3 text-xs font-medium transition", category === "all" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800")}>Todos</button>
          {data?.categories.map(item => <button type="button" key={item.id} onClick={() => { setCategory(item.id); setPage(1); }} className={cn("h-8 shrink-0 rounded-md px-3 text-xs font-medium transition", category === item.id ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800")}>{item.name}</button>)}
        </div>
        <span className="ml-auto hidden text-xs text-neutral-400 xl:block">{filteredProducts.length} productos</span>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map(product => {
          const state = availability.find(item => item.id === product.availability)!;
          return (
            <article key={product.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="relative h-36 bg-neutral-100 dark:bg-neutral-800">
                {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 260px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-neutral-300 dark:text-neutral-600"><Utensils size={30} /></div>}
                <button type="button" className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-neutral-500 dark:bg-neutral-900/90 dark:text-neutral-400"><MoreHorizontal size={15} /></button>
              </div>

              <div className="p-3">
                <span className="block truncate text-[10px] font-medium uppercase tracking-[0.12em] text-neutral-400">{product.category.name} · {product.station?.name ?? "Sin estación"}</span>
                <h3 className="mt-1 truncate text-sm font-semibold text-neutral-900 dark:text-white">{product.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-neutral-500 dark:text-neutral-400">{product.description || "Sin descripción"}</p>

                <div className="mt-3 flex items-center justify-between"><strong className="text-base font-semibold text-neutral-900 dark:text-white">{money(product.price)}</strong><span className="flex items-center gap-1 text-xs text-neutral-400"><Clock3 size={12} />{product.estimatedMinutes ?? 10} min</span></div>

                <div className="relative mt-3">
                  <button type="button" onClick={() => setEditingAvailability(editingAvailability === product.id ? null : product.id)} className="flex h-8 w-full items-center gap-2 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800">
                    <span className={cn("h-1.5 w-1.5 rounded-full", product.availability === "SOLD_OUT" ? "bg-red-500" : product.availability === "LOW_STOCK" ? "bg-amber-500" : "bg-neutral-400")} />
                    {state.label}
                    <MoreHorizontal size={13} className="ml-auto" />
                  </button>

                  {editingAvailability === product.id && <div className="absolute bottom-10 left-0 z-30 w-full overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-800 dark:bg-neutral-900">{availability.map(item => <button type="button" key={item.id} onClick={() => update.mutate({ id: product.id, value: item.id })} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800"><span className={cn("h-1.5 w-1.5 rounded-full", item.id === "SOLD_OUT" ? "bg-red-500" : item.id === "LOW_STOCK" ? "bg-amber-500" : "bg-neutral-400")} /><span className="flex-1">{item.label}</span>{product.availability === item.id && <Check size={13} className="text-neutral-500" />}</button>)}</div>}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {!!filteredProducts.length && <div className="border-t border-neutral-200 pt-2 dark:border-neutral-800"><Pagination page={safePage} totalPages={totalPages} totalItems={filteredProducts.length} pageSize={pageSize} onPageChange={setPage} /></div>}
      {!filteredProducts.length && <EmptyState icon={<Utensils />} title="Sin resultados" detail="Prueba con otra categoría o término." />}
      {createOpen && data && <CreateProductDialog data={data} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); void client.invalidateQueries({ queryKey: ["products"] }); }} />}
    </div>
  );
}
