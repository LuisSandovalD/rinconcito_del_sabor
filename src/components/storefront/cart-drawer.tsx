"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Armchair, Check, ChevronLeft, ExternalLink, Gift, LocateFixed, LogIn, MapPin, Minus, Plus, ShoppingBag, Trash2, UserRound, X } from "lucide-react";
import { money } from "@/lib/client-api";
import type { CartLine, CheckoutData, PublicOrderResult, StorefrontUser } from "@/components/storefront/types";

type CartDrawerProps = {
  open: boolean;
  lines: CartLine[];
  subtotal: number;
  form: CheckoutData;
  customer: StorefrontUser | null | undefined;
  submitting: boolean;
  result: PublicOrderResult | null;
  onClose: () => void;
  onChange: (next: CheckoutData) => void;
  onQuantity: (productId: string, delta: number) => void;
  onClear: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNewOrder: () => void;
};

export function CartDrawer(props: CartDrawerProps) {
  const { open, lines, subtotal, form, customer, submitting, result, onClose, onChange, onQuantity, onClear, onSubmit, onNewOrder } = props;
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationReady = form.deliveryLatitude !== null && form.deliveryLongitude !== null && form.deliveryAccuracy !== null && form.deliveryAccuracy <= 250;
  const otherRecipientReady = form.recipientType === "SELF" || Boolean(form.recipientName.trim() && form.recipientEmail.trim());

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Este navegador no permite obtener la ubicación.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(position => {
      onChange({ ...form, deliveryLatitude: position.coords.latitude, deliveryLongitude: position.coords.longitude, deliveryAccuracy: position.coords.accuracy });
      setLocating(false);
      if (position.coords.accuracy > 250) setLocationError("La precisión es insuficiente. Activa la ubicación exacta y vuelve a intentarlo cerca de una ventana.");
    }, error => {
      setLocating(false);
      setLocationError(error.code === error.PERMISSION_DENIED ? "Debes permitir la ubicación exacta para solicitar delivery." : "No pudimos obtener tu ubicación. Revisa el GPS e inténtalo otra vez.");
    }, { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Tu pedido">
      <button type="button" aria-label="Cerrar pedido" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-neutral-50 text-neutral-900 shadow-[-24px_0_60px_rgba(0,0,0,0.2)] dark:bg-[#040506] dark:text-white dark:shadow-[-24px_0_80px_rgba(0,0,0,0.7)]">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4 dark:border-[#1b1c1e] dark:bg-[#07080a]">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-neutral-600 dark:border-[#363739] dark:bg-[#111214] dark:text-[#e6e6e6]"><ShoppingBag size={18} /></span><div><p className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-400 dark:text-[#6a6b6c]">Pedido en línea</p><h2 className="text-lg font-medium">Tu selección</h2></div></div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-[#111214] dark:hover:text-white"><X size={18} /></button>
        </header>

        {result ? <OrderResult result={result} onNewOrder={onNewOrder} /> : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-300 dark:border-[#363739] dark:bg-[#07080a] dark:text-[#454647]"><ShoppingBag size={25} /></span><h3 className="mt-5 text-xl font-medium">Tu pedido está vacío</h3><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-[#9c9c9d]">Explora la carta y agrega los platos que más se te antojen.</p><button type="button" onClick={onClose} className="mt-6 h-11 rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]">Ver la carta</button></div>
        ) : !customer ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 dark:border-[#363739] dark:bg-[#07080a] dark:text-[#e6e6e6]"><LogIn size={25} /></span><p className="mt-6 font-mono text-[10px] uppercase tracking-[0.08em] text-[#ff6363]">Cuenta requerida</p><h2 className="mt-3 text-2xl font-medium">Inicia sesión para pedir</h2><p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500 dark:text-[#9c9c9d]">Los pedidos para delivery o recojo requieren un usuario y contraseña.</p><Link href="/login?next=/" className="mt-7 flex h-11 items-center gap-2 rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]"><LogIn size={16} />Iniciar sesión</Link><Link href="/menu" className="mt-3 flex h-11 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 text-sm font-medium text-neutral-600 dark:border-[#363739] dark:bg-[#111214] dark:text-[#e6e6e6]"><Armchair size={16} />Pedir con QR de mesa</Link></div>
        ) : (
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              <div className="space-y-3">{lines.map(({ product, quantity }) => <article key={product.id} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5 dark:border-[#2f3031] dark:bg-[#07080a]"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-[#111214]">{product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="80px" className="object-cover" />}</div><div className="min-w-0 flex-1 py-1"><h3 className="truncate text-sm font-medium">{product.name}</h3><p className="mt-1 text-sm font-semibold">{money(Number(product.price) * quantity)}</p><div className="mt-2 flex items-center gap-1"><button type="button" onClick={() => onQuantity(product.id, -1)} aria-label={`Quitar ${product.name}`} className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 dark:bg-[#111214] dark:text-[#9c9c9d]">{quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}</button><span className="w-7 text-center text-xs font-semibold">{quantity}</span><button type="button" onClick={() => onQuantity(product.id, 1)} aria-label={`Agregar ${product.name}`} className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-[#e6e6e6] dark:text-[#454647]"><Plus size={12} /></button></div></div></article>)}</div>
              <button type="button" onClick={onClear} className="mt-3 text-xs font-medium text-neutral-400 underline-offset-2 hover:text-neutral-700 hover:underline">Vaciar pedido</button>

              <div className="mt-7 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-[#2f3031] dark:bg-[#07080a]">
                <h3 className="text-sm font-semibold">¿Cómo recibirás tu pedido?</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">{(["TAKEAWAY", "DELIVERY"] as const).map(type => <button key={type} type="button" onClick={() => onChange({ ...form, type })} className={`h-10 rounded-lg border text-xs font-semibold transition ${form.type === type ? "border-neutral-900 bg-neutral-900 text-white dark:border-[#e6e6e6] dark:bg-[#e6e6e6] dark:text-[#454647]" : "border-neutral-200 bg-neutral-100 text-neutral-500 dark:border-[#363739] dark:bg-[#111214] dark:text-[#9c9c9d]"}`}>{type === "TAKEAWAY" ? "Recojo en local" : "Delivery"}</button>)}</div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-sm dark:border-[#363739] dark:bg-[#111214]"><strong className="block">{customer.name}</strong><span className="mt-0.5 block text-xs text-neutral-500 dark:text-[#9c9c9d]">{customer.phone} · {customer.email}</span></div>
                  {form.type === "DELIVERY" && <>
                    <Field label="Dirección completa" value={form.deliveryAddress} onChange={value => onChange({ ...form, deliveryAddress: value })} placeholder="Calle, número, distrito y ciudad" autoComplete="street-address" required />
                    <Field label="Referencia" value={form.deliveryReference} onChange={value => onChange({ ...form, deliveryReference: value })} placeholder="Ej. Puerta azul frente al parque" />
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-[#363739] dark:bg-[#111214]">
                      <div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-[#ff6363]" /><div><strong className="block text-sm">Ubicación exacta obligatoria</strong><p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-[#9c9c9d]">Tomaremos las coordenadas del dispositivo y podrás revisarlas en el mapa.</p></div></div>
                      <button type="button" onClick={requestLocation} disabled={locating} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white text-xs font-semibold disabled:opacity-60 dark:border-[#454647] dark:bg-[#07080a]"><LocateFixed size={15} />{locating ? "Obteniendo ubicación…" : locationReady ? "Actualizar ubicación" : "Usar mi ubicación exacta"}</button>
                      {form.deliveryLatitude !== null && form.deliveryLongitude !== null && <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className={locationReady ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>{locationReady ? `Ubicación guardada · ±${Math.round(form.deliveryAccuracy ?? 0)} m` : `Precisión baja · ±${Math.round(form.deliveryAccuracy ?? 0)} m`}</span><a href={`https://www.google.com/maps/search/?api=1&query=${form.deliveryLatitude},${form.deliveryLongitude}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-[#e94f4f]">Ver mapa<ExternalLink size={12} /></a></div>}
                      {locationError && <p role="alert" className="mt-2 text-xs leading-5 text-red-600 dark:text-red-400">{locationError}</p>}
                    </div>
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-[#363739] dark:bg-[#111214]">
                      <strong className="text-sm">¿Quién recibirá el pedido?</strong>
                      <div className="mt-3 grid grid-cols-2 gap-2"><RecipientButton active={form.recipientType === "SELF"} onClick={() => onChange({ ...form, recipientType: "SELF" })}><UserRound size={14} />Yo</RecipientButton><RecipientButton active={form.recipientType === "OTHER"} onClick={() => onChange({ ...form, recipientType: "OTHER" })}><Gift size={14} />Otra persona</RecipientButton></div>
                      {form.recipientType === "OTHER" && <div className="mt-3 space-y-3"><p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">Le enviaremos un enlace privado. El pedido no pasará a cocina hasta que esa persona acepte recibirlo.</p><Field label="Nombre del destinatario" value={form.recipientName} onChange={value => onChange({ ...form, recipientName: value })} maxLength={100} required /><Field label="Correo del destinatario" type="email" value={form.recipientEmail} onChange={value => onChange({ ...form, recipientEmail: value })} maxLength={180} autoComplete="email" required /><Field label="Teléfono del destinatario (opcional)" type="tel" value={form.recipientPhone} onChange={value => onChange({ ...form, recipientPhone: value })} maxLength={30} autoComplete="tel" /></div>}
                    </div>
                  </>}
                  <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-[#9c9c9d]">Indicaciones (opcional)</span><textarea value={form.notes} onChange={event => onChange({ ...form, notes: event.target.value })} maxLength={300} rows={2} placeholder="Sin cebolla, tocar el timbre..." className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-500 dark:border-[#363739] dark:bg-[#111214] dark:text-white" /></label>
                  <label className="sr-only" aria-hidden="true">Sitio web<input value="" tabIndex={-1} autoComplete="off" readOnly /></label>
                </div>
              </div>
            </div>
            <footer className="border-t border-neutral-200 bg-white px-5 py-4 dark:border-[#1b1c1e] dark:bg-[#07080a]"><div className="mb-3 flex items-center justify-between"><span className="text-sm text-neutral-500 dark:text-[#9c9c9d]">Total</span><strong className="text-xl">{money(subtotal)}</strong></div><button type="submit" disabled={submitting || (form.type === "DELIVERY" && (!locationReady || !otherRecipientReady))} className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#e6e6e6] dark:text-[#454647]">{submitting ? "Enviando pedido..." : form.type === "DELIVERY" && !locationReady ? "Comparte tu ubicación para continuar" : "Confirmar pedido"}</button><p className="mt-2 text-center text-[11px] text-neutral-400 dark:text-[#6a6b6c]">El pago se coordina al confirmar la entrega.</p></footer>
          </form>
        )}
      </aside>
    </div>
  );
}

function OrderResult({ result, onNewOrder }: { result: PublicOrderResult; onNewOrder: () => void }) {
  return <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ff6363]/25 bg-[#452324] text-[#ff8c8c]"><Check size={28} /></span><p className="mt-6 font-mono text-[10px] uppercase tracking-[0.08em] text-[#ff6363]">{result.consentPending ? "Esperando al destinatario" : "Pedido confirmado"}</p><h2 className="mt-3 text-3xl font-medium">{result.consentPending ? "Aún no irá a cocina" : "¡Ya lo estamos preparando!"}</h2><p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500 dark:text-[#9c9c9d]">Tu número de pedido es <strong className="text-neutral-900 dark:text-white">#{result.number}</strong>. {result.consentPending ? result.consentNotificationDelivered === false ? "No pudimos entregar el correo de autorización. El pedido permanecerá bloqueado; verifica el correo y contacta al restaurante." : "Enviamos un correo a la persona indicada. Solo cuando acepte, el pedido pasará a cocina." : `Te contactaremos al teléfono indicado para coordinar ${result.type === "DELIVERY" ? "la entrega" : "el recojo"}.`}</p><div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-7 py-4 dark:border-[#363739] dark:bg-[#07080a]"><span className="block text-xs text-neutral-400">Total del pedido</span><strong className="mt-1 block text-2xl">{money(result.total)}</strong></div><button type="button" onClick={onNewOrder} className="mt-8 flex h-11 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-6 text-sm font-semibold text-neutral-700 dark:border-[#363739] dark:bg-[#111214] dark:text-[#e6e6e6]"><ChevronLeft size={16} />Volver a la carta</button></div>;
}

function RecipientButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold ${active ? "border-neutral-900 bg-neutral-900 text-white dark:border-[#e6e6e6] dark:bg-[#e6e6e6] dark:text-[#454647]" : "border-neutral-200 bg-white text-neutral-500 dark:border-[#363739] dark:bg-[#07080a]"}`}>{children}</button>;
}

function Field({ label, value, onChange, ...props }: { label: string; value: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-[#9c9c9d]">{label}</span><input value={value} onChange={event => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 text-sm outline-none transition placeholder:text-neutral-300 focus:border-neutral-500 dark:border-[#363739] dark:bg-[#111214] dark:text-white" {...props} /></label>;
}
