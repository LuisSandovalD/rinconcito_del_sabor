"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Sparkles,
} from "lucide-react";
import { money } from "@/lib/client-api";
import type { StorefrontProduct } from "@/components/storefront/types";

export function DailySpecial({
  product,
  products = [],
}: {
  product?: StorefrontProduct;
  products?: StorefrontProduct[];
}) {
  const slides = products.length ? products : product ? [product] : [];
  const [active, setActive] = useState(0);

  const activeIndex = slides.length ? active % slides.length : 0;
  const current = slides[activeIndex];

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = window.setInterval(() => {
      setActive((index) => (index + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!current) return null;

  const previous = () =>
    setActive((index) => (index - 1 + slides.length) % slides.length);

  const next = () =>
    setActive((index) => (index + 1) % slides.length);

  return (
    <section
      id="presentacion"
      className="relative h-[calc(100svh-80px)] min-h-[560px] max-h-[1000px] overflow-hidden border-b border-neutral-200 bg-neutral-950 text-white dark:border-neutral-800"
    >
      {current.imageUrl ? (
        <Image
          key={current.imageUrl}
          src={current.imageUrl}
          alt={current.name}
          fill
          priority
          sizes="100vw"
          className="object-cover transition-opacity duration-700"
        />
      ) : (
        <div className="absolute inset-0 bg-neutral-800" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/20" />

      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col justify-between px-5 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-14">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-md border border-white/25 bg-black/25 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur-md">
            <Sparkles size={13} />
            Selección de la casa
          </span>

          <span className="font-mono text-xs tracking-widest text-white/75">
            {String(activeIndex + 1).padStart(2, "0")} /{" "}
            {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        <div className="max-w-2xl pb-5 sm:pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/70">
            Especialidad destacada
          </p>

          <h2
            key={current.id}
            className="mt-4 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            {current.name}
          </h2>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/80 sm:text-base">
            {current.description ||
              "Preparado al momento con ingredientes seleccionados y el sabor marino de la casa."}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-5">
            <strong className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {money(current.price)}
            </strong>

            <span className="flex items-center gap-2 text-sm text-white/75">
              <Clock3 size={16} />
              {current.estimatedMinutes ?? 15} min aprox.
            </span>
          </div>

          <a
            href="#carta"
            className="mt-8 inline-flex h-12 items-center gap-3 rounded-lg bg-white px-6 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200"
          >
            Ver en la carta <ArrowRight size={16} />
          </a>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2" aria-label="Seleccionar producto">
            {slides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Ver ${item.name}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${activeIndex === index
                    ? "w-10 bg-white"
                    : "w-4 bg-white/40 hover:bg-white/70"
                  }`}
              />
            ))}
          </div>

          {slides.length > 1 && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={previous}
                aria-label="Producto anterior"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white backdrop-blur-md transition hover:bg-white hover:text-neutral-950"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                type="button"
                onClick={next}
                aria-label="Producto siguiente"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/20 text-white backdrop-blur-md transition hover:bg-white hover:text-neutral-950"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}