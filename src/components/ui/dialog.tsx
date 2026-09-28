"use client";

import { createContext, useContext, useEffect, type HTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DialogContextValue = { open: boolean; onOpenChange: (open: boolean) => void };
const DialogContext = createContext<DialogContextValue | null>(null);

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return <DialogContext.Provider value={{ open, onOpenChange }}>{children}</DialogContext.Provider>;
}

function useDialog() {
  const value = useContext(DialogContext);
  if (!value) throw new Error("Dialog components must be used inside Dialog.");
  return value;
}

export function DialogContent({ className, children, showCloseButton = true, ...props }: HTMLAttributes<HTMLDivElement> & { showCloseButton?: boolean }) {
  const { open, onOpenChange } = useDialog();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div data-slot="dialog-portal" className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div data-slot="dialog-overlay" className="absolute inset-0 bg-black/30" onMouseDown={() => onOpenChange(false)} />
      <div
        data-slot="dialog-content"
        role="dialog"
        aria-modal="true"
        className={cn("relative z-10 grid w-full max-w-lg gap-4 rounded-xl border border-border bg-background p-6 text-foreground shadow-2xl", className)}
        onMouseDown={(event) => event.stopPropagation()}
        {...props}
      >
        {children}
        {showCloseButton && (
          <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3 size-8" onClick={() => onOpenChange(false)} aria-label="Cerrar">
            <X />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-header" className={cn("grid gap-1.5 text-center sm:text-left", className)} {...props} />;
}
export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 data-slot="dialog-title" className={cn("text-lg font-semibold leading-none", className)} {...props} />;
}
export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="dialog-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}
export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />;
}
