"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

export function ThemeButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={`Tema ${label}`}
            className={cn(
                "flex h-7 w-8 items-center justify-center rounded-md transition",
                active
                    ? "bg-white text-neutral-900 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] dark:bg-[#1b1c1e] dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                    : "text-neutral-400 hover:text-neutral-700 dark:text-[#6a6b6c] dark:hover:text-[#e6e6e6]"
            )}
        >
            {children}
        </button>
    );
}

export function ThemeSwitcher({ className, buttonClassName }: { className?: string; buttonClassName?: string }) {
    const { theme, changeTheme } = useTheme();
    return (
        <div aria-label="Seleccionar tema" className={cn("flex items-center rounded-lg border border-neutral-200 bg-neutral-100/80 p-1 dark:border-[#363739] dark:bg-black/30", className)}>
            <ThemeButton active={theme === "light"} label="Claro" onClick={() => changeTheme("light")}><Sun size={14} className={buttonClassName} /></ThemeButton>
            <ThemeButton active={theme === "dark"} label="Oscuro" onClick={() => changeTheme("dark")}><Moon size={14} className={buttonClassName} /></ThemeButton>
            <ThemeButton active={theme === "system"} label="Sistema" onClick={() => changeTheme("system")}><Laptop size={14} className={buttonClassName} /></ThemeButton>
        </div>
    );
}
