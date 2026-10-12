"use client";

/* Product media is transformed by Cloudinary before these URLs are stored. */
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock3, ImagePlus, MoreHorizontal, Plus, Search, UploadCloud, Utensils, X } from "lucide-react";
import { toast } from "sonner";
import { api, money } from "@/lib/client-api";
import { Badge, Button, EmptyState, Input, Pagination, PageHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

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
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-neutral-300 dark:text-neutral-600"><Utensils size={30} /></div>}
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
      {createOpen && data && <CreateProduct data={data} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); void client.invalidateQueries({ queryKey: ["products"] }); }} />}
    </div>
  );
}

function CreateProduct({ data, onClose, onCreated }: { data: Data; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", price: 0, cost: 0, estimatedMinutes: 15, categoryId: data.categories[0]?.id ?? "", stationId: data.stations[0]?.id ?? "", description: "", imageUrl: "", imagePublicId: "" });
  const [uploading, setUploading] = useState(false);

  const create = useMutation({
    mutationFn: () => api("/api/products", { method: "POST", body: JSON.stringify({ ...form, slug: form.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), imageUrl: form.imageUrl || undefined, imagePublicId: form.imagePublicId || undefined }) }),
    onSuccess: () => { toast.success("Producto creado y publicado."); onCreated(); },
    onError: error => toast.error(error.message)
  });

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const signature = await api<{ cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string }>("/api/storage/signature", { method: "POST", body: JSON.stringify({ folder: "products" }) });
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", signature.apiKey);
      body.append("timestamp", String(signature.timestamp));
      body.append("folder", signature.folder);
      body.append("signature", signature.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: "POST", body });
      if (!response.ok) throw new Error("No pudimos subir la imagen.");
      const result = await response.json() as { secure_url: string; public_id: string };
      setForm(current => ({ ...current, imageUrl: result.secure_url, imagePublicId: result.public_id }));
      toast.success("Imagen lista.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
      <form onSubmit={e => { e.preventDefault(); create.mutate(); }} className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white dark:bg-neutral-900">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><div><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Nuevo producto</span><h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Agregar producto</h2></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={17} /></button></header>

        <div className="grid gap-4 p-4 md:grid-cols-[190px_1fr]">
          <label className="relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center dark:border-neutral-700 dark:bg-neutral-950">
            {form.imageUrl ? <img src={form.imageUrl} alt="Vista previa" className="absolute inset-0 h-full w-full object-cover" /> : <><UploadCloud size={21} className="text-neutral-400" /><strong className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">{uploading ? "Subiendo..." : "Seleccionar foto"}</strong><span className="mt-1 text-xs text-neutral-400">JPG, PNG o WebP</span></>}
            <input type="file" accept="image/*" disabled={uploading} className="hidden" onChange={e => e.target.files?.[0] && void upload(e.target.files[0])} />
          </label>

          <div className="grid gap-3">
            <label className="text-sm"><span className="mb-1 block font-medium">Nombre</span><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Lomo saltado" required className="h-9 rounded-lg" /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Descripción</span><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve" className="min-h-20 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950" /></label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><span className="mb-1 block font-medium">Precio (S/)</span><Input type="number" min="0.1" step="0.1" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} required className="h-9 rounded-lg" /></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Costo (S/)</span><Input type="number" min="0" step="0.1" value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} className="h-9 rounded-lg" /></label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm"><span className="mb-1 block font-medium">Categoría</span><select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950">{data.categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Estación</span><select value={form.stationId} onChange={e => setForm({ ...form, stationId: e.target.value })} className="h-9 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm outline-none dark:border-neutral-800 dark:bg-neutral-950">{data.stations.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
            </div>

            <label className="text-sm"><span className="mb-1 block font-medium">Tiempo estimado</span><div className="relative max-w-36"><Input type="number" min="1" value={form.estimatedMinutes} onChange={e => setForm({ ...form, estimatedMinutes: Number(e.target.value) })} className="h-9 rounded-lg pr-10" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">min</span></div></label>
          </div>
        </div>

        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><Button type="button" variant="outline" onClick={onClose} className="h-9 rounded-lg px-4 text-sm">Cancelar</Button><Button type="submit" loading={create.isPending} className="h-9 gap-2 rounded-lg px-4 text-sm"><ImagePlus size={15} />Crear producto</Button></footer>
      </form>
    </div>
  );
}