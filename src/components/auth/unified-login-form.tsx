"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input } from "@/components/ui";

type LoginResult = { kind: "customer"; name: string } | { kind: "staff"; name: string; role: string };

export function UnifiedLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api<LoginResult>("/api/auth/unified-login", { method: "POST", body: JSON.stringify({ email, password }) });
      const requested = new URLSearchParams(window.location.search).get("next");
      if (result.kind === "customer") {
        toast.success(`Bienvenido, ${result.name.split(/\s+/)[0]}.`);
        router.replace(requested === "/cuenta" || requested === "/" ? requested : "/");
      } else {
        toast.success("Acceso autorizado.");
        const destination = result.role === "MESERO" ? "/tables" : result.role === "COCINA" ? "/kitchen" : result.role === "CAJERO" ? "/cash" : "/dashboard";
        router.replace(destination);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-5">
      <div className="text-center"><span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Acceso único y seguro</span><h1 className="mt-1 text-2xl font-semibold tracking-tight">Inicia sesión</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Usa tu cuenta de cliente o tus credenciales de personal.</p></div>
      <div className="mt-6 space-y-4">
        <label className="block text-sm"><span className="mb-1 block font-medium">Correo electrónico</span><div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={email} onChange={event => setEmail(event.target.value)} type="email" autoComplete="email" required className="h-10 rounded-lg pl-9" /></div></label>
        <label className="block text-sm"><span className="mb-1 block font-medium">Contraseña</span><div className="relative"><LockKeyhole size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" /><Input value={password} onChange={event => setPassword(event.target.value)} type={show ? "text" : "password"} autoComplete="current-password" required className="h-10 rounded-lg px-9" /><button type="button" onClick={() => setShow(value => !value)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
      </div>
      <Button type="submit" loading={loading} className="mt-5 h-10 w-full rounded-lg">Entrar</Button>
      <p className="mt-5 text-center text-sm text-neutral-500">¿Eres cliente nuevo? <Link href="/cuenta/registro" className="font-semibold text-neutral-900 hover:underline dark:text-white">Crea tu cuenta</Link></p>
    </form>
  );
}
