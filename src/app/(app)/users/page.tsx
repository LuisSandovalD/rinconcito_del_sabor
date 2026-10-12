"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Badge, Button, Input, Pagination, PageHeader, Skeleton, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { CreateUserDialog, type UserRoleOption } from "@/components/users/create-user-dialog";

type User = { id: string; email: string; firstName: string; lastName: string; status: "ACTIVE" | "DISABLED" | "LOCKED"; lastLoginAt?: string; roles: Array<{ role: { id: string; name: string } }> };
type Role = UserRoleOption;

export default function UsersPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => api<{ users: User[]; roles: Role[] }>("/api/users") });

  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: User["status"] }) => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ status: value }) }),
    onSuccess: () => { toast.success("Acceso actualizado."); void client.invalidateQueries({ queryKey: ["users"] }); },
    onError: error => toast.error(error.message)
  });

  if (isLoading || !data) return <div className="space-y-4"><PageHeader title="Usuarios y roles" /><Skeleton className="h-[500px] rounded-xl" /></div>;

  const filteredUsers = data.users.filter(user => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(search.toLowerCase()));
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const users = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-4">
      <PageHeader eyebrow="ACCESOS" title="Usuarios y roles" description="Administra trabajadores, roles y estados de acceso." action={<Button onClick={() => setOpen(true)} className="h-9 gap-2 rounded-lg px-3 text-sm"><Plus size={15} />Nuevo usuario</Button>} />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Usuarios" value={data.users.length} />
        <StatCard label="Activos" value={data.users.filter(user => user.status === "ACTIVE").length} />
        <StatCard label="Roles" value={data.roles.length} />
      </section>

      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar trabajador..." className="h-9 rounded-lg pl-9 text-sm" /></div>
        <span className="hidden text-xs text-neutral-400 sm:block">{filteredUsers.length} registros</span>
      </div>

      <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-neutral-50 dark:bg-neutral-950/50">
                <TableHead className="h-10 text-xs font-semibold">Trabajador</TableHead>
                <TableHead className="h-10 text-xs font-semibold">Correo</TableHead>
                <TableHead className="h-10 text-xs font-semibold">Rol</TableHead>
                <TableHead className="h-10 text-xs font-semibold">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <TableCell className="py-2.5"><strong className="text-sm font-medium text-neutral-900 dark:text-white">{user.firstName} {user.lastName}</strong></TableCell>
                  <TableCell className="py-2.5"><span className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"><Mail size={13} />{user.email}</span></TableCell>
                  <TableCell className="py-2.5"><div className="flex flex-wrap gap-1">{user.roles.length ? user.roles.map(item => <Badge key={item.role.id} tone="neutral" className="rounded-md px-2 py-0 text-[10px]">{item.role.name}</Badge>) : <Badge tone="neutral" className="rounded-md px-2 py-0 text-[10px]">Sin rol</Badge>}</div></TableCell>
                  <TableCell className="py-2.5">
                    <button type="button" onClick={() => status.mutate({ id: user.id, value: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })} className="rounded-md px-2 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white">
                      {user.status === "ACTIVE" ? "Activo" : user.status === "LOCKED" ? "Bloqueado" : "Desactivado"}
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-neutral-200 px-3 py-2 dark:border-neutral-800"><Pagination page={safePage} totalPages={totalPages} totalItems={filteredUsers.length} pageSize={pageSize} onPageChange={setPage} /></div>
      </section>

      <CreateUserDialog open={open} roles={data.roles} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); void client.invalidateQueries({ queryKey: ["users"] }); }} />
    </div>
  );
}
