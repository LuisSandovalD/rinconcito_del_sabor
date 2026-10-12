"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Laptop, Mail, Moon, Send, Sun } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { ThemeButton } from "@/components/theme";

type Theme = "light" | "dark" | "system";

const HERO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822417/8615ef40-d7b1-45fb-b564-d7103a9f7664.png";
const LOGO_URL = "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
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
            await api("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
            setSent(true);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "No pudimos enviar el enlace.");
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

                <div className="flex flex-1 items-center px-6 py-6 lg:px-10">
                    <div className="mx-auto w-full max-w-sm">
                        <div className="flex justify-center">
                            <img src={LOGO_URL} alt="Logo Rinconcito del Sabor" className="h-auto w-full max-w-[220px] object-contain" fetchPriority="high" />
                        </div>

                        {sent ? (
                            <div className="mt-6 text-center">
                                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Recuperación de acceso</span>
                                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">Revisa tu correo</h1>
                                <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Si <strong className="font-medium text-neutral-700 dark:text-neutral-200">{email}</strong> está registrado, recibirás un enlace seguro válido durante 30 minutos.</p>

                                <a href="/login" className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-white">
                                    <ArrowLeft size={15} />
                                    Volver al ingreso
                                </a>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="mt-6">
                                <div className="text-center">
                                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-400">Recuperar acceso</span>
                                    <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">¿Olvidaste tu contraseña?</h1>
                                    <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">Ingresa tu correo y te enviaremos un enlace de recuperación.</p>
                                </div>

                                <label className="mt-6 block text-sm">
                                    <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-200">Correo electrónico</span>
                                    <div className="relative">
                                        <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus autoComplete="email" placeholder="tu@restaurante.pe" className="h-10 rounded-lg border-neutral-200 bg-white pl-9 text-sm shadow-none dark:border-neutral-800 dark:bg-neutral-900" />
                                    </div>
                                </label>

                                <Button type="submit" loading={loading} className="mt-5 h-10 w-full gap-2 rounded-lg text-sm font-medium">
                                    <Send size={15} />
                                    {loading ? "Enviando..." : "Enviar enlace"}
                                </Button>

                                <a href="/login" className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
                                    <ArrowLeft size={13} />
                                    Volver al ingreso
                                </a>
                            </form>
                        )}
                    </div>
                </div>

                <footer className="px-6 py-4 text-center text-[11px] text-neutral-400">© 2026 Rinconcito del Sabor</footer>
            </section>
        </main>
    );
}

