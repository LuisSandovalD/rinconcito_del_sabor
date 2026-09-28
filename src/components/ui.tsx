import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", loading, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean }) {
  return <button className={cn("button", `button-${variant}`, className)} disabled={loading || props.disabled} {...props}>{loading && <LoaderCircle size={17} className="animate-spin" />}{children}</button>;
}
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) { return <input ref={ref} className={cn("input", className)} {...props} />; });
export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "purple"; className?: string }) { return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>; }
export function Skeleton({ className }: { className?: string }) { return <div className={cn("skeleton", className)} />; }
export function EmptyState({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) { return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{detail}</p></div>; }
export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) { return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</header>; }
