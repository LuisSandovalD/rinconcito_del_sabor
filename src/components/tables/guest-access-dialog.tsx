"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, RefreshCw, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { api } from "@/lib/client-api";

type AccessResult = { tableNumber: number; expiresAt: string; accessToken: string };

export function GuestAccessDialog({ table, guestCount, onClose }: { table: { id: string; number: number }; guestCount: number; onClose: () => void }) {
  const [result, setResult] = useState<AccessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);
  const url = useMemo(() => result && typeof window !== "undefined" ? `${window.location.origin}/menu/mesa/${table.number}#access=${result.accessToken}` : "", [result, table.number]);

  const generate = async () => {
    setLoading(true);
    try {
      setResult(await api<AccessResult>(`/api/tables/${table.id}/guest-access`, { method: "POST", body: JSON.stringify({ guestCount }) }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo habilitar el acceso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void generate(), 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const revoke = async () => {
    setRevoking(true);
    try {
      await api(`/api/tables/${table.id}/guest-access`, { method: "DELETE", body: "{}" });
      toast.success("Acceso revocado.");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo revocar el acceso.");
    } finally {
      setRevoking(false);
    }
  };

  return <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 p-4"><section className="relative w-full max-w-md rounded-2xl bg-white p-5 text-center shadow-2xl dark:bg-neutral-900"><button type="button" onClick={onClose} aria-label="Cerrar" className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={16} /></button><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><ShieldCheck size={21} /></span><p className="mt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Acceso temporal seguro</p><h2 className="mt-1 text-xl font-semibold">Mesa {String(table.number).padStart(2, "0")}</h2>{loading ? <div className="mx-auto mt-6 h-56 w-56 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800" /> : result && url ? <><div className="mx-auto mt-6 w-fit rounded-xl border border-neutral-200 bg-white p-3"><QRCodeSVG value={url} size={210} level="H" includeMargin /></div><p className="mt-4 text-xs leading-5 text-neutral-500">Escanea este QR desde el teléfono de la mesa. Vence a las {new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit" }).format(new Date(result.expiresAt))}.</p><div className="mt-5 grid grid-cols-2 gap-2"><Button variant="outline" className="h-9 rounded-lg text-xs" onClick={() => { void navigator.clipboard.writeText(url); toast.success("Enlace copiado."); }}><Copy size={14} />Copiar</Button><Button variant="outline" className="h-9 rounded-lg text-xs" onClick={() => void generate()}><RefreshCw size={14} />Rotar acceso</Button></div><button type="button" onClick={revoke} disabled={revoking} className="mt-3 text-xs font-medium text-red-500 hover:underline disabled:opacity-50">{revoking ? "Revocando..." : "Revocar acceso"}</button></> : <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">No se pudo generar el acceso. Verifica que los pedidos QR estén activos.</div>}</section></div>;
}
