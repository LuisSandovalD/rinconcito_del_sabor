import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock3, Command, Search, Sparkles } from "lucide-react";
import { money } from "@/lib/client-api";
import type { StorefrontProduct } from "@/components/storefront/types";

export function StorefrontHero({ name, featured, search, onSearch }: { name: string; featured: StorefrontProduct[]; search: string; onSearch: (value: string) => void }) {
  return (
    <section id="inicio" className="relative isolate min-h-[820px] overflow-hidden border-b border-neutral-200 bg-[#f7f7f6] px-4 pb-24 pt-32 dark:border-[#1b1c1e] dark:bg-[#040506] sm:px-6 sm:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute left-1/2 top-[-280px] h-[720px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(20,60,163,0.52)_0%,rgba(2,25,59,0.20)_42%,transparent_70%)] blur-2xl" />
        <div className="absolute left-[12%] top-[12%] h-[420px] w-28 -rotate-[35deg] rounded-full bg-[#ff6363]/45 blur-3xl" />
        <div className="absolute right-[10%] top-[8%] h-[440px] w-24 rotate-[38deg] rounded-full bg-[#143ca3]/45 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-[960px] text-center">
        <div className="inline-flex items-center gap-2 rounded-md border border-[#ff6363]/25 bg-[#452324]/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[#ffb0b0] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"><Sparkles size={12} />Cocina marina · pedido directo</div>
        <h1 className="mx-auto mt-8 max-w-4xl text-[44px] font-normal leading-[1.02] tracking-[0.004em] text-neutral-950 dark:text-white sm:text-[64px]">Tu antojo del mar,<br /><span className="text-neutral-500 dark:text-[#9c9c9d]">a unos comandos de distancia.</span></h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-600 dark:text-[#9c9c9d]">Explora la carta de {name}. Para delivery o recojo inicia sesión; si estás en el restaurante, escanea el QR colocado en tu mesa para pedir sin elegirla manualmente.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#carta" className="flex h-11 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.14)] dark:bg-[#e6e6e6] dark:text-[#454647]">Ver la carta <ArrowRight size={15} /></a>
          <Link href="/menu" className="flex h-11 items-center justify-center rounded-lg border border-neutral-300 px-5 text-sm font-medium text-neutral-600 transition hover:text-neutral-950 dark:border-[#363739] dark:text-[#9c9c9d] dark:hover:text-white">Cómo pedir desde mi mesa</Link>
        </div>

        <div className="relative mx-auto mt-16 max-w-[760px] rounded-[20px] border border-neutral-300 bg-white/80 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_24px_70px_rgba(0,0,0,0.10)] backdrop-blur-xl dark:border-[#363739] dark:bg-[#07080a]/90 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_90px_rgba(0,0,0,0.68)]">
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100 px-4 dark:border-[#1b1c1e] dark:bg-[#111214]">
            <Search size={17} className="shrink-0 text-neutral-400 dark:text-[#6a6b6c]" />
            <input value={search} onChange={event => onSearch(event.target.value)} placeholder="Buscar ceviche, arroz con mariscos..." className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-[#6a6b6c]" />
            <span className="hidden items-center gap-1 rounded-md border border-neutral-300 bg-white px-2 py-1 font-mono text-[10px] text-neutral-400 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] dark:border-[#363739] dark:bg-[#1b1c1e] dark:text-[#9c9c9d] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:flex"><Command size={10} />K</span>
          </div>

          <div className="mt-2 overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-[#1b1c1e] dark:bg-[#07080a]">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 dark:border-[#1b1c1e]"><span className="font-mono text-[10px] uppercase tracking-[0.08em] text-neutral-400 dark:text-[#6a6b6c]">Sabores destacados de hoy</span><span className="text-[11px] text-neutral-400 dark:text-[#6a6b6c]">{featured.length} sugerencias</span></div>
            {featured.slice(0, 3).map((product, index) => (
              <a key={product.id} href="#carta" className={`group grid grid-cols-[44px_1fr_auto] items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-100 dark:hover:bg-[#111214] ${index > 0 ? "border-t border-neutral-100 dark:border-[#111214]" : ""}`}>
                <span className="relative h-11 w-11 overflow-hidden rounded-lg bg-neutral-100 dark:bg-[#111214]">{product.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="44px" className="object-cover" />}</span>
                <span className="min-w-0"><strong className="block truncate text-sm font-medium text-neutral-900 dark:text-white">{product.name}</strong><span className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-400 dark:text-[#6a6b6c]"><Clock3 size={11} />{product.estimatedMinutes ?? 15} min · Preparado al momento</span></span>
                <span className="flex items-center gap-3"><strong className="text-sm font-medium text-neutral-700 dark:text-[#e6e6e6]">{money(product.price)}</strong><ArrowRight size={14} className="text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-neutral-600 dark:text-[#454647] dark:group-hover:text-white" /></span>
              </a>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] text-neutral-400 dark:text-[#6a6b6c]"><span>Desde 20 min</span><span>|</span><span>Delivery y recojo con cuenta</span><span>|</span><span>Pedido en mesa solo mediante QR</span></div>
      </div>
    </section>
  );
}
