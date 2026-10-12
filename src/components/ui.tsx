import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge as ShadcnBadge } from "@/components/ui/badge";

export { Button, Input, Skeleton };
export { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
export { Label } from "@/components/ui/label";
export { NativeSelect } from "@/components/ui/native-select";
export { Separator } from "@/components/ui/separator";
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export { Textarea } from "@/components/ui/textarea";
export { Pagination } from "@/components/ui/pagination";
export { MiniStat, StatCard } from "@/components/ui/stat-card";

const toneVariant = {
  neutral: "secondary",
  success: "success",
  warning: "warning",
  danger: "destructive",
  info: "info",
  purple: "outline"
} as const;

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" | "purple"; className?: string }) {
  return <ShadcnBadge variant={toneVariant[tone]} className={className}>{children}</ShadcnBadge>;
}

export function EmptyState({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) {
  return (
    <div data-slot="empty-state" className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-6 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{icon}</div>
      <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500 dark:text-neutral-400">{detail}</p>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <header data-slot="page-header" className="flex flex-col gap-3 border-b border-neutral-200 pb-3 dark:border-neutral-800 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">{eyebrow}</p>}
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-5 text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
