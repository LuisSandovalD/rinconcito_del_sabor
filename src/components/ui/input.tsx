
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, type = "text", ...props },
  ref
) {
  return (
    <input
      data-slot="input"
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900",
        "shadow-sm outline-none transition-all duration-200",
        "placeholder:text-neutral-400",
        "hover:border-neutral-300",
        "focus-visible:border-neutral-400 focus-visible:ring-4 focus-visible:ring-neutral-500/10",
        "aria-invalid:border-neutral-500 aria-invalid:ring-4 aria-invalid:ring-neutral-500/10",
        "disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400",
        "dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100",
        "dark:placeholder:text-neutral-500",
        "dark:hover:border-neutral-700",
        "dark:focus-visible:border-neutral-600 dark:focus-visible:ring-neutral-400/10",
        "dark:aria-invalid:border-neutral-500 dark:aria-invalid:ring-neutral-400/10",
        "dark:disabled:border-neutral-800 dark:disabled:bg-neutral-900 dark:disabled:text-neutral-600",
        "file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "selection:bg-neutral-200 selection:text-neutral-900 dark:selection:bg-neutral-700 dark:selection:text-white",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
