"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className
}: {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter(value => value === 1 || value === totalPages || Math.abs(value - page) <= 1);

  const compact: Array<number | "ellipsis"> = [];
  for (const value of pages) {
    const previous = compact[compact.length - 1];
    if (typeof previous === "number" && value - previous > 1) compact.push("ellipsis");
    compact.push(value);
  }

  const start = pageSize && totalItems ? (page - 1) * pageSize + 1 : undefined;
  const end = pageSize && totalItems ? Math.min(page * pageSize, totalItems) : undefined;

  return (
    <div data-slot="pagination" className={cn("flex flex-wrap items-center justify-between gap-3 py-4", className)}>
      <span className="text-sm text-muted-foreground">
        {start && end && totalItems ? `Mostrando ${start}–${end} de ${totalItems}` : `Página ${page} de ${totalPages}`}
      </span>
      <nav className="flex items-center gap-1" aria-label="Paginación">
        <Button type="button" variant="outline" size="icon" className="size-9" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">
          <ChevronLeft />
        </Button>
        {compact.map((item, index) => item === "ellipsis"
          ? <span key={`ellipsis-${index}`} className="grid size-9 place-items-center text-muted-foreground">…</span>
          : <Button key={item} type="button" variant={item === page ? "default" : "ghost"} size="icon" className="size-9" onClick={() => onPageChange(item)} aria-current={item === page ? "page" : undefined}>{item}</Button>
        )}
        <Button type="button" variant="outline" size="icon" className="size-9" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Página siguiente">
          <ChevronRight />
        </Button>
      </nav>
    </div>
  );
}
