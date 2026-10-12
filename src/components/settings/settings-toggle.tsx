export function SettingsToggle({ icon, title, detail, checked, onChange }: { icon: React.ReactNode; title: string; detail: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
      <span className="shrink-0 text-neutral-400">{icon}</span>
      <span className="min-w-0 flex-1"><strong className="block text-sm font-medium text-neutral-900 dark:text-white">{title}</strong><span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">{detail}</span></span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-neutral-900 dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform dark:bg-neutral-950 ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} /></span>
    </button>
  );
}
