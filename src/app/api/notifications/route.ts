import { handleApiError, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try { const user = await requireUser(); return ok(await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 20 })); }
  catch (error) { return handleApiError(error); }
}
