"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, NativeSelect } from "@/components/ui";

export type UserRoleOption = { id: string; name: string; description?: string };

export function CreateUserDialog({ open, roles, onClose, onCreated }: { open: boolean; roles: UserRoleOption[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", roleId: roles[0]?.id ?? "" });
  const mutation = useMutation({
    mutationFn: () => api("/api/users", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => { toast.success("Usuario creado. Enviamos el enlace para configurar su contraseña."); onCreated(); },
    onError: error => toast.error(error.message)
  });

  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-sm rounded-xl p-4">
        <DialogHeader className="space-y-1"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Nuevo trabajador</span><DialogTitle className="text-lg">Crear usuario</DialogTitle><DialogDescription>Recibirá un correo para configurar su contraseña.</DialogDescription></DialogHeader>
        <form className="mt-2 grid gap-3" onSubmit={event => { event.preventDefault(); mutation.mutate(); }}>
          <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm"><span className="mb-1 block font-medium">Nombres</span><Input value={form.firstName} onChange={event => setForm({ ...form, firstName: event.target.value })} required className="h-9 rounded-lg" /></label><label className="text-sm"><span className="mb-1 block font-medium">Apellidos</span><Input value={form.lastName} onChange={event => setForm({ ...form, lastName: event.target.value })} required className="h-9 rounded-lg" /></label></div>
          <label className="text-sm"><span className="mb-1 block font-medium">Correo</span><Input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required className="h-9 rounded-lg" /></label>
          <label className="text-sm"><span className="mb-1 block font-medium">Rol</span><NativeSelect value={form.roleId} onChange={event => setForm({ ...form, roleId: event.target.value })} className="h-9 rounded-lg">{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</NativeSelect></label>
          <Button type="submit" loading={mutation.isPending} className="mt-1 h-9 rounded-lg text-sm">Crear y enviar acceso</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
