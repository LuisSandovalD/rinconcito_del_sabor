import { cn } from "@/lib/utils";

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
                    ? "bg-white text-neutral-900 dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            )}
        >
            {children}
        </button>
    );
}