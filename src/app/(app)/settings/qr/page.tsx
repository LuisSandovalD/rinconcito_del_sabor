"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, PageHeader, Skeleton } from "@/components/ui";

type Table = { id: string; number: number; capacity: number; active?: boolean };
type Zone = { id: string; name: string; tables: Table[] };
type Settings = { tradeName: string; address?: string; phone?: string };

const LOGO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";
const LABEL_MM = 40;
const COLS = 4;
const ROWS = 6;
const PER_PAGE = COLS * ROWS;
const GAP_MM = 4;
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const GRID_W_MM = COLS * LABEL_MM + (COLS - 1) * GAP_MM;
const GRID_H_MM = ROWS * LABEL_MM + (ROWS - 1) * GAP_MM;
const MARGIN_X_MM = (PAGE_W_MM - GRID_W_MM) / 2;
const MARGIN_Y_MM = (PAGE_H_MM - GRID_H_MM) / 2;

export default function TableQrPrintPage() {
  const [downloading, setDownloading] = useState(false);
  const { data: zones, isLoading: tablesLoading } = useQuery({ queryKey: ["tables"], queryFn: () => api<Zone[]>("/api/tables") });
  const { data: settings, isLoading: settingsLoading } = useQuery({ queryKey: ["settings"], queryFn: () => api<Settings>("/api/settings") });

  const tables = useMemo(() => (zones ?? []).flatMap(zone => zone.tables.map(table => ({ ...table, zone: zone.name }))).sort((a, b) => a.number - b.number), [zones]);
  const browserOrigin = useSyncExternalStore(() => () => undefined, () => window.location.origin, () => "");
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || browserOrigin;

  const downloadPdf = async () => {
    if (!settings || !origin || !tables.length) return;
    setDownloading(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageCount = Math.ceil(tables.length / PER_PAGE);

      for (let index = 0; index < tables.length; index += 1) {
        if (index > 0 && index % PER_PAGE === 0) pdf.addPage();

        const table = tables[index];
        const pageIndex = index % PER_PAGE;
        const col = pageIndex % COLS;
        const row = Math.floor(pageIndex / COLS);
        const x = MARGIN_X_MM + col * (LABEL_MM + GAP_MM);
        const y = MARGIN_Y_MM + row * (LABEL_MM + GAP_MM);
        const canvas = document.getElementById(`qr-canvas-${table.id}`) as HTMLCanvasElement | null;

        if (!canvas) throw new Error(`No se pudo generar el QR de la mesa ${table.number}.`);

        const qrData = canvas.toDataURL("image/png", 1);

        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(225, 225, 225);
        pdf.setLineWidth(0.25);
        pdf.roundedRect(x, y, LABEL_MM, LABEL_MM, 2.2, 2.2, "FD");

        pdf.setTextColor(10, 10, 10);
        pdf.setFont("times", "bold");
        pdf.setFontSize(7.5);
        pdf.text(settings.tradeName.slice(0, 24), x + 3, y + 6.4);

        pdf.setTextColor(115, 115, 115);
        pdf.setFont("times", "normal");
        pdf.setFontSize(5.2);
        pdf.text(table.zone.slice(0, 22), x + 3, y + 9);

        pdf.setTextColor(80, 80, 80);
        pdf.setFont("times", "bold");
        pdf.setFontSize(5.8);
        pdf.text("MESA", x + 3, y + 13.2);

        pdf.setTextColor(5, 5, 5);
        pdf.setFontSize(15);
        pdf.text(String(table.number).padStart(2, "0"), x + 3, y + 19);

        pdf.addImage(qrData, "PNG", x + 15, y + 12, 22, 22, undefined, "FAST");

        pdf.setTextColor(55, 55, 55);
        pdf.setFont("times", "bold");
        pdf.setFontSize(5.5);
        pdf.text("Escanea para ver la carta", x + 3, y + 34.2);

        pdf.setTextColor(125, 125, 125);
        pdf.setFont("times", "normal");
        pdf.setFontSize(4.3);
        pdf.text("Menú digital · disponibilidad en vivo", x + 3, y + 37.1);
      }

      const safeName = settings.tradeName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
      pdf.save(`${safeName || "restaurante"}-qr-mesas-4x4cm.pdf`);
      toast.success(`PDF generado: ${tables.length} QR en ${pageCount} página${pageCount === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (tablesLoading || settingsLoading || !settings || !origin) return <div className="space-y-4"><PageHeader title="QR de mesas" /><Skeleton className="h-[500px] rounded-xl" /></div>;

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="MENÚ DIGITAL" title="QR para las mesas" description={`Etiquetas de 4 × 4 cm listas para descargar. ${tables.length} mesas · ${Math.ceil(tables.length / PER_PAGE)} página(s) A4.`} action={<div className="flex gap-2"><Link href="/settings" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"><ArrowLeft size={15} />Volver</Link><Button onClick={downloadPdf} loading={downloading} className="h-9 gap-2 rounded-lg px-3 text-sm"><Download size={15} />Descargar PDF</Button></div>} />

      <div className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm dark:border-neutral-800">
        <strong className="font-medium text-neutral-900 dark:text-white">Formato listo para corte.</strong>
        <span className="ml-1 text-neutral-500 dark:text-neutral-400">Cada etiqueta mide 40 × 40 mm y el PDF organiza hasta 24 por hoja A4.</span>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {tables.map(table => {
          const url = `${origin}/menu/mesa/${table.number}`;
          return (
            <article key={table.id} className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <img src={LOGO_URL} alt={settings.tradeName} className="h-9 w-9 shrink-0 object-contain" />
                <div className="min-w-0"><strong className="block truncate text-sm font-semibold text-neutral-900 dark:text-white">{settings.tradeName}</strong><span className="block truncate text-xs text-neutral-400">{table.zone}</span></div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div><span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Mesa</span><strong className="mt-1 block text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{String(table.number).padStart(2, "0")}</strong></div>
                <div className="rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700"><QRCodeSVG value={url} size={105} level="H" includeMargin bgColor="#ffffff" fgColor="#050505" /></div>
              </div>

              <footer className="absolute bottom-4 left-4 right-4"><strong className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">Escanea para ver la carta</strong><span className="mt-0.5 block text-[10px] text-neutral-400">Menú digital · disponibilidad en vivo</span></footer>

              <div className="pointer-events-none absolute -left-[9999px] -top-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true"><QRCodeCanvas id={`qr-canvas-${table.id}`} value={url} size={512} level="H" includeMargin bgColor="#ffffff" fgColor="#050505" /></div>
            </article>
          );
        })}
      </section>

      {!tables.length && <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900"><img src={LOGO_URL} alt="" className="h-14 w-14 object-contain" /><h3 className="mt-3 text-sm font-semibold text-neutral-900 dark:text-white">No hay mesas disponibles</h3><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Configura las mesas antes de generar los códigos QR.</p></div>}
    </div>
  );
}