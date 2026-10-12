import Image from "next/image";
import { Clock3, Minus, Plus } from "lucide-react";
import { money } from "@/lib/client-api";
import type { StorefrontProduct } from "@/components/storefront/types";

export function ProductCard({ product, quantity, onAdd, onDecrease }: { product: StorefrontProduct; quantity: number; onAdd: () => void; onDecrease: () => void }) {
  const soldOut = product.availability === "SOLD_OUT";
  return (
    <article className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition hover:border-neutral-400 dark:border-[#2f3031] dark:bg-[#07080a] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.2)] dark:hover:border-[#454647] ${soldOut ? "opacity-55" : ""}`}>
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-[#111214]">
        {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 360px" className="object-cover opacity-95 transition duration-500 group-hover:scale-[1.025]" /> : <div className="flex h-full items-center justify-center font-mono text-[10px] uppercase tracking-wider text-neutral-400 dark:text-[#6a6b6c]">Preparado al momento</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {product.featured && <span className="absolute left-3 top-3 rounded-md border border-[#ff6363]/30 bg-[#452324]/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.05em] text-[#ffb0b0] backdrop-blur">Favorito</span>}
        <strong className="absolute bottom-3 right-3 rounded-md border border-white/10 bg-black/65 px-2 py-1 text-sm font-medium text-white backdrop-blur">{money(product.price)}</strong>
        {soldOut && <span className="absolute inset-0 flex items-center justify-center bg-black/60 font-mono text-[10px] uppercase tracking-wider text-white">Agotado por hoy</span>}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-medium leading-6 tracking-[0.01em] text-neutral-950 dark:text-white">{product.name}</h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-500 dark:text-[#9c9c9d]">{product.description || "Preparado al momento con ingredientes frescos seleccionados."}</p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-neutral-400 dark:text-[#6a6b6c]"><Clock3 size={12} />{product.estimatedMinutes ?? 15} min</span>
          {quantity > 0 ? (
            <div className="flex items-center rounded-lg border border-neutral-300 bg-neutral-100 p-0.5 dark:border-[#363739] dark:bg-[#111214]">
              <button type="button" onClick={onDecrease} aria-label={`Quitar ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 transition hover:bg-white dark:text-[#9c9c9d] dark:hover:bg-[#1b1c1e]"><Minus size={13} /></button>
              <span className="w-7 text-center text-xs font-semibold text-neutral-800 dark:text-white">{quantity}</span>
              <button type="button" onClick={onAdd} aria-label={`Agregar otro ${product.name}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-900 text-white dark:bg-[#e6e6e6] dark:text-[#454647]"><Plus size={13} /></button>
            </div>
          ) : (
            <button type="button" onClick={onAdd} disabled={soldOut} className="flex h-9 items-center gap-1.5 rounded-lg bg-neutral-900 px-3 text-xs font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 dark:bg-[#e6e6e6] dark:text-[#454647] dark:hover:bg-white dark:disabled:bg-[#1b1c1e] dark:disabled:text-[#454647]"><Plus size={13} />Agregar</button>
          )}
        </div>
      </div>
    </article>
  );
}
