"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, Download, QrCode, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input, PageHeader, Skeleton } from "@/components/ui";
import { SettingsToggle as Toggle } from "@/components/settings/settings-toggle";

type Settings = { tradeName: string; legalName: string; ruc?: string; address?: string; phone?: string; email?: string; igvRate: string; pricesIncludeTax: boolean; soundEnabled: boolean; qrOrderingEnabled: boolean };

export default function SettingsPage() {
    const client = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => api<Settings>("/api/settings") });
    const [form, setForm] = useState<Settings | null>(null);

    useEffect(() => {
        if (!data) return;
        const timer = window.setTimeout(() => setForm(data), 0);
        return () => window.clearTimeout(timer);
    }, [data]);

    const mutation = useMutation({
        mutationFn: () => api("/api/settings", { method: "PATCH", body: JSON.stringify({ ...form, igvRate: Number(form!.igvRate) }) }),
        onSuccess: () => { toast.success("Configuración guardada."); void client.invalidateQueries({ queryKey: ["settings"] }); },
        onError: error => toast.error(error.message)
    });

    if (isLoading || !form) return <div className="space-y-4"><PageHeader title="Configuración" /><Skeleton className="h-[520px] rounded-xl" /></div>;

    const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setForm(current => current ? { ...current, [key]: value } : current);

    return (
        <div className="space-y-4">
            <PageHeader eyebrow="ADMINISTRACIÓN" title="Configuración" description="Ajustes generales del sistema." action={<Button loading={mutation.isPending} onClick={() => mutation.mutate()} className="h-9 gap-2 rounded-lg px-3 text-sm"><Save size={15} />Guardar cambios</Button>} />

            <section className="grid gap-3 xl:grid-cols-2">
                <article className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <header className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Datos del restaurante</h2><p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Información usada en el sistema y comprobantes.</p></header>
                    <div className="grid gap-3 p-4">
                        <label className="text-sm"><span className="mb-1 block font-medium">Nombre comercial</span><Input value={form.tradeName} onChange={e => set("tradeName", e.target.value)} className="h-9 rounded-lg" /></label>
                        <label className="text-sm"><span className="mb-1 block font-medium">Razón social</span><Input value={form.legalName} onChange={e => set("legalName", e.target.value)} className="h-9 rounded-lg" /></label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label className="text-sm"><span className="mb-1 block font-medium">RUC</span><Input value={form.ruc ?? ""} onChange={e => set("ruc", e.target.value)} className="h-9 rounded-lg" /></label>
                            <label className="text-sm"><span className="mb-1 block font-medium">Teléfono</span><Input value={form.phone ?? ""} onChange={e => set("phone", e.target.value)} className="h-9 rounded-lg" /></label>
                        </div>
                        <label className="text-sm"><span className="mb-1 block font-medium">Dirección</span><Input value={form.address ?? ""} onChange={e => set("address", e.target.value)} className="h-9 rounded-lg" /></label>
                        <label className="text-sm"><span className="mb-1 block font-medium">Correo</span><Input type="email" value={form.email ?? ""} onChange={e => set("email", e.target.value)} className="h-9 rounded-lg" /></label>
                    </div>
                </article>

                <article className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                    <header className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Operación y ventas</h2><p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Comportamiento general del sistema.</p></header>
                    <div className="grid gap-3 p-4">
                        <label className="text-sm"><span className="mb-1 block font-medium">IGV (%)</span><Input type="number" value={form.igvRate} onChange={e => set("igvRate", e.target.value)} className="h-9 max-w-32 rounded-lg" /></label>

                        <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                            <Toggle icon={<Check size={15} />} title="Precios incluyen IGV" detail="El impuesto se desglosa automáticamente." checked={form.pricesIncludeTax} onChange={value => set("pricesIncludeTax", value)} />
                            <Toggle icon={<BellRing size={15} />} title="Sonidos en cocina" detail="Alerta para nuevas comandas." checked={form.soundEnabled} onChange={value => set("soundEnabled", value)} />
                            <Toggle icon={<QrCode size={15} />} title="Pedidos desde QR" detail="Permite pedidos desde las mesas." checked={form.qrOrderingEnabled} onChange={value => set("qrOrderingEnabled", value)} />
                        </div>

                        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-neutral-500 dark:text-neutral-400">Genera un PDF seguro con todos los QR físicos. Los pedidos válidos se envían directamente a cocina.</p>
                            <Link href="/settings/qr" className="button button-secondary inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-xs font-medium"><Download size={14} />PDF de mesas</Link>
                        </div>
                    </div>
                </article>
            </section>
        </div>
    );
}
