"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input } from "@/components/ui";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setLoading(true); try { await api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }); setSent(true); } catch (error) { toast.error(error instanceof Error ? error.message : "No pudimos enviar el enlace."); } finally { setLoading(false); } };

  if (sent) return <div className="mt-6 text-center"><span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Recuperación de acceso</span><h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Revisa tu correo</h1><p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Si <strong className="font-medium text-neutral-700 dark:text-neutral-200">{email}</strong> está registrado, recibirás un enlace seguro válido durante 30 minutos.</p><Link href="/personal/acceso" className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white"><ArrowLeft size={15} />Volver al ingreso</Link></div>;

  return <form onSubmit={submit} className="mt-6"><div className="text-center"><span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Recuperar acceso</span><h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">¿Olvidaste tu contraseña?</h1><p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Ingresa tu correo y te enviaremos un enlace de recuperación.</p></div><label className="mt-6 block text-sm"><span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-200">Correo electrónico</span><div className="relative"><Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoFocus autoComplete="email" placeholder="tu@restaurante.pe" className="h-10 rounded-lg border-neutral-200 bg-white pl-9 text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900" /></div></label><Button type="submit" loading={loading} className="mt-5 h-10 w-full gap-2 rounded-lg text-sm font-medium"><Send size={15} />{loading ? "Enviando..." : "Enviar enlace"}</Button><Link href="/personal/acceso" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"><ArrowLeft size={13} />Volver al ingreso</Link></form>;
}
