"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, ImageUp, QrCode, ShieldCheck, ArrowLeft, ScanLine } from "lucide-react";
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
      setError(scanError instanceof DOMException && scanError.name === "NotAllowedError"
        ? "Permite el acceso a la cámara para escanear el QR."
        : "No pudimos abrir la cámara. También puedes cargar una foto del QR.");
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
    <main className="min-h-dvh w-full bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90">
        <div className="mx-auto flex h-[68px] w-full items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group inline-flex items-center gap-3 text-sm font-medium text-neutral-600 transition hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 transition group-hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:group-hover:bg-neutral-800">
              <ArrowLeft size={17} />
            </span>
            <span>Volver a la carta</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400 sm:block">Pedido en el local</span>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-68px)] w-full max-w-[1800px] gap-0 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.75fr)]">
        <div className="flex min-w-0 flex-col border-b border-neutral-200 p-4 dark:border-neutral-800 sm:p-6 lg:border-b-0 lg:border-r lg:p-8 xl:p-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-neutral-400">Escáner de mesa</p>
              <h2 className="mt-1 text-lg font-medium tracking-tight">Encuadra el código QR</h2>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${scanning ? "border-neutral-300 bg-white text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200" : "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${scanning ? "animate-pulse bg-neutral-900 dark:bg-white" : "bg-neutral-400"}`} />
              {scanning ? "Cámara activa" : "Cámara detenida"}
            </span>
          </div>

          <div className="relative min-h-[380px] flex-1 overflow-hidden rounded-2xl border border-neutral-300 bg-neutral-950 shadow-sm dark:border-neutral-800 sm:min-h-[480px] lg:min-h-[560px]">
            <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative aspect-square w-[min(62vw,300px)] max-w-[68%] rounded-2xl border border-white/80 shadow-[0_0_0_999px_rgba(0,0,0,0.28)] sm:w-[min(42vw,360px)]">
                <span className="absolute -left-px -top-px h-8 w-8 rounded-tl-2xl border-l-[3px] border-t-[3px] border-white" />
                <span className="absolute -right-px -top-px h-8 w-8 rounded-tr-2xl border-r-[3px] border-t-[3px] border-white" />
                <span className="absolute -bottom-px -left-px h-8 w-8 rounded-bl-2xl border-b-[3px] border-l-[3px] border-white" />
                <span className="absolute -bottom-px -right-px h-8 w-8 rounded-br-2xl border-b-[3px] border-r-[3px] border-white" />
                {scanning && <span className="absolute inset-x-3 top-1/2 h-px animate-pulse bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)]" />}
              </div>
            </div>

            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 p-5">
                <button type="button" onClick={() => void startScanner()} className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-white px-5 text-sm font-semibold text-neutral-900 shadow-xl transition hover:bg-neutral-200">
                  <Camera size={17} />
                  Activar cámara
                </button>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-6">
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <ScanLine size={17} />
                <span>{scanning ? "Mantén el QR dentro del recuadro" : "Activa la cámara para comenzar"}</span>
              </div>
              <label className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-white/30 bg-black/35 px-3.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/60">
                <ImageUp size={15} />
                <span>Subir imagen</span>
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={event => void scanImage(event.target.files?.[0])} />
              </label>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
            Para una lectura correcta, procura que el código esté bien iluminado y aparezca completo dentro del recuadro.
          </p>
        </div>

        <aside className="flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-12 lg:px-10 xl:px-14">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <QrCode size={26} strokeWidth={1.5} />
          </div>

          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">Acceso a tu mesa</p>
          <h1 className="mt-3 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl xl:text-5xl">
            Tu mesa. Tu carta. Tu pedido.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-neutral-500 dark:text-neutral-400 sm:text-base">
            Escanea el código QR ubicado en tu mesa para acceder a la carta vinculada y realizar tu pedido directamente desde tu dispositivo.
          </p>

          {error && (
            <div role="alert" className="mt-6 rounded-xl border border-neutral-300 bg-neutral-100 p-4 text-sm leading-6 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-4 border-y border-neutral-200 py-6 dark:border-neutral-800">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <Camera size={16} />
              </span>
              <div>
                <h3 className="text-sm font-medium">Escanea el código</h3>
                <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">Usa la cámara o carga una fotografía del QR.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <ShieldCheck size={16} />
              </span>
              <div>
                <h3 className="text-sm font-medium">Acceso validado</h3>
                <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">Verificamos el destino del QR antes de abrir la carta de la mesa.</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-[11px] leading-5 text-neutral-400">
            El pedido se vincula a la mesa identificada por el código. Revisa los detalles antes de confirmar.
          </p>
        </aside>
      </section>
    </main>
  );
}