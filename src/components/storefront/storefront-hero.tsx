import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Command, Search, Sparkles } from "lucide-react";
import { money } from "@/lib/client-api";
import type { StorefrontProduct } from "@/components/storefront/types";

export function StorefrontHero({ name, featured, search, onSearch }: { name: string; featured: StorefrontProduct[]; search: string; onSearch: (value: string) => void }) {
  return (
    <section id="inicio" className="relative isolate min-h-[820px] overflow-hidden border-b border-neutral-200 bg-neutral-50 px-4 pb-24 dark:border-neutral-800 dark:bg-neutral-950 sm:px-6 sm:pt-25 pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-neutral-200 dark:bg-neutral-800" />

      <div className="relative mx-auto max-w-[960px] text-center">
        <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
          <Sparkles size={12} />
          Cocina marina · Pedido directo
        </div>

        <h1 className="mx-auto mt-8 max-w-4xl text-[44px] font-semibold leading-[1.05] tracking-tight text-neutral-950 dark:text-white sm:text-[64px]">
          Tu antojo del mar,
          <br />
          <span className="font-normal text-neutral-500 dark:text-neutral-400">a unos comandos de distancia.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400">
          Explora la carta de {name}. Para delivery o recojo inicia sesión; si estás en el restaurante, escanea el QR colocado en tu mesa para pedir sin elegirla manualmente.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#carta" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
            Ver la carta <ArrowRight size={15} />
          </a>
          <Link href="/menu" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900">
            Cómo pedir desde mi mesa <ArrowRight size={14} />
          </Link>
        </div>

        <div className="relative mx-auto mt-16 max-w-[760px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 dark:border-neutral-800 dark:bg-neutral-950">
            <Search size={17} className="shrink-0 text-neutral-500 dark:text-neutral-400" />
            <input
              value={search}
              onChange={event => onSearch(event.target.value)}
              placeholder="Buscar ceviche, arroz con mariscos..."
              aria-label="Buscar platos"
              className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500"
            />
            <span className="hidden items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 font-mono text-[10px] text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 sm:flex">
              <Command size={10} />K
            </span>
          </div>

          <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-neutral-500 dark:text-neutral-400">Sabores destacados de hoy</span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{featured.length} sugerencias</span>
            </div>

            {featured.slice(0, 3).map((product, index) => (
              <a
                key={product.id}
                href="#carta"
                className={`group grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900 ${index > 0 ? "border-t border-neutral-100 dark:border-neutral-800" : ""}`}
              >
                <span className="relative h-11 w-11 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                  {product.imageUrl && (
                    <Image src={product.imageUrl} alt={product.name} fill sizes="44px" className="object-cover" />
                  )}
                </span>

                <span className="min-w-0">
                  <strong className="block truncate text-sm font-medium text-neutral-900 dark:text-white">{product.name}</strong>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    <Clock3 size={12} />
                    {product.estimatedMinutes ?? 15} min · Preparado al momento
                  </span>
                </span>

                <span className="flex items-center gap-2 sm:gap-3">
                  <strong className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{money(product.price)}</strong>
                  <ArrowRight size={14} className="text-neutral-400 transition-transform group-hover:translate-x-0.5 dark:text-neutral-500" />
                </span>
              </a>
            ))}

            {featured.length === 0 && (
              <p className="px-4 py-8 text-sm text-neutral-500 dark:text-neutral-400">
                No hay productos destacados disponibles por el momento.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>Desde 20 min</span>
          <span aria-hidden="true">·</span>
          <span>Delivery y recojo con cuenta</span>
          <span aria-hidden="true">·</span>
          <span>Pedido en mesa solo mediante QR</span>
        </div>
      </div>
    </section>
  );
}