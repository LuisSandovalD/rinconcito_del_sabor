"use client";

import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "primary" | "secondary" | "outline" | "ghost" | "destructive" | "danger";
type Size = "default" | "sm" | "lg" | "icon";

const legacyVariant: Record<Variant, string> = { default: "button-primary", primary: "button-primary", secondary: "button-secondary", outline: "button-secondary", ghost: "button-ghost", destructive: "button-danger", danger: "button-danger" };

const variantClasses: Record<Variant, string> = {
  default: "bg-foreground text-background hover:opacity-90",
  primary: "bg-foreground text-background hover:opacity-90",
  secondary: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
  outline: "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-white hover:opacity-90",
  danger: "bg-destructive text-white hover:opacity-90"
};

const sizeClasses: Record<Size, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-11 rounded-md px-6",
  icon: "size-10"
};

export function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      className={cn(
        "button", legacyVariant[variant], "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <LoaderCircle className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
