"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input } from "@/components/ui";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try { await api("/api/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }); setDone(true); } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos cambiar la contraseña."); } finally { setLoading(false); } };

  if (done) return <div className="mt-6 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-200"><Check size={18} /></div><span className="mt-4 block text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Seguridad</span><h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Contraseña actualizada</h1><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Ya puedes ingresar con tu nueva contraseña. Las sesiones anteriores fueron cerradas.</p><Link href="/personal/acceso" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-neutral-900 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">Ingresar al sistema</Link></div>;

  return <form onSubmit={submit} className="mt-6"><div className="text-center"><span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Seguridad</span><h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Crea una nueva contraseña</h1><p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Usa al menos 12 caracteres, una mayúscula y un número.</p></div><label className="mt-6 block text-sm"><span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-200">Nueva contraseña</span><div className="relative"><LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input type={show ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} minLength={12} required autoFocus autoComplete="new-password" placeholder="Mínimo 12 caracteres" className="h-10 rounded-lg border-neutral-200 bg-white px-9 text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900" /><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>{!token && <p className="mt-2 text-xs text-red-500">El enlace no contiene un token válido. Solicita un nuevo enlace de recuperación.</p>}<Button type="submit" loading={loading} disabled={!token} className="mt-5 h-10 w-full rounded-lg text-sm font-medium">{loading ? "Guardando..." : "Guardar nueva contraseña"}</Button><Link href="/personal/acceso" className="mt-4 block text-center text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">Volver al ingreso</Link></form>;
}
