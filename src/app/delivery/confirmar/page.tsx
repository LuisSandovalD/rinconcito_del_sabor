import type { Metadata } from "next";
import { DeliveryConsentPage } from "@/components/storefront/delivery-consent-page";

export const metadata: Metadata = {
  title: "Confirmar delivery | Rinconcito del Sabor",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <DeliveryConsentPage />;
}
