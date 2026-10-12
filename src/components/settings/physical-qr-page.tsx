"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileCheck2, KeyRound, MapPin, QrCode, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { downloadPhysicalQrPdf, type PhysicalQrCredential } from "@/lib/physical-qr-pdf";
import { Badge, Button, EmptyState, PageHeader, Skeleton } from "@/components/ui";

type TableSummary = Omit<PhysicalQrCredential, "accessToken"> & {
  physicalQrOrderingEnabled: boolean;
  physicalQrRotatedAt: string | null;
};

type QrStatus = {
  settings: { tradeName: string; address: string | null; qrOrderingEnabled: boolean };
  tables: TableSummary[];
};

type RotationResult = {
  settings: QrStatus["settings"];
  rotatedAt: string;
  tables: PhysicalQrCredential[];
};

export function PhysicalQrPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["physical-table-qr"],
    queryFn: () => api<QrStatus>("/api/tables/physical-qr")
  });

  const rotate = useMutation({
    mutationFn: () => api<RotationResult>("/api/tables/physical-qr", { method: "POST", body: JSON.stringify({ rotate: true }) }),
    onSuccess: async result => {
      try {
        await downloadPhysicalQrPdf({
          tradeName: result.settings.tradeName,
          address: result.settings.address,
          origin: window.location.origin,
          rotatedAt: result.rotatedAt,
          tables: result.tables
        });
        toast.success(`PDF descargado con ${result.tables.length} códigos QR.`);
        await queryClient.invalidateQueries({ queryKey: ["physical-table-qr"] });
      } catch {
        toast.error("Los códigos fueron rotados, pero el PDF no pudo generarse. Vuelve a generarlo para invalidar este lote.");
      }
    },
    onError: error => toast.error(error.message)
  });

  const revoke = useMutation({
    mutationFn: () => api<{ disabled: number }>("/api/tables/physical-qr", { method: "DELETE", body: "{}" }),
    onSuccess: async result => {
      toast.success(`${result.disabled} códigos físicos fueron revocados.`);
      await queryClient.invalidateQueries({ queryKey: ["physical-table-qr"] });
    },
    onError: error => toast.error(error.message)
  });

  if (isLoading) return <div className="space-y-4"><PageHeader title="QR físicos de mesas" /><Skeleton className="h-[560px] rounded-xl" /></div>;
  if (error || !data) return <EmptyState icon={<ShieldOff size={18} />} title="No se pudo abrir esta sección" detail={error?.message ?? "No tienes permiso para administrar los QR físicos."} />;

  const enabled = data.tables.filter(table => table.physicalQrOrderingEnabled).length;
  const latestRotation = data.tables
    .map(table => table.physicalQrRotatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  const generate = () => {
    const warning = enabled > 0
      ? "Al generar un nuevo PDF, todos los QR físicos impresos anteriormente dejarán de funcionar. ¿Deseas continuar?"
      : "Se crearán credenciales físicas para todas las mesas activas. ¿Deseas continuar?";
    if (window.confirm(warning)) rotate.mutate();
  };

  const disable = () => {
    if (window.confirm("Se desactivarán inmediatamente todos los QR físicos impresos. Los pedidos ya creados no se borrarán. ¿Deseas continuar?")) revoke.mutate();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="SEGURIDAD Y AUTOSERVICIO"
        title="QR físicos de mesas"
        description="Genera en un solo PDF los accesos que permanecerán impresos en el local. Cada nuevo lote invalida al anterior."
        action={<Link href="/settings" className="button button-secondary inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium"><ArrowLeft size={15} />Configuración</Link>}
      />

      <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ff6363]">Lote imprimible A4</p>
                <h2 className="mt-1 text-lg font-semibold text-neutral-950 dark:text-white">Todas las mesas en una descarga</h2>
                <p className="mt-1 max-w-xl text-sm leading-5 text-neutral-500 dark:text-neutral-400">El documento acomoda seis tarjetas por hoja, listas para recortar y colocar sobre cada mesa.</p>
              </div>
              <Badge tone={data.settings.qrOrderingEnabled ? "success" : "danger"}>{data.settings.qrOrderingEnabled ? "Pedidos QR activos" : "Pedidos QR desactivados"}</Badge>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"><QrCode className="text-[#ff6363]" size={18} /><p className="mt-3 text-2xl font-semibold tabular-nums">{data.tables.length}</p><p className="text-xs text-neutral-500">Mesas activas</p></div>
            <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"><FileCheck2 className="text-emerald-500" size={18} /><p className="mt-3 text-2xl font-semibold tabular-nums">{enabled}</p><p className="text-xs text-neutral-500">QR físicos vigentes</p></div>
            <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800"><RefreshCw className="text-sky-500" size={18} /><p className="mt-3 truncate text-sm font-semibold">{latestRotation ? new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(latestRotation)) : "Sin generar"}</p><p className="mt-1 text-xs text-neutral-500">Última rotación</p></div>
          </div>

          <div className="border-t border-neutral-100 p-4 dark:border-neutral-800">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={generate} loading={rotate.isPending} disabled={!data.settings.qrOrderingEnabled || !data.tables.length || revoke.isPending} className="h-10 gap-2 rounded-lg bg-[#ff6363] text-white hover:bg-[#ee5252]"><Download size={16} />{enabled ? "Rotar y descargar PDF" : "Generar y descargar PDF"}</Button>
              {enabled > 0 && <Button variant="outline" onClick={disable} loading={revoke.isPending} disabled={rotate.isPending} className="h-10 gap-2 rounded-lg text-red-600"><ShieldOff size={16} />Revocar todos</Button>}
            </div>
            {!data.settings.qrOrderingEnabled && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">Activa “Pedidos desde QR” en Configuración y guarda los cambios antes de generar el documento.</p>}
          </div>
        </article>

        <aside className="rounded-xl border border-neutral-200 bg-neutral-950 p-5 text-white dark:border-neutral-800">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff6363]/15 text-[#ff7777]"><ShieldCheck size={20} /></span>
          <h2 className="mt-4 text-base font-semibold">Protección del pedido físico</h2>
          <div className="mt-4 space-y-4 text-sm leading-5 text-neutral-300">
            <div className="flex gap-3"><KeyRound className="mt-0.5 shrink-0 text-[#ff7777]" size={16} /><p>Cada mesa recibe un secreto aleatorio diferente. La base de datos conserva únicamente su hash.</p></div>
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#ff7777]" size={16} /><p>Todo pedido de un QR físico queda pendiente hasta que un colaborador lo apruebe; nunca pasa directo a cocina.</p></div>
            <div className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-[#ff7777]" size={16} /><p>Una impresión extraviada se invalida rotando el lote completo o usando “Revocar todos”.</p></div>
          </div>
        </aside>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-100 px-4 py-3 dark:border-neutral-800"><div><h2 className="text-sm font-semibold">Mesas incluidas</h2><p className="mt-0.5 text-xs text-neutral-500">Solo se muestran mesas activas.</p></div><span className="text-xs tabular-nums text-neutral-400">{data.tables.length} registros</span></header>
        <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.tables.map(table => <div key={table.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2.5 dark:border-neutral-800"><div className="min-w-0"><p className="truncate text-sm font-medium">{table.name || `Mesa ${String(table.number).padStart(2, "0")}`}</p><p className="text-xs text-neutral-500">{table.zone.name} · {table.capacity} personas</p></div><span className={`h-2 w-2 shrink-0 rounded-full ${table.physicalQrOrderingEnabled ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-700"}`} aria-label={table.physicalQrOrderingEnabled ? "Vigente" : "Sin generar"} /></div>)}
        </div>
      </section>
    </div>
  );
}
