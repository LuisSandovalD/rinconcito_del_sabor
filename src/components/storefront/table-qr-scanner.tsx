"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, QrCode, ShieldCheck } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme";
import { validateTableQrValue } from "@/lib/table-qr";

type ScannerControls = { stop: () => void };

export function TableQrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ScannerControls | null>(null);
  const navigatingRef = useRef(false);
  const scanningRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openTable = useCallback((value: string) => {
    if (navigatingRef.current) return;
    try {
      const destination = validateTableQrValue(value, window.location.origin);
      navigatingRef.current = true;
      controlsRef.current?.stop();
      window.location.assign(destination);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "No pudimos leer este código QR.");
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current || scanningRef.current) return;
    setError(null);
    scanningRef.current = true;
    setScanning(true);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      const preferred = devices.find(device => /back|rear|environment|trasera/i.test(device.label)) ?? devices.at(-1);
      controlsRef.current = await reader.decodeFromVideoDevice(preferred?.deviceId, videoRef.current, result => {
        if (result) openTable(result.getText());
      });
    } catch (scanError) {
      scanningRef.current = false;
      setScanning(false);
      setError(scanError instanceof DOMException && scanError.name === "NotAllowedError" ? "Permite el acceso a la cámara para escanear el QR." : "No pudimos abrir la cámara. También puedes cargar una foto del QR.");
    }
  }, [openTable]);

  useEffect(() => {
    const timer = window.setTimeout(() => void startScanner(), 250);
    return () => {
      window.clearTimeout(timer);
      controlsRef.current?.stop();
      controlsRef.current = null;
      scanningRef.current = false;
    };
  }, [startScanner]);

  const scanImage = async (file?: File) => {
    if (!file) return;
    setError(null);
    const objectUrl = URL.createObjectURL(file);
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const result = await new BrowserQRCodeReader().decodeFromImageUrl(objectUrl);
      openTable(result.getText());
    } catch {
      setError("No encontramos un QR de mesa válido en esa imagen.");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-[#040506] dark:text-white">
      <header className="border-b border-neutral-200 bg-white px-4 py-3 dark:border-[#1b1c1e] dark:bg-[#07080a]"><div className="mx-auto flex max-w-3xl items-center justify-between"><Link href="/" className="text-sm text-neutral-500">Volver a la carta</Link><ThemeSwitcher /></div></header>
      <section className="mx-auto grid max-w-5xl gap-6 px-5 py-10 lg:grid-cols-[1fr_0.72fr] lg:py-16">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-950 shadow-2xl dark:border-[#363739]">
          <div className="relative aspect-[3/4] max-h-[680px] min-h-[420px] bg-black sm:aspect-[4/3]">
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle,transparent_0%,transparent_32%,rgba(0,0,0,0.56)_64%)]"><div className="h-56 w-56 rounded-3xl border-2 border-[#ff6363] shadow-[0_0_0_1px_rgba(255,255,255,0.35),0_0_40px_rgba(255,99,99,0.3)]" /></div>
            {!scanning && <button type="button" onClick={() => void startScanner()} className="absolute left-1/2 top-1/2 flex h-12 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-neutral-900"><Camera size={17} />Abrir cámara</button>}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 text-white"><span className="flex items-center gap-2 text-xs text-neutral-300"><span className={`h-2 w-2 rounded-full ${scanning ? "animate-pulse bg-emerald-400" : "bg-neutral-600"}`} />{scanning ? "Buscando QR de mesa..." : "Cámara detenida"}</span><label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium hover:bg-white/10"><ImageUp size={14} />Usar foto<input type="file" accept="image/*" capture="environment" className="sr-only" onChange={event => void scanImage(event.target.files?.[0])} /></label></div>
        </div>

        <div className="flex flex-col justify-center rounded-3xl border border-neutral-200 bg-white p-7 dark:border-[#363739] dark:bg-[#07080a] sm:p-9">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff6363] text-white"><QrCode size={27} /></span>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.1em] text-[#ff6363]">Pedido en el local</p>
          <h1 className="mt-3 text-3xl font-medium">Apunta al QR de tu mesa</h1>
          <p className="mt-4 text-sm leading-6 text-neutral-500 dark:text-[#9c9c9d]">Al reconocerlo abriremos automáticamente la carta vinculada a esa mesa. La aplicación rechazará códigos de otros sitios.</p>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{error}</p>}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-[#2f3031] dark:bg-[#111214]"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#ff6363]" /><p className="text-xs leading-5 text-neutral-500 dark:text-[#9c9c9d]">El QR incluye una credencial aleatoria. El pedido conserva la mesa y requiere validación antes de llegar a cocina.</p></div>
        </div>
      </section>
    </main>
  );
}
