"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Plus, Search, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import {
  Badge, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  Input, NativeSelect, PageHeader, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui";

type User = { id: string; email: string; firstName: string; lastName: string; status: "ACTIVE" | "DISABLED" | "LOCKED"; lastLoginAt?: string; roles: Array<{ role: { id: string; name: string } }> };
type Role = { id: string; name: string; description?: string };

export default function UsersPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => api<{ users: User[]; roles: Role[] }>("/api/users") });
  const status = useMutation({
    mutationFn: ({ id, value }: { id: string; value: User["status"] }) => api(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify({ status: value }) }),
    onSuccess: () => { toast.success("Acceso actualizado."); void client.invalidateQueries({ queryKey: ["users"] }); },
    onError: error => toast.error(error.message)
  });

  if (isLoading || !data) return <Skeleton className="h-[600px] rounded-xl"/>;
  const users = data.users.filter(user => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="page-stack">
    <PageHeader eyebrow="EQUIPO Y ACCESO" title="Usuarios y roles" description="Cada trabajador ve solo las herramientas que necesita." action={<Button onClick={() => setOpen(true)}><Plus/> Nuevo usuario</Button>}/>

    <section className="inventory-summary">
      <article><span><UsersRound/></span><div><small>USUARIOS</small><strong>{data.users.length}</strong></div></article>
      <article><span className="green"><ShieldCheck/></span><div><small>ACTIVOS</small><strong>{data.users.filter(u => u.status === "ACTIVE").length}</strong></div></article>
      <article><span className="warn"><UserRound/></span><div><small>ROLES</small><strong>{data.roles.length}</strong></div></article>
    </section>

    <div className="search-field inventory-search"><Search/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar trabajador..."/></div>

    <section className="panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trabajador</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map(user => <TableRow key={user.id}>
            <TableCell><div className="flex items-center gap-3"><div className="user-avatar">{user.firstName[0]}{user.lastName[0]}</div><strong>{user.firstName} {user.lastName}</strong></div></TableCell>
            <TableCell><span className="flex items-center gap-2 text-muted-foreground"><Mail className="size-4"/> {user.email}</span></TableCell>
            <TableCell><Badge tone="info">{user.roles.map(item => item.role.name).join(", ")}</Badge></TableCell>
            <TableCell><Button variant="ghost" className="h-8 px-2" onClick={() => status.mutate({ id: user.id, value: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" })}><span className={`size-2 rounded-full ${user.status === "ACTIVE" ? "bg-emerald-500" : "bg-destructive"}`}/>{user.status === "ACTIVE" ? "Activo" : "Desactivado"}</Button></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </section>

    <CreateUser open={open} roles={data.roles} onClose={() => setOpen(false)} onCreated={() => { setOpen(false); void client.invalidateQueries({ queryKey: ["users"] }); }}/>
  </div>;
}

function CreateUser({ open, roles, onClose, onCreated }: { open: boolean; roles: Role[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", roleId: roles[0]?.id ?? "" });
  const mutation = useMutation({
    mutationFn: () => api("/api/users", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => { toast.success("Usuario creado. Enviamos el enlace para configurar su contraseña."); onCreated(); },
    onError: error => toast.error(error.message)
  });

  return <Dialog open={open} onOpenChange={value => !value && onClose()}>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <p className="eyebrow">NUEVO TRABAJADOR</p>
        <DialogTitle>Crear usuario</DialogTitle>
        <DialogDescription>Recibirá un correo seguro para establecer su contraseña.</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>Nombres<Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required/></label>
          <label>Apellidos<Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required/></label>
        </div>
        <label>Correo<Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required/></label>
        <label>Rol<NativeSelect value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</NativeSelect></label>
        <Button type="submit" loading={mutation.isPending}>Crear y enviar acceso</Button>
      </form>
    </DialogContent>
  </Dialog>;
}
