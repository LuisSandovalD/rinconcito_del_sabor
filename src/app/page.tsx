import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export default async function HomePage() { const user = await getCurrentUser(); if (!user) redirect("/login" as never); const role = user.roles[0]; redirect((role === "MESERO" ? "/tables" : role === "COCINA" ? "/kitchen" : role === "CAJERO" ? "/cash" : "/dashboard") as never); }
