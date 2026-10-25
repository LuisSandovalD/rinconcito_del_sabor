import type { Metadata } from "next";
import { TermsPage } from "@/components/storefront/terms-page";

export const metadata: Metadata = {
  title: "Términos y Condiciones | Rinconcito del Sabor",
  description:
    "Conoce los términos y condiciones de compra, pedidos desde tu mesa, recojo y delivery en Rinconcito del Sabor. Cocina marina en Lima, Perú.",
  openGraph: {
    title: "Términos y Condiciones | Rinconcito del Sabor",
    description:
      "Términos del servicio de comensal, pedidos y delivery de Rinconcito del Sabor conforme a la normativa peruana.",
    type: "website",
  },
};

export default function TermsRoute() {
  return <TermsPage />;
}
