import type { Metadata } from "next";
import { PrivacyPage } from "@/components/storefront/privacy-page";

export const metadata: Metadata = {
  title: "Política de Privacidad | Rinconcito del Sabor",
  description:
    "Política de privacidad y protección de datos personales de Rinconcito del Sabor en cumplimiento de la Ley N° 29733 de la República del Perú.",
  openGraph: {
    title: "Política de Privacidad | Rinconcito del Sabor",
    description:
      "Compromiso de protección de datos personales, derechos ARCO y confidencialidad en Rinconcito del Sabor.",
    type: "website",
  },
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
