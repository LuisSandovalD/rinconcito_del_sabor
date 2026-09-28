import { z } from "zod";
import { handleApiError, ok, readJson } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishRealtimeEvent } from "@/lib/realtime";
import { recordAudit } from "@/services/audit.service";
const schema = z.object({ status: z.enum(["PENDING", "CONFIRMED", "ARRIVED", "CANCELLED", "NO_SHOW"]) });
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) { try { const user = await requirePermission("reservations.manage"); const input = schema.parse(await readJson(request)); const { id } = await context.params; const result = await db.$transaction(async tx => { const before = await tx.reservation.findUniqueOrThrow({ where: { id } }); const row = await tx.reservation.update({ where: { id }, data: input }); if (before.tableId && ["CANCELLED", "NO_SHOW"].includes(input.status)) await tx.restaurantTable.updateMany({ where: { id: before.tableId, status: "RESERVED" }, data: { status: "FREE" } }); await recordAudit(tx, { userId: user.id, action: `RESERVATION_${input.status}`, module: "reservations", entity: "Reservation", entityId: id, before: { status: before.status }, after: { status: input.status } }); return row; }); await publishRealtimeEvent({ resource: "reservations", action: "status_changed", id }); await publishRealtimeEvent({ resource: "tables", action: "updated" }); return ok(result); } catch (error) { return handleApiError(error); } }
