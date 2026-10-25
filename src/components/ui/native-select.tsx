
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function NativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "flex h-11 w-full min-w-0 appearance-none rounded-xl border border-neutral-200 bg-white px-4 py-2 pr-10 text-sm text-neutral-900",
        "shadow-sm outline-none transition-all duration-200",
        "hover:border-neutral-300",
        "focus-visible:border-neutral-400 focus-visible:ring-4 focus-visible:ring-neutral-500/10",
        "aria-invalid:border-neutral-500 aria-invalid:ring-4 aria-invalid:ring-neutral-500/10",
        "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400",
        "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
        "dark:hover:border-neutral-700",
        "dark:focus-visible:border-neutral-600 dark:focus-visible:ring-neutral-400/10",
        "dark:aria-invalid:border-neutral-500 dark:aria-invalid:ring-neutral-400/10",
        "dark:disabled:border-neutral-800 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600",
        "dark:[color-scheme:dark]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
