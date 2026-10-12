import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Skeleton } from "@/components/ui";

export default function StaffResetPasswordPage() {
  return <AuthShell><Suspense fallback={<Skeleton className="mt-6 h-80 w-full rounded-xl" />}><ResetPasswordForm /></Suspense></AuthShell>;
}
