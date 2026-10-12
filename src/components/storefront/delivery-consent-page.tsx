"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, MapPin, ShieldCheck, XCircle } from "lucide-react";
import { api, money } from "@/lib/client-api";
import { ThemeSwitcher } from "@/components/theme";

type ConsentDetails = {
  status: "PENDING" | "CONFIRMED" | "DECLINED" | "EXPIRED";
  recipientName: string;
  senderName: string;
  orderNumber: number;
  address?: string;
  reference?: string;
  mapsUrl?: string;
  total: string;
  expiresAt: string;
};

export function DeliveryConsentPage() {
  const [token, setToken] = useState("");
  const [details, setDetails] = useState<ConsentDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const secret = fragment.get("token") ?? "";
    window.history.replaceState(null, "", window.location.pathname);
    void Promise.resolve().then(async () => {
      if (!secret) throw new Error("El enlace está incompleto.");
      const response = await api<ConsentDetails>("/api/public/delivery-consent", { method: "POST", body: JSON.stringify({ token: secret, action: "inspect" }) });
      setToken(secret);
      setDetails(response);
    }).catch((requestError: Error) => setError(requestError.message));
  }, []);

  const respond = async (action: "confirm" | "decline") => {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    try {
      setDetails(await api<ConsentDetails>("/api/public/delivery-consent", { method: "POST", body: JSON.stringify({ token, action }) }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pudimos registrar tu respuesta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-[#040506] dark:text-white">
      <header className="border-b border-neutral-200 bg-white px-5 py-3 dark:border-[#1b1c1e] dark:bg-[#07080a]"><div className="mx-auto flex max-w-2xl items-center justify-between"><Link href="/" className="text-sm text-neutral-500">Rinconcito del Sabor</Link><ThemeSwitcher /></div></header>
      <section className="mx-auto flex max-w-2xl px-5 py-12 sm:py-20">
        <div className="w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl shadow-neutral-200/50 dark:border-[#363739] dark:bg-[#07080a] dark:shadow-black/30 sm:p-10">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff6363] text-white"><ShieldCheck size={27} /></span>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.1em] text-[#ff6363]">Confirmación protegida</p>
          <h1 className="mt-3 text-3xl font-medium">¿Aceptas recibir este pedido?</h1>
          {!details && !error && <p className="mt-4 text-sm text-neutral-500">Verificando el enlace…</p>}
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          {details && <>
            <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-[#9c9c9d]">Hola {details.recipientName}. <strong className="text-neutral-800 dark:text-white">{details.senderName}</strong> indicó que tú recibirás el pedido #{details.orderNumber}. No llegará a cocina hasta que lo confirmes.</p>
            <dl className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm dark:border-[#2f3031] dark:bg-[#111214]">
              <div className="flex justify-between gap-4"><dt className="text-neutral-500">Total</dt><dd className="font-semibold">{money(details.total)}</dd></div>
              <div><dt className="text-neutral-500">Dirección indicada</dt><dd className="mt-1 font-medium">{details.address}</dd></div>
              {details.reference && <div><dt className="text-neutral-500">Referencia</dt><dd className="mt-1">{details.reference}</dd></div>}
              {details.mapsUrl && <a href={details.mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-semibold text-[#e94f4f]"><MapPin size={16} />Comprobar ubicación exacta<ExternalLink size={13} /></a>}
            </dl>
            {details.status === "PENDING" ? <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" disabled={busy} onClick={() => void respond("confirm")} className="flex h-12 items-center justify-center gap-2 rounded-lg bg-neutral-900 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#e6e6e6] dark:text-[#454647]"><CheckCircle2 size={17} />Sí, acepto recibirlo</button><button type="button" disabled={busy} onClick={() => void respond("decline")} className="flex h-12 items-center justify-center gap-2 rounded-lg border border-neutral-200 text-sm font-semibold text-neutral-600 disabled:opacity-60 dark:border-[#363739] dark:text-[#e6e6e6]"><XCircle size={17} />No lo acepto</button></div> : <ConsentStatus status={details.status} />}
          </>}
        </div>
      </section>
    </main>
  );
}

function ConsentStatus({ status }: { status: ConsentDetails["status"] }) {
  const accepted = status === "CONFIRMED";
  return <div className={`mt-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${accepted ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-[#363739] dark:bg-[#111214] dark:text-[#9c9c9d]"}`}>{accepted ? <CheckCircle2 className="shrink-0" size={19} /> : <XCircle className="shrink-0" size={19} />}<p>{accepted ? "Confirmado. El restaurante ya puede preparar el pedido." : status === "EXPIRED" ? "El enlace venció y el pedido fue cancelado." : "Rechazaste el pedido. El restaurante no lo preparará."}</p></div>;
}
