
"use client";

import { createContext, useContext, useEffect, useId, useRef, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
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
  const titleId = useId();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    const previous = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    contentRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div data-slot="dialog-portal" className="fixed inset-0 z-[2147483000] flex items-center justify-center overflow-y-auto p-4">
      <div data-slot="dialog-overlay" className="absolute inset-0 bg-black/55 backdrop-blur-[3px] transition-opacity" onMouseDown={() => onOpenChange(false)} />
      <div ref={contentRef} data-slot="dialog-content" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className={cn("relative z-10 grid w-full max-w-lg gap-4 rounded-2xl border border-neutral-200/80 bg-white p-6 text-neutral-900 shadow-2xl shadow-black/15 outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:shadow-black/40", className)} onMouseDown={event => event.stopPropagation()} {...props}>
        {children}
        {showCloseButton && <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-3 size-8 rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100" onClick={() => onOpenChange(false)} aria-label="Cerrar"><X size={16} strokeWidth={1.8} /></Button>}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-header" className={cn("grid gap-1.5 pr-8 text-left", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 data-slot="dialog-title" className={cn("text-lg font-semibold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="dialog-description" className={cn("text-sm leading-relaxed text-neutral-500 dark:text-neutral-400", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse gap-2 border-t border-neutral-200/80 pt-4 dark:border-neutral-800 sm:flex-row sm:justify-end", className)} {...props} />;
}
