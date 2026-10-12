import Image from "next/image";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { money } from "@/lib/client-api";
import type { StorefrontProduct } from "@/components/storefront/types";

export function DailySpecial({ product }: { product?: StorefrontProduct }) {
  if (!product) return null;

  return (
    <section id="presentacion" className="border-b border-neutral-200 bg-white px-4 py-16 dark:border-[#1b1c1e] dark:bg-[#07080a] sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-[1120px] overflow-hidden rounded-[24px] border border-neutral-200 bg-neutral-50 shadow-[0_24px_70px_rgba(0,0,0,0.08)] dark:border-[#363739] dark:bg-[#040506] dark:shadow-[0_30px_90px_rgba(0,0,0,0.45)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[320px] bg-neutral-200 sm:min-h-[420px]">
          {product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ff8b73,transparent_48%),linear-gradient(135deg,#172033,#090b10)]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/35 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white backdrop-blur-xl"><Sparkles size={13} />Presentación del día</span>
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#ff6363]">Recomendación de la casa</p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight text-neutral-950 dark:text-white sm:text-4xl">{product.name}</h2>
          <p className="mt-4 text-base leading-7 text-neutral-500 dark:text-[#9c9c9d]">{product.description || "Preparado al momento con ingredientes seleccionados y el sabor marino de la casa."}</p>
          <div className="mt-7 flex flex-wrap items-center gap-4"><strong className="text-2xl font-semibold text-neutral-950 dark:text-white">{money(product.price)}</strong><span className="flex items-center gap-1.5 text-sm text-neutral-400"><Clock3 size={15} />{product.estimatedMinutes ?? 15} min aprox.</span></div>
          <a href="#carta" className="mt-8 inline-flex h-11 w-fit items-center gap-2 rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-[#e6e6e6] dark:text-[#454647]">Ver en la carta <ArrowRight size={15} /></a>
        </div>
      </div>
    </section>
  );
}
