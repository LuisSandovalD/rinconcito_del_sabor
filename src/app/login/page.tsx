"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Laptop, LockKeyhole, Mail, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ThemeButton } from "@/components/theme";

type Theme = "light" | "dark" | "system";

const HERO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822417/8615ef40-d7b1-45fb-b564-d7103a9f7664.png";
const LOGO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setTheme(saved);
    applyTheme(saved);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => saved === "system" && applyTheme("system");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);

  const applyTheme = (value: Theme) => {
    const dark = value === "dark" || (value === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  };

  const changeTheme = (value: Theme) => {
    setTheme(value);
    localStorage.setItem("theme", value);
    applyTheme(value);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await api<{ role: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      toast.success("Bienvenido. Todo está listo.");
      const destination = result.role === "MESERO" ? "/tables" : result.role === "COCINA" ? "/kitchen" : result.role === "CAJERO" ? "/cash" : "/dashboard";
      router.replace(destination);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-white dark:bg-neutral-950 lg:grid-cols-[minmax(0,2fr)_minmax(390px,0.85fr)]">
      <section aria-label="Rinconcito del Sabor" className="relative hidden min-h-dvh overflow-hidden border-r border-neutral-200 dark:border-neutral-800 lg:block">
        <img src={HERO_URL} alt="Rinconcito del Sabor" className="absolute inset-0 h-full w-full object-fill" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/15" />
      </section>

      <section className="flex min-h-dvh flex-col bg-white text-neutral-900 dark:bg-neutral-950 dark:text-white">
        <header className="flex h-14 items-center justify-end px-5 lg:px-8">
          <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-1 dark:border-neutral-800 dark:bg-neutral-900">
            <ThemeButton active={theme === "light"} label="Claro" onClick={() => changeTheme("light")}><Sun size={14} /></ThemeButton>
            <ThemeButton active={theme === "dark"} label="Oscuro" onClick={() => changeTheme("dark")}><Moon size={14} /></ThemeButton>
            <ThemeButton active={theme === "system"} label="Sistema" onClick={() => changeTheme("system")}><Laptop size={14} /></ThemeButton>
          </div>
        </header>

        <form onSubmit={submit} className="flex flex-1 items-center px-6 py-6 lg:px-10">
          <div className="mx-auto w-full max-w-sm">
            <div className="flex justify-center">
              <img src={LOGO_URL} alt="Logo Rinconcito del Sabor" className="h-auto w-full max-w-[220px] object-contain" fetchPriority="high" />
            </div>

            <div className="mt-5 text-center">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Acceso al sistema</span>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Inicia sesión</h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Ingresa tus credenciales para continuar.</p>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-200">Correo electrónico</span>
                <div className="relative">
                  <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="tu@restaurante.pe" required className="h-10 rounded-lg border-neutral-200 bg-white pl-9 text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900" />
                </div>
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-200">Contraseña</span>
                <div className="relative">
                  <LockKeyhole size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input value={password} onChange={e => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete="current-password" placeholder="Tu contraseña" required className="h-10 rounded-lg border-neutral-200 bg-white px-9 text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900" />
                  <button type="button" onClick={() => setShow(value => !value)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <input type="checkbox" className="h-3.5 w-3.5 rounded border-neutral-300 accent-neutral-900 dark:accent-white" />
                Recordarme
              </label>
              <a href="/forgot-password" className="text-xs font-medium text-neutral-600 hover:text-neutral-950 hover:underline dark:text-neutral-300 dark:hover:text-white">¿Olvidaste tu contraseña?</a>
            </div>

            <Button type="submit" loading={loading} className="mt-5 h-10 w-full rounded-lg text-sm font-medium">{loading ? "Ingresando..." : "Ingresar al sistema"}</Button>

            <div className="mt-5 border-t border-neutral-100 pt-4 text-center dark:border-neutral-800">
              <p className="text-xs text-neutral-400">¿Necesitas ayuda? <a href="mailto:soporte@rinconcito.pe" className="font-medium text-neutral-600 hover:underline dark:text-neutral-300">Contacta a soporte</a></p>
            </div>
          </div>
        </form>

        <footer className="px-6 py-4 text-center text-[11px] text-neutral-400">© 2026 Rinconcito del Sabor</footer>
      </section>
    </main>
  );
}
