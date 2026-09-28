import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info";

const variants: Record<Variant, string> = {
  default: "border-transparent bg-foreground text-background",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  destructive: "border-transparent bg-destructive/12 text-destructive",
  success: "border-transparent bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  warning: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  info: "border-transparent bg-sky-500/12 text-sky-700 dark:text-sky-300"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
