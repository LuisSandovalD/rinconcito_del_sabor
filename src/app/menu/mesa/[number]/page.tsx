"use client";

/* Public product media uses Cloudinary responsive transformations. */
/* eslint-disable @next/next/no-img-element */

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, MapPin, Phone, Search } from "lucide-react";
import { api, money } from "@/lib/client-api";
import { Badge, EmptyState, Input, Skeleton } from "@/components/ui";

type Menu = {
    settings: { tradeName: string; address?: string; phone?: string; orderingEnabled: boolean };
    categories: Array<{
        id: string;
        name: string;
        products: Array<{
            id: string;
            name: string;
            description?: string;
            price: string;
            imageUrl?: string;
            estimatedMinutes?: number;
            availability: string;
            featured: boolean;
        }>;
    }>;
};

const LOGO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";

export default function PublicMenuPage({ params }: { params: Promise<{ number: string }> }) {
    const { number } = use(params);
    const [search, setSearch] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["public-menu"],
        queryFn: () => api<Menu>("/api/public/menu")
    });

    if (isLoading || !data) return (
        <main className="min-h-dvh bg-neutral-50 dark:bg-neutral-950">
            <Skeleton className="h-52 rounded-none" />
            <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6"><Skeleton className="h-10 max-w-sm rounded-lg" /><Skeleton className="h-80 rounded-xl" /></div>
        </main>
    );

    const hasResults = data.categories.some(category => category.products.some(product => product.name.toLowerCase().includes(search.toLowerCase())));

    return (
        <main className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white">
            <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
                <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <img src={LOGO_URL} alt={data.settings.tradeName} className="h-12 w-12 object-contain" />
                            <div>
                                <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Carta digital</span>
                                <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{data.settings.tradeName}</h1>
                            </div>
                        </div>

                        <span className="w-fit rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                            Mesa {String(number).padStart(2, "0")}
                        </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                        {data.settings.address && <span className="flex items-center gap-1.5"><MapPin size={13} />{data.settings.address}</span>}
                        {data.settings.phone && <span className="flex items-center gap-1.5"><Phone size={13} />{data.settings.phone}</span>}
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6">
                <div className="relative max-w-sm">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar en la carta..." className="h-10 rounded-lg bg-white pl-9 text-sm dark:bg-neutral-900" />
                </div>

                {hasResults ? data.categories.map(category => {
                    const products = category.products.filter(product => product.name.toLowerCase().includes(search.toLowerCase()));
                    if (!products.length) return null;

                    return (
                        <section key={category.id}>
                            <div className="mb-3">
                                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Categoría</span>
                                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">{category.name}</h2>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {products.map(product => {
                                    const soldOut = product.availability === "SOLD_OUT";

                                    return (
                                        <article key={product.id} className={`overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 ${soldOut ? "opacity-60" : ""}`}>
                                            {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full object-cover" />}

                                            <div className="p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{product.name}</h3>
                                                    {product.featured && <Badge tone="neutral" className="rounded-md px-2 py-0 text-[10px]">Favorito</Badge>}
                                                </div>

                                                {product.description && <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-neutral-500 dark:text-neutral-400">{product.description}</p>}

                                                <div className="mt-3 flex items-center justify-between">
                                                    <span className="flex items-center gap-1 text-xs text-neutral-400"><Clock3 size={12} />{product.estimatedMinutes ?? 10} min</span>
                                                    {soldOut && <Badge tone="danger" className="rounded-md px-2 py-0 text-[10px]">Agotado</Badge>}
                                                </div>

                                                <div className="mt-3 border-t border-neutral-100 pt-3 dark:border-neutral-800">
                                                    <strong className="text-base font-semibold text-neutral-900 dark:text-white">{money(product.price)}</strong>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    );
                }) : <EmptyState icon={<Search />} title="Sin resultados" detail="No encontramos productos con ese nombre." />}
            </section>

            <footer className="border-t border-neutral-200 bg-white px-4 py-4 text-center text-[11px] text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
                {data.settings.tradeName}
            </footer>
        </main>
    );
}