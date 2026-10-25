
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-900",
        "shadow-sm outline-none transition-all duration-200",
        "placeholder:text-neutral-400",
        "hover:border-neutral-300",
        "focus-visible:border-neutral-400 focus-visible:ring-4 focus-visible:ring-neutral-500/10",
        "aria-invalid:border-neutral-500 aria-invalid:ring-4 aria-invalid:ring-neutral-500/10",
        "disabled:cursor-not-allowed disabled:resize-none disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400",
        "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
        "dark:placeholder:text-neutral-500",
        "dark:hover:border-neutral-700",
        "dark:focus-visible:border-neutral-600 dark:focus-visible:ring-neutral-400/10",
        "dark:aria-invalid:border-neutral-500 dark:aria-invalid:ring-neutral-400/10",
        "dark:disabled:border-neutral-800 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600",
        "selection:bg-neutral-200 selection:text-neutral-900 dark:selection:bg-neutral-700 dark:selection:text-white",
        className
      )}
      {...props}
    />
  );
}
