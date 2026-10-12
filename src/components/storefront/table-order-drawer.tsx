import Image from "next/image";
import { Check, Minus, Plus, ShoppingBag, Trash2, Users, X } from "lucide-react";
import { money } from "@/lib/client-api";
import type { CartLine, TableOrderResult } from "@/components/storefront/types";

type TableOrderDrawerProps = {
  open: boolean;
  tableNumber: number;
  lines: CartLine[];
  subtotal: number;
  guests: number;
  notes: string;
  submitting: boolean;
  result: TableOrderResult | null;
  onClose: () => void;
  onQuantity: (productId: string, delta: number) => void;
  onGuests: (guests: number) => void;
  onNotes: (notes: string) => void;
  onSubmit: () => void;
  onNewOrder: () => void;
};

export function TableOrderDrawer(props: TableOrderDrawerProps) {
  const { open, tableNumber, lines, subtotal, guests, notes, submitting, result, onClose, onQuantity, onGuests, onNotes, onSubmit, onNewOrder } = props;
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Pedido de la mesa ${tableNumber}`}>
      <button type="button" aria-label="Cerrar pedido" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default" />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-neutral-50 text-neutral-900 shadow-[-24px_0_60px_rgba(0,0,0,0.2)] dark:bg-[#040506] dark:text-white">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4 dark:border-[#1b1c1e] dark:bg-[#07080a]">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 dark:border-[#363739] dark:bg-[#111214]"><ShoppingBag size={18} /></span><div><p className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#ff6363]">Mesa {String(tableNumber).padStart(2, "0")}</p><h2 className="text-lg font-medium">Tu pedido</h2></div></div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#111214]"><X size={18} /></button>
        </header>

        {result ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ff6363]/25 bg-[#452324] text-[#ff8c8c]"><Check size={28} /></span>
            <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.08em] text-[#ff6363]">{result.status === "NEW" ? "Enviado para aprobación" : "Enviado a cocina"}</p>
            <h2 className="mt-3 text-3xl font-medium">Pedido #{result.number}</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500 dark:text-[#9c9c9d]">{result.status === "NEW" ? `El personal revisará el pedido de la mesa ${result.tableNumber} antes de enviarlo a cocina.` : `Recibimos el pedido de la mesa ${result.tableNumber}. Puedes agregar más productos cuando lo necesites.`}</p>
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-7 py-4 dark:border-[#363739] dark:bg-[#07080a]"><span className="block text-xs text-neutral-400">Total acumulado</span><strong className="mt-1 block text-2xl">{money(result.total)}</strong></div>
            <button type="button" onClick={onNewOrder} className="mt-8 h-11 rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]">Agregar otro pedido</button>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><ShoppingBag size={30} className="text-neutral-300 dark:text-[#454647]" /><h3 className="mt-5 text-xl font-medium">Tu pedido está vacío</h3><p className="mt-2 text-sm text-neutral-500 dark:text-[#9c9c9d]">Agrega platos de la carta para enviarlos a cocina.</p><button type="button" onClick={onClose} className="mt-6 h-11 rounded-lg bg-neutral-900 px-6 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]">Ver la carta</button></div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
              <div className="space-y-3">
                {lines.map(({ product, quantity }) => (
                  <article key={product.id} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-2.5 dark:border-[#2f3031] dark:bg-[#07080a]">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-[#111214]">{product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="80px" className="object-cover" />}</div>
                    <div className="min-w-0 flex-1 py-1"><h3 className="truncate text-sm font-medium">{product.name}</h3><p className="mt-1 text-sm font-semibold">{money(Number(product.price) * quantity)}</p><div className="mt-2 flex items-center gap-1"><button type="button" onClick={() => onQuantity(product.id, -1)} aria-label={`Quitar ${product.name}`} className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 dark:bg-[#111214] dark:text-[#9c9c9d]">{quantity === 1 ? <Trash2 size={12} /> : <Minus size={12} />}</button><span className="w-7 text-center text-xs font-semibold">{quantity}</span><button type="button" onClick={() => onQuantity(product.id, 1)} aria-label={`Agregar ${product.name}`} className="flex h-7 w-7 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-[#e6e6e6] dark:text-[#454647]"><Plus size={12} /></button></div></div>
                  </article>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-[#2f3031] dark:bg-[#07080a]">
                <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold">Personas en la mesa</h3><p className="mt-0.5 text-xs text-neutral-400">Ayuda a coordinar el servicio.</p></div><div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 dark:border-[#363739]"><Users size={14} className="ml-1 text-neutral-400" /><button type="button" onClick={() => onGuests(Math.max(1, guests - 1))} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-[#111214]"><Minus size={13} /></button><strong className="w-5 text-center text-xs">{guests}</strong><button type="button" onClick={() => onGuests(Math.min(50, guests + 1))} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-[#111214]"><Plus size={13} /></button></div></div>
                <label className="mt-4 block"><span className="mb-1.5 block text-xs font-medium text-neutral-500 dark:text-[#9c9c9d]">Indicaciones (opcional)</span><textarea value={notes} onChange={event => onNotes(event.target.value)} maxLength={500} rows={3} placeholder="Sin cebolla, alergias, punto de cocción..." className="w-full resize-none rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500 dark:border-[#363739] dark:bg-[#111214] dark:text-white" /></label>
              </div>
            </div>
            <footer className="border-t border-neutral-200 bg-white px-5 py-4 dark:border-[#1b1c1e] dark:bg-[#07080a]"><div className="mb-3 flex items-center justify-between"><span className="text-sm text-neutral-500 dark:text-[#9c9c9d]">Total</span><strong className="text-xl">{money(subtotal)}</strong></div><button type="button" onClick={onSubmit} disabled={submitting} className="h-12 w-full rounded-lg bg-neutral-900 text-sm font-semibold text-white disabled:opacity-60 dark:bg-[#e6e6e6] dark:text-[#454647]">{submitting ? "Enviando..." : "Enviar pedido a cocina"}</button><p className="mt-2 text-center text-[11px] text-neutral-400">Pedido asociado a la mesa {tableNumber}.</p></footer>
          </div>
        )}
      </aside>
    </div>
  );
}
