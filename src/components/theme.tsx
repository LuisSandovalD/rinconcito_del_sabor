"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

const themes = [
    { value: "light", label: "Claro", icon: Sun },
    { value: "dark", label: "Oscuro", icon: Moon },
    { value: "system", label: "Sistema", icon: Laptop }
] as const;

export function ThemeSwitcher({ className, buttonClassName }: { className?: string; buttonClassName?: string }) {
    const { theme, changeTheme } = useTheme();
    const currentIndex = themes.findIndex(item => item.value === theme);
    const current = themes[currentIndex >= 0 ? currentIndex : 0];
    const Icon = current.icon;

    const toggleTheme = () => {
        changeTheme(themes[(currentIndex + 1) % themes.length].value);
    };

    return (
        <button
            type="button"
            onClick={toggleTheme}
            title={`Tema ${current.label}. Pulsa para cambiar`}
            aria-label={`Tema actual: ${current.label}. Cambiar tema`}
            className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 dark:border-[#363739] dark:bg-black/30 dark:text-neutral-300 dark:hover:bg-neutral-800",
                className
            )}
        >
            <Icon size={17} className={buttonClassName} />
        </button>
    );
}