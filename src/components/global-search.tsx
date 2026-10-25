"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Command } from "lucide-react";

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const close = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  if (!open) return null;

  const options = [
    {
      label: "Salón y mesas",
      keywords: "mesa salon terraza",
      href: "/tables",
    },
    {
      label: "Pedidos activos",
      keywords: "pedido orden",
      href: "/orders",
    },
    {
      label: "Pantalla de cocina",
      keywords: "cocina kds comanda",
      href: "/kitchen",
    },
    {
      label: "Cobrar cuentas",
      keywords: "caja pago cobrar",
      href: "/cash",
    },
    {
      label: "Productos y disponibilidad",
      keywords: "producto plato menu agotado",
      href: "/products",
    },
    {
      label: "Inventario",
      keywords: "stock ingrediente",
      href: "/inventory",
    },
    {
      label: "Reportes de ventas",
      keywords: "reporte venta estadistica",
      href: "/reports",
    },
  ].filter((item) =>
    `${item.label} ${item.keywords}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-3 pt-[12vh] backdrop-blur-sm sm:px-5"
      onMouseDown={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex h-14 items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-800">
          <Search
            size={19}
            className="shrink-0 text-neutral-400"
          />

          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="¿A dónde quieres ir?"
            aria-label="Buscar páginas"
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white dark:placeholder:text-neutral-500"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="button"
            onClick={close}
            aria-label="Cerrar búsqueda"
            className="rounded-md p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Navegación
          </p>

          {options.length > 0 ? (
            options.map((option) => (
              <button
                key={option.href}
                type="button"
                onClick={() => {
                  close();
                  router.push(option.href);
                }}
                className="group flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                <span className="truncate font-medium">
                  {option.label}
                </span>

                <span className="flex shrink-0 items-center gap-2 text-xs text-neutral-400">
                  <span className="hidden sm:inline">Abrir</span>
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Search
                size={22}
                className="text-neutral-400"
              />

              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No encontramos resultados
              </p>

              <p className="text-xs text-neutral-400">
                Prueba con otro término de búsqueda.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50">
          <span className="text-xs text-neutral-400">
            Buscar en el sistema
          </span>

          <button
            type="button"
            onClick={close}
            className="flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <Command size={12} />
            Esc para cerrar
          </button>
        </div>
      </div>
    </div>
  );
}