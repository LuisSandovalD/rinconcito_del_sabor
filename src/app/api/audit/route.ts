import { handleApiError, ok } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try { await requirePermission("audit.view"); return ok(await db.auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 })); }
  catch (error) { return handleApiError(error); }
}
