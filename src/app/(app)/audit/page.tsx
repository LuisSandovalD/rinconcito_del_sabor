"use client";

import { useQuery } from "@tanstack/react-query";
import { Archive, Clock3, Search, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client-api";
import {
  Alert, AlertDescription, AlertTitle, Badge, EmptyState, Input, PageHeader, Skeleton,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui";

type Log = { id: string; action: string; module: string; entity?: string; entityId?: string; metadata?: Record<string, unknown>; createdAt: string; user?: { firstName: string; lastName: string } | null };

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const { data = [], isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => api<Log[]>("/api/audit") });

  if (isLoading) return <Skeleton className="h-[600px] rounded-xl"/>;

  const visible = data.filter(log => `${log.action} ${log.module} ${log.user?.firstName ?? ""}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="page-stack">
    <PageHeader eyebrow="TRAZABILIDAD" title="Auditoría" description="Cada operación sensible, registrada con su responsable."/>

    <Alert>
      <ShieldCheck/>
      <AlertTitle>Registro protegido</AlertTitle>
      <AlertDescription>Los eventos se conservan para trazabilidad y control interno.</AlertDescription>
    </Alert>

    <div className="search-field audit-search"><Search/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar acción, módulo o usuario..."/></div>

    <section className="panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acción</TableHead>
            <TableHead>Módulo</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Fecha y hora</TableHead>
            <TableHead>Entidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map(log => <TableRow key={log.id}>
            <TableCell><div className="flex items-center gap-2"><span className="audit-icon size-8"><Archive/></span><strong>{log.action.replaceAll("_", " ")}</strong></div></TableCell>
            <TableCell><Badge tone="info">{log.module}</Badge></TableCell>
            <TableCell><span className="flex items-center gap-2 text-muted-foreground"><UserRound className="size-4"/>{log.user ? `${log.user.firstName} ${log.user.lastName}` : "Sistema"}</span></TableCell>
            <TableCell><span className="flex items-center gap-2 text-muted-foreground"><Clock3 className="size-4"/>{new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(new Date(log.createdAt))}</span></TableCell>
            <TableCell>{log.entity ? `${log.entity} · ${log.entityId?.slice(0, 10) ?? ""}` : "—"}</TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </section>

    {!visible.length && <EmptyState icon={<Archive/>} title="Sin eventos" detail="Las operaciones sensibles aparecerán aquí."/>}
  </div>;
}
