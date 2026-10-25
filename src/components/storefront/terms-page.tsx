"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { LegalShell } from "@/components/storefront/legal-shell";
import { TERMS_SECTIONS, TermsContent } from "@/components/storefront/terms-content";
import type { StorefrontMenu } from "@/components/storefront/types";

export function TermsPage() {
  const { data: menuData } = useQuery({
    queryKey: ["public-menu"],
    queryFn: () => api<StorefrontMenu>("/api/public/menu"),
  });

  const restaurantName = menuData?.settings?.tradeName ?? "Rinconcito del Sabor";

  return (
    <LegalShell
      activeTab="terminos"
      title="Términos y Condiciones del Servicio"
      subtitle={`Conoce las normas y condiciones aplicables a nuestros servicios presenciales en salón, recojo para llevar y delivery en ${restaurantName}.`}
      sections={TERMS_SECTIONS}
    >
      <TermsContent restaurantName={restaurantName} />
    </LegalShell>
  );
}
