"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer, UtensilsCrossed } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "@/lib/client-api";
import { Button, PageHeader, Skeleton } from "@/components/ui";

type Table = { id: string; number: number; capacity: number; active?: boolean };
type Zone = { id: string; name: string; tables: Table[] };
type Settings = { tradeName: string; address?: string; phone?: string };

export default function TableQrPrintPage() {
  const { data: zones, isLoading: tablesLoading } = useQuery({ queryKey: ["tables"], queryFn: () => api<Zone[]>("/api/tables") });
  const { data: settings, isLoading: settingsLoading } = useQuery({ queryKey: ["settings"], queryFn: () => api<Settings>("/api/settings") });

  const tables = useMemo(
    () => (zones ?? []).flatMap(zone => zone.tables.map(table => ({ ...table, zone: zone.name }))).sort((a, b) => a.number - b.number),
    [zones]
  );

  const browserOrigin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => ""
  );
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || browserOrigin;

  if (tablesLoading || settingsLoading || !settings || !origin) {
    return <div className="page-stack"><PageHeader title="QR de mesas"/><Skeleton className="h-[600px] rounded-xl"/></div>;
  }

  return <div className="page-stack qr-print-page">
    <div className="qr-print-toolbar">
      <PageHeader
        eyebrow="MENÚ DIGITAL"
        title="QR para las mesas"
        description="Imprime, recorta y coloca una tarjeta en cada mesa. Cada QR abre directamente la carta de esa mesa."
        action={<div className="flex gap-2"><Link href={"/settings" as never} className="button button-secondary"><ArrowLeft/> Volver</Link><Button onClick={() => window.print()}><Printer/> Imprimir QR</Button></div>}
      />
    </div>

    <section className="qr-print-grid">
      {tables.map(table => {
        const url = `${origin}/menu/mesa/${table.number}`;
        return <article className="qr-print-card" key={table.id}>
          <div className="qr-print-brand"><span><UtensilsCrossed/></span><div><strong>{settings.tradeName}</strong><small>{table.zone}</small></div></div>
          <div className="qr-print-table"><span>MESA</span><strong>{String(table.number).padStart(2, "0")}</strong></div>
          <div className="qr-code-box">
            <QRCodeSVG value={url} size={210} level="H" includeMargin bgColor="#ffffff" fgColor="#111111"/>
          </div>
          <h2>Escanea para ver la carta</h2>
          <p>Consulta platos, precios y disponibilidad desde tu celular.</p>
          <small className="qr-print-url">{url.replace(/^https?:\/\//, "")}</small>
        </article>;
      })}
    </section>
  </div>;
}
