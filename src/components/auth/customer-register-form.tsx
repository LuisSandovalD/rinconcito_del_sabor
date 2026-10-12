"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import { api } from "@/lib/client-api";

export function CustomerRegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api("/api/customer-auth/register", { method: "POST", body: JSON.stringify(form) });
      toast.success("Cuenta creada de forma segura.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };
  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));
  return <form onSubmit={submit} className="mt-5"><div className="text-center"><span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Cuenta de cliente</span><h1 className="mt-1 text-2xl font-semibold tracking-tight">Crea tu cuenta</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">La usaremos para identificar y proteger tus pedidos.</p></div><div className="mt-6 space-y-3"><Field label="Nombre completo" value={form.name} onChange={value => set("name", value)} autoComplete="name" /><Field label="Correo electrónico" value={form.email} onChange={value => set("email", value)} type="email" autoComplete="email" /><Field label="Teléfono" value={form.phone} onChange={value => set("phone", value)} type="tel" autoComplete="tel" /><Field label="Contraseña" value={form.password} onChange={value => set("password", value)} type="password" autoComplete="new-password" minLength={12} /><p className="text-[11px] leading-5 text-neutral-400">Mínimo 12 caracteres, con mayúscula, minúscula y número.</p></div><Button type="submit" loading={loading} className="mt-5 h-10 w-full rounded-lg">Crear cuenta</Button><p className="mt-5 text-center text-sm text-neutral-500">¿Ya tienes cuenta? <Link href="/cuenta/login" className="font-semibold text-neutral-900 hover:underline dark:text-white">Inicia sesión</Link></p></form>;
}

function Field({ label, onChange, ...props }: { label: string; onChange: (value: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return <label className="block text-sm"><span className="mb-1 block font-medium">{label}</span><Input required className="h-10 rounded-lg" onChange={event => onChange(event.target.value)} {...props} /></label>;
}
