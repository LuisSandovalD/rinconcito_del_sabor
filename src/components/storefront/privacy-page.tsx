"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/client-api";
import { LegalShell } from "@/components/storefront/legal-shell";
import { PRIVACY_SECTIONS, PrivacyContent } from "@/components/storefront/privacy-content";
import type { StorefrontMenu } from "@/components/storefront/types";

export function PrivacyPage() {
  const { data: menuData } = useQuery({
    queryKey: ["public-menu"],
    queryFn: () => api<StorefrontMenu>("/api/public/menu"),
  });

  const restaurantName = menuData?.settings?.tradeName ?? "Rinconcito del Sabor";

  return (
    <LegalShell
      activeTab="privacidad"
      title="Política de Privacidad y Protección de Datos"
      subtitle={`En ${restaurantName} protegemos tus datos personales conforme a la Ley N° 29733 de la República del Perú.`}
      sections={PRIVACY_SECTIONS}
    >
      <PrivacyContent restaurantName={restaurantName} />
    </LegalShell>
  );
}
