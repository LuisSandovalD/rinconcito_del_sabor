"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Check, Printer, QrCode, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input, PageHeader, Skeleton } from "@/components/ui";

type Settings = { tradeName: string; legalName: string; ruc?: string; address?: string; phone?: string; email?: string; igvRate: string; pricesIncludeTax: boolean; soundEnabled: boolean; qrOrderingEnabled: boolean; waiterApprovalRequired: boolean };

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
                            <Toggle icon={<ShieldCheck size={15} />} title="Aprobación del mesero" detail="Los pedidos QR requieren confirmación." checked={form.waiterApprovalRequired} onChange={value => set("waiterApprovalRequired", value)} />
                        </div>

                        <Link href="/settings/qr" className="flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800/50"><Printer size={15} />Imprimir QR de las mesas</Link>
                    </div>
                </article>
            </section>
        </div>
    );
}

function Toggle({ icon, title, detail, checked, onChange }: { icon: React.ReactNode; title: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
            <span className="shrink-0 text-neutral-400">{icon}</span>
            <div className="min-w-0 flex-1"><strong className="block text-sm font-medium text-neutral-900 dark:text-white">{title}</strong><span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{detail}</span></div>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform dark:bg-neutral-950 ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} /></span>
        </button>
    );
}