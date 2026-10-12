"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input, NativeSelect, Textarea } from "@/components/ui";

export type ProductFormData = { categories: Array<{ id: string; name: string }>; stations: Array<{ id: string; name: string }> };

export function CreateProductDialog({ data, onClose, onCreated }: { data: ProductFormData; onClose: () => void; onCreated: () => void }) {
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
      body.append("file", file); body.append("api_key", signature.apiKey); body.append("timestamp", String(signature.timestamp)); body.append("folder", signature.folder); body.append("signature", signature.signature);
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

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3"><form onSubmit={event => { event.preventDefault(); create.mutate(); }} className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white dark:bg-neutral-900"><header className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><div><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Nuevo producto</span><h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Agregar producto</h2></div><button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={17} /></button></header><div className="grid gap-4 p-4 md:grid-cols-[190px_1fr]"><label className="relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-center dark:border-neutral-700 dark:bg-neutral-950">{form.imageUrl ? <Image src={form.imageUrl} alt="Vista previa" fill sizes="190px" className="object-cover" /> : <><UploadCloud size={21} className="text-neutral-400" /><strong className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">{uploading ? "Subiendo..." : "Seleccionar foto"}</strong><span className="mt-1 text-xs text-neutral-400">JPG, PNG o WebP</span></>}<input type="file" accept="image/*" disabled={uploading} className="hidden" onChange={event => event.target.files?.[0] && void upload(event.target.files[0])} /></label><div className="grid gap-3"><label className="text-sm"><span className="mb-1 block font-medium">Nombre</span><Input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Ej. Lomo saltado" required className="h-9 rounded-lg" /></label><label className="text-sm"><span className="mb-1 block font-medium">Descripción</span><Textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Descripción breve" className="min-h-20 resize-none rounded-lg" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block font-medium">Precio (S/)</span><Input type="number" min="0.1" step="0.1" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })} required className="h-9 rounded-lg" /></label><label className="text-sm"><span className="mb-1 block font-medium">Costo (S/)</span><Input type="number" min="0" step="0.1" value={form.cost} onChange={event => setForm({ ...form, cost: Number(event.target.value) })} className="h-9 rounded-lg" /></label></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block font-medium">Categoría</span><NativeSelect value={form.categoryId} onChange={event => setForm({ ...form, categoryId: event.target.value })} className="h-9 rounded-lg">{data.categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</NativeSelect></label><label className="text-sm"><span className="mb-1 block font-medium">Estación</span><NativeSelect value={form.stationId} onChange={event => setForm({ ...form, stationId: event.target.value })} className="h-9 rounded-lg">{data.stations.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</NativeSelect></label></div><label className="text-sm"><span className="mb-1 block font-medium">Tiempo estimado</span><div className="relative max-w-36"><Input type="number" min="1" value={form.estimatedMinutes} onChange={event => setForm({ ...form, estimatedMinutes: Number(event.target.value) })} className="h-9 rounded-lg pr-10" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">min</span></div></label></div></div><footer className="sticky bottom-0 flex justify-end gap-2 border-t border-neutral-100 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"><Button type="button" variant="outline" onClick={onClose} className="h-9 rounded-lg px-4 text-sm">Cancelar</Button><Button type="submit" loading={create.isPending} className="h-9 gap-2 rounded-lg px-4 text-sm"><ImagePlus size={15} />Crear producto</Button></footer></form></div>;
}
