"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input, NativeSelect } from "@/components/ui";

type Zone = { tables: Array<{ id: string; number: number; capacity: number; status: string }> };

function defaultReservationDate() {
  const tomorrow = new Date(Date.now() + 86_400_000);
  tomorrow.setHours(19, 0, 0, 0);
  return tomorrow.toISOString().slice(0, 16);
}

export function CreateReservationDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { data: zones = [] } = useQuery({ queryKey: ["tables"], queryFn: () => api<Zone[]>("/api/tables") });
  const tables = zones.flatMap(zone => zone.tables).filter(table => table.status === "FREE");
  const [form, setForm] = useState(() => ({ customerName: "", phone: "", partySize: 2, reservedFor: defaultReservationDate(), tableId: "", notes: "" }));
  const mutation = useMutation({
    mutationFn: () => api("/api/reservations", { method: "POST", body: JSON.stringify({ ...form, reservedFor: new Date(form.reservedFor).toISOString(), tableId: form.tableId || null }) }),
    onSuccess: () => { toast.success("Reserva registrada."); onCreated(); },
    onError: error => toast.error(error.message)
  });

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3"><form onSubmit={event => { event.preventDefault(); mutation.mutate(); }} className="relative w-full max-w-sm rounded-xl bg-white p-4 dark:bg-neutral-900"><button type="button" onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"><X size={17} /></button><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">Nueva reserva</span><h2 className="mt-0.5 text-lg font-semibold">Datos de la visita</h2><div className="mt-3 space-y-3"><label className="block text-sm"><span className="mb-1 block font-medium">Cliente</span><Input value={form.customerName} onChange={event => setForm({ ...form, customerName: event.target.value })} required className="h-9 rounded-lg" /></label><label className="block text-sm"><span className="mb-1 block font-medium">Teléfono</span><Input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} required className="h-9 rounded-lg" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm"><span className="mb-1 block font-medium">Fecha y hora</span><Input type="datetime-local" value={form.reservedFor} onChange={event => setForm({ ...form, reservedFor: event.target.value })} required className="h-9 rounded-lg" /></label><label className="block text-sm"><span className="mb-1 block font-medium">Personas</span><Input type="number" min="1" value={form.partySize} onChange={event => setForm({ ...form, partySize: Number(event.target.value) })} className="h-9 rounded-lg" /></label></div><label className="block text-sm"><span className="mb-1 block font-medium">Mesa</span><NativeSelect value={form.tableId} onChange={event => setForm({ ...form, tableId: event.target.value })} className="h-9 rounded-lg"><option value="">Asignar después</option>{tables.map(table => <option key={table.id} value={table.id}>Mesa {table.number} · {table.capacity} personas</option>)}</NativeSelect></label></div><Button type="submit" loading={mutation.isPending} className="mt-3 h-9 w-full rounded-lg text-sm">Guardar reserva</Button></form></div>;
}
