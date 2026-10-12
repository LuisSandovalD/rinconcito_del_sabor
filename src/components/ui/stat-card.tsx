import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  detail?: string;
  progress?: number;
  warning?: boolean;
  prominent?: boolean;
  truncate?: boolean;
};

export function StatCard({ label, value, icon, detail, progress, warning = false, prominent = false, truncate = false }: StatCardProps) {
  return (
    <article className="rounded-xl border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2 text-neutral-400">
        <div className="flex items-center gap-2">{icon}<span className="text-[10px] font-medium uppercase tracking-[0.12em]">{label}</span></div>
        {warning && <AlertTriangle size={14} />}
      </div>
      <strong className={cn("mt-1 block font-semibold text-neutral-900 dark:text-white", prominent ? "text-xl" : "text-lg", truncate && "truncate")}>{value}</strong>
      {detail && <span className="mt-1 block text-xs text-neutral-400">{detail}</span>}
      {progress !== undefined && <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-neutral-500 dark:bg-neutral-400" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} /></div>}
    </article>
  );
}

export function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"><span className="text-neutral-500 dark:text-neutral-400">{label}</span><strong className="font-semibold text-neutral-900 dark:text-white">{value}</strong></div>;
}
