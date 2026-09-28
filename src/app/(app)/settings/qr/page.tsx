"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, UtensilsCrossed } from "lucide-react";
import { jsPDF } from "jspdf";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, PageHeader, Skeleton } from "@/components/ui";

type Table = { id: string; number: number; capacity: number; active?: boolean };
type Zone = { id: string; name: string; tables: Table[] };
type Settings = { tradeName: string; address?: string; phone?: string };

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
  const { data: zones, isLoading: tablesLoading } = useQuery({
    queryKey: ["tables"],
    queryFn: () => api<Zone[]>("/api/tables")
  });
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<Settings>("/api/settings")
  });

  const tables = useMemo(
    () => (zones ?? [])
      .flatMap(zone => zone.tables.map(table => ({ ...table, zone: zone.name })))
      .sort((a, b) => a.number - b.number),
    [zones]
  );

  const browserOrigin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => ""
  );
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
        const url = `${origin}/menu/mesa/${table.number}`;
        const canvas = document.getElementById(`qr-canvas-${table.id}`) as HTMLCanvasElement | null;

        if (!canvas) throw new Error(`No se pudo generar el QR de la mesa ${table.number}.`);

        const qrData = canvas.toDataURL("image/png", 1);

        // Card
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(225, 225, 225);
        pdf.setLineWidth(0.25);
        pdf.roundedRect(x, y, LABEL_MM, LABEL_MM, 2.2, 2.2, "FD");

        // Orange accent
        pdf.setFillColor(249, 115, 22);
        pdf.roundedRect(x + 3, y + 3, 5, 5, 1.2, 1.2, "F");

        // Brand
        pdf.setTextColor(10, 10, 10);
        pdf.setFont("times", "bold");
        pdf.setFontSize(7.5);
        pdf.text(settings.tradeName.slice(0, 24), x + 10, y + 6.4);

        pdf.setTextColor(115, 115, 115);
        pdf.setFont("times", "normal");
        pdf.setFontSize(5.2);
        pdf.text(table.zone.slice(0, 22), x + 10, y + 9);

        // Table number
        pdf.setTextColor(249, 115, 22);
        pdf.setFont("times", "bold");
        pdf.setFontSize(5.8);
        pdf.text("MESA", x + 3, y + 13.2);

        pdf.setTextColor(5, 5, 5);
        pdf.setFontSize(15);
        pdf.text(String(table.number).padStart(2, "0"), x + 3, y + 19);

        // QR (22 × 22 mm)
        pdf.addImage(qrData, "PNG", x + 15, y + 12, 22, 22, undefined, "FAST");

        // Footer
        pdf.setTextColor(55, 55, 55);
        pdf.setFont("times", "bold");
        pdf.setFontSize(5.5);
        pdf.text("Escanea para ver la carta", x + 3, y + 34.2);

        pdf.setTextColor(125, 125, 125);
        pdf.setFont("times", "normal");
        pdf.setFontSize(4.3);
        pdf.text("Menú digital · disponibilidad en vivo", x + 3, y + 37.1);
      }

      const safeName = settings.tradeName
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      pdf.save(`${safeName || "restaurante"}-qr-mesas-4x4cm.pdf`);
      toast.success(`PDF generado: ${tables.length} QR en ${pageCount} página${pageCount === 1 ? "" : "s"}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo generar el PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (tablesLoading || settingsLoading || !settings || !origin) {
    return <div className="page-stack">
      <PageHeader title="QR de mesas"/>
      <Skeleton className="h-[600px] rounded-xl"/>
    </div>;
  }

  return <div className="page-stack qr-print-page">
    <PageHeader
      eyebrow="MENÚ DIGITAL"
      title="QR para las mesas"
      description={`Etiquetas de 4 × 4 cm listas para descargar en PDF. ${tables.length} mesas · ${Math.ceil(tables.length / PER_PAGE)} página(s) A4.`}
      action={<div className="flex flex-wrap gap-2">
        <Link href={"/settings" as never} className="button button-secondary"><ArrowLeft/> Volver</Link>
        <Button onClick={downloadPdf} loading={downloading}><Download/> Descargar PDF</Button>
      </div>}
    />

    <div className="qr-pdf-info">
      <FileText/>
      <div>
        <strong>Formato listo para corte</strong>
        <span>Cada etiqueta mide exactamente 40 × 40 mm. El PDF organiza hasta 24 etiquetas por hoja A4.</span>
      </div>
    </div>

    <section className="qr-label-preview-grid">
      {tables.map(table => {
        const url = `${origin}/menu/mesa/${table.number}`;
        return <article className="qr-label-preview" key={table.id}>
          <div className="qr-label-head">
            <span className="qr-label-mark"><UtensilsCrossed/></span>
            <div><strong>{settings.tradeName}</strong><small>{table.zone}</small></div>
          </div>
          <div className="qr-label-content">
            <div><small>MESA</small><strong>{String(table.number).padStart(2, "0")}</strong></div>
            <QRCodeSVG value={url} size={112} level="H" includeMargin bgColor="#ffffff" fgColor="#050505"/>
          </div>
          <footer><strong>Escanea para ver la carta</strong><span>Menú digital · disponibilidad en vivo</span></footer>
          <div className="qr-hidden-canvas" aria-hidden="true">
            <QRCodeCanvas id={`qr-canvas-${table.id}`} value={url} size={512} level="H" includeMargin bgColor="#ffffff" fgColor="#050505"/>
          </div>
        </article>;
      })}
    </section>
  </div>;
}
