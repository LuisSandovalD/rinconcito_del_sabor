
export default function StorefrontLoading() {
    return (
        <div className="animate-pulse space-y-12 py-10" aria-label="Cargando productos" role="status">
            <span className="sr-only">Cargando productos...</span>

            {/* Filtros de categorías */}
            <div className="flex gap-3 overflow-hidden border-b border-neutral-200 pb-5 dark:border-neutral-800">
                {[120, 90, 110, 85, 95].map((width, index) => (
                    <div
                        key={index}
                        style={{ width }}
                        className="h-10 shrink-0 rounded-lg bg-neutral-200 dark:bg-neutral-800"
                    />
                ))}
            </div>

            {/* Buscador */}
            <div className="h-11 w-full max-w-sm rounded-xl bg-neutral-200 dark:bg-neutral-800" />

            {/* Categorías y productos */}
            {[1, 2].map(section => (
                <section key={section} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
                        <div className="space-y-3">
                            <div className="h-2 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
                            <div className="h-7 w-44 max-w-full rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                        </div>
                        <div className="h-7 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                        {[1, 2, 3, 4].map(product => (
                            <article
                                key={product}
                                className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
                            >
                                {/* Imagen */}
                                <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-800" />

                                {/* Información */}
                                <div className="space-y-4 p-4">
                                    <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-3 w-full rounded bg-neutral-100 dark:bg-neutral-800/70" />
                                    <div className="h-3 w-2/3 rounded bg-neutral-100 dark:bg-neutral-800/70" />

                                    <div className="flex items-center justify-between pt-2">
                                        <div className="h-4 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                                        <div className="h-9 w-24 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}
