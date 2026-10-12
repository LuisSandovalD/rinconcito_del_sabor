import { redirect } from "next/navigation";
import { PhysicalQrPage } from "@/components/settings/physical-qr-page";
import { getCurrentUser } from "@/lib/auth";

export default async function PhysicalQrSettingsPage() {
  const user = await getCurrentUser();
  if (!user?.permissions.includes("settings.manage")) redirect("/settings");
  return <PhysicalQrPage />;
}
