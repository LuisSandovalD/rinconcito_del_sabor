"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  FileText,
  MessageCircle,
  Phone,
  Printer,
  Scale,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { StorefrontFooter, StorefrontHeader } from "@/components/storefront/storefront-nav";
import type { StorefrontMenu, StorefrontUser } from "@/components/storefront/types";

export type LegalSectionItem = {
  id: string;
  title: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
};

type LegalShellProps = {
  activeTab: "terminos" | "privacidad";
  title: string;
  subtitle: string;
  sections: LegalSectionItem[];
  children: React.ReactNode;
};

export function LegalShell({
  activeTab,
  title,
  subtitle,
  sections,
  children,
}: LegalShellProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? "");
  const [cartCount, setCartCount] = useState(0);
  const [copied, setCopied] = useState(false);

  // Sync cart counter from session storage
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = sessionStorage.getItem("storefront-cart");
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, { quantity: number }>;
          const count = Object.values(parsed).reduce((sum, item) => sum + (item.quantity || 0), 0);
          setCartCount(count);
        }
      } catch {
        // Ignore parsing errors
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Intersection observer to highlight current reading section in sidebar
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-120px 0px -60% 0px",
        threshold: 0,
      }
    );

    sections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  // Load restaurant settings and customer session
  const { data: menuData } = useQuery({
    queryKey: ["public-menu"],
    queryFn: () => api<StorefrontMenu>("/api/public/menu"),
  });

  const { data: user } = useQuery({
    queryKey: ["customer-session"],
    queryFn: () => api<StorefrontUser | null>("/api/customer-auth/session"),
  });

  const settings = menuData?.settings;
  const restaurantName = settings?.tradeName ?? "Rinconcito del Sabor";
  const whatsappNumber = settings?.phone?.replace(/\D/g, "");
  const whatsappUrl =
    whatsappNumber && whatsappNumber.length >= 9
      ? `https://wa.me/${whatsappNumber.startsWith("51") ? whatsappNumber : `51${whatsappNumber}`}`
      : undefined;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="min-h-dvh overflow-x-clip bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      {/* Global Header */}
      <div className="print:hidden">
        <StorefrontHeader
          name={restaurantName}
          logoUrl={settings?.logoUrl}
          cartCount={cartCount}
          user={user}
          onCartOpen={() => router.push("/#carta")}
        />
      </div>

      {/* Hero Banner with Breadcrumbs & Document Switcher */}
      <section className="relative isolate border-b border-neutral-200 bg-neutral-50/70 pt-28 pb-12 sm:pt-32 sm:pb-16 dark:border-neutral-800 dark:bg-neutral-950/90 print:bg-transparent print:pt-6 print:pb-4">
        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
          {/* Breadcrumbs */}
          <nav
            aria-label="Migas de pan"
            className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 print:hidden"
          >
            <Link
              href="/"
              className="transition-colors hover:text-neutral-900 dark:hover:text-white"
            >
              Inicio
            </Link>
            <ChevronRight size={13} className="opacity-50" />
            <span className="text-neutral-400 dark:text-neutral-500">Legal</span>
            <ChevronRight size={13} className="opacity-50" />
            <span className="font-medium text-neutral-800 dark:text-neutral-200">
              {activeTab === "terminos" ? "Términos y condiciones" : "Política de privacidad"}
            </span>
          </nav>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 print:border-none print:p-0">
                {activeTab === "terminos" ? <Scale size={12} /> : <ShieldCheck size={12} />}
                Información Legal · República del Perú
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-base">
                {subtitle}
              </p>

              {/* Metadata Info Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Vigente desde 2026
                </span>
                <span className="hidden sm:inline">·</span>
                <span>Última revisión: Octubre 2026</span>
                <span className="hidden sm:inline">·</span>
                <span>{restaurantName}</span>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex shrink-0 items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                title="Copiar enlace"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? "Copiado" : "Copiar"}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                title="Imprimir documento"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>

              <Link
                href="/#carta"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-xs font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
              >
                <UtensilsCrossed size={14} />
                <span>Ver la carta</span>
              </Link>
            </div>
          </div>

          {/* Legal Pages Tab Switcher */}
          <div className="mt-8 flex border-b border-neutral-200 dark:border-neutral-800 print:hidden">
            <Link
              href="/terminos"
              className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "terminos"
                  ? "border-neutral-900 text-neutral-950 dark:border-white dark:text-white"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              <FileText size={16} />
              Términos y condiciones
            </Link>

            <Link
              href="/privacidad"
              className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === "privacidad"
                  ? "border-neutral-900 text-neutral-950 dark:border-white dark:text-white"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              <ShieldCheck size={16} />
              Política de privacidad
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16">
          {/* Left Column: Sticky Sidebar on Desktop */}
          <aside className="print:hidden">
            <div className="sticky top-24 space-y-6">
              {/* Navigation Index */}
              <div className="rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-neutral-400 dark:text-neutral-500">
                  Índice del documento
                </p>
                <nav
                  aria-label="Índice de secciones"
                  className="mt-4 flex max-h-[50vh] flex-col gap-1 overflow-y-auto pr-1 text-xs [scrollbar-width:thin]"
                >
                  {sections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    const Icon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                          isActive
                            ? "bg-neutral-900 font-semibold text-white dark:bg-white dark:text-neutral-900"
                            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                        }`}
                      >
                        {Icon && <Icon size={14} className="shrink-0" />}
                        <span className="truncate">{sec.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Help & Contact Card */}
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 dark:border-neutral-800 dark:bg-neutral-900/60">
                <h4 className="text-sm font-semibold text-neutral-950 dark:text-white">
                  ¿Preguntas sobre nuestras políticas?
                </h4>
                <p className="mt-2 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
                  Nuestro equipo de atención al cliente está a tu disposición para ayudarte con cualquier consulta legal, de comensal o pedidos.
                </p>

                <div className="mt-4 space-y-2">
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-900 transition hover:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:border-neutral-500"
                    >
                      <MessageCircle size={14} />
                      WhatsApp de atención
                      <ArrowUpRight size={12} />
                    </a>
                  )}

                  {settings?.phone && (
                    <a
                      href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`}
                      className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <Phone size={14} />
                      {settings.phone}
                    </a>
                  )}
                </div>

                <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                  >
                    <ArrowLeft size={13} />
                    Volver a la página principal
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Column: Main Text Content */}
          <div className="min-w-0 max-w-4xl print:max-w-none">
            {children}

            {/* End of Document Confirmation */}
            <div className="mt-16 rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center dark:border-neutral-800 dark:bg-neutral-900/40 print:hidden">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                {activeTab === "terminos"
                  ? "¿Listo para disfrutar de la mejor cocina marina?"
                  : "Tu información siempre está resguardada con nosotros."}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/#carta"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-5 text-xs font-medium text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Explorar la carta
                  <ArrowRight size={13} />
                </Link>
                <Link
                  href={activeTab === "terminos" ? "/privacidad" : "/terminos"}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {activeTab === "terminos"
                    ? "Ver Política de privacidad"
                    : "Ver Términos y condiciones"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Footer */}
      <div className="print:hidden">
        <StorefrontFooter
          name={restaurantName}
          address={settings?.address ?? ""}
          phone={settings?.phone ?? ""}
        />
      </div>
    </main>
  );
}

function ArrowRight({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
