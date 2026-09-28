import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordAudit } from "@/services/audit.service";
const schema = z.object({ status: z.enum(["ACTIVE", "DISABLED", "LOCKED"]) });
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { const actor = await requirePermission("users.disable"); const input = schema.parse(await readJson(request)); const { id } = await context.params; const before = await db.user.findUniqueOrThrow({ where: { id } }); const user = await db.$transaction(async tx => { const row = await tx.user.update({ where: { id }, data: { status: input.status } }); if (input.status !== "ACTIVE") await tx.session.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } }); await recordAudit(tx, { userId: actor.id, action: "USER_STATUS_CHANGED", module: "users", entity: "User", entityId: id, before: { status: before.status }, after: { status: row.status } }); return row; }); return ok({ id: user.id, status: user.status }); } catch (error) { return handleApiError(error); } }
