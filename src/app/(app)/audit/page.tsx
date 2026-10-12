"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, Clock3, Search, ShieldCheck, UserRound } from "lucide-react";
import { api } from "@/lib/client-api";
import { Alert, AlertDescription, Badge, EmptyState, Input, Pagination, PageHeader, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";

type Log = { id: string; action: string; module: string; entity?: string; entityId?: string; metadata?: Record<string, unknown>; createdAt: string; user?: { firstName: string; lastName: string } | null };

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data = [], isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => api<Log[]>("/api/audit") });

  if (isLoading) return <div className="space-y-4"><PageHeader title="Auditoría" /><Skeleton className="h-[500px] rounded-xl" /></div>;

  const filtered = data.filter(log => `${log.action} ${log.module} ${log.user?.firstName ?? ""} ${log.user?.lastName ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="TRAZABILIDAD" title="Auditoría" description="Registro de operaciones sensibles realizadas en el sistema." />

      <Alert className="rounded-lg border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
        <ShieldCheck className="text-neutral-400" />
        <AlertDescription className="text-sm">Los eventos se conservan para trazabilidad y control interno.</AlertDescription>
      </Alert>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar acción, módulo o usuario..." className="h-9 rounded-lg pl-9 text-sm" />
        </div>
        <span className="hidden text-xs text-neutral-400 sm:block">{filtered.length} registros</span>
      </div>

      {filtered.length ? (
        <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 dark:bg-neutral-950/50">
                  <TableHead className="h-10 text-xs font-semibold">Acción</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Módulo</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Responsable</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Fecha y hora</TableHead>
                  <TableHead className="h-10 text-xs font-semibold">Entidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(log => (
                  <TableRow key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Archive size={15} className="shrink-0 text-neutral-400" />
                        <strong className="text-sm font-medium capitalize text-neutral-900 dark:text-white">{log.action.replaceAll("_", " ").toLowerCase()}</strong>
                      </div>
                    </TableCell>
                    <TableCell className="py-2.5"><Badge tone="neutral" className="rounded-md px-2 py-0 text-[10px]">{log.module}</Badge></TableCell>
                    <TableCell className="py-2.5"><span className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"><UserRound size={14} />{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistema"}</span></TableCell>
                    <TableCell className="py-2.5"><span className="flex items-center gap-2 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400"><Clock3 size={14} />{new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(log.createdAt))}</span></TableCell>
                    <TableCell className="py-2.5"><span className="text-sm text-neutral-500 dark:text-neutral-400">{log.entity ? `${log.entity}${log.entityId ? ` · ${log.entityId.slice(0, 10)}` : ""}` : "—"}</span></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-800"><Pagination page={safePage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} /></div>
        </section>
      ) : (
        <EmptyState icon={<Archive />} title="Sin eventos" detail={search ? "No encontramos registros con ese criterio." : "Las operaciones sensibles aparecerán aquí."} />
      )}
    </div>
  );
}